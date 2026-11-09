const playlist=require('../../shared/survival-games.json');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const path=[[.2,.2],[.8,.2],[.5,.8],[.2,.2]];
const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));
const total=lengths.reduce((a,b)=>a+b,0);
function pointAt(distance){let d=clamp(distance,0,total);for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const t=clamp(d/lengths[i],0,1);return path[i].map((v,k)=>v+(path[i+1][k]-v)*t);}d-=lengths[i];}}
function beginSurvival(g,now){g.phase='survival';g.deadline=now+playlist.find(p=>p.id===g.id).duration;g.survival={at:now,signal:'go',signalAt:now+g.random(1800,2600),cycle:0,players:Object.fromEntries(g.players.map(id=>[id,{progress:0,faults:0,out:false,finishedAt:null,holding:false,until:0,seq:-1,penaltyCycle:-1,budget:.1,budgetAt:now,lastFault:0}]))};}
function finish(g){for(const[id,p]of Object.entries(g.survival.players))g.scores[id]=Math.round(p.finishedAt?1000:Math.min(900,p.progress*900));const finishers=g.players.filter(id=>g.survival.players[id].finishedAt).sort((a,b)=>g.survival.players[a].finishedAt-g.survival.players[b].finishedAt);g.winnerId=finishers[0]||null;g.phase='done';g.summary='survival-finished';}
function advanceRace(g,to){const s=g.survival;while(s.at<to){const end=Math.min(to,s.signalAt),dt=end-s.at;for(const p of Object.values(s.players)){if(p.out||p.finishedAt)continue;const moving=p.holding&&p.until>s.at;if(moving&&s.signal==='go'){const duration=Math.max(0,Math.min(end,p.until)-s.at);p.progress=clamp(p.progress+duration/10000,0,1);if(p.progress===1){p.finishedAt=s.at+duration;p.holding=false;}}if(moving&&s.signal==='stop'&&end>s.redAt+180&&p.until>s.redAt+180&&p.penaltyCycle!==s.cycle){p.penaltyCycle=s.cycle;p.faults++;p.progress=Math.max(0,p.progress-.12);p.holding=false;p.out=p.faults>=3;}if(p.until<=end)p.holding=false;}
 s.at=end;if(end===s.signalAt){if(s.signal==='go'){s.signal='release';s.signalAt=end+550;}else if(s.signal==='release'){s.signal='stop';s.redAt=end;s.signalAt=end+g.random(1000,1700);s.cycle++;}else{s.signal='go';s.signalAt=end+g.random(1800,2600);}}}}
function tickSurvival(g,now){if(g.phase!=='survival')return;if(g.id==='stopgo')advanceRace(g,Math.min(now,g.deadline));if(now>=g.deadline||Object.values(g.survival.players).every(p=>p.out||p.finishedAt))finish(g);}
function actSurvival(g,id,a,now){tickSurvival(g,now);if(g.phase!=='survival')return false;const p=g.survival.players[id];if(!p||p.out||p.finishedAt||!Number.isSafeInteger(a.seq)||a.seq<=p.seq)return false;
 if(g.id==='stopgo'){if(a.action!=='hold'||typeof a.holding!=='boolean')return false;p.seq=a.seq;p.holding=a.holding;p.until=now+400;return true;}
 if(a.action!=='trace'||!Array.isArray(a.points)||!a.points.length||a.points.length>12||!a.points.every(v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1)))return false;
 p.seq=a.seq;p.budget=Math.min(.16,p.budget+(now-p.budgetAt)/1000*1.6);p.budgetAt=now;
 for(const q of a.points){const current=p.progress*total,expected=pointAt(current);let best=current,dist=Math.hypot(q[0]-expected[0],q[1]-expected[1]);for(let d=current;d<=Math.min(total,current+Math.min(.11,p.budget));d+=.004){const pt=pointAt(d),error=Math.hypot(pt[0]-q[0],pt[1]-q[1]);if(error<dist){dist=error;best=d;}}
  // Short ordered steps prevent jumping across the outline or submitting a finished shape.
  if(dist>.065){if(now-p.lastFault>350){p.faults++;p.lastFault=now;p.out=p.faults>=3;}break;}
  const step=best-current;p.budget=Math.max(0,p.budget-step);p.progress=clamp(best/total,0,1);if(total-best<.025){p.progress=1;p.finishedAt=now;break;}
 }tickSurvival(g,now);return true;
}
function publicSurvival(g){if(!g.survival)return undefined;return{signal:g.survival.signal,path:g.id==='fragile'?path:undefined,players:Object.fromEntries(Object.entries(g.survival.players).map(([id,p])=>[id,{seq:p.seq,progress:p.progress,faults:p.faults,out:p.out,finished:!!p.finishedAt}]))};}
function pauseSurvival(g,delta){const s=g.survival;s.at+=delta;s.signalAt+=delta;if(s.redAt)s.redAt+=delta;for(const p of Object.values(s.players)){p.holding=false;p.until=0;p.budgetAt+=delta;if(p.finishedAt)p.finishedAt+=delta;}}
module.exports={beginSurvival,actSurvival,tickSurvival,publicSurvival,pauseSurvival,pointAt,total};
