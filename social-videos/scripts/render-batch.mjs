import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {root} from './prepare.mjs';
import path from 'node:path';
const ids=process.argv.slice(2);
if(!ids.length)ids.push('02-braquage-butins','01-decoupe-37','07-encore-un','19-bombpass-pression');
const manifest={startedAt:new Date().toISOString(),status:'rendering',silent:true,published:false,completed:[]};
await mkdir(path.join(root,'exports'),{recursive:true});
for(const id of ids){
 console.log(`START ${id}`);
 const result=spawnSync(process.execPath,['scripts/render.mjs',id],{cwd:root,stdio:'inherit'});
 if(result.status!==0){manifest.status='failed';manifest.failed=id;await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));throw Error(`Render failed: ${id}`);}
 manifest.completed.push({id,file:`${id}/draft.mp4`,completedAt:new Date().toISOString()});
 await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));
}
manifest.status='complete';await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));
console.log('BATCH COMPLETE');
