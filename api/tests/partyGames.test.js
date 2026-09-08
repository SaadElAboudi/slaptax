const test = require('node:test');
const assert = require('node:assert/strict');
const { createParty, beginParty, actParty, tickParty, publicParty, pauseParty, recordParty, partyMoment, movingBlock } = require('../games/partyGames');

function game(id, players = ['a', 'b']) {
    const g = createParty(id, players, () => 2000);
    beginParty(g, 10000);
    return g;
}
const act = (g, id, action, now) => actParty(g, id, { action, turn: g.turn }, now);

test('false start hides GO time, shows feint only to the rival and awards no double point', () => {
    const g = game('falsestart');
    assert.equal(publicParty(g, 'a', 10000).goAt, undefined);
    assert.equal(publicParty(g, 'a', 10000).remaining, 0);
    assert.equal(publicParty(g, 'b', 11100).remaining, 0);
    assert.equal(act(g, 'a', 'feint', 11200), true);
    assert.equal(publicParty(g, 'a', 11300).signal, 'wait');
    assert.equal(publicParty(g, 'b', 11300).signal, 'trap');
    assert.equal(act(g, 'a', 'feint', 11300), false);
    act(g, 'b', 'hit', 11300);
    assert.deepEqual(g.scores, { a: 1, b: 0 });
    assert.equal(g.feedback.trapped, true);
    assert.equal(act(g, 'a', 'hit', 12100), false);
    assert.deepEqual(g.scores, { a: 1, b: 0 });
});

test('first to three resolves and earlier turn messages are ignored', () => {
    const g = game('falsestart');
    for (let i = 0; i < 3; i++) {
        const at = g.goAt + 250;
        tickParty(g, at);
        assert.equal(actParty(g, 'a', { action: 'hit', turn: g.turn - 1 }, at), false);
        act(g, 'a', 'hit', at);
        tickParty(g, g.deadline);
    }
    assert.equal(g.phase, 'done');
    assert.equal(g.winnerId, 'a');
});

test('one second measures on the server and hides results until simultaneous reveal', () => {
    const g = game('onesecond');
    act(g, 'a', 'hold', 10500);
    act(g, 'a', 'release', 11512);
    assert.deepEqual(publicParty(g, 'b', 11512).runs.a.durations, []);
    act(g, 'b', 'hold', 11600);
    act(g, 'b', 'release', 12619);
    assert.equal(g.phase, 'reveal');
    assert.deepEqual(g.runs.a.durations, [1012]);
    assert.equal(g.scores.a, -12);
    assert.equal(g.scores.b, -19);
    assert.equal(act(g, 'b', 'release', 12620), false);
});

test('cancelling a hold and input timeout are penalized, never a perfect attempt', () => {
    const g = game('onesecond');
    act(g, 'a', 'hold', 10100); act(g, 'a', 'cancel', 11100);
    tickParty(g, g.deadline);
    assert.equal(g.scores.a, -3000);
    assert.equal(g.scores.b, -3000);
});

test('exact tie waits for both players consent instead of picking an arbitrary winner', () => {
    const g = game('onesecond');
    for (let i = 0; i < 3; i++) { tickParty(g, g.deadline); tickParty(g, g.deadline); }
    assert.equal(g.phase, 'draw');
    const turn = g.turn;
    act(g, 'a', 'retry', 50000); assert.equal(g.phase, 'draw');
    act(g, 'b', 'retry', 50000); assert.equal(g.phase, 'hold');
    assert.ok(g.turn > turn);
    assert.deepEqual(g.scores, { a: 0, b: 0 });
});

test('stacking crops the real overlap, banking locks a tower, a miss loses the unbanked score', () => {
    const g = game('onemore');
    const centerAt = 10000 + .5 / .65 * 1000;
    const moving = movingBlock(g, 'a', centerAt);
    assert.ok(Math.abs(moving.x - .19) < .001);
    act(g, 'a', 'drop', centerAt); assert.equal(g.runs.a.level, 1);
    act(g, 'a', 'bank', centerAt + 1); assert.equal(g.scores.a, 1);
    assert.equal(act(g, 'a', 'drop', centerAt + 1000), false);
    g.runs.b.layers = [{ x: .45, width: .1 }];
    act(g, 'b', 'drop', 10200);
    assert.equal(g.runs.b.status, 'crashed');
    assert.equal(g.phase, 'done'); assert.equal(g.winnerId, 'a');
});

test('pause preserves a hold duration and tower position', () => {
    const g = game('onesecond'); act(g, 'a', 'hold', 10100);
    pauseParty(g, 7000);
    act(g, 'a', 'release', 18100);
    assert.equal(g.responses.a, 1000);
    const stack = game('onemore');
    const before = movingBlock(stack, 'a', 10700);
    pauseParty(stack, 7000);
    assert.deepEqual(movingBlock(stack, 'a', 17700), before);
});

test('replay is a bounded immutable record and practice never needs an invented opponent', () => {
    const g = game('onemore', ['a']);
    for (let i = 0; i < 100; i++) recordParty(g, 10000 + i * 100);
    assert.ok(g.replay.length <= 31);
    const score = g.replay[0].state.scores.a;
    g.scores.a = 99;
    assert.equal(g.replay[0].state.scores.a, score);
    assert.deepEqual(partyMoment(g).players, ['a']);
});
