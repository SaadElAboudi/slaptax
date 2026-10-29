const { Pool } = require("pg");
const { DB_PATH, makeDefaultState, migrateState, readDb, writeDb, resetDb } = require("./db");

function createFileStore(dbPath = DB_PATH) {
    return {
        kind: "file",
        ready: Promise.resolve(),
        read: () => readDb(dbPath),
        write: (data) => writeDb(data, dbPath),
        reset: () => resetDb(dbPath),
        flush:async()=>{},
        close: async () => {},
    };
}

function createPostgresStore(connectionString, options={}) {
    const pool = options.pool || new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
        max: Number(process.env.PG_POOL_SIZE || 4),
    });
    let cache = makeDefaultState();
    let writeQueue = Promise.resolve();

    let lease=null,leaseLost=false;
    function assertLease(){if(leaseLost)throw new Error('Database writer lease lost; restart required');}
    const ready = (async () => {
        lease=await pool.connect();
        lease.on?.('error',()=>{leaseLost=true;});lease.on?.('end',()=>{leaseLost=true;});
        const lock=await lease.query("SELECT pg_try_advisory_lock(742619031) AS acquired");
        if(!lock.rows[0]?.acquired){lease.release();lease=null;throw new Error("Another SlapTax server owns this database. Use a single application instance.");}
        await lease.query(`
            CREATE TABLE IF NOT EXISTS app_state (
                id TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        const result = await lease.query("SELECT payload FROM app_state WHERE id = $1", ["main"]);
        if (result.rows[0]?.payload) {
            cache = migrateState(result.rows[0].payload);
        } else {
            await persist(cache);
        }
    })().catch(async error=>{if(lease){lease.release();lease=null;}await pool.end();throw error;});

    function persist(data) {
        const snapshot = JSON.parse(JSON.stringify(data));
        writeQueue = writeQueue.catch(()=>undefined).then(() => {assertLease();return lease.query(
            `INSERT INTO app_state (id, payload, updated_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (id)
             DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
            ["main", JSON.stringify(snapshot)]
        );});
        writeQueue.catch((error) => {
            process.stderr.write(`PostgreSQL persistence error: ${error.message}\n`);
        });
        return writeQueue;
    }

    return {
        kind: "postgres",
        ready,
        read: () => {assertLease();return structuredClone(cache);},
        write(data) {
            assertLease();
            cache = structuredClone(data);
            void persist(data);
        },
        reset() {
            cache = makeDefaultState();
            void persist(cache);
            return cache;
        },
        async flush(){await writeQueue;},
        async close() {
            try{await writeQueue;}finally{try{if(lease){try{if(!leaseLost)await lease.query("SELECT pg_advisory_unlock(742619031)");}finally{lease.release();lease=null;}}}finally{await pool.end();}}
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
