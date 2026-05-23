const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "..", "data", "mvp_db.json");

const SCHEMA_VERSION = 2;

const defaultState = {
    schemaVersion: SCHEMA_VERSION,
    currency: "SLAP$",
    activeUserId: "",
    users: [],
};

function makeUser(name = "Player") {
    return {
        id: crypto.randomUUID(),
        playerName: name,
        wallet: 25,
        stake: 5,
        history: [],
    };
}

function makeDefaultState() {
    const user = makeUser("Player");
    return {
        ...defaultState,
        activeUserId: user.id,
        users: [user],
    };
}

function migrateState(raw) {
    if (raw && raw.schemaVersion === SCHEMA_VERSION && Array.isArray(raw.users)) {
        if (!raw.users.length) {
            return makeDefaultState();
        }
        if (!raw.activeUserId || !raw.users.find((u) => u.id === raw.activeUserId)) {
            return { ...raw, activeUserId: raw.users[0].id };
        }
        return raw;
    }

    if (raw && typeof raw === "object" && Array.isArray(raw.history)) {
        const migratedUser = {
            id: crypto.randomUUID(),
            playerName: raw.playerName || "Player",
            wallet: Number(raw.wallet || 25),
            stake: Number(raw.stake || 5),
            history: raw.history,
        };

        return {
            schemaVersion: SCHEMA_VERSION,
            currency: "SLAP$",
            activeUserId: migratedUser.id,
            users: [migratedUser],
        };
    }

    return makeDefaultState();
}

function ensureDbFile(dbPath = DB_PATH) {
    if (fs.existsSync(dbPath)) return;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(makeDefaultState(), null, 2));
}

function readDb(dbPath = DB_PATH) {
    ensureDbFile(dbPath);
    const raw = fs.readFileSync(dbPath, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = migrateState(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        writeDb(normalized, dbPath);
    }
    return normalized;
}

function writeDb(data, dbPath = DB_PATH) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function resetDb(dbPath = DB_PATH) {
    const state = makeDefaultState();
    writeDb(state, dbPath);
    return state;
}

module.exports = {
    DB_PATH,
    SCHEMA_VERSION,
    defaultState,
    makeDefaultState,
    ensureDbFile,
    readDb,
    writeDb,
    resetDb,
};
