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

import Store from "./Store.js"

Store.add("server/ready", false);
Store.add("server/maxgroups", 0);
Store.add("server/maxusers", 0);
Store.add("server/clockspeed", 1000);
Store.add("server/sessionduration", 1000*60*5);
Store.add("server/maxPixelsWidth", 30);
Store.add("server/maxPixelsHeight", 30);
Store.add("server/sessionkey", -1);
Store.add("server/sessionstarted", 0);

// Store.add("session/clock", -1);
Store.add("session/serverarmed", false);
Store.add("session/group_id", -1);
Store.add("session/group_order", -1);
Store.add("session/isHerding", false);
Store.add("session/herdingstatus", []);
Store.add("session/herdinghistory", []);
Store.add("session/sheepPercentage", 0);
Store.add("session/pixelArray", []);
Store.add("session/lastPixelPos", [null,null]);
Store.add("session/currentXPos", 0);
Store.add("session/currentYPos", 0);

console.log("UserStore", Store);

// // TODO: State object maken
// window.state = {
//   server: {
//     // Static variable retreived from server
//     ready: false,
//     maxgroups: 0,
//     maxusers: 0,
//     clockspeed: 1000,
//     sessionduration: 1000*60*5, // 5 minutes in ms;
//     maxPixelsWidth: 40,
//     maxPixelsHeight: 30,
//     sessionkey: -1,
//     sessionstarted: 0
//   },
//   session: {
//     // Changing variable, some retreived from server
//     clock: -1,
//     serverarmed: true,
//     groupid: -1,
//     userid: -1,
//     isHerding: false,
//     herdingstatus: [],
//     herdinghistory: [],
//     sheepPercentage: 0,
//     pixelArray: [],
//     lastPixelPos: [null,null],
//     currentXPos: 0,
//     currentYPos: 0
//   },
// }

window.audioclass = new AudioClass();
window.uiHandler = new UIHandler();
window.socketHandler = new SocketHandler();

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
    // window.audioclass.setGroupID(Store.get("server/groupid", -1));
    // uiHandler.fillUI();
    // uiHandler.bindKeyListener();
  }, 10);
}
