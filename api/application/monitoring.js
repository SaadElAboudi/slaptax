const { createHash, timingSafeEqual } = require('node:crypto');

const DAY = 86400000;
const dayKey = time => new Date(time).toISOString().slice(0, 10);
const digest = value => createHash('sha256').update(value).digest();

function createMonitoring(store, { clock = Date.now } = {}) {
    const pending = new Map();
    const startedAt = clock();
    function bucket() {
        const date = dayKey(clock());
        if (!pending.has(date)) pending.set(date, { ids: new Set(), peak: 0, requests: 0, errors4xx: 0, errors5xx: 0 });
        return pending.get(date);
    }
    function observe(ids) {
        const row = bucket();
        for (const id of ids) row.ids.add(digest(id).toString('hex'));
        row.peak = Math.max(row.peak, new Set(ids).size);
    }
    function request(status) {
        const row = bucket();
        row.requests++;
        if (status >= 500) row.errors5xx++;
        else if (status >= 400) row.errors4xx++;
    }
    function flush() {
        const db = store.read();
        const monitoring = db.monitoring || { since: startedAt, days: {} };
        let changed = pending.size > 0;
        for (const [date, batch] of pending) {
            const row = monitoring.days[date] || { ids: [], peak: 0, requests: 0, errors4xx: 0, errors5xx: 0 };
            row.ids = [...new Set([...row.ids, ...batch.ids])];
            row.peak = Math.max(row.peak, batch.peak);
            for (const key of ['requests', 'errors4xx', 'errors5xx']) row[key] += batch[key];
            monitoring.days[date] = row;
        }
        const cutoff = dayKey(clock() - 29 * DAY);
        for (const date of Object.keys(monitoring.days)) if (date < cutoff) {
            delete monitoring.days[date];
            changed = true;
        }
        if (!changed) return;
        db.monitoring = monitoring;
        store.write(db);
        pending.clear();
    }
    function snapshot(presence) {
        flush();
        const db = store.read();
        const seen = new Set();
        const days = Object.entries(db.monitoring?.days || {}).sort(([a], [b]) => a.localeCompare(b)).map(([date, row]) => {
            const returning = row.ids.filter(id => seen.has(id)).length;
            row.ids.forEach(id => seen.add(id));
            return { date, unique: row.ids.length, returning, peak: row.peak, requests: row.requests, errors4xx: row.errors4xx, errors5xx: row.errors5xx };
        });
        const links = db.linkChallenges || [];
        const guests = links.flatMap(c => Object.entries(c.attempts).filter(([id]) => id !== c.hostId).map(([, attempt]) => attempt));
        return {
            generatedAt: clock(), since: db.monitoring?.since || startedAt, scope: 'instance', days,
            online: presence.onlinePlayers,
            activeDuels: (db.duels || []).filter(d => d.status === 'playing').length,
            links: { created: links.length, published: links.filter(c => c.attempts[c.hostId]?.phase === 'done').length,
                accepted: guests.length, completed: guests.filter(g => g.phase === 'done').length },
            uptimeSeconds: Math.floor(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1048576),
        };
    }
    return { observe, request, flush, snapshot };
}

function adminAuthorized(req, token) {
    if (typeof token !== 'string' || token.length < 32) return false;
    const header = req.headers.authorization;
    return typeof header === 'string' && header.startsWith('Bearer ') && timingSafeEqual(digest(header.slice(7)), digest(token));
}

module.exports = { createMonitoring, adminAuthorized };
