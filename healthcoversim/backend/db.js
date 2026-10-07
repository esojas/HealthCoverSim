const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbFile = process.env.DB_FILE || path.join(__dirname, "healthcover.db");
const db = new Database(dbFile);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(__dirname, "init.sql"), "utf8"));

module.exports = db;