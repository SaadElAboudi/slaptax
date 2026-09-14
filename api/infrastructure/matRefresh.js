const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {CACHE_PATH}=require('./matPool');
const {atomicWrite}=require('../scripts/importMatPuzzles');

function startMatRefresh(pool,{cachePath=CACHE_PATH,enabled=process.env.MAT_AUTO_REFRESH!=='0'}={}) {
    if(!enabled)return ()=>{};
    let worker=null,nextTry=0,ownsLock=false,closed=false;
    const lock=`${cachePath}.lock`;
    function status(state){try{atomicWrite(`${cachePath}.status.json`,{state,at:new Date().toISOString()});}catch{process.stderr.write('MAT refresh status could not be persisted\n');}}
    function release(){if(ownsLock){try{fs.unlinkSync(lock);}catch{}ownsLock=false;}}
    function check(){
        if(closed||worker||Date.now()<nextTry||Date.now()-Date.parse(pool.health().generatedAt)<7*86400000)return;
        nextTry=Date.now()+6*3600000;
        try{fs.mkdirSync(path.dirname(lock),{recursive:true});if(fs.existsSync(lock)&&Date.now()-fs.statSync(lock).mtimeMs>10*60000)fs.unlinkSync(lock);fs.closeSync(fs.openSync(lock,'wx'));ownsLock=true;}catch{return;}
        status('running');
        worker=spawn(process.execPath,['--max-old-space-size=256',path.join(__dirname,'../scripts/importMatPuzzles.js'),cachePath],{stdio:['ignore','pipe','pipe'],timeout:330000});
        worker.stdout.on('data',chunk=>process.stdout.write(chunk));worker.stderr.on('data',chunk=>process.stderr.write(chunk));
        worker.on('error',()=>{});
        worker.on('close',code=>{worker=null;release();if(closed)return;
            status(code===0?'ok':'failed');
            if(code!==0)process.stderr.write(JSON.stringify({event:'mat.refresh.alert',message:'Refresh failed; previous catalogue remains active'})+'\n');
        });
    }
    const initial=setTimeout(check,10000),timer=setInterval(check,15*60000);initial.unref();timer.unref();
    return ()=>{closed=true;clearTimeout(initial);clearInterval(timer);if(worker)worker.kill();else release();};
}
module.exports={startMatRefresh};
