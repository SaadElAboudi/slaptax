const { toMoney2 } = require("../shared/money");

const P2P_GAME_LIBRARY = {
    bounce: {
        label: "Bounce Panic",
        metric: [180, 720],
        elite: 260,
        hard: 460,
    },
    symbolrush: {
        label: "Symbol Sprint",
        metric: [1800, 8200],
        elite: 3200,
        hard: 5400,
    },
    bombpass: {
        label: "Bomb Pass",
        metric: [220, 1200],
        elite: 420,
        hard: 760,
    },
    cupshuffle: {
        label: "Cup Shuffle",
        metric: [450, 2200],
        elite: 800,
        hard: 1450,
    },
    duelnumeric: {
        label: "Duel Numeric",
        metric: [800, 3600],
        elite: 1200,
        hard: 2200,
    },
};

const DRAFT_GAME_ALIASES = {
    precision: "bounce",
    speedsort: "symbolrush",
    crown: "cupshuffle",
    zone: "bombpass",
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function gradeMetric(metric, config) {
    if (metric <= config.elite) return "elite";
    if (metric <= config.hard) return "hard";
    return "standard";
}

function metricRoll([min, max], skillEdge = 0) {
    const span = max - min;
    const raw = min + Math.random() * span;
    const adjusted = raw - skillEdge;
    return Math.round(clamp(adjusted, min, max));
}

function normalizeDraftGameId(value) {
    const id = String(value || "").trim();
    const normalized = DRAFT_GAME_ALIASES[id] || id;
    return P2P_GAME_LIBRARY[normalized] ? normalized : "";
}

function resolveP2PGames(draft) {
    const roster = Object.keys(P2P_GAME_LIBRARY);
    if (!draft) return shuffle(roster).slice(0, 3);

    const banned = new Set([draft.challenger?.ban, draft.opponent?.ban].filter(Boolean));
    const available = roster.filter((id) => !banned.has(id));
    const ordered = [];

    [draft.challenger?.pick, draft.opponent?.pick].forEach((pick) => {
        if (pick && available.includes(pick) && !ordered.includes(pick)) {
            ordered.push(pick);
        }
    });

    shuffle(available).forEach((id) => {
        if (!ordered.includes(id) && ordered.length < 3) ordered.push(id);
    });

    return ordered.slice(0, 3);
}

function normalizeTournamentDraft(draft) {
    if (!draft || typeof draft !== "object") return null;
    const ban = normalizeDraftGameId(draft.ban);
    const pick = normalizeDraftGameId(draft.pick);
    if (!ban || !pick || ban === pick) return null;
    return { ban, pick };
}

function resolveTournamentGames(draft) {
    const roster = Object.keys(P2P_GAME_LIBRARY);
    const safeDraft = normalizeTournamentDraft(draft);
    if (!safeDraft) return shuffle(roster);

    const available = roster.filter((id) => id !== safeDraft.ban);
    const ordered = [safeDraft.pick];
    shuffle(available).forEach((id) => {
        if (!ordered.includes(id)) ordered.push(id);
    });
    return ordered;
}

function simulateDuel(stake, stats) {
    const rounds = [];
    let playerRounds = 0;
    let botRounds = 0;

    const baseSkill = 0.48 + stats.winRate / 250;

    for (let round = 1; round <= 3; round += 1) {
        if (playerRounds === 2 || botRounds === 2) break;

        const playerTap = 8 + Math.floor(Math.random() * 22);
        const botTap = 8 + Math.floor(Math.random() * 22);
        const bonus = Math.random() < baseSkill ? 2 : -1;
        const playerScore = playerTap + bonus;

        if (playerScore >= botTap) {
            playerRounds += 1;
            rounds.push({ round, player: playerScore, bot: botTap, winner: "PLAYER" });
        } else {
            botRounds += 1;
            rounds.push({ round, player: playerScore, bot: botTap, winner: "BOT" });
        }
    }

    const won = playerRounds > botRounds;
    const gross = stake * 2;
    const payout = won ? toMoney2(gross * 0.85) : 0;
    const net = won ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        won,
        playerRounds,
        botRounds,
        rounds,
        payout,
        net,
    };
}

