const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            type TEXT, -- 'deposit' or 'withdraw'
            amount REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`);
    }
});

module.exports = db;