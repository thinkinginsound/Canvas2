var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var settings = require('./lib/settings.js');
var crypto = require("crypto");
const db = require("./lib/db");

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
          sessionData.groupid = 0;
          sessionData.grouporder = 0;
          sessionData.currentXPos = 0;
          sessionData.currentYPos = 0;
          sessionData.username = "mname";
          sessionData.userNamesList = await db.getNames();
        }
        console.log("sessionData", sessionData)
        socket.setAuthToken(sessionData);
        scServer.exchange.publish("userState", {
          action: "created",
          id: sessionData.sessionkey
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
        sessionTimeout = setTimeout(()=>{
          if (settings.debug) console.log("Session timeout", socket.authToken.sessionkey);
          socket.emit("sessionexpired");
          scServer.exchange.publish("userState", {
            action: "expired",
            id: sessionData.sessionkey
          });
          socket.setAuthToken({});
        }, timeRemaining)
      }

    });
  }
}

new Worker();
