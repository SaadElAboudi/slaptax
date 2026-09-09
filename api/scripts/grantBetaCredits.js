const fs = require('node:fs');
const { createStore } = require('../infrastructure/store');
const { DB_PATH } = require('../infrastructure/db');
const { grantBetaCredits } = require('../domain/betaCredits');

async function main() {
    const store = createStore();
    try {
        await store.ready;
        const state = JSON.parse(JSON.stringify(store.read()));
        const result = grantBetaCredits(state);
        const apply = process.argv.includes('--apply');
        if (apply && result.credited) {
            if (store.kind === 'file') fs.copyFileSync(DB_PATH, `${DB_PATH}.before-beta-${Date.now()}.bak`, fs.constants.COPYFILE_EXCL);
            store.write(state);
        }
        process.stdout.write(`${JSON.stringify({ ...result, mode: apply ? 'applied' : 'dry-run', store: store.kind })}\n`);
    } finally { await store.close(); }
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
