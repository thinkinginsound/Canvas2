Store.get("session/group_id")/*
Purpose: The UIHandler class contains all functions used to set up and adapt the user interface.

Functions:
*/
import Store from "./Store.js"

class UIHandler {
  constructor(){
    this.colorlist = ["#c10000", "#ff9900", "#009600", "#0058ff", "#ffff00", "#ff00ff", "#00ffff"]; // List of usable colors
    this.bgcolor = "#000";
    this.currentDrawPercentage = 0;
    this.piechart;
  }

  fillUI(){
    // Create Player views
    let userlistView = $(".sidebar#sidebar_left #userlist"); //create empty list
    userlistView.empty()
    //Add the current session user
    userlistView.append($(
      `<dd
        id="userlist_${Store.get("session/group_id")*Store.get("server/maxgroups")}"
        style="color:${this.colorlist[Store.get("session/group_id")]}">
        <b>⬤ <span style="color:white">${Store.get("session/username")}</span> </b>
      </dd>`
      ));
    //Add the rest of the users of the client's group on top
    for(let i = (Store.get("session/group_id")*Store.get("server/maxgroups")); i < ((Store.get("session/group_id")+1)*Store.get("server/maxgroups")); i++){
      if(Store.get("session/username") != Store.get("session/userNamesList", [])[i]){
        userlistView.append($(
          `<dd
            id="userlist_${i}"
            style="color:${this.colorlist[Store.get("session/group_id")]}">
            ⬤ <span style="color:white">${Store.get("session/userNamesList")[i]}</span>
          </dd>`
          ));
      }
    }
    //Add the rest of the users to the list
    for(let groupId = 0; groupId < Store.get("server/maxgroups"); groupId++){
      for(let userPos = 0; userPos < Store.get("server/maxusers"); userPos++){
        if(groupId != Store.get("session/group_id")){
          let userindex = groupId*Store.get("server/maxgroups") + userPos
          userlistView.append($(`
            <dd id="userlist_${userindex}" style="color:${this.colorlist[groupId]}">
            ⬤ <span style="color:white">${Store.get("session/userNamesList")[userindex]}</span>
            </dd>
          `));
        }
      }
    }

    //pie
    var ctxP = document.getElementById("pieChart").getContext('2d');
    this.piechart = new Chart(ctxP, {
      type: 'pie',
      data: {

        datasets: [{
          borderWidth: 0,
          data: [100, 0, 0, 0, 0, 0],
          backgroundColor: ["#FFFFFF", this.colorlist[0], this.colorlist[1], this.colorlist[2], this.colorlist[3]],
          }]
        },
        options: {
          responsive: true,
          events: ['null']
        }
      });

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
  changeUser(index,username){
    $(`#userlist_${index}`).fadeOut(500, function() {
      $(this).text(username).fadeIn(500);
    });
  }
  bindKeyListener(){
    document.addEventListener('keyup', (event) => {
      if(!Store.get("server/ready")){return 0;}
      const keyName = event.key;
      let xOffset = Store.get("session/currentXPos") - Store.get("session/lastPixelPos")[0];
      let yOffset = Store.get("session/currentYPos") - Store.get("session/lastPixelPos")[1];
      if (keyName === 'ArrowRight') {
        if(xOffset < 1 && Store.get("session/currentXPos") < Store.get("server/canvaswidth") - 1){
          Store.set("session/currentXPos", Store.get("session/currentXPos") + 1)
        }
      }
      else if (keyName === 'ArrowLeft') {
        if(xOffset > -1 && Store.get("session/currentXPos")>0){
          Store.set("session/currentXPos", Store.get("session/currentXPos") - 1)
        }
      }
      else if (keyName === 'ArrowUp') {
        if(yOffset > -1 && Store.get("session/currentYPos")>0){
          Store.set("session/currentYPos", Store.get("session/currentYPos") - 1)
        }
      }
      else if (keyName === 'ArrowDown') {
        if(yOffset < 1 && Store.get("session/currentYPos") < Store.get("server/canvasheight") - 1){
          Store.set("session/currentYPos", Store.get("session/currentYPos") + 1)
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
      mouseX:Store.get("session/currentXPos"),
      mouseY:Store.get("session/currentYPos"),
      degrees:deg,
      clock:Store.get("session/clock"),
    }
    if(Store.get("server/ready"))window.socketHandler.emit('drawpixel', sendable);
    else console.error("Socket undefined")
  }
  onClock(){
    window.uiHandler.currentDrawPercentage = 0;
    this.calcPixelDistribution();
  }
  updateUserGroup(){
    $(".sidebar#sidebar_left #userlist .active").removeClass("active");
    let userindex = Store.get("session/group_id") * Store.get("server/maxgroups") + Store.get("session/group_order") + 1;
    $(`.sidebar#sidebar_left #userlist #userlist_${userindex}`).addClass("active");
    if(typeof window.audioclass != "undefined"){
      window.audioclass.setGroupID(Store.get("session/group_id"));
    }
  }
  calcPixelDistribution(){
    let distribution = new Array(Store.get("server/maxgroups")+1).fill(0);
    let maxPixels = Store.get("server/canvaswidth")*Store.get("server/canvasheight");
    for(let col of Store.get("session/pixelArray")){
      for(let row of col){
        distribution[row.group+1]++;
      }
    }
    if(this.piechart !== undefined){
      this.piechart.data.datasets.forEach((dataset) => {
          dataset.data = [];
      });
      this.piechart.data.datasets.forEach((dataset) => {
        for (let groupindex in distribution){
          let value = distribution[groupindex];
          let percentage = (value/maxPixels*100).toFixed(2);
          dataset.data.push(percentage);
        }
      });
      this.piechart.update();
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
