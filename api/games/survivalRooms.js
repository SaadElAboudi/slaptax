const {randomBytes}=require('node:crypto');
const {blockedPair}=require('../application/playerSafety');
const playlist=require('../../shared/survival-games.json');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('./partyGames');
function createSurvivalRooms(store,send){
 const rooms=new Map(),sockets=new Map();
 function members(r){return r.players.map(p=>({...p,online:[...(sockets.get(p.id)||[])].some(c=>c.readyState===1&&c.survivalRoom===r.code)}));}
 function state(r,id){return{type:'survival.state',code:r.code,host:r.players[0]?.id,players:members(r),phase:r.phase,stage:r.stage,round:r.round,activeIds:r.activeIds,votes:r.votes,results:r.results,winnerId:r.winnerId,reason:r.reason,startAt:r.startAt,disconnectUntil:r.disconnectUntil,party:r.game?publicParty(r.game,id,Date.now()):null};}
 function broadcast(r){for(const list of sockets.values())for(const c of list)if(c.survivalRoom===r.code)send(c,state(r,c.userId));}
 function error(c,reason){send(c,{type:'survival.error',reason});}
 function reset(r){r.stage=0;r.results=[];r.activeIds=r.players.map(p=>p.id);r.winnerId=null;r.reason='';r.game=null;r.votes=[];}
 function countdown(r){r.round++;r.phase='countdown';r.startAt=Date.now()+2200;r.votes=[];r.game=null;r.resuming=false;r.pausedAt=0;r.updatedAt=Date.now();broadcast(r);}
 function finish(r){const g=r.game;let qualified;
  if(g.id==='table')qualified=g.winnerId?[g.winnerId]:[...r.activeIds];
  else{const ranked=g.players.filter(id=>g.survival.players[id].finishedAt).sort((a,b)=>g.survival.players[a].finishedAt-g.survival.players[b].finishedAt);const cutoff=g.survival.players[ranked[Math.min(ranked.length,playlist[r.stage].qualifiers)-1]]?.finishedAt;qualified=ranked.filter(id=>g.survival.players[id].finishedAt<=cutoff+100);}
  r.results.push({gameId:g.id,qualifiedIds:qualified,scores:{...g.scores},tied:g.id==='table'&&!g.winnerId});r.activeIds=qualified;r.votes=[];r.reason='finished';
  if(qualified.length<=1){r.phase='done';r.winnerId=qualified[0]||null;}else{r.phase='intermission';if(g.id!=='table')r.stage++;}broadcast(r);
 }
 function leave(c,disconnected=false){const r=rooms.get(c.survivalRoom);c.survivalRoom=null;if(!r||members(r).some(p=>p.id===c.userId&&p.online))return;
  if(!disconnected){r.players=r.players.filter(p=>p.id!==c.userId);r.phase='lobby';reset(r);if(!r.players.length){rooms.delete(r.code);return;}r.reason='left';}
  else{const p=r.players.find(p=>p.id===c.userId);if(p)p.offlineAt=Date.now();}
  r.updatedAt=Date.now();broadcast(r);
 }
 function handle(c,a){let r=rooms.get(c.survivalRoom);const entering=['survival.create','survival.join'].includes(a.type),user=entering?store.read().users?.find(u=>u.id===c.userId):null;if(entering&&!user)return;
  if(a.type==='survival.create'){if(r)return broadcast(r);const existing=[...rooms.values()].find(x=>x.players.some(p=>p.id===c.userId));if(existing){c.survivalRoom=existing.code;delete existing.players.find(p=>p.id===c.userId).offlineAt;existing.updatedAt=Date.now();broadcast(existing);return;}if(rooms.size>=200)return error(c,'busy');let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));r={code,players:[],phase:'lobby',round:0,updatedAt:Date.now()};reset(r);rooms.set(code,r);a={type:'survival.join',code};}
  if(a.type==='survival.join'){const next=rooms.get(typeof a.code==='string'?a.code.trim().toUpperCase():'');if(!next)return error(c,'missing');if(next.players.some(p=>blockedPair(store.read(),c.userId,p.id)))return error(c,'blocked');const p=next.players.find(p=>p.id===c.userId);if(!p&&(next.phase!=='lobby'||next.players.length>=4))return error(c,'full');if([...rooms.values()].some(x=>x!==next&&x.players.some(p=>p.id===c.userId)))return error(c,'already');c.survivalRoom=next.code;r=next;if(p)delete p.offlineAt;else{r.players.push({id:c.userId,name:String(user.name||user.playerName||'Joueur').slice(0,24)});r.votes=[];r.activeIds=r.players.map(p=>p.id);}r.updatedAt=Date.now();broadcast(r);return;}
  if(!r||!r.players.some(p=>p.id===c.userId))return error(c,'missing');
  if(a.type==='survival.leave'){leave(c);send(c,{type:'survival.left'});return;}
  if(a.type==='survival.ready'&&r.phase==='lobby'){r.votes=r.votes.includes(c.userId)?r.votes.filter(id=>id!==c.userId):[...r.votes,c.userId];broadcast(r);return;}
  if(a.type==='survival.start'){if(r.phase!=='lobby'||r.players[0].id!==c.userId||r.players.length!==4||members(r).some(p=>!p.online)||r.votes.length!==4)return error(c,'notReady');reset(r);countdown(r);return;}
  if(a.type==='survival.next'&&r.phase==='intermission'&&r.activeIds.includes(c.userId)){if(!r.votes.includes(c.userId))r.votes.push(c.userId);if(r.activeIds.every(id=>r.votes.includes(id)&&members(r).some(p=>p.id===id&&p.online)))countdown(r);else broadcast(r);return;}
  if(a.type==='survival.rematch'&&r.phase==='done'){if(!r.votes.includes(c.userId))r.votes.push(c.userId);if(r.players.length===4&&r.votes.length===4&&members(r).every(p=>p.online)){reset(r);countdown(r);}else broadcast(r);return;}
  if(a.type==='survival.action'&&r.phase==='playing'&&a.round===r.round&&r.activeIds.includes(c.userId)&&r.game&&!['done','draw'].includes(r.game.phase))actParty(r.game,c.userId,a,Date.now());
 }
 function tick(now=Date.now()){for(const[code,r]of rooms){if(now-r.updatedAt>900000){for(const list of sockets.values())for(const c of list)if(c.survivalRoom===code){c.survivalRoom=null;error(c,'expired');}rooms.delete(code);continue;}
  if(r.phase==='lobby'){const before=r.players.length;r.players=r.players.filter(p=>!p.offlineAt||now-p.offlineAt<20000);if(!r.players.length){rooms.delete(code);continue;}if(before!==r.players.length){reset(r);broadcast(r);}}
  const online=members(r),allActive=r.activeIds.every(id=>online.some(p=>p.id===id&&p.online));
  if(['playing','countdown'].includes(r.phase)&&!allActive){r.wasPlaying=r.phase==='playing'||r.resuming;r.pausedAt ||= now;r.phase='paused';r.disconnectUntil=now+20000;broadcast(r);}
  if(r.phase==='paused'){if(now>=r.disconnectUntil){r.phase='done';r.reason='disconnect';r.winnerId=null;r.votes=[];r.updatedAt=now;broadcast(r);}else if(allActive){r.phase='countdown';r.resuming=r.wasPlaying;r.startAt=now+2200;broadcast(r);}continue;}
  if(r.phase==='countdown'&&now>=r.startAt){if(r.resuming){pauseParty(r.game,now-r.pausedAt,now);r.resuming=false;}else{r.game=createParty(playlist[r.stage].id,r.activeIds);beginParty(r.game,now);}r.phase='playing';r.updatedAt=now;}
  if(r.phase==='playing'){tickParty(r.game,now);r.updatedAt=now;if(['done','draw'].includes(r.game.phase))finish(r);else broadcast(r);}
 }}
 function attach(c){if(!sockets.has(c.userId))sockets.set(c.userId,new Set());sockets.get(c.userId).add(c);}
 function detach(c){sockets.get(c.userId)?.delete(c);if(!sockets.get(c.userId)?.size)sockets.delete(c.userId);leave(c,true);}
 return{rooms,handle,tick,attach,detach,close(){rooms.clear();sockets.clear();}};
}
module.exports={createSurvivalRooms};
