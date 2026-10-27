const test=require('node:test'),assert=require('node:assert/strict');
const selection=require('../../shared/game-selection.json');
const {GAME_POOL,tournamentVeto}=require('../domain/veto');
const {resolveP2PGames,resolveTournamentGames,P2P_GAME_LIBRARY}=require('../domain/simulations');
const {publicSolo,applySoloRun}=require('../domain/soloProgression');
const now=Date.parse('2026-10-27T12:00:00Z');
test('all automatic duel and tournament rotations use the ten selected games and current names',()=>{
 assert.equal(selection.length,10);assert.equal(new Set(GAME_POOL).size,10);
 assert.deepEqual(GAME_POOL,selection.map(game=>game.id));
 for(let i=0;i<50;i++){
  for(const id of [...resolveP2PGames(),...resolveTournamentGames(),...tournamentVeto({a:'table',b:'garde'},['a','b']).games])assert.ok(GAME_POOL.includes(id),id);
 }
 for(const game of selection)assert.equal(P2P_GAME_LIBRARY[game.id].label,game.labelEn);
 // An existing explicitly requested legacy game is still interpretable.
 assert.ok(resolveP2PGames({challenger:{pick:'chroma',ban:'bounce'},opponent:{pick:'decoupe',ban:'symbolrush'}}).includes('chroma'));
});
test('daily route migration preserves completed active tasks, records, reward receipts and XP caps',()=>{
 const u={progression:{xp:135,solo:{plays:3,best:{chroma:920,decoupe:800},badges:['daily-tour'],receipts:['old'],daily:{day:'2026-10-27',games:['chroma','decoupe','trace'],completed:['chroma','decoupe'],rewarded:true,xpPlays:3}}}};
 const state=publicSolo(u,now);assert.equal(state.daily.games.length,3);assert.ok(state.daily.games.every(id=>GAME_POOL.includes(id)&&id!=='bombpass'));
 assert.deepEqual(state.daily.completed,['decoupe']);assert.equal(state.daily.rewarded,true);assert.equal(state.daily.xpPlays,3);assert.equal(state.best.chroma,920);
 for(const gameId of state.daily.games)applySoloRun(u,{id:'new-'+gameId,gameId,score:800},now);
 assert.equal(u.progression.xp,135);assert.ok(u.progression.solo.receipts.includes('old'));
});
test('daily rotations always contain three distinct supported solo games',()=>{
 for(let day=0;day<30;day++){const state=publicSolo({progression:{xp:0}},now+day*86400000);assert.equal(new Set(state.daily.games).size,3);assert.ok(state.daily.games.every(id=>GAME_POOL.includes(id)&&id!=='bombpass'));}
});
