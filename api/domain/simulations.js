const { toMoney2 } = require("../shared/money");

const P2P_GAME_LIBRARY = {
    precision: {
        label: "Precision Rush",
        metric: [18, 140],
        elite: 28,
        hard: 60,
    },
    quickdraw: {
        label: "Quickdraw",
        metric: [120, 460],
        elite: 170,
        hard: 280,
    },
    parryclash: {
        label: "Parry Clash",
        metric: [140, 520],
        elite: 190,
        hard: 310,
    },
    mindgame: {
        label: "Mind Game",
        metric: [180, 900],
        elite: 260,
        hard: 520,
    },
    speedsort: {
        label: "Speed Sort",
        metric: [900, 4200],
        elite: 1500,
        hard: 2600,
    },
    duelnumeric: {
        label: "Duel Numeric",
        metric: [800, 3600],
        elite: 1200,
        hard: 2200,
    },
};

const DRAFT_GAME_ALIASES = {
    reflex: "quickdraw",
    timing: "mindgame",
    precision: "precision",
    parry: "parryclash",
    zone: "speedsort",
    crown: "duelnumeric",
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

function simulateTournament(size, stake, stats, draft = null) {
    const rounds = Math.log2(size);
    const run = [];
    let alive = true;
    let reachedRound = 0;

    const draftPlan = normalizeTournamentDraft(draft);
    const games = resolveTournamentGames(draftPlan);
    const baseSkill = 0.42 + stats.winRate / 220 + (draftPlan ? 0.03 : 0);

    for (let r = 1; r <= rounds; r += 1) {
        if (!alive) break;
        const gameId = games[(r - 1) % games.length];
        const config = P2P_GAME_LIBRARY[gameId];
        const chance = Math.min(0.88, baseSkill + (rounds - r) * 0.02 + (draftPlan && draftPlan.pick === gameId ? 0.04 : 0));
        const wonRound = Math.random() < chance;
        const performance = metricRoll(config.metric, Math.round((chance - 0.5) * 160));
        const scoreFor = Math.max(0, Math.round(1000 - performance * 1.3 + (draftPlan && draftPlan.pick === gameId ? 40 : 0)));
        const scoreAgainst = Math.max(0, Math.round(scoreFor - (wonRound ? 18 + Math.random() * 30 : -(18 + Math.random() * 30))));
        if (wonRound) {
            reachedRound = r;
            run.push({
                round: r,
                result: "WIN",
                gameId,
                label: config.label,
                opponentLevel: Math.min(5, Math.max(1, r + 1)),
                scoreFor,
                scoreAgainst,
                won: true,
            });
        } else {
            alive = false;
            run.push({
                round: r,
                result: "ELIMINATED",
                gameId,
                label: config.label,
                opponentLevel: Math.min(5, Math.max(1, r + 1)),
                scoreFor,
                scoreAgainst,
                won: false,
            });
        }
    }

    const champion = alive && reachedRound === rounds;
    const grossPool = size * stake;
    const payout = champion ? toMoney2(grossPool * 0.94) : 0;
    const net = champion ? toMoney2(payout - stake) : toMoney2(-stake);

    return {
        champion,
        rounds,
        reachedRound,
        run,
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
    simulateDuel,
    simulateTournament,
    simulateP2PDuel,
};
