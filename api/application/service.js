const { getStats } = require("../domain/stats");
const {
    P2P_GAME_LIBRARY,
    resolveP2PGames,
    resolveTournamentGames,
    simulateDuel,
    simulateTournament,
    simulateP2PDuel,
} = require("../domain/simulations");
const { toMoney2 } = require("../shared/money");
const { SCHEMA_VERSION } = require("../infrastructure/db");
const crypto = require("crypto");

const ALLOWED_STAKES = [2, 5, 10, 20];
const ALLOWED_TOURNAMENT_SIZES = [4, 8, 16];

const MAX_DAILY_GAIN = 200; // SLAP$ max a user can earn in one calendar day
const WALLET_FLOOR = 2;     // auto-credit threshold (lowest allowed stake)
const WALLET_FLOOR_CREDIT = 10; // SLAP$ given when wallet hits floor

const DRAFT_GAMES = [
    { id: "bounce", label: "Bounce Panic" },
    { id: "symbolrush", label: "Symbol Sprint" },
    { id: "bombpass", label: "Bomb Pass" },
    { id: "cupshuffle", label: "Cup Shuffle" },
    { id: "duelnumeric", label: "Duel Numeric" },
];

const DRAFT_GAME_ALIASES = {
    precision: "bounce",
    speedsort: "symbolrush",
    crown: "cupshuffle",
    zone: "bombpass",
};

const SKILL_POOLS = [
    { id: "rookie", label: "Rookie", stakeCap: 5 },
    { id: "confirmed", label: "Confirmed", stakeCap: 10 },
    { id: "expert", label: "Expert", stakeCap: 20 },
];

const DAILY_CHALLENGE_TASKS = [
    { id: "round_wins", label: "Win 3 rounds", target: 3, rewardXp: 120 },
    { id: "perfect_rounds", label: "Hit 2 perfect rounds", target: 2, rewardXp: 140 },
    { id: "duel_complete", label: "Complete 1 Best-of-3", target: 1, rewardXp: 100 },
];

const COSMETIC_CATALOG = {
    avatars: [
        { id: "spark", level: 1 },
        { id: "visor", level: 3 },
        { id: "crown", level: 7 },
        { id: "phantom", level: 12 },
    ],
    arenas: [
        { id: "foundry", level: 1 },
        { id: "neon", level: 5 },
        { id: "storm", level: 10 },
    ],
    trails: [
        { id: "pulse", level: 1 },
        { id: "ember", level: 4 },
        { id: "glitch", level: 8 },
    ],
};

function clampInt(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.round(n)));
}

function shuffled(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

function validateLivePerformance(score, metric) {
    const numericScore = Number(score);
    const numericMetric = Number(metric);
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 1000) {
        return { error: "Score must be an integer between 0 and 1000", code: 400 };
    }
    if (!Number.isInteger(numericMetric) || numericMetric < 100 || numericMetric > 300000) {
        return { error: "Performance duration is outside the allowed range", code: 400 };
    }
    return { score: numericScore, metric: numericMetric };
}

function newAttemptToken() {
    return crypto.randomBytes(24).toString("base64url");
}

function ensureDuelRoundSecurity(duel) {
    const roundKey = String(duel.currentRound || 1);
    if (!duel.roundTokens || typeof duel.roundTokens !== "object") duel.roundTokens = {};
    if (!duel.roundTokens[roundKey]) duel.roundTokens[roundKey] = {};
    [duel.challengerId, duel.opponentId].forEach((userId) => {
        if (!duel.roundTokens[roundKey][userId]) duel.roundTokens[roundKey][userId] = newAttemptToken();
    });
    if (!duel.roundStartedAt) duel.roundStartedAt = new Date().toISOString();
}

function ensureTournamentRoundSecurity(tournament) {
    if (!tournament.attemptToken) tournament.attemptToken = newAttemptToken();
    if (!tournament.roundStartedAt) tournament.roundStartedAt = new Date().toISOString();
}

function getTodayKeyUtc() {
    return new Date().toISOString().slice(0, 10);
}

function getSeasonIdUtc() {
    return new Date().toISOString().slice(0, 7);
}

function buildDailyChallengeTemplate(dayKey) {
    return {
        dayKey,
        claimed: false,
        tasks: DAILY_CHALLENGE_TASKS.map((task) => ({
            ...task,
            progress: 0,
        })),
    };
}

function buildSeasonTemplate(seasonId) {
    return {
        id: seasonId,
        points: 0,
    };
}

function normalizeDailyFromIncoming(baseDaily, incomingDaily) {
    const source = incomingDaily && typeof incomingDaily === "object" ? incomingDaily : {};
    const merged = {
        dayKey: String(baseDaily.dayKey),
        claimed: !!source.claimed,
        tasks: baseDaily.tasks.map((task) => ({ ...task, progress: 0 })),
    };

    const incomingTasks = Array.isArray(source.tasks) ? source.tasks : [];
    merged.tasks.forEach((task) => {
        const found = incomingTasks.find((entry) => entry && entry.id === task.id);
        const nextProgress = found ? clampInt(found.progress, 0, task.target) : 0;
        task.progress = nextProgress;
    });
    return merged;
}

function ensureUserProgression(user) {
    if (!user || typeof user !== "object") return null;
    if (!user.progression || typeof user.progression !== "object") {
        user.progression = {};
    }

    const todayKey = getTodayKeyUtc();
    const seasonId = getSeasonIdUtc();
    const currentDaily = user.progression.daily;
    const currentSeason = user.progression.season;

    const defaultDaily = buildDailyChallengeTemplate(todayKey);
    const defaultSeason = buildSeasonTemplate(seasonId);

    if (!currentDaily || currentDaily.dayKey !== todayKey) {
        user.progression.daily = defaultDaily;
    } else {
        user.progression.daily = normalizeDailyFromIncoming(defaultDaily, currentDaily);
    }

    if (!currentSeason || String(currentSeason.id || "") !== seasonId) {
        user.progression.season = defaultSeason;
    } else {
        user.progression.season = {
            id: seasonId,
            points: clampInt(currentSeason.points, 0, 1000000),
        };
    }

    user.progression.xp = clampInt(user.progression.xp, 0, 100000000);
    user.progression.level = Math.max(1, Math.floor(Math.sqrt(user.progression.xp / 120)) + 1);
    user.progression.rankedPoints = clampInt(user.progression.rankedPoints, 0, 1000000);
    user.progression.winStreak = clampInt(user.progression.winStreak, 0, 100000);
    user.progression.bestStreak = Math.max(
        user.progression.winStreak,
        clampInt(user.progression.bestStreak, 0, 100000)
    );
    if (!user.progression.mastery || typeof user.progression.mastery !== "object") {
        user.progression.mastery = {};
    }
    for (const game of DRAFT_GAMES) {
        const current = user.progression.mastery[game.id];
        user.progression.mastery[game.id] = {
            xp: clampInt(current?.xp, 0, 10000000),
            wins: clampInt(current?.wins, 0, 100000),
            plays: clampInt(current?.plays, 0, 100000),
        };
    }
    if (!Array.isArray(user.progression.badges)) user.progression.badges = [];
    user.progression.badges = [...new Set(user.progression.badges.map(String))].slice(0, 100);
    if (!user.progression.cosmetics || typeof user.progression.cosmetics !== "object") {
        user.progression.cosmetics = {};
    }
    const unlocked = Object.fromEntries(
        Object.entries(COSMETIC_CATALOG).map(([category, items]) => [
            category,
            items.filter((item) => item.level <= user.progression.level).map((item) => item.id),
        ])
    );
    user.progression.cosmetics = {
        avatar: unlocked.avatars.includes(user.progression.cosmetics.avatar)
            ? user.progression.cosmetics.avatar
            : unlocked.avatars[0],
        arena: unlocked.arenas.includes(user.progression.cosmetics.arena)
            ? user.progression.cosmetics.arena
            : unlocked.arenas[0],
        trail: unlocked.trails.includes(user.progression.cosmetics.trail)
            ? user.progression.cosmetics.trail
            : unlocked.trails[0],
        unlocked,
    };

    return user.progression;
}

function rankFromPoints(points) {
    if (points >= 2400) return "Legend";
    if (points >= 1400) return "Elite";
    if (points >= 700) return "Contender";
    return "Rookie";
}

function awardCompetitiveProgress(user, gameId, won, matchWon = false) {
    const progression = ensureUserProgression(user);
    const mastery = progression.mastery[gameId] || { xp: 0, wins: 0, plays: 0 };
    const xpGain = 35 + (won ? 35 : 0) + (matchWon ? 55 : 0);
    progression.xp += xpGain;
    progression.level = Math.max(1, Math.floor(Math.sqrt(progression.xp / 120)) + 1);
    progression.rankedPoints = Math.max(0, progression.rankedPoints + (matchWon ? 42 : won ? 12 : -18));
    mastery.xp += 24 + (won ? 28 : 0);
    mastery.plays += 1;
    if (won) mastery.wins += 1;
    progression.mastery[gameId] = mastery;

    if (matchWon) {
        progression.winStreak += 1;
        progression.bestStreak = Math.max(progression.bestStreak, progression.winStreak);
        const today = getTodayKeyUtc();
        if (progression.firstWinDay !== today) {
            progression.firstWinDay = today;
            progression.xp += 100;
        }
    } else if (matchWon === false && !won) {
        progression.winStreak = 0;
    }

    const badges = new Set(progression.badges);
    if (mastery.wins >= 10) badges.add(`${gameId}:specialist`);
    if (progression.bestStreak >= 3) badges.add("hot-streak");
    if (progression.bestStreak >= 10) badges.add("unstoppable");
    if (progression.level >= 10) badges.add("arena-regular");
    progression.badges = [...badges];

    return {
        xpGain,
        level: progression.level,
        rank: rankFromPoints(progression.rankedPoints),
        mastery: progression.mastery[gameId],
    };
}

function advanceDailyTask(user, taskId, amount = 1) {
    const daily = ensureUserProgression(user).daily;
    const task = daily.tasks.find((entry) => entry.id === taskId);
    if (task) task.progress = clampInt(task.progress + amount, 0, task.target);
}

