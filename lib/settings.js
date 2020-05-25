module.exports = {
  maxgroups: 4,
  maxusers: 4,
  frameamount: 8,
  canvaswidth: 30,
  canvasheight: 20,
  clockspeed: 2000,
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
  benchmark: false,
  debug: true,
  htmlDebug: false
}
