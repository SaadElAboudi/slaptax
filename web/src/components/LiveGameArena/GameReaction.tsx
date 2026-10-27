import {GameBuddy,type BuddyMood} from '../GameBuddy/GameBuddy';
import type {PartyState} from '../../gameplay/party';
import styles from './GameReaction.module.css';
const goals:Record<string,[string,string,string,string]>={
 chroma:['PIGMENT','PIGMENT','Mémorise la couleur. Recrée-la de tête !','Remember the shade. Rebuild it from memory!'],
 garde:['SIR PAF','SIR BONK','Banane, poêle, poisson : règle tes comptes !','Banana, pan, big fish: settle the score!'],
 contrepied:['BLUFFO','BLUFFO','La plus grosse carte gagne. Mais chaque carte ne sert qu’une fois !','Highest card wins. But each card is used only once!'],
 onemore:['BLOCOS','BLOCKO','Superpose les blocs. Sécurise avant la chute !','Stack the blocks. Bank before the fall!'],
 falsestart:['TOPETTE','TWITCH','Attends le vrai GO. Les pièges ne comptent pas !','Wait for the real GO. Ignore the traps!'],
 onesecond:['TICTOC','TICKTOCK','Compte dans ta tête. Arrête au bon moment.','Count in your head. Stop at the target time.'],
 ricochet:['PALETTE','PUCKO','Vise le centre. Attention aux sorties latérales !','Aim for the centre. Watch the side exits!'],
 trace:['GRIBOUILLE','DOODLE','Retiens la forme, puis retrace-la en un seul trait.','Remember the shape, then redraw it in one stroke.'],
 decoupe:['CHEF COUIC','CHEF SNIP','Coupe la bonne portion, puis choisis le côté à garder.','Cut the target portion, then choose the side to keep.'],
 mat:['ROI PATATE','KING SPUD','Un coup pour faire mat. Prends le temps de regarder.','One move to checkmate. Look before you move.'],
 bounce:['REBONDIN','BOUNCY','Déplace la raquette. Chaque retour fait monter le score !','Move the paddle. Each return raises your score!'],
 symbolrush:['MÉMORIX','MEMORIX','Mémorise la suite, puis rejoue-la dans le bon ordre.','Remember the sequence, then repeat it in order.'],
 bombpass:['BOUMBOUM','BOOMBOOM','Appuie quand le curseur est dans la zone sûre !','Tap when the marker is in the safe zone!'],
 cupshuffle:['GOBLO','CUPPO','Suis le bon gobelet sans le perdre des yeux.','Keep your eyes on the right cup.'],
 duelnumeric:['CALCULO','CALCULO','Trouve la bonne réponse. Vitesse et précision !','Find the right answer. Speed and accuracy!'],
};
export function GameReaction({gameId,isFr,party,identity='',score,moodOverride,messageOverride}:{gameId:string;isFr:boolean;party?:PartyState;identity?:string;score?:number;moodOverride?:BuddyMood;messageOverride?:string}){
 const info=goals[gameId];if(!info)return null;
 let mood:BuddyMood='ready',message=info[isFr?2:3];
 const say=(fr:string,en:string)=>isFr?fr:en;
 if(score!==undefined){mood=score>=700?'happy':score>=400?'wow':'ready';message=score>=900?say('Trois étoiles. La classe !','Three stars. Looking good!'):say('Chaque essai compte. Ton prochain record t’attend !','Every attempt counts. Your next best awaits!');}
 else if(party&&Object.keys(party.scores).includes(identity)){
  const reveal=['reveal','done'].includes(party.phase),locked=party.answered.includes(identity),run=party.runs[identity];
  if(locked&&!reveal){mood='focus';message=say('C’est verrouillé. Suspense…','Locked in. Here comes the suspense…');}
  if(party.phase==='observe'){mood='focus';message=say('Grave ça dans ta mémoire !','Take a mental snapshot!');}
  if(gameId==='falsestart'){
   if(party.phase==='go'){mood='wow';message=say('GO ! Maintenant !','GO! Now!');}
   if(reveal){const good=!party.feedback.timeout&&(party.feedback.falseStart?party.feedback.actor!==identity:party.feedback.actor===identity);mood=good?'happy':'oops';message=good?say('ZAP ! Ce point est pour toi !','ZAP! Your point!'):say('Oups ! Respire, puis vise le prochain GO.','Oops! Breathe, then catch the next GO.');}
  }
  if(gameId==='onemore'&&run){if(run.status==='crashed'){mood='oops';message=say('PATATRAS ! La prochaine tiendra debout.','TIMBER! The next one will stand taller.');}else if(run.status==='banked'){mood='happy';message=say('Bien au chaud ! Tes blocs sont sécurisés.','Safe and sound! Your blocks are banked.');}else if((run.level||0)>0){mood='happy';message=say(`${run.level} blocs empilés · ${run.perfects||0} parfaits !`,`${run.level} blocks stacked · ${run.perfects||0} perfect!`);}}
  if(reveal&&['onesecond','chroma'].includes(gameId)){
   const error=run?.errors?.[party.attempt-1];if(error!==undefined){const close=error<=(gameId==='onesecond'?150:15000);mood=close?'happy':'oops';message=close?say('Dans un mouchoir ! Quel œil.','So close! Nicely judged.'):say('Petit décalage. À toi d’ajuster !','A little off. Time to fine-tune!');}
  }
  if(reveal&&gameId==='contrepied'){const result=party.contrepied?.history.slice(-1)[0];if(result){mood=result.winnerId===identity?'happy':result.winnerId===null?'wow':'oops';message=result.winnerId===identity?say(`BLUFF ! +${result.reward} points pour toi !`,`BLUFF! +${result.reward} points for you!`):result.winnerId===null?say('Même idée ! Égalité.','Same idea! A tie.'):say('Bien joué le rival. Garde un atout pour la suite.','Nice move, rival. Save a trump card for later.');}}
  if(reveal&&gameId==='garde'){const result=party.garde?.history.slice(-1)[0];if(result){const taken=result.damage[identity]||0;const dealt=Object.entries(result.damage).some(([id,n])=>id!==identity&&n>0);mood=taken?'oops':dealt?'happy':'focus';message=taken?say('POC ! La prochaine, on la bloque ?','BONK! Block the next one?'):dealt?say('PAF ! Ça, c’est bien placé !','POW! That landed nicely!'):say('Les boucliers tiennent. Prépare la suite !','Shields holding. Plan your next move!');}}
  if(reveal&&gameId==='ricochet'){const points=party.scores[identity]||0;mood=points>8500?'happy':points?'focus':'oops';message=points>8500?say('Au cœur de la cible ! Joli toucher.','Right near the bullseye! Nice touch.'):points?say('Le palet tient bon. Rapproche-toi du centre !','Puck still standing. Get closer to the centre!'):say('Oups, sortie de piste ! Ajuste la puissance.','Oops, off the board! Adjust your power.');}
  if(reveal&&gameId==='mat'){const result=party.mat?.results?.[identity];if(result){mood=result.mate?'happy':'oops';message=result.mate?say('ÉCHEC ET PATATE ! Le roi applaudit.','CHECK AND SPUD! The king approves.'):say('Le roi s’échappe. Observe les cases protégées.','The king escapes. Look at the protected squares.');}}
  if(reveal&&['trace','decoupe'].includes(gameId)){const result=party.drawing?.history.slice(-1)[0]?.results[identity];if(result){mood=result.score>=700?'happy':'oops';message=result.score>=900?say('Coup de maître !','Master stroke!'):result.score>=700?say('Propre ! La précision prend forme.','Nice! Your accuracy is taking shape.'):say('Un peu abstrait… le prochain sera le bon !','A little abstract… give the next one a go!');}}
 }
 if(moodOverride)mood=moodOverride;if(messageOverride)message=messageOverride;
 return <aside className={styles.reaction} data-testid="game-reaction" data-mood={mood}><div className={styles.portrait}><GameBuddy gameId={gameId} mood={mood}/></div><div className={styles.bubble}><b>{info[isFr?0:1]}</b><p>{message}</p></div></aside>;
}
