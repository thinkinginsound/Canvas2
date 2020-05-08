/*
Purpose: The UIHandler class contains all functions used to set up and adapt the user interface.

Functions:
*/

class UIHandler {
  constructor(){
    this.colorlist = ["#c10000", "#ff9900", "#009600", "#0058ff", "#ffff00", "#ff00ff", "#00ffff"]; // List of usable colors
    this.bgcolor = "#000";
    this.currentDrawPercentage = 0;
  }
  fillUI(){
    // Create distribution views
    let pixeldistributionView = $(".sidebar#sidebar_right #pixeldistribution");
    pixeldistributionView.empty()
    pixeldistributionView.append($(`
      <dt>Free</dt>
      <dd id="pixeldistribution_0">0 pixels</dd>
    `));
    for(let i = 0; i < window.state.server.maxgroups; i++){
      pixeldistributionView.append($(`
        <dt style="color:${this.colorlist[i]}">Group ${i+1}</dt>
        <dd id="pixeldistribution_${i+1}">0 pixels</dd>
      `));
    }

    // Create Player views
    let userlistView = $(".sidebar#sidebar_left #userlist");
    userlistView.empty()
    for(let i = 0; i < window.state.server.maxgroups; i++){
      for(let j = 0; j < window.state.server.maxusers; j++){
        let userindex = i*window.state.server.maxgroups + j + 1
        userlistView.append($(`
          <dd id="userlist_${userindex}" style="color:${this.colorlist[i]}">Player ${userindex}</dd>
        `));
      }
    }
    $(".sidebar#sidebar_left #userlist .active").removeClass("active");
    let userindex = window.state.server.groupid * window.state.server.maxgroups + window.state.server.userid + 1;
    $(`.sidebar#sidebar_left #userlist #userlist_${userindex}`).addClass("active");

    // Init end-of-game timer
    let gametimer = $(`.sidebar#sidebar_right #gametimer #time`)
    setInterval(function () {
      let currentTime = Date.now() - window.state.server.sessionstarted;
      let remainingTime = window.state.server.sessionduration - currentTime;
      remainingTime /= 1000;

      if (remainingTime < 0) remainingTime = 0;

      let minutes = parseInt(remainingTime / 60, 10);
      let seconds = parseInt(remainingTime % 60, 10);
      minutes = minutes < 10 ?  + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      gametimer.text(minutes + ":" + seconds);
    }, 1000);

    // Init drawpercentagebar timer
    setInterval(()=>{
      this.currentDrawPercentage += 10;
      if(!window.state.session.serverarmed){
        document.getElementById('drawPercentage').style.width = `${this.currentDrawPercentage}%`;
      } else {
        document.getElementById('drawPercentage').style.width = `100%`;
      }
    }, (window.state.server.clockspeed/10));
  }
  bindKeyListener(){
    document.addEventListener('keyup', (event) => {
      if(!window.state.server.ready){return 0;}
      const keyName = event.key;
      let xOffset = window.state.session.currentXPos - window.state.session.lastPixelPos[0];
      let yOffset = window.state.session.currentYPos - window.state.session.lastPixelPos[1];
      if (keyName === 'ArrowRight') {
        if(xOffset < 1 && window.state.session.currentXPos < window.state.server.maxPixelsWidth - 1){
          window.state.session.currentXPos += 1;
        }
      }
      else if (keyName === 'ArrowLeft') {
        if(xOffset > -1 && window.state.session.currentXPos>0){
          window.state.session.currentXPos -= 1;
        }
      }
      else if (keyName === 'ArrowUp') {
        if(yOffset > -1 && window.state.session.currentYPos>0){
          window.state.session.currentYPos -= 1;
        }
      }
      else if (keyName === 'ArrowDown') {
        if(yOffset < 1 && window.state.session.currentYPos < window.state.server.maxPixelsHeight - 1){
          window.state.session.currentYPos += 1;
        }
      }
      else if (keyName === ' ')  {
        if(window.state.session.serverarmed){
          window.state.session.pixelArray[window.state.session.currentXPos][window.state.session.currentYPos].setGroup(window.state.server.groupid);
          this.sendPixel();
          window.state.session.lastPixelPos[0] = window.state.session.currentXPos;
          window.state.session.lastPixelPos[1] = window.state.session.currentYPos;
          window.state.session.serverarmed = false;
        }
      }
    });
  }
  sendPixel(){
    var rad = Math.atan2(window.state.session.lastPixelPos[1] - window.state.session.currentYPos, window.state.session.currentXPos - window.state.session.lastPixelPos[0]);
    var deg = rad * (180 / Math.PI);
    let sendable = {
      mouseX:window.state.session.currentXPos,
      mouseY:window.state.session.currentYPos,
      degrees:deg,
      clock:window.state.session.clock,
    }
    if(window.state.server.ready)window.socketHandler.emit('drawpixel', sendable);
    else console.error("Socket undefined")
  }
  onClock(){
    window.uiHandler.currentDrawPercentage = 0;
    this.calcPixelDistribution();
  }
  updateUserGroup(){
    $(".sidebar#sidebar_left #userlist .active").removeClass("active");
    let userindex = window.state.server.groupid * window.state.server.maxgroups + window.state.server.userid + 1;
    $(`.sidebar#sidebar_left #userlist #userlist_${userindex}`).addClass("active");
    if(typeof window.audioclass != "undefined"){
      window.audioclass.setGroupID(window.state.server.groupid);
    }
  }
  calcPixelDistribution(){
    let distribution = new Array(window.state.server.maxgroups+1).fill(0);
    let maxPixels = window.state.server.maxPixelsWidth*window.state.server.maxPixelsHeight;
    for(let col of window.state.session.pixelArray){
      for(let row of col){
        distribution[row.group+1]++;
      }
    }
    for(let groupindex in distribution){
      let value = distribution[groupindex];
      let percentage = (value/maxPixels*100).toFixed(2);;
      $(".sidebar#sidebar_right #pixeldistribution #pixeldistribution_"+groupindex)
        .text(`${value} pixels, ${percentage}%`)
    }
  }
}

export { UIHandler };
