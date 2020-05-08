var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var settings = require('./lib/settings.js');

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    var environment = this.options.environment;

    var app = express();

    var httpServer = this.httpServer;
    var scServer = this.scServer;

    if (environment === 'dev') {
      // Log every HTTP request.
      // See https://github.com/expressjs/morgan for other available formats.
      app.use(morgan('dev'));
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
      let sessionkey;
      let sessionstarted;
      let groupid;
      let grouporder;

      socket.on('auth_request', function (data, respond) {
        console.log("Auth Request received");
        // Create random session string
        sessionkey = "random_string";
        sessionstarted = new Date();
        groupid = 0;
        grouporder = 0;

        socket.setAuthToken({
          sessionkey: sessionkey,
          groupid: groupid,
          grouporder: grouporder,
          sessionstarted:sessionstarted
          // en de rest
        })
        respond({ // Static settings
          sessionkey: sessionkey,
          groupid:groupid,
          userindex:grouporder,
          maxgroups:settings.maxgroups,
          maxusers:settings.maxusers,
          canvaswidth:settings.npcCanvasWidth,
          canvasheight:settings.npcCanvasHeight,
          sessionstarted:sessionstarted,
          sessionduration:settings.sessionduration,
          clockspeed:settings.clockspeed
        });
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
  }
}

new Worker();
