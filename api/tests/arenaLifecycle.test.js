const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createSharedArenaManager } = require('../games/sharedArena');

test('reconnection preserves race questions and remaining time instead of restarting', async (t) => {
    let now = 10000;
    t.mock.method(Date, 'now', () => now);
    const duel = { id: 'duel', currentRound: 1, status: 'playing', games: ['duelnumeric'], challengerId: 'a', opponentId: 'b' };
    const db = { users: [], duels: [duel] };
    const manager = createSharedArenaManager({ read: () => db, write: () => {} }, { resolveAuthoritativeDuelRound: () => ({ ok: true }) });
    t.after(() => manager.close());
    function client(userId) {
        const socket = new EventEmitter();
        Object.assign(socket, { userId, readyState: 1, bufferedAmount: 0, send: () => {} });
        manager.attach(socket);
        socket.emit('message', JSON.stringify({ type: 'arena.join', duelId: 'duel', round: 1 }));
        return socket;
    }
    const initial = client('a');
    initial.emit('close');
    const a = client('a');
    client('b');
    now = 12500;
    await new Promise((resolve) => setTimeout(resolve, 60));
    const session = manager.sessions.get('duel:1');
    assert.equal(session.phase, 'playing');
    assert.equal(session.pausedAt, 0);
    const question = session.game.question;
    now += 1000;
    const remaining = session.game.phaseEndsAt - now;
    a.emit('close');
    now += 4000;
    client('a');
    now += 2300;
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(session.phase, 'playing');
    assert.equal(session.game.question, question);
    assert.equal(session.game.phaseEndsAt - now, remaining);
    assert.doesNotThrow(() => a.emit('message', 'null'));
    assert.doesNotThrow(() => a.emit('message', '[]'));
});

test('clock reconnection provides a new shared countdown and rejects the interrupted turn', async (t) => {
    let now = 10000;
    t.mock.method(Date, 'now', () => now);
    const duel = { id: 'clock', currentRound: 1, status: 'playing', games: ['onesecond'], challengerId: 'a', opponentId: 'b' };
    const manager = createSharedArenaManager({ read: () => ({ users: [], duels: [duel] }), write: () => {} }, { resolveAuthoritativeDuelRound: () => ({ ok: true }) });
    t.after(() => manager.close());
    function client(userId) {
        const socket = new EventEmitter();
        Object.assign(socket, { userId, readyState: 1, bufferedAmount: 0, send: () => {} });
        manager.attach(socket);
        socket.emit('message', JSON.stringify({ type: 'arena.join', duelId: 'clock', round: 1 }));
        return socket;
    }
    const a = client('a'); client('b');
    now = 12500; await new Promise((resolve) => setTimeout(resolve, 70));
    const session = manager.sessions.get('clock:1');
    now = session.game.clockAt; await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(session.game.phase, 'timing');
    const target = session.game.targetMs;
    const turn = session.game.turn;
    a.emit('close'); now += 4000;
    const reconnected = client('a');
    now += 2300; await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(session.game.phase, 'prepare');
    assert.equal(session.game.targetMs, target);
    assert.equal(session.game.attempt, 1);
    now = session.game.clockAt; await new Promise((resolve) => setTimeout(resolve, 70));
    reconnected.emit('message', JSON.stringify({ type: 'arena.action', action: 'stop', turn }));
    assert.deepEqual(session.game.responses, {});
    assert.equal(session.game.scores.a, 0);
});
