const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");

const { analyzeHerd, groupSwitch } = require("./ai/aiFunctions");

async function initAIProcess(){

}

async function onClock(clockCounter){
  console.log("AIProcess onClock", clockCounter);
  await analyzeHerd(clockCounter);
  if(clockCounter%20==1){
    await groupSwitch();
  }
}

function broadcast (id, payload) {
	process.send({type:"broadcast", id:id, payload:payload});
}
process.on('message', (msg)=>{
	if (msg.type == "initAIProcess") initAIProcess();
  else if (msg.type == "onClock") onClock(msg.payload);
})


module.exports = {
  initAIProcess : initAIProcess
}
