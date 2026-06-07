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
            const clientId = url.searchParams.get("clientId") || null;
            json(res, 200, service.getState(userId, clientId));
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/history") {
            const userId = url.searchParams.get("userId") || null;
            const clientId = url.searchParams.get("clientId") || null;
            json(res, 200, service.getHistory(userId, clientId));
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/stats") {
            const userId = url.searchParams.get("userId") || null;
            const clientId = url.searchParams.get("clientId") || null;
            json(res, 200, service.getStats(userId, clientId));
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/users") {
            const userId = url.searchParams.get("userId") || null;
            const clientId = url.searchParams.get("clientId") || null;
            json(res, 200, service.listUsers(userId, clientId));
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/session/join") {
            const body = await parseBody(req);
            const result = service.joinSession(body.playerName, body.clientId);
            json(res, result.code || 200, result);
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

        if (req.method === "POST" && url.pathname === "/api/tournaments/live") {
            const body = await parseBody(req);
            const result = service.createLiveTournament(
                body.size,
                body.stake,
                body.draft || null,
                body.userId || null
            );
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/arena-tournaments") {
            const result = service.listMultiplayerTournaments(url.searchParams.get("userId") || "");
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/arena-tournaments") {
            const body = await parseBody(req);
            const result = service.createMultiplayerTournament(
                body.hostId,
                body.size,
                body.visibility,
                body.name
            );
            json(res, result.code || 200, result);
            return;
        }

        const arenaTournamentMatch = url.pathname.match(/^\/api\/arena-tournaments\/([^/]+)$/);
        if (req.method === "GET" && arenaTournamentMatch) {
            const result = service.getMultiplayerTournament(
                arenaTournamentMatch[1],
                url.searchParams.get("userId") || ""
            );
            json(res, result.code || 200, result);
            return;
        }

        const joinArenaTournamentMatch = url.pathname.match(/^\/api\/arena-tournaments\/([^/]+)\/join$/);
        if (req.method === "POST" && joinArenaTournamentMatch) {
            const body = await parseBody(req);
            const result = service.joinMultiplayerTournament(joinArenaTournamentMatch[1], body.userId);
            json(res, result.code || 200, result);
            return;
        }

        const startArenaTournamentMatch = url.pathname.match(/^\/api\/arena-tournaments\/([^/]+)\/start$/);
        if (req.method === "POST" && startArenaTournamentMatch) {
            const body = await parseBody(req);
            const result = service.startMultiplayerTournament(startArenaTournamentMatch[1], body.userId);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/tournaments/active") {
            const result = service.getActiveLiveTournament(url.searchParams.get("userId") || "");
            json(res, result.code || 200, result);
            return;
        }

        const abandonTournamentMatch = url.pathname.match(/^\/api\/tournaments\/([^/]+)\/abandon$/);
        if (req.method === "POST" && abandonTournamentMatch) {
            const body = await parseBody(req);
            const result = service.abandonLiveTournament(abandonTournamentMatch[1], body.userId);
            json(res, result.code || 200, result);
            return;
        }

        const liveTournamentMatch = url.pathname.match(/^\/api\/tournaments\/([^/]+)$/);
        if (req.method === "GET" && liveTournamentMatch) {
            const result = service.getLiveTournament(
                liveTournamentMatch[1],
                url.searchParams.get("userId") || ""
            );
            json(res, result.code || 200, result);
            return;
        }

        const liveTournamentRoundMatch = url.pathname.match(/^\/api\/tournaments\/([^/]+)\/rounds$/);
        if (req.method === "POST" && liveTournamentRoundMatch) {
            const body = await parseBody(req);
            const result = service.submitLiveTournamentRound(
                liveTournamentRoundMatch[1],
                body.userId,
                body.score,
                body.metric,
                body.attemptToken
            );
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
            const result = service.createDuel(
                body.challengerId,
                body.opponentId,
                body.stake,
                body.draft,
                body.bestOf
            );
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/matchmaking/join") {
            const body = await parseBody(req);
            const result = service.joinMatchmaking(body.userId, body.stake);
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/matchmaking/cancel") {
            const body = await parseBody(req);
            const result = service.cancelMatchmaking(body.userId);
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
                body.message,
                body.bestOf
            );
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/invites") {
            const body = await parseBody(req);
            const result = service.createOpenInvite(
                body.challengerId,
                body.stake,
                body.draft || null,
                body.message || "",
                body.bestOf
            );
            json(res, result.code || 200, result);
            return;
        }

        const inviteMatch = url.pathname.match(/^\/api\/invites\/([^/]+)$/);
        if (req.method === "GET" && inviteMatch) {
            const result = service.getOpenInvite(inviteMatch[1]);
            json(res, result.code || 200, result);
            return;
        }

        const claimInviteMatch = url.pathname.match(/^\/api\/invites\/([^/]+)\/claim$/);
        if (req.method === "POST" && claimInviteMatch) {
            const body = await parseBody(req);
            const result = service.claimOpenInvite(claimInviteMatch[1], body.userId);
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

        const duelRoomMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/room$/);
        if (req.method === "GET" && duelRoomMatch) {
            const userId = url.searchParams.get("userId") || "";
            const result = service.getDuelRoomStatus(duelRoomMatch[1], userId);
            json(res, result.code || 200, result);
            return;
        }

        const duelReadyMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/ready$/);
        if (req.method === "POST" && duelReadyMatch) {
            const body = await parseBody(req);
            const result = service.setDuelReady(duelReadyMatch[1], body.userId, body.ready);
            json(res, result.code || 200, result);
            return;
        }

        const liveDuelStartMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/start$/);
        if (req.method === "POST" && liveDuelStartMatch) {
            const body = await parseBody(req);
            const result = service.startLiveDuel(liveDuelStartMatch[1], body.userId);
            json(res, result.code || 200, result);
            return;
        }

        const liveDuelMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/match$/);
        if (req.method === "GET" && liveDuelMatch) {
            const result = service.getLiveDuel(
                liveDuelMatch[1],
                url.searchParams.get("userId") || ""
            );
            json(res, result.code || 200, result);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/duels/active") {
            const result = service.getActiveLiveDuel(url.searchParams.get("userId") || "");
            json(res, result.code || 200, result);
            return;
        }

        const liveDuelRoundMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/rounds$/);
        if (req.method === "POST" && liveDuelRoundMatch) {
            const body = await parseBody(req);
            const result = service.submitLiveDuelRound(
                liveDuelRoundMatch[1],
                body.userId,
                body.round,
                body.score,
                body.metric,
                body.attemptToken
            );
            json(res, result.code || 200, result);
            return;
        }

        const rematchMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/rematch$/);
        if (req.method === "POST" && rematchMatch) {
            const result = service.rematch(rematchMatch[1]);
            json(res, result.code || 200, result);
            return;
        }

        const reactionMatch = url.pathname.match(/^\/api\/duels\/([^/]+)\/reactions$/);
        if (req.method === "POST" && reactionMatch) {
            const body = await parseBody(req);
            const result = service.reactToDuel(reactionMatch[1], body.userId, body.reaction);
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
