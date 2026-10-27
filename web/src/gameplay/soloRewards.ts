export const BADGES:Record<string,{fr:string;en:string;icon:string;goalFr:string;goalEn:string}>={
 'first-step':{fr:'Premier pas',en:'First step',icon:'✦',goalFr:'Termine un jeu avec un score.',goalEn:'Finish a game with a score.'},
 explorer:{fr:'Touche-à-tout',en:'Explorer',icon:'◆',goalFr:'Termine 3 jeux différents.',goalEn:'Finish 3 different games.'},
 regular:{fr:'Dans le club',en:'Club regular',icon:'★',goalFr:'Termine 10 parties solo.',goalEn:'Finish 10 solo games.'},
 sharp:{fr:'En plein dans le mille',en:'Right on target',icon:'◎',goalFr:'Atteins 900 points dans un jeu.',goalEn:'Reach 900 points in a game.'},
 'daily-tour':{fr:'Tour de force',en:'Triple threat',icon:'♛',goalFr:'Termine les 3 jeux du parcours du jour.',goalEn:'Finish all 3 daily route games.'}
};
export function soloMedal(score:number){return score>=900?'gold':score>=700?'silver':score>=400?'bronze':'starter';}
