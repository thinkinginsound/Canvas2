const settings = require('../settings');

const db = require("../db");
const slowAnalysis = require("./slowAnalysis");

class Wrapper {
	constructor (obj) {
    this.obj = obj;
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

async function analyzeHerd (frameNumber) {
  /**
    @type {GroupFrames}
  */
  const AIInput = [];
  const data = await db.getFrameDataFor(frameNumber, settings.frameamount);
  data.forEach(rec => {
    let group = AIInput[group_id];
    if (!group) AIInput[group_id] = group = [];
    let frameNum = frameNumber - rec.frame_number + settings.frameamount;
  	let frame = group[frameNum];
    if (!frame) frame = group[frameNum] = new Array(settings.maxusers).fill(-1);
    frame[rec.group_order] = new Wrapper(rec);
  });

  const offset = settings.aiHopInterval.slow + settings.aiEvalFrames.slow;
  const updateIsHerding = [];
  const updateIsNotHerding = [];
  const AIResponse = AIInput.map((group)=>{
    let AIframes = slowAnalysis.createLabels(group,8,2);
    for(let userIndex = settings.maxusers; userIndex > 0; userIndex--){
      const lastIndex = settings.frameamount-1;
      const firstIndex = lastIndex-offset;
      const isHerding = AIframes[lastIndex][userIndex] && AIframes[firstIndex][userIndex];
      const sessionKey = group[0][userIndex].obj.session_key;

      if (isHerding) updateIsHerding.push(group[0][userIndex].obj)
      else updateIsNotHerding.push(group[0][userIndex].obj)

      if (!herdingResponse) herdingResponse = [];
      if (!herdingResponse[groupIndex]) herdingResponse[groupIndex] = [];
      herdingResponse[groupIndex][userIndex] = (herdingResponse[groupIndex][userIndex] || 0) + (isHerding?1:0);

      // En de rest
    }
  })
  if (updateIsHerding.length) await db.saveHerding(updateIsHerding, db.IS_HERDING);
  if (updateIsNotHerding.length) await db.saveHerding(updateIsNotHerding, db.IS_NOT_HERDING);
  process.send({type:"herdingUpdate"})
}

async function groupSwitch(){
  // Check every half minute who are the users with the most herding behaviour per group. Switch these users
  // let clockOffset = global.clockCounter-60 + 1;
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

  // [
  //   [u1 ,u2 ,b3, b4],
  //   [b5 ,u6 ,b7, n8],
  //   [b9 ,u10,b11,n12],
  //   [u13,b14,n15,n16],
  // ]

  console.log("global.herdingResponse", herdingResponse)
  console.log("groupherdingdata", groupherdingdata)
  if(hasHerded){
    let maxherdingindexes = tools.findIndicesOfMax(groupherdingdata, 2);
    let herderid1_index = tools.findKeysOfMax(herdingResponse[maxherdingindexes[0]], 1)[0];
    let herderid2_index = tools.findKeysOfMax(herdingResponse[maxherdingindexes[1]], 1)[0];
    let herderid1 = players[maxherdingindexes[0]][herderid1_index].sessionID;
    let herderid2 = players[maxherdingindexes[1]][herderid2_index].sessionID;
    console.log("herderid1", herderid1_index, herderid1)
    console.log("herderid2", herderid2_index, herderid2)
    dbHandler.updateSession(herderid1, {groupid:maxherdingindexes[1]});
    dbHandler.updateSession(herderid2, {groupid:maxherdingindexes[0]});
    global.herdupdate = {};
    global.herdupdate["u1"] = {groupid:maxherdingindexes[1], userindex:herderid2_index};
    global.herdupdate["b11"] = {groupid:maxherdingindexes[0], userindex:herderid1_index};
    io.sockets.emit("groupupdate",global.herdupdate);
    logger.verbose("herders", {herderid1:herderid1, herderid2:herderid2});
    logger.verbose("maxherdingindexes", {groupherdingdata:groupherdingdata, hasHerded:hasHerded, maxherdingindexes:maxherdingindexes});
  } else {
    logger.verbose("herdupdate send", {message:"no update"});
  }
  logger.verbose("herdingdata", global.herdingResponse);

  herdingResponse = undefined;
}

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


module.exports = {
    analyzeHerd : analyzeHerd,
		npcMove: npcMove,
		groupSwitch: groupSwitch,
}
