const settings = require('../settings');

const db = require("../db");
const slowAnalysis = require("./slowAnalysis");
const analysisTool = require("./analysisTool");

/*
  Deze class is om makkelijk uit een object één enkele value te krijgen. In dit
  geval is dat 'angle'. Dit gebeurd door middel van een valueOf function, die
  automatisch wordt aangeroepen als er een +-/* actie wordt uitgevoerd.
*/
class Wrapper {
	constructor (obj) {
    this.obj = obj;
		this.x = this.obj.user_loc_x || 0;
		this.y = this.obj.user_loc_y || 0;
  }

  valueOf () {
    return this.obj.angle;
  }
}

/**
  @typedef UserAngles
  @type {number[]}
*/

/**
  @typedef FramesList
  @type {UserAngles[]}
*/

/**
	@typedef GroupFrames
  @type {FramesList[]}
*/
let herdingResponse;

/**
	@description Functie waarin wordt berekend welke users of NPCs aan het herden zijn.
  @param {number} frameNumber Huidig frame nummer
*/
async function analyzeHerd (frameNumber) {
  /** @type {GroupFrames} */
  const AIInput = [];
  const data = await db.getFrameDataFor(frameNumber, settings.frameamount);
  data.forEach(rec => {
    let group = AIInput[rec.group_id];
    if (!group) AIInput[rec.group_id] = group = new Array(settings.frameamount).fill(-1).map(() => new Array(settings.maxusers).fill(-1).map(() => new Wrapper(
			{
				id:-1,
				angle:-1,
				group_id: rec.group_id,
				group_order: rec.group_order
			}
		)));
		let frameNum = rec.frame_number - frameNumber - 1 + settings.frameamount;
  	let frame = group[frameNum];
    if (!frame) frame = group[frameNum] = new Array(settings.maxusers).fill(-1).map(()=>new Wrapper(
			{
				id:-1,
				angle:-1,
				group_id: rec.group_id,
				group_order: rec.group_order
			}
		));
    frame[rec.group_order] = new Wrapper(rec);
  });

  const offset = settings.aiHopInterval.slow + settings.aiEvalFrames.slow;
  const updateIsHerding = [];
  const updateIsNotHerding = [];
  const AIResponse = AIInput.map((group)=>{
		let AIframes = analysisTool.findSheep(group);
    for(let userIndex = settings.maxusers - 1; userIndex >= 0; userIndex--){
			const userElement = group[group.length - 1][userIndex];
      const isHerding = AIframes[userIndex];
			if(userElement == null) continue;
			const groupIndex = userElement.obj.group_id;

      if (isHerding) updateIsHerding.push(userElement.obj)
      else updateIsNotHerding.push(userElement.obj)

      if (!herdingResponse) herdingResponse = [];
      if (!herdingResponse[groupIndex]) herdingResponse[groupIndex] = [];
      herdingResponse[groupIndex][userIndex] = (herdingResponse[groupIndex][userIndex] || 0) + (isHerding?1:0);
    }
		return AIframes;
  })

	// console.log("updateIsHerding", updateIsHerding.map((r)=>r.id));
	// console.log("updateIsNotHerding", updateIsNotHerding.map((r)=>r.id));

  if (updateIsHerding.length) await db.saveHerding(updateIsHerding, db.IS_HERDING);
  if (updateIsNotHerding.length) await db.saveHerding(updateIsNotHerding, db.IS_NOT_HERDING);
  process.send({type:"herdingUpdate", payload:AIResponse})
}

