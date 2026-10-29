const {isSuitableText}=require('../application/playerSafety');
const {parseBody}=require('./io');
const disabled=new Set(['/api/reset','/api/users','/api/session/select-user','/api/profile','/api/wallet/topup','/api/duel/play','/api/duel/reflex','/api/tournament/simulate','/api/tournaments/live','/api/progression/challenges/sync']);
async function distributionAccess(req,url,service){
 const path=url.pathname;
 if(req.method==='OPTIONS'||path==='/api/health'||path==='/api/presence')return null;
 if(req.method==='GET'&&(/^\/api\/invites\/[^/]+$/.test(path)||/^\/api\/link-challenges\/[^/]+$/.test(path)))return null;
 if(req.method==='POST'&&path==='/api/session/join'){
  const body=await parseBody(req);if(!isSuitableText(body.playerName))return {error:'Choisis un pseudonyme respectueux, sans lien.',code:400};if(typeof body.clientId!=='string'||body.clientId.length<16)return {error:'A secure installation identity is required',code:400};return null;
 }
 if((req.method==='POST'&&disabled.has(path))||/^\/api\/duels\/[^/]+\/play$/.test(path)||/^\/api\/tournaments\/[^/]+\/rounds$/.test(path))return {error:'Unavailable in the store distribution',code:403};
 const userId=req.headers['x-slaptax-user'],clientId=req.headers['x-slaptax-client'];
 if(!service.authenticateSession(userId,clientId,path==='/api/account/delete'))return {error:'Session unavailable',code:401};
 const queryUser=url.searchParams.get('userId');if(queryUser&&queryUser!==userId)return {error:'Another profile cannot be accessed',code:403};
 const queryClient=url.searchParams.get('clientId');if(queryClient&&queryClient!==clientId)return {error:'Session mismatch',code:403};
 url.searchParams.set('userId',userId);url.searchParams.set('clientId',clientId);
 if(req.method==='POST'){
  const body=await parseBody(req);
  if(!isSuitableText(body.message)||!isSuitableText(body.name))return {error:'Choisis un message respectueux, sans lien.',code:400};
  for(const key of ['userId','challengerId','hostId'])if(body[key]!==undefined&&body[key]!==userId)return {error:'Another profile cannot be modified',code:403};
  if(body.userId===undefined)body.userId=userId;
  if(body.clientId!==undefined&&body.clientId!==clientId)return {error:'Session mismatch',code:403};
 }
 return null;
}
module.exports={distributionAccess};
