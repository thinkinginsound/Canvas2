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

    // Handle incoming websocket connections and listen for events.
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
          console.log("firstID", firstID);
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
          console.log("dbUserData", dbUserData, sessionData.sessionkey);
        }

        sessionData.userNamesList = await db.getNames();
        console.log("userNamesList", sessionData.userNamesList, sessionData.userNamesList.length)

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
      socket.on('drawpixel', function (data) {
        if (!socket.authToken) return;
        // Sla data op in db
      });

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
      async function findFirstID () {
        let activeNPCs = await db.getActiveNPCs();
        console.log("activeNPCs", activeNPCs)
        let npcGroups = []
        activeNPCs.forEach((item, i) => {
          if(!npcGroups[item.group_id])npcGroups[item.group_id] = []
          npcGroups[item.group_id].push(item);
        });
        console.log("npcGroups", npcGroups)
        let npcGroupsAmount = npcGroups.map(r=>r.length)
        console.log("npcGroupsAmount", npcGroupsAmount);
        let group_id = Math.max(...npcGroupsAmount);
        console.log("group_id", group_id);
        let npcGroup = npcGroups[group_id].map(r=>r.group_order);
        console.log("npcGroup", npcGroup);
        let group_order = Math.min(...npcGroup);
        console.log("group_order", group_order, Math.min(...npcGroup));
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
