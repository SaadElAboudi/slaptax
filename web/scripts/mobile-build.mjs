import {sourceDigest,treeDigest} from './mobile-provenance.mjs';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {loadEnv,build} from 'vite';
import {execFileSync} from 'node:child_process';
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Mobile builds require Node 22+');
const root=fileURLToPath(new URL('..',import.meta.url));
const env={...loadEnv('mobile',root,''),...process.env};
for(const key of ['VITE_API_BASE_URL','VITE_PUBLIC_SITE_URL']){
 let url;try{url=new URL(env[key]);}catch{throw new Error(`${key} is required; copy .env.mobile.example to .env.mobile.local`);}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||/^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(url.hostname))throw new Error(`${key} must be a public HTTPS origin without a path or credentials`);
 process.env[key]=url.origin;
}
process.env.VITE_NATIVE_BUILD='1';
process.env.VITE_BUILD_REVISION=env.VITE_BUILD_REVISION||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b'],{cwd:root,stdio:'inherit'});
const sourceHash=sourceDigest(root);
await build({root,mode:'mobile',build:{outDir:'dist-mobile'}});
if(sourceDigest(root)!==sourceHash)throw new Error('Sources changed during build. Run mobile:sync again.');
await writeFile(`${root}/dist-mobile/mobile-build.json`,JSON.stringify({sourceHash,bundleHash:treeDigest(`${root}/dist-mobile`,['mobile-build.json']),appId:'com.gignoski.slaptax',version:'1.0.0',revision:process.env.VITE_BUILD_REVISION,dirty:Boolean(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()),apiOrigin:process.env.VITE_API_BASE_URL,publicOrigin:process.env.VITE_PUBLIC_SITE_URL,builtAt:new Date().toISOString()},null,2));
console.log('Mobile assets ready in dist-mobile. Native projects require cap sync; signing is separate.');
