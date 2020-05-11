const settings = require('./settings');

const db = require("./db");

async function initTimer(){
  frameCount = await db.getHighestClock()+1;
  setInterval(async () => {
	  process.send({type:"onClock", payload:frameCount});
    broadcast("clock",frameCount);
    // npcMove();
    // analyzeHerd(clockCounter);
    // if(global.clockCounter%20==1){
    //   await groupSwitch();
    // }
    frameCount++;
    // if(clockCounter>=Math.pow(2,32))clockCounter=0;

  }, settings.clockspeed);
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
