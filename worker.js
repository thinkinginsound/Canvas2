var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var settings = require('./lib/settings.js');
var crypto = require("crypto");

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

    // Handle incoming websocket connections and listen for events.
    scServer.on('connection', function (socket) {
      // Check if existing session is expired, remove if true
      if (socket.authToken &&
          (new Date() - socket.authToken.sessionstarted) >= settings.sessionduration
      ) socket.authToken = undefined;


      socket.on('auth_request', function (data, res) {
        console.log("Auth Request received", data);

        let sessionData = {
          ...socket.authToken,
          maxgroups:settings.maxgroups,
          maxusers:settings.maxusers,
          canvaswidth:settings.canvaswidth,
          canvasheight:settings.canvasheight,
          sessionduration:settings.sessionduration,
          clockspeed:settings.clockspeed,
        };

        // Init new session if socket.authToken is true
        if(!socket.authToken){
          sessionData.sessionkey = crypto.randomBytes(16).toString('hex');
          sessionData.sessionstarted = new Date();
          sessionData.groupid = 0;
          sessionData.grouporder = 0;
          sessionData.currentXPos = 0;
          sessionData.currentYPos = 0;
        }

        socket.setAuthToken(sessionData)
        res();
      });
      socket.on('drawpixel', function (data) {
        if (!socket.authToken) return;
        // Sla data op in db
      });

      var interval = setInterval(function () {
        socket.emit('random', {
          number: Math.floor(Math.random() * 5)
        });
      }, 1000);

      socket.on('disconnect', function () {
        clearInterval(interval);
      });

    });
    // this.on("masterMessage", (error, data)=>{
    //   console.log("masterMessage", error, data);
    // })
  }
}

new Worker();