/**
	@description Check every n frames who are the users with the most herding behaviour per group. Switch these users
*/
async function groupSwitch(){
	if (!herdingResponse) return;

  let groupherdingdata = new Array(settings.maxgroups).fill(0);
  let hasHerded = false;
  herdingResponse.forEach((group,groupIndex)=>{
    let herding = 0;
    group.forEach((value) =>{
      herding+=value;
    });
    if(herding > 0) hasHerded = true;
    groupherdingdata[groupIndex] = herding;
  });

  console.log("groupherdingdata", groupherdingdata)
  if(hasHerded){
    let maxherdingindexes = findIndicesOfMax(groupherdingdata, 2);
		let herder1_groupId = maxherdingindexes[0];
		let herder2_groupId = maxherdingindexes[1];
    let herder1_groupOrder = findKeysOfMax(herdingResponse[herder1_groupId], 1)[0];
    let herder2_groupOrder = findKeysOfMax(herdingResponse[herder2_groupId], 1)[0];

		let herder1 = await db.getUserByIndexes(herder1_groupId, herder1_groupOrder);
		let herder2 = await db.getUserByIndexes(herder2_groupId, herder2_groupOrder);

		await db.updateUserGameIndexes(herder1.session_key, herder2.group_id, herder2.group_order);
		await db.updateUserGameIndexes(herder2.session_key, herder1.group_id, herder1.group_order);


		let herdupdate = {};
		herdupdate[herder1.session_key] = {
			session_key: herder1.session_key,
			group_id: herder2.group_id,
			group_order: herder2.group_order,
			name_index: herder2.group_id * settings.maxusers + herder2.group_order,
			name: herder1.username
		};
		herdupdate[herder2.session_key] = {
			session_key:herder2.session_key,
			group_id:herder1.group_id,
			group_order:herder1.group_order,
			name_index: herder1.group_id * settings.maxusers + herder1.group_order,
			name: herder2.username

		};
		process.send({type:"groupupdate", payload:herdupdate})
		process.send({type:"userNamesList", payload:await db.getNames()})
  }

  herdingResponse = undefined;
}

// Oude analyzeHerd functie
async function analyzeHerdOld(){
  let AIresponse = tools.createArray(global.maxgroups, global.maxusers,0);
  global.herdingQueue.forEach((group,groupIndex) => {
    global.herdingQueue[groupIndex].shift();
    global.herdingQueue[groupIndex].push(new Array(global.maxusers).fill(-1));
    //Do calucation and prediction
    let AIframes = [];
    if(runmode=="debug"){
      AIframes = global.ML.prediction(global.herdingQueue[groupIndex],model);
    } else {
      AIframes= slowAnalysis.createLabels(global.herdingQueue[groupIndex],8,2);
    }

    //Writing predictions to AIresponse (2D array)
    let offset = global.aiHopInterval + global.aiEvalFrames;
    for(let userIndex = 0; userIndex < global.maxusers; userIndex++){
      let lastIndex = AIframes.length-1;
      let firstIndex = AIframes.length-1-offset;
      let isHerding =
        AIframes[lastIndex][userIndex] &&
        AIframes[firstIndex][userIndex];
      let sessionKey = players[groupIndex][userIndex].sessionID;
      dbHandler.updateUserdataHerding(sessionKey, global.clockCounter, isHerding);
      AIresponse[groupIndex][userIndex] = isHerding;
      global.herdingResponse[groupIndex][userIndex] += isHerding?1:0;
    }
  });
  io.sockets.emit("herdingStatus",AIresponse);
}

/**
	@description Functie die de index van de hoogste twee waardes terug geeft.
  @param {number[]} inp Array om in te zoeken
  @param {number} count Hoeveel indexes hij terug moet geven
  @return {number[]}
*/
function findIndicesOfMax(inp, count) {
  var outp = new Array();
  for (var i = 0; i < inp.length; i++) {
    outp.push(i);
    if (outp.length > count) {
      outp.sort(function(a, b) { return inp[b] - inp[a]; });
      outp.pop();
    }
  }
  return outp;
}
/**
	@description Functie die de key van de hoogste twee waardes terug geeft.
  @param {number[]} inp Array om in te zoeken
  @param {number} count Hoeveel keys hij terug moet geven
  @return {number[]}
*/
function findKeysOfMax(inp, count) {
  keysSorted = Object.keys(inp).sort(function(a,b){return inp[b]-inp[a]})
  return keysSorted.slice(0, count);
}

module.exports = {
    analyzeHerd : analyzeHerd,
		groupSwitch: groupSwitch
}
