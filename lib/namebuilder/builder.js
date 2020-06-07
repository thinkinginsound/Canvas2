/**
 @module namebuilder
 @description
  meh
*/

const NbAdjectives = require("./adjectives.json");
const NbNouns = require("./nouns.json");

const db = require("../db");
async function namebuilder() {
  let adjective = NbAdjectives[Math.floor(Math.random()*(NbAdjectives.length))];
  let noun = NbNouns[Math.floor(Math.random()*(NbNouns.length))];
  let username = `${adjective} ${noun}`;
  let usernames = await db.getNames();
  if(!username || usernames.indexOf(username) != -1){
    username = await namebuilder();
  }
  return username;
}

exports.namebuilder = namebuilder;
