const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createServer } = require("../server");

function makeTempDbPath() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "slaptax-api-test-"));
    return path.join(dir, "mvp_db.json");
}

async function withServer(run) {
    const dbPath = makeTempDbPath();
    const server = createServer({ dbPath });

    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }
}

async function jfetch(baseUrl, method, pathName, body) {
    const res = await fetch(baseUrl + pathName, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    return { status: res.status, data };
}

test("health endpoint is reachable", async () => {
    await withServer(async (baseUrl) => {
        const { status, data } = await jfetch(baseUrl, "GET", "/api/health");
        assert.equal(status, 200);
        assert.equal(data.ok, true);
        assert.equal(data.service, "slaptax-mvp-api");
        assert.equal(data.schemaVersion, 2);
    });
});

test("state includes stats", async () => {
    await withServer(async (baseUrl) => {
        const { status, data } = await jfetch(baseUrl, "GET", "/api/state");
        assert.equal(status, 200);
        assert.equal(data.schemaVersion, 2);
        assert.equal(data.currency, "SLAP$");
        assert.equal(data.playerName, "Player");
        assert.equal(data.wallet, 25);
        assert.equal(Array.isArray(data.users), true);
        assert.equal(data.users.length, 1);
        assert.deepEqual(data.stats, { matches: 0, wins: 0, losses: 0, winRate: 0 });
    });
});

test("can create and select users", async () => {
    await withServer(async (baseUrl) => {
        const created = await jfetch(baseUrl, "POST", "/api/users", { playerName: "Rico" });
        assert.equal(created.status, 200);
        assert.equal(created.data.user.playerName, "Rico");

        const listed = await jfetch(baseUrl, "GET", "/api/users");
        assert.equal(listed.status, 200);
        assert.equal(listed.data.users.length, 2);
        const target = listed.data.users.find((u) => u.playerName === "Player");
        assert.ok(target);

        const selected = await jfetch(baseUrl, "POST", "/api/session/select-user", { userId: target.id });
        assert.equal(selected.status, 200);
        assert.equal(selected.data.activeUserId, target.id);
    });
});

test("stake validation rejects unsupported value", async () => {
    await withServer(async (baseUrl) => {
        const { status, data } = await jfetch(baseUrl, "POST", "/api/stake", { stake: 7 });
        assert.equal(status, 400);
        assert.match(data.error, /stake must be one of/);
    });
});

test("duel updates wallet and history", async () => {
    await withServer(async (baseUrl) => {
        const before = await jfetch(baseUrl, "GET", "/api/state");
        const duel = await jfetch(baseUrl, "POST", "/api/duel/play", { stake: 5 });
        const after = await jfetch(baseUrl, "GET", "/api/state");

        assert.equal(duel.status, 200);
        assert.equal(after.status, 200);
        assert.equal(after.data.history.length, before.data.history.length + 1);
        assert.equal(typeof duel.data.duel.won, "boolean");
        assert.equal(typeof duel.data.wallet, "number");
    });
});

test("tournament validation rejects unsupported size", async () => {
    await withServer(async (baseUrl) => {
        const { status, data } = await jfetch(baseUrl, "POST", "/api/tournament/simulate", {
            size: 12,
            stake: 5,
        });

        assert.equal(status, 400);
        assert.match(data.error, /size must be one of 8, 16, 32/);
    });
});

test("reset restores default state", async () => {
    await withServer(async (baseUrl) => {
        await jfetch(baseUrl, "POST", "/api/users", { playerName: "Saad" });
        await jfetch(baseUrl, "POST", "/api/wallet/topup", { amount: 25 });

        const reset = await jfetch(baseUrl, "POST", "/api/reset");
        const state = await jfetch(baseUrl, "GET", "/api/state");

        assert.equal(reset.status, 200);
        assert.equal(state.data.playerName, "Player");
        assert.equal(state.data.wallet, 25);
        assert.equal(state.data.history.length, 0);
        assert.equal(state.data.users.length, 1);
    });
});
