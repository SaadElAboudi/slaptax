const nightPlaylist=require('../../shared/friend-night.json');
const {blockedPair}=require('../application/playerSafety');
const {randomBytes}=require('node:crypto');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('./partyGames');
// Private, unranked rooms. No wallet, duel settlement or artificial players.
function createSnackTeams(store,send){
 const rooms=new Map();
 const sockets=new Map();
 const connected=id=>[...(sockets.get(id)||[])].some(c=>c.readyState===1);
 function members(r){return r.players.map((p,i)=>({...p,team:i%2,online:[...(sockets.get(p.id)||[])].some(c=>c.readyState===1&&c.snackRoom===r.code)}));}
 function state(r,viewer){const now=Date.now(),game=r.mode==='night'?r.groups?.find(g=>g.players.includes(viewer)):r.game;return{type:'snack.team.state',code:r.code,mode:r.mode||'heist',host:r.players[0]?.id,players:members(r),phase:r.phase,round:r.round,stage:r.stage||0,gameId:r.mode==='night'?nightPlaylist[r.stage||0].id:'snack',scores:r.scores||{},results:r.results||[],startAt:r.startAt||0,disconnectUntil:r.disconnectUntil||0,reason:r.reason||'',votes:r.votes||[],party:game?publicParty(game,viewer,now):null};}
 function broadcast(r){for(const list of sockets.values())for(const c of list)if(c.snackRoom===r.code)send(c,state(r,c.userId));}
 function record(r,type,userId){if(!store.write)return;const db=store.read();db.productEvents=[...(db.productEvents||[]),{id:randomBytes(12).toString('hex'),type,userId,at:new Date().toISOString(),properties:{room:r.code,stage:r.stage||0}}].slice(-10000);store.write(db);}
 function freshNight(r){r.stage=0;r.scores=Object.fromEntries(r.players.map(p=>[p.id,0]));r.results=[];r.groups=[];}
 function finishStage(r){
  const points=Object.fromEntries(r.players.map(p=>[p.id,0])),raw={},feats={};
  for(const game of r.groups){
   const ids=game.players;
   for(const id of ids){raw[id]=game.scores[id]||0;
    points[id]=game.phase==='draw'?1:game.id==='snack'?(game.snack.winnerTeam==null?1:game.snack.bodies.find(p=>p.id===id).team===game.snack.winnerTeam?3:0):game.winnerId===id?3:0;
    if(game.id==='snack'){const p=game.snack.bodies.find(p=>p.id===id);feats[id]={interceptions:p.interceptions||0,passes:p.passes||0,captures:p.captures||0};}
    if(game.id==='pie'){const p=game.carnival.bodies.find(p=>p.id===id);feats[id]={hits:p.hits,dodges:p.dodges};}
    if(game.id==='onemore')feats[id]={level:game.runs[id].level,bank:game.runs[id].bank};
    r.scores[id]=(r.scores[id]||0)+points[id];
   }
  }
  r.results.push({gameId:nightPlaylist[r.stage].id,points,raw,feats});
  r.phase=r.stage===nightPlaylist.length-1?'done':'intermission';r.reason='finished';r.votes=[];
  for(const p of r.players){record(r,'night_round_completed',p.id);if(r.phase==='done')record(r,'night_completed',p.id);}
 }
 function error(c,reason){send(c,{type:'snack.team.error',reason});}
 function leave(c,disconnect=false){const r=rooms.get(c.snackRoom);c.snackRoom=null;if(!r)return;
  if(members(r).some(p=>p.id===c.userId&&p.online))return;
  if(!disconnect){r.players=r.players.filter(p=>p.id!==c.userId);r.phase='lobby';r.game=null;r.groups=[];r.scores={};r.results=[];r.stage=0;r.votes=[];r.reason='left';r.resuming=false;r.pausedAt=0;if(!r.players.length){rooms.delete(r.code);return;}}
  else if(r.phase==='lobby'){const p=r.players.find(p=>p.id===c.userId);if(p)p.offlineAt=Date.now();}
  else if(['playing','countdown'].includes(r.phase)){r.pausedAt ||= Date.now();r.wasPlaying=r.phase==='playing'||!!r.resuming;r.phase='paused';r.disconnectUntil=Date.now()+20000;}
  r.updatedAt=Date.now();broadcast(r);
 }
 function handle(c,a){
  const entering=a.type==='snack.team.create'||a.type==='snack.team.join';
  const user=entering?store.read().users?.find(u=>u.id===c.userId):null;if(entering&&!user)return;
  let r=rooms.get(c.snackRoom);
  if(a.type==='snack.team.create'){
   if(r)return broadcast(r);if(rooms.size>=200)return error(c,'busy');
   // One roster per identity, including disconnected members awaiting reconnect.
   const existing=[...rooms.values()].find(x=>x.players.some(p=>p.id===c.userId));if(existing){c.snackRoom=existing.code;delete existing.players.find(p=>p.id===c.userId).offlineAt;existing.updatedAt=Date.now();broadcast(existing);return;}
   let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
   r={code,mode:a.mode==='night'?'night':'heist',stage:0,scores:{},results:[],groups:[],players:[],phase:'lobby',round:0,updatedAt:Date.now(),votes:[]};rooms.set(code,r);a={...a,type:'snack.team.join',code};
  }
  if(a.type==='snack.team.join'){
   const code=typeof a.code==='string'?a.code.trim().toUpperCase():'';const next=rooms.get(code);if(!next)return error(c,'missing');if(next.players.some(p=>blockedPair(store.read(),c.userId,p.id)))return error(c,'blocked');
   const member=next.players.find(p=>p.id===c.userId);
   if(!member&&(next.phase!=='lobby'||next.players.length>=4))return error(c,'full');
   const other=[...rooms.values()].find(x=>x!==next&&x.players.some(p=>p.id===c.userId));if(other)return error(c,'already');
   if(r&&r!==next)return error(c,'already');c.snackRoom=code;r=next;
   if(member)delete member.offlineAt;
   if(!member){r.players.push({id:c.userId,name:String(user.name||user.playerName||'Joueur').slice(0,24),character:'flan'});if(r.mode==='night'){r.votes=[];record(r,r.players.length===1?'night_created':'night_joined',c.userId);}}
   r.updatedAt=Date.now();broadcast(r);return;
  }
  if(!r||!r.players.some(p=>p.id===c.userId))return error(c,'missing');
  if(a.type==='snack.team.leave'){leave(c);send(c,{type:'snack.team.left'});return;}
  if(a.type==='snack.team.character'&&r.phase==='lobby'){
   if(!['flan','pickle','toast'].includes(a.character))return; r.players.find(p=>p.id===c.userId).character=a.character;broadcast(r);return;
  }
  if(a.type==='snack.team.ready'&&r.mode==='night'&&r.phase==='lobby'){r.votes=r.votes.includes(c.userId)?r.votes.filter(id=>id!==c.userId):[...r.votes,c.userId];broadcast(r);return;}
  if(a.type==='snack.team.next'&&r.mode==='night'&&r.phase==='intermission'){if(!r.votes.includes(c.userId))r.votes.push(c.userId);if(r.votes.length===4&&members(r).every(p=>p.online)){r.stage++;countdown(r);}else broadcast(r);return;}
  if(a.type==='snack.team.start'){
   if(r.phase!=='lobby'||r.players[0].id!==c.userId||r.players.length!==4||members(r).some(p=>!p.online))return error(c,'notReady');
   if(r.mode==='night'){if(r.votes.length!==4)return error(c,'notReady');freshNight(r);for(const p of r.players)record(r,'night_started',p.id);}
   countdown(r);return;
  }
  if(a.type==='snack.team.rematch'&&r.phase==='done'){
   if(!r.votes.includes(c.userId))r.votes.push(c.userId);if(r.votes.length===4&&members(r).every(p=>p.online)){if(r.mode==='night'){freshNight(r);for(const p of r.players){record(r,'night_rematch',p.id);record(r,'night_started',p.id);}}countdown(r);}else broadcast(r);return;
  }
  if(a.type==='snack.team.action'&&r.phase==='playing'&&a.round===r.round){const game=r.mode==='night'?r.groups?.find(g=>g.players.includes(c.userId)):r.game;if(game&&!['done','draw'].includes(game.phase))actParty(game,c.userId,{...a,turn:a.turn},Date.now());}
 }
 function countdown(r){r.round++;r.game=null;r.pausedAt=0;r.resuming=false;r.phase='countdown';r.votes=[];r.reason='';r.startAt=Date.now()+2200;r.updatedAt=Date.now();broadcast(r);}
 function tick(now=Date.now()){
  for(const[code,r]of rooms){
   if(now-r.updatedAt>15*60000){for(const list of sockets.values())for(const c of list)if(c.snackRoom===code){c.snackRoom=null;error(c,'expired');}rooms.delete(code);continue;}
   if(r.phase==='lobby'){const before=r.players.length;r.players=r.players.filter(p=>!p.offlineAt||now-p.offlineAt<20000);if(!r.players.length){rooms.delete(code);continue;}if(before!==r.players.length){r.votes=[];broadcast(r);}}
   const online=members(r).filter(p=>p.online).length;
   if(r.phase==='paused'){
    if(now>=r.disconnectUntil){r.phase='done';r.reason='disconnect';r.votes=[];r.updatedAt=now;broadcast(r);continue;}
    if(online===4){r.phase='countdown';r.resuming=!!r.wasPlaying;r.startAt=now+2200;r.updatedAt=now;broadcast(r);}continue;
   }
   if(['playing','countdown'].includes(r.phase)&&online<4){r.wasPlaying=r.phase==='playing'||!!r.resuming;r.pausedAt ||= now;r.phase='paused';r.disconnectUntil=now+20000;broadcast(r);continue;}
   if(r.phase==='countdown'&&now>=r.startAt){
    if(r.resuming){for(const g of (r.mode==='night'?r.groups:[r.game]))if(!['done','draw'].includes(g.phase))pauseParty(g,now-r.pausedAt,now);r.resuming=false;r.pausedAt=0;}
    else{const ids=r.players.map(p=>p.id),gameId=r.mode==='night'?nightPlaylist[r.stage].id:'snack';
     const groups=gameId==='snack'?[ids]:r.stage===1?[[ids[0],ids[1]],[ids[2],ids[3]]]:[[ids[0],ids[3]],[ids[1],ids[2]]];
     r.groups=groups.map(players=>{const g=createParty(gameId,players);beginParty(g,now);if(gameId==='snack')for(const p of r.players)actParty(g,p.id,{turn:g.turn,action:'character',character:p.character},now);return g;});r.game=r.groups[0];}

    r.phase='playing';r.updatedAt=now;
   }
   if(r.phase==='playing'){for(const g of (r.mode==='night'?r.groups:[r.game]))if(!['draw','done'].includes(g.phase))tickParty(g,now);r.updatedAt=now;if((r.mode==='night'?r.groups:[r.game]).every(g=>['draw','done'].includes(g.phase))){if(r.mode==='night')finishStage(r);else{r.phase='done';r.votes=[];r.reason='finished';}}broadcast(r);}
  }
 }
 function attach(c){if(!sockets.has(c.userId))sockets.set(c.userId,new Set());sockets.get(c.userId).add(c);}
 function detach(c){sockets.get(c.userId)?.delete(c);if(!sockets.get(c.userId)?.size)sockets.delete(c.userId);leave(c,true);}
 function close(){rooms.clear();sockets.clear();}
 return{handle,attach,detach,tick,close,rooms,connected};
}
module.exports={createSnackTeams};
