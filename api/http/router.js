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

        json(res, 404, { error: "Not found" });
    };
}

module.exports = {
    createRequestHandler,
};
