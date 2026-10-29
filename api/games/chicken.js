// Living objective rules run inside the authoritative, fixed-step arena simulation.
const rules = require('../../shared/chicken-rules.json');
function beginChicken(s, now) {
    s.chicken = { nextEggAt: now + rules.eggIntervalMs, eggs: [], serial: 0 };
}
function emit(s, kind, p, now) {
    s.events.push({ kind, id: p.id, x: p.x, y: p.y, at: now });
    s.events = s.events.filter(e => now - e.at < 1800).slice(-16);
}
function releaseChicken(s, p, now, kind) {
    s.box = { x: p.x, y: p.y, carrier: null, availableAt: now + 650,
        bannedId: p.id, bannedUntil: now + 1400 };
    emit(s, kind, p, now);
}
function tickChicken(s, now, moveBody) {
    const state = s.chicken;
    const carrier = s.bodies.find(p => p.id === s.box.carrier);
    if (carrier) {
        if (!s.box.panicAt) s.box.panicAt = now + rules.carryLimitMs;
        if (now >= s.box.panicAt) releaseChicken(s, carrier, now, 'chicken-escape');
    }
    if (now >= state.nextEggAt) {
        const target = carrier || s.bodies.filter(p => !p.respawnAt)[state.serial % s.bodies.filter(p => !p.respawnAt).length];
        if (target) state.eggs.push({ id: ++state.serial, x: target.x, y: target.y,
            landsAt: now + rules.eggWarningMs, until: now + rules.eggWarningMs + 550 });
        state.nextEggAt = now + (now - s.startedAt >= rules.durationMs - rules.frenzyLastMs ? rules.frenzyIntervalMs : rules.eggIntervalMs);
    }
    for (const egg of state.eggs) {
        if (egg.exploded || now < egg.landsAt) continue;
        egg.exploded = true;
        emit(s, 'egg-splat', {id: '', x: egg.x, y: egg.y}, now);
        for (const p of s.bodies) {
            if (p.respawnAt || p.dashUntil > now || p.shieldUntil > now) continue;
            const dx = p.x - egg.x, dy = p.y - egg.y, d = Math.hypot(dx, dy);
            if (d >= rules.eggRadius) continue;
            p.kx = (d > 1 ? dx / d : p.slot % 2 ? -1 : 1) * 620;
            p.ky = (d > 1 ? dy / d : 0) * 620;
            if (s.box.carrier === p.id) releaseChicken(s, p, now, 'chicken-escape');
        }
    }
    state.eggs = state.eggs.filter(e => now < e.until);
    const box = s.box;
    if (!box.carrier && !box.flightUntil && now >= box.availableAt) {
        const nearest = s.bodies.filter(p => !p.respawnAt).sort((a,b) => Math.hypot(a.x-box.x,a.y-box.y)-Math.hypot(b.x-box.x,b.y-box.y))[0];
        if (nearest) {
            const dx=box.x-nearest.x,dy=box.y-nearest.y,d=Math.hypot(dx,dy);
            // Close players can catch it; outside that radius it runs, without crossing benches.
            if(d>40&&d<230)moveBody(box,dx/d*rules.fleeSpeed/60,dy/d*rules.fleeSpeed/60);
        }
    }
}
function publicChicken(s, now) {
    return { carryRemaining: s.box.carrier ? Math.max(0,(s.box.panicAt || now + rules.carryLimitMs)-now) : 0,
        carryLimit: rules.carryLimitMs,
        frenzy: s.tickAt - s.startedAt >= rules.durationMs - rules.frenzyLastMs,
        eggs: s.chicken.eggs.map(e => ({id:e.id,x:e.x,y:e.y,radius:rules.eggRadius,
            landsIn:Math.max(0,e.landsAt-now),remaining:Math.max(0,e.until-now),exploded:!!e.exploded})) };
}
function pauseChicken(s, delta) {
    if (!s.chicken) return;
    s.chicken.nextEggAt += delta;
    for (const e of s.chicken.eggs) { e.landsAt += delta; e.until += delta; }
    for (const k of ['panicAt','bannedUntil']) if (s.box[k]) s.box[k] += delta;
}
module.exports = {rules,beginChicken,tickChicken,publicChicken,pauseChicken};
