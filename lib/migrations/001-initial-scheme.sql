--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------


-- 001 -initial-scheme.sql

CREATE TABLE IF NOT EXISTS user_games (
  id INTEGER PRIMARY KEY,
  session_key TEXT UNIQUE,
  username TEXT,
  group_id INTEGER,
  group_order INTEGER,
  is_mobile BOOLEAN default 0,
  self_reflection BOOLEAN,
  herding_percentage INTEGER,
  last_login DATETIME DEFAULT (datetime('now')),
  is_bot BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_data (
  id INTEGER PRIMARY KEY,
  user_game_id INTEGER,
  user_loc_x INTEGER,
  user_loc_y INTEGER,
  angle INTEGER,
  group_id INTEGER,
  group_order INTEGER,
  is_herding BOOLEAN,
  frame_number INTEGER,
  timestamp DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX user_data_user_game_id_frame_number_idx on user_data (user_game_id, frame_number);

-- table where the AI / analyis drops his results
CREATE TABLE user_game_state (
  id INTEGER PRIMARY KEY,
  frame_number INTEGER,
  contents JSON
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE user_games;
DROP INDEX user_data_user_game_id_frame_number_idx;
DROP TABLE user_data;
DROP TABLE user_game_state;
