/*
Purpose: The SocketHandler class handles all communication with the server

Functions:
*/

import { ErrorModal } from  "./modals/errorModal.js"
import { EndModal } from  "./modals/endModal.js"
import { PixelObject } from "./pixelObject.js"
import Store from "./Store.js"

function createClosure(){
  let i = 1;
  return function inc(num){
    i+=num;
    return i;
  }
}

class SocketHandler {
  constructor (){
    const socket = this.socket = socketCluster.connect({
      ackTimeout: 10000
    });
    socket.on("connect", (...args) => {
      this.onConnect(...args);
    })
    socket.on("close", (...args) => {
      this.onClose(...args);
    })
  }

  onConnect () {
    console.log("socket connected");
  }
  onClose () {
    console.log("socket closed");
  }
  onSubscribe (response) {
    console.log("socket subscribed", response);

    const authToken = this.socket.authToken;
    console.log("auth token", authToken);
    Store.set("server/sessionkey", authToken.sessionkey);
    Store.set("server/groupid", authToken.groupid);
    Store.set("server/grouporder", authToken.grouporder);
    Store.set("server/maxgroups", authToken.maxgroups);
    Store.set("server/maxusers", authToken.maxusers);
    Store.set("server/maxPixelsWidth", authToken.canvaswidth);
    Store.set("server/maxPixelsHeight", authToken.canvasheight);
    Store.set("server/clockspeed", authToken.clockspeed);
    Store.set("server/sessionduration", authToken.sessionduration);
    Store.set("server/sessionstarted", authToken.sessionstarted);

    Store.set("session/currentXPos", authToken.currentXPos);
    Store.set("session/currentYPos", authToken.currentYPos);
    Store.set("session/herdingstatus", []);
    Store.set("session/herdinghistory", new Array(authToken.maxgroups).fill(0));
    Store.set("session/sheepPercentage", 0);
    Store.set("session/pixelArray", createArray(authToken.canvaswidth, authToken.canvasheight, -1));
    Store.set("session/lastPixelPos", [authToken.currentXPos,authToken.currentYPos]);

    for(let xIndex in Store.get("session/pixelArray")){
      for(let yIndex in Store.get("session/pixelArray")[xIndex]){
        Store.get("session/pixelArray")[xIndex][yIndex] = new PixelObject(parseInt(xIndex),parseInt(yIndex))
      }
    }

    console.log("UserStore", Store);
    this.bindListeners();
    Store.set("server/ready", true);
  }

  startClientCom () { return new Promise( (res,rej) => {
    const socket = this.socket;
    socket.emit("auth_request", "request", (error, responseData) => {
      console.log("auth_request", error, responseData);
      if (error) console.log("error", error)

      const channel = this.channel = socket.subscribe("clientcom");
      socket.on("subscribe", (...args) => {
        this.onSubscribe(...args);
        res(socket, channel);
      })
    });
  } ) }

  bindListeners(){
    // Session Revoked. There were too many users trying to login to the system
    this.addListener('sessionrevoked',function(data){
      let errorModal = new ErrorModal("Too many users", "Too many users are using the system at this moment. Please wait a few minutes and reload the page.");
      errorModal.show();
    });

    // Receives clock from server. Calls UI clock function.
    this.addListener('clock', (data)=>{
      console.log("clock", data);
      Store.set("session/serverarmed", true);
      Store.set("session/clock", data);
      window.uiHandler.onClock();
    })

    // Received a new pixel. Write to storage
    this.addListener('drawpixel', function(data){
      let valueX = Math.floor(data.mouseX);
      let valueY = Math.floor(data.mouseY);

      if(valueX<0)valueX = 0;
      else if(valueX>window.state.server.maxPixelsWidth)valueX = window.state.server.maxPixelsWidth;

      if(valueY<0)valueY = 0;
      else if(valueY>window.state.server.maxPixelsHeight)valueY = window.state.server.maxPixelsHeight;

      window.state.session.pixelArray[valueX][valueY].setGroup(parseInt(data.groupid));
    })

    // Server updated clients herding status. Store and react.
    this.addListener('herdingStatus', function(data){
      if(window.state.server.groupid == -1 || window.state.server.userid == -1)return;
      window.state.session.isHerding = data[window.state.server.groupid][window.state.server.userid];
      window.state.session.herdingstatus = new Array(data.length).fill(0);
      for(let group in data){
        for(let user in data[group]){
          window.state.session.herdingstatus[group] += data[group][user];
        }
      }
      window.state.session.herdinghistory.push(window.state.session.isHerding);
      window.audioclass.setIsHerding(window.state.session.isHerding,((window.state.session.herdingstatus[window.state.server.groupid]/window.state.server.maxusers) * 100));
      console.log("herdingStatus", window.state.session.herdingstatus[window.state.server.groupid]);
    })

    // Server updated clients group status. Store and react.
    this.addListener('groupupdate', function(data){
      if(data.indexOf(window.state.server.sessionkey)!=-1){
        window.state.server.groupid = data.groupid;
        window.state.server.userid = data.userindex;
        window.uiHandler.updateUserGroup();
      }
      console.log("groupupdate", data);
    })

    // Show endmodal on session expired
    this.addListener('sessionexpired',(data)=>{
      let endModal = new EndModal();
      window.state.server.ready = false;
      this.calcSheepBehavior(window.state.session.herdinghistory)
      endModal.setSheepPercentage(window.state.session.sheepPercentage);
      endModal.show();
    });
  }
  addListener(id, action){ this.socket.on(id,action); }
  emit(id, payload){
    this.socket.emit(id, payload)
  }

  calcSheepBehavior(sheepArray){
    let arrAvg = sheepArray => sheepArray.reduce((a,b) => a + b, 0) / sheepArray.length;
    window.state.session.sheepPercentage = arrAvg(sheepArray)*100;
    document.getElementById("sheepPercentage");
    return window.state.session.sheepPercentage;
  }
}

export { SocketHandler };
