const test = require('node:test');
const assert = require('node:assert/strict');
const { createParty, beginParty, actParty, tickParty, publicParty, pauseParty, recordParty, partyMoment, movingBlock } = require('../games/partyGames');

function game(id, players = ['a', 'b']) {
    const g = createParty(id, players, (min) => min === 2 ? 7 : 2000);
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

test('blind clock announces a shared target, rejects early stops and hides elapsed time', () => {
    const g = game('onesecond');
    assert.equal(g.targetMs, 7000);
    assert.equal(g.phase, 'prepare');
    assert.equal(act(g, 'a', 'stop', 11000), false);
    tickParty(g, g.clockAt);
    assert.equal(publicParty(g, 'a', 13000).clockSignal, true);
    assert.equal(publicParty(g, 'a', 14000).clockSignal, false);
    assert.equal(publicParty(g, 'a', 14000).remaining, 0);
    act(g, 'a', 'stop', 20012);
    assert.deepEqual(publicParty(g, 'b', 20012).runs.a.durations, []);
    act(g, 'b', 'stop', 20619);
    assert.equal(g.phase, 'reveal');
    assert.deepEqual(g.runs.a.durations, [7012]);
    assert.equal(g.scores.a, -12);
    assert.equal(g.scores.b, -619);
    assert.equal(act(g, 'b', 'stop', 20620), false);
});

test('interrupted clock and input timeout are penalized, never a perfect attempt', () => {
    const g = game('onesecond');
    tickParty(g, g.clockAt);
    act(g, 'a', 'cancel', 14000);
    tickParty(g, g.deadline);
    assert.equal(g.scores.a, -12000);
    assert.equal(g.scores.b, -12000);
});

test('exact tie waits for both players consent instead of picking an arbitrary winner', () => {
    const g = game('onesecond');
    for (let i = 0; i < 3; i++) { tickParty(g, g.deadline); tickParty(g, g.deadline); tickParty(g, g.deadline); }
    assert.equal(g.phase, 'draw');
    const turn = g.turn;
    act(g, 'a', 'retry', 50000); assert.equal(g.phase, 'draw');
    act(g, 'b', 'retry', 50000); assert.equal(g.phase, 'prepare');
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

test('pause restarts only the unfinished clock attempt and preserves tower position', () => {
    const g = game('onesecond'); tickParty(g, g.clockAt);
    act(g, 'a', 'stop', 15000);
    const turn = g.turn;
    pauseParty(g, 7000, 22000);
    assert.equal(g.phase, 'prepare');
    assert.equal(g.clockAt, 25000);
    assert.equal(g.targetMs, 7000);
    assert.equal(g.attempt, 1);
    assert.deepEqual(g.responses, {});
    assert.ok(g.turn > turn);
    tickParty(g, g.clockAt);
    act(g, 'a', 'stop', 32000);
    assert.equal(g.responses.a, 7000);
    const stack = game('onemore');
    const before = movingBlock(stack, 'a', 10700);
    pauseParty(stack, 7000);
    assert.deepEqual(movingBlock(stack, 'a', 17700), before);
});

test('clock targets cover the inclusive 2 to 10 second range and change each attempt', () => {
    const choices = [2, 10, 5];
    const g = createParty('onesecond', ['a'], (min, max) => {
        assert.equal(min, 2); assert.equal(max, 11); return choices.shift();
    });
    beginParty(g, 10000);
    for (const target of [2000, 10000, 5000]) {
        assert.equal(g.targetMs, target);
        tickParty(g, g.clockAt);
        act(g, 'a', 'stop', g.clockAt + target);
        tickParty(g, g.deadline);
    }
    assert.equal(g.phase, 'done');
    assert.equal(g.scores.a, 0);
    assert.deepEqual(partyMoment(g).targets, [2000, 10000, 5000]);
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
