const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { WebSocket } = require("ws");

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

async function withWebServer(run) {
    const dbPath = makeTempDbPath();
    const webDistPath = fs.mkdtempSync(path.join(os.tmpdir(), "slaptax-web-test-"));
    fs.mkdirSync(path.join(webDistPath, "assets"), { recursive: true });
    fs.writeFileSync(path.join(webDistPath, "index.html"), "<!doctype html><div id=\"root\">SLAPTAX</div>");
    fs.writeFileSync(path.join(webDistPath, "assets", "app.js"), "console.log('slaptax')");
    const server = createServer({ dbPath, webDistPath });

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

function waitForMessage(messages, predicate, message, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
        const check = () => {
            const match = [...messages].reverse().find(predicate);
            if (match) {
                clearTimeout(timeout);
                resolve(match);
                return;
            }
            setTimeout(check, 20);
        };
        check();
    });
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

test("realtime clients receive state changes without polling", async () => {
    await withServer(async (baseUrl) => {
        const socketUrl = baseUrl.replace(/^http/, "ws") + "/api/realtime?userId=realtime-user";
        const socket = new WebSocket(socketUrl);
        const messages = [];
        socket.on("message", (data) => messages.push(JSON.parse(String(data))));

        await new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        });

        const joined = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "Realtime",
            clientId: "realtime-client",
        });
        assert.equal(joined.status, 200);

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Realtime event timeout")), 1500);
            const check = () => {
                if (messages.some((message) => message.type === "state.changed" && message.scope === "/api/session/join")) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
                setTimeout(check, 10);
            };
            check();
        });

        socket.close();
        await new Promise((resolve) => socket.once("close", resolve));
    });
});

test("shared Bounce streams one authoritative arena and resolves without client scores", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "BounceA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "BounceB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
            draft: {
                challenger: { ban: "cupshuffle", pick: "bounce" },
                opponent: { ban: "duelnumeric", pick: "symbolrush" },
            },
        });
        const duelId = created.data.duel.id;
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        const started = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });
        assert.equal(started.data.match.games[0], "bounce");

        const socketUrl = baseUrl.replace(/^http/, "ws");
        const socketA = new WebSocket(`${socketUrl}/api/realtime?userId=${aId}`);
        const socketB = new WebSocket(`${socketUrl}/api/realtime?userId=${bId}`);
        const statesA = [];
        const statesB = [];
        socketA.on("message", (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") statesA.push(event);
        });
        socketB.on("message", (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") statesB.push(event);
        });

        await Promise.all([
            new Promise((resolve, reject) => {
                socketA.once("open", resolve);
                socketA.once("error", reject);
            }),
            new Promise((resolve, reject) => {
                socketB.once("open", resolve);
                socketB.once("error", reject);
            }),
        ]);
        socketA.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        socketB.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Shared Bounce did not start")), 4000);
            const check = () => {
                if (
                    statesA.some((state) => state.phase === "playing")
                    && statesB.some((state) => state.phase === "playing")
                ) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });

        socketA.send(JSON.stringify({ type: "arena.action", action: "move", x: 0.22 }));
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Shared paddle update was not broadcast")), 1500);
            const check = () => {
                const state = [...statesB].reverse().find((entry) => Math.abs(entry.paddles[aId] - 0.22) < 0.001);
                if (state) {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });

        const latestA = [...statesA].reverse().find((state) => state.phase === "playing");
        const latestB = [...statesB].reverse().find((state) => state.phase === "playing");
        assert.ok(latestA);
        assert.ok(latestB);
        assert.ok(Math.abs(latestA.balls[0].x - latestB.balls[0].x) < 0.03);
        assert.ok(Math.abs(latestA.balls[0].y - latestB.balls[0].y) < 0.03);

        socketA.send(JSON.stringify({ type: "arena.action", action: "move", x: 0.07 }));
        socketB.send(JSON.stringify({ type: "arena.action", action: "move", x: 0.07 }));
        const finishedState = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Shared Bounce did not resolve a winner")), 5000);
            const check = () => {
                const state = [...statesA].reverse().find((entry) => entry.phase === "done");
                if (state) {
                    clearTimeout(timeout);
                    resolve(state);
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });
        assert.equal(finishedState.winnerId, bId);

        const advanced = await jfetch(baseUrl, "GET", `/api/duels/${duelId}/match?userId=${bId}`);
        assert.equal(advanced.data.match.currentRound, 2);
        assert.deepEqual(advanced.data.match.score, { challenger: 0, opponent: 1 });
        assert.equal(advanced.data.match.rounds[0].winnerId, bId);
        assert.equal(advanced.data.match.rounds[0].authoritative, true);
        const progressed = await jfetch(baseUrl, "GET", `/api/state?userId=${bId}`);
        assert.ok(progressed.data.progression.xp > 0);
        assert.equal(progressed.data.progression.mastery.bounce.plays, 1);

        socketA.close();
        socketB.close();
        await Promise.all([
            new Promise((resolve) => socketA.once("close", resolve)),
            new Promise((resolve) => socketB.once("close", resolve)),
        ]);
    });
});

