const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {Transform,Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {randomInt,randomUUID}=require('node:crypto');
const {parse}=require('csv-parse');
const {Decompress}=require('fzstd');
const {fromLichess}=require('../games/matValidation');
const SOURCE='https://database.lichess.org/lichess_db_puzzle.csv.zst';
const DEFAULT_PATH=process.env.MAT_POOL_PATH||path.join(os.tmpdir(),'slaptax-mat-puzzles.json');

function atomicWrite(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${randomUUID()}.tmp`;try{fs.writeFileSync(tmp,JSON.stringify(data));fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}}
async function importMat(output=DEFAULT_PATH,{maxRows=200000,limit=2000,minimum=200,source=SOURCE}={}) {
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),300000);
    let bytes=0,rows=0,eligible=0,stopped=false;
    const selected=[],seen=new Set();
    try {
        const response=await fetch(source,{signal:controller.signal});if(!response.ok)throw Error(`Puzzle download HTTP ${response.status}`);
        const decoder=new Decompress(chunk=>unzip.push(Buffer.from(chunk)));
        const unzip=new Transform({transform(chunk,_,cb){try{bytes+=chunk.length;if(bytes>128*1024*1024)throw Error('Compressed download limit exceeded');decoder.push(chunk);cb();}catch(e){cb(e);}},flush(cb){try{decoder.push(new Uint8Array(),true);cb();}catch(e){cb(e);}}});
        const parser=parse({columns:true,skip_empty_lines:true,max_record_size:8192});
        const running=pipeline(Readable.fromWeb(response.body),unzip,parser).catch(error=>{if(!stopped)throw error;});
        // Attach immediately: a download failure must not become an unhandled rejection.
        running.catch(()=>{});
        try {for await(const row of parser){
            rows++;const p=fromLichess(row);
            if(p&&!seen.has(p.key)){seen.add(p.key);eligible++;if(selected.length<limit)selected.push(p);else{const i=randomInt(eligible);if(i<limit)selected[i]=p;}}
            if(rows>=maxRows){stopped=true;controller.abort();break;}
        }}finally{await running;}
        if(selected.length<minimum)throw Error(`Insufficient validated puzzles: ${selected.length}/${minimum}`);
        const data={version:1,source:SOURCE,license:'CC0-1.0',generatedAt:new Date().toISOString(),rows,eligible,puzzles:selected};
        atomicWrite(output,data);return {count:selected.length,rows,eligible,output};
    }finally{clearTimeout(timeout);controller.abort();}
}
if(require.main===module) importMat(process.argv[2]||DEFAULT_PATH).then(result=>process.stdout.write(JSON.stringify({event:'mat.import.ok',...result})+'\n')).catch(error=>{process.stderr.write(JSON.stringify({event:'mat.import.failed',error:error.message})+'\n');process.exitCode=1;});
module.exports={importMat,atomicWrite,DEFAULT_PATH};
