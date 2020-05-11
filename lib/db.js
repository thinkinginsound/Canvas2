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
    ud.frame_number >= ?
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
  const q = `
  UPDATE user_data SET is_herding = ? WHERE id in (?)`;
  return await db.run(q, isHerding, records.map(r => r.id));
}
exports.saveAIResponse = async function (response, frame_number) {
  if (!db) await setup();
  return await db.run("INSERT INTO user_game_state (frame_number, contents) VALUES (?, ?)", frame_number, JSON.stringify(response));
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
