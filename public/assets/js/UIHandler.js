/*
Purpose: The UIHandler class contains all functions used to set up and adapt the user interface.

Functions:
*/
import Store from "./Store.js"

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
    for(let i = 0; i < Store.get("server/maxgroups"); i++){
      pixeldistributionView.append($(`
        <dt style="color:${this.colorlist[i]}">Group ${i+1}</dt>
        <dd id="pixeldistribution_${i+1}">0 pixels</dd>
      `));
    }

    // Create Player views
    let userlistView = $(".sidebar#sidebar_left #userlist");
    userlistView.empty()
    for(let i = 0; i < Store.get("server/maxgroups"); i++){
      for(let j = 0; j < Store.get("server/maxusers"); j++){
        let userindex = i*Store.get("server/maxgroups") + j + 1
        userlistView.append($(`
          <dd id="userlist_${userindex}" style="color:${this.colorlist[i]}">Player ${userindex}</dd>
        `));
      }
    }
    $(".sidebar#sidebar_left #userlist .active").removeClass("active");
    let userindex = Store.get("session/group_id") * Store.get("server/maxgroups") + Store.get("session/group_order") + 1;
    $(`.sidebar#sidebar_left #userlist #userlist_${userindex}`).addClass("active");

    // Init end-of-game timer
    let gametimer = $(`.sidebar#sidebar_right #gametimer #time`)
    setInterval(function () {
      let currentTime = Date.now() - Store.get("server/sessionstarted");
      let remainingTime = Store.get("server/sessionduration") - currentTime;
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
      if(!Store.get("session/serverarmed")){
        document.getElementById('drawPercentage').style.width = `${this.currentDrawPercentage}%`;
      } else {
        document.getElementById('drawPercentage').style.width = `100%`;
      }
    }, (Store.get("server/clockspeed")/10));
  }
  bindKeyListener(){
    document.addEventListener('keyup', (event) => {
      if(!Store.get("server/ready")){return 0;}
      const keyName = event.key;
      let xOffset = Store.get("session/currentXPos") - Store.get("session/lastPixelPos")[0];
      let yOffset = Store.get("session/currentYPos") - Store.get("session/lastPixelPos")[1];
      if (keyName === 'ArrowRight') {
        if(xOffset < 1 && Store.get("session/currentXPos") < Store.get("server/canvaswidth") - 1){
          Store.set("session/currentXPos", Store.get("session/currentXPos") + 1);
        }
      }
      else if (keyName === 'ArrowLeft') {
        if(xOffset > -1 && Store.get("session/currentXPos")>0){
          Store.set("session/currentXPos", Store.get("session/currentXPos") - 1);
        }
      }
      else if (keyName === 'ArrowUp') {
        if(yOffset > -1 && Store.get("session/currentYPos")>0){
          Store.set("session/currentYPos", Store.get("session/currentYPos") - 1);
        }
      }
      else if (keyName === 'ArrowDown') {
        if(yOffset < 1 && Store.get("session/currentYPos") < Store.get("server/canvasheight") - 1){
          Store.set("session/currentYPos", Store.get("session/currentYPos") + 1);

        }
      }
      else if (keyName === ' ')  {
        if(Store.get("session/serverarmed")){
          Store.get("session/pixelArray")[Store.get("session/currentXPos")][Store.get("session/currentYPos")].setGroup(Store.get("session/group_id"));
          this.sendPixel();
          Store.get("session/lastPixelPos")[0] = Store.get("session/currentXPos");
          Store.get("session/lastPixelPos")[1] = Store.get("session/currentYPos");
          Store.set("session/serverarmed", false);
        }
      }
    });
  }
  sendPixel(){
    var rad = Math.atan2(Store.get("session/lastPixelPos")[1] - Store.get("session/currentYPos"), Store.get("session/currentXPos") - Store.get("session/lastPixelPos")[0]);
    var deg = rad * (180 / Math.PI);
    let sendable = {
      user_game_id:Store.get("server/sessionkey"),
      user_loc_x:Store.get("session/currentXPos"),
      user_loc_y:Store.get("session/currentYPos"),
      angle:deg,
      group_id:Store.get("session/group_id"),
      group_order:Store.get("session/group_order"),
      frame_number:Store.get("session/clock"),
    }
    if (Store.get("server/ready")) window.socketHandler.broadcast('drawpixel', sendable);
    else console.error("Socket undefined")
  }
  onClock(){
    window.uiHandler.currentDrawPercentage = 0;
    this.calcPixelDistribution();
  }
  updateUserGroup(){
  //   $(".sidebar#sidebar_left #userlist .active").removeClass("active");
  //   let userindex = Store.get("session/group_id") * Store.get("server/maxgroups") + Store.get("session/group_order") + 1;
  //   $(`.sidebar#sidebar_left #userlist #userlist_${userindex}`).addClass("active");
  //   if(typeof window.audioclass != "undefined"){
  //     window.audioclass.setGroupID(Store.get("session/group_id"));
  //   }
  }
  calcPixelDistribution(){
    let distribution = new Array(Store.get("server/maxgroups")+1).fill(0);
    let maxPixels = Store.get("server/canvaswidth")*Store.get("server/canvasheight");
    for(let col of Store.get("session/pixelArray")){
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
