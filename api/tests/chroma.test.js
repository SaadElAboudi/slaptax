const test = require('node:test');
const assert = require('node:assert/strict');
const { createParty, beginParty, tickParty, actParty, publicParty, pauseParty } = require('../games/partyGames');
function game(players = ['a','b']) {
    const g = createParty('chroma', players, (min) => min);
    beginParty(g, 1000); return g;
}
function mix(g) { tickParty(g,g.deadline); tickParty(g,g.deadline); }
test('chroma reveals a common target for two seconds, then hides it and rival drafts', () => {
    const g=game();
    assert.equal(publicParty(g,'a',1000).color,undefined);
    tickParty(g,g.deadline);
    assert.deepEqual(publicParty(g,'a',4000).color,[24,24,24]);
    assert.equal(g.deadline,6000);
    tickParty(g,6000);
    assert.equal(g.phase,'mix'); assert.equal(g.deadline,16000);
    actParty(g,'a',{action:'color',rgb:[9,8,7],turn:g.turn},6001);
    const b=publicParty(g,'b',6002);
    assert.equal(b.color,undefined); assert.deepEqual(b.draft,[128,128,128]);
    assert.equal(JSON.stringify(b).includes('[9,8,7]'),false);
    assert.equal(publicParty(g,'spectator',6002).draft,undefined);
});
test('chroma validates RGB and turn, locks once, and computes Euclidean error on the server', () => {
    const g=game(); mix(g);
    for (const rgb of [[0,0],[-1,0,0],[256,0,0],[1.2,0,0],['24',24,24],[NaN,0,0]])
        assert.equal(actParty(g,'a',{action:'lock',rgb,turn:g.turn},6001),false);
    assert.equal(actParty(g,'outsider',{action:'lock',rgb:[24,24,24],turn:g.turn},6001),false);
    assert.equal(actParty(g,'a',{action:'lock',rgb:[24,24,24],turn:g.turn-1},6001),false);
    assert.equal(actParty(g,'a',{action:'lock',rgb:[24,24,24],turn:g.turn},6001),true);
    assert.equal(actParty(g,'a',{action:'color',rgb:[0,0,0],turn:g.turn},6002),false);
    actParty(g,'b',{action:'lock',rgb:[27,28,24],turn:g.turn},6003);
    assert.equal(g.phase,'reveal'); assert.equal(g.scores.a,0); assert.equal(g.scores.b,-5000);
    assert.deepEqual(publicParty(g,'a',6003).feedback.colors.b,[27,28,24]);
});
test('chroma timeout locks the last draft, rejects late input, and resolves three attempts', () => {
    const g=game();
    for(let i=0;i<3;i++) {
        mix(g);
        actParty(g,'a',{action:'color',rgb:[24,24,24],turn:g.turn},g.deadline-1);
        assert.equal(actParty(g,'b',{action:'lock',rgb:[24,24,24],turn:g.turn},g.deadline),false);
        assert.equal(g.phase,'reveal');
        tickParty(g,g.deadline);
    }
    assert.equal(g.phase,'done'); assert.equal(g.winnerId,'a'); assert.equal(g.runs.a.errors.length,3);
});
test('chroma reconnect resets only the unfinished attempt with a new countdown and turn', () => {
    const g=game(); mix(g); const turn=g.turn; const color=[...g.color];
    actParty(g,'a',{action:'lock',rgb:color,turn},6001);
    pauseParty(g,5000,12000);
    assert.equal(g.turn,turn+1); assert.equal(g.attempt,1); assert.equal(g.phase,'prepare');
    assert.deepEqual(g.color,color); assert.deepEqual(g.responses,{}); assert.deepEqual(g.drafts.a,[128,128,128]);
});
test('chroma exact ties require both players to consent to replay', () => {
    const g=game();
    for(let i=0;i<3;i++) {mix(g); tickParty(g,g.deadline); tickParty(g,g.deadline);}
    assert.equal(g.phase,'draw');
    actParty(g,'a',{action:'retry',turn:g.turn},g.deadline+1);
    assert.equal(g.phase,'draw');
    actParty(g,'b',{action:'retry',turn:g.turn},g.deadline+2);
    assert.equal(g.phase,'prepare'); assert.equal(g.attempt,1);
});
