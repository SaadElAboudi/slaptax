export const ACHIEVEMENTS=[
 {id:'first-practice',fr:'Premier pas',en:'First steps',goalFr:'Termine un entraînement.',goalEn:'Finish a practice trial.'},
 {id:'perfect-practice',fr:'Geste parfait',en:'Perfect touch',goalFr:'Atteins 1 000 points en entraînement.',goalEn:'Reach 1,000 points in practice.'},
 {id:'first-win',fr:'Première victoire',en:'First victory',goalFr:'Gagne un duel contre un autre joueur.',goalEn:'Win a duel against another player.'},
 {id:'three-wins',fr:'La passe de trois',en:'Three victories',goalFr:'Remporte trois duels contre d’autres joueurs.',goalEn:'Win three duels against other players.'},
 {id:'survivor',fr:'Dernier debout',en:'Last standing',goalFr:'Remporte une compétition entre quatre amis.',goalEn:'Win a four-friend competition.'},
] as const;
export type AchievementId=typeof ACHIEVEMENTS[number]['id'];
export type AchievementEvent={id:string;type:'training';score:number}|{id:string;type:'duel'|'competition';won:boolean};
export type AchievementProgress={seen:string[];unlocked:Partial<Record<AchievementId,number>>;practices:number;wins:number};
export const emptyAchievements=():AchievementProgress=>({seen:[],unlocked:{},practices:0,wins:0});
export function applyAchievement(previous:AchievementProgress,event:AchievementEvent,now:number){
 if(!event.id||event.id.length>250||previous.seen.includes(event.id))return{progress:previous,added:[] as AchievementId[]};
 if(event.type==='training'&&(!Number.isFinite(event.score)||event.score<0||event.score>1000))return{progress:previous,added:[] as AchievementId[]};
 if(event.type!=='training'&&typeof event.won!=='boolean')return{progress:previous,added:[] as AchievementId[]};
 const progress={...previous,seen:[...previous.seen,event.id],unlocked:{...previous.unlocked}},added:AchievementId[]=[];
 const unlock=(id:AchievementId)=>{if(progress.unlocked[id]===undefined){progress.unlocked[id]=now;added.push(id);}};
 if(event.type==='training'){progress.practices++;unlock('first-practice');if(event.score===1000)unlock('perfect-practice');}
 if(event.type==='duel'&&event.won){progress.wins++;unlock('first-win');if(progress.wins>=3)unlock('three-wins');}
 if(event.type==='competition'&&event.won)unlock('survivor');
 return{progress,added};
}
