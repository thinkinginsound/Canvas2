/**
 @module namebuilder
 @description
  Static function that generates a unique username.
*/

const NbAdjectives = require("./adjectives.json");
const NbNouns = require("./nouns.json");

const db = require("../db");

/**
	@description Function that returns a username composed of an adjective and a noun. Names should alwais be unique
  @return {string}
*/
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
