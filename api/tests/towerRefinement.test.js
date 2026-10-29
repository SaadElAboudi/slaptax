const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,publicParty,movingBlock,pauseParty}=require('../games/partyGames');
function game(){const g=createParty('onemore',['a','b'],min=>min);beginParty(g,1000);return g;}
function act(g,id,action,now){return actParty(g,id,{turn:g.turn,action},now);}
function drop(g,perfect=true){const r=g.runs.a,base=r.layers.at(-1);let at=r.motionAt+180;for(;at<g.deadline;at+=5){const m=movingBlock(g,'a',at),delta=Math.abs(m.x-base.x);if(perfect?delta<.005:delta>.07&&delta<.09)break;}assert.ok(at<g.deadline);assert.equal(act(g,'a','drop',at),true);return at;}
function earn(g){for(let i=0;i<3;i++)drop(g);assert.equal(g.runs.a.buoy,true);}
test('tower: an earned lifeline repairs actual width once without inventing score or blocks',()=>{
 const g=game(),r=g.runs.a;earn(g);drop(g,false);const base={...r.layers.at(-1)},level=r.level,len=r.layers.length,at=r.motionAt+50;
 assert.equal(act(g,'a','repair',at),true);assert.equal(r.level,level);assert.equal(r.layers.length,len);assert.equal(g.scores.a,0);assert.equal(r.buoy,false);assert.equal(r.repairs,1);assert.equal(r.rescues,0);assert.equal(r.perfectStreak,0);
 const top=r.layers.at(-1);assert.equal(top.width,Math.min(.62,base.width+.12));assert.ok(top.x>=0&&top.x+top.width<=1);assert.equal(r.motionAt,at);assert.equal(act(g,'a','drop',at+1),false);assert.equal(act(g,'a','repair',at+1),false);
 for(let i=0;i<3;i++)drop(g);assert.equal(r.buoy,false);assert.equal(act(g,'a','bank',r.motionAt+1),true);assert.equal(g.scores.a,r.level);
});
test('tower: unearned, unnecessary, foreign and stale repairs cannot mutate a run',()=>{
 const g=game();assert.equal(act(g,'a','repair',1001),false);earn(g);const before=JSON.stringify(g.runs.a);
 assert.equal(act(g,'a','repair',g.runs.a.motionAt+1),false);assert.equal(act(g,'outsider','repair',1001),false);assert.equal(actParty(g,'a',{turn:0,action:'repair'},1001),false);assert.equal(JSON.stringify(g.runs.a),before);
});
test('tower: repair is capped and clamps geometry at both board edges',()=>{
 for(const x of [0,.94]){const g=game();earn(g);const r=g.runs.a;r.layers[r.layers.length-1]={x,width:.06};assert.equal(act(g,'a','repair',r.motionAt+1),true);const top=r.layers.at(-1);assert.ok(Math.abs(top.width-.18)<1e-9);assert.ok(top.x>=0&&top.x+top.width<=1);}
});
test('tower: repair evidence and moving phase survive a pause; banked runs reject repairs',()=>{
 const g=game();earn(g);drop(g,false);const r=g.runs.a;act(g,'a','repair',r.motionAt+10);const at=r.motionAt+50,before=publicParty(g,'a',at).runs.a;pauseParty(g,5000,at+5000);const after=publicParty(g,'a',at+5000).runs.a;assert.deepEqual(after,before);assert.equal(after.repairs,1);act(g,'a','bank',at+5001);assert.equal(act(g,'a','repair',at+5002),false);
});
