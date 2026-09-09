const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeDb } = require('../infrastructure/db');

test('file snapshots replace atomically and serialization failure preserves the previous state', (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slaptax-atomic-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'state.json');
    writeDb({ wallet: 100 }, file);
    writeDb({ wallet: 105 }, file);
    assert.deepEqual(JSON.parse(fs.readFileSync(file)), { wallet: 105 });
    const invalid = {}; invalid.self = invalid;
    assert.throws(() => writeDb(invalid, file));
    assert.deepEqual(JSON.parse(fs.readFileSync(file)), { wallet: 105 });
    assert.deepEqual(fs.readdirSync(dir), ['state.json']);
});