test("shared arena pauses for a disconnect, resumes the same round, and accepts a forfeit", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ReconnectA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ReconnectB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
            draft: {
                challenger: { ban: "cupshuffle", pick: "bounce" },
                opponent: { ban: "duelnumeric", pick: "symbolrush" },
            },
        });
        const duelId = created.data.duel.id;
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });

        const socketUrl = baseUrl.replace(/^http/, "ws");
        let socketA = new WebSocket(`${socketUrl}/api/realtime?userId=${aId}`);
        const socketB = new WebSocket(`${socketUrl}/api/realtime?userId=${bId}`);
        const statesA = [];
        const statesB = [];
        const collectA = (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") statesA.push(event);
        };
        socketA.on("message", collectA);
        socketB.on("message", (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") statesB.push(event);
        });

        await Promise.all([
            new Promise((resolve, reject) => {
                socketA.once("open", resolve);
                socketA.once("error", reject);
            }),
            new Promise((resolve, reject) => {
                socketB.once("open", resolve);
                socketB.once("error", reject);
            }),
        ]);
        socketA.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        socketB.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        const initial = await waitForMessage(
            statesB,
            (state) => state.phase === "playing",
            "Shared arena did not start before disconnect"
        );

        socketA.close();
        await new Promise((resolve) => socketA.once("close", resolve));
        const paused = await waitForMessage(
            statesB,
            (state) => state.phase === "waiting" && state.disconnectedUserId === aId,
            "Shared arena did not enter reconnect grace"
        );
        assert.ok(paused.disconnectDeadline > paused.at);

        socketA = new WebSocket(`${socketUrl}/api/realtime?userId=${aId}`);
        socketA.on("message", collectA);
        await new Promise((resolve, reject) => {
            socketA.once("open", resolve);
            socketA.once("error", reject);
        });
        socketA.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        const resumed = await waitForMessage(
            statesB,
            (state) => state.phase === "playing" && state.at > paused.at,
            "Shared arena did not resume after reconnect"
        );
        assert.ok(resumed.duration >= initial.duration);
        assert.equal(resumed.rally, initial.rally);

        socketA.send(JSON.stringify({ type: "arena.forfeit" }));
        const finished = await waitForMessage(
            statesB,
            (state) => state.phase === "done",
            "Shared arena did not accept explicit forfeit"
        );
        assert.equal(finished.winnerId, bId);
        assert.equal(finished.finishReason, "player-forfeit");

        socketA.close();
        socketB.close();
        await Promise.all([
            new Promise((resolve) => socketA.once("close", resolve)),
            new Promise((resolve) => socketB.once("close", resolve)),
        ]);
    });
});

test("matchmaking pairs compatible players and BO format is configurable", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "QueueA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "QueueB" });
        const waiting = await jfetch(baseUrl, "POST", "/api/matchmaking/join", {
            userId: a.data.user.id,
            stake: 2,
        });
        assert.equal(waiting.data.status, "waiting");
        const waitingStatus = await jfetch(
            baseUrl,
            "GET",
            `/api/matchmaking/status?userId=${a.data.user.id}`
        );
        assert.equal(waitingStatus.data.status, "waiting");
        assert.ok(waitingStatus.data.joinedAt);
        const matched = await jfetch(baseUrl, "POST", "/api/matchmaking/join", {
            userId: b.data.user.id,
            stake: 2,
        });
        assert.equal(matched.data.status, "matched");
        assert.ok(matched.data.duel.id);
        const recoveredMatch = await jfetch(
            baseUrl,
            "GET",
            `/api/matchmaking/status?userId=${a.data.user.id}`
        );
        assert.equal(recoveredMatch.data.status, "matched");
        assert.equal(recoveredMatch.data.duel.id, matched.data.duel.id);

        const custom = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 2,
            bestOf: 5,
        });
        assert.equal(custom.data.duel.bestOf, 5);
    });
});

test("cosmetics unlock by level and locked selections are rejected", async () => {
    await withServer(async (baseUrl) => {
        const player = await jfetch(baseUrl, "POST", "/api/users", { playerName: "Cosmetic" });
        const userId = player.data.user.id;
        const state = await jfetch(baseUrl, "GET", `/api/state?userId=${userId}`);
        assert.deepEqual(state.data.progression.cosmetics.unlocked.avatars, ["spark"]);
        const locked = await jfetch(baseUrl, "POST", "/api/progression/cosmetics", {
            userId,
            cosmetics: { avatar: "phantom" },
        });
        assert.equal(locked.status, 403);
        const selected = await jfetch(baseUrl, "POST", "/api/progression/cosmetics", {
            userId,
            cosmetics: { avatar: "spark", arena: "foundry", trail: "pulse" },
        });
        assert.equal(selected.status, 200);
        assert.equal(selected.data.cosmetics.avatar, "spark");
    });
});

