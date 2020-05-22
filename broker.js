var SCBroker = require('socketcluster/scbroker');
var scClusterBrokerClient = require('scc-broker-client');

var settings = require('./lib/settings.js');
const db = require("./lib/db");

class Broker extends SCBroker {
  run() {
    console.log('   >> Broker PID:', process.pid);

    /*
      If either `SCC_STATE_SERVER_HOST='123.45.67.89' node server.js` environment variable is set,
      or `node server.js --cssh '123.45.67.89'` argument is provided,
      the broker will try to attach itself to the SC Cluster for automatic horizontal scalability.
      This is mostly intended for the Kubernetes deployment of SocketCluster - In this case,
      The clustering/sharding all happens automatically.
    */
    if (this.options.clusterStateServerHost) {
      scClusterBrokerClient.attach(this, {
        stateServerHost: this.options.clusterStateServerHost,
        stateServerPort: this.options.clusterStateServerPort,
        mappingEngine: this.options.clusterMappingEngine,
        clientPoolSize: this.options.clusterClientPoolSize,
        authKey: this.options.clusterAuthKey,
        stateServerConnectTimeout: this.options.clusterStateServerConnectTimeout,
        stateServerAckTimeout: this.options.clusterStateServerAckTimeout,
        stateServerReconnectRandomness: this.options.clusterStateServerReconnectRandomness
      });
    }

    this.on('masterMessage', (msg, respond) => {
      // this.publish('channelname', msg);
      // if (settings.debug) console.log('msg from broker', msg);
      if (msg.type=="onClock") {
        if (settings.debug) console.log('clock', msg.payload);
        this.publish('onClock', msg.payload);
      } else if (msg.type=="broadcast") {
        // if (settings.debug) console.log('broadcast', msg.id, msg.payload);
        this.publish('clientcom', {id:msg.id, data:msg.payload});
      } else if (msg.type=="herdingUpdate") {
        // if (settings.debug) console.log('herdingUpdate', msg.id, msg.payload);
        this.publish('herdingUpdate', {id:msg.id, data:msg.payload});
      } else if (msg.type=="groupupdate") {
        // if (settings.debug) console.log('groupupdate', msg.id, msg.payload);
        this.publish('groupupdate', {id:msg.id, data:msg.payload});
      } else {
        if (settings.debug) console.error('Uncatched masterMessage from broker:', msg);
      }
    });
    this.on('publish', (channelname, data) => {
      if (settings.debug) console.log('publish from broker', channelname, data);
      if (channelname == "clientcom") {
        if (data.id == "drawpixel") db.insertUserData(data.data);
      } else if (channelname == "userState") {

      } else {
        console.log('Uncatched publish from broker:', channelname, data);
      }
    });
  }
}

new Broker();
