const { WebSocketServer, WebSocket } = require("ws");
const { createSharedArenaManager } = require("./games/sharedArena");

function createRealtimeHub(server, store, service) {
    const wss = new WebSocketServer({ noServer: true });
    const sharedArena = createSharedArenaManager(store, service, broadcast);

    server.on("upgrade", (request, socket, head) => {
        const url = new URL(request.url, "http://localhost");
        if (url.pathname !== "/api/realtime") {
            socket.destroy();
            return;
        }
        request.userId = url.searchParams.get("userId") || "";
        wss.handleUpgrade(request, socket, head, (client) => {
            wss.emit("connection", client, request);
        });
    });

    wss.on("connection", (client, request) => {
        client.isAlive = true;
        client.userId = request.userId;
        client.on("pong", () => {
            client.isAlive = true;
        });
        sharedArena.attach(client);
        client.send(JSON.stringify({ type: "connected", at: Date.now() }));
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

    return { broadcast, close, wss, sharedArena };
}

module.exports = { createRealtimeHub };
