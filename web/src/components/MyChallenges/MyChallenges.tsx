import {publicUrl} from '../../platform/environment';
import {canShareLink,shareLink,copyText} from '../../platform/sharing';
import {COMPETITIVE_GAMES} from '../../gameplay/catalog';
import {hasScoreChallenge,preferredGame,prepareGameMode} from '../../gameplay/gameExperience';
import {useEffect,useState} from 'react';
import {ArrowRight,Copy,RefreshCw,RotateCcw,Share2} from 'lucide-react';
import {api,type OwnedLinkChallenge} from '../../api/client';
import {useGameStore} from '../../hooks/useGameStore';
import {GamePoster} from '../LiveGameArena/GamePoster';
import {gameLabel} from '../../gameplay/catalog';
import styles from './MyChallenges.module.css';

export const linkScore=(gameId:string,score:number,isFr=true)=>gameId==='onemore'?`${score} ${isFr?'blocs':'blocks'}`:gameId==='chroma'?`${(Math.abs(score)/1000).toFixed(1)} RGB`:`${(score/30).toFixed(1)}%`;

export function MyChallenges() {
    const {userId,clientId,language}=useGameStore(),isFr=language==='fr';
    const [challengeGame,setChallengeGame]=useState(()=>preferredGame('challenge','decoupe'));
    const [items,setItems]=useState<OwnedLinkChallenge[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
    const [revision,setRevision]=useState(0),[filter,setFilter]=useState('all'),[message,setMessage]=useState('');
    useEffect(()=>{
        if(!userId||!clientId)return;
        let stopped=false,timer=0;
        setItems([]);setLoading(true);setError('');
        async function refresh() {
            try {const data=await api.getMyChallenges(userId!,clientId!);if(!stopped){setItems(data.challenges);setError('');}}
            catch {if(!stopped)setError(isFr?'Resultats indisponibles. Reessaie.':'Results unavailable. Try again.');}
            finally {if(!stopped){setLoading(false);timer=window.setTimeout(refresh,10000);}}
        }
        void refresh();return()=>{stopped=true;clearTimeout(timer);};
    },[userId,clientId,revision,isFr]);
    async function share(item:OwnedLinkChallenge,native:boolean) {
        const url=`${publicUrl()}?tab=training&link=${item.id}&game=${item.gameId}`;
        try {if(native&&canShareLink())await shareLink({title:`${gameLabel(item.gameId,isFr)} - SLAP$TAX`,text:isFr?'Tu peux faire mieux ?':'Can you beat this?',url});
            else {await copyText(url);setMessage(isFr?'Lien copie':'Link copied');}}
        catch(e){if((e as Error).name!=='AbortError')setMessage(isFr?'Partage indisponible.':'Sharing unavailable.');}
    }
    const filtered=items.filter(item=>filter==='all'||(filter==='created'?item.isHost:!item.isHost));
    return <section className={styles.panel} data-testid="my-challenges">
        <header><h2>{isFr?'Mes defis':'My challenges'}</h2><button className={styles.historyLink} onClick={()=>useGameStore.getState().setActiveTab('stats')}>{isFr?'Historique':'History'}</button><button type="button" onClick={()=>setRevision(v=>v+1)} aria-label={isFr?'Actualiser les defis':'Refresh challenges'} title={isFr?'Actualiser les defis':'Refresh challenges'}><RefreshCw size={18}/></button></header>
        <p>{isFr?'Joue, partage ton score et laisse tes amis tenter de te battre. Chacun joue quand il veut.':'Play, share your score and let your friends try to beat it. Everyone plays in their own time.'}</p><div className={styles.filters} role="tablist" aria-label={isFr?'Filtrer les defis':'Filter challenges'}>{[['all','Tous','All'],['created','Crees','Created'],['played','Releves','Played']].map(([id,fr,en])=><button type="button" role="tab" aria-selected={filter===id} key={id} onClick={()=>setFilter(id)}>{isFr?fr:en}</button>)}</div>
        {error&&<p role="alert">{error}</p>}<p role="status">{message}</p>
        <div className={styles.composer} data-testid="challenge-composer"><label>{isFr?'Quel jeu pour régler vos comptes ?':'Which game settles the score?'}<select value={challengeGame} onChange={e=>setChallengeGame(e.target.value as typeof challengeGame)}>{COMPETITIVE_GAMES.map(g=><option key={g.id} value={g.id}>{gameLabel(g.id,isFr)}</option>)}</select></label><p>{hasScoreChallenge(challengeGame)?(isFr?'Un score calculé par le serveur, un lien valable 7 jours. Tes amis jouent quand ils veulent.':'A server-calculated score, a seven-day link. Friends play whenever they want.'):(isFr?'Ce jeu se joue en direct. Prépare une invitation par lien et retrouvez-vous dans le même duel.':'This game plays live. Prepare an invitation link and meet in the same duel.')}</p>{hasScoreChallenge(challengeGame)?<a href={`/?tab=training&link=new&game=${challengeGame}`}>{isFr?'Créer un challenge de score':'Create a score challenge'}<ArrowRight size={18}/></a>:<button onClick={()=>{prepareGameMode(challengeGame,'defy');useGameStore.getState().setActiveTab('defy');}}>{isFr?'Préparer une invitation en direct':'Prepare a live invitation'}<ArrowRight size={18}/></button>}</div>
        {loading?<p role="status">{isFr?'Chargement...':'Loading...'}</p>:!filtered.length&&!error?<p>{isFr?'Tes challenges partagés apparaîtront ici.':'Your shared challenges will appear here.'}</p>:null}
        {filtered.map(item=><article key={item.id} className={styles.challenge} data-testid="owned-challenge">
            <div className={styles.summary}><div className={styles.poster}><GamePoster gameId={item.gameId}/></div><div><h3>{gameLabel(item.gameId,isFr)}</h3><p>{item.isHost?(isFr?'Ton defi':'Your challenge'):item.hostName}</p><time>{new Date(item.createdAt).toLocaleDateString()}</time></div><strong>{item.expired?(isFr?'Expire':'Expired'):item.status==='done'?(isFr?'Termine':'Finished'):item.status==='playing'?(isFr?'En cours':'In progress'):(isFr?'A jouer':'Ready')}</strong></div>
            <p className={styles.count}>{item.finishedCount}/{item.participantCount} {isFr?'participations terminees':'completed entries'}{item.participantCount===1&&item.isHost?' · '+(isFr?'En attente d un ami':'Waiting for a friend'):''}</p>
            {item.standings.length>0?<details open={items.length===1}><summary>{isFr?'Classement du defi':'Challenge standings'}</summary><ol className={styles.standings}>{item.standings.map(player=><li key={player.userId} data-self={player.isSelf}><b>{player.rank}</b><span>{player.name}{player.isSelf?' · '+(isFr?'Toi':'You'):''}</span><strong>{linkScore(item.gameId,player.score,isFr)}</strong></li>)}</ol></details>:<p>{isFr?'Classement masque avant la fin de ta participation.':'Standings hidden until you finish.'}</p>}
            <div className={styles.actions}>{!item.expired&&<a href={`/?tab=training&link=${item.id}&game=${item.gameId}`}>{item.status==='done'?(isFr?'Mon resultat':'My result'):(isFr?'Jouer':'Play')}<ArrowRight size={16}/></a>}
                {!item.expired&&item.published&&<><button type="button" onClick={()=>void share(item,true)} title={isFr?'Partager le defi':'Share challenge'} aria-label={isFr?'Partager le defi':'Share challenge'}><Share2 size={17}/></button><button type="button" onClick={()=>void share(item,false)} title={isFr?'Copier le lien':'Copy link'} aria-label={isFr?'Copier le lien':'Copy link'}><Copy size={17}/></button></>}
                <a href={`/?tab=training&link=new&game=${item.gameId}`}><RotateCcw size={16}/>{isFr?'Revanche':'Rematch'}</a></div>
        </article>)}
    </section>;
}
