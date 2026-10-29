const test=require('node:test'),assert=require('node:assert/strict');
const {applySoloRun,publicSolo,normalizePractice}=require('../domain/soloProgression');
const {createService}=require('../application/service');
const {makeDefaultState}=require('../infrastructure/db');
const now=Date.parse('2026-10-27T12:00:00Z');
function user(){return {progression:{xp:0}};}
test('solo rewards are deterministic, deduplicated and capped without affecting funds',()=>{
 const u=user();u.wallet=25;
 const r=applySoloRun(u,{id:'one',gameId:'decoupe',score:750},now);
 assert.equal(r.xpGain,15);assert.deepEqual(r.badges,['first-step']);
 assert.equal(applySoloRun(u,{id:'one',gameId:'decoupe',score:750},now),null);
 for(let i=0;i<10;i++)applySoloRun(u,{id:String(i),gameId:'decoupe',score:600},now);
 assert.equal(u.progression.xp,45);assert.equal(u.wallet,25);assert.equal(publicSolo(u,now).best.decoupe,750);
 assert.ok(publicSolo(u,now).badges.includes('regular'));assert.equal(publicSolo(u,now).receipts,undefined);
});
test('daily trio grants its fixed bonus once and a new day preserves badges and records',()=>{
 const u=user();const games=publicSolo(u,now).daily.games;
 const receipts=games.map((gameId,i)=>applySoloRun(u,{id:`today-${i}`,gameId,score:950},now));
 assert.equal(receipts.at(-1).xpGain,105);assert.equal(receipts.at(-1).dailyCompleted,true);
 assert.equal(u.progression.xp,135);assert.ok(publicSolo(u,now).badges.includes('daily-tour'));
 assert.ok(publicSolo(u,now).badges.includes('explorer'));assert.ok(publicSolo(u,now).badges.includes('sharp'));
 assert.equal(applySoloRun(u,{id:'extra',gameId:games[0],score:980},now).xpGain,0);
 const tomorrow=publicSolo(u,now+86400000);assert.equal(tomorrow.daily.completed.length,0);assert.ok(tomorrow.badges.includes('daily-tour'));assert.equal(tomorrow.best[games[0]],980);
});
test('zero and invalid scores do not create rewards',()=>{
 const u=user();for(const score of [0,-1,1001,NaN,Infinity,1.2])assert.equal(applySoloRun(u,{id:'bad',gameId:'trace',score},now),null);
 assert.equal(publicSolo(u,now).plays,0);assert.equal(u.progression.xp,0);
 assert.equal(normalizePractice({id:'onemore',scores:{a:7}},'a'),350);
 assert.equal(normalizePractice({id:'decoupe',scores:{a:2850}},'a'),950);
});
test('solo completion survives service recreation, unlocks earned cosmetics and leaves ranked data unchanged',()=>{
 let state=makeDefaultState();const store={read:()=>structuredClone(state),write:next=>{state=structuredClone(next)}};
 let s=createService(store);const {userId}=s.joinSession('Solo','solo-client');
 const before=s.getState(userId,'solo-client');
 for(let i=0;i<20;i++)s.recordSoloCompletion(userId,`game-${i}`,'onemore',700);
 const after=s.getState(userId,'solo-client');
 assert.equal(after.progression.xp-before.progression.xp,45);assert.equal(after.wallet,before.wallet+6);
 assert.deepEqual(after.history,before.history);assert.equal(after.progression.rankedPoints,before.progression.rankedPoints);
 assert.equal(after.progression.solo.receipts,undefined);
 s=createService(store);assert.equal(s.getState(userId,'solo-client').progression.solo.plays,20);
 assert.equal(s.recordSoloCompletion(userId,'game-0','onemore',700),null);
 assert.equal(s.recordSoloCompletion(userId,'unsupported','bounce',800),null);
 const db=store.read();db.users.find(u=>u.id===userId).progression.xp=475;store.write(db);
 // Reset the per-day cap to exercise a real XP level crossing.
 const db2=store.read();db2.users.find(u=>u.id===userId).progression.solo.daily.xpPlays=0;store.write(db2);
 const reward=s.recordSoloCompletion(userId,'level-up','onemore',800);
 assert.equal(reward.levelUp,true);assert.ok(reward.unlocked.some(x=>x.id==='visor'));
});
