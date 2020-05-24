const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");
const NPC = require("./npcAI/boidNPC").boidNPC;

const namebuilder = require("./namebuilder/builder.js").namebuilder;
const players = {}
let frameCount = -1;

/**
	@description Initieer de timer.
*/
async function initTimer(){
  frameCount = await db.getHighestClock();
  await db.disableUserGames();
  await initNPCs();
  setInterval(async () => {
	  process.send({type:"onClock", payload:frameCount});
    npcMove();
    broadcast("clock",frameCount);
    frameCount++;
    // if(clockCounter>=Math.pow(2,32))clockCounter=0;

  }, settings.clockspeed);
}

/**
	@description Initeer de NPCs. Zet deze in de variabele 'players', en schrijf weg naar de database.
*/
async function initNPCs(){
  for(let groupIndex = 0; groupIndex < settings.maxgroups; groupIndex++){
    for(let playerIndex = 0; playerIndex < settings.maxusers; playerIndex++){
      let index = (playerIndex + (settings.maxgroups * groupIndex))
      let username = await namebuilder();
      players[`npc_${index}`] = new NPC(
        settings.canvaswidth,
        settings.canvasheight,
        Math.floor(Math.random() * settings.canvaswidth),
        Math.floor(Math.random() * settings.canvasheight),
        `npc_${index}`,
        username
      );
      await db.insertNPCGame(`npc_${index}`, username, groupIndex, playerIndex);
    }
  }
}

/**
	@description Beweeg alle NPCs die niet vervangen worden door echte users.
*/
async function npcMove(){
  const now = performance.now();
  let activeNPCs = await db.getActiveNPCs();
  let npcStates = await db.getNPCs();

  let sortedNPCs = [];
  for (let npc of npcStates) {
    if (!sortedNPCs[npc.group_id]) sortedNPCs[npc.group_id] = []
    sortedNPCs[npc.group_id][npc.group_order] = players[npc.session_key];
  };

  activeNPCs.forEach(async (itm)=>{
    setTimeout(()=>{
      players[itm.session_key].move(sortedNPCs[itm.group_id]);
      let sendable = players[itm.session_key].save(itm.group_id, itm.group_order);
      sendable.frame_number = frameCount;
      broadcast("drawpixel",sendable)
      db.insertNPCData(sendable);
    }, Math.random()*settings.clockspeed)
  })
  if (settings.benchmark) console.log("Benchmark TIMER#npcMove: ", performance.now() - now);
}

/**
	@description Zend data naar de broker
  @param {string} id ID van het bericht
  @param {object} payload Data die wordt meegestuurd
*/
function broadcast (id, payload) {
	process.send({type:"broadcast", id:id, payload:payload});
}
/**
	@description Ontvang data vanuit de broker
*/
process.on('message', (msg)=>{
	if (msg.type == "initTimer") initTimer();
})


module.exports = {
  initTimer : initTimer
}
