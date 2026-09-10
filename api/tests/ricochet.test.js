const test=require('node:test');
const assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {simulate}=require('../games/ricochet');
function game(players=['a','b']) {const g=createParty('ricochet',players);beginParty(g,1000);return g;}
function shoot(g,id,angle=25,power=14,now=1001){return actParty(g,id,{action:'shoot',angle,power,turn:g.turn},now);}

test('ricochet keeps shots private and launches only after both players lock',()=>{
    const g=game();assert.equal(shoot(g,'a'),true);assert.equal(g.phase,'aim');
    assert.equal(shoot(g,'a'),false);assert.equal(shoot(g,'outsider'),false);
    assert.equal(JSON.stringify(publicParty(g,'b',1001)).includes('"angle"'),false);
    assert.equal(JSON.stringify(publicParty(g,'spectator',1001)).includes('"power"'),false);
    assert.equal(shoot(g,'b',0,80),true);assert.equal(g.phase,'flight');
    assert.equal(g.frames[0].length,2);
});
test('ricochet rejects invalid, stale and late commands without inventing a shot',()=>{
    const g=game();
    for(const [angle,power] of [[NaN,20],[0,Infinity],[71,20],[0,101],[0,0],['10',20]])assert.equal(shoot(g,'a',angle,power),false);
    assert.equal(actParty(g,'a',{action:'shoot',angle:0,power:20,turn:0},1001),false);
    assert.equal(shoot(g,'a',0,20,g.deadline),false);
    assert.equal(g.phase,'flight');assert.equal(g.frames[0].length,0);
});
test('ricochet physics is repeatable and retains bounded finite positions',()=>{
    const shots={a:{angle:65,power:100},b:{angle:15,power:70}};
    const a=simulate([],shots,['a','b'],1),b=simulate([],shots,['a','b'],1);
    assert.deepEqual(a,b);assert.equal(a.length,361);
    assert.notDeepEqual(a[0],a[20]);
    assert.ok(a.every((f)=>f.every((p)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=-14&&p.x<=614&&p.y>=0&&p.y<=600)));
});
test('ricochet collisions displace a settled puck and side exits remove pucks',()=>{
    const frames=simulate([{id:'old',owner:'b',x:180,y:300}],{a:{angle:0,power:35}},['a','b'],1);
    assert.ok(frames.some((f)=>Math.abs((f.find((p)=>p.id==='old')?.y || 0)-300)>10));
    const exited=simulate([{id:'edge',owner:'b',x:610,y:300}],{a:{angle:70,power:100}},['a','b'],1);
    assert.ok(exited.every((f)=>f.length<=2));
    const direct=simulate([],{a:{angle:55,power:100}},['a'],1);
    assert.ok(direct.some((f)=>f.length===0));
});
test('ricochet resolves three volleys by nearest remaining puck, not client scores',()=>{
    const g=game();
    for(let i=0;i<3;i++){
        shoot(g,'a',25,14,g.deadline-2);shoot(g,'b',0,80,g.deadline-1);
        tickParty(g,g.deadline);assert.equal(g.phase,'reveal');
        tickParty(g,g.deadline);
    }
    assert.equal(g.phase,'done');assert.ok(['a','b'].includes(g.winnerId));
    for(const id of g.players){const own=g.pucks.filter((p)=>p.owner===id);assert.equal(g.scores[id],own.length ? 10000-Math.round(Math.min(...own.map((p)=>Math.hypot(p.x-300,p.y-300)))*10):0);}
});
test('ricochet pause preserves locked shots and resumes the same physics frame',()=>{
    const g=game();shoot(g,'a');shoot(g,'b',0,80);tickParty(g,2000);
    const before=structuredClone(g.pucks);pauseParty(g,5000,7000);tickParty(g,7000);
    assert.deepEqual(g.pucks,before);assert.equal(g.attempt,1);
});
