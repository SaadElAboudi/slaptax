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
            const userId = url.searchParams.get("userId") || null;
            json(res, 200, service.getState(userId));
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
            const result = service.setStake(body.stake, body.userId || null);
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

        if (req.method === "POST" && url.pathname === "/api/duel/reflex") {
            const body = await parseBody(req);
            const result = service.resolveReflexDuel(body.stake, body.won, body.rounds, body.userId || null);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/tournament/simulate") {
            const body = await parseBody(req);
            const result = service.simulateTournament(body.size, body.stake, body.draft || null);
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
            const result = service.createDuel(body.challengerId, body.opponentId, body.stake, body.draft);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/challenges") {
            const body = await parseBody(req);
            const result = service.createChallenge(
                body.challengerId,
                body.opponentId,
                body.stake,
                body.draft,
                body.message
            );
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/challenges") {
            const userId = url.searchParams.get("userId");
            const status = url.searchParams.get("status") || "pending";
            const result = service.listChallenges(userId, status);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/progression/challenges") {
            const userId = url.searchParams.get("userId");
            const result = service.getChallengeProgress(userId);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/progression/challenges/sync") {
            const body = await parseBody(req);
            const result = service.syncChallengeProgress(body.userId, body.daily, body.season);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/progression/challenges/claim") {
            const body = await parseBody(req);
            const result = service.claimChallengeReward(body.userId);
            json(res, result.code || 200, result);
            return;
        }

        const acceptChallengeMatch = url.pathname.match(/^\/api\/challenges\/([^/]+)\/accept$/);
        if (req.method === "POST" && acceptChallengeMatch) {
            const body = await parseBody(req);
            const result = service.acceptChallenge(acceptChallengeMatch[1], body.userId);
            json(res, result.code || 200, result);
            return;
        }

        const declineChallengeMatch = url.pathname.match(/^\/api\/challenges\/([^/]+)\/decline$/);
        if (req.method === "POST" && declineChallengeMatch) {
            const body = await parseBody(req);
            const result = service.declineChallenge(declineChallengeMatch[1], body.userId);
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