function sumDailyRewardXp(daily) {
    if (!daily || !Array.isArray(daily.tasks)) return 0;
    return daily.tasks.reduce((sum, task) => sum + clampInt(task.rewardXp, 0, 5000), 0);
}

function allDailyTasksCompleted(daily) {
    if (!daily || !Array.isArray(daily.tasks) || daily.tasks.length === 0) return false;
    return daily.tasks.every((task) => clampInt(task.progress, 0, task.target) >= task.target);
}

function normalizeDraftGameId(value) {
    const id = String(value || "").trim();
    const normalized = DRAFT_GAME_ALIASES[id] || id;
    return DRAFT_GAMES.some((g) => g.id === normalized) ? normalized : "";
}

function summarizeDraft(draft) {
    if (!draft) return "";
    const lookup = Object.fromEntries(DRAFT_GAMES.map((g) => [g.id, g.label]));
    const c = draft.challenger;
    const o = draft.opponent;
    return `Draft: you banned ${lookup[c.ban]} / favored ${lookup[c.pick]} • opponent banned ${lookup[o.ban]} / favored ${lookup[o.pick]}`;
}

function normalizeDraftSide(side) {
    if (!side || typeof side !== "object") return null;
    const ban = normalizeDraftGameId(side.ban);
    const pick = normalizeDraftGameId(side.pick);
    if (!ban || !pick || ban === pick) return null;
    return { ban, pick };
}

function normalizeDraftPlan(draft) {
    if (!draft || typeof draft !== "object") return null;
    const challenger = normalizeDraftSide(draft.challenger);
    const opponent = normalizeDraftSide(draft.opponent);
    if (!challenger || !opponent) return null;
    return { challenger, opponent };
}

function pushHistory(user, entry) {
    user.history.unshift({
        ...entry,
        date: new Date().toISOString(),
    });
    user.history = user.history.slice(0, 100);
}

function recordProductEvent(db, type, userId, properties = {}) {
    if (!Array.isArray(db.productEvents)) db.productEvents = [];
    db.productEvents.push({
        id: crypto.randomUUID(),
        type: String(type || "").slice(0, 64),
        userId: String(userId || "").slice(0, 64),
        properties: properties && typeof properties === "object" ? properties : {},
        at: new Date().toISOString(),
    });
    db.productEvents = db.productEvents.slice(-10000);
}

/** Total net gains today (UTC day) for a user. */
function dailyGainToday(user) {
    const todayPrefix = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return user.history.reduce((sum, h) => {
        if (h.date && h.date.startsWith(todayPrefix) && h.net > 0) {
            return sum + h.net;
        }
        return sum;
    }, 0);
}

/** Apply wallet floor: if wallet < WALLET_FLOOR, top up to WALLET_FLOOR_CREDIT. */
function applyWalletFloor(user) {
    if (user.wallet < WALLET_FLOOR) {
        user.wallet = toMoney2(user.wallet + WALLET_FLOOR_CREDIT);
        pushHistory(user, {
            type: "FLOOR_CREDIT",
            result: "CREDIT",
            stake: 0,
            net: WALLET_FLOOR_CREDIT,
            note: "Wallet floor auto-credit",
        });
    }
}

function getActiveUser(db) {
    return db.users.find((u) => u.id === db.activeUserId) || db.users[0];
}

function resolveUserByIdentity(db, userId, clientId) {
    const uid = String(userId || "").trim();
    if (uid) {
        return db.users.find((u) => u.id === uid) || null;
    }

    const cid = String(clientId || "").trim();
    if (cid && db.clientSessions && db.clientSessions[cid]) {
        const mapped = db.users.find((u) => u.id === db.clientSessions[cid]);
        if (mapped) return mapped;
    }

    return getActiveUser(db);
}

function ensureCollections(db) {
    if (!Array.isArray(db.duels)) db.duels = [];
    if (!Array.isArray(db.tournaments)) db.tournaments = [];
    if (!db.rivalries || typeof db.rivalries !== "object") db.rivalries = {};
    if (!Array.isArray(db.challenges)) db.challenges = [];
    if (!Array.isArray(db.matchmakingQueue)) db.matchmakingQueue = [];
    if (!Array.isArray(db.productEvents)) db.productEvents = [];
    if (!Array.isArray(db.users)) db.users = [];
    if (!db.clientSessions || typeof db.clientSessions !== "object") db.clientSessions = {};
    db.users.forEach((user) => ensureUserProgression(user));
}

function normalizeDuelRoomState(duel) {
    if (!duel || typeof duel !== "object") return;
    if (!duel.room || typeof duel.room !== "object") {
        duel.room = { readyBy: {}, readyCountdownAt: null };
    }
    if (!duel.room.readyBy || typeof duel.room.readyBy !== "object") {
        duel.room.readyBy = {};
    }
    if (!Object.prototype.hasOwnProperty.call(duel.room, "readyCountdownAt")) {
        duel.room.readyCountdownAt = null;
    }
}

function duelRoomSnapshot(duel) {
    normalizeDuelRoomState(duel);
    return {
        duelId: duel.id,
        status: duel.status,
        challengerId: duel.challengerId,
        opponentId: duel.opponentId,
        readyBy: duel.room.readyBy,
        readyCountdownAt: duel.room.readyCountdownAt,
        games: duel.games || [],
        currentRound: duel.currentRound || 1,
        score: duel.score || { challenger: 0, opponent: 0 },
        createdAt: duel.createdAt,
    };
}

function isDuelParticipant(duel, userId) {
    return duel.challengerId === userId || duel.opponentId === userId;
}

function tournamentGames() {
    return ["bounce", "symbolrush", "bombpass"];
}

function createTournamentDuel(db, tournament, playerAId, playerBId, round, matchIndex) {
    const duel = {
        id: crypto.randomUUID(),
        challengerId: playerAId,
        opponentId: playerBId,
        stake: 0,
        status: "pending",
        bestOf: 3,
        draft: null,
        games: tournamentGames(),
        tournamentId: tournament.id,
        tournamentRound: round,
        tournamentMatchIndex: matchIndex,
        room: { readyBy: {}, readyCountdownAt: null },
        createdAt: new Date().toISOString(),
    };
    db.duels.push(duel);
    return duel;
}

function createTournamentRound(db, tournament, playerIds, round) {
    const matches = [];
    for (let index = 0; index < playerIds.length; index += 2) {
        const playerAId = playerIds[index];
        const playerBId = playerIds[index + 1];
        const duel = createTournamentDuel(db, tournament, playerAId, playerBId, round, index / 2);
        matches.push({
            id: crypto.randomUUID(),
            duelId: duel.id,
            playerAId,
            playerBId,
            winnerId: null,
            status: "pending",
            deadlineAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        });
    }
    tournament.bracket.push({ round, matches });
    tournament.currentRound = round;
}

function advanceMultiplayerTournament(db, duel) {
    if (!duel.tournamentId || duel.status !== "done" || !duel.winnerId) return;
    const tournament = db.tournaments.find(
        (entry) => entry.id === duel.tournamentId && entry.kind === "multiplayer"
    );
    if (!tournament || tournament.status !== "playing") return;
    const bracketRound = tournament.bracket.find((entry) => entry.round === duel.tournamentRound);
    const match = bracketRound?.matches.find((entry) => entry.duelId === duel.id);
    if (!match || match.status === "done") return;
    match.status = "done";
    match.winnerId = duel.winnerId;
    match.finishedAt = new Date().toISOString();

    if (!bracketRound.matches.every((entry) => entry.status === "done")) return;
    const winners = bracketRound.matches.map((entry) => entry.winnerId);
    if (winners.length === 1) {
        tournament.status = "done";
        tournament.championId = winners[0];
        tournament.finishedAt = new Date().toISOString();
        return;
    }
    createTournamentRound(db, tournament, winners, bracketRound.round + 1);
}

function resolveExpiredTournamentMatches(db) {
    const now = Date.now();
    for (const tournament of db.tournaments.filter(
        (entry) => entry.kind === "multiplayer" && entry.status === "playing"
    )) {
        for (const round of tournament.bracket) {
            for (const match of round.matches) {
                if (match.status !== "pending" || Date.parse(match.deadlineAt) > now) continue;
                const duel = db.duels.find((entry) => entry.id === match.duelId);
                if (!duel || duel.status !== "pending") continue;
                const playerA = db.users.find((user) => user.id === match.playerAId);
                const playerB = db.users.find((user) => user.id === match.playerBId);
                const winnerId = playerB?.presence?.online && !playerA?.presence?.online
                    ? match.playerBId
                    : match.playerAId;
                duel.games = tournamentGames();
                duel.currentRound = 1;
                duel.score = winnerId === duel.challengerId
                    ? { challenger: 2, opponent: 0 }
                    : { challenger: 0, opponent: 2 };
                duel.rounds = [{
                    round: 1,
                    gameId: "bounce",
                    challengerScore: winnerId === duel.challengerId ? 1000 : 0,
                    opponentScore: winnerId === duel.opponentId ? 1000 : 0,
                    challengerMetric: 300000,
                    opponentMetric: 300000,
                    winnerId,
                    authoritative: true,
                    detail: "tournament-no-show",
                }];
                duel.status = "playing";
                normalizeDuelRoomState(duel);
                settleLiveDuel(db, duel, winnerId);
            }
        }
    }
}

function publicDuelMatch(duel, userId, db) {
    if (duel.status === "playing") ensureDuelRoundSecurity(duel);
    const opponentId = duel.challengerId === userId ? duel.opponentId : duel.challengerId;
    const usersById = Object.fromEntries(db.users.map((user) => [user.id, user]));
    const submissions = duel.submissions || {};

    return {
        duelId: duel.id,
        status: duel.status,
        challengerId: duel.challengerId,
        opponentId: duel.opponentId,
        opponentName: usersById[opponentId]?.playerName || "Rival",
        stake: duel.stake,
        games: duel.games || [],
        currentRound: duel.currentRound || 1,
        score: duel.score || { challenger: 0, opponent: 0 },
        rounds: duel.rounds || [],
        winnerId: duel.winnerId || null,
        loserId: duel.loserId || null,
        rematchId: duel.rematchId || null,
        attemptToken: duel.status === "playing"
            ? duel.roundTokens?.[String(duel.currentRound)]?.[userId] || null
            : null,
        roundStartedAt: duel.roundStartedAt || null,
        bestOf: duel.bestOf || 3,
        spectatorCount: clampInt(duel.spectatorCount, 0, 10000),
        lastAuthoritativeResult: duel.lastAuthoritativeResult || null,
        reactions: Array.isArray(duel.reactions) ? duel.reactions.slice(-12) : [],
        submittedBy: Object.fromEntries(
            Object.entries(submissions).map(([round, values]) => [
                round,
                Object.keys(values || {}),
            ])
        ),
    };
}

