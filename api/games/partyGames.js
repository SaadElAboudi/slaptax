const { randomInt } = require('node:crypto');

const PARTY_IDS = ['falsestart', 'onesecond', 'onemore'];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function createParty(id, players, random = (min, max) => randomInt(min, max)) {
    if (!PARTY_IDS.includes(id) || players.length < 1 || players.length > 2) throw new Error('Invalid party');
    return { id, players, random, phase: 'ready', turn: 0, attempt: 0, deadline: 0,
        scores: Object.fromEntries(players.map((p) => [p, 0])), runs: {}, feints: {}, traps: {},
        ready: [], replay: [], lastFrame: 0, winnerId: null, summary: '', started: 0 };
}

function beginParty(g, now) {
    g.started = now;
    g.attempt = 0;
    g.replay = [];
    g.scores = Object.fromEntries(g.players.map((p) => [p, 0]));
    g.feints = Object.fromEntries(g.players.map((p) => [p, 1]));
    g.targets = [];
    g.runs = Object.fromEntries(g.players.map((p) => [p, { errors: [], durations: [], layers: [{ x: .19, width: .62 }], status: 'playing', level: 0, bank: 0, perfects: 0, motionAt: now }]));
    nextAttempt(g, now);
}

function nextAttempt(g, now) {
    g.turn++;
    g.attempt++;
    g.responses = {};
    g.traps = {};
    g.feedback = {};
    if (g.id === 'falsestart') {
        g.phase = 'wait';
        g.goAt = now + g.random(1800, 4200);
        g.decoyAt = now + 750;
        g.deadline = g.goAt + 2000;
    } else if (g.id === 'onesecond') {
        g.targetMs = g.random(2, 11) * 1000;
        g.targets.push(g.targetMs);
        prepareClock(g, now);
    } else {
        g.phase = 'stack';
        g.deadline = now + 30000;
    }
}

function prepareClock(g, now) {
    g.phase = 'prepare';
    g.responses = {};
    g.clockAt = now + 3000;
    g.deadline = g.clockAt;
}

function endAttempt(g, now) {
    g.phase = 'reveal';
    g.deadline = now + 1800;
}

function conclude(g, summary) {
    g.summary = summary;
    const [a, b] = g.players;
    if (!b) {
        g.winnerId = a;
        g.phase = 'done';
    } else if (g.scores[a] === g.scores[b]) {
        g.phase = 'draw';
        g.ready = [];
    } else {
        g.winnerId = g.scores[a] > g.scores[b] ? a : b;
        g.phase = 'done';
    }
}

function movingBlock(g, id, now) {
    const run = g.runs[id];
    if (!run) return { x: .19, width: .62 };
    const width = run.layers.at(-1).width;
    const wave = ((Math.max(0, now - run.motionAt) / 1000) * (0.65 + run.level * .07)) % 2;
    return { x: (wave <= 1 ? wave : 2 - wave) * (1 - width), width };
}

function actParty(g, id, action, now) {
    if (!g.players.includes(id) || action.turn !== g.turn) return false;
    if (g.phase === 'draw') {
        if (action.action !== 'retry' || g.ready.includes(id)) return false;
        g.ready.push(id);
        if (g.ready.length === g.players.length) beginParty(g, now);
        return true;
    }
    if (['done', 'ready', 'reveal', 'prepare'].includes(g.phase)) return false;
    if (now >= g.deadline) { tickParty(g, now); return false; }
    if (g.id === 'falsestart') {
        if (action.action === 'feint' && g.feints[id] && now < g.goAt - 600) {
            const rival = g.players.find((p) => p !== id);
            if (!rival) return false;
            g.feints[id] = 0;
            g.traps[rival] = now + 450;
            return true;
        }
        if (action.action !== 'hit') return false;
        const falseStart = now < g.goAt;
        const point = falseStart ? g.players.find((p) => p !== id) : id;
        if (point) g.scores[point]++;
        g.feedback = { actor: id, falseStart, reaction: falseStart ? null : now - g.goAt, trapped: falseStart && (g.traps[id] || 0) > now };
        endAttempt(g, now);
    } else if (g.id === 'onesecond') {
        if (g.responses[id] !== undefined) return false;
        if (action.action === 'stop') g.responses[id] = clamp(now - g.clockAt, 0, g.targetMs + 5000);
        else if (action.action === 'cancel') g.responses[id] = null;
        else return false;
        if (g.players.every((p) => g.responses[p] !== undefined)) settleSecond(g, now);
    } else {
        const run = g.runs[id];
        if (run.status !== 'playing') return false;
        if (action.action === 'bank') {
            if (!run.level) return false;
            run.status = 'banked';
            run.bank = run.level;
            g.scores[id] = run.bank;
        } else if (action.action === 'drop' && now - run.motionAt >= 180) {
            const moving = movingBlock(g, id, now);
            const base = run.layers.at(-1);
            const x = Math.max(moving.x, base.x);
            const overlap = Math.min(moving.x + moving.width, base.x + base.width) - x;
            if (overlap < .055) {
                run.status = 'crashed';
                run.bank = 0;
                g.scores[id] = 0;
            } else {
                const perfect = Math.abs(moving.x - base.x) < .022;
                run.layers.push(perfect ? { ...base } : { x, width: overlap });
                run.level++;
                if (perfect) run.perfects++;
                run.motionAt = now;
                if (run.level === 20) { run.status = 'banked'; run.bank = 20; g.scores[id] = 20; }
            }
        } else return false;
        if (g.players.every((p) => g.runs[p].status !== 'playing')) conclude(g, 'stack-banked');
    }
    return true;
}

