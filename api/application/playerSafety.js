const isSuitableText=value=>!/(?:https?:\/\/|\b(?:connard|salope|encul[eé]|nazi|nigger|faggot)\b)/i.test(String(value||''));
function blockedPair(db,a,b){const users=db.users||[];return users.find(u=>u.id===a)?.suspended||users.find(u=>u.id===b)?.suspended||users.find(u=>u.id===a)?.blockedUsers?.includes(b)||users.find(u=>u.id===b)?.blockedUsers?.includes(a)||false;}
function createPlayerSafety(store){return {
 playerSafety(body){const db=store.read();if(db.clientSessions?.[body.clientId]!==body.userId)return {error:'Session unavailable',code:403};const user=db.users.find(u=>u.id===body.userId);if(!user)return {error:'Profile unavailable',code:403};
  if(body.action==='list')return {ok:true,blockedUsers:user.blockedUsers||[]};
  if(!db.users.some(u=>u.id===body.targetId)||body.targetId===body.userId)return {error:'Unknown player',code:400};
  if(body.action==='block'){user.blockedUsers=[...new Set([...(user.blockedUsers||[]),body.targetId])].slice(-500);}
  else if(body.action==='unblock')user.blockedUsers=(user.blockedUsers||[]).filter(id=>id!==body.targetId);
  else if(body.action==='report'){
   if(!['name','harassment','cheating','other'].includes(body.reason))return {error:'Choose a reason',code:400};
   db.playerReports||=[];if(db.playerReports.filter(r=>r.reporterId===user.id&&r.at>Date.now()-86400000).length>=5)return {error:'Daily report limit reached',code:429};
   if(db.playerReports.length>=5000)return {error:'Reporting unavailable. Contact gignoski@gmail.com',code:503};
   db.playerReports.push({id:require('node:crypto').randomUUID(),reporterId:user.id,targetId:body.targetId,reason:body.reason,at:Date.now(),status:'pending'});
  }else return {error:'Unknown action',code:400};
  store.write(db);return {ok:true,blockedUsers:user.blockedUsers||[]};
 }
};}
module.exports={createPlayerSafety,blockedPair,isSuitableText};
