const test=require('node:test'),assert=require('node:assert/strict');
const selection=require('../../shared/game-selection.json');
const {GAME_POOL,tournamentVeto}=require('../domain/veto');
const {resolveP2PGames,resolveTournamentGames,P2P_GAME_LIBRARY}=require('../domain/simulations');
const {publicSolo,applySoloRun}=require('../domain/soloProgression');
const now=Date.parse('2026-10-27T12:00:00Z');
test('all automatic duel and tournament rotations use the main arena and current bonus games and current names',()=>{
 assert.deepEqual(selection.map(g=>g.id),['decoupe','chroma','onemore','snack','table','pie']);assert.ok(GAME_POOL.includes('chroma'));assert.ok(!GAME_POOL.includes('chicken'));assert.equal(new Set(selection.map(g=>g.mechanic)).size,selection.length);assert.equal(new Set(GAME_POOL).size,selection.length);
 assert.deepEqual(GAME_POOL,selection.map(game=>game.id));
 for(let i=0;i<50;i++){
  for(const id of [...resolveP2PGames(),...resolveTournamentGames(),...tournamentVeto({a:'table',b:'chroma'},['a','b']).games])assert.ok(GAME_POOL.includes(id),id);
 }
 for(const game of selection)assert.equal(P2P_GAME_LIBRARY[game.id].label,game.labelEn);
 // An existing explicitly requested legacy game is still interpretable.
 assert.ok(resolveP2PGames({challenger:{pick:'chicken',ban:'bounce'},opponent:{pick:'decoupe',ban:'symbolrush'}}).includes('chicken'));
});
test('daily route migration preserves completed active tasks, records, reward receipts and XP caps',()=>{
 const u={progression:{xp:135,solo:{plays:3,best:{chroma:920,decoupe:800},badges:['daily-tour'],receipts:['old'],daily:{day:'2026-10-27',games:['chicken','decoupe','trace'],completed:['chicken','decoupe'],rewarded:true,xpPlays:3}}}};
 const state=publicSolo(u,now);assert.equal(state.daily.games.length,3);assert.ok(state.daily.games.every(id=>GAME_POOL.includes(id)&&id!=='bombpass'));
 assert.deepEqual(state.daily.completed,['decoupe']);assert.equal(state.daily.rewarded,true);assert.equal(state.daily.xpPlays,3);assert.equal(state.best.chroma,920);
 for(const gameId of state.daily.games)applySoloRun(u,{id:'new-'+gameId,gameId,score:800},now);
 assert.equal(u.progression.xp,135);assert.ok(u.progression.solo.receipts.includes('old'));
});
test('daily rotations always contain three distinct supported solo games',()=>{
 for(let day=0;day<30;day++){const state=publicSolo({progression:{xp:0}},now+day*86400000);assert.equal(new Set(state.daily.games).size,3);assert.equal(new Set(state.daily.games.map(id=>selection.find(g=>g.id===id).family)).size,3);assert.ok(state.daily.games.every(id=>GAME_POOL.includes(id)&&id!=='bombpass'));}
});

test('the four-friend playlist and score challenges remain in the selected catalogue',()=>{
 const ids=selection.map(g=>g.id);
 for(const game of require('../../shared/friend-night.json'))assert.ok(ids.includes(game.id),game.id);
 for(const id of ['decoupe','chroma','onemore'])assert.ok(ids.includes(id));
 for(const id of ['toilet','pigeon','lift','balloon','garde','bombpass'])assert.ok(!ids.includes(id));
});
