const test=require('node:test');
const assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty,recordParty}=require('../games/partyGames');
function game(players=['a','b'],random=(min)=>min){const g=createParty('garde',players,random);beginParty(g,1000);return g;}
function act(g,id,action){return actParty(g,id,{action,turn:g.turn},g.deadline-1);}
function exchange(g,a,b){assert.equal(act(g,'a',a),true);assert.equal(act(g,'b',b),true);}

test('GARDE resolves all nine action pairs and four charge configurations simultaneously',()=>{
    for(const a of ['attack','charge','defend'])for(const b of ['attack','charge','defend'])for(const ca of [false,true])for(const cb of [false,true]) {
        const g=game();g.garde.charged={a:ca,b:cb};exchange(g,a,b);
        assert.deepEqual(g.garde.hp,{a:6-(b==='attack'&&a!=='defend'?(cb?2:1):0),b:6-(a==='attack'&&b!=='defend'?(ca?2:1):0)});
        assert.deepEqual(g.garde.charged,{a:a==='charge',b:b==='charge'});
        assert.equal(g.phase,'reveal');assert.equal(g.deadline,5199);
    }
});
test('GARDE rejects invalid, stale, outsider and duplicate actions without exposing committed choices',()=>{
    const g=game();assert.equal(g.deadline,4000);assert.deepEqual(g.scores,{a:6,b:6});
    for(const value of [undefined,null,1,'miss','ATTACK','retry'])assert.equal(act(g,'a',value),false);
    assert.equal(act(g,'outsider','attack'),false);
    assert.equal(actParty(g,'a',{turn:g.turn-1,action:'charge'},1500),false);
    assert.equal(act(g,'a','charge'),true);assert.equal(act(g,'a','attack'),false);
    assert.equal(publicParty(g,'a',1500).garde.selected,'charge');
    for(const viewer of ['b','spectator']) {
        const p=publicParty(g,viewer,1500).garde;assert.equal(p.selected,undefined);assert.deepEqual(p.charged,{a:false,b:false});assert.deepEqual(p.history,[]);
    }
    act(g,'b','attack');assert.equal(g.garde.hp.a,5);assert.equal(g.garde.charged.a,true);
});
test('GARDE defense cannot repeat, recovers after another action, and fully blocks a charge',()=>{
    const g=game();g.garde.charged.b=true;exchange(g,'defend','attack');assert.deepEqual(g.scores,{a:6,b:6});
    tickParty(g,g.deadline);assert.equal(publicParty(g,'a',6000).garde.canDefend.a,false);assert.equal(act(g,'a','defend'),false);
    exchange(g,'charge','attack');tickParty(g,g.deadline);assert.equal(act(g,'a','defend'),true);
});
test('GARDE expirations never attack or protect and consume an existing charge',()=>{
    const g=game();g.garde.charged.a=true;act(g,'b','attack');
    assert.equal(actParty(g,'a',{action:'attack',turn:g.turn},g.deadline),false);
    assert.deepEqual(g.garde.hp,{a:5,b:6});assert.equal(g.garde.charged.a,false);assert.equal(g.garde.history[0].actions.a,'miss');
    tickParty(g,g.deadline);tickParty(g,g.deadline);assert.deepEqual(g.garde.hp,{a:5,b:6});
});
test('GARDE stops at eight turns and exact ties need both players to replay',()=>{
    const g=game();for(let i=0;i<8;i++){exchange(g,'charge','charge');tickParty(g,g.deadline);}
    assert.equal(g.phase,'draw');assert.equal(g.attempt,8);assert.equal(g.garde.history.length,8);
    actParty(g,'a',{action:'retry',turn:g.turn},g.deadline+1);assert.equal(g.phase,'draw');
    actParty(g,'b',{action:'retry',turn:g.turn},g.deadline+2);assert.equal(g.phase,'choose');assert.equal(g.attempt,1);assert.deepEqual(g.garde.history,[]);assert.deepEqual(g.scores,{a:6,b:6});
});
test('GARDE resolves knockouts and double knockouts without a speed tiebreak',()=>{
    const g=game();g.garde.hp={a:1,b:2};g.garde.charged.a=true;
    exchange(g,'attack','attack');assert.deepEqual(g.garde.hp,{a:0,b:0});tickParty(g,g.deadline);assert.equal(g.phase,'draw');
    const h=game();h.garde.hp.b=1;exchange(h,'attack','charge');tickParty(h,h.deadline);assert.equal(h.phase,'done');assert.equal(h.winnerId,'a');
});
test('GARDE reconnect replays only an unfinished turn and preserves HP and charged state',()=>{
    const g=game();exchange(g,'charge','attack');tickParty(g,g.deadline);
    const before=structuredClone(g.garde),turn=g.turn;act(g,'a','attack');pauseParty(g,5000,15000);
    assert.deepEqual(g.garde,before);assert.deepEqual(g.responses,{});assert.equal(g.attempt,2);assert.equal(g.turn,turn+1);assert.equal(g.deadline,18000);
    assert.equal(actParty(g,'a',{action:'attack',turn},15001),false);
});
test('GARDE practice precommits its explicit bot and keeps its actual winner separate from solo completion',()=>{
    const g=game(['a']);assert.equal(g.responses['practice-bot'],'attack');
    const p=publicParty(g,'a',1001).garde;assert.equal(p.botId,'practice-bot');assert.equal(p.selected,undefined);
    for(let i=0;i<6;i++){act(g,'a','charge');tickParty(g,g.deadline);}
    assert.equal(g.phase,'done');assert.equal(g.garde.winnerId,'practice-bot');assert.equal(g.garde.hp.a,0);
});
test('GARDE replay is immutable and contains the complete history for sharing',()=>{
    const g=game();exchange(g,'attack','charge');recordParty(g,4000,true);
    const p=publicParty(g,'a',4000);p.garde.hp.a=0;p.garde.history[0].actions.a='miss';
    assert.equal(g.garde.hp.a,6);assert.equal(g.garde.history[0].actions.a,'attack');
    g.garde.hp.a=1;assert.equal(g.replay[0].state.garde.hp.a,6);
});
