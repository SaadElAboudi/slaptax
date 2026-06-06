const { Pool } = require("pg");
const { DB_PATH, makeDefaultState, migrateState, readDb, writeDb, resetDb } = require("./db");

function createFileStore(dbPath = DB_PATH) {
    return {
        kind: "file",
        ready: Promise.resolve(),
        read: () => readDb(dbPath),
        write: (data) => writeDb(data, dbPath),
        reset: () => resetDb(dbPath),
        close: async () => {},
    };
}

function createPostgresStore(connectionString) {
    const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
        max: Number(process.env.PG_POOL_SIZE || 4),
    });
    let cache = makeDefaultState();
    let writeQueue = Promise.resolve();

    const ready = (async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_state (
                id TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        const result = await pool.query("SELECT payload FROM app_state WHERE id = $1", ["main"]);
        if (result.rows[0]?.payload) {
            cache = migrateState(result.rows[0].payload);
        } else {
            await persist(cache);
        }
    })();

    function persist(data) {
        const snapshot = JSON.parse(JSON.stringify(data));
        writeQueue = writeQueue.then(() => pool.query(
            `INSERT INTO app_state (id, payload, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (id)
             DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
            ["main", JSON.stringify(snapshot)]
        ));
        writeQueue.catch((error) => {
            process.stderr.write(`PostgreSQL persistence error: ${error.message}\n`);
        });
        return writeQueue;
    }

    return {
        kind: "postgres",
        ready,
        read: () => cache,
        write(data) {
            cache = data;
            void persist(data);
        },
        reset() {
            cache = makeDefaultState();
            void persist(cache);
            return cache;
        },
        async close() {
            await writeQueue;
            await pool.end();
        },
    };
}

function createStore(options = {}) {
    const connectionString = options.databaseUrl ?? process.env.DATABASE_URL;
    if (connectionString) return createPostgresStore(connectionString);
    return createFileStore(options.dbPath || DB_PATH);
}

module.exports = {
    createFileStore,
    createPostgresStore,
    createStore,
};
