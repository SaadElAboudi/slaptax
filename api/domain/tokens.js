const {randomUUID}=require('node:crypto');
const policy=require('../../shared/token-economy.json');
const dayKey=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
function minor(value){const n=Number(value),v=Math.round(n*100);if(!Number.isFinite(n)||!Number.isSafeInteger(v)||Math.abs(v/100-n)>.0000001)throw new Error('Invalid token precision');return v;}
function account(user){
 const balance=minor(user.wallet);if(balance<0)throw new Error('Negative token balance');
 if(!user.tokenAccount)user.tokenAccount={version:1,openingMinor:balance,archivedMinor:0,journal:[],claims:{}};
 const a=user.tokenAccount;
 let running=a.openingMinor+(a.archivedMinor||0);const keys=new Set();
 for(const e of a.journal){running+=e.deltaMinor;if(!Number.isSafeInteger(e.deltaMinor)||!Number.isSafeInteger(running)||running<0||e.balanceMinor!==running||keys.has(e.key))throw new Error('Invalid token journal entry');keys.add(e.key);}
 if(running!==balance)throw new Error('Token ledger does not match balance');
 return a;
}
function post(user,delta,key,reason,reference=null,now=Date.now()){
 const a=account(user),amount=minor(delta),existing=a.journal.find(e=>e.key===key);
 if(existing){if(existing.deltaMinor!==amount||existing.reason!==reason)throw new Error('Conflicting token operation');return {applied:false,entry:existing};}
 const next=minor(user.wallet)+amount;if(next<0)throw new Error('Insufficient tokens');
 if(!Number.isSafeInteger(next))throw new Error('Token balance overflow');
 const entry={id:randomUUID(),key,reason,reference,deltaMinor:amount,balanceMinor:next,at:new Date(now).toISOString()};
 a.journal.push(entry);user.wallet=next/100;
 // Operation-level guards (duel escrow and claim day) outlive journal display retention.
 if(a.journal.length>2000){const removed=a.journal.splice(0,a.journal.length-2000);a.archivedMinor=(a.archivedMinor||0)+removed.reduce((n,e)=>n+e.deltaMinor,0);}
 return {applied:true,entry};
}
function quote(stake){const units=minor(stake),pot=units*2,fee=Math.round(pot*policy.feePercent/100);return {version:policy.version,stake:units/100,pot:pot/100,fee:fee/100,payout:(pot-fee)/100,net:(pot-fee-units)/100,feePercent:policy.feePercent};}
function held(db,id){return (db.duels||[]).filter(d=>d.status==='playing'&&[d.challengerId,d.opponentId].includes(id)&&(!d.tokenEscrow||d.tokenEscrow.status==='held')).reduce((sum,d)=>sum+minor(d.stake||0),0)/100;}
function reserve(db,duel){
 if(duel.tokenEscrow)return duel.tokenEscrow.status==='held';
 const users=[duel.challengerId,duel.opponentId].map(id=>db.users.find(u=>u.id===id));
 if(users.some(u=>!u||minor(u.wallet)<minor(duel.stake)))return false;
 for(const u of users)account(u);
 duel.tokenQuote ||=quote(duel.stake);
 if(duel.stake>0)for(const u of users)post(u,-duel.stake,`duel:${duel.id}:stake`,'stake',duel.id);
 duel.tokenEscrow={status:'held',stake:duel.stake};return true;
}
function settle(db,duel,winnerId){
 if(duel.tokenEscrow?.status==='settled')return false;
 if(duel.tokenEscrow?.status==='refunded')throw new Error('Refunded duel cannot pay out');
 const winner=db.users.find(u=>u.id===winnerId);if(!winner)throw new Error('Winner unavailable');
 // Existing live duels already had their stakes deducted before this ledger existed.
 duel.tokenEscrow ||= {status:'held',stake:duel.stake,legacy:true};
 const q=duel.tokenQuote||quote(duel.stake);duel.tokenQuote=q;
 if(q.payout>0)post(winner,q.payout,`duel:${duel.id}:payout`,'payout',duel.id);
 duel.tokenEscrow={...duel.tokenEscrow,status:'settled',winnerId,payout:q.payout,fee:q.fee,at:new Date().toISOString()};return true;
}
function refund(db,duel,reason='interrupted',excludedId=null){
 if(duel.tokenEscrow&&duel.tokenEscrow.status!=='held')return false;
 if(!duel.tokenEscrow&&duel.status!=='playing')return false;
 for(const id of [duel.challengerId,duel.opponentId]){const u=db.users.find(u=>u.id===id&&id!==excludedId);if(u&&duel.stake>0)post(u,duel.stake||0,`duel:${duel.id}:refund`,'refund',duel.id);}
 duel.tokenEscrow={...(duel.tokenEscrow||{}),status:'refunded',reason,at:new Date().toISOString()};return true;
}
function rewards(user,db,now=Date.now()){
 const a=account(user),day=dayKey(now),busy=held(db,user.id)>0;
 return {dailyAvailable:!a.claims.daily||a.claims.daily<day,rescueAvailable:minor(user.wallet)<minor(policy.minimumStake)&&!busy&&(!a.claims.rescue||a.claims.rescue<day),practiceEarned:a.claims.practiceDay===day?a.claims.practiceCount||0:0,nextResetAt:Date.parse(day+'T00:00:00Z')+86400000};
}
function claim(user,db,kind,now=Date.now()){
 if(!['daily','rescue'].includes(kind))return {error:'Unknown reward',code:400};
 const a=account(user),availability=rewards(user,db,now),available=kind==='daily'?availability.dailyAvailable:availability.rescueAvailable;
 if(!available)return {ok:true,claimed:false,amount:0};
 const amount=kind==='daily'?policy.dailyBonus:policy.rescueBonus;
 const receipt=post(user,amount,`claim:${kind}:${dayKey(now)}`,kind,null,now);a.claims[kind]=dayKey(now);
 return {ok:true,claimed:receipt.applied,amount:receipt.applied?amount:0};
}
function practiceReward(user,runId,now=Date.now()){
 const a=account(user),day=dayKey(now);
 if(a.claims.practiceDay!==day){if(a.claims.practiceDay>day)return 0;a.claims.practiceDay=day;a.claims.practiceCount=0;}
 if((a.claims.practiceCount||0)>=policy.practiceDailyLimit)return 0;
 const result=post(user,policy.practiceReward,`practice:${runId}`,'practice',null,now);
 if(!result.applied)return 0;a.claims.practiceCount++;return policy.practiceReward;
}
function snapshot(user,db,now=Date.now()){
 const a=account(user);return {ok:true,balance:user.wallet,openingBalance:a.openingMinor/100,held:held(db,user.id),policy,quotes:policy.stakes.map(quote),rewards:rewards(user,db,now),journal:a.journal.slice(-60).reverse().map(({key,...entry})=>({...entry,delta:entry.deltaMinor/100,balance:entry.balanceMinor/100})),archivedEntries:a.archivedMinor!==0};
}
function audit(db){
 const issues=[];let availableMinor=0,heldMinor=0,feesMinor=0;
 for(const u of db.users||[]){try{account(structuredClone(u));availableMinor+=minor(u.wallet);}catch(e){issues.push({scope:'balance',userId:u.id,error:e.message});}}
 for(const d of db.duels||[]){if(d.tokenEscrow?.status==='held'){if(d.status!=='playing')issues.push({scope:'escrow',duelId:d.id,error:'Held stake outside active duel'});heldMinor+=minor(d.tokenEscrow.stake)*2;}
  if(d.tokenEscrow?.status==='settled'){feesMinor+=minor(d.tokenEscrow.fee);if(d.status!=='done')issues.push({scope:'settlement',duelId:d.id,error:'Settled duel is not done'});}
 }
 return {ok:issues.length===0,users:(db.users||[]).length,available:availableMinor/100,held:heldMinor/100,fees:feesMinor/100,issues};
}
module.exports={audit,policy,minor,account,post,quote,reserve,settle,refund,rewards,claim,practiceReward,snapshot};