function settleSecond(g, now) {
    for (const p of g.players) {
        const duration = g.responses[p] ?? null;
        const error = duration === null ? g.targetMs + 5000 : Math.abs(duration - g.targetMs);
        g.runs[p].durations.push(duration);
        g.runs[p].errors.push(error);
        g.scores[p] -= error;
    }
    g.feedback = { durations: { ...g.responses } };
    endAttempt(g, now);
}

function tickParty(g, now) {
    if (['done', 'draw', 'ready'].includes(g.phase)) return;
    if (g.id === 'falsestart' && g.phase === 'wait' && now >= g.goAt) g.phase = 'go';
    if (g.id === 'onesecond' && g.phase === 'prepare' && now >= g.clockAt) {
        g.phase = 'timing';
        g.deadline = g.clockAt + g.targetMs + 5000;
    }
    if (now >= g.deadline) {
        if (g.phase === 'reveal') {
            if (g.id === 'onesecond' && g.attempt >= 3) conclude(g, 'precision-three-attempts');
            else if (g.id === 'falsestart' && (Math.max(...Object.values(g.scores)) >= 3 || g.attempt >= 7)) conclude(g, 'reaction-first-to-three');
            else nextAttempt(g, now);
        } else if (g.id === 'onesecond') settleSecond(g, now);
        else if (g.id === 'falsestart') { g.feedback = { timeout: true }; endAttempt(g, now); }
        else {
            for (const id of g.players) {
                const run = g.runs[id];
                if (run.status === 'playing') { run.status = 'banked'; run.bank = run.level; g.scores[id] = run.level; }
            }
            conclude(g, 'stack-clock-expired');
        }
    }
}

function publicParty(g, viewer, now) {
    const state = {
        id: g.id, phase: g.phase, turn: g.turn, attempt: g.attempt,
        // A countdown during WAIT would disclose GO (deadline minus two seconds).
        remaining: (g.id === 'falsestart' && g.phase === 'wait') || g.phase === 'timing' ? 0 : Math.max(0, g.deadline - now), scores: g.scores,
        targetMs: g.targetMs, targets: g.targets || [],
        clockSignal: g.phase === 'timing' && now - g.clockAt < 700,
        feedback: g.feedback || {}, feints: g.feints, ready: g.ready,
        signal: g.phase === 'go' ? 'go' : (g.traps[viewer] || 0) > now || (now >= g.decoyAt && now < g.decoyAt + 400) ? 'trap' : 'wait',
        answered: Object.keys(g.responses || {}),
        runs: {}, winnerId: g.winnerId, summary: g.summary,
    };
    for (const id of g.players) {
        const run = g.runs[id];
        if (!run) continue;
        state.runs[id] = g.id === 'onemore'
            ? { layers: run.layers, level: run.level, bank: run.bank, perfects: run.perfects, status: run.status, moving: movingBlock(g, id, now), motion: { ageMs: Math.max(0, now - run.motionAt), speed: .65 + run.level * .07 } }
            : { durations: run.durations, errors: run.errors };
    }
    return state;
}

function recordParty(g, now, force = false) {
    if ((!force && now - g.lastFrame < 100) || g.phase === 'ready') return;
    g.lastFrame = now;
    const state = publicParty(g, g.players[0], now);
    // Copy snapshots before later actions mutate scores, towers or result arrays.
    g.replay.push(JSON.parse(JSON.stringify({ at: now, state })));
    g.replay = g.replay.filter((frame) => now - frame.at <= 3000).slice(-31);
}

function pauseParty(g, delta, now = Date.now()) {
    // A hidden clock cannot be resumed fairly after a disconnect. Replay only
    // the unfinished attempt, with the same target and a fresh countdown.
    if (g.id === 'onesecond' && ['prepare', 'timing'].includes(g.phase)) {
        g.turn++;
        prepareClock(g, now);
        return;
    }
    for (const field of ['started', 'deadline', 'goAt', 'decoyAt']) if (g[field]) g[field] += delta;
    for (const key of Object.keys(g.traps || {})) g.traps[key] += delta;
    for (const run of Object.values(g.runs)) run.motionAt += delta;
}

function partyMoment(g) {
    return { gameId: g.id, players: g.players, scores: g.scores, targets: g.targets || [],
        runs: Object.fromEntries(g.players.map((id) => [id, { durations: g.runs[id]?.durations || [], errors: g.runs[id]?.errors || [], bank: g.runs[id]?.bank || 0, level: g.runs[id]?.level || 0 }])),
        replay: g.replay, summary: g.summary };
}

module.exports = { PARTY_IDS, createParty, beginParty, actParty, tickParty, publicParty, recordParty, pauseParty, partyMoment, movingBlock };