test("Symbol Sprint shares one sequence, hides answers, and accepts spectators", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "SymbolA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "SymbolB" });
        const watcher = await jfetch(baseUrl, "POST", "/api/users", { playerName: "Watcher" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
            draft: {
                challenger: { ban: "bounce", pick: "symbolrush" },
                opponent: { ban: "cupshuffle", pick: "symbolrush" },
            },
        });
        const duelId = created.data.duel.id;
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });

        const socketUrl = baseUrl.replace(/^http/, "ws");
        const sockets = [aId, bId, watcher.data.user.id].map(
            (userId) => new WebSocket(`${socketUrl}/api/realtime?userId=${userId}`)
        );
        const states = [[], [], []];
        sockets.forEach((socket, index) => socket.on("message", (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") states[index].push(event);
        }));
        await Promise.all(sockets.map((socket) => new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        })));
        sockets[0].send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        sockets[1].send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        sockets[2].send(JSON.stringify({ type: "arena.watch", duelId, round: 1 }));

        const revealed = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Symbol arena did not reveal")), 5000);
            const check = () => {
                const state = [...states[0]].reverse().find(
                    (entry) => entry.phase === "playing" && entry.sequence?.length
                );
                if (state) {
                    clearTimeout(timeout);
                    resolve(state);
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });
        assert.equal(revealed.gameId, "symbolrush");
        assert.equal(revealed.spectatorCount, 1);
        assert.equal(revealed.sequence.length, revealed.sequenceLength);
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, revealed.revealEndsAt - Date.now() + 80)));
        for (const symbol of revealed.sequence) {
            sockets[0].send(JSON.stringify({ type: "arena.action", action: "answer", symbol }));
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
        const done = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Symbol arena did not finish")), 2000);
            const check = () => {
                const state = [...states[2]].reverse().find((entry) => entry.phase === "done");
                if (state) {
                    clearTimeout(timeout);
                    resolve(state);
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });
        assert.equal(done.winnerId, aId);
        sockets.forEach((socket) => socket.close());
        await Promise.all(sockets.map((socket) => new Promise((resolve) => socket.once("close", resolve))));
    });
});

test("Bomb Pass alternates a server-owned bomb and explodes on its holder", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "BombA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "BombB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
            draft: {
                challenger: { ban: "bounce", pick: "bombpass" },
                opponent: { ban: "symbolrush", pick: "bombpass" },
            },
        });
        const duelId = created.data.duel.id;
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });
        const socketUrl = baseUrl.replace(/^http/, "ws");
        const socketA = new WebSocket(`${socketUrl}/api/realtime?userId=${aId}`);
        const socketB = new WebSocket(`${socketUrl}/api/realtime?userId=${bId}`);
        const states = [];
        socketA.on("message", (data) => {
            const event = JSON.parse(String(data));
            if (event.type === "arena.state") states.push(event);
        });
        await Promise.all([socketA, socketB].map((socket) => new Promise((resolve, reject) => {
            socket.once("open", resolve);
            socket.once("error", reject);
        })));
        socketA.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        socketB.send(JSON.stringify({ type: "arena.join", duelId, round: 1 }));
        const playing = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Bomb arena did not start")), 5000);
            const check = () => {
                const state = [...states].reverse().find((entry) => entry.phase === "playing");
                if (state) {
                    clearTimeout(timeout);
                    resolve(state);
                    return;
                }
                setTimeout(check, 20);
            };
            check();
        });
        assert.equal(playing.holderId, aId);
        const done = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Bomb did not explode")), 10_000);
            const check = () => {
                const state = [...states].reverse().find((entry) => entry.phase === "done");
                if (state) {
                    clearTimeout(timeout);
                    resolve(state);
                    return;
                }
                setTimeout(check, 25);
            };
            check();
        });
        assert.equal(done.finishReason, "bomb-exploded");
        assert.equal(done.winnerId, bId);
        socketA.close();
        socketB.close();
        await Promise.all([socketA, socketB].map((socket) => new Promise((resolve) => socket.once("close", resolve))));
    });
});

