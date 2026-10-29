const fs = require("fs");
const path = require("path");

// Refuse a browser test build that would send its sessions to the public API.
const remoteApi=process.env.VITE_API_BASE_URL;
if(remoteApi){
 const dist=path.join(__dirname,'../dist'),html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 for(const match of html.matchAll(/src="(\/assets\/[^" ]+\.js)"/g)){
  if(fs.readFileSync(path.join(dist,match[1]),'utf8').includes(remoteApi))throw new Error('E2E website contains the remote API origin. Build it with empty VITE_API_BASE_URL and VITE_PUBLIC_SITE_URL.');
 }
}

const dbPath = path.join("/tmp", "slaptax-playwright-db.json");
fs.rmSync(dbPath, { force: true });
process.env.DB_PATH = dbPath;

const { createServer } = require("../../api/server");
const server = createServer({ dbPath, adminToken: 'playwright-admin-token-only-not-production-12345' });

server.store.ready.then(() => {
    server.listen(3100, "127.0.0.1");
});

async function close() {
    await new Promise((resolve) => server.close(resolve));
    await server.store.close();
    process.exit(0);
}

process.once("SIGTERM", () => void close());
process.once("SIGINT", () => void close());
