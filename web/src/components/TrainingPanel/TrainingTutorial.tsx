import {useState} from 'react';
import {gameLabel,simpleGoal,type CompetitiveGameId} from '../../gameplay/catalog';
import {gameControls} from '../../gameplay/gameControls';
import styles from './TrainingTutorial.module.css';
export function TrainingTutorial({gameId,isFr:fr,isParty,onClose}:{gameId:CompetitiveGameId;isFr:boolean;isParty:boolean;onClose:()=>void}){
 const [step,setStep]=useState(0);
 const steps=[
  {title:fr?'1 · Le défi':'1 · The challenge',text:`${gameLabel(gameId,fr)} · ${simpleGoal(gameId,fr)}`},
  {title:fr?'2 · Ton geste':'2 · Your move',text:gameControls(gameId,fr,matchMedia('(pointer:coarse)').matches)},
  {title:fr?'3 · À ton rythme':'3 · At your own pace',text:isParty?(fr?'Cette épreuve utilise les mêmes règles à chaque essai. Les robots sont indiqués lorsqu’ils participent.':'This trial uses the same rules every time. Robots are labelled when present.'):(fr?'Choisis Tranquille, Standard ou Intense avant de commencer. Ton record est conservé pour chaque niveau.':'Choose Relaxed, Standard or Intense before starting. Your best is saved for each level.')},
  {title:fr?'4 · La revanche':'4 · Run it back',text:fr?'Lance la manche avec le bouton de départ. Compare ton score à ton record, puis prends ta revanche. Les succès de cet appareil sont dans Historique.':'Start with the play button. Compare your score with your best, then run it back. Device achievements are in History.'},
 ];
 return <section className={styles.guide} aria-label={fr?'Tutoriel d’entraînement':'Training tutorial'} data-testid="training-tutorial"><div className={styles.steps} aria-hidden="true">{steps.map((_,i)=><i key={i} data-current={i<=step}/>)}</div><div aria-live="polite"><h3>{steps[step].title}</h3><p>{steps[step].text}</p></div><div className={styles.actions}><button type="button" onClick={onClose}>{fr?'Passer le guide':'Skip guide'}</button><div><button type="button" disabled={step===0} onClick={()=>setStep(n=>n-1)}>{fr?'Précédent':'Back'}</button><button type="button" onClick={()=>step===3?onClose():setStep(n=>n+1)}>{step===3?(fr?'C’est parti':'Let’s play'):(fr?'Suivant':'Next')}</button></div></div></section>;
}
