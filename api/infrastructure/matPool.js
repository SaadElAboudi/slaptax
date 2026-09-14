const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {randomInt}=require('node:crypto');
const {validPuzzle}=require('../games/matValidation');
const CACHE_PATH=process.env.MAT_POOL_PATH||path.join(os.tmpdir(),'slaptax-mat-puzzles.json');
const SEED_PATH=path.join(__dirname,'../data/mat-seed.json');
const checked=new Map();
function readPool(file) {
    const stat=fs.statSync(file),stamp=stat.mtimeMs;
    if(stat.size>5*1024*1024)throw Error('Oversized MAT catalogue');
    if(checked.get(file)?.stamp===stamp)return checked.get(file).data;
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    if(data.version!==1||!Array.isArray(data.puzzles)||data.puzzles.length<1||data.puzzles.length>5000
        ||!Number.isFinite(Date.parse(data.generatedAt))||!data.puzzles.every(validPuzzle)
        ||new Set(data.puzzles.map(p=>p.key)).size!==data.puzzles.length)throw Error('Invalid MAT catalogue');
    checked.set(file,{stamp,data});return data;
}
async function readPoolInBackground(file) {
    const stat=await fs.promises.stat(file),stamp=stat.mtimeMs;
    if(stat.size>5*1024*1024)throw Error('Oversized MAT catalogue');
    if(checked.get(file)?.stamp===stamp)return checked.get(file).data;
    const data=JSON.parse(await fs.promises.readFile(file,'utf8'));
    if(data.version!==1||!Array.isArray(data.puzzles)||data.puzzles.length<1||data.puzzles.length>5000||!Number.isFinite(Date.parse(data.generatedAt)))throw Error('Invalid MAT catalogue');
    const keys=new Set();
    for(let i=0;i<data.puzzles.length;i++){
        const p=data.puzzles[i];if(!validPuzzle(p)||keys.has(p.key))throw Error('Invalid MAT catalogue');keys.add(p.key);
        // Yield during verification so a catalogue swap cannot freeze active clocks.
        if(i%10===9)await new Promise(resolve=>setImmediate(resolve));
    }
    checked.set(file,{stamp,data});return data;
}
function createMatPool(store,{cachePath=CACHE_PATH,seedPath=SEED_PATH}={}) {
    let current=readPool(seedPath),activeSource='seed',error=null,lastCheck=Date.now(),refreshing=false;
    try{if(fs.existsSync(cachePath)){current=readPool(cachePath);activeSource='cache';}}catch{error='invalid-cache-retaining-last-good';}
    const localSeen=new Map();
    function refresh() {
        if(refreshing||Date.now()-lastCheck<30000)return;lastCheck=Date.now();refreshing=true;
        void readPoolInBackground(cachePath).then(data=>{current=data;activeSource='cache';error=null;})
            .catch(e=>{error=e.code==='ENOENT'?null:'invalid-cache-retaining-last-good';}).finally(()=>{refreshing=false;});
    }
    function pick(players=[],tournamentId=null) {
        refresh();const db=store?.read(),users=players.map(id=>db?.users.find(u=>u.id===id)).filter(Boolean);
        const tournament=tournamentId?db?.tournaments?.find(t=>t.id===tournamentId):null;
        const histories=[...users.map(u=>u.matRecent||[]),...players.map(id=>localSeen.get(id)||[]),tournament?.matRecent||[]];
        const excluded=new Set(histories.flat());
        const band=tournament?current.puzzles.filter(p=>Math.abs(p.rating-1000)<=200):current.puzzles;
        const available=band.length?band:current.puzzles;
        let candidates=available.filter(p=>!excluded.has(p.key));
        if(!candidates.length){
            // Exhaustion uses the least recently seen position, not an unbounded retry loop.
            const age=p=>Math.max(-1,...histories.map(h=>h.lastIndexOf(p.key)));
            const oldest=Math.min(...available.map(age));candidates=available.filter(p=>age(p)===oldest);
        }
        const chosen=candidates[randomInt(candidates.length)];
        const remember=h=>[...(h||[]).filter(k=>k!==chosen.key),chosen.key].slice(-200);
        for(const user of users)user.matRecent=remember(user.matRecent);
        for(const id of players)localSeen.set(id,remember(localSeen.get(id)));
        if(localSeen.size>10000)localSeen.delete(localSeen.keys().next().value);
        if(tournament)tournament.matRecent=remember(tournament.matRecent);
        if(db)store.write(db);
        return structuredClone(chosen);
    }
    function health(){refresh();let refreshState=null;try{refreshState=JSON.parse(fs.readFileSync(`${cachePath}.status.json`,'utf8'));}catch{}
        return {count:current.puzzles.length,source:activeSource,generatedAt:current.generatedAt,stale:Date.now()-Date.parse(current.generatedAt)>14*86400000,warning:error,refresh:refreshState};}
    return {pick,health};
}
let fallback;
function defaultPuzzle(players){fallback||=createMatPool(null);return fallback.pick(players);}
module.exports={createMatPool,defaultPuzzle,CACHE_PATH};
