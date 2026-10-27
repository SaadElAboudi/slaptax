import {Check,ChevronRight,Star,Trophy} from 'lucide-react';
import {useGameStore} from '../../hooks/useGameStore';
import {BADGES} from '../../gameplay/soloRewards';
import {gameLabel,type CompetitiveGameId} from '../../gameplay/catalog';
import {GamePoster} from '../LiveGameArena/GamePoster';
import styles from './SoloJourney.module.css';
export function SoloJourney({onPlay}:{onPlay:(id:CompetitiveGameId)=>void}){
 const {progression,language}=useGameStore(),fr=language==='fr';const solo=progression?.solo;
 if(!solo||!progression)return null;
 const done=solo.daily.completed.length,total=solo.daily.games.length;
 const next=solo.daily.games.find(id=>!solo.daily.completed.includes(id));
 const base=120*(progression.level-1)**2,ceiling=120*progression.level**2;
 const percent=Math.max(0,Math.min(100,(progression.xp-base)/(ceiling-base)*100));
 return <section className={styles.journey} data-testid="solo-journey">
  <header><div><span><Star size={14}/>{fr?'TON PETIT RENDEZ-VOUS':'YOUR DAILY PLAYGROUND'}</span><h2>{solo.daily.rewarded?(done===total?(fr?'Le trio est dans la poche !':'Triple complete!'):(fr?'Ton bonus du jour est déjà gagné !':'Today’s bonus is already earned!')):(fr?'Trois jeux. À toi de briller.':'Three games. Your time to shine.')}</h2></div><strong>{done}/{total}</strong></header>
  <div className={styles.route}>{solo.daily.games.map((id,i)=>{
   const complete=solo.daily.completed.includes(id);
   return <button type="button" key={id} onClick={()=>onPlay(id as CompetitiveGameId)} data-complete={complete} aria-label={`${fr?'Jouer le parcours':'Play daily route'} : ${gameLabel(id,fr)}${complete?(fr?' · terminé':' · complete'):''}`}>
    <div className={styles.art}><GamePoster gameId={id}/><b>{complete?<Check size={18}/>:i+1}</b></div><strong>{gameLabel(id,fr)}</strong><span>{complete?(fr?'Terminé ✓':'Complete ✓'):(fr?'À toi de jouer':'Your turn')}</span>
   </button>;
  })}</div>
  <div className={styles.reward}><Trophy size={23}/><div><strong>{solo.badges.includes('daily-tour')?(fr?'+90 XP pour le trio':'+90 XP for the trio'):(fr?'+90 XP et un badge pour le trio':'+90 XP and a badge for the trio')}</strong><span>{fr?'Termine chaque jeu avec un score. Tes badges restent acquis.':'Finish each game with a score. Your badges stay yours.'}</span></div>{next&&<button type="button" onClick={()=>onPlay(next as CompetitiveGameId)}>{done?(fr?'Continuer':'Continue'):(fr?'C’est parti':'Let’s go')}<ChevronRight size={17}/></button>}</div>
  <div className={styles.level}><b>{fr?'NIVEAU':'LEVEL'} {progression.level}</b><div role="progressbar" aria-label={fr?'Progression vers le prochain niveau':'Progress towards next level'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><i style={{width:`${percent}%`}}/></div><span>{Math.max(0,ceiling-progression.xp)} XP → {progression.level+1}</span></div>
  <p className={styles.note}>{fr?'15 XP sur tes 3 premières parties solo avec un score du jour. Nouveau trio chaque jour (UTC).':'15 XP for your first 3 scored solo games today. New trio every day (UTC).'}</p>
  <details className={styles.collection}><summary>{fr?'Ma collection':'My collection'}<span>{solo.badges.length}/{Object.keys(BADGES).length} {fr?'badges':'badges'}</span></summary><div>{Object.entries(BADGES).map(([id,b])=><article key={id} data-earned={solo.badges.includes(id)}><b aria-hidden="true">{b.icon}</b><strong>{fr?b.fr:b.en}</strong><p>{fr?b.goalFr:b.goalEn}</p><span>{solo.badges.includes(id)?(fr?'Gagné ✓':'Earned ✓'):(fr?'À découvrir':'To discover')}</span></article>)}</div></details>
 </section>;
}
