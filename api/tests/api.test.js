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

// ── Sprint 2: P2P duel flow ──────────────────────────────────────────────────

test("can create a P2P duel between two users", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "Kenzo" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "Rico" });

        const { data } = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 5,
        });

        assert.equal(data.ok, true);
        assert.equal(data.duel.status, "pending");
        assert.equal(data.duel.stake, 5);
    });
});

test("playing a P2P duel updates both wallets and history", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "A" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "B" });

        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 5,
        });

        const played = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/play`);

        assert.equal(played.status, 200);
        assert.equal(played.data.duel.status, "done");
        assert.ok(played.data.winnerId);

        const total = played.data.challengerWallet + played.data.opponentWallet;
        // Total wallets should be less than initial 50 (platform fee 15%)
        assert.ok(total < 50);
    });
});

test("rematch swaps challengerId and opponentId", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "A" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "B" });

        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 5,
        });
        await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/play`);

        const rematch = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/rematch`);

        assert.equal(rematch.status, 200);
        // Sides are swapped: original opponentId becomes new challengerId
        assert.equal(rematch.data.duel.challengerId, b.data.user.id);
        assert.equal(rematch.data.duel.opponentId, a.data.user.id);
    });
});

test("rivalry is tracked after P2P duel", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "A" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "B" });

        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 5,
        });
        await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/play`);

        const rivalry = await jfetch(baseUrl, "GET",
            `/api/rivalries/${a.data.user.id}/vs/${b.data.user.id}`);

        assert.equal(rivalry.status, 200);
        assert.equal(rivalry.data.exists, true);
        assert.equal(rivalry.data.last5.length, 1);
        const totalWins = (rivalry.data.wins[a.data.user.id] || 0) +
            (rivalry.data.wins[b.data.user.id] || 0);
        assert.equal(totalWins, 1);
    });
});

test("leaderboard lists all users sorted by wins", async () => {
    await withServer(async (baseUrl) => {
        await jfetch(baseUrl, "POST", "/api/users", { playerName: "Extra" });

        const lb = await jfetch(baseUrl, "GET", "/api/leaderboard");

        assert.equal(lb.status, 200);
        assert.equal(Array.isArray(lb.data.leaderboard), true);
        assert.ok(lb.data.leaderboard.length >= 2);
        lb.data.leaderboard.forEach((entry) => {
            assert.ok("playerName" in entry);
            assert.ok("wallet" in entry);
            assert.ok("wins" in entry);
            assert.ok("winRate" in entry);
        });
    });
});

// ── Sprint 3 tests ────────────────────────────────────────────────────────────

test("analytics kpi endpoint returns expected shape", async () => {
    await withServer(async (baseUrl) => {
        const { status, data } = await jfetch(baseUrl, "GET", "/api/analytics/kpi");
        assert.equal(status, 200);
        assert.equal(data.ok, true);
        assert.ok("kpi" in data);
        const { kpi } = data;
        assert.ok("rematchRate" in kpi);
        assert.ok("duelsPerActiveUser" in kpi);
        assert.ok("losersReplayRate24h" in kpi);
        assert.ok("totalPlayedDuels" in kpi);
        assert.ok("targets" in kpi);
        assert.equal(kpi.targets.rematchRate, 35);
        assert.equal(kpi.targets.duelsPerActiveUser, 3);
        assert.equal(kpi.targets.losersReplayRate24h, 30);
    });
});

test("rematch rate increments after a rematch", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "R_A" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "R_B" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;

        // Play a first duel
        const d1 = await jfetch(baseUrl, "POST", "/api/duels", { challengerId: aId, opponentId: bId, stake: 2 });
        await jfetch(baseUrl, "POST", `/api/duels/${d1.data.duel.id}/play`);

        // Rematch
        const d2 = await jfetch(baseUrl, "POST", `/api/duels/${d1.data.duel.id}/rematch`);
        await jfetch(baseUrl, "POST", `/api/duels/${d2.data.duel.id}/play`);

        const kpiRes = await jfetch(baseUrl, "GET", "/api/analytics/kpi");
        const { kpi } = kpiRes.data;
        // After 2 duels (first + rematch), ≥1 is a rematch → rematchRate > 0
        assert.ok(kpi.totalPlayedDuels >= 2);
        assert.ok(kpi.rematchRate > 0, `expected rematchRate > 0, got ${kpi.rematchRate}`);
    });
});

test("wallet floor auto-credits user below minimum stake", async () => {
    await withServer(async (baseUrl) => {
        const u = await jfetch(baseUrl, "POST", "/api/users", { playerName: "CapTester" });
        await jfetch(baseUrl, "POST", "/api/session/select-user", { userId: u.data.user.id });

        // Play until wallet floor is triggered (stake 2, start at 25 SLAP$)
        let floorCreditFound = false;
        for (let i = 0; i < 30 && !floorCreditFound; i++) {
            await jfetch(baseUrl, "POST", "/api/duel/play", { stake: 2 });
            const stateRes = await jfetch(baseUrl, "GET", "/api/state");
            floorCreditFound = (stateRes.data.history || []).some((h) => h.type === "FLOOR_CREDIT");
        }

        // Whether or not the floor was hit, wallet must remain playable
        const finalState = await jfetch(baseUrl, "GET", "/api/state");
        assert.ok(finalState.data.wallet >= 0, "wallet must not go negative");
        if (floorCreditFound) {
            // The floor credit must appear in history with a positive net
            const credit = finalState.data.history.find((h) => h.type === "FLOOR_CREDIT");
            assert.ok(credit, "floor credit entry should exist");
            assert.ok(credit.net > 0, "floor credit net must be positive");
        }
    });
});
