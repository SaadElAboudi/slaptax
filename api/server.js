const http = require("http");
const fs = require("fs");
const path = require("path");
const { createService } = require("./application/service");
const { createStore } = require("./infrastructure/store");
const { createRequestHandler } = require("./http/router");
const { createRealtimeHub } = require("./realtime");
const { json,parseBody } = require("./http/io");
const { createMonitoring, adminAuthorized } = require('./application/monitoring');

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
    if(process.env.NODE_ENV==='production'&&!options.store&&!options.databaseUrl&&!process.env.DATABASE_URL)throw new Error('Production requires DATABASE_URL for persistent token balances.');
    const store = options.store || createStore(options);
    const storeDistribution=options.storeDistribution??(process.env.APP_DISTRIBUTION==='store'||process.env.NODE_ENV==='production');
    const service = createService(store,{storeDistribution});
    const ready=store.ready.then(async()=>{service.recoverInterruptedDuels();if(store.flush)await store.flush();});
    const handleRequest = createRequestHandler(service,{storeDistribution,flush:()=>store.flush?.(),onAccountDeleted:(userId)=>server.realtime.removeUser(userId)});
    const monitoring = createMonitoring(store);
    const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN;

    const server = http.createServer(async (req, res) => {
        try {
            await ready;
            const url = new URL(req.url, "http://localhost");
            if (url.pathname.startsWith('/api/admin/')) {
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                if (!adminAuthorized(req, adminToken)) {
                    json(res, 401, { error: 'Acces administrateur refuse.' });
                    return;
                }
                if(req.method==='GET'&&url.pathname==='/api/admin/token-audit'){json(res,200,require('./domain/tokens').audit(store.read()));return;}
                const reportAction=url.pathname.match(/^\/api\/admin\/player-reports\/([^/]+)\/resolve$/);
                if(req.method==='POST'&&reportAction){
                    const body=await parseBody(req),db=store.read(),report=db.playerReports?.find(r=>r.id===reportAction[1]);
                    if(!report){json(res,404,{error:'Report not found'});return;}
                    if(!['dismiss','suspend'].includes(body.action)){json(res,400,{error:'Choose dismiss or suspend'});return;}
                    report.status='resolved';report.resolution=body.action;report.resolvedAt=Date.now();
                    if(body.action==='suspend'){const target=db.users.find(u=>u.id===report.targetId);if(target){target.suspended=true;target.playerName='Joueur suspendu';}for(const challenge of db.challenges||[])if(challenge.challengerId===report.targetId)challenge.message='';}
                    store.write(db);if(store.flush)await store.flush();
                    if(body.action==='suspend')for(const client of server.realtime.wss.clients)if(client.userId===report.targetId)client.terminate();
                    json(res,200,{ok:true});return;
                }
                if(req.method==='GET'&&url.pathname==='/api/admin/player-reports'){json(res,200,{reports:store.read().playerReports||[]});return;}
                if (req.method === 'GET' && url.pathname === '/api/admin/monitoring') {
                    json(res, 200, monitoring.snapshot(server.realtime.getPresence()));
                } else json(res, 404, { error: 'Not found' });
                return;
            }
            if (url.pathname.startsWith("/api/")) {
                if (!['/api/health', '/api/presence'].includes(url.pathname)) {
                    res.once('finish', () => monitoring.request(res.statusCode));
                }
                if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS" && !url.pathname.startsWith('/api/link-challenges')) {
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
            process.stderr.write(`Request failed: ${err.message}\n`);json(res, [400,413].includes(err.statusCode)?err.statusCode:500, { error:[400,413].includes(err.statusCode)?err.message:"Service temporairement indisponible. Réessaie sans recréer ton profil." });
        }
    });
    server.requestTimeout=15000;server.headersTimeout=10000;
    server.store = store;
    server.ready=ready;
    server.monitoring = monitoring;
    server.realtime = createRealtimeHub(server, store, service,{storeDistribution});
    // HTTP close waits for upgraded sockets: drain them before waiting for it.
    const closeHttp = server.close.bind(server);
    server.close = function closeWithRealtime(callback) {
        const drained = server.realtime.close();
        return closeHttp(error => { drained.then(() => callback?.(error)); });
    };
    service.getPresence = () => server.realtime.getPresence();
    const health=service.getHealth;
    service.getHealth=()=>({...health(),mat:server.realtime.sharedArena.matPool.health()});
    const recoveryTimer=setInterval(()=>{ready.then(async()=>{if(service.expireStalledDuels()){if(store.flush)await store.flush();server.realtime.broadcast({type:'state.changed',scope:'/api/tokens/refund'});}}).catch(error=>process.stderr.write(`Recovery persistence error: ${error.message}\n`));},15000);recoveryTimer.unref();
    const metricsTimer = setInterval(() => {
        store.ready.then(() => monitoring.flush()).catch(error => process.stderr.write(`Monitoring persistence error: ${error.message}\n`));
    }, 30000);
    metricsTimer.unref();
    server.on("close", () => {
        clearInterval(metricsTimer);clearInterval(recoveryTimer);
        monitoring.flush();
        server.realtime.close();
    });
    return server;
}

if (require.main === module) {
    const server = createServer();
    const stopMatRefresh=require('./infrastructure/matRefresh').startMatRefresh(server.realtime.sharedArena.matPool);
    server.ready
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
        stopMatRefresh();
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
