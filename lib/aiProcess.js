const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");

async function initAIProcess(){
  
}

function broadcast (id, payload) {
	process.send({type:"broadcast", id:id, payload:payload});
}
process.on('message', (msg)=>{
	if (msg.type == "initAIProcess") initAIProcess();
})


module.exports = {
  initAIProcess : initAIProcess
}
