const BOT = 'practice-bot';
const CARDS = [1, 2, 3, 4, 5];

function beginContrepied(g) {
    const rewards = [...CARDS];
    for (let i = rewards.length - 1; i > 0; i--) {
        const j = g.random(0, i + 1);
        [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
    }
    const participants = g.players.length === 1 ? [...g.players, BOT] : [...g.players];
    g.contrepied = { rewards, participants, hands: Object.fromEntries(participants.map((id) => [id, [...CARDS]])),
        history: [], botScore: 0, expired: [] };
}

function prepareContrepied(g, now) {
    g.phase = 'choose';
    g.deadline = now + 7000;
    g.contrepied.expired = [];
    if (g.players.length === 1) {
        const c = g.contrepied;
        const ranked = c.rewards.slice(g.attempt - 1).sort((a, b) => a - b);
        const rank = ranked.indexOf(c.rewards[g.attempt - 1]);
        const index = Math.max(0, Math.min(c.hands[BOT].length - 1, rank + g.random(-1, 2)));
        // Commit before receiving human input; the practice bot cannot counter it.
        g.responses[BOT] = c.hands[BOT][index];
    }
}

function settleContrepied(g, now) {
    const c = g.contrepied;
    for (const id of c.participants) {
        if (g.responses[id] === undefined) {
            g.responses[id] = c.hands[id][0];
            c.expired.push(id);
        }
        c.hands[id] = c.hands[id].filter((card) => card !== g.responses[id]);
    }
    const [a, b] = c.participants;
    const value = (id) => c.expired.includes(id) ? 0 : g.responses[id];
    const winnerId = value(a) === value(b) ? null : value(a) > value(b) ? a : b;
    const reward = c.rewards[g.attempt - 1];
    if (winnerId === BOT) c.botScore += reward;
    else if (winnerId) g.scores[winnerId] += reward;
    c.history.push({ exchange: g.attempt, reward, cards: { ...g.responses }, expired: [...c.expired], winnerId });
    g.phase = 'reveal';
    g.deadline = now + 2300;
}

function actContrepied(g, id, action, now) {
    if (g.phase !== 'choose' || action.action !== 'commit' || g.responses[id] !== undefined
        || !Number.isInteger(action.card) || !g.contrepied.hands[id]?.includes(action.card)) return false;
    g.responses[id] = action.card;
    if (g.contrepied.participants.every((p) => g.responses[p] !== undefined)) settleContrepied(g, now);
    return true;
}

function tickContrepied(g, now, conclude, next) {
    if (now < g.deadline) return;
    if (g.phase === 'choose') settleContrepied(g, now);
    else if (g.phase === 'reveal') {
        if (g.attempt === 5) conclude(g, 'contrepied-five-exchanges');
        else next(g, now);
    }
}

function publicContrepied(g, viewer) {
    const c = g.contrepied;
    if (!c) return undefined;
    // Hands change only at reveal, otherwise removal would disclose a locked card.
    return { rewards: [...c.rewards], hands: Object.fromEntries(c.participants.map((id) => [id, [...c.hands[id]]])),
        history: c.history.map((entry) => ({ ...entry, cards: { ...entry.cards }, expired: [...entry.expired] })),
        selected: g.players.includes(viewer) ? g.responses[viewer] : undefined,
        botId: g.players.length === 1 ? BOT : null, botScore: c.botScore };
}

module.exports = { beginContrepied, prepareContrepied, actContrepied, tickContrepied, publicContrepied };
