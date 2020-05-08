module.exports = {
  maxgroups: 4,
  maxusers: 4,
  frameamount: 30,
  npcCanvasWidth: 40,
  npcCanvasHeight: 30,
  clockspeed: 1000,
  clockCounter: 0,
  sessionduration: 1000*60*5, // 5 minutes in ms;
  aiHopInterval: {
    ml: 2,
    slow: 2
  },
  aiEvalFrames: {
    ml: 6,
    slow: 8
  },
  benchmark: true,
  debug: true
}
