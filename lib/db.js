const settings = require("./settings");
const sqlite = require("sqlite");
const pathlib = require("path");

const { performance } = require('perf_hooks');

/** @typedef userData
 * @property {number} id id of the user_data table
 * @property {string} session_key The identifier of the session of this user
 * @property {number} user_game_id The id of the user_games table
 * @property {number} user_loc_x The x position of this user at this moment
 * @property {number} user_loc_y The y position of this user at this moment
 * @property {number} angle The angle in which direction this user is moving
 * @property {number} group_id to which group this user belongs at this moment
 * @property {number} group_order the position of this user within this group
 * @property {boolean} is_hording Is the user hording at this moment
 * @property {number} frame_number Which frame number are we at
 * @property {date} timestamp The timestamp of this moment
 */

let db;
async function setup () {
  try {
    db = await sqlite.open("database.sqlite", {
      cached: true
    });
    await db.migrate({
      migrationsPath: pathlib.join(__dirname, "migrations"),
      force: true
    })
  } catch (e) {
    console.log(e)
  }
}

/**
  @param {number} frameNumber Which frame number are we at
  @param {number} [start] How many numbers to look back
  @return {userData[]}
*/
exports.getFrameDataFor = async function (frameNumber, start = 30) {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ud.*, ug.session_key
  FROM user_data ud, user_games ug
  WHERE
  	ud.user_game_id = ug.id
  AND
    ug.is_active = 1
  AND
    ud.frame_number <= ?
  AND
    ud.frame_number > ?
  ORDER BY ud.group_id`;
  const ret = await db.all(q, frameNumber, frameNumber - start);
  if (settings.benchmark) console.log("Benchmark DB#getFrameDataFor: ", performance.now() - now);
  return ret;
}
exports.IS_HERDING = true;
exports.IS_NOT_HERDING = false;
/**
  @param {userData[]} records Which frame number are we at
  @param {boolean} [isHerding] How many numbers to look back
*/
exports.saveHerding = async function (records, isHerding = false) {
  if (!db) await setup();
  const now = performance.now();
  let ids = records.map(r => r.id);
  const q = `UPDATE user_data SET is_herding = ? WHERE id IN ( ${ids.join(", ")} )`;
  const ret = await db.run(q, isHerding?1:0);
  if (settings.benchmark) console.log("Benchmark DB#saveHerding: ", performance.now() - now);
  return ret;
}
exports.saveAIResponse = async function (response, frame_number) {
  if (!db) await setup();
  const now = performance.now();
  const q = `INSERT INTO user_game_state (frame_number, contents) VALUES (?, ?)`;
  const ret = await db.run(q, frame_number, JSON.stringify(response));
  if (settings.benchmark) console.log("Benchmark DB#saveAIResponse: ", performance.now() - now);
  return ret;
}

exports.getHighestClock = async function (){
  if (!db) await setup();
  const now = performance.now();
  const q = `SELECT MAX(frame_number) FROM user_data ud`;
  const ret = await db.get(q);
  let maxclock = ret['MAX(frame_number)'];
  if (maxclock === null) maxclock = -1;
  if (settings.benchmark) console.log("Benchmark DB#getHighestClock: ", performance.now() - now);
  return maxclock;
}
exports.getNPCs = async function () {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.session_key, ug.group_id, ug.group_order
  FROM user_games ug
  WHERE
    ug.is_bot = 1
  ORDER BY ug.group_id, ug.group_order`;
  const ret = await db.all(q);
  if (settings.benchmark) console.log("Benchmark DB#getNPCs: ", performance.now() - now);
  return ret;
}
exports.getActiveNPCs = async function () {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.session_key, ug.group_id, ug.group_order
  FROM user_games ug
  WHERE
    ug.is_active = 1
  AND
    ug.is_bot = 1
  ORDER BY ug.group_id, ug.group_order`;
  const ret = await db.all(q);
  if (settings.benchmark) console.log("Benchmark DB#getActiveNPCs: ", performance.now() - now);
  return ret;
}
exports.getActiveSessions = async function () {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.session_key, ug.group_id, ug.group_order
  FROM user_games ug
  WHERE
    ug.is_active = 1
  ORDER BY ug.group_id, ug.group_order`;
  const ret = await db.all(q);
  if (settings.benchmark) console.log("Benchmark DB#getActiveSessions: ", performance.now() - now);
  return ret;
}
exports.getActiveSessionsGroup = async function (groupID) {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.session_key, ug.group_id, ug.group_order
  FROM user_games ug
  WHERE
    ug.is_active = 1
  AND
    ug.group_id = ?
  ORDER BY ug.group_id, ug.group_order`;
  const ret = await db.all(q, groupID);
  if (settings.benchmark) console.log("Benchmark DB#getActiveSessions: ", performance.now() - now);
  return ret;
}
exports.getNames = async function () {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.username
  FROM user_games ug
  WHERE
    ug.is_active = 1
  ORDER BY
    ug.group_id,
    ug.group_order`;
  const ret = await db.all(q);
  if (settings.benchmark) console.log("Benchmark DB#getNames: ", performance.now() - now);
  return ret.map((r)=>r.username);
}
exports.getUserByIndexes = async function (groupID, groupOrder){
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.session_key, ug.group_id, ug.group_order, ug.username
  FROM user_games ug
  WHERE
    ug.is_active = 1
  AND
    ug.group_id = ?
  AND
    ug.group_order = ?`;
  const ret = await db.get(q, groupID, groupOrder);
  if (settings.benchmark) console.log("Benchmark DB#getUserByIndexes: ", performance.now() - now);
  return ret;
}
exports.insertUserGame = async function(sessionKey, username, group_id, group_order, isBot, isActive, replacesNpc) {
  if (!db) await setup();
  const now = performance.now();

  const q = `
  INSERT INTO user_games (
    session_key,
    username,
    group_id,
    group_order,
    is_bot,
    is_active,
    replaces_npc
  ) VALUES ( ?, ?, ?, ?, ?, ?, ? )`;
  const ret = await db.run(q, sessionKey, username, group_id, group_order, isBot, isActive, replacesNpc);
  if (settings.benchmark) console.log("Benchmark DB#insertUserGame: ", performance.now() - now);
  return ret;
}
exports.insertUserData = async function(records) {
  if (!db) await setup();
  const now = performance.now();
  const values = {};
  Object.keys(records).forEach((item, i) => {
    values[`:${item}`] = records[item];
  });

  const q = `
  REPLACE INTO user_data (
    user_game_id,
    user_loc_x,
    user_loc_y,
    angle,
    group_id,
    group_order,
    frame_number
  ) VALUES (
    ( SELECT id from user_games WHERE session_key = :user_game_id),
    :user_loc_x,
    :user_loc_y,
    :angle,
    :group_id,
    :group_order,
    :frame_number
  )`;
  const ret = await db.run(q, values);
  if (settings.benchmark) console.log("Benchmark DB#insertUserData: ", performance.now() - now);
  return ret;
}
exports.insertNPCGame = async function(sessionKey, username, group_id, group_order) {
  if (!db) await setup();
  const now = performance.now();

  const q = `
  REPLACE INTO user_games (
    session_key,
    username,
    group_id,
    group_order,
    is_bot,
    is_active
  ) VALUES ( ?, ?, ?, ?, ?, ? )`;
  const ret = await db.run(q, sessionKey, username, group_id, group_order, true, true);
  if (settings.benchmark) console.log("Benchmark DB#insertNPCGame: ", performance.now() - now);
  return ret;
}
exports.insertNPCData = async function(records) {
  if (!db) await setup();
  const now = performance.now();
  const values = {};
  Object.keys(records).forEach((item, i) => {
    values[`:${item}`] = records[item];
  });

  const q = `
  REPLACE INTO user_data (
    user_game_id,
    user_loc_x,
    user_loc_y,
    angle,
    group_id,
    group_order,
    frame_number
  ) VALUES (
    ( SELECT id from user_games WHERE session_key = :user_game_id),
    :user_loc_x,
    :user_loc_y,
    :angle,
    :group_id,
    :group_order,
    :frame_number
  )`;
  const ret = await db.run(q, values);
  if (settings.benchmark) console.log("Benchmark DB#insertNPCData: ", performance.now() - now);
  return ret;
}
exports.getUserSession = async function (session_key) {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.*, ud.user_loc_x, ud.user_loc_y
  FROM user_games ug, user_data ud
  WHERE
    ug.session_key = ?
  AND
    ud.user_game_id = ug.id
  ORDER BY ud.frame_number DESC`;
  const ret = await db.get(q, session_key);
  if (settings.benchmark) console.log("Benchmark DB#getUserSession: ", performance.now() - now);
  return ret;
}
exports.getUserSessionID = async function (id) {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  SELECT ug.*, ud.user_loc_x, ud.user_loc_y
  FROM user_games ug, user_data ud
  WHERE
    ug.id = ?
  AND
    ud.user_game_id = ug.id
  ORDER BY ud.frame_number DESC`;
  const ret = await db.get(q, id);
  if (settings.benchmark) console.log("Benchmark DB#getUserSession: ", performance.now() - now);
  return ret;
}
exports.updateSessionActive = async function (id, isActive){
  if (!db) await setup();
  const now = performance.now();
  const q = `
  UPDATE user_games SET is_active = ? WHERE id = ?`;
  const ret = await db.run(q, isActive, id);
  if (settings.benchmark) console.log("Benchmark DB#updateSessionActive: ", performance.now() - now);
  return ret;
}
exports.updateSessionActiveKey = async function (sessionKey, isActive){
  if (!db) await setup();
  const now = performance.now();
  const q = `
  UPDATE user_games SET is_active = ? WHERE session_key = ?`;
  const ret = await db.run(q, isActive, sessionKey);
  if (settings.benchmark) console.log("Benchmark DB#updateSessionActiveKey: ", performance.now() - now);
  return ret;
}
exports.disableUserGames = async function () {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  UPDATE user_games SET is_active = 0 WHERE session_key NOT LIKE 'npc_%'`;
  const ret = await db.run(q);
  if (settings.benchmark) console.log("Benchmark DB#disableUserGames: ", performance.now() - now);
  return ret;
}
exports.truncateTable = async function (tableName) {
  if (!db) await setup();
  const now = performance.now();
  const q = `DELETE FROM ${tableName};`;
  const ret = await db.run(q);
  if (settings.benchmark) console.log("Benchmark DB#truncateTable: ", performance.now() - now);
  return ret;
}
exports.updateUserGameIndexes = async function (sessionKey, groupId, groupOrder) {
  if (!db) await setup();
  const now = performance.now();
  const q = `
  UPDATE user_games SET group_id = ?, group_order = ?
  WHERE session_key = ?`;
  const ret = await db.run(q, groupId, groupOrder, sessionKey);
  if (settings.benchmark) console.log("Benchmark DB#updateSessionActive: ", performance.now() - now);
  return ret;
}
