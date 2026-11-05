import type {CompetitiveGameId} from './catalog';

// Three signature gestures, no duplicated games or alternative scoring engines.
export const CHALLENGE_SPOTLIGHTS = [
 {id:'chroma',fr:'Tu as vraiment l’œil ?',en:'Got an eye for color?',gestureFr:'Observe. Mélange. Verrouille.',gestureEn:'Look. Mix. Lock.',tagFr:'MÉMOIRE · COULEURS',tagEn:'MEMORY · COLOR',detailFr:'Trois couleurs à retrouver. Ton pote aura exactement les mêmes.',detailEn:'Recreate three colors. Your friend gets exactly the same ones.'},
 {id:'decoupe',fr:'La part parfaite, vraiment ?',en:'The perfect slice. Really?',gestureFr:'Trace. Choisis ta part.',gestureEn:'Draw. Pick your portion.',tagFr:'PRÉCISION · UN TRAIT',tagEn:'PRECISION · ONE STROKE',detailFr:'Trois commandes du chef. Chaque petit écart compte.',detailEn:'Three orders from the chef. Every tiny error counts.'},
 {id:'onemore',fr:'Encore un. Tu oses ?',en:'One more. Dare you?',gestureFr:'Pose. Empile. Sécurise.',gestureEn:'Drop. Stack. Bank.',tagFr:'ADRESSE · SANG-FROID',tagEn:'SKILL · NERVE',detailFr:'Un bloc de plus ou tout perdre ? Ta tour doit être sécurisée.',detailEn:'One more block or lose it all? Bank your tower to keep it.'},
] satisfies {id:CompetitiveGameId;fr:string;en:string;gestureFr:string;gestureEn:string;tagFr:string;tagEn:string;detailFr:string;detailEn:string}[];

export function challengeScore(gameId:string,score:number,fr:boolean){
 if(gameId==='onemore')return `${score} ${fr?'blocs':'blocks'}`;
 const percent=gameId==='chroma'?Math.max(0,Math.min(100,100+score/(3*255*Math.sqrt(3)*10))):score/30;
 return `${percent.toFixed(1)} % ${fr?'de fidélité':'accuracy'}`;
}
export function challengeGap(gameId:string,own:number,rival:number,fr:boolean){
 if(gameId==='onemore')return `${Math.abs(rival-own)} ${fr?'bloc(s) d’écart':'block(s) apart'}`;
 const divisor=gameId==='chroma'?3*255*Math.sqrt(3)*10:30;
 return `${(Math.abs(rival-own)/divisor).toFixed(1)} ${fr?'point(s) de fidélité d’écart':'accuracy point(s) apart'}`;
}
export function challengeUrl(gameId:string,rematchOf?:string,rivalId?:string){
 const query=new URLSearchParams({tab:'training',link:'new',game:gameId});
 if(rematchOf)query.set('rematch',rematchOf);
 if(rivalId)query.set('rival',rivalId);
 return `/?${query}`;
}
