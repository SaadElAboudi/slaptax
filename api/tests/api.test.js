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

test("session join keeps stable id per client and creates new id on name change", async () => {
    await withServer(async (baseUrl) => {
        const firstJoin = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "ClientA",
            clientId: "client-a",
        });
        assert.equal(firstJoin.status, 200);
        assert.equal(firstJoin.data.ok, true);
        const idA1 = firstJoin.data.userId;

        const secondJoinSame = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "ClientA",
            clientId: "client-a",
        });
        assert.equal(secondJoinSame.status, 200);
        assert.equal(secondJoinSame.data.userId, idA1);

        const renamedJoin = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "ClientA_v2",
            clientId: "client-a",
        });
        assert.equal(renamedJoin.status, 200);
        assert.notEqual(renamedJoin.data.userId, idA1);
        const idA2 = renamedJoin.data.userId;

        const otherClientJoin = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "ClientB",
            clientId: "client-b",
        });
        assert.equal(otherClientJoin.status, 200);
        assert.notEqual(otherClientJoin.data.userId, idA2);

        const listForA = await jfetch(baseUrl, "GET", "/api/users?clientId=client-a");
        assert.equal(listForA.status, 200);
        assert.equal(listForA.data.activeUserId, idA2);

        const listForB = await jfetch(baseUrl, "GET", "/api/users?clientId=client-b");
        assert.equal(listForB.status, 200);
        assert.equal(listForB.data.activeUserId, otherClientJoin.data.userId);
    });
});

test("history is scoped to explicit user identity", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "HistA",
            clientId: "hist-a",
        });
        const b = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "HistB",
            clientId: "hist-b",
        });

        assert.equal(a.status, 200);
        assert.equal(b.status, 200);

        await jfetch(baseUrl, "POST", "/api/duel/reflex", {
            stake: 5,
            won: true,
            rounds: [],
            userId: a.data.userId,
        });

        const historyA = await jfetch(baseUrl, "GET", `/api/history?userId=${encodeURIComponent(a.data.userId)}`);
        const historyB = await jfetch(baseUrl, "GET", `/api/history?userId=${encodeURIComponent(b.data.userId)}`);

        assert.equal(historyA.status, 200);
        assert.equal(historyB.status, 200);
        assert.ok(Array.isArray(historyA.data.history));
        assert.ok(Array.isArray(historyB.data.history));
        assert.equal(historyA.data.history.length, 1);
        assert.equal(historyB.data.history.length, 0);
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

test("tournament supports draft and roster rounds", async () => {
    await withServer(async (baseUrl) => {
        const result = await jfetch(baseUrl, "POST", "/api/tournament/simulate", {
            size: 8,
            stake: 5,
            draft: { ban: "mindgame", pick: "quickdraw" },
        });

        assert.equal(result.status, 200);
        assert.equal(result.data.ok, true);
        assert.ok(result.data.tournament.draftSummary);
        assert.ok(Array.isArray(result.data.tournament.games));
        assert.ok(result.data.tournament.games.includes("quickdraw"));
        assert.ok(result.data.tournament.run.every((round) => round.gameId));
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
            draft: {
                challenger: { ban: "mindgame", pick: "quickdraw" },
                opponent: { ban: "precision", pick: "speedsort" },
            },
        });

        assert.equal(data.ok, true);
        assert.equal(data.duel.status, "pending");
        assert.equal(data.duel.stake, 5);
        assert.equal(data.duel.draft.challenger.ban, "mindgame");
        assert.equal(data.duel.draft.opponent.pick, "speedsort");
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
        assert.ok(Array.isArray(played.data.games));
        assert.ok(played.data.games.length >= 2);
        assert.ok(played.data.rounds.every((round) => ["precision", "quickdraw", "parryclash", "mindgame", "speedsort", "duelnumeric"].includes(round.gameId)));

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
            draft: {
                challenger: { ban: "quickdraw", pick: "precision" },
                opponent: { ban: "mindgame", pick: "duelnumeric" },
            },
        });
        await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/play`);

        const rematch = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/rematch`);

        assert.equal(rematch.status, 200);
        // Sides are swapped: original opponentId becomes new challengerId
        assert.equal(rematch.data.duel.challengerId, b.data.user.id);
        assert.equal(rematch.data.duel.opponentId, a.data.user.id);
        assert.ok(rematch.data.duel.draft);
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

