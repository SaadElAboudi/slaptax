import {useEffect} from 'react';
import {useGameStore} from '../../hooks/useGameStore';
import {ACHIEVEMENTS,useAchievements} from '../../hooks/useAchievements';
import styles from './AchievementsDisplay.module.css';
export function AchievementsDisplay(){
 const {userId,language}=useGameStore(),fr=language==='fr';const progress=useAchievements(s=>userId?s.profiles[userId]:undefined);
 return <section className={styles.list} data-testid="achievements"><header><h2>{fr?'Tes succès':'Your achievements'}</h2><p>{fr?'Sur cet appareil, pour ce profil. Aucun bonus de jetons associé.':'On this device, for this profile. No token rewards attached.'}</p></header><div>{ACHIEVEMENTS.map(a=><article key={a.id} data-unlocked={progress?.unlocked[a.id]!==undefined}><span aria-hidden="true">{progress?.unlocked[a.id]!==undefined?'★':'○'}</span><div><strong>{fr?a.fr:a.en}</strong><p>{fr?a.goalFr:a.goalEn}</p><small>{progress?.unlocked[a.id]!==undefined?(fr?'Débloqué':'Unlocked'):(fr?'À débloquer':'Locked')}</small></div></article>)}</div></section>;
}
export function AchievementToast(){
 const {userId,language}=useGameStore(),fr=language==='fr';const notice=useAchievements(s=>s.notice),dismiss=useAchievements(s=>s.dismiss);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(dismiss,6000);return()=>clearTimeout(timer);},[notice,dismiss]);
 if(!notice||notice.userId!==userId)return null;
 return <aside className={styles.toast} role="status"><strong>{fr?'Succès débloqué':'Achievement unlocked'} · {notice.ids.map(id=>{const a=ACHIEVEMENTS.find(a=>a.id===id)!;return fr?a.fr:a.en;}).join(' · ')}</strong><button type="button" onClick={dismiss} aria-label={fr?'Fermer la notification':'Dismiss notification'}>×</button></aside>;
}
