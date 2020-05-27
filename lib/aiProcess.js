const { performance } = require('perf_hooks');

const settings = require('./settings');
const db = require("./db");

const { analyzeHerd, groupSwitch } = require("./ai/aiFunctions");

/**
	@description Functie waarin wordt berekend welke users of NPCs aan het herden zijn.
  @param {number} frameNumber Huidig frame nummer
*/
async function initAIProcess(){

}

/**
	@description Functie die reageert op de clock. In deze functie word ieder frame de functie analyzeHerd aangeroepen. Daarbij wordt om de 20 frames groupSwitch uitgevoerd.
  @param {number} clockCounter Huidig frame nummer
*/
async function onClock(clockCounter){
  console.log("AIProcess onClock", clockCounter);
  await analyzeHerd(clockCounter);
  if(clockCounter%settings.groupSwitchFrames==1){
    await groupSwitch();
  }
}

/**
	@description Hier komt alle data van de broker binnen.
*/
process.on('message', (msg)=>{
	if (msg.type == "initAIProcess") initAIProcess();
  else if (msg.type == "onClock") onClock(msg.payload);
})


module.exports = {
  initAIProcess : initAIProcess
}
