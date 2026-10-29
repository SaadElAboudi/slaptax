const tokens=require('../domain/tokens');
const {randomUUID}=require('node:crypto');
const contains=(value,id)=>JSON.stringify(value||null).includes(id);
function createAccountDeletion(store){return {
 authenticateSession(userId,clientId,allowSuspended=false){const db=store.read();return typeof userId==='string'&&typeof clientId==='string'&&clientId.length>=16&&db.clientSessions?.[clientId]===userId&&db.users.some(u=>u.id===userId&&(allowSuspended||!u.suspended));},
 async deleteAccount(body){
  const {userId,clientId,confirm}=body||{},db=structuredClone(store.read());
  if(typeof userId!=='string'||typeof clientId!=='string'||!clientId||db.clientSessions?.[clientId]!==userId)return {error:'Session unavailable',code:403};
  const user=db.users.find(u=>u.id===userId);if(!user)return {error:'Session unavailable',code:403};
  if(confirm!==true)return {error:'Confirm account deletion',code:400};
  const affectedTournaments=new Set((db.tournaments||[]).filter(t=>contains(t,userId)).map(t=>t.id));
  const removedDuels=(db.duels||[]).filter(d=>contains(d,userId)||affectedTournaments.has(d.tournamentId));
  // Started duels escrow fictional credits. Refund surviving players once;
  // removing the duel then makes a second deletion unable to repeat the refund.
  for(const duel of removedDuels)if(duel.status==='playing')tokens.refund(db,duel,'account_deleted',userId);
  const removedIds=new Set(removedDuels.map(d=>d.id));
  db.duels=(db.duels||[]).filter(d=>!removedIds.has(d.id));
  db.tournaments=(db.tournaments||[]).filter(t=>!affectedTournaments.has(t.id));
  db.challenges=(db.challenges||[]).filter(c=>!contains(c,userId)&&!removedIds.has(c.duelId));
  db.linkChallenges=(db.linkChallenges||[]).filter(c=>c.hostId!==userId);
  for(const challenge of db.linkChallenges)delete challenge.attempts?.[userId];
  db.matchmakingQueue=(db.matchmakingQueue||[]).filter(q=>!contains(q,userId));
  db.playerReports=(db.playerReports||[]).filter(r=>!contains(r,userId));
  for(const survivor of db.users)survivor.blockedUsers=(survivor.blockedUsers||[]).filter(id=>id!==userId);
  db.productEvents=(db.productEvents||[]).filter(e=>!contains(e,userId));
  db.rivalries=Object.fromEntries(Object.entries(db.rivalries||{}).filter(([key,value])=>!key.includes(userId)&&!contains(value,userId)));
  db.users=db.users.filter(u=>u.id!==userId);
  for(const survivor of db.users){if(survivor.favoriteRivalId===userId)survivor.favoriteRivalId=null;
   survivor.linkHistory=(survivor.linkHistory||[]).filter(h=>!String(h.id).includes(userId)&&h.opponentName!==user.playerName);
  }
  const sessions=Object.entries(db.clientSessions||{}),revoked=sessions.filter(([,id])=>id===userId).map(([key])=>key);
  db.clientSessions=Object.fromEntries(sessions.filter(([,id])=>id!==userId));
  if(db.activeUserId===userId)db.activeUserId=db.users[0]?.id||'';
  // Shared completed histories keep an anonymous result, never the old identity.
  const tombstone=`deleted-${randomUUID()}`;
  function scrub(value){
   if(typeof value==='string'){let text=value.split(userId).join(tombstone);for(const key of revoked)text=text.split(key).join('[revoked]');return text;}
   if(Array.isArray(value))return value.map(scrub);
   if(value&&typeof value==='object'){
    const related=contains(value,userId);return Object.fromEntries(Object.entries(value).map(([key,item])=>[
     key.split(userId).join(tombstone),((key==='opponentName'&&related)||(['name','playerName'].includes(key)&&(value.id===userId||value.userId===userId))||(related&&['opponentName','playerName','hostName','name'].includes(key)&&item===user.playerName))?'Joueur supprimé':scrub(item)
    ]));
   }return value;
  }
  const cleaned=scrub(db);store.write(cleaned);if(store.flush)await store.flush();
  return {ok:true};
 }
};}
module.exports={createAccountDeletion};
