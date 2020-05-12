const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");
const NPC = require("./npcAI/boidNPC").boidNPC;

const NbAdjectives = require("./namebuilder/adjectives.json");
const NbNouns = require("./namebuilder/nouns.json");
const usernames = [];
const players = {}

async function initTimer(){
  frameCount = await db.getHighestClock()+1;
  await initNPCs();
  setInterval(async () => {
	  process.send({type:"onClock", payload:frameCount});
    npcMove();
    broadcast("clock",frameCount);
    // analyzeHerd(clockCounter);
    // if(global.clockCounter%20==1){
    //   await groupSwitch();
    // }
    frameCount++;
    // if(clockCounter>=Math.pow(2,32))clockCounter=0;

  }, settings.clockspeed);
}

async function initNPCs(){
  for(let groupIndex = 0; groupIndex < settings.maxgroups; groupIndex++){
    for(let playerIndex = 0; playerIndex < settings.maxusers; playerIndex++){
      let index = (playerIndex + (settings.maxgroups * groupIndex))
      let username = generateUserName();
      players[`npc_${index}`] = new NPC(
        settings.canvaswidth,
        settings.canvasheight,
        Math.floor(Math.random() * settings.canvaswidth),
        Math.floor(Math.random() * settings.canvasheight),
        `npc_${index}`,
        username
      );
      await db.insertNPCGame(`npc_${index}`, groupIndex, playerIndex);
    }
  }
}

function generateUserName() {
  let adjective = NbAdjectives[Math.floor(Math.random()*(NbAdjectives.length-1))];
  let noun = NbNouns[Math.floor(Math.random()*(NbNouns.length-1))];
  let username = `${adjective} ${noun}`;

  if(usernames.indexOf(username) != -1){
    username = generateUserName();
  } else {
    usernames.push(username)
    return username;
  }
}

// Arm users every second and write last behaviour into db
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
    players[itm.session_key].move(sortedNPCs[itm.group_id]);
    let sendable = players[itm.session_key].save(itm.group_id, itm.group_order);
    sendable.frame_number = frameCount;
    broadcast("drawpixel",sendable)
    db.insertUserData(sendable);
  })
  if (settings.benchmark) console.log("Benchmark TIMER#npcMove: ", performance.now() - now);
}

function broadcast (id, payload) {
	process.send({type:"broadcast", id:id, payload:payload});
}
process.on('message', (msg)=>{
	if (msg.type == "initTimer") initTimer();
})


module.exports = {
  initTimer : initTimer
}
