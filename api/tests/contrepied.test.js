const test = require('node:test');
const assert = require('node:assert/strict');
const { createParty, beginParty, actParty, tickParty, publicParty, pauseParty, recordParty } = require('../games/partyGames');

function game(players = ['a', 'b']) {
    const g = createParty('contrepied', players, (min, max) => max - 1);
    beginParty(g, 1000); return g;
}
function commit(g, id, card, now = g.deadline - 1) {
    return actParty(g, id, { action: 'commit', card, turn: g.turn }, now);
}

test('contrepied rewards form one common permutation with a fixed total of fifteen', () => {
    for (let i = 0; i < 50; i++) {
        const g = createParty('contrepied', ['a', 'b']); beginParty(g, 1000);
        assert.deepEqual([...g.contrepied.rewards].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
        assert.deepEqual(publicParty(g, 'a', 1001).contrepied.rewards, publicParty(g, 'b', 1001).contrepied.rewards);
    }
});
test('contrepied conceals a commitment even through public remaining hands and spectator snapshots', () => {
    const g = game(); assert.equal(commit(g, 'a', 5), true);
    for (const viewer of ['b', 'spectator']) {
        const state = publicParty(g, viewer, 1001).contrepied;
        assert.equal(state.selected, undefined);
        assert.deepEqual(state.hands.a, [1, 2, 3, 4, 5]);
        assert.deepEqual(state.history, []);
    }
    assert.equal(publicParty(g, 'a', 1001).contrepied.selected, 5);
    assert.equal(commit(g, 'a', 4), false);
    commit(g, 'b', 3);
    const state = publicParty(g, 'spectator', 1002).contrepied;
    assert.deepEqual(state.history[0].cards, { a: 5, b: 3 });
    assert.deepEqual(state.hands.a, [1, 2, 3, 4]);
});
test('contrepied rejects invalid cards, actors, stale turns and spent cards', () => {
    const g = game();
    for (const card of [0, 6, 1.5, NaN, Infinity, '5', null]) assert.equal(commit(g, 'a', card), false);
    assert.equal(commit(g, 'outsider', 5), false);
    assert.equal(actParty(g, 'a', { action: 'commit', card: 1, turn: 0 }, 1001), false);
    commit(g, 'a', 5); commit(g, 'b', 3); tickParty(g, g.deadline);
    assert.equal(commit(g, 'a', 5), false);
    assert.equal(g.attempt, 2);
});
test('contrepied scores five exchanges correctly and exhausts each hand once', () => {
    const g = game();
    for (const [a, b] of [[2,1],[3,2],[4,3],[5,4],[1,5]]) {
        commit(g, 'a', a); commit(g, 'b', b);
        assert.equal(g.phase, 'reveal'); tickParty(g, g.deadline);
    }
    assert.equal(g.phase, 'done'); assert.equal(g.winnerId, 'a');
    assert.deepEqual(g.scores, { a: 10, b: 5 });
    assert.deepEqual(g.contrepied.hands, { a: [], b: [] });
    assert.equal(g.contrepied.history.length, 5);
});
test('contrepied equal cards discard the reward and an exact match tie needs both retry votes', () => {
    const g = game();
    for (const card of [1,2,3,4,5]) { commit(g, 'a', card); commit(g, 'b', card); tickParty(g, g.deadline); }
    assert.equal(g.phase, 'draw'); assert.deepEqual(g.scores, { a: 0, b: 0 });
    assert.ok(g.contrepied.history.every((entry) => entry.winnerId === null));
    actParty(g, 'a', { action: 'retry', turn: g.turn }, g.deadline);
    assert.equal(g.phase, 'draw');
    actParty(g, 'b', { action: 'retry', turn: g.turn }, g.deadline);
    assert.equal(g.phase, 'choose'); assert.equal(g.attempt, 1);
    assert.deepEqual(g.contrepied.hands.a, [1,2,3,4,5]);
});
test('contrepied expiration burns the lowest available card without winning and rejects late commitments', () => {
    const g = game(); commit(g, 'a', 5); commit(g, 'b', 1); tickParty(g, g.deadline);
    commit(g, 'a', 1);
    assert.equal(commit(g, 'b', 5, g.deadline), false);
    const result = g.contrepied.history[1];
    assert.equal(result.cards.b, 2); assert.deepEqual(result.expired, ['b']);
    assert.equal(result.winnerId, 'a'); assert.equal(g.scores.a, 3);
    tickParty(g, g.deadline); tickParty(g, g.deadline);
    assert.equal(g.contrepied.history[2].winnerId, null);
});
test('contrepied reconnect preserves the commitment and remaining time without revealing it', () => {
    const g = game(); commit(g, 'a', 4, 2000); const turn = g.turn;
    pauseParty(g, 5000, 7000);
    assert.equal(g.deadline, 13000); assert.equal(g.turn, turn);
    assert.equal(publicParty(g, 'a', 7000).contrepied.selected, 4);
    assert.equal(publicParty(g, 'b', 7000).contrepied.selected, undefined);
    assert.equal(commit(g, 'a', 5, 7000), false);
});
test('contrepied practice bot commits before the human and is explicitly identified', () => {
    const g = game(['a']);
    const bot = g.responses['practice-bot'];
    assert.ok([1,2,3,4,5].includes(bot));
    const state = publicParty(g, 'a', 1001).contrepied;
    assert.equal(state.botId, 'practice-bot'); assert.equal(state.selected, undefined);
    commit(g, 'a', 5);
    assert.equal(g.contrepied.history[0].cards['practice-bot'], bot);
    assert.equal(g.phase, 'reveal');
    recordParty(g, g.deadline, true);
    assert.doesNotThrow(() => JSON.stringify(g.replay));
});