function simulateTournament(size, stake, draft = null, entrants = [], activeUserId = "") {
    const rounds = Math.log2(size);
    const run = [];
    const draftPlan = normalizeTournamentDraft(draft);
    const games = resolveTournamentGames(draftPlan);
    const supplied = Array.isArray(entrants) ? entrants.slice(0, size) : [];
    const normalizedEntrants = supplied.map((entrant, index) => ({
        id: String(entrant.id || `bot-${index + 1}`),
        name: String(entrant.name || `Player ${index + 1}`),
        winRate: clamp(Number(entrant.winRate || 50), 0, 100),
        bot: !!entrant.bot,
    }));

    while (normalizedEntrants.length < size) {
        const botNumber = normalizedEntrants.length + 1;
        normalizedEntrants.push({
            id: `bot-${botNumber}`,
            name: `CPU ${String(botNumber).padStart(2, "0")}`,
            winRate: 35 + Math.floor(Math.random() * 36),
            bot: true,
        });
    }

    let field = shuffle(normalizedEntrants);
    const bracket = [];

    for (let r = 1; r <= rounds; r += 1) {
        const gameId = games[(r - 1) % games.length];
        const config = P2P_GAME_LIBRARY[gameId];
        const roundMatches = [];
        const nextField = [];

        for (let index = 0; index < field.length; index += 2) {
            const playerA = field[index];
            const playerB = field[index + 1];
            const comfortA = draftPlan && playerA.id === activeUserId && draftPlan.pick === gameId ? 0.05 : 0;
            const comfortB = draftPlan && playerB.id === activeUserId && draftPlan.pick === gameId ? 0.05 : 0;
            const chanceA = clamp(0.5 + (playerA.winRate - playerB.winRate) / 240 + comfortA - comfortB, 0.2, 0.8);
            const winnerA = Math.random() < chanceA;
            const winner = winnerA ? playerA : playerB;
            const metricA = metricRoll(config.metric, Math.round((chanceA - 0.5) * 140));
            const metricB = metricRoll(config.metric, Math.round((0.5 - chanceA) * 140));
            const scoreA = Math.max(0, Math.round(1000 - metricA * 1.3 + comfortA * 800));
            const scoreB = Math.max(0, Math.round(1000 - metricB * 1.3 + comfortB * 800));
            const winningScore = Math.max(scoreA, scoreB) + 12;
            const finalScoreA = winnerA ? winningScore : Math.min(scoreA, winningScore - 1);
            const finalScoreB = winnerA ? Math.min(scoreB, winningScore - 1) : winningScore;

            roundMatches.push({
                round: r,
                match: index / 2 + 1,
                gameId,
                label: config.label,
                playerA: { id: playerA.id, name: playerA.name, bot: playerA.bot },
                playerB: { id: playerB.id, name: playerB.name, bot: playerB.bot },
                scoreA: finalScoreA,
                scoreB: finalScoreB,
                winnerId: winner.id,
                winnerName: winner.name,
            });

            if (playerA.id === activeUserId || playerB.id === activeUserId) {
                const activeIsA = playerA.id === activeUserId;
                run.push({
                    round: r,
                    result: winner.id === activeUserId ? "WIN" : "ELIMINATED",
                    gameId,
                    label: config.label,
                    opponentId: activeIsA ? playerB.id : playerA.id,
                    opponentName: activeIsA ? playerB.name : playerA.name,
                    opponentLevel: Math.min(5, Math.max(1, r + 1)),
                    scoreFor: activeIsA ? finalScoreA : finalScoreB,
                    scoreAgainst: activeIsA ? finalScoreB : finalScoreA,
                    won: winner.id === activeUserId,
                });
            }

            nextField.push(winner);
        }

        bracket.push({ round: r, gameId, label: config.label, matches: roundMatches });
        field = nextField;
    }

    const tournamentChampion = field[0];
    const champion = tournamentChampion?.id === activeUserId;
    const reachedRound = run.filter((round) => round.won).length;
    const grossPool = size * stake;
    const payout = champion ? toMoney2(grossPool * 0.94) : 0;
    const net = champion ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        champion,
        rounds,
        reachedRound,
        run,
        entrants: normalizedEntrants.map(({ id, name, bot }) => ({ id, name, bot })),
        bracket,
        championId: tournamentChampion?.id || "",
        championName: tournamentChampion?.name || "",
        games,
        draft: draftPlan,
        draftSummary: draftPlan ? `Draft: banned ${P2P_GAME_LIBRARY[draftPlan.ban].label} • favored ${P2P_GAME_LIBRARY[draftPlan.pick].label}` : "",
        payout,
        net,
    };
}

function simulateP2PDuel(stake, challengerStats, opponentStats, draft = null) {
    const games = resolveP2PGames(draft);
    const rounds = [];
    let challengerRounds = 0;
    let opponentRounds = 0;

    const challengerBase = 0.5 + ((challengerStats?.winRate || 0) - (opponentStats?.winRate || 0)) / 300 + 0.03;

    for (let index = 0; index < games.length; index += 1) {
        if (challengerRounds === 2 || opponentRounds === 2) break;

        const gameId = games[index];
        const config = P2P_GAME_LIBRARY[gameId];
        const variance = (Math.random() - 0.5) * 0.16;
        const challengerChance = clamp(challengerBase + variance, 0.22, 0.78);
        const challengerWon = Math.random() < challengerChance;

        const skillDelta = Math.round(((challengerChance - 0.5) * 2) * 120);
        const challengerMetric = metricRoll(config.metric, skillDelta);
        const opponentMetric = metricRoll(config.metric, -skillDelta);

        if (challengerWon) challengerRounds += 1;
        else opponentRounds += 1;

        rounds.push({
            round: index + 1,
            gameId,
            label: config.label,
            challengerMetric,
            opponentMetric,
            winner: challengerWon ? "CHALLENGER" : "OPPONENT",
            challengerDifficulty: gradeMetric(challengerMetric, config),
            opponentDifficulty: gradeMetric(opponentMetric, config),
        });
    }

    const won = challengerRounds > opponentRounds;
    const gross = stake * 2;
    const payout = won ? toMoney2(gross * 0.85) : 0;
    const net = won ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        won,
        challengerRounds,
        opponentRounds,
        rounds,
        games,
        payout,
        net,
    };
}

module.exports = {
    P2P_GAME_LIBRARY,
    resolveP2PGames,
    resolveTournamentGames,
    simulateDuel,
    simulateTournament,
    simulateP2PDuel,
};
