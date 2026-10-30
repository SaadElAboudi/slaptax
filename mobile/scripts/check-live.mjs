import {execFileSync} from 'node:child_process';
const origin=process.env.VITE_API_BASE_URL||'https://slaptax-r9na.onrender.com';
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const response=await fetch(new URL('/api/health',origin),{signal:AbortSignal.timeout(30000)});
const health=await response.json();
if(!response.ok||!health.ok||health.release!==revision||health.distribution!=='store'||!health.features?.accountDeletion||!health.features?.tokenLedger||health.tokenEconomyVersion!==1)throw Error('Backend is not ready for this exact store candidate revision. Deploy and verify before retrying.');
for(const path of ['/privacy','support','delete-account','terms']){
 const r=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(30000)});
 if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error(`Public page unavailable: ${path}`);
}
const protectedResponse=await fetch(new URL('/api/tokens',origin),{signal:AbortSignal.timeout(30000)});
if(protectedResponse.status!==401)throw Error('Token ledger must reject anonymous access');
console.log(`PASS live store backend and public pages: ${revision}`);
