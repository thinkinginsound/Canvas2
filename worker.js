/**
 @module worker
 @description
  In deze thread wordt de communicatie met de client (socket) gedaan.
*/

var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var settings = require('./lib/settings.js');
var crypto = require("crypto");
const db = require("./lib/db");
const namebuilder = require("./lib/namebuilder/builder.js").namebuilder;

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

    var app = express();

    var httpServer = this.httpServer;
    var scServer = this.scServer;

    if (environment === 'dev' && settings.debug) {
      // Log every HTTP request.
      // See https://github.com/expressjs/morgan for other available formats.
      if(settings.htmlDebug) app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Listen for HTTP GET "/health-check".
    healthChecker.attach(this, app);

    httpServer.on('request', app);

    /**
     * NOTE: Be sure to replace the following sample logic with your own logic.
     */

    // Example how to bind a broker channel
    // const onClockChannel = this.onClockChannel = this.exchange.subscribe("onClock");
    // onClockChannel.watch((data)=>{
    //   console.log("Worker onClock received:", data)
    // })

    const userStateChannel = this.userStateChannel = this.exchange.subscribe("userState");

    /**
      @function onConnection
      @description Handle incoming websocket connections and listen for events.
      @property {object} socket Socket object that got connected
    */
    scServer.on('connection', function (socket) {
      // Check if session exists
      let sessionTimeout;
      if (socket.authToken && socket.authToken.sessionkey){
        // Check if session is expired, else set timer
        console.log("time", socket.authToken.sessionstarted + settings.sessionduration - new Date().getTime())
        let timeRemaining = socket.authToken.sessionstarted + settings.sessionduration - new Date().getTime();
        if (timeRemaining <= 0) {
          socket.authToken = undefined;
        } else {
          initSessionTimeout(timeRemaining);
        }
      }

      /**
        @function onAuthRequest
        @description Start socket session
        @property {object} data Data send by the client
        @property {function} res Funtion to be called on success
      */
      socket.on('auth_request', async function (data, res) {
        if (settings.debug) console.log("Auth Request received", data);

        let sessionData = {
          ...socket.authToken,
          maxgroups:settings.maxgroups,
          maxusers:settings.maxusers,
          canvaswidth:settings.canvaswidth,
          canvasheight:settings.canvasheight,
          sessionduration:settings.sessionduration,
          clockspeed:settings.clockspeed,
        };

        // Init new session if socket.authToken is false
        if(!socket.authToken || !socket.authToken.sessionkey){
          sessionData.sessionkey = crypto.randomBytes(16).toString('hex');
          sessionData.sessionstarted = new Date().getTime();
          let firstID = await findFirstID();
          if (!firstID) {
            socket.emit("sessionrevoked");
            return;
          }
          let replacingNPC = await db.getUserSession(firstID.session_key);
          sessionData.groupid = firstID.group_id;
          sessionData.grouporder = firstID.group_order;
          sessionData.currentXPos = replacingNPC.user_loc_x;
          sessionData.currentYPos = replacingNPC.user_loc_y;
          sessionData.username = await namebuilder();
          sessionData.replacingNPC = replacingNPC.id;

          await db.insertUserGame(
            sessionData.sessionkey,
            sessionData.username,
            sessionData.groupid,
            sessionData.grouporder,
            false,
            true,
            replacingNPC.id
          )
          await db.updateSessionActive( replacingNPC.id, false );
          await db.insertUserData({
            "user_game_id":sessionData.sessionkey,
            "user_loc_x":sessionData.currentXPos,
            "user_loc_y":sessionData.currentYPos,
            "angle":-1,
            "group_id":sessionData.groupid,
            "group_order":sessionData.grouporder,
            "frame_number":-1
          });
        } else {
          let dbUserData = await db.getUserSession(sessionData.sessionkey);
          sessionData.groupid = dbUserData.group_id;
          sessionData.grouporder = dbUserData.group_order;
          sessionData.currentXPos = dbUserData.user_loc_x;
          sessionData.currentYPos = dbUserData.user_loc_y;
        }

        sessionData.userNamesList = await db.getNames();

        socket.setAuthToken(sessionData);
        scServer.exchange.publish("userState", {
          action: "created",
          id: sessionData.sessionkey,
          username: sessionData.username,
          groupid: sessionData.groupid,
          grouporder: sessionData.grouporder
        });
        initSessionTimeout(settings.sessionduration);
        res();
      });
      // socket.on('drawpixel', function (data) {
      //   if (!socket.authToken) return;
      //   // Sla data op in db
      // });

      /**
       * @module worker
       * @function initSessionTimeout
       * @description Sets the timeout for the session
       * @property {number} timeRemaining Time remaining before session should be expired
       */
      function initSessionTimeout(timeRemaining) {
        if (settings.debug) console.log("Session timeout in ", timeRemaining);
        sessionTimeout = setTimeout(async ()=>{
          if (settings.debug) console.log("Session timeout", socket.authToken.sessionkey);
          let dbUserData = await db.getUserSession(socket.authToken.sessionkey);
          let dbUserDataNPC = await db.getUserSessionID(socket.authToken.replacingNPC);
          await db.updateUserGameIndexes(dbUserDataNPC.session_key, dbUserData.group_id, dbUserData.group_order);
          await db.updateSessionActiveKey( socket.authToken.sessionkey, false );
          await db.updateSessionActive( socket.authToken.replacingNPC, true );

          socket.emit("sessionexpired");
          scServer.exchange.publish("userState", {
            action: "expired",
            id: socket.authToken.sessionkey
          });
          socket.setAuthToken({});
        }, timeRemaining)
      }

      /**
       * @typedef {Object} FirstID
       * @property {string} session_key Session key of npc at index
       * @property {number} group_id - Group of replacing npc
       * @property {number} group_order - Order of replacing npc
       */
      /**
       * @module worker
       * @function findFirstID
       * @description Find first available replacable npc in database
       * @returns {FirstID} Object with session_key, group_id and group_order
       */
      async function findFirstID () {
        let activeNPCs = await db.getActiveNPCs();
        let npcGroups = new Array(settings.maxgroups).fill(0).map(r=>new Array())
        activeNPCs.forEach((item, i) => {
          npcGroups[item.group_id].push(item);
        });
        let npcGroupsAmount = npcGroups.map(r=>r.length)
        let group_id = npcGroupsAmount.indexOf(Math.max(...npcGroupsAmount));
        let npcGroup = npcGroups[group_id].map(r=>r.group_order);
        let group_order = Math.min(...npcGroup);
        if (group_id >= settings.maxgroups || group_order >= settings.maxusers) return false;
        let session_key = ""
        activeNPCs.forEach((item, i) => {
          if(item.group_id==group_id && item.group_order == group_order)
            session_key = item.session_key;
        });
        return {"session_key":session_key, "group_id":group_id, "group_order":group_order}
      }

    });
  }
}

new Worker();
