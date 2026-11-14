import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Never let a local .env or shell setting send test sessions to production.
const root=fileURLToPath(new URL('..',import.meta.url));
const env={...process.env,VITE_API_BASE_URL:'',VITE_PUBLIC_SITE_URL:'',APP_DISTRIBUTION:'store'};
if(!process.env.npm_execpath)throw new Error('Run npm run qa:release from the web project.');
for(const args of [[process.env.npm_execpath,'run','build'],['node_modules/@playwright/test/cli.js','test','--config=playwright.release.config.ts',...process.argv.slice(2)]]){
 const result=spawnSync(process.execPath,args,{cwd:root,env,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