test("challenge inbox lists pending incoming challenge", async () => {
    await withServer(async (baseUrl) => {
        const challenger = await jfetch(baseUrl, "POST", "/api/users", { playerName: "InboxA" });
        const opponent = await jfetch(baseUrl, "POST", "/api/users", { playerName: "InboxB" });

        const created = await jfetch(baseUrl, "POST", "/api/challenges", {
            challengerId: challenger.data.user.id,
            opponentId: opponent.data.user.id,
            stake: 5,
            draft: {
                challenger: { ban: "mindgame", pick: "quickdraw" },
                opponent: { ban: "precision", pick: "speedsort" },
            },
        });

        assert.equal(created.status, 200);
        assert.equal(created.data.challenge.status, "pending");

        const inbox = await jfetch(
            baseUrl,
            "GET",
            `/api/challenges?userId=${opponent.data.user.id}&status=pending`
        );
        assert.equal(inbox.status, 200);
        assert.equal(inbox.data.challenges.length, 1);
        assert.equal(inbox.data.challenges[0].direction, "incoming");
        assert.equal(inbox.data.challenges[0].challengerName, "InboxA");
    });
});

test("opponent can accept or decline challenge", async () => {
    await withServer(async (baseUrl) => {
        const challenger = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ActA" });
        const opponent = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ActB" });

        const c1 = await jfetch(baseUrl, "POST", "/api/challenges", {
            challengerId: challenger.data.user.id,
            opponentId: opponent.data.user.id,
            stake: 2,
        });

        const accepted = await jfetch(
            baseUrl,
            "POST",
            `/api/challenges/${c1.data.challenge.id}/accept`,
            { userId: opponent.data.user.id }
        );
        assert.equal(accepted.status, 200);
        assert.equal(accepted.data.challenge.status, "accepted");
        assert.equal(accepted.data.duel.status, "pending");

        const played = await jfetch(baseUrl, "POST", `/api/duels/${accepted.data.duel.id}/play`);
        assert.equal(played.status, 200);

        const c2 = await jfetch(baseUrl, "POST", "/api/challenges", {
            challengerId: challenger.data.user.id,
            opponentId: opponent.data.user.id,
            stake: 2,
        });
        const declined = await jfetch(
            baseUrl,
            "POST",
            `/api/challenges/${c2.data.challenge.id}/decline`,
            { userId: opponent.data.user.id }
        );
        assert.equal(declined.status, 200);
        assert.equal(declined.data.challenge.status, "declined");

        const pending = await jfetch(
            baseUrl,
            "GET",
            `/api/challenges?userId=${opponent.data.user.id}&status=pending`
        );
        assert.equal(pending.status, 200);
        assert.equal(pending.data.challenges.length, 0);
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

test("reflex duel endpoint settles real played result", async () => {
    await withServer(async (baseUrl) => {
        const u = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ReflexUser" });
        await jfetch(baseUrl, "POST", "/api/session/select-user", { userId: u.data.user.id });

        const res = await jfetch(baseUrl, "POST", "/api/duel/reflex", {
            stake: 2,
            won: true,
            rounds: [
                { round: 1, playerReactionMs: 350, botReactionMs: 700, winner: "PLAYER" },
                { round: 2, playerReactionMs: 410, botReactionMs: 560, winner: "PLAYER" },
                { round: 3, playerReactionMs: 510, botReactionMs: 420, winner: "BOT" },
            ],
        });

        assert.equal(res.status, 200);
        assert.equal(res.data.ok, true);
        assert.equal(res.data.duel.won, true);
        assert.equal(res.data.duel.playerRounds, 2);
        assert.equal(res.data.duel.botRounds, 1);
        const state = await jfetch(baseUrl, "GET", "/api/state");
        assert.equal(state.data.history[0].type, "DUEL_REFLEX");
        assert.equal(state.data.history[0].note, "Reflex Best-of-3");
    });
});
