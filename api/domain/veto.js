const GAME_POOL = require('../../shared/game-selection.json').map(game=>game.id);

const KNOWN_GAMES=[...GAME_POOL,'ricochet','falsestart','onesecond','bounce','symbolrush','cupshuffle','duelnumeric','chroma','contrepied','trace','mat'];
function newVeto() { return { votes: {}, banned: [], complete: false }; }

function tournamentVeto(votes, entrants, preferred) {
    const counts = KNOWN_GAMES.map((game) => ({ game, count: entrants.filter((id) => votes[id] === game).length }));
    // Catalogue order breaks equal votes consistently for every client.
    counts.sort((a, b) => b.count - a.count);
    const banned = counts[0].count ? [counts[0].game] : [];
    const games = [...new Set([...(preferred || []), ...GAME_POOL])].filter((id) => KNOWN_GAMES.includes(id) && !banned.includes(id)).slice(0, 3);
    return { banned, games, complete: entrants.every((id) => KNOWN_GAMES.includes(votes[id])) };
}

function pruneQueue(db, now = Date.now()) {
    const active = new Set(db.duels.filter((duel) => ['pending', 'playing'].includes(duel.status)).flatMap((duel) => [duel.challengerId, duel.opponentId]));
    const seen = new Set();
    db.matchmakingQueue = db.matchmakingQueue.filter((entry) => {
        const user = db.users.find((candidate) => candidate.id === entry.userId);
        const valid = user && user.wallet >= entry.stake && !active.has(entry.userId)
            && now - Date.parse(entry.lastSeenAt || entry.joinedAt) < 60000 && !seen.has(entry.userId);
        if (valid) seen.add(entry.userId);
        return valid;
    });
}

module.exports = { GAME_POOL, newVeto, tournamentVeto, pruneQueue };
