const test = require('node:test');
const assert = require('node:assert/strict');
const { createRace, nextStage, publicRace, answerRace, tickRace, question } = require('../games/challengeRace');

function session(gameId) {
    const value = { gameId, challengerId: 'a', opponentId: 'b' };
    value.game = createRace(value);
    nextStage(value, 1000);
    return value;
}

test('arithmetic options are unique and include the exact answer', () => {
    for (let i = 0; i < 500; i++) {
        const value = question(i % 3 + 1);
        assert.equal(new Set(value.options).size, 4);
        assert.ok(value.options.includes(value.answer));
        const [a, op, b] = value.label.split(' ');
        assert.equal(value.answer, op === '+' ? +a + +b : op === '-' ? +a - +b : +a * +b);
    }
});

test('race hides answers, rejects duplicates, stale stages and late inputs', () => {
    const value = session('duelnumeric');
    const game = value.game;
    assert.equal(publicRace(value).question.answer, undefined);
    answerRace(value, 'a', { stage: 0, value: game.question.answer }, 1100);
    assert.deepEqual(game.answers, {});
    answerRace(value, 'a', { stage: 1, value: game.question.answer }, game.phaseEndsAt);
    assert.deepEqual(game.answers, {});
    answerRace(value, 'a', { stage: 1, value: game.question.answer }, 1200);
    answerRace(value, 'a', { stage: 1, value: -99999 }, 1300);
    assert.deepEqual(game.answers.a, { correct: true, at: 1200 });
    assert.deepEqual(publicRace(value).feedback, {});
    answerRace(value, 'b', { stage: 1, value: game.question.options.find((x) => x !== game.question.answer) }, 1400);
    assert.equal(game.phase, 'feedback');
    assert.ok(game.scores.a >= 1000);
    assert.equal(game.scores.b, 0);
});

test('cups have visible swaps, a hidden token during selection and a finite answer window', () => {
    const value = session('cupshuffle');
    const game = value.game;
    assert.equal(publicRace(value).tokenCup, game.token);
    while (game.phase !== 'answer') tickRace(value, game.phaseEndsAt, () => assert.fail('too early'));
    assert.equal(game.swap, game.swaps.length);
    assert.equal(publicRace(value).tokenCup, null);
    answerRace(value, 'a', { stage: 1, value: game.order.indexOf(game.token) }, game.phaseEndsAt - 1000);
    tickRace(value, game.phaseEndsAt, () => assert.fail('too early'));
    assert.equal(game.phase, 'feedback');
    assert.equal(publicRace(value).tokenCup, game.token);
    assert.equal(game.feedback.a, true);
    assert.equal(game.feedback.b, false);
});

test('five common questions resolve using server points, ties get another question', () => {
    const value = session('duelnumeric');
    let winner;
    for (let i = 1; i <= 5; i++) {
        const game = value.game;
        answerRace(value, 'a', { stage: i, value: game.question.answer }, game.phaseEndsAt - 1000);
        tickRace(value, game.phaseEndsAt, () => assert.fail('feedback first'));
        tickRace(value, game.phaseEndsAt, (_, id) => { winner = id; });
    }
    assert.equal(winner, 'a');
    const tied = session('duelnumeric');
    tied.game.stage = 5;
    tickRace(tied, tied.game.phaseEndsAt, () => assert.fail('no arbitrary winner'));
    tickRace(tied, tied.game.phaseEndsAt, () => assert.fail('no arbitrary winner'));
    assert.equal(tied.game.stage, 6);
    assert.equal(tied.game.suddenDeath, true);
});