function settleLiveDuel(db, duel, winnerId) {
    const challenger = db.users.find((user) => user.id === duel.challengerId);
    const opponent = db.users.find((user) => user.id === duel.opponentId);
    const loserId = winnerId === duel.challengerId ? duel.opponentId : duel.challengerId;
    const winner = winnerId === challenger.id ? challenger : opponent;
    const stake = duel.stake;
    const payout = toMoney2(stake * 2 * 0.85);
    const gainToday = dailyGainToday(winner);
    const allowedGain = Math.max(0, toMoney2(MAX_DAILY_GAIN - gainToday));
    const cappedPayout = toMoney2(Math.min(payout, stake + allowedGain));
    const winnerNet = toMoney2(cappedPayout - stake);
    const loserNet = toMoney2(-stake);
    const capApplied = cappedPayout < payout;

    winner.wallet = toMoney2(winner.wallet + cappedPayout);
    pushHistory(challenger, {
        type: "DUEL_P2P",
        result: winnerId === challenger.id ? "WIN" : "LOSS",
        opponentId: opponent.id,
        opponentName: opponent.playerName,
        stake,
        net: winnerId === challenger.id ? winnerNet : loserNet,
        note: duel.draft ? summarizeDraft(duel.draft) : "Live Best-of-3",
        ...(winnerId === challenger.id && capApplied ? { capApplied: true } : {}),
    });
    pushHistory(opponent, {
        type: "DUEL_P2P",
        result: winnerId === opponent.id ? "WIN" : "LOSS",
        opponentId: challenger.id,
        opponentName: challenger.playerName,
        stake,
        net: winnerId === opponent.id ? winnerNet : loserNet,
        note: duel.draft ? summarizeDraft(duel.draft) : "Live Best-of-3",
        ...(winnerId === opponent.id && capApplied ? { capApplied: true } : {}),
    });

    applyWalletFloor(challenger);
    applyWalletFloor(opponent);
    duel.status = "done";
    duel.winnerId = winnerId;
    duel.loserId = loserId;
    duel.playedAt = new Date().toISOString();
    duel.room.readyBy = {};
    duel.room.readyCountdownAt = null;

    const pairKey = [duel.challengerId, duel.opponentId].sort().join("_");
    if (!db.rivalries[pairKey]) {
        db.rivalries[pairKey] = {
            users: [duel.challengerId, duel.opponentId],
            wins: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
            last5: [],
        };
    }
    db.rivalries[pairKey].wins[winnerId] = (db.rivalries[pairKey].wins[winnerId] || 0) + 1;
    db.rivalries[pairKey].last5.unshift({ winnerId, date: duel.playedAt });
    db.rivalries[pairKey].last5 = db.rivalries[pairKey].last5.slice(0, 5);

    const finalGame = duel.rounds.at(-1)?.gameId || duel.games?.[duel.currentRound - 1] || "bounce";
    awardCompetitiveProgress(winner, finalGame, true, true);
    awardCompetitiveProgress(winnerId === challenger.id ? opponent : challenger, finalGame, false, false);
    advanceDailyTask(challenger, "duel_complete");
    advanceDailyTask(opponent, "duel_complete");
    advanceMultiplayerTournament(db, duel);
}

function getSkillProfile(user) {
    const stats = getStats(user?.history || []);
    if (stats.matches < 5 || stats.winRate < 40) {
        return SKILL_POOLS[0];
    }
    if (stats.matches < 15 || stats.winRate < 70) {
        return SKILL_POOLS[1];
    }
    return SKILL_POOLS[2];
}

function getStakeCapForUser(user) {
    return getSkillProfile(user).stakeCap;
}

function isStakeAllowedForUser(user, stake) {
    const numericStake = Number(stake);
    return ALLOWED_STAKES.includes(numericStake) && numericStake <= getStakeCapForUser(user);
}

function statePayload(db, userId, clientId) {
    const activeUser = resolveUserByIdentity(db, userId, clientId);
    const activeSkill = getSkillProfile(activeUser);
    const progression = ensureUserProgression(activeUser);
    return {
        schemaVersion: SCHEMA_VERSION,
        currency: db.currency || "SLAP$",
        activeUserId: activeUser.id,
        users: db.users.map((u) => ({
            id: u.id,
            playerName: u.playerName,
            wallet: u.wallet,
            stake: u.stake,
            stats: getStats(u.history),
            skillPool: getSkillProfile(u).label,
            stakeCap: getSkillProfile(u).stakeCap,
        })),
        playerName: activeUser.playerName,
        wallet: activeUser.wallet,
        stake: activeUser.stake,
        history: activeUser.history,
        stats: getStats(activeUser.history),
        skillPool: activeSkill.label,
        stakeCap: activeSkill.stakeCap,
        progression: {
            ...progression,
            rank: rankFromPoints(progression.rankedPoints),
        },
    };
}

