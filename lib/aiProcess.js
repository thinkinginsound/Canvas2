/**
 @module aiProcess
 @description
  Process that calculates and handles all analysis functionality
*/

const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");

const { analyzeHerd, groupSwitch } = require("./ai/aiFunctions");

/**
	@description Function that initializes all libraries after process is successfully bound
*/
async function initAIProcess(){

}

/**
	@description Function that reacts to the clock. AnalyzeHerd is called every frame, groupSwitch every 20 frames.
  @param {number} clockCounter Current frame number
*/
async function onClock(clockCounter){
  await analyzeHerd(clockCounter);
  if(clockCounter%settings.groupSwitchFrames==1){
    await groupSwitch();
  }
}

/**
  @function AIProcessOn
	@description Receives data from the broker
*/
process.on('message', (msg)=>{
	if (msg.type == "initAIProcess") initAIProcess();
  else if (msg.type == "onClock") onClock(msg.payload);
})


module.exports = {
  initAIProcess : initAIProcess
}
