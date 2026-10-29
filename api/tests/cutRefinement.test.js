const test=require('node:test'),assert=require('node:assert/strict');
const {cutDirectionAllowed,cutResult,drawingTarget}=require('../games/drawing');
const {createParty,beginParty,tickParty,actParty,publicParty,recordParty,pauseParty}=require('../games/partyGames');
const square=[[0,0],[1,0],[1,1],[0,1]];
function game(){const g=createParty('decoupe',['a','b'],min=>min);beginParty(g,1000);return g;}
function lock(g,id,points,extra={}){return actParty(g,id,{turn:g.turn,action:'lock',points,side:1,...extra},g.deadline-1);}
test('chef menu generates three distinct convex foods and fixed directions for equal server commands',()=>{
 const targets=[1,2,3].map(i=>drawingTarget('decoupe',i,min=>min));assert.deepEqual(targets.map(t=>t.recipe),['biscuit','fromage','gateau']);assert.deepEqual(targets.map(t=>t.axis),['free','vertical','diagonal']);assert.deepEqual(targets.map(t=>t.polygon.length),[5,3,8]);
 for(const t of targets){const line=t.axis==='diagonal'?[[0,0],[1,1]]:[[.5,0],[.5,1]];assert.ok(cutResult(t.polygon,t.percent,line,1,t.axis));assert.deepEqual(t,drawingTarget('decoupe',targets.indexOf(t)+1,min=>min));}
});
test('chef direction is server-owned, tolerates small input error and rejects wrong or forged axes',()=>{
 assert.equal(cutDirectionAllowed([[.5,0],[.51,1]],'vertical'),true);assert.equal(cutDirectionAllowed([[0,0],[1,.95]],'diagonal'),true);assert.equal(cutDirectionAllowed([[1,1],[0,0]],'diagonal'),true);
 for(const [line,axis] of [[[[0,.5],[1,.5]],'vertical'],[[[0,1],[1,0]],'diagonal'],[[[0,0],[1,1]],'unknown'],[[[NaN,0],[1,1]],'free']])assert.equal(cutDirectionAllowed(line,axis),false);
 const g=game();g.attempt=2;g.drawing.target=drawingTarget('decoupe',2,min=>min);tickParty(g,g.deadline);const before=JSON.stringify(g.responses);assert.equal(lock(g,'a',[[0,.5],[1,.5]],{axis:'free',score:99999}),false);assert.equal(JSON.stringify(g.responses),before);assert.equal(lock(g,'a',[[.5,0],[.5,1]],{score:99999}),true);assert.equal(publicParty(g,'b',g.deadline-1).drawing.history.length,0);assert.equal(g.scores.a,0);assert.ok(g.responses.a.score<=1000);assert.equal(lock(g,'a',[[.5,0],[.5,1]]),false);
});
test('legacy commands without a direction keep their original area scoring and valid cuts',()=>{
 const g=game();g.drawing.target={polygon:square,percent:37};tickParty(g,g.deadline);const line=[[.37,0],[.37,1]];assert.equal(lock(g,'a',line),true);assert.equal(lock(g,'b',line),true);assert.equal(g.scores.a,1000);assert.equal(g.drawing.history[0].target.axis,undefined);assert.equal(cutResult(square,50,[[0,0],[1,1]],1).score,1000);
});
test('chef pause and replay preserve the actual command and scored cut',()=>{
 const g=game();tickParty(g,g.deadline);const before=structuredClone(g.drawing.target),turn=g.turn;pauseParty(g,5000,9000);assert.deepEqual(g.drawing.target,before);assert.equal(g.turn,turn+1);tickParty(g,g.deadline);assert.equal(lock(g,'a',[[.5,0],[.5,1]]),true);assert.equal(lock(g,'b',[[.5,0],[.5,1]]),true);recordParty(g,g.deadline-1,true);assert.equal(g.replay.at(-1).state.drawing.history[0].target.recipe,'biscuit');
});
