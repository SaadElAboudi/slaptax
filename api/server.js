const http = require("http");
const fs = require("fs");
const path = require("path");
const { createService } = require("./application/service");
const { createStore } = require("./infrastructure/store");
const { createRequestHandler } = require("./http/router");
const { createRealtimeHub } = require("./realtime");
const { json } = require("./http/io");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const WEB_DIST_PATH = path.join(__dirname, "..", "web", "dist");

const CONTENT_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

function serveWebApp(req, res, distPath = WEB_DIST_PATH) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    if (!fs.existsSync(distPath)) return false;

    const url = new URL(req.url, "http://localhost");
    const requestedPath = decodeURIComponent(url.pathname);
    const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
    const candidate = path.resolve(distPath, relativePath);
    const distRoot = path.resolve(distPath);
    const safeCandidate = candidate.startsWith(`${distRoot}${path.sep}`) ? candidate : "";
    const filePath = safeCandidate && fs.existsSync(safeCandidate) && fs.statSync(safeCandidate).isFile()
        ? safeCandidate
        : path.join(distRoot, "index.html");

    if (!fs.existsSync(filePath)) return false;

    const extension = path.extname(filePath).toLowerCase();
    const cacheControl = path.basename(filePath) === "index.html"
        ? "no-cache"
        : "public, max-age=31536000, immutable";
    res.writeHead(200, {
        "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
        "Cache-Control": cacheControl,
    });
    if (req.method === "HEAD") {
        res.end();
        return true;
    }
    fs.createReadStream(filePath).pipe(res);
    return true;
}

function createServer(options = {}) {
    const store = options.store || createStore(options);
    const service = createService(store);
    const handleRequest = createRequestHandler(service);

    const server = http.createServer(async (req, res) => {
        try {
            await store.ready;
            const url = new URL(req.url, "http://localhost");
            if (url.pathname.startsWith("/api/")) {
                if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
                    res.once("finish", () => {
                        if (res.statusCode < 400) {
                            server.realtime.broadcast({
                                type: "state.changed",
                                scope: url.pathname,
                            });
                        }
                    });
                }
                await handleRequest(req, res);
                return;
            }
            if (serveWebApp(req, res, options.webDistPath || WEB_DIST_PATH)) return;
            json(res, 404, { error: "Web build not found. Run npm run build." });
        } catch (err) {
            json(res, 500, { error: err.message || "Internal server error" });
        }
    });
    server.store = store;
    server.realtime = createRealtimeHub(server, store);
    server.on("close", () => {
        server.realtime.close();
    });
    return server;
}

if (require.main === module) {
    const server = createServer();
    server.store.ready
        .then(() => {
            server.listen(PORT, HOST, () => {
                process.stdout.write(`SLAP$TAX API listening on http://${HOST}:${PORT} (${server.store.kind})\n`);
            });
        })
        .catch((error) => {
            process.stderr.write(`SLAP$TAX startup failed: ${error.message}\n`);
            process.exitCode = 1;
        });

    async function shutdown(signal) {
        process.stdout.write(`SLAP$TAX received ${signal}, shutting down\n`);
        await new Promise((resolve) => server.close(resolve));
        await server.store.close();
        process.exit(0);
    }

    process.once("SIGTERM", () => void shutdown("SIGTERM"));
    process.once("SIGINT", () => void shutdown("SIGINT"));
}

module.exports = {
    createServer,
    serveWebApp,
};
