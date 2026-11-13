import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {root,prepare} from './prepare.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const ids=process.argv.slice(2);
if(!ids.length)ids.push(...JSON.parse(await readFile(path.join(root,'campaign.json'),'utf8')).featured);
await prepare();
const manifest={startedAt:new Date().toISOString(),status:'rendering',silent:true,published:false,completed:[]};
await mkdir(path.join(root,'exports'),{recursive:true});
await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));
for(const id of ids){
 console.log(`START ${id}`);
 const result=spawnSync(process.execPath,['scripts/render.mjs',id,'--prepared'],{cwd:root,stdio:'inherit'});
 if(result.status!==0){manifest.status='failed';manifest.failed=id;await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));throw Error(`Render failed: ${id}`);}
 manifest.completed.push({id,file:`${id}/draft.mp4`,completedAt:new Date().toISOString()});
 await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));
}
manifest.status='complete';await writeFile(path.join(root,'exports/batch.json'),JSON.stringify(manifest,null,2));
console.log('BATCH COMPLETE');