function createService(store) {
    return {
        getHealth() {
            return { ok: true, service: "slaptax-mvp-api", schemaVersion: SCHEMA_VERSION };
        },

        getState(userId, clientId) {
            const db = store.read();
            ensureCollections(db);
            return statePayload(db, userId || null, clientId || null);
        },

        joinSession(playerName, clientId) {
            const name = String(playerName || "").trim();
            const cid = String(clientId || "").trim();
            if (!name || name.length > 20) {
                return { error: "playerName is required (1-20 chars)", code: 400 };
            }
            if (!cid) {
                return { error: "clientId is required", code: 400 };
            }

            const db = store.read();
            ensureCollections(db);

            let user = null;
            const mappedUserId = db.clientSessions[cid];
            if (mappedUserId) {
                user = db.users.find((u) => u.id === mappedUserId) || null;
            }

            // Keep identity stable for this client only if the name is unchanged.
            // If the client joins with a different name, create a brand new player ID.
            if (!user || user.playerName !== name) {
                user = {
                    id: crypto.randomUUID(),
                    playerName: name,
                    wallet: 25,
                    stake: 5,
                    history: [],
                };
                db.users.push(user);
            }

            db.clientSessions[cid] = user.id;
            db.activeUserId = user.id;
            store.write(db);

            return {
                ok: true,
                user,
                userId: user.id,
                clientId: cid,
                activeUserId: user.id,
            };
        },

        getChallengeProgress(userId) {
            const id = String(userId || "").trim();
            if (!id) return { error: "userId is required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((u) => u.id === id);
            if (!user) return { error: "userId not found", code: 404 };

            const progression = ensureUserProgression(user);
            store.write(db);
            return {
                ok: true,
                daily: progression.daily,
                season: progression.season,
                serverClock: new Date().toISOString(),
            };
        },

        syncChallengeProgress(userId, daily, season) {
            const id = String(userId || "").trim();
            if (!id) return { error: "userId is required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((u) => u.id === id);
            if (!user) return { error: "userId not found", code: 404 };

            const progression = ensureUserProgression(user);
            const todayKey = getTodayKeyUtc();
            const seasonId = getSeasonIdUtc();

            if (daily && typeof daily === "object" && String(daily.dayKey || "") === todayKey) {
                progression.daily = normalizeDailyFromIncoming(buildDailyChallengeTemplate(todayKey), daily);
            }

            if (season && typeof season === "object" && String(season.id || "") === seasonId) {
                progression.season = {
                    id: seasonId,
                    points: clampInt(season.points, 0, 1000000),
                };
            }

            store.write(db);
            return {
                ok: true,
                daily: progression.daily,
                season: progression.season,
                serverClock: new Date().toISOString(),
            };
        },

        claimChallengeReward(userId) {
            const id = String(userId || "").trim();
            if (!id) return { error: "userId is required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((u) => u.id === id);
            if (!user) return { error: "userId not found", code: 404 };

            const progression = ensureUserProgression(user);
            if (progression.daily.claimed || !allDailyTasksCompleted(progression.daily)) {
                store.write(db);
                return {
                    ok: true,
                    claimed: false,
                    rewardXp: 0,
                    seasonGain: 0,
                    daily: progression.daily,
                    season: progression.season,
                    serverClock: new Date().toISOString(),
                };
            }

            const rewardXp = sumDailyRewardXp(progression.daily);
            const seasonGain = Math.max(30, Math.round(rewardXp * 0.5));
            progression.daily.claimed = true;
            progression.season.points = clampInt((progression.season.points || 0) + seasonGain, 0, 1000000);

            store.write(db);
            return {
                ok: true,
                claimed: true,
                rewardXp,
                seasonGain,
                daily: progression.daily,
                season: progression.season,
                serverClock: new Date().toISOString(),
            };
        },

        setCosmetics(userId, cosmetics) {
            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((entry) => entry.id === userId);
            if (!user) return { error: "User not found", code: 404 };
            const progression = ensureUserProgression(user);
            const requested = cosmetics && typeof cosmetics === "object" ? cosmetics : {};
            for (const [field, category] of [["avatar", "avatars"], ["arena", "arenas"], ["trail", "trails"]]) {
                if (requested[field] && !progression.cosmetics.unlocked[category].includes(requested[field])) {
                    return { error: `${field} is not unlocked`, code: 403 };
                }
            }
            progression.cosmetics = {
                ...progression.cosmetics,
                avatar: requested.avatar || progression.cosmetics.avatar,
                arena: requested.arena || progression.cosmetics.arena,
                trail: requested.trail || progression.cosmetics.trail,
            };
            store.write(db);
            return { ok: true, cosmetics: progression.cosmetics };
        },

        listMultiplayerTournaments(userId) {
            const db = store.read();
            ensureCollections(db);
            resolveExpiredTournamentMatches(db);
            store.write(db);
            const usersById = Object.fromEntries(db.users.map((user) => [user.id, user]));
            const tournaments = db.tournaments
                .filter((entry) => entry.kind === "multiplayer")
                .filter((entry) => entry.visibility === "public" || entry.hostId === userId || entry.entrants.includes(userId))
                .map((entry) => ({
                    ...entry,
                    entrants: entry.entrants.map((id) => ({
                        id,
                        name: usersById[id]?.playerName || "Player",
                        online: !!usersById[id]?.presence?.online,
                        bot: false,
                    })),
                }));
            return { ok: true, tournaments };
        },

        createMultiplayerTournament(hostId, size, visibility = "private", name = "") {
            const db = store.read();
            ensureCollections(db);
            const host = db.users.find((user) => user.id === hostId);
            if (!host) return { error: "Host not found", code: 404 };
            const normalizedSize = Number(size);
            if (!ALLOWED_TOURNAMENT_SIZES.includes(normalizedSize)) {
                return { error: "Tournament size must be 4, 8, or 16", code: 400 };
            }
            const tournament = {
                id: crypto.randomUUID(),
                kind: "multiplayer",
                name: String(name || "Arena Cup").trim().slice(0, 40) || "Arena Cup",
                hostId,
                size: normalizedSize,
                visibility: visibility === "public" ? "public" : "private",
                status: "waiting",
                entrants: [hostId],
                bracket: [],
                currentRound: 0,
                championId: null,
                createdAt: new Date().toISOString(),
            };
            db.tournaments.push(tournament);
            store.write(db);
            return { ok: true, tournament };
        },

        joinMultiplayerTournament(tournamentId, userId) {
            const db = store.read();
            ensureCollections(db);
            const tournament = db.tournaments.find(
                (entry) => entry.id === tournamentId && entry.kind === "multiplayer"
            );
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (tournament.status !== "waiting") return { error: "Tournament already started", code: 409 };
            if (!db.users.some((user) => user.id === userId)) return { error: "User not found", code: 404 };
            if (!tournament.entrants.includes(userId)) {
                if (tournament.entrants.length >= tournament.size) return { error: "Tournament is full", code: 409 };
                tournament.entrants.push(userId);
            }
            store.write(db);
            return { ok: true, tournament };
        },

        startMultiplayerTournament(tournamentId, userId) {
            const db = store.read();
            ensureCollections(db);
            const tournament = db.tournaments.find(
                (entry) => entry.id === tournamentId && entry.kind === "multiplayer"
            );
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (tournament.hostId !== userId) return { error: "Only the host can start", code: 403 };
            if (tournament.status !== "waiting") return { ok: true, tournament };
            if (tournament.entrants.length !== tournament.size) {
                return { error: `Waiting for ${tournament.size - tournament.entrants.length} players`, code: 409 };
            }
            const seeded = shuffled(tournament.entrants);
            tournament.status = "playing";
            tournament.startedAt = new Date().toISOString();
            createTournamentRound(db, tournament, seeded, 1);
            store.write(db);
            return { ok: true, tournament };
        },

        getMultiplayerTournament(tournamentId, userId) {
            const db = store.read();
            ensureCollections(db);
            resolveExpiredTournamentMatches(db);
            store.write(db);
            const tournament = db.tournaments.find(
                (entry) => entry.id === tournamentId && entry.kind === "multiplayer"
            );
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (
                tournament.visibility !== "public"
                && tournament.hostId !== userId
                && !tournament.entrants.includes(userId)
            ) {
                return { error: "Tournament is private", code: 403 };
            }
            const usersById = Object.fromEntries(db.users.map((user) => [user.id, user]));
            const activeDuel = [...db.duels].reverse().find(
                (duel) => duel.tournamentId === tournament.id
                    && isDuelParticipant(duel, userId)
                    && ["pending", "playing"].includes(duel.status)
            );
            const spectatableDuel = [...db.duels].reverse().find(
                (duel) => duel.tournamentId === tournament.id
                    && duel.status === "playing"
                    && !isDuelParticipant(duel, userId)
            );
            const spectatorOpponent = spectatableDuel
                ? usersById[spectatableDuel.opponentId]?.playerName || "Player"
                : null;
            return {
                ok: true,
                tournament: {
                    ...tournament,
                    entrants: tournament.entrants.map((id) => ({
                        id,
                        name: usersById[id]?.playerName || "Player",
                        online: !!usersById[id]?.presence?.online,
                        bot: false,
                    })),
                    bracket: tournament.bracket.map((round) => ({
                        ...round,
                        matches: round.matches.map((match) => ({
                            ...match,
                            playerAName: usersById[match.playerAId]?.playerName || "Player",
                            playerBName: usersById[match.playerBId]?.playerName || "Player",
                            winnerName: usersById[match.winnerId]?.playerName || null,
                        })),
                    })),
                },
                activeDuelId: activeDuel?.id || null,
                spectatorMatch: spectatableDuel ? {
                    duelId: spectatableDuel.id,
                    challengerId: spectatableDuel.challengerId,
                    opponentName: spectatorOpponent,
                    games: spectatableDuel.games,
                    currentRound: spectatableDuel.currentRound,
                    status: spectatableDuel.status,
                } : null,
            };
        },

        getHistory(userId, clientId) {
            const db = store.read();
            ensureCollections(db);
            const activeUser = resolveUserByIdentity(db, userId, clientId);
            return { history: activeUser.history };
        },

        getStats(userId, clientId) {
            const db = store.read();
            ensureCollections(db);
            const activeUser = resolveUserByIdentity(db, userId, clientId);
            return getStats(activeUser.history);
        },

        listUsers(userId, clientId) {
            const db = store.read();
            ensureCollections(db);
            const activeUser = resolveUserByIdentity(db, userId, clientId);
            return {
                activeUserId: activeUser.id,
                users: db.users.map((u) => ({
                    id: u.id,
                    playerName: u.playerName,
                    wallet: u.wallet,
                    stake: u.stake,
                    stats: getStats(u.history),
                    online: !!u.presence?.online,
                    lastSeenAt: u.presence?.lastSeenAt || null,
                    rank: rankFromPoints(ensureUserProgression(u).rankedPoints),
                })),
            };
        },

        createUser(playerName) {
            const name = String(playerName || "").trim();
            if (!name || name.length > 20) {
                return { error: "playerName is required (1-20 chars)", code: 400 };
            }
            const db = store.read();
            const user = {
                id: crypto.randomUUID(),
                playerName: name,
                wallet: 25,
                stake: 5,
                history: [],
            };
            db.users.push(user);
            db.activeUserId = user.id;
            store.write(db);
            return { ok: true, user, activeUserId: db.activeUserId };
        },

        selectUser(userId) {
            const id = String(userId || "").trim();
            const db = store.read();
            const user = db.users.find((u) => u.id === id);
            if (!user) {
                return { error: "userId not found", code: 404 };
            }
            db.activeUserId = user.id;
            store.write(db);
            return { ok: true, activeUserId: db.activeUserId, user };
        },

        setProfile(playerName) {
            const name = String(playerName || "").trim();
            if (!name || name.length > 20) {
                return { error: "playerName is required (1-20 chars)", code: 400 };
            }
            const db = store.read();
            const activeUser = getActiveUser(db);
            activeUser.playerName = name;
            store.write(db);
            return { ok: true, playerName: activeUser.playerName, activeUserId: db.activeUserId };
        },

        setStake(stake, userId) {
            const numericStake = Number(stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            const db = store.read();
            const activeUser = userId
                ? (db.users.find((u) => u.id === userId) || getActiveUser(db))
                : getActiveUser(db);
            activeUser.stake = numericStake;
            store.write(db);
            return { ok: true, stake: activeUser.stake, activeUserId: activeUser.id };
        },

        topupWallet(amount) {
            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1000) {
                return { error: "amount must be > 0 and <= 1000", code: 400 };
            }
            const db = store.read();
            const activeUser = getActiveUser(db);
            activeUser.wallet = toMoney2(activeUser.wallet + numericAmount);
            store.write(db);
            return { ok: true, wallet: activeUser.wallet, activeUserId: db.activeUserId };
        },

        playDuel(stake) {
            const db = store.read();
            const activeUser = getActiveUser(db);
            const numericStake = Number(stake || activeUser.stake);

            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (activeUser.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            activeUser.wallet = toMoney2(activeUser.wallet - numericStake);
            const stats = getStats(activeUser.history);
            const duel = simulateDuel(numericStake, stats);

            if (duel.won) {
                const gainToday = dailyGainToday(activeUser);
                const allowedGain = Math.max(0, toMoney2(MAX_DAILY_GAIN - gainToday));
                const cappedPayout = toMoney2(Math.min(duel.payout, numericStake + allowedGain));
                activeUser.wallet = toMoney2(activeUser.wallet + cappedPayout);
                duel.net = toMoney2(cappedPayout - numericStake);
            }

            pushHistory(activeUser, {
                type: "DUEL",
                result: duel.won ? "WIN" : "LOSS",
                stake: numericStake,
                net: duel.net,
            });

            applyWalletFloor(activeUser);

            store.write(db);

            return {
                ok: true,
                duel,
                wallet: activeUser.wallet,
                stats: getStats(activeUser.history),
                activeUserId: db.activeUserId,
            };
        },

        resolveReflexDuel(stake, won, rounds = [], userId) {
            const db = store.read();
            const activeUser = userId
                ? (db.users.find((u) => u.id === userId) || getActiveUser(db))
                : getActiveUser(db);
            const numericStake = Number(stake || activeUser.stake);
            const didWin = won === true || won === "true" || won === 1 || won === "1";

            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (activeUser.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            activeUser.wallet = toMoney2(activeUser.wallet - numericStake);
            const payout = toMoney2(numericStake * 2 * 0.85);
            const winnerNet = toMoney2(payout - numericStake);
            const loserNet = toMoney2(-numericStake);

            let net = loserNet;
            if (didWin) {
                const gainToday = dailyGainToday(activeUser);
                const allowedGain = Math.max(0, toMoney2(MAX_DAILY_GAIN - gainToday));
                const cappedPayout = toMoney2(Math.min(payout, numericStake + allowedGain));
                activeUser.wallet = toMoney2(activeUser.wallet + cappedPayout);
                net = toMoney2(cappedPayout - numericStake);
            }

            const duel = {
                won: didWin,
                rounds,
                playerRounds: didWin ? 2 : 1,
                botRounds: didWin ? 1 : 2,
                net,
            };

            pushHistory(activeUser, {
                type: "DUEL_REFLEX",
                result: didWin ? "WIN" : "LOSS",
                stake: numericStake,
                net,
                note: "Reflex Best-of-3",
            });

            applyWalletFloor(activeUser);
            store.write(db);

            return {
                ok: true,
                duel,
                wallet: activeUser.wallet,
                stats: getStats(activeUser.history),
                activeUserId: db.activeUserId,
            };
        },

        simulateTournament(size, stake, draft = null) {
            const db = store.read();
            const activeUser = getActiveUser(db);
            const tournamentSize = Number(size || 8);
            const numericStake = Number(stake || activeUser.stake);

            if (!ALLOWED_TOURNAMENT_SIZES.includes(tournamentSize)) {
                return { error: "size must be one of 8, 16, 32", code: 400 };
            }

            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }

            if (activeUser.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            activeUser.wallet = toMoney2(activeUser.wallet - numericStake);
            const entrants = [
                activeUser,
                ...db.users.filter((user) => user.id !== activeUser.id),
            ].map((user) => ({
                id: user.id,
                name: user.playerName,
                winRate: getStats(user.history).winRate,
                bot: false,
            }));
            const tournament = simulateTournament(
                tournamentSize,
                numericStake,
                draft,
                entrants,
                activeUser.id
            );

            if (tournament.champion) {
                activeUser.wallet = toMoney2(activeUser.wallet + tournament.payout);
            }

            pushHistory(activeUser, {
                type: "TOURNAMENT",
                result: tournament.champion ? "WIN" : "LOSS",
                stake: numericStake,
                net: tournament.net,
            });

            store.write(db);

            return {
                ok: true,
                tournament,
                wallet: activeUser.wallet,
                stats: getStats(activeUser.history),
                activeUserId: db.activeUserId,
            };
        },

        createLiveTournament(size, stake, draft = null, userId = null) {
            const db = store.read();
            ensureCollections(db);
            const activeUser = resolveUserByIdentity(db, userId, null);
            const tournamentSize = Number(size || 8);
            const numericStake = Number(stake || activeUser.stake);

            if (!ALLOWED_TOURNAMENT_SIZES.includes(tournamentSize)) {
                return { error: "size must be one of 8, 16, 32", code: 400 };
            }
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (activeUser.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            const safeDraft = draft && normalizeDraftSide(draft);
            if (draft && !safeDraft) return { error: "Invalid tournament draft", code: 400 };

            activeUser.wallet = toMoney2(activeUser.wallet - numericStake);
            const games = resolveTournamentGames(safeDraft).slice(0, Math.log2(tournamentSize));
            const tournament = {
                id: crypto.randomUUID(),
                userId: activeUser.id,
                size: tournamentSize,
                stake: numericStake,
                status: "playing",
                games,
                currentRound: 1,
                roundsTotal: Math.log2(tournamentSize),
                rounds: [],
                draft: safeDraft,
                createdAt: new Date().toISOString(),
            };
            ensureTournamentRoundSecurity(tournament);
            db.tournaments.push(tournament);
            store.write(db);
            return { ok: true, tournament, wallet: activeUser.wallet };
        },

        getLiveTournament(tournamentId, userId) {
            const db = store.read();
            ensureCollections(db);
            const tournament = db.tournaments.find((entry) => entry.id === tournamentId);
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (tournament.userId !== userId) return { error: "Tournament does not belong to user", code: 403 };
            if (tournament.status === "playing") ensureTournamentRoundSecurity(tournament);
            return { ok: true, tournament };
        },

        getActiveLiveTournament(userId) {
            const db = store.read();
            ensureCollections(db);
            const tournament = [...db.tournaments]
                .reverse()
                .find((entry) => entry.userId === userId && entry.status === "playing");
            if (tournament) ensureTournamentRoundSecurity(tournament);
            return { ok: true, tournament: tournament || null };
        },

        abandonLiveTournament(tournamentId, userId) {
            const db = store.read();
            ensureCollections(db);
            const tournament = db.tournaments.find((entry) => entry.id === tournamentId);
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (tournament.userId !== userId) return { error: "Tournament does not belong to user", code: 403 };
            if (tournament.status !== "playing") return { ok: true, tournament };

            const user = db.users.find((entry) => entry.id === userId);
            tournament.status = "done";
            tournament.champion = false;
            tournament.payout = 0;
            tournament.net = toMoney2(-tournament.stake);
            tournament.abandoned = true;
            tournament.finishedAt = new Date().toISOString();
            pushHistory(user, {
                type: "TOURNAMENT",
                result: "LOSS",
                stake: tournament.stake,
                net: tournament.net,
                note: `Abandoned live tournament ${tournament.size} players`,
            });
            applyWalletFloor(user);
            store.write(db);
            return { ok: true, tournament, wallet: user.wallet };
        },

        submitLiveTournamentRound(tournamentId, userId, score, metric, attemptToken) {
            const db = store.read();
            ensureCollections(db);
            const tournament = db.tournaments.find((entry) => entry.id === tournamentId);
            if (!tournament) return { error: "Tournament not found", code: 404 };
            if (tournament.userId !== userId) return { error: "Tournament does not belong to user", code: 403 };
            if (tournament.status !== "playing") return { error: "Tournament already finished", code: 400 };
            if (tournament.submittingRound === tournament.currentRound) {
                return { ok: true, tournament };
            }
            ensureTournamentRoundSecurity(tournament);
            if (!attemptToken || attemptToken !== tournament.attemptToken) {
                return { error: "This tournament attempt is no longer active", code: 409 };
            }
            const performance = validateLivePerformance(score, metric);
            if (performance.error) return performance;

            const numericScore = performance.score;
            const numericMetric = performance.metric;
            const round = tournament.currentRound;
            const gameId = tournament.games[round - 1];
            const opponentName = `Seed ${Math.max(1, Math.floor(tournament.size / (2 ** round)))}-${round}`;
            const difficultyBase = 480 + round * 75;
            const opponentScore = clampInt(
                difficultyBase + Math.random() * 220 - (tournament.draft?.pick === gameId ? 45 : 0),
                300,
                980
            );
            const won = numericScore >= opponentScore;
            tournament.submittingRound = round;

            tournament.rounds.push({
                round,
                gameId,
                label: P2P_GAME_LIBRARY[gameId]?.label || gameId,
                opponentName,
                scoreFor: numericScore,
                scoreAgainst: opponentScore,
                metric: numericMetric,
                won,
            });

            const user = db.users.find((entry) => entry.id === userId);
            if (!won || round >= tournament.roundsTotal) {
                const champion = won && round >= tournament.roundsTotal;
                const payout = champion ? toMoney2(tournament.size * tournament.stake * 0.72) : 0;
                if (champion) user.wallet = toMoney2(user.wallet + payout);
                tournament.status = "done";
                tournament.champion = champion;
                tournament.payout = payout;
                tournament.net = champion ? toMoney2(payout - tournament.stake) : toMoney2(-tournament.stake);
                tournament.finishedAt = new Date().toISOString();
                pushHistory(user, {
                    type: "TOURNAMENT",
                    result: champion ? "WIN" : "LOSS",
                    stake: tournament.stake,
                    net: tournament.net,
                    note: `Live tournament ${tournament.size} players`,
                });
                applyWalletFloor(user);
            } else {
                tournament.currentRound += 1;
                tournament.attemptToken = newAttemptToken();
                tournament.roundStartedAt = new Date().toISOString();
            }
            tournament.submittingRound = null;

            store.write(db);
            return { ok: true, tournament, wallet: user.wallet };
        },

        reset() {
            const state = store.reset();
            return { ok: true, state };
        },

        // ── Sprint 2: P2P duels, rematch, rivalry, leaderboard ──────────────

        createDuel(challengerId, opponentId, stake, draft = null, bestOf = 3) {
            const db = store.read();
            ensureCollections(db);
            const challenger = db.users.find((u) => u.id === challengerId);
            const opponent = db.users.find((u) => u.id === opponentId);

            if (!challenger) return { error: "challengerId not found", code: 404 };
            if (!opponent) return { error: "opponentId not found", code: 404 };
            if (challengerId === opponentId) return { error: "Cannot challenge yourself", code: 400 };

            const numericStake = Number(stake || challenger.stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (challenger.wallet < numericStake) {
                return { error: "Challenger has insufficient wallet balance", code: 400 };
            }
            if (opponent.wallet < numericStake) {
                return { error: "Opponent has insufficient wallet balance", code: 400 };
            }

            const normalizedDraft = draft ? normalizeDraftPlan(draft) : null;
            if (draft && !normalizedDraft) {
                return { error: "Invalid draft plan", code: 400 };
            }
            const normalizedBestOf = clampInt(bestOf, 1, 7);
            if (normalizedBestOf % 2 === 0) {
                return { error: "bestOf must be an odd number between 1 and 7", code: 400 };
            }

            const duelId = crypto.randomUUID();
            const duel = {
                id: duelId,
                challengerId,
                opponentId,
                stake: numericStake,
                status: "pending",
                bestOf: normalizedBestOf,
                draft: normalizedDraft,
                room: { readyBy: {}, readyCountdownAt: null },
                createdAt: new Date().toISOString(),
            };
            db.duels.push(duel);
            store.write(db);
            return { ok: true, duel, draftSummary: summarizeDraft(normalizedDraft) };
        },

        joinMatchmaking(userId, stake = 2) {
            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((entry) => entry.id === userId);
            if (!user) return { error: "User not found", code: 404 };
            const numericStake = Number(stake);
            if (!ALLOWED_STAKES.includes(numericStake)) return { error: "Invalid stake", code: 400 };
            const active = db.duels.find(
                (duel) => isDuelParticipant(duel, userId) && ["pending", "playing"].includes(duel.status)
            );
            if (active) return { ok: true, status: "matched", duel: active };

            const rival = db.matchmakingQueue.find(
                (entry) => entry.userId !== userId && entry.stake === numericStake
            );
            if (!rival) {
                db.matchmakingQueue = db.matchmakingQueue.filter((entry) => entry.userId !== userId);
                db.matchmakingQueue.push({ userId, stake: numericStake, joinedAt: new Date().toISOString() });
                recordProductEvent(db, "matchmaking_joined", userId, { stake: numericStake });
                store.write(db);
                return { ok: true, status: "waiting" };
            }

            db.matchmakingQueue = db.matchmakingQueue.filter(
                (entry) => entry.userId !== userId && entry.userId !== rival.userId
            );
            store.write(db);
            const created = this.createDuel(rival.userId, userId, numericStake, null, 3);
            if (!created.ok) return created;
            const persisted = store.read();
            ensureCollections(persisted);
            recordProductEvent(persisted, "matchmaking_matched", rival.userId, {
                duelId: created.duel.id,
                stake: numericStake,
            });
            recordProductEvent(persisted, "matchmaking_matched", userId, {
                duelId: created.duel.id,
                stake: numericStake,
            });
            store.write(persisted);
            return { ok: true, status: "matched", duel: created.duel };
        },

        getMatchmakingStatus(userId) {
            const db = store.read();
            ensureCollections(db);
            const user = db.users.find((entry) => entry.id === userId);
            if (!user) return { error: "User not found", code: 404 };
            const duel = [...db.duels]
                .reverse()
                .find((entry) => isDuelParticipant(entry, userId) && ["pending", "playing"].includes(entry.status));
            if (duel) return { ok: true, status: "matched", duel };
            const queued = db.matchmakingQueue.find((entry) => entry.userId === userId);
            return {
                ok: true,
                status: queued ? "waiting" : "idle",
                joinedAt: queued ? queued.joinedAt : null,
            };
        },

        cancelMatchmaking(userId) {
            const db = store.read();
            ensureCollections(db);
            const wasQueued = db.matchmakingQueue.some((entry) => entry.userId === userId);
            db.matchmakingQueue = db.matchmakingQueue.filter((entry) => entry.userId !== userId);
            if (wasQueued) recordProductEvent(db, "matchmaking_cancelled", userId);
            store.write(db);
            return { ok: true };
        },

        createChallenge(challengerId, opponentId, stake, draft = null, message = "", bestOf = 3) {
            const db = store.read();
            ensureCollections(db);

            const challenger = db.users.find((u) => u.id === challengerId);
            const opponent = db.users.find((u) => u.id === opponentId);

            if (!challenger) return { error: "challengerId not found", code: 404 };
            if (!opponent) return { error: "opponentId not found", code: 404 };
            if (challengerId === opponentId) return { error: "Cannot challenge yourself", code: 400 };

            const numericStake = Number(stake || challenger.stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }

            const normalizedDraft = draft ? normalizeDraftPlan(draft) : null;
            if (draft && !normalizedDraft) {
                return { error: "Invalid draft plan", code: 400 };
            }

            const note = String(message || "").trim();
            const challenge = {
                id: crypto.randomUUID(),
                challengerId,
                opponentId,
                stake: numericStake,
                status: "pending",
                draft: normalizedDraft,
                message: note.slice(0, 140),
                bestOf: [1, 3, 5, 7].includes(Number(bestOf)) ? Number(bestOf) : 3,
                createdAt: new Date().toISOString(),
            };

            db.challenges.unshift(challenge);
            db.challenges = db.challenges.slice(0, 300);
            recordProductEvent(db, "invite_created", challengerId, {
                challengeId: challenge.id,
                opponentId,
                stake: numericStake,
                bestOf: challenge.bestOf,
            });
            store.write(db);
            return { ok: true, challenge, draftSummary: summarizeDraft(normalizedDraft) };
        },

        createOpenInvite(challengerId, stake, draft = null, message = "", bestOf = 3) {
            const db = store.read();
            ensureCollections(db);
            const challenger = db.users.find((user) => user.id === challengerId);
            if (!challenger) return { error: "challengerId not found", code: 404 };

            const numericStake = Number(stake || challenger.stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (challenger.wallet < numericStake) {
                return { error: "Challenger has insufficient wallet balance", code: 400 };
            }

            const normalizedDraft = draft ? normalizeDraftPlan(draft) : null;
            if (draft && !normalizedDraft) return { error: "Invalid draft plan", code: 400 };

            const challenge = {
                id: crypto.randomUUID(),
                challengerId,
                opponentId: null,
                stake: numericStake,
                status: "open",
                draft: normalizedDraft,
                message: String(message || "").trim().slice(0, 140),
                bestOf: [1, 3, 5, 7].includes(Number(bestOf)) ? Number(bestOf) : 3,
                createdAt: new Date().toISOString(),
            };
            db.challenges.unshift(challenge);
            recordProductEvent(db, "invite_created", challengerId, {
                challengeId: challenge.id,
                stake: numericStake,
                bestOf: challenge.bestOf,
            });
            store.write(db);
            return { ok: true, challenge };
        },

        getOpenInvite(challengeId) {
            const db = store.read();
            ensureCollections(db);
            const challenge = db.challenges.find((entry) => entry.id === challengeId);
            if (!challenge) return { error: "Invite not found", code: 404 };
            const challenger = db.users.find((user) => user.id === challenge.challengerId);
            return {
                ok: true,
                invite: {
                    id: challenge.id,
                    status: challenge.status,
                    challengerId: challenge.challengerId,
                    challengerName: challenger?.playerName || "Player",
                    stake: challenge.stake,
                    message: challenge.message || "",
                    duelId: challenge.duelId || null,
                },
            };
        },

        claimOpenInvite(challengeId, userId) {
            const db = store.read();
            ensureCollections(db);
            const challenge = db.challenges.find((entry) => entry.id === challengeId);
            if (!challenge) return { error: "Invite not found", code: 404 };
            if (challenge.status !== "open") {
                if (challenge.opponentId === userId && challenge.duelId) {
                    const duel = db.duels.find((entry) => entry.id === challenge.duelId);
                    return { ok: true, challenge, duel };
                }
                return { error: "Invite is no longer available", code: 409 };
            }
            if (challenge.challengerId === userId) return { error: "Cannot claim your own invite", code: 400 };
            if (!db.users.some((user) => user.id === userId)) return { error: "userId not found", code: 404 };

            const duel = {
                id: crypto.randomUUID(),
                challengerId: challenge.challengerId,
                opponentId: userId,
                stake: challenge.stake,
                status: "pending",
                bestOf: challenge.bestOf || 3,
                draft: challenge.draft,
                room: { readyBy: {}, readyCountdownAt: null },
                createdAt: new Date().toISOString(),
            };
            db.duels.push(duel);
            challenge.status = "accepted";
            challenge.opponentId = userId;
            challenge.respondedAt = new Date().toISOString();
            challenge.respondedBy = userId;
            challenge.duelId = duel.id;
            store.write(db);
            return { ok: true, challenge, duel };
        },

        listChallenges(userId, status = "pending") {
            const id = String(userId || "").trim();
            if (!id) return { error: "userId is required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const userExists = db.users.some((u) => u.id === id);
            if (!userExists) return { error: "userId not found", code: 404 };

            const filtered = db.challenges.filter((c) => {
                const belongsToUser = c.challengerId === id || c.opponentId === id;
                const statusMatch = status && status !== "all" ? c.status === status : true;
                return belongsToUser && statusMatch;
            });

            const usersById = Object.fromEntries(db.users.map((u) => [u.id, u]));
            const challenges = filtered.map((c) => ({
                ...c,
                challengerName: usersById[c.challengerId]?.playerName || c.challengerId,
                opponentName: usersById[c.opponentId]?.playerName || c.opponentId,
                direction: c.challengerId === id ? "outgoing" : "incoming",
            }));

            return { ok: true, challenges };
        },

        acceptChallenge(challengeId, userId) {
            const challengeKey = String(challengeId || "").trim();
            const actorId = String(userId || "").trim();
            if (!challengeKey || !actorId) return { error: "challengeId and userId are required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const challenge = db.challenges.find((c) => c.id === challengeKey);
            if (!challenge) return { error: "Challenge not found", code: 404 };
            if (challenge.status !== "pending") return { error: "Challenge already handled", code: 400 };
            if (challenge.opponentId !== actorId) return { error: "Only opponent can accept challenge", code: 403 };

            const duelResult = this.createDuel(
                challenge.challengerId,
                challenge.opponentId,
                challenge.stake,
                challenge.draft,
                challenge.bestOf || 3
            );
            if (!duelResult.ok) return duelResult;

            const persisted = store.read();
            ensureCollections(persisted);
            const persistedChallenge = persisted.challenges.find((c) => c.id === challengeKey);
            if (!persistedChallenge) return { error: "Challenge not found", code: 404 };

            persistedChallenge.status = "accepted";
            persistedChallenge.respondedAt = new Date().toISOString();
            persistedChallenge.respondedBy = actorId;
            persistedChallenge.duelId = duelResult.duel.id;
            store.write(persisted);

            return {
                ok: true,
                challenge: persistedChallenge,
                duel: duelResult.duel,
                draftSummary: duelResult.draftSummary,
            };
        },

        declineChallenge(challengeId, userId) {
            const challengeKey = String(challengeId || "").trim();
            const actorId = String(userId || "").trim();
            if (!challengeKey || !actorId) return { error: "challengeId and userId are required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const challenge = db.challenges.find((c) => c.id === challengeKey);
            if (!challenge) return { error: "Challenge not found", code: 404 };
            if (challenge.status !== "pending") return { error: "Challenge already handled", code: 400 };
            if (challenge.opponentId !== actorId) return { error: "Only opponent can decline challenge", code: 403 };

            challenge.status = "declined";
            challenge.respondedAt = new Date().toISOString();
            challenge.respondedBy = actorId;
            store.write(db);
            return { ok: true, challenge };
        },

        playDuelP2P(duelId) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((d) => d.id === duelId);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (duel.status !== "pending") return { error: "Duel already played", code: 400 };

            const challenger = db.users.find((u) => u.id === duel.challengerId);
            const opponent = db.users.find((u) => u.id === duel.opponentId);
            if (!challenger || !opponent) return { error: "User not found", code: 404 };

            const { stake } = duel;
            if (challenger.wallet < stake) return { error: "Challenger has insufficient wallet balance", code: 400 };
            if (opponent.wallet < stake) return { error: "Opponent has insufficient wallet balance", code: 400 };

            challenger.wallet = toMoney2(challenger.wallet - stake);
            opponent.wallet = toMoney2(opponent.wallet - stake);

            const challengerStats = getStats(challenger.history);
            const opponentStats = getStats(opponent.history);
            const played = simulateP2PDuel(stake, challengerStats, opponentStats, duel.draft || null);

            const winnerId = played.won ? duel.challengerId : duel.opponentId;
            const loserId = played.won ? duel.opponentId : duel.challengerId;
            const winner = db.users.find((u) => u.id === winnerId);
            const loser = db.users.find((u) => u.id === loserId);

            const payout = toMoney2(stake * 2 * 0.85);
            const winnerNet = toMoney2(payout - stake);
            const loserNet = toMoney2(-stake);

            // Anti-inflation: cap daily gains
            const winnerBeforeCap = winner;
            const gainToday = dailyGainToday(winnerBeforeCap);
            const allowedGain = Math.max(0, toMoney2(MAX_DAILY_GAIN - gainToday));
            const cappedPayout = toMoney2(Math.min(payout, stake + allowedGain));
            const cappedWinnerNet = toMoney2(cappedPayout - stake);
            const capApplied = cappedPayout < payout;

            winner.wallet = toMoney2(winner.wallet + cappedPayout);

            const date = new Date().toISOString();
            pushHistory(challenger, {
                type: "DUEL_P2P",
                result: played.won ? "WIN" : "LOSS",
                opponentId: duel.opponentId,
                opponentName: opponent.playerName,
                stake,
                net: played.won ? cappedWinnerNet : loserNet,
                ...(duel.draft ? { note: summarizeDraft(duel.draft) } : {}),
                ...(played.won && capApplied ? { capApplied: true } : {}),
            });
            pushHistory(opponent, {
                type: "DUEL_P2P",
                result: played.won ? "LOSS" : "WIN",
                opponentId: duel.challengerId,
                opponentName: challenger.playerName,
                stake,
                net: played.won ? loserNet : cappedWinnerNet,
                ...(duel.draft ? { note: summarizeDraft(duel.draft) } : {}),
                ...(!played.won && capApplied ? { capApplied: true } : {}),
            });

            // Wallet floor guard
            applyWalletFloor(challenger);
            applyWalletFloor(opponent);

            duel.status = "done";
            duel.winnerId = winnerId;
            duel.loserId = loserId;
            duel.rounds = played.rounds;
            duel.games = played.games;
            duel.playedAt = date;
            normalizeDuelRoomState(duel);
            duel.room.readyBy = {};
            duel.room.readyCountdownAt = null;

            // Update rivalry cache
            const pairKey = [duel.challengerId, duel.opponentId].sort().join("_");
            if (!db.rivalries[pairKey]) {
                db.rivalries[pairKey] = {
                    users: [duel.challengerId, duel.opponentId],
                    wins: { [duel.challengerId]: 0, [duel.opponentId]: 0 },
                    last5: [],
                };
            }
            db.rivalries[pairKey].wins[winnerId] = (db.rivalries[pairKey].wins[winnerId] || 0) + 1;
            db.rivalries[pairKey].last5.unshift({ winnerId, date });
            db.rivalries[pairKey].last5 = db.rivalries[pairKey].last5.slice(0, 5);

            store.write(db);

            return {
                ok: true,
                duel,
                winnerId,
                loserId,
                challengerWallet: challenger.wallet,
                opponentWallet: opponent.wallet,
                rounds: played.rounds,
                games: played.games,
                draftSummary: summarizeDraft(duel.draft),
            };
        },

        getDuelRoomStatus(duelId, userId) {
            const duelKey = String(duelId || "").trim();
            const actorId = String(userId || "").trim();
            if (!duelKey || !actorId) return { error: "duelId and userId are required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((d) => d.id === duelKey);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (duel.challengerId !== actorId && duel.opponentId !== actorId) {
                return { error: "User is not part of duel", code: 403 };
            }

            normalizeDuelRoomState(duel);
            return { ok: true, room: duelRoomSnapshot(duel), serverClock: new Date().toISOString() };
        },

        setDuelReady(duelId, userId, ready) {
            const duelKey = String(duelId || "").trim();
            const actorId = String(userId || "").trim();
            if (!duelKey || !actorId) return { error: "duelId and userId are required", code: 400 };

            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((d) => d.id === duelKey);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (duel.status !== "pending") return { error: "Duel already resolved", code: 400 };
            if (duel.challengerId !== actorId && duel.opponentId !== actorId) {
                return { error: "User is not part of duel", code: 403 };
            }

            normalizeDuelRoomState(duel);
            duel.room.readyBy[actorId] = !!ready;

            const challengerReady = !!duel.room.readyBy[duel.challengerId];
            const opponentReady = !!duel.room.readyBy[duel.opponentId];
            if (challengerReady && opponentReady) {
                duel.room.readyCountdownAt = duel.room.readyCountdownAt || new Date().toISOString();
            } else {
                duel.room.readyCountdownAt = null;
            }

            store.write(db);
            return {
                ok: true,
                room: duelRoomSnapshot(duel),
                bothReady: challengerReady && opponentReady,
                serverClock: new Date().toISOString(),
            };
        },

        startLiveDuel(duelId, userId) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((entry) => entry.id === duelId);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (!isDuelParticipant(duel, userId)) return { error: "User is not part of duel", code: 403 };
            if (duel.status === "playing" || duel.status === "done") {
                return { ok: true, match: publicDuelMatch(duel, userId, db) };
            }

            normalizeDuelRoomState(duel);
            if (!duel.room.readyBy[duel.challengerId] || !duel.room.readyBy[duel.opponentId]) {
                return { error: "Both players must be ready", code: 400 };
            }

            const challenger = db.users.find((entry) => entry.id === duel.challengerId);
            const opponent = db.users.find((entry) => entry.id === duel.opponentId);
            if (challenger.wallet < duel.stake || opponent.wallet < duel.stake) {
                return { error: "A player has insufficient wallet balance", code: 400 };
            }

            challenger.wallet = toMoney2(challenger.wallet - duel.stake);
            opponent.wallet = toMoney2(opponent.wallet - duel.stake);
            duel.status = "playing";
            const resolvedGames = duel.tournamentId && Array.isArray(duel.games)
                ? duel.games
                : resolveP2PGames(duel.draft);
            duel.games = Array.from(
                { length: duel.bestOf || 3 },
                (_, index) => resolvedGames[index % resolvedGames.length]
            );
            duel.currentRound = 1;
            duel.score = { challenger: 0, opponent: 0 };
            duel.rounds = [];
            duel.submissions = {};
            duel.startedAt = new Date().toISOString();
            duel.roundStartedAt = duel.startedAt;
            duel.roundTokens = {};
            ensureDuelRoundSecurity(duel);
            recordProductEvent(db, "match_started", duel.challengerId, { duelId: duel.id });
            recordProductEvent(db, "match_started", duel.opponentId, { duelId: duel.id });
            store.write(db);
            return { ok: true, match: publicDuelMatch(duel, userId, db) };
        },

        getLiveDuel(duelId, userId) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((entry) => entry.id === duelId);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (!isDuelParticipant(duel, userId)) return { error: "User is not part of duel", code: 403 };
            return { ok: true, match: publicDuelMatch(duel, userId, db) };
        },

        getActiveLiveDuel(userId) {
            const db = store.read();
            ensureCollections(db);
            const duel = [...db.duels]
                .reverse()
                .find((entry) => isDuelParticipant(entry, userId) && (entry.status === "pending" || entry.status === "playing"));
            return { ok: true, match: duel ? publicDuelMatch(duel, userId, db) : null };
        },

        submitLiveDuelRound(duelId, userId, round, score, metric, attemptToken) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((entry) => entry.id === duelId);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (!isDuelParticipant(duel, userId)) return { error: "User is not part of duel", code: 403 };
            if (duel.status !== "playing") return { error: "Duel is not active", code: 400 };
            if (Number(round) !== duel.currentRound) return { error: "This round is not active", code: 409 };
            ensureDuelRoundSecurity(duel);

            const roundKey = String(duel.currentRound);
            if (!duel.submissions[roundKey]) duel.submissions[roundKey] = {};
            if (duel.submissions[roundKey][userId]) {
                return { ok: true, match: publicDuelMatch(duel, userId, db) };
            }
            if (!attemptToken || attemptToken !== duel.roundTokens[roundKey][userId]) {
                return { error: "This duel attempt is no longer active", code: 409 };
            }
            const performance = validateLivePerformance(score, metric);
            if (performance.error) return performance;

            duel.submissions[roundKey][userId] = {
                score: performance.score,
                metric: performance.metric,
                completedAt: new Date().toISOString(),
            };

            const challengerRun = duel.submissions[roundKey][duel.challengerId];
            const opponentRun = duel.submissions[roundKey][duel.opponentId];
            if (challengerRun && opponentRun) {
                const challengerWon = challengerRun.score === opponentRun.score
                    ? challengerRun.metric <= opponentRun.metric
                    : challengerRun.score > opponentRun.score;
                const winnerId = challengerWon ? duel.challengerId : duel.opponentId;
                const role = challengerWon ? "challenger" : "opponent";
                duel.score[role] += 1;
                duel.rounds.push({
                    round: duel.currentRound,
                    gameId: duel.games[duel.currentRound - 1],
                    challengerScore: challengerRun.score,
                    opponentScore: opponentRun.score,
                    challengerMetric: challengerRun.metric,
                    opponentMetric: opponentRun.metric,
                    winnerId,
                });

                const winsRequired = Math.floor((duel.bestOf || 3) / 2) + 1;
                if (duel.score[role] >= winsRequired || duel.currentRound >= duel.games.length) {
                    settleLiveDuel(db, duel, winnerId);
                } else {
                    duel.currentRound += 1;
                    duel.roundStartedAt = new Date().toISOString();
                    ensureDuelRoundSecurity(duel);
                }
            }

            store.write(db);
            return { ok: true, match: publicDuelMatch(duel, userId, db) };
        },

        resolveAuthoritativeDuelRound(duelId, round, winnerId, detail = {}) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((entry) => entry.id === duelId);
            if (!duel || duel.status !== "playing") {
                return { error: "Duel is not active", code: 409 };
            }
            if (Number(round) !== duel.currentRound) {
                return { ok: true, ignored: true, match: publicDuelMatch(duel, winnerId, db) };
            }
            if (!isDuelParticipant(duel, winnerId)) {
                return { error: "Winner is not part of duel", code: 400 };
            }

            const gameId = duel.games[duel.currentRound - 1];
            const role = winnerId === duel.challengerId ? "challenger" : "opponent";
            const loserId = winnerId === duel.challengerId ? duel.opponentId : duel.challengerId;
            const duration = clampInt(detail.duration, 100, 300000);
            const winnerScore = clampInt(detail.winnerScore ?? 1000, 0, 1000);
            const loserScore = clampInt(detail.loserScore ?? 0, 0, 1000);

            duel.score[role] += 1;
            duel.rounds.push({
                round: duel.currentRound,
                gameId,
                challengerScore: winnerId === duel.challengerId ? winnerScore : loserScore,
                opponentScore: winnerId === duel.opponentId ? winnerScore : loserScore,
                challengerMetric: duration,
                opponentMetric: duration,
                winnerId,
                authoritative: true,
                detail: String(detail.reason || "").slice(0, 120),
            });
            duel.lastAuthoritativeResult = {
                round: duel.currentRound,
                gameId,
                winnerId,
                loserId,
                duration,
                reason: String(detail.reason || "").slice(0, 120),
                resolvedAt: new Date().toISOString(),
            };

            const winner = db.users.find((user) => user.id === winnerId);
            if (winner) awardCompetitiveProgress(winner, gameId, true);
            const loser = db.users.find((user) => user.id === loserId);
            if (loser) awardCompetitiveProgress(loser, gameId, false);
            if (winner) {
                advanceDailyTask(winner, "round_wins");
                if (String(detail.reason || "").includes("perfect")) {
                    advanceDailyTask(winner, "perfect_rounds");
                }
            }

            const winsRequired = Math.floor((duel.bestOf || 3) / 2) + 1;
            if (duel.score[role] >= winsRequired || duel.currentRound >= duel.games.length) {
                settleLiveDuel(db, duel, winnerId);
            } else {
                duel.currentRound += 1;
                duel.roundStartedAt = new Date().toISOString();
                ensureDuelRoundSecurity(duel);
            }

            store.write(db);
            return { ok: true, match: publicDuelMatch(duel, winnerId, db) };
        },

        rematch(duelId) {
            const db = store.read();
            ensureCollections(db);
            const original = db.duels.find((d) => d.id === duelId);
            if (!original) return { error: "Duel not found", code: 404 };
            if (original.status !== "done") return { error: "Original duel not finished", code: 400 };

            // Swap sides for fairness
            const created = this.createDuel(
                original.opponentId,
                original.challengerId,
                original.stake,
                original.draft,
                original.bestOf || 3
            );
            if (!created.ok) return created;
            const persisted = store.read();
            const persistedOriginal = persisted.duels.find((duel) => duel.id === duelId);
            if (persistedOriginal) {
                persistedOriginal.rematchId = created.duel.id;
                recordProductEvent(persisted, "rematch_created", original.challengerId, {
                    originalDuelId: duelId,
                    duelId: created.duel.id,
                });
                recordProductEvent(persisted, "rematch_created", original.opponentId, {
                    originalDuelId: duelId,
                    duelId: created.duel.id,
                });
                store.write(persisted);
            }
            return created;
        },

        trackProductEvent(type, userId, properties = {}) {
            const allowed = new Set([
                "quick_play_clicked",
                "invite_link_copied",
                "result_shared",
            ]);
            const normalizedType = String(type || "").trim();
            if (!allowed.has(normalizedType)) return { error: "Unsupported event type", code: 400 };
            const db = store.read();
            ensureCollections(db);
            if (!db.users.some((entry) => entry.id === userId)) {
                return { error: "User not found", code: 404 };
            }
            recordProductEvent(db, normalizedType, userId, properties);
            store.write(db);
            return { ok: true };
        },

        reactToDuel(duelId, userId, reaction) {
            const db = store.read();
            ensureCollections(db);
            const duel = db.duels.find((entry) => entry.id === duelId);
            if (!duel) return { error: "Duel not found", code: 404 };
            if (!isDuelParticipant(duel, userId)) return { error: "User is not part of duel", code: 403 };
            const allowed = ["GG", "WOW", "CLOSE", "REMATCH"];
            const normalized = String(reaction || "").toUpperCase();
            if (!allowed.includes(normalized)) return { error: "Unsupported reaction", code: 400 };
            if (!Array.isArray(duel.reactions)) duel.reactions = [];
            duel.reactions.push({ userId, reaction: normalized, at: new Date().toISOString() });
            duel.reactions = duel.reactions.slice(-12);
            store.write(db);
            return { ok: true, reactions: duel.reactions };
        },

        getRivalry(userAId, userBId) {
            const db = store.read();
            const pairKey = [userAId, userBId].sort().join("_");
            const rivalry = db.rivalries && db.rivalries[pairKey];
            if (!rivalry) {
                return {
                    ok: true,
                    exists: false,
                    users: [userAId, userBId],
                    wins: { [userAId]: 0, [userBId]: 0 },
                    last5: [],
                };
            }
            const userA = db.users.find((u) => u.id === userAId);
            const userB = db.users.find((u) => u.id === userBId);
            return {
                ok: true,
                exists: true,
                pairKey,
                users: [
                    { id: userAId, playerName: userA?.playerName || userAId },
                    { id: userBId, playerName: userB?.playerName || userBId },
                ],
                wins: rivalry.wins,
                last5: rivalry.last5,
            };
        },

        // ── Sprint 3: KPI analytics ──────────────────────────────────────────

        getAnalyticsKpi() {
            const db = store.read();
            ensureCollections(db);
            const duels = db.duels || [];
            const playedDuels = duels.filter((d) => d.status === "done");
            const events = db.productEvents || [];
            const eventUsers = (type) => new Set(
                events.filter((event) => event.type === type).map((event) => event.userId)
            );
            const quickPlayUsers = eventUsers("quick_play_clicked");
            const matchedUsers = eventUsers("matchmaking_matched");
            const inviteUsers = eventUsers("invite_created");
            const rematchUsers = eventUsers("rematch_created");
            const viralActionUsers = new Set([...inviteUsers, ...rematchUsers]);
            const matchedQuickPlayUsers = [...quickPlayUsers].filter((userId) => matchedUsers.has(userId));
            const matchmakingConversion = quickPlayUsers.size > 0
                ? Math.round((matchedQuickPlayUsers.length / quickPlayUsers.size) * 100)
                : 0;

            // Rematch rate: duels that have a subsequent rematch duel grouped by same pair
            const rematchedIds = new Set();
            playedDuels.forEach((d) => {
                // A rematch is a played duel whose sides are swapped vs an older duel same pair
                const pairKey = [d.challengerId, d.opponentId].sort().join("_");
                const predecessors = playedDuels.filter(
                    (o) =>
                        o.id !== d.id &&
                        o.playedAt < d.playedAt &&
                        [o.challengerId, o.opponentId].sort().join("_") === pairKey
                );
                if (predecessors.length > 0) rematchedIds.add(d.id);
            });
            const rematchRate =
                playedDuels.length > 0
                    ? Math.round((rematchedIds.size / playedDuels.length) * 100)
                    : 0;

            // Duels per active user (users with ≥1 duel)
            const duelsPerUser = {};
            playedDuels.forEach((d) => {
                duelsPerUser[d.challengerId] = (duelsPerUser[d.challengerId] || 0) + 1;
                duelsPerUser[d.opponentId] = (duelsPerUser[d.opponentId] || 0) + 1;
            });
            const activeUserCount = Object.keys(duelsPerUser).length;
            const duelsPerActiveUser =
                activeUserCount > 0
                    ? Math.round((playedDuels.length / activeUserCount) * 10) / 10
                    : 0;

            // Losers replay rate < 24h
            const now = Date.now();
            const cutoff24h = 24 * 60 * 60 * 1000;
            const lostThen24h = new Set();
            const replayedAfterLoss24h = new Set();
            playedDuels.forEach((d) => {
                // Mark losers
                if (d.loserId) {
                    const duelTime = new Date(d.playedAt).getTime();
                    // Find a subsequent duel by the loser within 24h
                    const loserReplayed = playedDuels.some(
                        (o) =>
                            o.id !== d.id &&
                            (o.challengerId === d.loserId || o.opponentId === d.loserId) &&
                            new Date(o.playedAt).getTime() > duelTime &&
                            new Date(o.playedAt).getTime() - duelTime < cutoff24h
                    );
                    lostThen24h.add(d.loserId + "_" + d.playedAt);
                    if (loserReplayed) replayedAfterLoss24h.add(d.loserId + "_" + d.playedAt);
                }
            });
            const losersReplayRate24h =
                lostThen24h.size > 0
                    ? Math.round((replayedAfterLoss24h.size / lostThen24h.size) * 100)
                    : 0;

            return {
                ok: true,
                kpi: {
                    totalPlayedDuels: playedDuels.length,
                    rematchRate,
                    duelsPerActiveUser,
                    losersReplayRate24h,
                    quickPlayUsers: quickPlayUsers.size,
                    matchmakingMatchedUsers: matchedUsers.size,
                    matchmakingConversion,
                    viralActionUsers: viralActionUsers.size,
                    targets: {
                        rematchRate: 35,
                        duelsPerActiveUser: 3,
                        losersReplayRate24h: 30,
                        matchmakingConversion: 65,
                    },
                },
            };
        },

        getLeaderboard() {
            const db = store.read();
            const board = db.users.map((u) => {
                const stats = getStats(u.history);
                return {
                    id: u.id,
                    playerName: u.playerName,
                    wallet: u.wallet,
                    wins: stats.wins,
                    losses: stats.losses,
                    winRate: stats.winRate,
                    matches: stats.matches,
                    skillPool: getSkillProfile(u).label,
                    stakeCap: getSkillProfile(u).stakeCap,
                };
            });
            board.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
            return { ok: true, leaderboard: board };
        },
    };
}

module.exports = {
    ALLOWED_STAKES,
    ALLOWED_TOURNAMENT_SIZES,
    createService,
};
