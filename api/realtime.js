const { WebSocketServer, WebSocket } = require("ws");
const { createSharedArenaManager } = require("./games/sharedArena");

function createRealtimeHub(server, store, service) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
    const sharedArena = createSharedArenaManager(store, service, broadcast);

    server.on("upgrade", (request, socket, head) => {
        const url = new URL(request.url, "http://localhost");
        if (url.pathname !== "/api/realtime") {
            socket.destroy();
            return;
        }
        request.userId = url.searchParams.get("userId") || "";
        request.clientId = url.searchParams.get("clientId") || "";
        wss.handleUpgrade(request, socket, head, (client) => {
            wss.emit("connection", client, request);
        });
    });

    wss.on("connection", (client, request) => {
        client.isAlive = true;
        client.userId = request.userId;
        client.clientId = request.clientId;
        client.lastPongAt = Date.now();
        client.on("pong", () => {
            client.isAlive = true;
            client.lastPongAt = Date.now();
        });
        sharedArena.attach(client);
        client.send(JSON.stringify({ type: "connected", at: Date.now() }));
        server.monitoring?.observe(getOnlineIds());
    });

    const heartbeat = setInterval(() => {
        for (const client of wss.clients) {
            if (!client.isAlive) {
                client.terminate();
                continue;
            }
            client.isAlive = false;
            client.ping();
        }
        server.monitoring?.observe(getOnlineIds());
    }, 25_000);
    heartbeat.unref?.();

    function broadcast(event) {
        const message = JSON.stringify({ ...event, at: Date.now() });
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) client.send(message);
        }
    }

    function close() {
        clearInterval(heartbeat);
        sharedArena.close();
        for (const client of wss.clients) client.close(1001, "Server shutting down");
        wss.close();
    }

    function getOnlineIds() {
        const db = store.read(), now = Date.now(), players = new Set();
        const known = new Set(db.users.map(user => user.id));
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN && now - client.lastPongAt < 60000
                && known.has(client.userId) && db.clientSessions?.[client.clientId] === client.userId) players.add(client.userId);
        }
        return [...players];
    }

    function getPresence() {
        return { onlinePlayers: getOnlineIds().length, updatedAt: Date.now(), scope: 'instance' };
    }

    return { broadcast, close, wss, sharedArena, getPresence };
}

module.exports = { createRealtimeHub };
