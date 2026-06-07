const { WebSocket } = require("ws");

const TICK_MS = 1000 / 30;
const PADDLE_HEIGHT = 0.022;
const BALL_RADIUS = 0.016;

function createSharedBounceManager(store) {
    const sessions = new Map();
    const clients = new Map();

    function send(client, event) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ ...event, at: Date.now() }));
        }
    }

    function getDuel(duelId) {
        const db = store.read();
        return db.duels?.find((duel) => duel.id === duelId) || null;
    }

    function sessionKey(duelId, round) {
        return `${duelId}:${round}`;
    }

    function createSession(duel) {
        const round = duel.currentRound;
        const key = sessionKey(duel.id, round);
        const session = {
            key,
            duelId: duel.id,
            round,
            challengerId: duel.challengerId,
            opponentId: duel.opponentId,
            phase: "waiting",
            resumeAt: 0,
            updatedAt: Date.now(),
            startedAt: 0,
            rally: 0,
            ball: { x: 0.5, y: 0.5, vx: 0.23, vy: 0.31 },
            paddles: {
                [duel.challengerId]: 0.5,
                [duel.opponentId]: 0.5,
            },
            winnerId: null,
        };
        sessions.set(key, session);
        return session;
    }

    function getSession(duel) {
        const key = sessionKey(duel.id, duel.currentRound);
        return sessions.get(key) || createSession(duel);
    }

    function participantConnected(session, userId) {
        return [...(clients.get(userId) || [])].some((client) => client.bounceSessionKey === session.key);
    }

    function bothConnected(session) {
        return participantConnected(session, session.challengerId)
            && participantConnected(session, session.opponentId);
    }

    function publicState(session) {
        const paddleWidth = Math.max(0.13, 0.3 - Math.min(16, session.rally) * 0.009);
        return {
            type: "bounce.state",
            duelId: session.duelId,
            round: session.round,
            phase: session.phase,
            resumeAt: session.resumeAt,
            rally: session.rally,
            ball: session.ball,
            paddles: session.paddles,
            paddleWidth,
            challengerId: session.challengerId,
            opponentId: session.opponentId,
            winnerId: session.winnerId,
            duration: session.startedAt ? Date.now() - session.startedAt : 0,
        };
    }

    function broadcastSession(session) {
        const event = publicState(session);
        for (const userId of [session.challengerId, session.opponentId]) {
            for (const client of clients.get(userId) || []) {
                if (client.bounceSessionKey === session.key) send(client, event);
            }
        }
    }

    function scheduleResume(session) {
        if (session.phase === "done" || !bothConnected(session)) return;
        if (session.phase === "playing") return;
        session.phase = "countdown";
        session.resumeAt = Date.now() + 1800;
        broadcastSession(session);
    }

    function join(client, payload) {
        const duel = getDuel(String(payload.duelId || ""));
        const round = Number(payload.round);
        if (!duel || duel.status !== "playing" || duel.currentRound !== round) {
            send(client, { type: "bounce.error", error: "Shared Bounce round is not active" });
            return;
        }
        if (![duel.challengerId, duel.opponentId].includes(client.userId)) {
            send(client, { type: "bounce.error", error: "Player is not part of this duel" });
            return;
        }
        if (duel.games?.[round - 1] !== "bounce") {
            send(client, { type: "bounce.error", error: "Current duel round is not Bounce Panic" });
            return;
        }

        const session = getSession(duel);
        client.bounceSessionKey = session.key;
        client.bounceUserId = client.userId;
        session.updatedAt = Date.now();
        broadcastSession(session);
        scheduleResume(session);
    }

    function movePaddle(client, payload) {
        const session = sessions.get(client.bounceSessionKey);
        if (!session || session.phase === "done") return;
        const x = Number(payload.x);
        if (!Number.isFinite(x)) return;
        session.paddles[client.userId] = Math.max(0.07, Math.min(0.93, x));
        session.updatedAt = Date.now();
    }

    function handleMessage(client, raw) {
        let payload;
        try {
            payload = JSON.parse(String(raw));
        } catch {
            return;
        }
        if (payload.type === "bounce.join") join(client, payload);
        if (payload.type === "bounce.paddle") movePaddle(client, payload);
    }

    function attach(client) {
        if (!clients.has(client.userId)) clients.set(client.userId, new Set());
        clients.get(client.userId).add(client);
        client.on("message", (raw) => handleMessage(client, raw));
        client.on("close", () => {
            clients.get(client.userId)?.delete(client);
            const session = sessions.get(client.bounceSessionKey);
            if (session && session.phase !== "done" && !bothConnected(session)) {
                session.phase = "waiting";
                session.resumeAt = 0;
                broadcastSession(session);
            }
        });
    }

    function finish(session, winnerId) {
        session.phase = "done";
        session.winnerId = winnerId;
        session.updatedAt = Date.now();
        broadcastSession(session);
    }

    function tickSession(session, dt, now) {
        if (session.phase === "countdown") {
            if (!bothConnected(session)) {
                session.phase = "waiting";
                session.resumeAt = 0;
            } else if (now >= session.resumeAt) {
                session.phase = "playing";
                session.startedAt ||= now;
            }
            broadcastSession(session);
            return;
        }
        if (session.phase !== "playing") return;
        if (!bothConnected(session)) {
            session.phase = "waiting";
            session.resumeAt = 0;
            broadcastSession(session);
            return;
        }

        const ball = session.ball;
        const previousY = ball.y;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x <= BALL_RADIUS || ball.x >= 1 - BALL_RADIUS) {
            ball.x = Math.max(BALL_RADIUS, Math.min(1 - BALL_RADIUS, ball.x));
            ball.vx *= -1;
        }

        const paddleWidth = Math.max(0.13, 0.3 - Math.min(16, session.rally) * 0.009);
        const bottomY = 0.94;
        const topY = 0.06;

        if (ball.vy > 0 && previousY + BALL_RADIUS < bottomY && ball.y + BALL_RADIUS >= bottomY) {
            const paddle = session.paddles[session.challengerId];
            if (Math.abs(ball.x - paddle) <= paddleWidth / 2 + BALL_RADIUS) {
                const impact = (ball.x - paddle) / (paddleWidth / 2);
                const speed = Math.min(0.78, Math.hypot(ball.vx, ball.vy) * 1.045);
                ball.y = bottomY - BALL_RADIUS;
                ball.vx = speed * Math.max(-0.82, Math.min(0.82, impact));
                ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * 0.42));
                session.rally += 1;
            }
        }

        if (ball.vy < 0 && previousY - BALL_RADIUS > topY && ball.y - BALL_RADIUS <= topY) {
            const paddle = session.paddles[session.opponentId];
            if (Math.abs(ball.x - paddle) <= paddleWidth / 2 + BALL_RADIUS) {
                const impact = (ball.x - paddle) / (paddleWidth / 2);
                const speed = Math.min(0.78, Math.hypot(ball.vx, ball.vy) * 1.045);
                ball.y = topY + BALL_RADIUS;
                ball.vx = speed * Math.max(-0.82, Math.min(0.82, impact));
                ball.vy = Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * 0.42));
                session.rally += 1;
            }
        }

        if (ball.y > 1 + BALL_RADIUS * 2) finish(session, session.opponentId);
        if (ball.y < -BALL_RADIUS * 2) finish(session, session.challengerId);
        session.updatedAt = now;
        broadcastSession(session);
    }

    const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, session] of sessions) {
            if (session.phase === "done" && now - session.updatedAt > 60_000) {
                sessions.delete(key);
                continue;
            }
            if (now - session.updatedAt > 10 * 60_000) {
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

module.exports = { createSharedBounceManager };
