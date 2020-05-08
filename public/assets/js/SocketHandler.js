/*
Purpose: The SocketHandler class handles all communication with the server

Functions:
*/

import { ErrorModal } from  "./modals/errorModal.js"
import { EndModal } from  "./modals/endModal.js"
import { PixelObject } from "./pixelObject.js"

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
  onSubscribe () {
    console.log("socket subscribed");
  }

  startClientCom () { return new Promise( (res,rej) => {
    const socket = this.socket;
    this.socket.emit("auth_request", (error, data) => {
      console.log("auth_request")
      const channel = this.channel = socket.subscribe("clientcom");
      socket.on("subscribe", (...args) => {
        this.onSubscribe(...args);
        res(socket, channel);
      })
    });
  } ) }

  startSocket (onReady = (socket)=>console.log("onReady"), timeout = 10){
    // this.socket = io();
    // window.socket = this.socket
    new Promise( (res, rej) => {
      let counter = 0;
      setInterval(()=>{
        if(typeof this.socket!="undefined") res();
        else if(++counter>timeout){
          console.log("Rejected")
          rej()
        }
      }, 500);
    }).then(()=>{
      this.socket.emit("ready", "", (response)=>{
        console.log("socket ready")
        // const {sessionkey, ...} = response;
        // TODO: Variabelen hernoemen
        window.state.server.sessionkey = response.sessionkey;
        window.state.server.groupid = response.groupid;
        window.state.server.userid = response.userindex;
        window.state.server.maxgroups = response.maxgroups;
        window.state.server.maxusers = response.maxusers;
        window.state.server.maxPixelsWidth = response.canvaswidth;
        window.state.server.maxPixelsHeight = response.canvasheight;
        window.state.server.clockspeed = response.clockspeed;
        window.state.server.sessionduration = response.sessionduration;
        window.state.server.sessionstarted = response.sessionstarted;

        window.state.session.currentXPos = randomInt(window.state.server.maxPixelsWidth); //random x position in canvas
        window.state.session.currentYPos = randomInt(window.state.server.maxPixelsHeight); // random y positon in canvas
        window.state.session.herdingstatus = []
        window.state.session.herdinghistory = new Array(response.maxgroups).fill(0);
        window.state.session.pixelArray = createArray(window.state.server.maxPixelsWidth, window.state.server.maxPixelsHeight, -1);
        for(let xIndex in window.state.session.pixelArray){
          for(let yIndex in window.state.session.pixelArray[xIndex]){
            window.state.session.pixelArray[xIndex][yIndex] = new PixelObject(xIndex,yIndex)
          }
        }
        window.state.session.lastPixelPos = [window.state.session.currentXPos, window.state.session.currentYPos];

        this.bindListeners();
        onReady(this.socket);
        window.state.server.ready = true;
      });
    }).catch(()=>{console.log("error")});
  }
  bindListeners(){
    // Session Revoked. There were too many users trying to login to the system
    this.addListener('sessionrevoked',function(data){
      let errorModal = new ErrorModal("Too many users", "Too many users are using the system at this moment. Please wait a few minutes and reload the page.");
      errorModal.show();
    });

    // Receives clock from server. Calls UI clock function.
    this.addListener('clock', (data)=>{
      console.log("clock", data)
      window.state.session.serverarmed = true;
      window.state.session.clock = data
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
    socket.on('sessionexpired',(data)=>{
      console.log("ik ben hier");
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