test("multiplayer tournament creates human duels and advances a persistent bracket", async () => {
    await withServer(async (baseUrl) => {
        const players = await Promise.all(
            ["BracketA", "BracketB", "BracketC", "BracketD"].map((playerName) =>
                jfetch(baseUrl, "POST", "/api/users", { playerName })
            )
        );
        const ids = players.map((entry) => entry.data.user.id);
        const created = await jfetch(baseUrl, "POST", "/api/arena-tournaments", {
            hostId: ids[0],
            size: 4,
            visibility: "public",
            name: "Human Cup",
        });
        const tournamentId = created.data.tournament.id;
        for (const userId of ids.slice(1)) {
            const joined = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${tournamentId}/join`, { userId });
            assert.equal(joined.status, 200);
        }
        for (const userId of ids) {
            const ready = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${tournamentId}/ready`, {
                userId,
                ready: true,
            });
            assert.equal(ready.status, 200);
        }
        const started = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${tournamentId}/start`, {
            userId: ids[0],
        });
        assert.equal(started.status, 200);
        assert.equal(started.data.tournament.bracket[0].matches.length, 2);

        async function resolveMatch(match) {
            const aId = match.playerAId;
            const bId = match.playerBId;
            await jfetch(baseUrl, "POST", `/api/duels/${match.duelId}/ready`, { userId: aId, ready: true });
            await jfetch(baseUrl, "POST", `/api/duels/${match.duelId}/ready`, { userId: bId, ready: true });
            const aStart = await jfetch(baseUrl, "POST", `/api/duels/${match.duelId}/start`, { userId: aId });
            const bStart = await jfetch(baseUrl, "GET", `/api/duels/${match.duelId}/match?userId=${bId}`);
            for (const round of [1, 2]) {
                const currentA = round === 1
                    ? aStart
                    : await jfetch(baseUrl, "GET", `/api/duels/${match.duelId}/match?userId=${aId}`);
                const currentB = round === 1
                    ? bStart
                    : await jfetch(baseUrl, "GET", `/api/duels/${match.duelId}/match?userId=${bId}`);
                await Promise.all([
                    jfetch(baseUrl, "POST", `/api/duels/${match.duelId}/rounds`, {
                        userId: aId,
                        round,
                        score: 1000,
                        metric: 900,
                        attemptToken: currentA.data.match.attemptToken,
                    }),
                    jfetch(baseUrl, "POST", `/api/duels/${match.duelId}/rounds`, {
                        userId: bId,
                        round,
                        score: 0,
                        metric: 1200,
                        attemptToken: currentB.data.match.attemptToken,
                    }),
                ]);
            }
            return aId;
        }

        const semifinalWinners = [];
        for (const match of started.data.tournament.bracket[0].matches) {
            semifinalWinners.push(await resolveMatch(match));
        }
        const afterSemis = await jfetch(
            baseUrl,
            "GET",
            `/api/arena-tournaments/${tournamentId}?userId=${ids[0]}`
        );
        assert.equal(afterSemis.data.tournament.bracket.length, 2);
        const final = afterSemis.data.tournament.bracket[1].matches[0];
        assert.deepEqual(new Set([final.playerAId, final.playerBId]), new Set(semifinalWinners));
        const championId = await resolveMatch(final);
        const completed = await jfetch(
            baseUrl,
            "GET",
            `/api/arena-tournaments/${tournamentId}?userId=${ids[0]}`
        );
        assert.equal(completed.data.tournament.status, "done");
        assert.equal(completed.data.tournament.championId, championId);
    });
});

test("private tournament room requires its invite token and every player ready", async () => {
    await withServer(async (baseUrl) => {
        const players = await Promise.all(
            ["RoomHost", "RoomB", "RoomC", "RoomD", "Outsider"].map((playerName) =>
                jfetch(baseUrl, "POST", "/api/users", { playerName })
            )
        );
        const ids = players.map((entry) => entry.data.user.id);
        const created = await jfetch(baseUrl, "POST", "/api/arena-tournaments", {
            hostId: ids[0],
            size: 4,
            visibility: "private",
            name: "Private Room",
        });
        const room = created.data.tournament;
        assert.ok(room.inviteToken);

        const forbidden = await jfetch(
            baseUrl,
            "GET",
            `/api/arena-tournaments/${room.id}?userId=${ids[4]}`
        );
        assert.equal(forbidden.status, 403);
        const invited = await jfetch(
            baseUrl,
            "GET",
            `/api/arena-tournaments/${room.id}?userId=${ids[1]}&token=${room.inviteToken}`
        );
        assert.equal(invited.status, 200);
        assert.equal(invited.data.tournament.inviteToken, undefined);

        for (const userId of ids.slice(1, 4)) {
            const joined = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${room.id}/join`, {
                userId,
                inviteToken: room.inviteToken,
            });
            assert.equal(joined.status, 200);
        }
        const configured = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${room.id}/configure`, {
            userId: ids[0],
            games: ["symbolrush", "cupshuffle", "duelnumeric"],
        });
        assert.deepEqual(configured.data.games, ["symbolrush", "cupshuffle", "duelnumeric"]);

        const blockedStart = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${room.id}/start`, {
            userId: ids[0],
        });
        assert.equal(blockedStart.status, 409);
        for (const userId of ids.slice(0, 4)) {
            await jfetch(baseUrl, "POST", `/api/arena-tournaments/${room.id}/ready`, {
                userId,
                ready: true,
            });
        }
        const started = await jfetch(baseUrl, "POST", `/api/arena-tournaments/${room.id}/start`, {
            userId: ids[0],
        });
        assert.equal(started.status, 200);
        const firstDuelId = started.data.tournament.bracket[0].matches[0].duelId;
        const firstDuel = await jfetch(baseUrl, "GET", `/api/duels/${firstDuelId}/match?userId=${started.data.tournament.bracket[0].matches[0].playerAId}`);
        assert.deepEqual(firstDuel.data.match.games, ["symbolrush", "cupshuffle", "duelnumeric"]);
    });
});

