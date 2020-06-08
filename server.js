/**
 @file server.js
 @description
  Documentatie voor de server<br>
  De main thread word gestart door node server.js te draaien. Deze thread zorgt
  er voor dat alle andere threads worden gestart. Deze thread aangemaakt door
  de socketcluster library en is NIET bedoeld om in te werken.
  <hr>
  This is the SocketCluster master controller file.
  It is responsible for bootstrapping the SocketCluster master process.
  Be careful when modifying the options object below.
  If you plan to run SCC on Kubernetes or another orchestrator at some point
  in the future, avoid changing the environment variable names below as
  each one has a specific meaning within the SC ecosystem.
*/

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var scHotReboot = require('sc-hot-reboot');

var fsUtil = require('socketcluster/fsutil');
var waitForFile = fsUtil.waitForFile;

var SocketCluster = require('socketcluster');

const db = require("./lib/db");

var workerControllerPath = argv.wc || process.env.SOCKETCLUSTER_WORKER_CONTROLLER;
var brokerControllerPath = argv.bc || process.env.SOCKETCLUSTER_BROKER_CONTROLLER;
var workerClusterControllerPath = argv.wcc || process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER;
var environment = process.env.ENV || 'dev';

var options = {
  workers: Number(argv.w) || Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
  brokers: Number(argv.b) || Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
  port: Number(argv.p) || Number(argv.port) || Number(process.env.PORT) || 8000,
  // You can switch to 'sc-uws' for improved performance.
  wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || 'ws',
  appName: argv.n || process.env.SOCKETCLUSTER_APP_NAME || null,
  workerController: workerControllerPath || path.join(__dirname, 'worker.js'),
  brokerController: brokerControllerPath || path.join(__dirname, 'broker.js'),
  workerClusterController: workerClusterControllerPath || null,
  socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
  clusterStateServerHost: argv.cssh || process.env.SCC_STATE_SERVER_HOST || null,
  clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
  clusterMappingEngine: process.env.SCC_MAPPING_ENGINE || null,
  clusterClientPoolSize: process.env.SCC_CLIENT_POOL_SIZE || null,
  clusterAuthKey: process.env.SCC_AUTH_KEY || null,
  clusterInstanceIp: process.env.SCC_INSTANCE_IP || null,
  clusterInstanceIpFamily: process.env.SCC_INSTANCE_IP_FAMILY || null,
  clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
  clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
  clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
  crashWorkerOnError: argv['auto-reboot'] != false,
  // If using nodemon, set this to true, and make sure that environment is 'dev'.
  killMasterOnSignal: false,
  environment: environment
};

var bootTimeout = Number(process.env.SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) || 10000;
var SOCKETCLUSTER_OPTIONS;

if (process.env.SOCKETCLUSTER_OPTIONS) {
  SOCKETCLUSTER_OPTIONS = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
}

for (var i in SOCKETCLUSTER_OPTIONS) {
  if (SOCKETCLUSTER_OPTIONS.hasOwnProperty(i)) {
    options[i] = SOCKETCLUSTER_OPTIONS[i];
  }
}

var start = function () {
  if(argv.purgedb){
    db.truncateTable("user_games");
    db.truncateTable("user_game_state");
    db.truncateTable("user_data");
  }

  var socketCluster = new SocketCluster(options);

  const { fork } = require("child_process");

  const timerProgram = path.resolve('lib/timerProcess.js');
  const timerProcess = fork(timerProgram);
  const aiProgram = path.resolve('lib/aiProcess.js');
  const aiProcess = fork(aiProgram);

  timerProcess.on('message', message => {
    socketCluster.sendToBroker(0, message);
    if(message.type=="onClock") aiProcess.send(message);
  });
  timerProcess.send({type:"initTimer"});

  aiProcess.on('message', message => {
    socketCluster.sendToBroker(0, message);
  });
  aiProcess.send({type:"initAIProcess"});

  socketCluster.on(socketCluster.EVENT_WORKER_CLUSTER_START, function (workerClusterInfo) {
    console.log('   >> WorkerCluster PID:', workerClusterInfo.pid);
  });

  if (socketCluster.options.environment === 'dev') {
    // This will cause SC workers to reboot when code changes anywhere in the app directory.
    // The second options argument here is passed directly to chokidar.
    // See https://github.com/paulmillr/chokidar#api for details.
    console.log(`   !! The sc-hot-reboot plugin is watching for code changes in the ${__dirname} directory`);
    scHotReboot.attach(socketCluster, {
      cwd: __dirname,
      ignored: ['public', 'node_modules', 'README.md', 'Dockerfile', 'server.js', 'broker.js', /[\/\\]\./, '*.log', 'database.sqlite', 'database.sqlite-journal', 'forever']
    });
  }
};

var bootCheckInterval = Number(process.env.SOCKETCLUSTER_BOOT_CHECK_INTERVAL) || 200;
var bootStartTime = Date.now();

// Detect when Docker volumes are ready.
var startWhenFileIsReady = (filePath) => {
  var errorMessage = `Failed to locate a controller file at path ${filePath} before SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT`;

  return waitForFile(filePath, bootCheckInterval, bootStartTime, bootTimeout, errorMessage);
};

var filesReadyPromises = [
  startWhenFileIsReady(workerControllerPath),
  startWhenFileIsReady(brokerControllerPath),
  startWhenFileIsReady(workerClusterControllerPath)
];
Promise.all(filesReadyPromises)
.then(() => {
  start();
})
.catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
