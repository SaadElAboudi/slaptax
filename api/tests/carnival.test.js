const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty,recordParty,partyMoment}=require('../games/partyGames');
const {position}=require('../games/carnival');
const {normalizePractice}=require('../domain/soloProgression');
function game(id,players=['a','b']){const g=createParty(id,players,(min)=>min);beginParty(g,1000);return g;}
function act(g,id,action,now=1001){return actParty(g,id,{turn:g.turn,serial:g.carnival.bodies.find(p=>p.id===id)?.serial,...action},now);}
for(const kind of ['pie','balloon']){
 test(`${kind}: ready-safe snapshots, declared solo bot, real two-human duel`,()=>{
  assert.equal(publicParty(createParty(kind,['a']),'a',1000).carnival,undefined);
  assert.equal(game(kind,['a']).carnival.bodies.filter(p=>p.bot).length,1);
  assert.equal(game(kind).carnival.bodies.some(p=>p.bot),false);
 });
 test(`${kind}: outsiders, wrong turns, forged scores and invalid actions cannot score`,()=>{
  const g=game(kind);
  assert.equal(act(g,'outsider',{action:'bank'}),false);assert.equal(actParty(g,'a',{turn:0,action:'duck'},1001),false);
  assert.equal(act(g,'a',{action:'score',score:99999}),false);assert.equal(g.scores.a,0);
 });
 test(`${kind}: fixed steps and bot decisions are independent of broadcast batches`,()=>{
  const a=game(kind,['a']),b=game(kind,['a']);tickParty(a,10000);for(let now=1050;now<=10000;now+=50)tickParty(b,now);
  assert.deepEqual(publicParty(a,'a',10000),publicParty(b,'a',10000));
 });
 test(`${kind}: ties require both humans to agree to replay, stale actions are rejected`,()=>{
  const g=game(kind);tickParty(g,23000);assert.equal(g.phase,'draw');const turn=g.turn;
  assert.equal(act(g,'a',{action:'retry'},23001),true);assert.equal(g.phase,'draw');assert.equal(act(g,'a',{action:'retry'},23001),false);
  assert.equal(act(g,'b',{action:'retry'},23002),true);assert.equal(g.phase,'brawl');assert.ok(g.turn>turn);
  assert.equal(actParty(g,'a',{turn,action:'inflate'},23003),false);
 });
 test(`${kind}: pause preserves shots, cooldowns, elapsed time and the real replay`,()=>{
  const g=game(kind);if(kind==='pie')act(g,'a',{action:'throw',aim:.5});else act(g,'a',{action:'inflate'});
  tickParty(g,1100);const before=publicParty(g,'a',1100).carnival;
  pauseParty(g,5000,6100);const after=publicParty(g,'a',6100).carnival;
  assert.equal(after.elapsed,before.elapsed);assert.equal(after.bodies[0].cooldown,before.bodies[0].cooldown);
  if(kind==='pie')assert.equal(after.shots[0].progress,before.shots[0].progress);else assert.equal(after.bodies[0].inflating,false);
  recordParty(g,6100,true);const moment=partyMoment(g);assert.ok(moment.replay.at(-1).state.carnival);assert.equal(moment.gameId,kind);
 });
}
test('pie: finite bounded aims and cooldowns; hit is decided on arrival, consecutive bullseyes reward combos',()=>{
 const g=game('pie');
 for(const aim of [-1,2,NaN,Infinity,'0.5'])assert.equal(act(g,'a',{action:'throw',aim}),false);
 const aim=position(1,351);assert.equal(act(g,'a',{action:'throw',aim},1001),true);
 assert.equal(act(g,'a',{action:'throw',aim},1002),false);tickParty(g,1350);assert.equal(g.scores.a,0);tickParty(g,1400);assert.equal(g.scores.a,200);
 const second=position(1,1351);act(g,'a',{action:'throw',aim:second},2001);tickParty(g,2400);assert.equal(g.scores.a,425);assert.equal(g.carnival.bodies[0].combo,2);
});
test('pie: a timed duck protects the actual opponent; cooldown prevents permanent invulnerability',()=>{
 const g=game('pie');act(g,'a',{action:'throw',aim:position(1,351)},1001);assert.equal(act(g,'b',{action:'duck'},1200),true);assert.equal(act(g,'b',{action:'duck'},1201),false);
 tickParty(g,1400);assert.equal(g.scores.a,0);assert.equal(g.carnival.events.at(-1).kind,'dodged');
});
test('balloon: hold input expires, release banks squared volume, pop loses only unbanked balloon',()=>{
 const g=game('balloon'),p=g.carnival.bodies[0];act(g,'a',{action:'inflate'});tickParty(g,3000);assert.ok(p.volume<11);assert.equal(p.inflating,false);
 // A real maintained hold banks 50% for 125 points.
 for(let t=3000;t<5800;t+=200)act(g,'a',{action:'inflate'},t);tickParty(g,5800);assert.ok(p.volume>50);assert.equal(act(g,'a',{action:'bank'},5801),true);tickParty(g,5850);const saved=g.scores.a;assert.ok(saved>125);assert.equal(p.volume,0);
 for(let t=6100;t<12500;t+=200)act(g,'a',{action:'inflate'},t);tickParty(g,12500);assert.equal(p.misses,1);assert.equal(g.scores.a,saved);
 assert.ok(!('limit' in publicParty(g,'b',11000).carnival.bodies[0]));
});
test('balloon: sabotage costs banked points, has a cooldown and can pop a rival balloon',()=>{
 const g=game('balloon'),[a,b]=g.carnival.bodies;a.score=100;b.volume=95;
 assert.equal(act(g,'a',{action:'poke'}),true);assert.equal(a.score,75);assert.equal(b.misses,0);tickParty(g,1700);assert.equal(b.misses,1);assert.equal(b.volume,0);
 b.volume=40;assert.equal(act(g,'a',{action:'poke'},1002),false);assert.equal(a.score,75);
 assert.equal(act(g,'b',{action:'poke'},1002),false);
});
test('new games award meaningful normalized solo ratings without AFK rewards',()=>{
 for(const [id,raw,want] of [['pie',2000,500],['balloon',1000,500]]){const g=game(id,['a']);assert.equal(normalizePractice(g,'a'),0);g.scores.a=raw;assert.equal(normalizePractice(g,'a'),want);g.scores.a=999999;assert.equal(normalizePractice(g,'a'),1000);}
});

