const {actParty}=require('./partyGames');
const {pointAt,total}=require('./survivalGames');
const PROFILES=require('../../shared/survival-practice.json');
// Robots receive the current signal, never the future signal timestamp. Their
// ordinary actions pass through the same validators and clock as human input.
function tickSurvivalBots(game,roster,difficulty,now){
 if(game.phase!=='survival')return;
 const profile=PROFILES[difficulty]||PROFILES.normal;
 game.botBrains ||= {};
 for(const [index,bot]of roster.filter(p=>p.bot&&game.players.includes(p.id)).entries()){
  const p=game.survival.players[bot.id];if(!p||p.out||p.finishedAt)continue;
  const brain=game.botBrains[bot.id] ||= {lastAt:now,signal:null,holding:false,reactAt:now};
  if(game.id==='stopgo'){
   const signal=game.survival.signal;
   if(signal!==brain.signal){brain.signal=signal;brain.reactAt=now+profile.reaction+index*profile.spread;
    if(signal==='release'&&game.random(0,100)<profile.mistake)brain.reactAt+=650;
   }
   if(now>=brain.reactAt)brain.holding=signal==='go';
   if(now-brain.lastAt<100)continue;
   brain.lastAt=now;actParty(game,bot.id,{action:'hold',holding:brain.holding,seq:p.seq+1,turn:game.turn},now);
  }else{
   if(now-brain.lastAt<120)continue;
   const dt=Math.min(.2,(now-brain.lastAt)/1000);brain.lastAt=now;
   const speed=profile.speed*(1-index*.1),distance=Math.min(total,p.progress*total+speed*dt);
   const point=pointAt(distance);
   // Small imperfect hand movements stay visible without granting free progress.
   const jitter=Math.sin((now+index*700)/300)*.006;
   actParty(game,bot.id,{action:'trace',points:[[point[0]+jitter,point[1]-jitter]],seq:p.seq+1,turn:game.turn},now);
  }
 }
}
module.exports={tickSurvivalBots,PROFILES};
