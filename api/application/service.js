const { getStats } = require("../domain/stats");
const { simulateDuel, simulateTournament, simulateP2PDuel } = require("../domain/simulations");
const { toMoney2 } = require("../shared/money");
const { SCHEMA_VERSION } = require("../infrastructure/db");
const crypto = require("crypto");

const ALLOWED_STAKES = [2, 5, 10, 20];
const ALLOWED_TOURNAMENT_SIZES = [8, 16, 32];

const MAX_DAILY_GAIN = 200; // SLAP$ max a user can earn in one calendar day
const WALLET_FLOOR = 2;     // auto-credit threshold (lowest allowed stake)
const WALLET_FLOOR_CREDIT = 10; // SLAP$ given when wallet hits floor

const DRAFT_GAMES = [
    { id: "precision", label: "Precision Rush" },
    { id: "quickdraw", label: "Quickdraw" },
    { id: "mindgame", label: "Mind Game" },
    { id: "speedsort", label: "Speed Sort" },
    { id: "duelnumeric", label: "Duel Numeric" },
];

const DRAFT_GAME_ALIASES = {
    reflex: "quickdraw",
    timing: "mindgame",
    precision: "precision",
    parry: "mindgame",
    zone: "speedsort",
    crown: "duelnumeric",
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

function clampInt(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.round(n)));
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

    return user.progression;
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

function ensureCollections(db) {
    if (!Array.isArray(db.duels)) db.duels = [];
    if (!db.rivalries || typeof db.rivalries !== "object") db.rivalries = {};
    if (!Array.isArray(db.challenges)) db.challenges = [];
    if (!Array.isArray(db.users)) db.users = [];
    db.users.forEach((user) => ensureUserProgression(user));
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

function statePayload(db, userId) {
    const activeUser = userId
        ? (db.users.find((u) => u.id === userId) || getActiveUser(db))
        : getActiveUser(db);
    const activeSkill = getSkillProfile(activeUser);
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
    };
}

function createService(store) {
    return {
        getHealth() {
            return { ok: true, service: "slaptax-mvp-api", schemaVersion: SCHEMA_VERSION };
        },

        getState(userId) {
            const db = store.read();
            ensureCollections(db);
            return statePayload(db, userId || null);
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

        getHistory() {
            const db = store.read();
            const activeUser = getActiveUser(db);
            return { history: activeUser.history };
        },

        getStats() {
            const db = store.read();
            const activeUser = getActiveUser(db);
            return getStats(activeUser.history);
        },

        listUsers() {
            const db = store.read();
            return {
                activeUserId: db.activeUserId,
                users: db.users.map((u) => ({
                    id: u.id,
                    playerName: u.playerName,
                    wallet: u.wallet,
                    stake: u.stake,
                    stats: getStats(u.history),
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
            const stats = getStats(activeUser.history);
            const tournament = simulateTournament(tournamentSize, numericStake, stats, draft);

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

        reset() {
            const state = store.reset();
            return { ok: true, state };
        },

        // ── Sprint 2: P2P duels, rematch, rivalry, leaderboard ──────────────

        createDuel(challengerId, opponentId, stake, draft = null) {
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

            const duelId = crypto.randomUUID();
            const duel = {
                id: duelId,
                challengerId,
                opponentId,
                stake: numericStake,
                status: "pending",
                draft: normalizedDraft,
                createdAt: new Date().toISOString(),
            };
            db.duels.push(duel);
            store.write(db);
            return { ok: true, duel, draftSummary: summarizeDraft(normalizedDraft) };
        },

        createChallenge(challengerId, opponentId, stake, draft = null, message = "") {
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
                createdAt: new Date().toISOString(),
            };

            db.challenges.unshift(challenge);
            db.challenges = db.challenges.slice(0, 300);
            store.write(db);
            return { ok: true, challenge, draftSummary: summarizeDraft(normalizedDraft) };
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
                const statusMatch = status ? c.status === status : true;
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
                challenge.draft
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

        rematch(duelId) {
            const db = store.read();
            ensureCollections(db);
            const original = db.duels.find((d) => d.id === duelId);
            if (!original) return { error: "Duel not found", code: 404 };
            if (original.status !== "done") return { error: "Original duel not finished", code: 400 };

            // Swap sides for fairness
            return this.createDuel(original.opponentId, original.challengerId, original.stake, original.draft);
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
            const duels = db.duels || [];
            const playedDuels = duels.filter((d) => d.status === "done");

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
                    targets: {
                        rematchRate: 35,
                        duelsPerActiveUser: 3,
                        losersReplayRate24h: 30,
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
