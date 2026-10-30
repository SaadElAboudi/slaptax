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

for(const gameId of ['snack','bombpass'])test(`${gameId}: paused broadcasts keep game clocks frozen while waiting for reconnect`,async(t)=>{
 let now=10000;t.mock.method(Date,'now',()=>now);const duel={id:'frozen',currentRound:1,status:'playing',games:[gameId],challengerId:'a',opponentId:'b'},db={users:[],duels:[duel]};const manager=createSharedArenaManager({read:()=>db,write:()=>{}},{resolveAuthoritativeDuelRound:()=>({ok:true})});t.after(()=>manager.close());
 const frames=[];function join(id){const socket=new EventEmitter();Object.assign(socket,{userId:id,readyState:1,bufferedAmount:0,send:raw=>{if(id==='b')frames.push(JSON.parse(raw));}});manager.attach(socket);socket.emit('message',JSON.stringify({type:'arena.join',duelId:'frozen',round:1}));return socket;}
 const a=join('a');join('b');now=12500;await new Promise(r=>setTimeout(r,70));assert.equal(manager.sessions.get('frozen:1').phase,'playing');now=13000;await new Promise(r=>setTimeout(r,70));a.emit('close');const paused=frames.at(-1);assert.equal(paused.phase,'waiting');now=14500;await new Promise(r=>setTimeout(r,100));const later=frames.at(-1);assert.equal(later.gameAt,paused.gameAt);assert.equal(later.duration,paused.duration);if(gameId==='snack'){assert.equal(later.party.remaining,paused.party.remaining);assert.equal(later.party.snack.elapsed,paused.party.snack.elapsed);}else assert.equal(later.fuseEndsAt-later.gameAt,paused.fuseEndsAt-paused.gameAt);
});
