/*
Purpose: Main.js is used to call on functions from different classes.
It also loads the audiofiles and functions as a global storage.

Functions:

*/

// Modals
import { WelcomeModal } from  "./modals/welcomeModal.js"
import { AudioClass } from  "./audioclass.js"
import { SocketHandler } from "./SocketHandler.js"
import { UIHandler } from "./UIHandler.js"
import Sketch from "./sketch.js"

import Store from "./Store.js"

Store.add("server/ready", false);
Store.add("server/maxgroups", 0);
Store.add("server/maxusers", 0);
Store.add("server/clockspeed", 1000);
Store.add("server/sessionduration", 1000*60*5);
Store.add("server/canvaswidth", 30);
Store.add("server/canvasheight", 30);
Store.add("server/sessionkey", -1);
Store.add("server/sessionstarted", 0);

Store.add("session/clock", -1);
Store.add("session/serverarmed", false);
Store.add("session/group_id", -1);
Store.add("session/group_order", -1);
Store.add("session/isHerding", false);
Store.add("session/herdingstatus", []);
Store.add("session/herdinghistory", []);
Store.add("session/sheepPercentage", 0);
Store.add("session/pixelArray", []);
Store.add("session/currentPixelArray", []);
Store.add("session/lastPixelPos", [null,null]);
Store.add("session/currentXPos", 0);
Store.add("session/currentYPos", 0);
Store.add("session/hasPlayed", false);
Store.add("session/username", "")
Store.add("session/userNamesList", []);
Store.add("session/firstPixelPlaced", false);
Store.add("session/timeRemaining", -1)
Store.add("session/endPercentage", []);
Store.add("session/winnerColor", 0);
Store.add("session/winnerPercentage", 0);

window.audioclass = new AudioClass();
window.uiHandler = new UIHandler();
window.socketHandler = new SocketHandler();
window.sketch = Sketch;

$(function() {
  var md = new MobileDetect(window.navigator.userAgent);

  if(md.mobile() != null){
    //If needed make a fancy you're a mobile user, stop connecting page
    window.location.href = "http://thinkinginsound.nl/";
    return false;
  }

  let welcomeModal = new WelcomeModal();
  welcomeModal.setActionPositive((e)=>{
    setCookie("termsagreed", true)
    window.termsagreed = true;
    startApp();
    return true;
  })
  welcomeModal.show();
});

function startApp(){
  window.socketHandler.startClientCom().then((socket, channel)=>{
    window.audioclass.setGroupID(Store.get("server/group_id", -1));
    uiHandler.fillUI();
    uiHandler.bindKeyListener();
  }, 10);
}
