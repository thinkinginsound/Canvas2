const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");

async function initAIProcess(){

}

async function onClock(clock){
  console.log("AIProcess onClock", clock)
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
