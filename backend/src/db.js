const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'kanban.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS columns (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT    NOT NULL UNIQUE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
      member_id   INTEGER REFERENCES members(id) ON DELETE SET NULL,
      priority    TEXT    NOT NULL DEFAULT 'medium' CHECK(priority IN ('urgent','high','medium','low')),
      due_date    TEXT,
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default columns if none exist
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM columns').get().cnt;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO columns (name, position) VALUES (?, ?)');
    const seedColumns = db.transaction(() => {
      insert.run('未着手', 0);
      insert.run('進行中', 1);
      insert.run('完了',   2);
      insert.run('保留',   3);
    });
    seedColumns();
  }
}

migrate();

module.exports = db;
