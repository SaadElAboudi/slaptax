import {spawnSync} from 'node:child_process';
import {mkdir,readdir,access} from 'node:fs/promises';
import {homedir,release} from 'node:os';
import {encodeLegacy} from './legacy-export.mjs';
import path from 'node:path';
import {root,prepare,loadVideos} from './prepare.mjs';
const id=process.argv[2];
const videos=await loadVideos();
if(!videos.some(v=>v.id===id)) throw Error('Usage: npm run render -- 01-decoupe-37 [--publish]');
const v=videos.find(v=>v.id===id);
if(process.argv.includes('--publish') && (!v.footage || v.status!=='approved')) throw Error('Publication requires real footage and status=approved after editorial/audio review.');
await prepare();
await mkdir(path.join(root,'exports',id),{recursive:true});
// Prefer an explicitly configured browser, then an existing Playwright cache.
// Avoid an unnecessary Chromium download on machines already used for game QA.
let browser=process.env.REMOTION_BROWSER_EXECUTABLE;
if(!browser&&process.platform==='darwin'){
  const cache=path.join(homedir(),'Library/Caches/ms-playwright');
  for(const version of (await readdir(cache).catch(()=>[])).filter(n=>n.startsWith('chromium_headless_shell-')).sort().reverse()){
    for(const architecture of ['x64','arm64']){
      const candidate=path.join(cache,version,`chrome-headless-shell-mac-${architecture}`,'chrome-headless-shell');
      if(await access(candidate).then(()=>true,()=>false)){browser=candidate;break;}
    }
    if(browser)break;
  }
}
const browserArgs=browser?[`--browser-executable=${browser}`]:[];
const output=path.join(root,'exports',id,`${process.argv.includes('--publish')?'final':'draft'}.mp4`);
const legacy=process.platform==='darwin' && Number(release().split('.')[0])<=21;
const frames=path.join(root,'exports',id,'frames');
const args=legacy?['render','src/index.jsx',id,frames,'--sequence','--muted','--image-format=jpeg','--concurrency=2',...browserArgs]:['render','src/index.jsx',id,output,'--codec=h264','--pixel-format=yuv420p','--concurrency=2',...browserArgs];
const result=spawnSync(path.join(root,'node_modules/.bin/remotion'),args,{cwd:root,stdio:'inherit'});
if(result.error) throw result.error;
if(result.status===0&&legacy)await encodeLegacy(root,v,frames,output);
process.exitCode=result.status??1;
