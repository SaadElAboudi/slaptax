const GAMES=require('../../shared/game-selection.json').map(game=>game.id).filter(id=>id!=='bombpass');
function dayKey(now=Date.now()){return new Date(now).toISOString().slice(0,10);}
function routeFor(day){const n=Math.floor(Date.parse(day+'T00:00:00Z')/86400000);return [0,2,4].map(offset=>GAMES[(n+offset)%GAMES.length]);}
function ensureSolo(user,now=Date.now()){
 const day=dayKey(now);const s=user.progression.solo ||= {plays:0,best:{},badges:[],receipts:[],daily:{day,games:routeFor(day),completed:[],rewarded:false,xpPlays:0}};
 if(s.daily.day!==day)s.daily={day,games:routeFor(day),completed:[],rewarded:false,xpPlays:0};
 // Preserve earned XP, receipts and the daily cap while replacing retired tasks.
 if(s.daily.games.some(id=>!GAMES.includes(id))){
  const completed=s.daily.completed.filter(id=>GAMES.includes(id));
  s.daily.games=[...new Set([...completed,...routeFor(day),...GAMES])].slice(0,3);
  s.daily.completed=completed.filter(id=>s.daily.games.includes(id));
 }
 return s;
}
function normalizePractice(game,id){
 const raw=game.scores[id]||0;
 const score=game.id==='pigeon'?raw/3:game.id==='lift'?raw/2.5:game.id==='pie'?raw/4:game.id==='balloon'?raw/2:game.id==='toilet'?raw/10:game.id==='table'?raw:game.id==='mat'?(game.mat?.results[id]?.mate?500+raw/40:0):game.id==='garde'?(game.garde?.winnerId===id?1000:game.garde?.winnerId===null?500:0):['trace','decoupe'].includes(game.id)?raw/3:game.id==='contrepied'?raw*1000/15:game.id==='ricochet'?raw/10:game.id==='chroma'?Math.max(0,1000+raw/(3*255*Math.sqrt(3))):game.id==='onesecond'?Math.max(0,1000+raw/3):game.id==='onemore'?raw*50:raw*1000/3;
 return Math.max(0,Math.min(1000,Math.round(score)));
}
function applySoloRun(user,{id,gameId,score},now=Date.now()){
 const s=ensureSolo(user,now);
 if(s.receipts.includes(id)||!Number.isInteger(score)||score<=0||score>1000)return null;
 s.receipts.push(id);s.receipts=s.receipts.slice(-256);
 const previousBest=s.best[gameId]||0;s.best[gameId]=Math.max(previousBest,score);s.plays++;
 let xpGain=s.daily.xpPlays<3?15:0;if(xpGain)s.daily.xpPlays++;
 if(s.daily.games.includes(gameId)&&!s.daily.completed.includes(gameId))s.daily.completed.push(gameId);
 const dailyCompleted=!s.daily.rewarded&&s.daily.games.every(g=>s.daily.completed.includes(g));
 if(dailyCompleted){s.daily.rewarded=true;xpGain+=90;}
 const before=new Set(s.badges);before.add('first-step');
 if(Object.keys(s.best).length>=3)before.add('explorer');
 if(s.plays>=10)before.add('regular');
 if(Object.values(s.best).some(v=>v>=900))before.add('sharp');
 if(dailyCompleted)before.add('daily-tour');
 const badges=[...before].filter(b=>!s.badges.includes(b));s.badges=[...before];
 user.progression.xp+=xpGain;
 return {xpGain,previousBest,newBest:score>previousBest,score,dailyCompleted,badges};
}
function publicSolo(user,now=Date.now()){const {receipts,...visible}=ensureSolo(user,now);return structuredClone(visible);}
module.exports={ensureSolo,applySoloRun,publicSolo,normalizePractice,routeFor};
