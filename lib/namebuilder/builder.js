const NbAdjectives = require("./adjectives.json");
const NbNouns = require("./nouns.json");

const db = require("../db");
exports.namebuilder = async function () {
  let adjective = NbAdjectives[Math.floor(Math.random()*(NbAdjectives.length-1))];
  let noun = NbNouns[Math.floor(Math.random()*(NbNouns.length-1))];
  let username = `${adjective} ${noun}`;
  let usernames = await db.getNames();
  if(usernames.indexOf(username) != -1){
    username = exports.namebuilder();
  } else {
    return username;
  }
}
