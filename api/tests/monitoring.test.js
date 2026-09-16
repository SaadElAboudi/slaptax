const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const { createMonitoring, adminAuthorized } = require('../application/monitoring');
const { createServer } = require('../server');
const { makeDefaultState } = require('../infrastructure/db');

function memoryStore() {
    let data = makeDefaultState();
    return { ready: Promise.resolve(), kind: 'test', read: () => structuredClone(data), write: value => { data = structuredClone(value); }, close: async () => {} };
}
const TOKEN = 'test-admin-token-only-not-for-production-12345';

test('admin access fails closed and requires the exact bearer secret', () => {
    const req = { headers: { authorization: `Bearer ${TOKEN}` } };
    assert.equal(adminAuthorized(req), false);
    assert.equal(adminAuthorized(req, 'short'), false);
    assert.equal(adminAuthorized({ headers: {} }, TOKEN), false);
    assert.equal(adminAuthorized(req, TOKEN + 'x'), false);
    assert.equal(adminAuthorized(req, TOKEN), true);
});

test('daily metrics deduplicate, survive recreation, count returns and expire after 30 UTC days', () => {
    const store = memoryStore();
    let now = Date.UTC(2026, 0, 1, 23, 59);
    const m = createMonitoring(store, { clock: () => now });
    m.observe(['a', 'a', 'b']); m.observe(['b']);
    m.request(200); m.request(409); m.request(500); m.flush();
    assert.equal(store.read().monitoring.days['2026-01-01'].ids.includes('a'), false);
    const restarted = createMonitoring(store, { clock: () => now });
    now += 120000;
    restarted.observe(['b', 'c']);
    const result = restarted.snapshot({ onlinePlayers: 2 });
    assert.deepEqual(result.days.map(d => [d.unique, d.returning, d.peak]), [[2, 0, 2], [2, 1, 2]]);
    assert.equal(result.days[0].errors4xx, 1); assert.equal(result.days[0].errors5xx, 1);
    assert.equal(result.days[0].requests, 3);
    assert.equal(JSON.stringify(result).includes('ids'), false);
    assert.deepEqual(restarted.snapshot({ onlinePlayers: 2 }).days, result.days);
    now += 30 * 86400000;
    restarted.observe(['c']);
    assert.equal(restarted.snapshot({ onlinePlayers: 1 }).days.length, 1);
    now += 30 * 86400000;
    assert.equal(restarted.snapshot({ onlinePlayers: 0 }).days.length, 0);
});

test('snapshot separates link creators from guest participations and exposes no identities', () => {
    const store = memoryStore(), db = store.read();
    db.duels = [{ status: 'playing' }, { status: 'done' }];
    db.linkChallenges = [{ hostId: 'secret-host', attempts: { 'secret-host': { phase: 'done' }, guest: { phase: 'done' }, other: { phase: 'playing' } } }];
    store.write(db);
    const result = createMonitoring(store).snapshot({ onlinePlayers: 3 });
    assert.equal(result.activeDuels, 1);
    assert.deepEqual(result.links, { created: 1, published: 1, accepted: 2, completed: 1 });
    assert.equal(JSON.stringify(result).includes('secret-host'), false);
});

test('HTTP endpoint is private and connected tabs count once, invalid sessions do not count', async () => {
    const server = createServer({ store: memoryStore(), adminToken: TOKEN });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const sockets = [];
    try {
        assert.equal((await fetch(`${base}/api/admin/monitoring`)).status, 401);
        assert.equal((await fetch(`${base}/api/admin/monitoring?token=${TOKEN}`)).status, 401);
        const joined = await fetch(`${base}/api/session/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'monitoring-test-client', playerName: 'Monitor' }) }).then(r => r.json());
        const userId = joined.userId;
        assert.ok(userId);
        for (const clientId of ['monitoring-test-client', 'monitoring-test-client', 'invalid']) {
            const ws = new WebSocket(`${base.replace('http', 'ws')}/api/realtime?userId=${userId}&clientId=${clientId}`);
            sockets.push(ws);
            await once(ws, 'open');
        }
        const res = await fetch(`${base}/api/admin/monitoring`, { headers: { Authorization: `Bearer ${TOKEN}` } });
        assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'no-store');
        const body = await res.json();
        assert.equal(body.online, 1); assert.equal(body.days[0].unique, 1); assert.equal(body.days[0].peak, 1);
        assert.equal(JSON.stringify(body).includes(userId), false);
    } finally {
        sockets.forEach(ws => ws.terminate());
        await new Promise(resolve => server.close(resolve));
    }
});
