const test = require('node:test');
const assert = require('node:assert/strict');
const { createService } = require('../application/service');
const { makeDefaultState } = require('../infrastructure/db');
const { tournamentVeto, pruneQueue } = require('../domain/veto');

function setup() {
    let state = makeDefaultState();
    const store = { read: () => structuredClone(state), write: (next) => { state = structuredClone(next); } };
    const service = createService(store);
    const ids = Array.from({ length: 4 }, (_, i) => service.joinSession(`Player${i}`, `client${i}`).userId);
    return { service, ids, store };
}

for (const game of ['trace','decoupe']) test(`${game} is included in tournament rotations unless banned`, () => {
    for (const ban of ['bounce',game]) {
        const {service:s,ids,store}=setup();
        const {tournament:t}=s.createMultiplayerTournament(ids[0],4,'public');
        for(const id of ids.slice(1))s.joinMultiplayerTournament(t.id,id);
        assert.equal(s.configureMultiplayerTournament(t.id,ids[0],[game,'chroma','contrepied']).ok,true);
        for(const id of ids)s.banTournamentGame(t.id,id,ban);
        for(const id of ids)s.setMultiplayerTournamentReady(t.id,id,true);
        assert.equal(s.startMultiplayerTournament(t.id,ids[0]).ok,true);
        const duels=store.read().duels.filter(d=>d.tournamentId===t.id);
        assert.equal(duels.length,2);assert.ok(duels.every(d=>d.games.includes(game)===(ban!==game)));
    }
});

test('rematch preserves stake and best-of, and draft preferences follow their original players',()=>{
    const {service:s,ids:[a,b],store}=setup();
    const draft={challenger:{pick:'trace',ban:'bounce'},opponent:{pick:'decoupe',ban:'bombpass'}};
    const {duel}=s.createDuel(a,b,5,draft,5);
    const db=store.read();db.duels.find(d=>d.id===duel.id).status='done';store.write(db);
    assert.equal(s.rematch(duel.id,a,'request').ok,true);
    const created=s.rematch(duel.id,b,'accept');assert.equal(created.ok,true);
    const next=store.read().duels.find(d=>d.id===created.duel.id);
    assert.equal(next.challengerId,b);assert.equal(next.opponentId,a);assert.equal(next.bestOf,5);assert.equal(next.stake,5);
    assert.deepEqual(next.draft,{challenger:draft.opponent,opponent:draft.challenger});
});

test('each duel participant must ban a game, and the persisted rotation excludes both bans', () => {
    const { service: s, ids: [a,b,c] } = setup();
    const { duel } = s.createDuel(a,b,2);
    assert.equal(s.setDuelReady(duel.id,a,true).code,409);
    assert.equal(s.banDuelGame(duel.id,c,'bounce').code,403);
    assert.equal(s.banDuelGame(duel.id,a,'unknown').code,400);
    assert.equal(s.banDuelGame(duel.id,a,'bounce').room.veto.complete,false);
    const room = s.banDuelGame(duel.id,b,'onesecond').room;
    assert.equal(room.veto.complete,true);
    assert.ok(!room.games.includes('bounce') && !room.games.includes('onesecond'));
    s.setDuelReady(duel.id,a,true); s.setDuelReady(duel.id,b,true);
    const started = s.startLiveDuel(duel.id,a);
    assert.equal(started.ok,true);
    assert.deepEqual(started.match.games,room.games);
    assert.equal(s.banDuelGame(duel.id,a,'bombpass').code,409);
});

test('changing a ban clears consent and repeating the same vote is idempotent', () => {
    const { service: s, ids: [a,b] } = setup();
    const { duel } = s.createDuel(a,b,2);
    s.banDuelGame(duel.id,a,'bounce'); s.banDuelGame(duel.id,b,'bombpass');
    s.setDuelReady(duel.id,a,true);
    assert.equal(s.banDuelGame(duel.id,a,'bounce').room.readyBy[a],true);
    const changed = s.banDuelGame(duel.id,b,'onemore').room;
    assert.deepEqual(changed.readyBy,{});
    assert.equal(s.startLiveDuel(duel.id,a).code,400);
});

test('tournament voting excludes the most voted game across generated duels', () => {
    const { service: s, ids, store } = setup();
    const { tournament: t } = s.createMultiplayerTournament(ids[0],4,'public');
    for (const id of ids.slice(1)) s.joinMultiplayerTournament(t.id,id);
    assert.equal(s.setMultiplayerTournamentReady(t.id,ids[0],true).code,409);
    for (const [i,id] of ids.entries()) s.banTournamentGame(t.id,id,i < 3 ? 'bounce' : 'symbolrush');
    for (const id of ids) s.setMultiplayerTournamentReady(t.id,id,true);
    const started = s.startMultiplayerTournament(t.id,ids[0]);
    assert.equal(started.ok,true);
    assert.deepEqual(started.tournament.veto.banned,['bounce']);
    assert.ok(store.read().duels.filter((d) => d.tournamentId === t.id).every((d) => !d.games.includes('bounce')));
    assert.equal(s.banTournamentGame(t.id,ids[0],'bombpass').code,409);
});

test('tournament vote ties have a stable catalogue-order outcome and exactly three unique games', () => {
    const result = tournamentVeto({ a:'bounce', b:'onesecond' },['a','b'],['bounce','onesecond','bombpass']);
    assert.deepEqual(result.banned,['onesecond']);
    assert.equal(result.games.length,3); assert.equal(new Set(result.games).size,3);
});

