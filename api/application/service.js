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

        // ── Sprint 2: P2P duels, rematch, rivalry, leaderboard ──────────────

        createDuel(challengerId, opponentId, stake) {
            const db = store.read();
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

            const duelId = crypto.randomUUID();
            if (!db.duels) db.duels = [];
            const duel = {
                id: duelId,
                challengerId,
                opponentId,
                stake: numericStake,
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            db.duels.push(duel);
            store.write(db);
            return { ok: true, duel };
        },

        playDuelP2P(duelId) {
            const db = store.read();
            if (!db.duels) db.duels = [];
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

            // Simulate Bo3 — challenger has home advantage (slight)
            const challengerStats = getStats(challenger.history);
            const played = simulateDuel(stake, challengerStats);

            const winnerId = played.won ? duel.challengerId : duel.opponentId;
            const loserId = played.won ? duel.opponentId : duel.challengerId;
            const winner = db.users.find((u) => u.id === winnerId);
            const loser = db.users.find((u) => u.id === loserId);

            const payout = toMoney2(stake * 2 * 0.85);
            const winnerNet = toMoney2(payout - stake);
            const loserNet = toMoney2(-stake);

            winner.wallet = toMoney2(winner.wallet + payout);

            const date = new Date().toISOString();
            pushHistory(challenger, {
                type: "DUEL_P2P",
                result: played.won ? "WIN" : "LOSS",
                opponentId: duel.opponentId,
                opponentName: opponent.playerName,
                stake,
                net: played.won ? winnerNet : loserNet,
            });
            pushHistory(opponent, {
                type: "DUEL_P2P",
                result: played.won ? "LOSS" : "WIN",
                opponentId: duel.challengerId,
                opponentName: challenger.playerName,
                stake,
                net: played.won ? loserNet : winnerNet,
            });

            duel.status = "done";
            duel.winnerId = winnerId;
            duel.loserId = loserId;
            duel.rounds = played.rounds;
            duel.playedAt = date;

            // Update rivalry cache
            if (!db.rivalries) db.rivalries = {};
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
            };
        },

        rematch(duelId) {
            const db = store.read();
            if (!db.duels) return { error: "Duel not found", code: 404 };
            const original = db.duels.find((d) => d.id === duelId);
            if (!original) return { error: "Duel not found", code: 404 };
            if (original.status !== "done") return { error: "Original duel not finished", code: 400 };

            // Swap sides for fairness
            return this.createDuel(original.opponentId, original.challengerId, original.stake);
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
