const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,publicParty,movingBlock,pauseParty}=require('../games/partyGames');
function game(){const g=createParty('onemore',['a','b'],min=>min);beginParty(g,1000);return g;}
function act(g,id,action,now){return actParty(g,id,{turn:g.turn,action},now);}
function drop(g,perfect=true){const r=g.runs.a,base=r.layers.at(-1);let at=r.motionAt+180;for(;at<g.deadline;at+=5){const m=movingBlock(g,'a',at),delta=Math.abs(m.x-base.x);if(perfect?delta<.005:delta>.07&&delta<.09)break;}assert.ok(at<g.deadline);assert.equal(act(g,'a','drop',at),true);return at;}
function earn(g){for(let i=0;i<3;i++)drop(g);assert.equal(g.runs.a.buoy,true);}
test('tower: unearned, unnecessary, foreign and stale repairs cannot mutate a run',()=>{
 const g=game();assert.equal(act(g,'a','repair',1001),false);earn(g);const before=JSON.stringify(g.runs.a);
 assert.equal(act(g,'a','repair',g.runs.a.motionAt+1),false);assert.equal(act(g,'outsider','repair',1001),false);assert.equal(actParty(g,'a',{turn:0,action:'repair'},1001),false);assert.equal(JSON.stringify(g.runs.a),before);
});
