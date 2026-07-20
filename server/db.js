const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const DATA_DIR = join(__dirname, 'data');
const DB_PATH = join(DATA_DIR, 'crypto-idle.sqlite');

function openDb(dbPath = DB_PATH) {
  mkdirSync(join(dbPath, '..'), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

function migrate(db) {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = require('node:fs').readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

function run(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function get(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

function all(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

module.exports = { openDb, migrate, run, get, all, DB_PATH };
