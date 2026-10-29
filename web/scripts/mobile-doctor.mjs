import {verifyMobileParity} from './mobile-parity.mjs';
import {fileURLToPath} from 'node:url';
import {loadEnv} from 'vite';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url)),env={...loadEnv('mobile',root,''),...process.env},release=process.argv.includes('--release');
let failed=false;function check(name,ok,detail=''){console.log(`${ok?'PASS':'BLOCKED'} ${name}${detail?`: ${detail}`:''}`);if(!ok)failed=true;}
check('Node 22+',Number(process.versions.node.split('.')[0])>=22,process.versions.node);
for(const platform of ['ios/App/App.xcodeproj/project.pbxproj','android/gradlew'])check(platform,existsSync(`${root}/${platform}`));
for(const key of ['VITE_API_BASE_URL','VITE_PUBLIC_SITE_URL']){let valid=false;try{const u=new URL(env[key]);valid=u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash&&!/localhost|127\.0\.0\.1/.test(u.hostname);}catch{}check(key,valid);}
try{const xcode=execFileSync('xcodebuild',['-version'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});check('Xcode 26+',Number(xcode.match(/Xcode (\d+)/)?.[1])>=26,xcode.trim());}catch{check('Xcode 26+',false,'Full Xcode is not installed/selected. Command Line Tools alone cannot archive an iOS app.');}
let jdk=env.JAVA_HOME;
if(!jdk&&existsSync(`${process.env.HOME}/Library/Caches/slaptax-native/jdk/Contents/Home/bin/java`))jdk=`${process.env.HOME}/Library/Caches/slaptax-native/jdk/Contents/Home`;
if(!jdk)try{jdk=execFileSync('/usr/libexec/java_home',['-v','21'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}catch{}
let javaOk=false;try{const {spawnSync}=await import('node:child_process');const result=spawnSync(jdk?`${jdk}/bin/java`:'java',['-version'],{encoding:'utf8'});javaOk=/version "21[."]/.test(result.stderr);}catch{}
check('JDK 21',javaOk,jdk||'Install Android Studio/JDK 21 or set JAVA_HOME.');
const sdk=env.ANDROID_HOME||env.ANDROID_SDK_ROOT||(existsSync(`${process.env.HOME}/Library/Caches/slaptax-native/android-sdk`)?`${process.env.HOME}/Library/Caches/slaptax-native/android-sdk`:`${process.env.HOME}/Library/Android/sdk`);
check('Android SDK API 36',existsSync(`${sdk}/platforms/android-36/android.jar`),sdk);
if(release){
 try{verifyMobileParity(root);check('Mobile source and bundle parity',true);}catch(e){check('Mobile source and bundle parity',false,e.message);}
 for(const path of ['ios/App/App/public/mobile-build.json','android/app/src/main/assets/public/mobile-build.json']){try{const manifest=JSON.parse(readFileSync(`${root}/${path}`,'utf8'));const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();check(`Current bundled assets: ${path}`,manifest.revision===revision&&manifest.apiOrigin===env.VITE_API_BASE_URL&&manifest.publicOrigin===env.VITE_PUBLIC_SITE_URL);}catch{check(`Current bundled assets: ${path}`,false);}}
 const config=readFileSync(`${root}/capacitor.config.ts`,'utf8');check('Bundled local app, no remote server.url',!config.includes('url:'));
 let clean=false;try{clean=!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim();}catch{}check('Committed release checkout',clean);
 try{const response=await fetch(`${env.VITE_API_BASE_URL}/api/health`,{signal:AbortSignal.timeout(10000)}),health=await response.json();check('Deployed store-mode backend',response.ok&&health.distribution==='store'&&health.features?.accountDeletion===true&&health.features?.tokenLedger===true&&health.tokenEconomyVersion===1);const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();check('Backend matches this release',health.release===revision);}catch(e){check('Backend reachable',false,e.message);}
 for(const path of ['/privacy','support','delete-account'])try{const r=await fetch(new URL(path,env.VITE_PUBLIC_SITE_URL),{signal:AbortSignal.timeout(10000)});check(`Public ${path}`,r.ok);}catch(e){check(`Public ${path}`,false,e.message);}
 console.log('Also required: real publisher identity, hosting retention/privacy review, store accounts, age/data questionnaires, device tests and signing. No store upload is performed.');
}
process.exitCode=failed?1:0;
