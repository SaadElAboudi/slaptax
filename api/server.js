const http = require("http");
const { createService } = require("./application/service");
const { readDb, writeDb, resetDb, DB_PATH } = require("./infrastructure/db");
const { createRequestHandler } = require("./http/router");
const { json } = require("./http/io");

const PORT = Number(process.env.PORT || 8787);

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
            await handleRequest(req, res);
        } catch (err) {
            json(res, 500, { error: err.message || "Internal server error" });
        }
    });
}

if (require.main === module) {
    const server = createServer();
    server.listen(PORT, () => {
        // Keep startup line simple for quick copy/paste testing.
        process.stdout.write(`SLAP$TAX API listening on http://localhost:${PORT}\n`);
    });
}

module.exports = {
    createServer,
};
