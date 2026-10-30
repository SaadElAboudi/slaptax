import {gameChapter} from './world';
import {COMPETITIVE_GAMES,type CompetitiveGameId} from './catalog';
import type {Tab} from '../hooks/useGameStore';
export const SCORE_CHALLENGE_GAMES:CompetitiveGameId[]=['decoupe','onemore'];
export const hasScoreChallenge=(id:string)=>SCORE_CHALLENGE_GAMES.some(g=>g===id);
export function preferredGame(mode:string,fallback:CompetitiveGameId='snack'):CompetitiveGameId{
 const query=new URLSearchParams(location.search).get('game');let stored:string|null=null;try{stored=localStorage.getItem(`slaptax_${mode}_game`);}catch{/* URL choice works without storage. */}
 const id=query||stored;return COMPETITIVE_GAMES.some(g=>g.id===id)?id as CompetitiveGameId:fallback;
}
export function prepareGameMode(id:CompetitiveGameId,mode:Tab){
 try{localStorage.setItem(`slaptax_${mode==='defy'?'duel':mode==='challenges'?'challenge':mode}_game`,id);}catch{/* Navigation also carries the choice in the URL. */}
 const url=new URL(location.href);url.searchParams.set('game',id);url.searchParams.delete('room');url.searchParams.delete('invite');url.searchParams.delete('link');history.replaceState({},'',url);
}
const tips:Record<string,[string,string,string,string]>={
 chicken:['L’usine à poulets royaux','Lance le poulet avant sa rébellion. Une zone d’œuf annoncée ne te suit pas : change de route !','The royal poultry factory','Throw before the chicken rebels. An egg warning stays put: change your route!'],
 snack:['La cantine des braqueurs','Une baffe fait lâcher le goûter. LANCE vise automatiquement ton dépôt.','The snack thieves’ canteen','A slap drops the snack. THROW automatically aims at your depot.'],
 toilet:['Le grand bain des canards','Le turbo sert aussi à fuir la chasse : garde une sortie.','The great duck escape','Turbo also escapes the flush: keep an exit.'],
 pigeon:['Livraison très spéciale','La bonne trajectoire vaut plus qu’un tir précipité sur ta propre voiture.','Special delivery','A clean trajectory beats a rushed shot at your own car.'],
 lift:['Cabine sous pression','Observe la prochaine zone dangereuse et change de place avant le nuage.','A cabin under pressure','Watch the next danger zone and move before the cloud.'],
 pie:['Guerre de chantilly','Vise où le rival va arriver, puis garde de quoi esquiver sa réponse.','The cream war','Aim where your rival is going, then save a dodge for their reply.'],
 balloon:['L’ego sous pression','Sécurise ton ballon avant de tout risquer pour gonfler davantage.','Egos under pressure','Bank your balloon before risking everything for a bigger one.'],
 table:['Banquet sans dignité','Une impulsion bien placée peut valoir mieux qu’une charge vers le bord.','An undignified banquet','A careful nudge can beat a charge toward the edge.'],
 garde:['Le duel des ustensiles','Lis la préparation du rival : défendre au bon moment ouvre une riposte.','The utensil duel','Read your rival’s windup: a timely defense opens a counter.'],
 onemore:['Le chantier des catastrophes','Un bloc parfait donne de la marge. Sécurise ta tour avant le bloc de trop.','The disaster construction site','A perfect block buys room. Bank your tower before one block too many.'],
 decoupe:['La cuisine du dernier couic','Regarde la portion demandée avant de tracer : la précision bat la précipitation.','The kitchen’s final snip','Check the requested portion before cutting: precision beats haste.'],
 bombpass:['Le cadeau qui fait BOUM','Observe le rythme et passe dans la bonne fenêtre, pas sous l’effet de la panique.','The gift that goes BOOM','Read the rhythm and pass in the right window, not in a panic.'],
};
export const gameWorld=(id:string,fr:boolean)=>gameChapter(id,fr)?.place||tips[id]?.[fr?0:2]||(fr?'Le terrain des défis':'The challenge playground');
export const gameTip=(id:string,fr:boolean)=>tips[id]?.[fr?1:3]||'';
