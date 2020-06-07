/**
 @module broker
 @description
  Deze thread zorgt voor de communicatie tussen alle processen.
*/

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

    /**
      @function onMasterMessage
      @description Handle messages send from other processes/threads
      @property {object} msg Data send by the process
      @property {function} respond Funtion to be called on success
    */
    this.on('masterMessage', (msg, respond) => {
      // Verstuur een bericht met ID 'channelname' en data 'msg' :
      // this.publish('channelname', msg);

      if (msg.type=="onClock") {
        console.log('clock', msg.payload);
        this.publish('onClock', msg.payload);
      } else if (msg.type=="broadcast") {
        this.publish('clientcom', {id:msg.id, data:msg.payload});
      } else if (msg.type=="herdingUpdate") {
        this.publish('herdingUpdate', {id:msg.id, data:msg.payload});
        this.publish('clientcom', {id:"herdingUpdate", data:msg.payload});
      } else if (msg.type=="groupupdate") {
        this.publish('groupupdate', {id:msg.id, data:msg.payload});
        this.publish('clientcom', {id:"groupupdate", data:msg.payload});
      } else if (msg.type=="userNamesList") {
        this.publish('clientcom', {id:"userNamesList", data:msg.payload});
      } else {
        if (settings.debug) console.error('Uncatched masterMessage from broker:', msg);
      }
    });

    /**
      @function onMasterMessage
      @description Handle messages send from Clients
      @property {string} channelname Name of channel
      @property {object} data Data send by the client
    */
    this.on('publish', (channelname, data) => {
      if (channelname == "clientcom") {
        if (data.id == "drawpixel") db.insertUserData(data.data);
      } else if (channelname == "userState") {
        if (data.action == "created") {
          this.publish('clientcom', {id:'updateUsernames', data:{
            groupid: data.groupid,
            grouporder: data.grouporder,
            username: data.username
          }});
        }
      } else {
        console.log('Uncatched publish from broker:', channelname, data);
      }
    });
  }
}

new Broker();