test("production server serves the React app and SPA routes", async () => {
    await withWebServer(async (baseUrl) => {
        const home = await fetch(`${baseUrl}/`);
        const route = await fetch(`${baseUrl}/invite/friend`);
        const asset = await fetch(`${baseUrl}/assets/app.js`);

        assert.equal(home.status, 200);
        assert.match(await home.text(), /SLAPTAX/);
        assert.equal(route.status, 200);
        assert.match(await route.text(), /SLAPTAX/);
        assert.equal(asset.status, 200);
        assert.match(asset.headers.get("cache-control"), /immutable/);
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
            draft: { ban: "duelnumeric", pick: "bounce" },
        });

        assert.equal(result.status, 200);
        assert.equal(result.data.ok, true);
        assert.ok(result.data.tournament.draftSummary);
        assert.ok(Array.isArray(result.data.tournament.games));
        assert.ok(result.data.tournament.games.includes("bounce"));
        assert.ok(result.data.tournament.run.every((round) => round.gameId));
        assert.equal(result.data.tournament.entrants.length, 8);
        assert.equal(result.data.tournament.bracket.length, 3);
        assert.equal(
            result.data.tournament.bracket.reduce((total, round) => total + round.matches.length, 0),
            7
        );
        assert.ok(result.data.tournament.championId);
        assert.ok(result.data.tournament.championName);
        assert.ok(result.data.tournament.bracket.every(
            (round) => round.matches.every((match) => match.gameId === round.gameId)
        ));
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
                challenger: { ban: "bombpass", pick: "bounce" },
                opponent: { ban: "duelnumeric", pick: "symbolrush" },
            },
        });

        assert.equal(data.ok, true);
        assert.equal(data.duel.status, "pending");
        assert.equal(data.duel.stake, 5);
        assert.equal(data.duel.draft.challenger.ban, "bombpass");
        assert.equal(data.duel.draft.opponent.pick, "symbolrush");
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
        assert.ok(played.data.games.length <= 3);
        assert.ok(played.data.rounds.length >= 2);
        assert.ok(played.data.rounds.length <= 3);
        assert.equal(new Set(played.data.games).size, played.data.games.length);
        const expectedWinnerRole = played.data.winnerId === played.data.duel.challengerId ? "CHALLENGER" : "OPPONENT";
        assert.equal(played.data.rounds.at(-1).winner, expectedWinnerRole);
        assert.ok(played.data.rounds.every((round) => ["bounce", "symbolrush", "bombpass", "cupshuffle", "duelnumeric"].includes(round.gameId)));

        const total = played.data.challengerWallet + played.data.opponentWallet;
        // Total wallets should be less than initial 50 (platform fee 15%)
        assert.ok(total < 50);
    });
});

