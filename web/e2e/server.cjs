const fs = require("fs");
const path = require("path");

const dbPath = path.join("/tmp", "slaptax-playwright-db.json");
fs.rmSync(dbPath, { force: true });
process.env.DB_PATH = dbPath;

const { createServer } = require("../../api/server");
const server = createServer({ dbPath });

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