test('pie: an input after impact cannot retroactively dodge between fixed ticks',()=>{
 const g=game('pie');act(g,'a',{action:'throw',aim:position(1,351)},1001);act(g,'b',{action:'duck'},1370);tickParty(g,1400);assert.equal(g.scores.a,200);
});

test('balloon: early release stops immediately without inventing points or continuing to inflate',()=>{
 const g=game('balloon'),p=g.carnival.bodies[0];act(g,'a',{action:'inflate'},1001);tickParty(g,1200);const volume=p.volume;
 assert.ok(volume>0&&volume<10);assert.equal(act(g,'a',{action:'bank'},1201),true);tickParty(g,1600);
 assert.equal(p.volume,volume);assert.equal(p.inflating,false);assert.equal(p.score,0);
});
test('balloon: stale or missing balloon serial cannot inflate or bank a replacement; snapshots score immediately',()=>{
 const g=game('balloon'),p=g.carnival.bodies[0],serial=p.serial;p.volume=50;
 assert.equal(act(g,'a',{action:'bank',serial}),true);assert.equal(g.scores.a,125);assert.equal(p.serial,serial+1);
 for(const action of ['inflate','bank']){assert.equal(act(g,'a',{action,serial},1400),false);assert.equal(act(g,'a',{action,serial:undefined},1400),false);}
 assert.equal(p.inflating,false);assert.equal(p.score,125);
});
test('balloon: risky banks earn one helmet, sabotage consumes it once and costs actual points',()=>{
 const g=game('balloon'),[a,b]=g.carnival.bodies;a.volume=71;act(g,'a',{action:'bank'});assert.equal(a.shield,true);assert.equal(g.scores.a,252);
 a.volume=72;act(g,'a',{action:'bank'},1400);assert.equal(a.shield,true);a.volume=70;b.score=100;
 assert.equal(act(g,'b',{action:'poke'},1500),true);assert.equal(b.score,75);assert.equal(a.volume,70);assert.equal(a.shield,true);tickParty(g,2200);assert.equal(a.shield,false);assert.equal(a.blocks,1);
 assert.equal(g.carnival.events.at(-1).kind,'blocked');a.volume=95;assert.equal(act(g,'b',{action:'poke'},5500),true);tickParty(g,6200);assert.equal(a.misses,1);assert.equal(a.blocks,1);
});
test('pie: a real dodge earns one larger revenge pie and a hit grants its real bonus',()=>{
 const g=game('pie'),[a,b]=g.carnival.bodies;act(g,'a',{action:'throw',aim:position(1,351)},1001);act(g,'b',{action:'duck'},1200);tickParty(g,1400);
 assert.equal(b.revenge,true);assert.equal(b.dodges,1);
 act(g,'b',{action:'throw',aim:position(0,751)+.15},1401);assert.equal(b.revenge,false);assert.equal(g.carnival.shots[0].revenge,true);
 tickParty(g,1800);assert.equal(b.score,200);assert.equal(g.scores.b,200);assert.equal(g.carnival.events.at(-1).kind,'revenge-hit');
 act(g,'b',{action:'throw',aim:position(0,1801)+.15},2451);assert.equal(g.carnival.shots[0].revenge,false);
});
test('pie: dodging an off-target throw cannot farm powers, points or fake dodges',()=>{
 const g=game('pie'),b=g.carnival.bodies[1];act(g,'a',{action:'throw',aim:0},1001);act(g,'b',{action:'duck'},1200);tickParty(g,1400);
 assert.equal(b.revenge,false);assert.equal(b.dodges,0);assert.equal(g.carnival.events.at(-1).kind,'miss');
});
test('carnival: a paused simulation has frozen visuals and resuming invalidates old held input',()=>{
 const g=game('balloon'),p=g.carnival.bodies[0];act(g,'a',{action:'inflate'});tickParty(g,1200);const before=publicParty(g,'a',1200).carnival,serial=p.serial;
 assert.deepEqual(publicParty(g,'a',6000).carnival,before);pauseParty(g,5000,6200);
 assert.equal(act(g,'a',{action:'inflate',serial},6201),false);assert.equal(p.inflating,false);assert.equal(publicParty(g,'a',6200).carnival.elapsed,before.elapsed);
});

test('pie: the solo bot visibly misses some shots instead of having perfect aim',()=>{
 const g=game('pie',['a']);tickParty(g,20000);const bot=g.carnival.bodies.find(p=>p.bot);assert.ok(bot.hits>0);assert.ok(bot.misses>0);assert.equal(g.scores.a,0);
});
