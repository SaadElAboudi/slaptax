const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "..", "data", "mvp_db.json");

const defaultState = {
    playerName: "Player",
    wallet: 25,
    stake: 5,
    history: [],
};

function ensureDbFile(dbPath = DB_PATH) {
    if (fs.existsSync(dbPath)) return;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(defaultState, null, 2));
}

function readDb(dbPath = DB_PATH) {
    ensureDbFile(dbPath);
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw);
}

function writeDb(data, dbPath = DB_PATH) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function resetDb(dbPath = DB_PATH) {
    writeDb(defaultState, dbPath);
    return { ...defaultState };
}

module.exports = {
    DB_PATH,
    defaultState,
    ensureDbFile,
    readDb,
    writeDb,
    resetDb,
};
