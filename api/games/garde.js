const BOT = 'practice-bot';
const ACTIONS = ['attack', 'charge', 'defend'];

function beginGarde(g) {
    const participants = g.players.length === 1 ? [...g.players, BOT] : [...g.players];
    g.garde = { participants, hp: Object.fromEntries(participants.map(id => [id, 6])),
        charged: Object.fromEntries(participants.map(id => [id, false])),
        previous: Object.fromEntries(participants.map(id => [id, null])), history: [], winnerId: null, finished: false };
    for (const id of g.players) g.scores[id] = 6;
}

function prepareGarde(g, now) {
    g.phase = 'choose'; g.deadline = now + 3000;
    if (g.players.length === 1) {
        const c = g.garde, human = g.players[0];
        let options = ACTIONS.filter(action => action !== 'defend' || c.previous[BOT] !== 'defend');
        if (c.charged[BOT]) options = [...options, 'attack'];
        if (c.charged[human] && c.previous[BOT] !== 'defend') options = [...options, 'defend'];
        // Only public state informs the bot; commit before any human input.
        g.responses[BOT] = options[g.random(0, options.length)];
    }
}

function settleGarde(g, now) {
    const c = g.garde, [a,b] = c.participants;
    const actions = Object.fromEntries(c.participants.map(id => [id, g.responses[id] || 'miss']));
    const before = { ...c.hp }, chargedBefore = { ...c.charged };
    const damage = (from, to) => actions[from] === 'attack' && actions[to] !== 'defend' ? (chargedBefore[from] ? 2 : 1) : 0;
    const losses = { [a]: damage(b,a), [b]: damage(a,b) };
    for (const id of c.participants) {
        c.hp[id] = Math.max(0, before[id] - losses[id]);
        c.charged[id] = actions[id] === 'charge';
        c.previous[id] = actions[id];
        if (g.players.includes(id)) g.scores[id] = c.hp[id];
    }
    c.history.push({ exchange: g.attempt, actions, before, hp: { ...c.hp }, damage: losses, chargedBefore });
    c.finished = c.hp[a] === 0 || c.hp[b] === 0 || g.attempt >= 8;
    if (c.finished) c.winnerId = c.hp[a] === c.hp[b] ? null : c.hp[a] > c.hp[b] ? a : b;
    g.phase = 'reveal'; g.deadline = now + 1200;
}

function actGarde(g, id, action, now) {
    if (g.phase !== 'choose' || !ACTIONS.includes(action.action) || g.responses[id] !== undefined
        || (action.action === 'defend' && g.garde.previous[id] === 'defend')) return false;
    g.responses[id] = action.action;
    if (g.garde.participants.every(p => g.responses[p] !== undefined)) settleGarde(g,now);
    return true;
}

function tickGarde(g, now, conclude, next) {
    if (now < g.deadline) return;
    if (g.phase === 'choose') settleGarde(g,now);
    else if (g.phase === 'reveal') {
        if (g.garde.finished) conclude(g, g.garde.participants.some(id => g.garde.hp[id] === 0) ? 'garde-knockout' : 'garde-eight-exchanges');
        else next(g,now);
    }
}

function publicGarde(g, viewer) {
    if (!g.garde) return undefined;
    const c = g.garde;
    return JSON.parse(JSON.stringify({ hp:c.hp, charged:c.charged, history:c.history,
        canDefend:Object.fromEntries(c.participants.map(id => [id,c.previous[id] !== 'defend'])),
        selected:g.players.includes(viewer) ? g.responses[viewer] : undefined,
        botId:g.players.length === 1 ? BOT : null, winnerId:c.winnerId, finished:c.finished }));
}
module.exports = { beginGarde, prepareGarde, actGarde, tickGarde, publicGarde };
