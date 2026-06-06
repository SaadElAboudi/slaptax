const http = require("http");
const fs = require("fs");
const path = require("path");
const { createService } = require("./application/service");
const { readDb, writeDb, resetDb, DB_PATH } = require("./infrastructure/db");
const { createRequestHandler } = require("./http/router");
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
    const dbPath = options.dbPath || DB_PATH;
    const store = {
        read: () => readDb(dbPath),
        write: (data) => writeDb(data, dbPath),
        reset: () => resetDb(dbPath),
    };

    const service = createService(store);
    const handleRequest = createRequestHandler(service);

    return http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, "http://localhost");
            if (url.pathname.startsWith("/api/")) {
                await handleRequest(req, res);
                return;
            }
            if (serveWebApp(req, res, options.webDistPath || WEB_DIST_PATH)) return;
            json(res, 404, { error: "Web build not found. Run npm run build." });
        } catch (err) {
            json(res, 500, { error: err.message || "Internal server error" });
        }
    });
}

if (require.main === module) {
    const server = createServer();
    server.listen(PORT, HOST, () => {
        // Keep startup line simple for quick copy/paste testing.
        process.stdout.write(`SLAP$TAX API listening on http://${HOST}:${PORT}\n`);
    });
}

module.exports = {
    createServer,
    serveWebApp,
};
