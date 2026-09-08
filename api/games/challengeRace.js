const { randomInt } = require('node:crypto');

const PLAYERS = (session) => [session.challengerId, session.opponentId];

function question(level) {
    const a = randomInt(3, 13 + level * 3);
    const b = randomInt(2, 10);
    const operator = randomInt(0, 3);
    const answer = operator === 0 ? a + b : operator === 1 ? a - b : a * b;
    const options = new Set([answer]);
    while (options.size < 4) options.add(answer + randomInt(-9, 10));
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { label: `${a} ${['+', '-', '×'][operator]} ${b}`, answer, options: shuffled };
}

function createRace(session) {
    return {
        stage: 0, phase: 'waiting', phaseEndsAt: 0, stageStartedAt: 0,
        scores: Object.fromEntries(PLAYERS(session).map((id) => [id, 0])),
        answers: {}, order: [0, 1, 2], token: 0, swap: 0, swaps: [],
        question: null, feedback: {}, suddenDeath: false,
    };
}

function nextStage(session, now) {
    const game = session.game;
    game.stage++;
    game.answers = {};
    game.feedback = {};
    game.stageStartedAt = now;
    game.suddenDeath = game.stage > (session.gameId === 'cupshuffle' ? 3 : 5);
    if (session.gameId === 'cupshuffle') {
        game.phase = 'reveal';
        game.order = [0, 1, 2];
        game.token = randomInt(3);
        game.swap = 0;
        game.swaps = Array.from({ length: 4 + Math.min(game.stage, 4) }, () => {
            const a = randomInt(3);
            return [a, (a + randomInt(1, 3)) % 3];
        });
        game.phaseEndsAt = now + 1400;
    } else {
        game.question = question(Math.min(game.stage, 3));
        game.phase = 'answer';
        game.phaseEndsAt = now + 6000;
    }
}

function publicRace(session) {
    const game = session.game;
    return {
        stage: game.stage, totalStages: session.gameId === 'cupshuffle' ? 3 : 5,
        challengePhase: game.phase, phaseEndsAt: game.phaseEndsAt,
        scores: game.scores, answered: Object.keys(game.answers), feedback: game.feedback,
        suddenDeath: game.suddenDeath,
        order: game.order, swap: game.swap, swapCount: game.swaps.length,
        swapDuration: Math.max(320, 600 - game.stage * 65),
        tokenCup: game.phase === 'reveal' || game.phase === 'feedback' ? game.token : null,
        question: game.question ? { label: game.question.label, options: game.question.options } : null,
    };
}

function settleStage(session, now) {
    const game = session.game;
    game.feedback = Object.fromEntries(PLAYERS(session).map((id) => [id, game.answers[id]?.correct || false]));
    for (const id of PLAYERS(session)) {
        const answer = game.answers[id];
        if (answer?.correct) game.scores[id] += 1000 + Math.max(0, Math.round((game.phaseEndsAt - answer.at) / 40));
    }
    game.phase = 'feedback';
    game.phaseEndsAt = now + 1300;
}

function answerRace(session, userId, payload, now) {
    const game = session.game;
    if (game.phase !== 'answer' || now >= game.phaseEndsAt || payload.stage !== game.stage || game.answers[userId]) return;
    const value = payload.value;
    if (!Number.isInteger(value)) return;
    if (session.gameId === 'cupshuffle' ? value < 0 || value > 2 : !game.question.options.includes(value)) return;
    const correct = session.gameId === 'cupshuffle'
        ? game.order[value] === game.token
        : value === game.question.answer;
    game.answers[userId] = { correct, at: now };
    if (PLAYERS(session).every((id) => game.answers[id])) settleStage(session, now);
}

function tickRace(session, now, finish) {
    const game = session.game;
    if (now < game.phaseEndsAt) return;
    if (game.phase === 'reveal' || game.phase === 'shuffle') {
        if (game.swap < game.swaps.length) {
            game.phase = 'shuffle';
            const [a, b] = game.swaps[game.swap++];
            [game.order[a], game.order[b]] = [game.order[b], game.order[a]];
            game.phaseEndsAt = now + Math.max(320, 600 - game.stage * 65) + 100;
        } else {
            game.phase = 'answer';
            game.phaseEndsAt = now + 5000;
        }
    } else if (game.phase === 'answer') {
        settleStage(session, now);
    } else if (game.phase === 'feedback') {
        const [a, b] = PLAYERS(session);
        const stages = session.gameId === 'cupshuffle' ? 3 : 5;
        if (game.stage >= stages && game.scores[a] !== game.scores[b]) {
            finish(session, game.scores[a] > game.scores[b] ? a : b, `${session.gameId}-race-complete`);
        } else {
            nextStage(session, now);
        }
    }
}

module.exports = { createRace, nextStage, publicRace, answerRace, tickRace, question };