test('CHROMA is selectable for a tournament and can be excluded by its veto', () => {
    for (const ban of ['bounce','chroma']) {
        const {service:s,ids,store}=setup();
        const {tournament:t}=s.createMultiplayerTournament(ids[0],4,'public');
        for(const id of ids.slice(1)) s.joinMultiplayerTournament(t.id,id);
        assert.equal(s.configureMultiplayerTournament(t.id,ids[0],['chroma','cupshuffle','duelnumeric']).ok,true);
        for(const id of ids) s.banTournamentGame(t.id,id,ban);
        for(const id of ids) s.setMultiplayerTournamentReady(t.id,id,true);
        assert.equal(s.startMultiplayerTournament(t.id,ids[0]).ok,true);
        const duels=store.read().duels.filter((d)=>d.tournamentId===t.id);
        assert.equal(duels.length,2);
        assert.ok(duels.every((d)=>d.games.includes('chroma')===(ban!=='chroma')));
    }
});

test('matchmaking drops stale, duplicate, busy and insolvent entries', () => {
    const now = Date.now();
    const recent = new Date(now).toISOString();
    const db = { users: ['a','b','c','d'].map((id) => ({ id,wallet:id === 'c' ? 0 : 25 })), duels:[{ status:'playing',challengerId:'b',opponentId:'x' }], matchmakingQueue:[
        { userId:'a',stake:2,joinedAt:recent }, { userId:'a',stake:2,joinedAt:recent },
        { userId:'b',stake:2,joinedAt:recent }, { userId:'c',stake:2,joinedAt:recent },
        { userId:'d',stake:2,joinedAt:new Date(now-61000).toISOString() },
    ] };
    pruneQueue(db,now);
    assert.deepEqual(db.matchmakingQueue.map((entry) => entry.userId),['a']);
});

test('RICOCHET is inherited by tournament duels and its veto replaces it', () => {
    for(const ban of ['bounce','ricochet']) {
        const {service:s,ids,store}=setup();
        const {tournament:t}=s.createMultiplayerTournament(ids[0],4,'public');
        for(const id of ids.slice(1))s.joinMultiplayerTournament(t.id,id);
        assert.equal(s.configureMultiplayerTournament(t.id,ids[0],['ricochet','chroma','cupshuffle']).ok,true);
        for(const id of ids)s.banTournamentGame(t.id,id,ban);
        for(const id of ids)s.setMultiplayerTournamentReady(t.id,id,true);
        assert.equal(s.startMultiplayerTournament(t.id,ids[0]).ok,true);
        const duels=store.read().duels.filter((d)=>d.tournamentId===t.id);
        assert.equal(duels.length,2);assert.ok(duels.every((d)=>d.games.includes('ricochet')===(ban!=='ricochet')));
    }
});

test('matchmaking preserves join time on retry and cannot enqueue a player without funds', () => {
    const { service:s,ids:[a,b],store } = setup();
    assert.equal(s.joinMatchmaking(a,2).status,'waiting');
    const before = s.getMatchmakingStatus(a).joinedAt;
    s.joinMatchmaking(a,2);
    assert.equal(s.getMatchmakingStatus(a).joinedAt,before);
    const db=store.read(); db.users.find((u)=>u.id===b).wallet=0; store.write(db);
    assert.equal(s.joinMatchmaking(b,2).code,400);
    assert.equal(s.getMatchmakingStatus(a).status,'waiting');
});

test('CONTREPIED enters tournament rotations and respects the shared veto', () => {
    for (const ban of ['bounce', 'contrepied']) {
        const { service:s, ids, store } = setup();
        const { tournament:t } = s.createMultiplayerTournament(ids[0],4,'public');
        for (const id of ids.slice(1)) s.joinMultiplayerTournament(t.id,id);
        assert.equal(s.configureMultiplayerTournament(t.id,ids[0],['contrepied','chroma','ricochet']).ok,true);
        for (const id of ids) s.banTournamentGame(t.id,id,ban);
        for (const id of ids) s.setMultiplayerTournamentReady(t.id,id,true);
        assert.equal(s.startMultiplayerTournament(t.id,ids[0]).ok,true);
        const duels=store.read().duels.filter((d)=>d.tournamentId===t.id);
        assert.equal(duels.length,2);
        assert.ok(duels.every((d)=>d.games.includes('contrepied')===(ban!=='contrepied')));
    }
});

test('leaving a pending duel releases matchmaking without charging either player', () => {
    const { service:s,ids:[a,b,c] } = setup();
    const { duel } = s.createDuel(a,b,2);
    assert.equal(s.cancelPendingDuel(duel.id,c).code,403);
    assert.equal(s.cancelPendingDuel(duel.id,a).ok,true);
    assert.equal(s.cancelPendingDuel(duel.id,a).ok,true);
    assert.equal(s.startLiveDuel(duel.id,b).code,409);
    assert.equal(s.getState(a).wallet,25);
    assert.equal(s.joinMatchmaking(a,2).status,'waiting');
});

test('leaving a tournament frees a seat, transfers host and clears previous consent', () => {
    const { service:s,ids:[a,b],store } = setup();
    const { tournament:t } = s.createMultiplayerTournament(a,4,'public');
    s.joinMultiplayerTournament(t.id,b);
    s.banTournamentGame(t.id,a,'bounce'); s.banTournamentGame(t.id,b,'bombpass');
    s.setMultiplayerTournamentReady(t.id,b,true);
    assert.equal(s.leaveTournamentRoom(t.id,a).ok,true);
    const updated = store.read().tournaments.find((entry)=>entry.id===t.id);
    assert.equal(updated.hostId,b);
    assert.deepEqual(updated.entrants,[b]);
    assert.deepEqual(updated.readyBy,{});
    assert.equal(updated.veto.votes[a],undefined);
});
