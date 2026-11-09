import {useEffect,useState} from 'react';
import {ArrowRight,Play,Swords,Users,Trophy,History} from 'lucide-react';
import {api} from '../../api/client';
import {useRealtime} from '../../api/realtime';
import {COMPETITIVE_GAMES,gameHook,simpleGoal,type CompetitiveGameId} from '../../gameplay/catalog';
import {hasScoreChallenge,prepareGameMode} from '../../gameplay/gameExperience';
import {GamePoster} from '../LiveGameArena/GamePoster';
import {useGameStore,type Tab} from '../../hooks/useGameStore';
import styles from './ArenaHome.module.css';

export function ArenaHome({onEnter}:{onEnter:(tab:Tab)=>void}) {
    const {language,userId}=useGameStore();
    const fr=language==='fr';
    const [resume,setResume]=useState<Tab|null>(null);
    const [incoming,setIncoming]=useState(0);
    const [revision,setRevision]=useState(0);
    const [roomCode,setRoomCode]=useState('');
    // Presence updates do not need a full refresh of matches and invitations.
    useRealtime(userId,event=>{if(event.type==='state.changed'||event.type==='connected')setRevision(v=>v+1);});
    useEffect(()=>{
        if(!userId)return;
        let stopped=false;
        const timer=window.setTimeout(()=>{
            Promise.all([api.getActiveLiveDuel(userId),api.getActiveLiveTournament(userId),api.listChallenges(userId,'pending')])
                .then(([duel,tournament,challenges])=>{
                    if(stopped)return;
                    setResume(duel.match?'defy':tournament.tournament?'tournament':null);
                    setIncoming(challenges.challenges.filter(c=>c.direction==='incoming').length);
                }).catch(()=>undefined);
        },200);
        return()=>{stopped=true;clearTimeout(timer);};
    },[userId,revision]);
    function play(id:CompetitiveGameId){prepareGameMode(id,'training');onEnter('training');}
    function live(id:CompetitiveGameId){prepareGameMode(id,'defy');onEnter('defy');}
    function teams(){const url=new URL(location.href);url.searchParams.delete('mode');url.searchParams.delete('room');window.history.replaceState({},'',url);onEnter('team');}
    function join(){
        if(!/^[A-F0-9]{6}$/.test(roomCode))return;
        const url=new URL(location.href);url.searchParams.set('room',roomCode);url.searchParams.delete('mode');window.history.replaceState({},'',url);onEnter('team');
    }
    return <section className={styles.home} data-testid="club-home">
        <header className={styles.intro}><span className={styles.eyebrow}>SLAP TAX · {fr?'LES DÉFIS ENTRE AMIS':'FRIEND CHALLENGES'}</span><h1>{fr?'Tu peux faire mieux ?':'Can you do better?'}</h1><p>{fr?'Joue. Défie un ami. Prends ta revanche.':'Play. Challenge a friend. Run it back.'}</p></header>
        {(resume||incoming>0)&&<div className={styles.resume} role="status"><span>{resume?(fr?'Ta partie t’attend.':'Your match is waiting.'):`${incoming} ${fr?'défi(s) reçu(s)':'incoming challenge(s)'}`}</span><button type="button" onClick={()=>onEnter(resume||'defy')}>{fr?'Reprendre':'Resume'}<ArrowRight size={18}/></button></div>}
        <section className={styles.hero} aria-label={fr?'Commencer à jouer':'Start playing'}>
            <div className={styles.heroCopy}><span className={styles.sticker}>{fr?'LA COMPÉTITION DES POTES':'THE FRIENDS’ COMPETITION'}</span><h2>{fr?'4 amis. 3 épreuves. Un vainqueur.':'4 friends. 3 trials. One winner.'}</h2><p>{fr?'Avance… STOP !, La forme fragile, puis la finale sur la table. Chacun sur son téléphone.':'Go… STOP!, Fragile Shape, then the table final. Each on their own phone.'}</p><button className={styles.heroButton} type="button" onClick={()=>{const url=new URL(location.href);url.searchParams.delete('room');history.replaceState({},'',url);onEnter('survival');}}><Play size={21} fill="currentColor"/>{fr?'Jouer à quatre':'Play with four'}<ArrowRight size={20}/></button><button className={styles.soloButton} type="button" onClick={()=>onEnter('survival')}>{fr?'M’entraîner contre des robots':'Practice against robots'}</button><small>{fr?'Les éliminés restent spectateurs. Revanche avec le même groupe.':'Eliminated players spectate. Rematch with the same group.'}</small></div>
            <div className={styles.heroArt} aria-hidden="true"><GamePoster gameId="stopgo"/></div>
        </section>
        <section className={styles.library} id="games" aria-labelledby="games-heading">
            <header><h2 id="games-heading">{fr?'Six jeux. À toi de choisir.':'Six games. Take your pick.'}</h2></header>
            <div className={styles.libraryGrid}>
                {COMPETITIVE_GAMES.map(game=><article key={game.id} data-game={game.id}>
                    <div className={styles.art} aria-hidden="true"><GamePoster gameId={game.id}/></div>
                    <div className={styles.caption}><span className={styles.tag}>{hasScoreChallenge(game.id)?(fr?'À TON RYTHME':'IN YOUR OWN TIME'):(fr?'EN DIRECT':'LIVE PLAY')}</span><h3>{fr?game.labelFr:game.labelEn}</h3><p>{simpleGoal(game.id,fr)||gameHook(game.id,fr)}</p>
                    <div className={styles.actions}><button type="button" onClick={()=>play(game.id)} aria-label={`${fr?'Jouer':'Play'} ${fr?game.labelFr:game.labelEn}`}><Play size={16}/>{fr?'Jouer seul':'Play solo'}</button>
                    {hasScoreChallenge(game.id)?<a href={`/?tab=training&link=new&game=${game.id}`} aria-label={`${fr?'Défier un ami':'Challenge a friend'} : ${fr?game.labelFr:game.labelEn}`}><Swords size={16}/>{fr?'Défier un ami':'Challenge a friend'}</a>:<button type="button" onClick={()=>live(game.id)} aria-label={`${fr?'Jouer en direct':'Play live'} : ${fr?game.labelFr:game.labelEn}`}><Swords size={16}/>{fr?'Avec un ami':'With a friend'}</button>}</div></div>
                </article>)}
            </div>
        </section>
        <details className={styles.friendsHub}><summary><Users size={20}/>{fr?'Ou jouer en équipes : Braquage 2v2':'Or play in teams: Snack Heist 2v2'}</summary><p>{fr?'Deux équipes s’affrontent au Braquage du Goûter.':'Two teams face off in Snack Heist.'}</p><button className={styles.groupButton} type="button" onClick={teams}>{fr?'Créer un salon à quatre':'Create a four-player room'}<ArrowRight size={18}/></button>
            <form className={styles.joinForm} onSubmit={e=>{e.preventDefault();join();}}><label htmlFor="home-room-code">{fr?'Rejoindre avec un code':'Join with a code'}</label><div><input id="home-room-code" placeholder="A1B2C3" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={6} value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,''))}/><button type="submit" disabled={roomCode.length!==6}>{fr?'Rejoindre':'Join'}<ArrowRight size={18}/></button></div></form>
        </details>
        <nav className={styles.footer} aria-label={fr?'Tes résultats':'Your results'}><button type="button" onClick={()=>onEnter('tournament')}><Trophy size={18}/>{fr?'Tournois en duel':'Duel tournaments'}</button><button type="button" onClick={()=>onEnter('leaderboard')}><Trophy size={18}/>{fr?'Classement':'Leaderboard'}</button><button type="button" onClick={()=>onEnter('stats')}><History size={18}/>{fr?'Historique':'History'}</button></nav>
    </section>;
}
