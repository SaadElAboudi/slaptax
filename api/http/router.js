const { json, parseBody } = require("./io");

function createRequestHandler(service) {
    return async function handleRequest(req, res) {
        if (req.method === "OPTIONS") {
            json(res, 204, {});
            return;
        }

        const url = new URL(req.url, "http://localhost");

        if (req.method === "GET" && url.pathname === "/api/health") {
            json(res, 200, service.getHealth());
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/state") {
            json(res, 200, service.getState());
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/history") {
            json(res, 200, service.getHistory());
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/stats") {
            json(res, 200, service.getStats());
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/users") {
            json(res, 200, service.listUsers());
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/users") {
            const body = await parseBody(req);
            const result = service.createUser(body.playerName);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/session/select-user") {
            const body = await parseBody(req);
            const result = service.selectUser(body.userId);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/profile") {
            const body = await parseBody(req);
            const result = service.setProfile(body.playerName);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/stake") {
            const body = await parseBody(req);
            const result = service.setStake(body.stake);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/wallet/topup") {
            const body = await parseBody(req);
            const result = service.topupWallet(body.amount);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/duel/play") {
            const body = await parseBody(req);
            const result = service.playDuel(body.stake);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/tournament/simulate") {
            const body = await parseBody(req);
            const result = service.simulateTournament(body.size, body.stake);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/reset") {
            json(res, 200, service.reset());
            return;
        }

        // ── Sprint 2: P2P duels, rematch, rivalry, leaderboard ──────────────

        if (req.method === "POST" && url.pathname === "/api/duels") {
            const body = await parseBody(req);
            const result = service.createDuel(body.challengerId, body.opponentId, body.stake);
            json(res, result.code || 200, result);
            return;
        }

        const playDuelMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/play$/);
        if (req.method === "POST" && playDuelMatch) {
            const result = service.playDuelP2P(playDuelMatch[1]);
            json(res, result.code || 200, result);
            return;
        }

        const rematchMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/rematch$/);
        if (req.method === "POST" && rematchMatch) {
            const result = service.rematch(rematchMatch[1]);
            json(res, result.code || 200, result);
            return;
        }

        const rivalryMatch = url.pathname.match(/^\/api\/rivalries\/([^/]+)\/vs\/([^/]+)$/);
        if (req.method === "GET" && rivalryMatch) {
            const result = service.getRivalry(rivalryMatch[1], rivalryMatch[2]);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/leaderboard") {
            json(res, 200, service.getLeaderboard());
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/analytics/kpi") {
            json(res, 200, service.getAnalyticsKpi());
            return;
        }

        json(res, 404, { error: "Not found" });
    };
}

module.exports = {
    createRequestHandler,
};