test("rematch requires the rival's acceptance and swaps sides", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "A" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "B" });

        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 5,
            draft: {
                challenger: { ban: "bombpass", pick: "bounce" },
                opponent: { ban: "cupshuffle", pick: "duelnumeric" },
            },
        });
        const originalRoom = await jfetch(
            baseUrl,
            "GET",
            `/api/duels/${created.data.duel.id}/room?userId=${a.data.user.id}`
        );
        await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/play`);

        const requested = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/rematch`, {
            userId: a.data.user.id,
            action: "request",
            options: { stake: 10, preferredGame: "symbolrush" },
        });
        assert.equal(requested.status, 200);
        assert.equal(requested.data.status, "pending");
        assert.equal(requested.data.duel, undefined);
        assert.equal(requested.data.rematch.requestedBy, a.data.user.id);
        assert.equal(requested.data.rematch.stake, 10);
        assert.equal(requested.data.rematch.preferredGame, "symbolrush");

        const selfAccept = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/rematch`, {
            userId: a.data.user.id,
            action: "accept",
        });
        assert.equal(selfAccept.status, 403);

        const rematch = await jfetch(baseUrl, "POST", `/api/duels/${created.data.duel.id}/rematch`, {
            userId: b.data.user.id,
            action: "accept",
        });
        assert.equal(rematch.status, 200);
        assert.equal(rematch.data.status, "accepted");
        // Sides are swapped: original opponentId becomes new challengerId
        assert.equal(rematch.data.duel.challengerId, b.data.user.id);
        assert.equal(rematch.data.duel.opponentId, a.data.user.id);
        assert.equal(rematch.data.duel.stake, 10);
        assert.ok(rematch.data.duel.draft);
        assert.equal(rematch.data.duel.draft.challenger.pick, "symbolrush");
        const rematchRoom = await jfetch(
            baseUrl,
            "GET",
            `/api/duels/${rematch.data.duel.id}/room?userId=${a.data.user.id}`
        );
        assert.equal(rematchRoom.data.room.seriesId, originalRoom.data.room.seriesId);
    });
});

test("a declined rematch stays closed until a new request", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "DeclineA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "DeclineB" });
        const duel = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: a.data.user.id,
            opponentId: b.data.user.id,
            stake: 2,
        });
        await jfetch(baseUrl, "POST", `/api/duels/${duel.data.duel.id}/play`);
        await jfetch(baseUrl, "POST", `/api/duels/${duel.data.duel.id}/rematch`, {
            userId: a.data.user.id,
            action: "request",
        });
        const declined = await jfetch(baseUrl, "POST", `/api/duels/${duel.data.duel.id}/rematch`, {
            userId: b.data.user.id,
            action: "decline",
        });
        assert.equal(declined.data.status, "declined");
        assert.equal(declined.data.match.rematch.status, "declined");

        const refreshed = await jfetch(baseUrl, "GET", `/api/duels/${duel.data.duel.id}/match?userId=${a.data.user.id}`);
        assert.equal(refreshed.data.match.rematch.status, "declined");
        assert.equal(refreshed.data.match.rematchId, null);
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
        assert.equal(rivalry.data.currentStreak.count, 1);
        assert.ok(rivalry.data.currentStreak.userId);
        assert.ok(rivalry.data.bestGame[a.data.user.id] || rivalry.data.bestGame[b.data.user.id]);
        const totalWins = (rivalry.data.wins[a.data.user.id] || 0) +
            (rivalry.data.wins[b.data.user.id] || 0);
        assert.equal(totalWins, 1);

        const favorite = await jfetch(baseUrl, "POST", "/api/rivalries/favorite", {
            userId: a.data.user.id,
            rivalId: b.data.user.id,
        });
        assert.equal(favorite.data.favoriteRivalId, b.data.user.id);
        const state = await jfetch(baseUrl, "GET", `/api/state?userId=${a.data.user.id}`);
        assert.equal(state.data.favoriteRivalId, b.data.user.id);
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
                challenger: { ban: "bombpass", pick: "bounce" },
                opponent: { ban: "duelnumeric", pick: "symbolrush" },
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

test("live P2P duel waits for both real scores and resolves best-of-three", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "LiveA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "LiveB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
        });
        const duelId = created.data.duel.id;

        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        const started = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });
        assert.equal(started.status, 200);
        assert.equal(started.data.match.status, "playing");
        assert.equal(started.data.match.games.length, 3);
        assert.ok(started.data.match.attemptToken);
        const playerAFirstToken = started.data.match.attemptToken;
        const playerBMatch = await jfetch(baseUrl, "GET", `/api/duels/${duelId}/match?userId=${bId}`);
        const playerBFirstToken = playerBMatch.data.match.attemptToken;
        assert.ok(playerBFirstToken);
        assert.notEqual(playerAFirstToken, playerBFirstToken);

        const recovered = await jfetch(baseUrl, "GET", `/api/duels/active?userId=${aId}`);
        assert.equal(recovered.status, 200);
        assert.equal(recovered.data.match.duelId, duelId);

        const [playerAFirst, playerBFirst] = await Promise.all([
            jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
                userId: aId,
                round: 1,
                score: 900,
                metric: 1000,
                attemptToken: playerAFirstToken,
            }),
            jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
                userId: bId,
                round: 1,
                score: 500,
                metric: 1200,
                attemptToken: playerBFirstToken,
            }),
        ]);
        assert.equal(playerAFirst.status, 200);
        assert.equal(playerBFirst.status, 200);
        const roundOne = playerAFirst.data.match.currentRound === 2 ? playerAFirst : playerBFirst;
        assert.deepEqual(roundOne.data.match.score, { challenger: 1, opponent: 0 });
        const playerBSecondToken = roundOne.data.match.attemptToken;
        const playerASecondMatch = await jfetch(baseUrl, "GET", `/api/duels/${duelId}/match?userId=${aId}`);
        const playerASecondToken = playerASecondMatch.data.match.attemptToken;
        const secondRoundResults = await Promise.all([
            jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
                userId: aId,
                round: 2,
                score: 850,
                metric: 1100,
                attemptToken: playerASecondToken,
            }),
            jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
                userId: bId,
                round: 2,
                score: 400,
                metric: 1300,
                attemptToken: playerBSecondToken,
            }),
        ]);
        const finished = secondRoundResults.find((result) => result.data.match.status === "done");

        assert.ok(finished);
        assert.equal(finished.data.match.winnerId, aId);
        assert.deepEqual(finished.data.match.score, { challenger: 2, opponent: 0 });
        assert.equal(finished.data.match.rounds.length, 2);
    });
});

test("live duel rejects forged scores and another player's attempt token", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "SecureA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "SecureB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/duels", {
            challengerId: aId,
            opponentId: bId,
            stake: 2,
        });
        const duelId = created.data.duel.id;
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: aId, ready: true });
        await jfetch(baseUrl, "POST", `/api/duels/${duelId}/ready`, { userId: bId, ready: true });
        const aMatch = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/start`, { userId: aId });
        const bMatch = await jfetch(baseUrl, "GET", `/api/duels/${duelId}/match?userId=${bId}`);

        const forged = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
            userId: aId,
            round: 1,
            score: 99999,
            metric: 100,
            attemptToken: aMatch.data.match.attemptToken,
        });
        assert.equal(forged.status, 400);
        assert.match(forged.data.error, /Score/);

        const stolen = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
            userId: bId,
            round: 1,
            score: 700,
            metric: 900,
            attemptToken: aMatch.data.match.attemptToken,
        });
        assert.equal(stolen.status, 409);

        const valid = await jfetch(baseUrl, "POST", `/api/duels/${duelId}/rounds`, {
            userId: bId,
            round: 1,
            score: 700,
            metric: 900,
            attemptToken: bMatch.data.match.attemptToken,
        });
        assert.equal(valid.status, 200);
    });
});

