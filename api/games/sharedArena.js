const { WebSocket } = require("ws");

const TICK_MS = 1000 / 30;
const BALL_RADIUS = 0.016;
const SYMBOLS = ["◆", "●", "▲", "■", "✦"];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function shuffled(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

function createSharedArenaManager(store, service, emitGlobal = () => {}) {
    const sessions = new Map();
    const clients = new Map();

    function send(client, event) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...event, at: Date.now() }));
        }
    }

    function updatePresence(userId, online) {
        if (!userId) return;
        const db = store.read();
        const user = db.users?.find((entry) => entry.id === userId);
        if (!user) return;
        user.presence = {
            online,
            lastSeenAt: new Date().toISOString(),
        };
        store.write(db);
        emitGlobal({ type: "presence.changed", userId, online });
    }

    function getDuel(duelId) {
        return store.read().duels?.find((duel) => duel.id === duelId) || null;
    }

    function keyFor(duelId, round) {
        return `${duelId}:${round}`;
    }

    function sessionClients(session, role = null) {
        const connected = [];
        for (const clientSet of clients.values()) {
            for (const client of clientSet) {
                if (client.arenaSessionKey !== session.key) continue;
                if (role && client.arenaRole !== role) continue;
                connected.push(client);
            }
        }
        return connected;
    }

    function participantConnected(session, userId) {
        return [...(clients.get(userId) || [])].some(
            (client) => client.arenaSessionKey === session.key && client.arenaRole === "player"
        );
    }

    function connectedPlayers(session) {
        return [session.challengerId, session.opponentId].filter((userId) => participantConnected(session, userId));
    }

    function bothPlayersConnected(session) {
        return connectedPlayers(session).length === 2;
    }

    function createBounceState(duel) {
        return {
            rally: 0,
            perfects: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            combos: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            charges: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            paddles: { [duel.challengerId]: 0.5, [duel.opponentId]: 0.5 },
            debuffs: {},
            balls: [{ id: "main", x: 0.5, y: 0.5, vx: 0.23, vy: 0.31 }],
            obstacleSeed: Math.random() * Math.PI * 2,
            suddenDeath: false,
        };
    }

    function createSymbolState(duel) {
        const length = Math.min(8, 4 + duel.currentRound);
        const sequence = Array.from({ length }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        return {
            sequence,
            reversed: duel.currentRound >= 3,
            palette: shuffled(SYMBOLS),
            progress: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            errors: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            combos: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            lastInputAt: {},
            revealEndsAt: 0,
            inputEndsAt: 0,
        };
    }

    function createBombState(duel) {
        return {
            holderId: duel.challengerId,
            passes: 0,
            fuseEndsAt: 0,
            markerStartedAt: 0,
            markerSpeed: 0.72,
            safeCenter: randomBetween(0.25, 0.75),
            safeWidth: 0.28,
            abilities: {
                [duel.challengerId]: { shield: 1, feint: 1 },
                [duel.opponentId]: { shield: 1, feint: 1 },
            },
            lastAction: null,
        };
    }

    function createSession(duel) {
        const gameId = duel.games?.[duel.currentRound - 1];
        const session = {
            key: keyFor(duel.id, duel.currentRound),
            duelId: duel.id,
            round: duel.currentRound,
            gameId,
            challengerId: duel.challengerId,
            opponentId: duel.opponentId,
            phase: "waiting",
            resumeAt: 0,
            disconnectDeadline: 0,
            disconnectedUserId: null,
            startedAt: 0,
            updatedAt: Date.now(),
            winnerId: null,
            finishReason: "",
            game: gameId === "bounce"
                ? createBounceState(duel)
                : gameId === "symbolrush"
                    ? createSymbolState(duel)
                    : createBombState(duel),
        };
        sessions.set(session.key, session);
        return session;
    }

    function getSession(duel) {
        return sessions.get(keyFor(duel.id, duel.currentRound)) || createSession(duel);
    }

    function publicState(session, now = Date.now()) {
        const common = {
            type: "arena.state",
            duelId: session.duelId,
            round: session.round,
            gameId: session.gameId,
            phase: session.phase,
            resumeAt: session.resumeAt,
            disconnectDeadline: session.disconnectDeadline,
            disconnectedUserId: session.disconnectedUserId,
            challengerId: session.challengerId,
            opponentId: session.opponentId,
            winnerId: session.winnerId,
            finishReason: session.finishReason,
            duration: session.startedAt ? now - session.startedAt : 0,
            connectedPlayers: connectedPlayers(session),
            spectatorCount: sessionClients(session, "spectator").length,
        };

        if (session.gameId === "bounce") {
            const game = session.game;
            const elapsed = session.startedAt ? (now - session.startedAt) / 1000 : 0;
            const shrink = game.suddenDeath ? 0.08 : 0;
            return {
                ...common,
                rally: game.rally,
                perfects: game.perfects,
                combos: game.combos,
                charges: game.charges,
                paddles: game.paddles,
                balls: game.balls,
                paddleWidth: Math.max(0.11, 0.3 - Math.min(16, game.rally) * 0.008 - shrink),
                suddenDeath: game.suddenDeath,
                obstacles: elapsed > 12
                    ? [{
                        x: 0.5 + Math.sin(elapsed * 1.1 + game.obstacleSeed) * 0.25,
                        y: 0.5,
                        width: game.suddenDeath ? 0.28 : 0.2,
                    }]
                    : [],
            };
        }

        if (session.gameId === "symbolrush") {
            const game = session.game;
            return {
                ...common,
                sequence: now < game.revealEndsAt ? game.sequence : [],
                sequenceLength: game.sequence.length,
                reversed: game.reversed,
                palette: game.palette,
                progress: game.progress,
                errors: game.errors,
                combos: game.combos,
                revealEndsAt: game.revealEndsAt,
                inputEndsAt: game.inputEndsAt,
            };
        }

        const game = session.game;
        const wave = ((now - game.markerStartedAt) / 1000 * game.markerSpeed) % 2;
        return {
            ...common,
            holderId: game.holderId,
            passes: game.passes,
            fuseEndsAt: game.fuseEndsAt,
            marker: wave <= 1 ? wave : 2 - wave,
            safeCenter: game.safeCenter,
            safeWidth: game.safeWidth,
            abilities: game.abilities,
            lastAction: game.lastAction,
        };
    }

    function broadcast(session) {
        const event = publicState(session);
        for (const client of sessionClients(session)) send(client, event);
    }

    function startCountdown(session) {
        if (session.phase === "done" || !bothPlayersConnected(session)) return;
        session.phase = "countdown";
        session.resumeAt = Date.now() + 2200;
        session.disconnectDeadline = 0;
        session.disconnectedUserId = null;
        broadcast(session);
    }

    function join(client, payload, spectatorOnly = false) {
        const duel = getDuel(String(payload.duelId || ""));
        const round = Number(payload.round || duel?.currentRound);
        if (!duel || !["pending", "playing", "done"].includes(duel.status)) {
            send(client, { type: "arena.error", error: "Arena not found" });
            return;
        }

        const participant = [duel.challengerId, duel.opponentId].includes(client.userId);
        if (!participant && !spectatorOnly) {
            send(client, { type: "arena.error", error: "Join as spectator to watch this arena" });
            return;
        }
        if (duel.status !== "playing" || duel.currentRound !== round) {
            send(client, { type: "arena.error", error: "This round is not active" });
            return;
        }
        const gameId = duel.games?.[round - 1];
        if (!["bounce", "symbolrush", "bombpass"].includes(gameId)) {
            send(client, { type: "arena.error", error: "This game is not a shared signature game" });
            return;
        }

        const session = getSession(duel);
        client.arenaSessionKey = session.key;
        client.arenaRole = participant && !spectatorOnly ? "player" : "spectator";
        session.updatedAt = Date.now();
        broadcast(session);
        if (bothPlayersConnected(session) && session.phase === "waiting") startCountdown(session);
    }

    function markerHit(game, now) {
        const wave = ((now - game.markerStartedAt) / 1000 * game.markerSpeed) % 2;
        const marker = wave <= 1 ? wave : 2 - wave;
        return Math.abs(marker - game.safeCenter) <= game.safeWidth / 2;
    }

    function finish(session, winnerId, reason) {
        if (session.phase === "done") return;
        session.phase = "done";
        session.winnerId = winnerId;
        session.finishReason = reason;
        session.updatedAt = Date.now();
        const result = service.resolveAuthoritativeDuelRound(session.duelId, session.round, winnerId, {
            duration: session.startedAt ? Date.now() - session.startedAt : 100,
            reason,
        });
        broadcast(session);
        if (result.ok) emitGlobal({ type: "state.changed", scope: `/api/duels/${session.duelId}/rounds` });
    }

    function moveBounce(session, client, payload) {
        const x = Number(payload.x);
        if (!Number.isFinite(x)) return;
        session.game.paddles[client.userId] = clamp(x, 0.07, 0.93);
    }

    function useBouncePower(session, client, payload) {
        const game = session.game;
        if (game.charges[client.userId] < 1) return;
        const rivalId = client.userId === session.challengerId ? session.opponentId : session.challengerId;
        const power = String(payload.power || "");
        if (power === "speed") {
            for (const ball of game.balls) {
                ball.vx *= 1.24;
                ball.vy *= 1.24;
            }
        } else if (power === "shrink") {
            game.debuffs[rivalId] = { until: Date.now() + 7000, shrink: 0.08 };
        } else if (power === "multiball" && game.balls.length === 1) {
            const source = game.balls[0];
            game.balls.push({
                id: `bonus-${Date.now()}`,
                x: source.x,
                y: source.y,
                vx: -source.vx * 0.92,
                vy: source.vy * 1.05,
            });
        } else {
            return;
        }
        game.charges[client.userId] -= 1;
    }

    function answerSymbol(session, client, payload) {
        const game = session.game;
        if (Date.now() < game.revealEndsAt) return;
        const userId = client.userId;
        const progress = game.progress[userId];
        const targetIndex = game.reversed ? game.sequence.length - 1 - progress : progress;
        if (String(payload.symbol || "") !== game.sequence[targetIndex]) {
            game.errors[userId] += 1;
            game.combos[userId] = 0;
            if (game.errors[userId] % 2 === 0) game.palette = shuffled(game.palette);
            return;
        }
        game.progress[userId] += 1;
        game.combos[userId] += 1;
        game.lastInputAt[userId] = Date.now();
        if (game.progress[userId] >= game.sequence.length) {
            finish(session, userId, game.reversed ? "reverse-memory-complete" : "sequence-complete");
        }
    }

    function actBomb(session, client, payload) {
        const game = session.game;
        if (game.holderId !== client.userId) return;
        const rivalId = client.userId === session.challengerId ? session.opponentId : session.challengerId;
        const action = String(payload.action || "pass");
        if (action === "feint" && game.abilities[client.userId].feint > 0) {
            game.abilities[client.userId].feint -= 1;
            game.safeCenter = clamp(1 - game.safeCenter + randomBetween(-0.08, 0.08), 0.18, 0.82);
            game.fuseEndsAt -= 350;
            game.lastAction = { userId: client.userId, action: "feint", at: Date.now() };
            return;
        }
        if (action !== "pass") return;

        if (!markerHit(game, Date.now())) {
            if (game.abilities[client.userId].shield > 0) {
                game.abilities[client.userId].shield -= 1;
                game.lastAction = { userId: client.userId, action: "shield", at: Date.now() };
            } else {
                finish(session, rivalId, "unsafe-pass");
                return;
            }
        }
        game.passes += 1;
        game.holderId = rivalId;
        game.markerStartedAt = Date.now();
        game.markerSpeed = Math.min(1.55, 0.72 + game.passes * 0.075);
        game.safeWidth = Math.max(0.1, 0.28 - game.passes * 0.016);
        game.safeCenter = randomBetween(0.2, 0.8);
        const minimum = Math.max(2100, 5200 - game.passes * 210);
        const maximum = Math.max(minimum + 500, 7600 - game.passes * 260);
        game.fuseEndsAt = Date.now() + randomBetween(minimum, maximum);
        game.lastAction = { userId: client.userId, action: "pass", at: Date.now() };
    }

    function action(client, payload) {
        const session = sessions.get(client.arenaSessionKey);
        if (!session || client.arenaRole !== "player" || session.phase !== "playing") return;
        if (session.gameId === "bounce") {
            if (payload.action === "power") useBouncePower(session, client, payload);
            else moveBounce(session, client, payload);
        } else if (session.gameId === "symbolrush") {
            answerSymbol(session, client, payload);
        } else if (session.gameId === "bombpass") {
            actBomb(session, client, payload);
        }
        session.updatedAt = Date.now();
        broadcast(session);
    }

    function startGame(session, now) {
        session.phase = "playing";
        session.startedAt ||= now;
        if (session.gameId === "symbolrush") {
            session.game.revealEndsAt = now + session.game.sequence.length * 650 + 500;
            session.game.inputEndsAt = session.game.revealEndsAt + 18_000;
        }
        if (session.gameId === "bombpass") {
            session.game.fuseEndsAt = now + randomBetween(6500, 8500);
            session.game.markerStartedAt = now;
        }
    }

    function bouncePaddleWidth(session, userId) {
        const game = session.game;
        const base = Math.max(0.11, 0.3 - Math.min(16, game.rally) * 0.008 - (game.suddenDeath ? 0.08 : 0));
        const debuff = game.debuffs[userId];
        return Math.max(0.08, base - (debuff?.until > Date.now() ? debuff.shrink : 0));
    }

    function tickBounce(session, dt, now) {
        const game = session.game;
        const elapsed = (now - session.startedAt) / 1000;
        game.suddenDeath = elapsed >= 60;
        const obstacle = elapsed > 12
            ? {
                x: 0.5 + Math.sin(elapsed * 1.1 + game.obstacleSeed) * 0.25,
                y: 0.5,
                width: game.suddenDeath ? 0.28 : 0.2,
            }
            : null;

        for (const ball of game.balls) {
            const previousY = ball.y;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            if (ball.x <= BALL_RADIUS || ball.x >= 1 - BALL_RADIUS) {
                ball.x = clamp(ball.x, BALL_RADIUS, 1 - BALL_RADIUS);
                ball.vx *= -1;
            }
            if (
                obstacle
                && ((ball.vy > 0 && previousY < obstacle.y && ball.y >= obstacle.y)
                    || (ball.vy < 0 && previousY > obstacle.y && ball.y <= obstacle.y))
                && Math.abs(ball.x - obstacle.x) <= obstacle.width / 2 + BALL_RADIUS
            ) {
                ball.y = obstacle.y + (ball.vy > 0 ? -BALL_RADIUS : BALL_RADIUS);
                ball.vy *= -1;
                ball.vx += (ball.x - obstacle.x) * 0.12;
            }

            const bottomY = 0.94;
            const topY = 0.06;
            const side = ball.vy > 0 ? session.challengerId : session.opponentId;
            const paddleY = ball.vy > 0 ? bottomY : topY;
            const crossed = ball.vy > 0
                ? previousY + BALL_RADIUS < paddleY && ball.y + BALL_RADIUS >= paddleY
                : previousY - BALL_RADIUS > paddleY && ball.y - BALL_RADIUS <= paddleY;
            if (crossed) {
                const paddle = game.paddles[side];
                const width = bouncePaddleWidth(session, side);
                if (Math.abs(ball.x - paddle) <= width / 2 + BALL_RADIUS) {
                    const impact = (ball.x - paddle) / (width / 2);
                    const perfect = Math.abs(impact) <= 0.24;
                    const speedBoost = game.suddenDeath ? 1.075 : 1.045;
                    const speed = Math.min(game.suddenDeath ? 1.05 : 0.82, Math.hypot(ball.vx, ball.vy) * speedBoost);
                    ball.y = paddleY + (ball.vy > 0 ? -BALL_RADIUS : BALL_RADIUS);
                    ball.vx = speed * clamp(impact, -0.82, 0.82);
                    const vertical = Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * 0.42));
                    ball.vy = ball.vy > 0 ? -vertical : vertical;
                    game.rally += 1;
                    game.combos[side] = perfect ? game.combos[side] + 1 : 0;
                    if (perfect) game.perfects[side] += 1;
                    if (game.combos[side] > 0 && game.combos[side] % 3 === 0) {
                        game.charges[side] = Math.min(2, game.charges[side] + 1);
                    }
                }
            }
            if (ball.y > 1 + BALL_RADIUS * 2) {
                finish(session, session.opponentId, game.suddenDeath ? "sudden-death-miss" : "ball-dropped");
                return;
            }
            if (ball.y < -BALL_RADIUS * 2) {
                finish(session, session.challengerId, game.suddenDeath ? "sudden-death-miss" : "ball-dropped");
                return;
            }
        }
        if (elapsed >= 90) {
            const winnerId = game.perfects[session.challengerId] >= game.perfects[session.opponentId]
                ? session.challengerId
                : session.opponentId;
            finish(session, winnerId, "arena-time-limit");
        }
    }

    function tickSymbol(session, now) {
        const game = session.game;
        if (now < game.inputEndsAt) return;
        const challenger = session.challengerId;
        const opponent = session.opponentId;
        const challengerScore = game.progress[challenger] * 10 - game.errors[challenger] * 2;
        const opponentScore = game.progress[opponent] * 10 - game.errors[opponent] * 2;
        const winnerId = challengerScore === opponentScore
            ? ((game.lastInputAt[challenger] || Infinity) <= (game.lastInputAt[opponent] || Infinity) ? challenger : opponent)
            : (challengerScore > opponentScore ? challenger : opponent);
        finish(session, winnerId, "memory-clock-expired");
    }

    function tickBomb(session, now) {
        if (now < session.game.fuseEndsAt) return;
        const loserId = session.game.holderId;
        const winnerId = loserId === session.challengerId ? session.opponentId : session.challengerId;
        finish(session, winnerId, "bomb-exploded");
    }

    function tickSession(session, dt, now) {
        if (session.phase === "countdown") {
            if (!bothPlayersConnected(session)) {
                session.phase = "waiting";
            } else if (now >= session.resumeAt) {
                startGame(session, now);
            }
            broadcast(session);
            return;
        }
        if (session.phase === "waiting" && session.disconnectDeadline) {
            if (bothPlayersConnected(session)) {
                startCountdown(session);
            } else if (now >= session.disconnectDeadline && session.disconnectedUserId) {
                const winnerId = session.disconnectedUserId === session.challengerId
                    ? session.opponentId
                    : session.challengerId;
                finish(session, winnerId, "disconnect-forfeit");
            }
            return;
        }
        if (session.phase !== "playing") return;
        if (!bothPlayersConnected(session)) return;
        if (session.gameId === "bounce") tickBounce(session, dt, now);
        if (session.gameId === "symbolrush") tickSymbol(session, now);
        if (session.gameId === "bombpass") tickBomb(session, now);
        session.updatedAt = now;
        broadcast(session);
    }

    function handleMessage(client, raw) {
        let payload;
        try {
            payload = JSON.parse(String(raw));
        } catch {
            return;
        }
        if (payload.type === "arena.join" || payload.type === "bounce.join") join(client, payload);
        if (payload.type === "arena.watch") join(client, payload, true);
        if (payload.type === "arena.action") action(client, payload);
        if (payload.type === "bounce.paddle") action(client, { ...payload, action: "move" });
    }

    function attach(client) {
        if (!clients.has(client.userId)) clients.set(client.userId, new Set());
        clients.get(client.userId).add(client);
        updatePresence(client.userId, true);
        client.on("message", (raw) => handleMessage(client, raw));
        client.on("close", () => {
            clients.get(client.userId)?.delete(client);
            if ((clients.get(client.userId)?.size || 0) === 0) updatePresence(client.userId, false);
            const session = sessions.get(client.arenaSessionKey);
            if (!session || client.arenaRole !== "player" || session.phase === "done") return;
            if (participantConnected(session, client.userId)) return;
            session.phase = "waiting";
            session.resumeAt = 0;
            session.disconnectedUserId = client.userId;
            session.disconnectDeadline = Date.now() + 20_000;
            broadcast(session);
        });
    }

    const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, session] of sessions) {
            if (session.phase === "done" && now - session.updatedAt > 60_000) {
                sessions.delete(key);
                continue;
            }
            if (now - session.updatedAt > 15 * 60_000) {
                sessions.delete(key);
                continue;
            }
            tickSession(session, TICK_MS / 1000, now);
        }
    }, TICK_MS);
    interval.unref?.();

    function close() {
        clearInterval(interval);
        sessions.clear();
        clients.clear();
    }

    return { attach, close, sessions };
}

module.exports = { createSharedArenaManager };
