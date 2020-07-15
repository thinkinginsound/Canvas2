/**
 @module timerProcess
 @description
 Process that handles the clock
*/

const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");
const NPC = require("./npcAI/boidNPC").boidNPC;

const namebuilder = require("./namebuilder/builder.js").namebuilder;
const players = {}
let frameCount = -1;

/**
	@description Initalizes the timer.
*/
async function initTimer(){
  frameCount = await db.getHighestClock();
  await db.disableUserGames();
  await initNPCs();
  setInterval(async () => {
	  process.send({type:"onClock", payload:frameCount});
    npcMove();
    broadcast("clock",frameCount);
    if (frameCount%16384 == 0) db.truncateTable("user_data")
    frameCount++;

  }, settings.clockspeed);
}

/**
	@description Initializes the NPCs. These are stored in variable 'players', and stored in the database as sessions.
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
	@description Moves all NPCs that are not being replaced by users.
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
	@description Sends data to the broker
  @param {string} id ID van het bericht
  @param {object} payload Data die wordt meegestuurd
*/
function broadcast (id, payload) {
	process.send({type:"broadcast", id:id, payload:payload});
}
/**
  @function TimerProcessOn
	@description Receives data from the broker
*/
process.on('message', (msg)=>{
	if (msg.type == "initTimer") initTimer();
})


module.exports = {
  initTimer : initTimer
}