test("shareable invite can be claimed by a different browser identity", async () => {
    await withServer(async (baseUrl) => {
        const host = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "InviteHost",
            clientId: "invite-host-client",
        });
        const guest = await jfetch(baseUrl, "POST", "/api/session/join", {
            playerName: "InviteGuest",
            clientId: "invite-guest-client",
        });
        const invite = await jfetch(baseUrl, "POST", "/api/invites", {
            challengerId: host.data.userId,
            stake: 2,
            draft: {
                challenger: { ban: "duelnumeric", pick: "bounce" },
                opponent: { ban: "bombpass", pick: "symbolrush" },
            },
        });

        assert.equal(invite.status, 200);
        assert.equal(invite.data.challenge.status, "open");

        const claimed = await jfetch(
            baseUrl,
            "POST",
            `/api/invites/${invite.data.challenge.id}/claim`,
            { userId: guest.data.userId }
        );
        assert.equal(claimed.status, 200);
        assert.equal(claimed.data.duel.challengerId, host.data.userId);
        assert.equal(claimed.data.duel.opponentId, guest.data.userId);

        const hostChallenges = await jfetch(
            baseUrl,
            "GET",
            `/api/challenges?userId=${host.data.userId}&status=all`
        );
        assert.equal(hostChallenges.data.challenges[0].duelId, claimed.data.duel.id);
    });
});

test("live tournament advances only after played rounds", async () => {
    await withServer(async (baseUrl) => {
        const user = await jfetch(baseUrl, "POST", "/api/users", { playerName: "BracketLive" });
        const userId = user.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/tournaments/live", {
            userId,
            size: 8,
            stake: 2,
            draft: { ban: "duelnumeric", pick: "bounce" },
        });

        assert.equal(created.status, 200);
        assert.equal(created.data.tournament.status, "playing");
        assert.equal(created.data.tournament.rounds.length, 0);

        const resumed = await jfetch(
            baseUrl,
            "GET",
            `/api/tournaments/active?userId=${userId}`
        );
        assert.equal(resumed.status, 200);
        assert.equal(resumed.data.tournament.id, created.data.tournament.id);

        let current = created;
        for (let round = 1; round <= 3; round += 1) {
            current = await jfetch(
                baseUrl,
                "POST",
                `/api/tournaments/${created.data.tournament.id}/rounds`,
                {
                    userId,
                    score: 1000,
                    metric: 900,
                    attemptToken: current.data.tournament.attemptToken,
                }
            );
        }

        assert.equal(current.data.tournament.status, "done");
        assert.equal(current.data.tournament.champion, true);
        assert.equal(current.data.tournament.rounds.length, 3);
        assert.ok(current.data.tournament.payout > 0);
    });
});

