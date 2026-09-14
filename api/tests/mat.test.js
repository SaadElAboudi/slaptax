const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Chess}=require('chess.js');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty,recordParty}=require('../games/partyGames');
const {validPuzzle,fromLichess,positionKey}=require('../games/matValidation');
const {createMatPool}=require('../infrastructure/matPool');
const {importMat,atomicWrite}=require('../scripts/importMatPuzzles');
const seed=require('../data/mat-seed.json');
function game(players=['a','b'],puzzle=seed.puzzles[0]){const g=createParty('mat',players);g.pickMatPuzzle=()=>puzzle;beginParty(g,1000);return g;}
function move(g,id,uci,now=2000){return actParty(g,id,{action:'move',move:uci,turn:g.turn},now);}
function wrong(g){const c=new Chess(g.mat.puzzle.fen);return c.moves({verbose:true}).find(m=>!m.san.endsWith('#')).lan;}

test('MAT seed contains 2000 distinct validated checkmates and only supported ratings',()=>{
    assert.equal(seed.puzzles.length,2000);assert.equal(new Set(seed.puzzles.map(p=>p.key)).size,2000);
    for(const p of seed.puzzles){assert.equal(validPuzzle(p),true);assert.ok(p.rating>=600&&p.rating<=1500);}
});
test('MAT Lichess adapter applies the opponent move before displaying the puzzle',()=>{
    const row={PuzzleId:'test',FEN:'7k/p7/5KQ1/8/8/8/8/8 b - - 0 1',Moves:'a7a6 g6g7',Themes:'mate mateIn1',Rating:'900',Popularity:'95',NbPlays:'1000',RatingDeviation:'50'};
    const p=fromLichess(row);assert.ok(p);assert.equal(new Chess(p.fen).turn(),'w');assert.equal(p.solution,'g6g7');assert.ok(validPuzzle(p));
    for(const patch of [{Moves:'h8h7 g6a6'},{Rating:'no'},{Popularity:undefined},{PuzzleId:''},{FEN:'invalid'},{Themes:'mateIn2'}])assert.equal(fromLichess({...row,...patch}),null);
});
test('MAT keeps choices, solutions, timings and correctness private until both have finished',()=>{
    const g=game();assert.equal(g.deadline,21000);assert.ok(move(g,'a',g.mat.puzzle.solution));assert.equal(g.phase,'solve');
    assert.equal(publicParty(g,'a',2001).mat.selected,g.mat.puzzle.solution);
    for(const id of ['b','spectator']){const p=publicParty(g,id,2001);assert.equal(p.mat.selected,undefined);assert.equal(p.mat.solution,undefined);assert.equal(p.mat.puzzleId,undefined);assert.equal(p.mat.results,undefined);assert.deepEqual(p.scores,{a:0,b:0});}
    assert.ok(move(g,'b',wrong(g),3000));assert.equal(g.phase,'reveal');assert.equal(publicParty(g,'b',3001).mat.results.a.mate,true);
    tickParty(g,g.deadline);assert.equal(g.winnerId,'a');assert.equal(g.phase,'done');
});
test('MAT illegal, stale, duplicate and outsider moves do not consume an attempt',()=>{
    const g=game();for(const value of [null,undefined,1,'a1a9','INVALID','a1a1'])assert.equal(move(g,'a',value),false);
    assert.equal(move(g,'outsider',g.mat.puzzle.solution),false);
    assert.equal(actParty(g,'a',{action:'move',turn:g.turn-1,move:g.mat.puzzle.solution},2000),false);
    assert.deepEqual(g.responses,{});assert.ok(move(g,'a',wrong(g)));assert.equal(move(g,'a',g.mat.puzzle.solution),false);
});
test('MAT accepts every legal checkmate, including an alternate solution',()=>{
    const fen='6r1/1pqkb3/p3pp2/3N1p2/3P3P/4P2P/PPR1QPr1/2R4K b - - 0 26';
    const mates=new Chess(fen).moves({verbose:true}).filter(m=>m.san.endsWith('#')).map(m=>m.lan);assert.ok(mates.length>1);
    for(const solution of mates){const g=game(['a'],{id:'alternate',fen,key:positionKey(fen),solution:mates[0],rating:900});assert.ok(move(g,'a',solution));assert.equal(g.mat.results.a.mate,true);}
});
test('MAT promotions remain explicit and validate a mating promotion',()=>{
    const puzzle=seed.puzzles.find(p=>p.solution.length===5),g=game(['a'],puzzle),base=puzzle.solution.slice(0,4);
    assert.equal(move(g,'a',base),false);assert.equal(g.mat.legal.filter(m=>m.startsWith(base)).length,4);
    assert.ok(move(g,'a',puzzle.solution));assert.equal(g.mat.results.a.mate,true);
});
test('MAT a 250 ms gap is a draw; 251 ms awards the faster solver',()=>{
    for(const gap of [0,249,250,251]){const g=game();move(g,'a',g.mat.puzzle.solution,2000);move(g,'b',g.mat.puzzle.solution,2000+gap);tickParty(g,g.deadline);assert.equal(g.phase,gap<=250?'draw':'done');if(gap>250)assert.equal(g.winnerId,'a');}
});
test('MAT rejects deadline submissions, preserves an earlier mate and times out missing responses',()=>{
    const g=game();move(g,'a',g.mat.puzzle.solution,20999);assert.equal(move(g,'b',g.mat.puzzle.solution,21000),false);
    assert.equal(g.mat.results.b.expired,true);assert.equal(g.scores.a,1);tickParty(g,g.deadline);assert.equal(g.winnerId,'a');
    const h=game();tickParty(h,21000);tickParty(h,h.deadline);assert.equal(h.phase,'draw');
});
test('MAT mutual retry and unfinished reconnect select fresh positions and reject old turns',()=>{
    const g=game();let index=0;g.pickMatPuzzle=()=>seed.puzzles[++index];
    tickParty(g,g.deadline);tickParty(g,g.deadline);const old=g.mat.puzzle.key;
    assert.ok(actParty(g,'a',{action:'retry',turn:g.turn},25000));assert.equal(g.phase,'draw');
    assert.ok(actParty(g,'b',{action:'retry',turn:g.turn},25001));assert.equal(g.phase,'solve');assert.notEqual(g.mat.puzzle.key,old);
    const current=g.mat.puzzle.key,turn=g.turn;move(g,'a',g.mat.puzzle.solution,26000);pauseParty(g,10000,36000);
    assert.notEqual(g.mat.puzzle.key,current);assert.deepEqual(g.responses,{});assert.equal(g.deadline,56000);
    assert.equal(actParty(g,'a',{action:'move',turn,move:g.mat.puzzle.solution},36001),false);
});
test('MAT snapshots do not mutate game state and solo has no bot',()=>{
    const g=game(['a']);assert.deepEqual(g.responses,{});move(g,'a',g.mat.puzzle.solution);recordParty(g,2000,true);
    const p=publicParty(g,'a',2000);p.mat.board[0].square='z9';p.mat.results.a.mate=false;
    assert.notEqual(g.mat.board[0].square,'z9');assert.equal(g.mat.results.a.mate,true);g.mat.results.a.ms=0;assert.equal(g.replay[0].state.mat.results.a.ms,1000);
});
function fixture(t,puzzles=seed.puzzles){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mat-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const seedPath=path.join(dir,'seed.json'),cachePath=path.join(dir,'cache.json');atomicWrite(seedPath,{...seed,puzzles});return {seedPath,cachePath};}
test('MAT anti-repeat persists both player histories across manager restarts',t=>{
    const paths=fixture(t);let db={users:[{id:'a',matRecent:[]},{id:'b',matRecent:[]}],tournaments:[]};const store={read:()=>structuredClone(db),write:value=>{db=value;}};
    const seen=new Set();for(let i=0;i<12;i++){const pool=createMatPool(store,paths),p=pool.pick(i%2?['a','b']:['b']);assert.ok(!seen.has(p.key));seen.add(p.key);}
    assert.equal(db.users[1].matRecent.length,12);assert.equal(db.users[0].matRecent.length,6);
});
test('MAT tournament positions remain in the rating band and exclude earlier rounds',t=>{
    const paths=fixture(t);const db={users:[{id:'a'},{id:'b'}],tournaments:[{id:'t'}]},pool=createMatPool({read:()=>db,write:()=>{}},paths);
    const seen=new Set();for(let i=0;i<10;i++){const p=pool.pick(['a','b'],'t');assert.ok(p.rating>=800&&p.rating<=1200);assert.ok(!seen.has(p.key));seen.add(p.key);}
    assert.equal(db.tournaments[0].matRecent.length,10);
});
test('MAT exhausted pools terminate and invalid caches retain playable seed content',t=>{
    const paths=fixture(t,seed.puzzles.slice(0,2));atomicWrite(paths.cachePath,{version:99,puzzles:[]});
    const pool=createMatPool(null,paths);const a=pool.pick(['a']),b=pool.pick(['a']);assert.notEqual(a.key,b.key);assert.equal(pool.pick(['a']).key,a.key);
    assert.equal(pool.health().warning,'invalid-cache-retaining-last-good');assert.equal(pool.health().source,'seed');
});
test('MAT valid local cache replaces seed and failed downloads never overwrite it',async t=>{
    const paths=fixture(t);atomicWrite(paths.cachePath,{...seed,puzzles:seed.puzzles.slice(0,3)});const before=fs.readFileSync(paths.cachePath,'utf8');
    assert.equal(createMatPool(null,paths).health().count,3);
    t.mock.method(global,'fetch',async()=>new Response('down',{status:503}));
    await assert.rejects(importMat(paths.cachePath),/HTTP 503/);assert.equal(fs.readFileSync(paths.cachePath,'utf8'),before);
});
test('MAT scheduled renewal runs in a bounded worker, reports failure and retries without replacing content',t=>{
    const {EventEmitter}=require('node:events'),{PassThrough}=require('node:stream'),childProcess=require('node:child_process');
    const paths=fixture(t),workers=[];
    t.mock.method(childProcess,'spawn',(_command,args,options)=>{
        assert.ok(args.includes('--max-old-space-size=256'));assert.equal(options.timeout,330000);
        const worker=new EventEmitter();worker.stdout=new PassThrough();worker.stderr=new PassThrough();worker.kill=()=>worker.emit('close',null);workers.push(worker);return worker;
    });
    delete require.cache[require.resolve('../infrastructure/matRefresh')];
    const {startMatRefresh}=require('../infrastructure/matRefresh');
    t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:Date.parse('2026-09-14T12:00:00Z')});
    const stop=startMatRefresh({health:()=>({generatedAt:'2026-09-01T00:00:00Z'})},{...paths,enabled:true});t.after(stop);
    t.mock.timers.tick(10000);assert.equal(workers.length,1);assert.equal(fs.existsSync(`${paths.cachePath}.lock`),true);
    workers[0].emit('close',1);assert.equal(JSON.parse(fs.readFileSync(`${paths.cachePath}.status.json`)).state,'failed');assert.equal(fs.existsSync(paths.cachePath),false);
    t.mock.timers.tick(15*60000);assert.equal(workers.length,1);
    t.mock.timers.tick(6*3600000);assert.equal(workers.length,2);stop();assert.equal(fs.existsSync(`${paths.cachePath}.lock`),false);
});
test('MAT hot refresh keeps the old pool usable until background verification finishes',async t=>{
    const paths=fixture(t,seed.puzzles.slice(0,2));let now=Date.now();t.mock.method(Date,'now',()=>now);
    const pool=createMatPool(null,paths);assert.equal(pool.health().count,2);
    atomicWrite(paths.cachePath,{...seed,puzzles:seed.puzzles.slice(0,3)});now+=30001;
    assert.equal(pool.health().count,2);assert.ok(pool.pick(['a']));
    for(let i=0;i<100&&pool.health().count!==3;i++)await new Promise(resolve=>setTimeout(resolve,5));
    assert.equal(pool.health().count,3);
    atomicWrite(paths.cachePath,{version:0});now+=30001;pool.health();
    for(let i=0;i<100&&!pool.health().warning;i++)await new Promise(resolve=>setTimeout(resolve,5));
    assert.equal(pool.health().warning,'invalid-cache-retaining-last-good');assert.equal(pool.health().count,3);
});
