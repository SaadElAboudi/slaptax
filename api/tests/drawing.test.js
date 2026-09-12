const test=require('node:test');
const assert=require('node:assert/strict');
const {traceScore,sample,cutResult,drawingTarget}=require('../games/drawing');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty,recordParty}=require('../games/partyGames');
const square=[[0,0],[1,0],[1,1],[0,1]];
function game(id='trace',players=['a','b']){const g=createParty(id,players,(min)=>min);beginParty(g,1000);return g;}
function drawing(g){while(g.phase!=='drawpath')tickParty(g,g.deadline);}
function lock(g,id,points,side=1){return actParty(g,id,{action:'lock',turn:g.turn,points,side},g.deadline-1);}

test('TRACE scores the same shape independently of direction and pointer sampling density',()=>{
    const target=[[.2,.7],[.5,.2],[.8,.7]];
    assert.equal(traceScore(target,target),1000);
    assert.equal(traceScore(target,[...target].reverse()),1000);
    assert.ok(traceScore(target,sample(target,100))>=990);
    assert.ok(traceScore(target,target.map(([x,y])=>[x+.003,y-.003]))>=990);
    assert.ok(traceScore(target,[[.1,.1],[.9,.1]])<500);
    assert.equal(traceScore(target,[[.5,.5],[.5,.5]]),0);
});
test('drawing generation stays inside normalized board across both games and all attempts',()=>{
    for(const id of ['trace','decoupe'])for(let a=1;a<=3;a++)for(let i=0;i<100;i++) {
        const target=drawingTarget(id,a,(min,max)=>min+Math.floor(Math.random()*(max-min)));
        assert.ok((target.path||target.polygon).flat().every(v=>Number.isFinite(v)&&v>=0&&v<=1));
        if(id==='decoupe')assert.ok(target.percent>=25&&target.percent<=75);
    }
});
test('DECOUPE computes both half-plane areas with complementary percentages',()=>{
    const line=[[.37,0],[.37,1]], left=cutResult(square,37,line,1),right=cutResult(square,63,line,-1);
    assert.equal(left.percent,37);assert.equal(left.error,0);assert.equal(left.score,1000);
    assert.equal(right.percent,63);assert.equal(right.score,1000);
    assert.equal(cutResult(square,50,[[0,0],[1,1]],1).percent,50);
    assert.equal(cutResult(square,50,[[0,0],[0,1]],1),null);
    assert.equal(cutResult(square,50,[[.5,.5],[.501,.501]],1),null);
    assert.equal(cutResult(square,50,line,0),null);
});
test('TRACE exposes targets only during observation and never exposes unscored rival strokes',()=>{
    const g=game();assert.equal(publicParty(g,'b',1000).drawing.target,undefined);
    tickParty(g,g.deadline);assert.equal(g.phase,'observe');
    const target=publicParty(g,'a',3000).drawing.target.path;
    assert.deepEqual(target,publicParty(g,'b',3000).drawing.target.path);
    tickParty(g,g.deadline);assert.equal(g.deadline,11000);
    assert.equal(publicParty(g,'a',5000).drawing.target,undefined);
    assert.equal(lock(g,'a',target),true);
    const state=publicParty(g,'b',5001);
    assert.equal(state.drawing.history.length,0);assert.equal(state.scores.a,0);
    assert.equal(JSON.stringify(state).includes('points'),false);
    assert.equal(lock(g,'b',target),true);assert.equal(g.phase,'reveal');
    assert.deepEqual(publicParty(g,'spectator',6000).drawing.history[0].results.a.points,target);
});
test('drawing accepts bounded finite input, only from a participant once in the current turn',()=>{
    const g=game();drawing(g);
    for(const points of [null,[],[[0,0]],Array(129).fill([.5,.5]),[[NaN,0],[1,1]],[[0,Infinity],[1,1]],[['0',0],[1,1]],[[-.1,0],[1,1]],[[0,0,0],[1,1]]])assert.equal(lock(g,'a',points),false);
    const points=[[.2,.2],[.8,.8]];
    assert.equal(lock(g,'outsider',points),false);
    assert.equal(actParty(g,'a',{action:'lock',turn:g.turn-1,points},6000),false);
    assert.equal(lock(g,'a',points),true);assert.equal(lock(g,'a',points),false);
});
for(const id of ['trace','decoupe'])test(`${id} resolves three attempts, expires missing input and preserves immutable replay`,()=>{
    const g=game(id);
    for(let i=0;i<3;i++){
        drawing(g);const points=id==='trace'?g.drawing.target.path:[[.5,0],[.5,1]];
        assert.equal(lock(g,'a',points),true);
        assert.equal(actParty(g,'b',{action:'lock',turn:g.turn,points,side:1},g.deadline),false);
        assert.equal(g.drawing.history[i].results.b.expired,true);
        recordParty(g,g.deadline-1,true);tickParty(g,g.deadline);
    }
    assert.equal(g.phase,'done');assert.equal(g.winnerId,'a');assert.equal(g.drawing.history.length,3);
    const frame=g.replay.at(-1).state;g.scores.a=0;
    assert.ok(frame.scores.a>0);assert.equal(frame.drawing.history.length,3);
});
test('drawing reconnect restarts only the unfinished attempt with its original target',()=>{
    const g=game();drawing(g);const target=structuredClone(g.drawing.target),turn=g.turn;
    lock(g,'a',target.path);pauseParty(g,9000,20000);
    assert.equal(g.turn,turn+1);assert.equal(g.attempt,1);assert.equal(g.phase,'prepare');assert.equal(g.deadline,22000);
    assert.deepEqual(g.drawing.target,target);assert.deepEqual(g.responses,{});
});
test('drawing exact ties require mutual consent and clear the previous history',()=>{
    const g=game();for(let i=0;i<3;i++){drawing(g);lock(g,'a',g.drawing.target.path);lock(g,'b',g.drawing.target.path);tickParty(g,g.deadline);}
    assert.equal(g.phase,'draw');actParty(g,'a',{action:'retry',turn:g.turn},g.deadline+1);assert.equal(g.phase,'draw');
    actParty(g,'b',{action:'retry',turn:g.turn},g.deadline+2);assert.equal(g.phase,'prepare');assert.deepEqual(g.drawing.history,[]);
});