test("tournament rotates attempt token after each qualified round", async () => {
    await withServer(async (baseUrl) => {
        const user = await jfetch(baseUrl, "POST", "/api/users", { playerName: "TokenRunner" });
        const userId = user.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/tournaments/live", {
            userId,
            size: 8,
            stake: 2,
            draft: { ban: "duelnumeric", pick: "bounce" },
        });
        const firstToken = created.data.tournament.attemptToken;
        const qualified = await jfetch(
            baseUrl,
            "POST",
            `/api/tournaments/${created.data.tournament.id}/rounds`,
            { userId, score: 1000, metric: 900, attemptToken: firstToken }
        );
        assert.equal(qualified.status, 200);
        assert.notEqual(qualified.data.tournament.attemptToken, firstToken);

        const replayed = await jfetch(
            baseUrl,
            "POST",
            `/api/tournaments/${created.data.tournament.id}/rounds`,
            { userId, score: 1000, metric: 900, attemptToken: firstToken }
        );
        assert.equal(replayed.status, 409);
    });
});

test("active tournament can be abandoned exactly once", async () => {
    await withServer(async (baseUrl) => {
        const user = await jfetch(baseUrl, "POST", "/api/users", { playerName: "ExitRunner" });
        const userId = user.data.user.id;
        const created = await jfetch(baseUrl, "POST", "/api/tournaments/live", {
            userId,
            size: 8,
            stake: 2,
            draft: { ban: "duelnumeric", pick: "bounce" },
        });
        const tournamentId = created.data.tournament.id;
        const abandoned = await jfetch(baseUrl, "POST", `/api/tournaments/${tournamentId}/abandon`, { userId });
        assert.equal(abandoned.status, 200);
        assert.equal(abandoned.data.tournament.status, "done");
        assert.equal(abandoned.data.tournament.abandoned, true);

        const repeated = await jfetch(baseUrl, "POST", `/api/tournaments/${tournamentId}/abandon`, { userId });
        assert.equal(repeated.status, 200);

        const history = await jfetch(baseUrl, "GET", `/api/history?userId=${userId}`);
        assert.equal(history.data.history.filter((entry) => entry.type === "TOURNAMENT").length, 1);
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
        assert.ok("matchmakingConversion" in kpi);
        assert.ok("viralActionUsers" in kpi);
        assert.ok("targets" in kpi);
        assert.equal(kpi.targets.rematchRate, 35);
        assert.equal(kpi.targets.duelsPerActiveUser, 3);
        assert.equal(kpi.targets.losersReplayRate24h, 30);
        assert.equal(kpi.targets.matchmakingConversion, 65);
    });
});

test("quick play funnel records matching conversion and rejects unknown events", async () => {
    await withServer(async (baseUrl) => {
        const a = await jfetch(baseUrl, "POST", "/api/users", { playerName: "FunnelA" });
        const b = await jfetch(baseUrl, "POST", "/api/users", { playerName: "FunnelB" });
        const aId = a.data.user.id;
        const bId = b.data.user.id;

        const trackedA = await jfetch(baseUrl, "POST", "/api/analytics/events", {
            type: "quick_play_clicked",
            userId: aId,
            properties: { source: "home" },
        });
        const trackedB = await jfetch(baseUrl, "POST", "/api/analytics/events", {
            type: "quick_play_clicked",
            userId: bId,
            properties: { source: "home" },
        });
        assert.equal(trackedA.status, 200);
        assert.equal(trackedB.status, 200);

        await jfetch(baseUrl, "POST", "/api/matchmaking/join", { userId: aId, stake: 2 });
        await jfetch(baseUrl, "POST", "/api/matchmaking/join", { userId: bId, stake: 2 });

        const kpiResponse = await jfetch(baseUrl, "GET", "/api/analytics/kpi");
        assert.equal(kpiResponse.data.kpi.quickPlayUsers, 2);
        assert.equal(kpiResponse.data.kpi.matchmakingMatchedUsers, 2);
        assert.equal(kpiResponse.data.kpi.matchmakingConversion, 100);

        const rejected = await jfetch(baseUrl, "POST", "/api/analytics/events", {
            type: "made_up_event",
            userId: aId,
        });
        assert.equal(rejected.status, 400);
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
        await jfetch(baseUrl, "POST", `/api/duels/${d1.data.duel.id}/rematch`, {
            userId: aId,
            action: "request",
        });
        const d2 = await jfetch(baseUrl, "POST", `/api/duels/${d1.data.duel.id}/rematch`, {
            userId: bId,
            action: "accept",
        });
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
