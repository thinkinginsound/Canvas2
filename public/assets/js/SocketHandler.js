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
    const eventHost = this.eventHost = document.createElement('div');
    socket.on("connect", (...args) => {
      this.onConnect(...args);
    })
    socket.on("close", (...args) => {
      this.onClose(...args);
    });

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
    Store.set("server/maxgroups", authToken.maxgroups);
    Store.set("server/maxusers", authToken.maxusers);
    Store.set("server/canvaswidth", authToken.canvaswidth);
    Store.set("server/canvasheight", authToken.canvasheight);
    Store.set("server/clockspeed", authToken.clockspeed);
    Store.set("server/sessionduration", authToken.sessionduration);
    Store.set("server/sessionstarted", authToken.sessionstarted);

    Store.set("session/group_id", authToken.groupid);
    Store.set("session/group_order", authToken.grouporder);
    Store.set("session/currentXPos", authToken.currentXPos);
    Store.set("session/currentYPos", authToken.currentYPos);
    Store.set("session/herdingstatus", []);
    Store.set("session/herdinghistory", new Array(authToken.maxgroups).fill(0));
    Store.set("session/sheepPercentage", 0);
    Store.set("session/pixelArray", createArray(authToken.canvaswidth, authToken.canvasheight, -1));
    Store.set("session/currentPixelArray", createArray(authToken.maxgroups, authToken.maxusers, [-1,-1]));
    Store.set("session/lastPixelPos", [authToken.currentXPos,authToken.currentYPos]);
    Store.set("session/username", authToken.username)
    Store.set("session/userNamesList", authToken.userNamesList);
    console.log("userNamesList", authToken.userNamesList)
    for(let xIndex in Store.get("session/pixelArray")){
      for(let yIndex in Store.get("session/pixelArray")[xIndex]){
        Store.get("session/pixelArray")[xIndex][yIndex] = new PixelObject(parseInt(xIndex),parseInt(yIndex))
      }
    }
    window.sketch.windowResized()

    console.log("UserStore", Store);
    this.bindListeners();
    Store.set("server/ready", true);
    Store.set("session/hasPlayed", true);
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
      channel.watch((data)=>{
        this.eventHost.dispatchEvent(new CustomEvent(data.id, {detail: data.data}));
      })
    });
  } ) }

  bindListeners(){
    // Session Revoked. There were too many users trying to login to the system
    this.addListener('sessionrevoked',function(data){
      let errorModal = new ErrorModal("Too many users", "Too many users are using the system at this moment. Please wait a few minutes and reload the page.");
      errorModal.show();
    }, true);

    // Receives clock from server. Calls UI clock function.
    this.addListener('clock', (data)=>{
      console.log('clock', data)
      Store.set("session/serverarmed", true);
      Store.set("session/clock", data);
      window.uiHandler.onClock();
    })

    // Received a new pixel. Write to storage
    this.addListener('drawpixel', function(data){
      // console.log('drawpixel', data)
      let valueX = Math.floor(data.user_loc_x);
      let valueY = Math.floor(data.user_loc_y);

      if(valueX<0)valueX = 0;
      else if(valueX>Store.get("server/canvaswidth"))valueX = Store.get("server/canvaswidth");

      if(valueY<0)valueY = 0;
      else if(valueY>Store.get("server/canvasheight"))valueY = Store.get("server/canvasheight");

      Store.get("session/pixelArray")[valueX][valueY].setGroup(parseInt(data.group_id));
      Store.get("session/currentPixelArray")[data.group_id][data.group_order] = [valueX, valueY];

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
    });

    //Swap a username
    this.addListener('updateUsernames',function(data){
      console.log("updateUsernames", data.groupid, Store.get("server/maxusers"), parseInt(data.grouporder,10));
      let index = data.groupid * Store.get("server/maxusers") + parseInt(data.grouporder,10)
      Store.get("session/userNamesList")[index] = data.username;
      window.uiHandler.changeUser(
        index,
        data.username
      );
    });

    // Show endmodal on session expired
    this.addListener('sessionexpired',(data)=>{
      Store.set("server/ready", false);
      let endModal = new EndModal();
      this.calcSheepBehavior(Store.get("session/herdinghistory"))
      endModal.setSheepPercentage(Store.get("session/sheepPercentage"));
      endModal.setWinnerColor();
      endModal.show();

      var ctxP = document.getElementById("endPieChart").getContext('2d');
      this.endPiechart = new Chart(ctxP, {
        type: 'pie',
        data: {
          datasets: [{
            borderWidth: 0,
            data: Store.get("session/endPercentage"),
            backgroundColor: ["#c10000", "#e68a00", "#009600", "#0058ff"]
            }]
          },
          options: {
            responsive: true,
            events: ['null']
          }
        }
      );
    }, true);
  }
  addListener(id, action, privateConnection=false){
    if(privateConnection) this.socket.on(id,action);
    else this.eventHost.addEventListener(id, (e)=>{action(e.detail)})
  }
  emit(id, data){
    this.socket.emit(id, data)
  }
  broadcast(id, data){
    this.socket.publish("clientcom", {id:id, data:data})
  }

  calcSheepBehavior(sheepArray){
    let arrAvg = sheepArray => sheepArray.reduce((a,b) => a + b, 0) / sheepArray.length;
    Store.set("session/sheepPercentage", arrAvg(sheepArray)*100);
    document.getElementById("sheepPercentage");
    return Store.get("session/sheepPercentage");
  }
}

export { SocketHandler };
