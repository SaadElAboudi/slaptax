const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const DB_PATH = path.join(__dirname, "..", "data", "mvp_db.json");

function ensureDbFile() {
    if (fs.existsSync(DB_PATH)) return;
    const initial = {
        playerName: "Player",
        wallet: 25,
        stake: 5,
        history: [],
    };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
}

function readDb() {
    ensureDbFile();
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
}

function writeDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function json(res, code, payload) {
    res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1e6) {
                reject(new Error("Payload too large"));
            }
        });
        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error("Invalid JSON body"));
            }
        });
        req.on("error", reject);
    });
}

function getStats(db) {
    const matches = db.history.length;
    const wins = db.history.filter((h) => h.result === "WIN").length;
    const losses = matches - wins;
    const winRate = matches ? Math.round((wins / matches) * 100) : 0;
    return { matches, wins, losses, winRate };
}

function pushHistory(db, entry) {
    db.history.unshift({
        ...entry,
        date: new Date().toISOString(),
    });
    db.history = db.history.slice(0, 100);
}

function toMoney2(value) {
    return Math.round(value * 100) / 100;
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

function simulateTournament(size, stake, stats) {
    const rounds = Math.log2(size);
    const run = [];
    let alive = true;
    let reachedRound = 0;

    const baseSkill = 0.42 + stats.winRate / 220;

    for (let r = 1; r <= rounds; r += 1) {
        if (!alive) break;
        const chance = Math.min(0.85, baseSkill + (rounds - r) * 0.02);
        const wonRound = Math.random() < chance;
        if (wonRound) {
            reachedRound = r;
            run.push({ round: r, result: "WIN" });
        } else {
            alive = false;
            run.push({ round: r, result: "ELIMINATED" });
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
        payout,
        net,
    };
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === "OPTIONS") {
            json(res, 204, {});
            return;
        }

        const url = new URL(req.url, "http://localhost");

        if (req.method === "GET" && url.pathname === "/api/health") {
            json(res, 200, { ok: true, service: "slaptax-mvp-api" });
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/state") {
            const db = readDb();
            json(res, 200, { ...db, stats: getStats(db) });
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/history") {
            const db = readDb();
            json(res, 200, { history: db.history });
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/stats") {
            const db = readDb();
            json(res, 200, getStats(db));
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/profile") {
            const body = await parseBody(req);
            const name = String(body.playerName || "").trim();
            if (!name || name.length > 20) {
                json(res, 400, { error: "playerName is required (1-20 chars)" });
                return;
            }
            const db = readDb();
            db.playerName = name;
            writeDb(db);
            json(res, 200, { ok: true, playerName: db.playerName });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/stake") {
            const body = await parseBody(req);
            const allowed = [2, 5, 10, 20];
            const stake = Number(body.stake);
            if (!allowed.includes(stake)) {
                json(res, 400, { error: "stake must be one of 2, 5, 10, 20" });
                return;
            }
            const db = readDb();
            db.stake = stake;
            writeDb(db);
            json(res, 200, { ok: true, stake: db.stake });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/wallet/topup") {
            const body = await parseBody(req);
            const amount = Number(body.amount);
            if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
                json(res, 400, { error: "amount must be > 0 and <= 1000" });
                return;
            }
            const db = readDb();
            db.wallet = toMoney2(db.wallet + amount);
            writeDb(db);
            json(res, 200, { ok: true, wallet: db.wallet });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/duel/play") {
            const body = await parseBody(req);
            const db = readDb();
            const stake = Number(body.stake || db.stake);
            const allowed = [2, 5, 10, 20];

            if (!allowed.includes(stake)) {
                json(res, 400, { error: "stake must be one of 2, 5, 10, 20" });
                return;
            }
            if (db.wallet < stake) {
                json(res, 400, { error: "Insufficient wallet balance" });
                return;
            }

            db.wallet = toMoney2(db.wallet - stake);
            const stats = getStats(db);
            const duel = simulateDuel(stake, stats);

            if (duel.won) {
                db.wallet = toMoney2(db.wallet + duel.payout);
            }

            pushHistory(db, {
                type: "DUEL",
                result: duel.won ? "WIN" : "LOSS",
                stake,
                net: duel.net,
            });

            writeDb(db);

            json(res, 200, {
                ok: true,
                duel,
                wallet: db.wallet,
                stats: getStats(db),
            });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/tournament/simulate") {
            const body = await parseBody(req);
            const db = readDb();

            const size = Number(body.size || 8);
            const allowedSize = [8, 16, 32];
            if (!allowedSize.includes(size)) {
                json(res, 400, { error: "size must be one of 8, 16, 32" });
                return;
            }

            const stake = Number(body.stake || db.stake);
            const allowedStake = [2, 5, 10, 20];
            if (!allowedStake.includes(stake)) {
                json(res, 400, { error: "stake must be one of 2, 5, 10, 20" });
                return;
            }

            if (db.wallet < stake) {
                json(res, 400, { error: "Insufficient wallet balance" });
                return;
            }

            db.wallet = toMoney2(db.wallet - stake);
            const stats = getStats(db);
            const tournament = simulateTournament(size, stake, stats);

            if (tournament.champion) {
                db.wallet = toMoney2(db.wallet + tournament.payout);
            }

            pushHistory(db, {
                type: "TOURNAMENT",
                result: tournament.champion ? "WIN" : "LOSS",
                stake,
                net: tournament.net,
            });

            writeDb(db);

            json(res, 200, {
                ok: true,
                tournament,
                wallet: db.wallet,
                stats: getStats(db),
            });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/reset") {
            const reset = {
                playerName: "Player",
                wallet: 25,
                stake: 5,
                history: [],
            };
            writeDb(reset);
            json(res, 200, { ok: true, state: reset });
            return;
        }

        json(res, 404, { error: "Not found" });
    } catch (err) {
        json(res, 500, { error: err.message || "Internal server error" });
    }
});

server.listen(PORT, () => {
    // Keep startup line simple for quick copy/paste testing.
    process.stdout.write(`SLAP$TAX API listening on http://localhost:${PORT}\n`);
});
