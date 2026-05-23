const { getStats } = require("../domain/stats");
const { simulateDuel, simulateTournament } = require("../domain/simulations");
const { toMoney2 } = require("../shared/money");

const ALLOWED_STAKES = [2, 5, 10, 20];
const ALLOWED_TOURNAMENT_SIZES = [8, 16, 32];

function pushHistory(db, entry) {
    db.history.unshift({
        ...entry,
        date: new Date().toISOString(),
    });
    db.history = db.history.slice(0, 100);
}

function createService(store) {
    return {
        getHealth() {
            return { ok: true, service: "slaptax-mvp-api" };
        },

        getState() {
            const db = store.read();
            return { ...db, stats: getStats(db.history) };
        },

        getHistory() {
            const db = store.read();
            return { history: db.history };
        },

        getStats() {
            const db = store.read();
            return getStats(db.history);
        },

        setProfile(playerName) {
            const name = String(playerName || "").trim();
            if (!name || name.length > 20) {
                return { error: "playerName is required (1-20 chars)", code: 400 };
            }
            const db = store.read();
            db.playerName = name;
            store.write(db);
            return { ok: true, playerName: db.playerName };
        },

        setStake(stake) {
            const numericStake = Number(stake);
            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            const db = store.read();
            db.stake = numericStake;
            store.write(db);
            return { ok: true, stake: db.stake };
        },

        topupWallet(amount) {
            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1000) {
                return { error: "amount must be > 0 and <= 1000", code: 400 };
            }
            const db = store.read();
            db.wallet = toMoney2(db.wallet + numericAmount);
            store.write(db);
            return { ok: true, wallet: db.wallet };
        },

        playDuel(stake) {
            const db = store.read();
            const numericStake = Number(stake || db.stake);

            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }
            if (db.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            db.wallet = toMoney2(db.wallet - numericStake);
            const stats = getStats(db.history);
            const duel = simulateDuel(numericStake, stats);

            if (duel.won) {
                db.wallet = toMoney2(db.wallet + duel.payout);
            }

            pushHistory(db, {
                type: "DUEL",
                result: duel.won ? "WIN" : "LOSS",
                stake: numericStake,
                net: duel.net,
            });

            store.write(db);

            return {
                ok: true,
                duel,
                wallet: db.wallet,
                stats: getStats(db.history),
            };
        },

        simulateTournament(size, stake) {
            const db = store.read();
            const tournamentSize = Number(size || 8);
            const numericStake = Number(stake || db.stake);

            if (!ALLOWED_TOURNAMENT_SIZES.includes(tournamentSize)) {
                return { error: "size must be one of 8, 16, 32", code: 400 };
            }

            if (!ALLOWED_STAKES.includes(numericStake)) {
                return { error: "stake must be one of 2, 5, 10, 20", code: 400 };
            }

            if (db.wallet < numericStake) {
                return { error: "Insufficient wallet balance", code: 400 };
            }

            db.wallet = toMoney2(db.wallet - numericStake);
            const stats = getStats(db.history);
            const tournament = simulateTournament(tournamentSize, numericStake, stats);

            if (tournament.champion) {
                db.wallet = toMoney2(db.wallet + tournament.payout);
            }

            pushHistory(db, {
                type: "TOURNAMENT",
                result: tournament.champion ? "WIN" : "LOSS",
                stake: numericStake,
                net: tournament.net,
            });

            store.write(db);

            return {
                ok: true,
                tournament,
                wallet: db.wallet,
                stats: getStats(db.history),
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
