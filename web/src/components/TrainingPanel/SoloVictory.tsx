import {BADGES,soloMedal} from '../../gameplay/soloRewards';
import type {SoloReward} from '../../api/client';
import styles from './SoloVictory.module.css';
export function SoloVictory({result,best,isFr}:{result:{score:number;soloReward?:SoloReward};best:number;isFr:boolean}){
 const medal=soloMedal(result.score),r=result.soloReward;
 const title=isFr?{gold:'EN OR !',silver:'BIEN JOUÉ !',bronze:'ÇA PREND FORME !',starter:'À TOI LA SUITE !'}:{gold:'PURE GOLD!',silver:'NICE ONE!',bronze:'GETTING THERE!',starter:'KEEP EXPLORING!'};
 const target=result.score<400?400:result.score<700?700:result.score<900?900:null;
 return <div className={styles.victory} data-testid="solo-victory" data-medal={medal}>
  <div className={styles.medal} aria-hidden="true">{medal==='gold'?'★':medal==='silver'?'✦':medal==='bronze'?'◆':'↗'}</div>
  <h3>{title[medal]}</h3>
  <div className={styles.stars} aria-label={isFr?`${medal==='gold'?3:medal==='silver'?2:medal==='bronze'?1:0} étoiles`:`${medal==='gold'?3:medal==='silver'?2:medal==='bronze'?1:0} stars`}>{[400,700,900].map(n=><span key={n} data-earned={result.score>=n}>★</span>)}</div>
  {r&&<div className={styles.receipt} role="status">
   {r.xpGain>0&&<strong>+{r.xpGain} XP</strong>}
   {r.newBest&&r.previousBest>0&&<span>{isFr?`Record battu : +${result.score-r.previousBest} pts`:`Personal best: +${result.score-r.previousBest} pts`}</span>}
   {r.levelUp&&<b>{isFr?'Niveau':'Level'} {r.level} !</b>}
   {r.dailyCompleted&&<span>{isFr?'Parcours terminé · bonus de 90 XP inclus !':'Route complete · 90 XP bonus included!'}</span>}
   {r.badges.map(id=><span className={styles.badge} key={id}>{BADGES[id]?.icon} {isFr?'Badge gagné :':'Badge earned:'} {isFr?BADGES[id]?.fr:BADGES[id]?.en}</span>)}
   {r.unlocked.length>0&&<span>{isFr?'Nouveau cosmétique disponible dans ton profil !':'New cosmetic available in your profile!'}</span>}
  </div>}
  <div className={styles.mastery} aria-label={isFr?'Progression vers les étoiles':'Star progress'}><div role="progressbar" aria-label={isFr?'Score de maîtrise':'Mastery score'} aria-valuemin={0} aria-valuemax={1000} aria-valuenow={Math.max(0,Math.min(1000,Math.round(result.score)))}><i style={{width:`${Math.max(0,Math.min(100,result.score/10))}%`}}/>{[400,700,900].map(n=><span key={n} style={{left:`${n/10}%`}} data-earned={result.score>=n}>★</span>)}</div><small>{Math.round(result.score)} / 1 000</small></div>
  {target&&<p>{isFr?`Prochaine étoile : ${target} pts · encore ${target-result.score} à gagner.`:`Next star: ${target} pts · ${target-result.score} to go.`}</p>}
  {!target&&<p>{isFr?'Trois étoiles ! Partage ton score à battre.':'Three stars! Share a score to beat.'}</p>}
  {!r&&result.score>best&&best>0&&<p>{isFr?`Tu as gagné ${result.score-best} points sur ton record.`:`You beat your record by ${result.score-best} points.`}</p>}
 </div>;
}
