const { getStats } = require("../domain/stats");
const { simulateDuel, simulateTournament } = require("../domain/simulations");
const { toMoney2 } = require("../shared/money");
const { SCHEMA_VERSION } = require("../infrastructure/db");
const crypto = require("crypto");

const ALLOWED_STAKES = [2, 5, 10, 20];
const ALLOWED_TOURNAMENT_SIZES = [8, 16, 32];

function pushHistory(user, entry) {
    user.history.unshift({
        ...entry,
        date: new Date().toISOString(),
    });
    user.history = user.history.slice(0, 100);
}

function getActiveUser(db) {
    return db.users.find((u) => u.id === db.activeUserId) || db.users[0];
}

function statePayload(db) {
    const activeUser = getActiveUser(db);
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
        })),
        playerName: activeUser.playerName,
        wallet: activeUser.wallet,
        stake: activeUser.stake,
        history: activeUser.history,
        stats: getStats(activeUser.history),
    };
}

function createService(store) {
    return {
        getHealth() {
            return { ok: true, service: "slaptax-mvp-api", schemaVersion: SCHEMA_VERSION };
        },

        getState() {
            const db = store.read();
            return statePayload(db);
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

        setStake(stake) {
            const numericStake = Number(stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            const db = store.read();
            const activeUser = getActiveUser(db);
            activeUser.stake = numericStake;
            store.write(db);
            return { ok: true, stake: activeUser.stake, activeUserId: db.activeUserId };
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
                activeUser.wallet = toMoney2(activeUser.wallet + duel.payout);
            }

            pushHistory(activeUser, {
                type: "DUEL",
                result: duel.won ? "WIN" : "LOSS",
                stake: numericStake,
                net: duel.net,
            });

            store.write(db);

            return {
                ok: true,
                duel,
                wallet: activeUser.wallet,
                stats: getStats(activeUser.history),
                activeUserId: db.activeUserId,
            };
        },

        simulateTournament(size, stake) {
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
            const tournament = simulateTournament(tournamentSize, numericStake, stats);

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
    };
}

module.exports = {
    ALLOWED_STAKES,
    ALLOWED_TOURNAMENT_SIZES,
    createService,
};
