import {factoryEpisode,factoryAftermath} from '../../gameplay/factoryComedy';
import {readPracticeHistory} from '../../gameplay/practiceHistory';
import {CENTRAL_GAME,worldName,worldPremise,gameChapter} from '../../gameplay/world';
import {prepareGameMode} from '../../gameplay/gameExperience';
import {SoloJourney} from '../SoloJourney/SoloJourney';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, Play, Swords, Trophy, RotateCcw, Users, History, Zap, Link } from 'lucide-react';
import { api, type RivalryResponse } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { gameLabel, gameHook, COMPETITIVE_GAMES, GAME_CATEGORIES, type CompetitiveGameId } from '../../gameplay/catalog';
import { GamePoster } from '../LiveGameArena/GamePoster';
import { ClubAvatar } from '../ClubAvatar/ClubAvatar';
import { OnlinePlayers } from './OnlinePlayers';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import styles from './ArenaHome.module.css';

const GameGuide=lazy(()=>import('../GameGuide/GameGuide').then(m=>({default:m.GameGuide})));

interface ArenaHomeProps { onEnter: (tab: Tab) => void }

export function ArenaHome({ onEnter }: ArenaHomeProps) {
    const { language, userId, playerName, history, favoriteRivalId, progression } = useGameStore();
    const isFr = language === 'fr';
    const practices=readPracticeHistory(userId||'');
    const completed=history.length+practices.length;
    const episode=factoryEpisode(completed);
    const [activeDuel, setActiveDuel] = useState(false);
    const [activeTournament, setActiveTournament] = useState(false);
    const [queued, setQueued] = useState(false);
    const [incoming, setIncoming] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [guide,setGuide]=useState<CompetitiveGameId|null>(null);
    const [category, setCategory] = useState('featured');
    const [roomCode, setRoomCode] = useState('');
    const [tick, setTick] = useState(0);
    const [presenceRevision, setPresenceRevision] = useState(0);
    const [rivalry, setRivalry] = useState<RivalryResponse | null>(null);
    const rival = history.find((entry) => entry.opponentId === favoriteRivalId && entry.opponentName)
        || history.find((entry) => entry.opponentId && entry.opponentName);
    useRealtime(userId, event => {
        setTick(value => value + 1);
        if (event.type === 'connected' || event.type === 'presence.changed') setPresenceRevision(value => value + 1);
    });
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        Promise.all([api.getActiveLiveDuel(userId), api.getActiveLiveTournament(userId), api.getMatchmakingStatus(userId), api.listChallenges(userId, 'pending')])
            .then(([duel, tournament, queue, challenges]) => {
                if (cancelled) return;
                setActiveDuel(Boolean(duel.match)); setActiveTournament(Boolean(tournament.tournament));
                setQueued(queue.status !== 'idle');
                setIncoming(challenges.challenges.filter((entry) => entry.direction === 'incoming').length);
            }).catch(() => undefined);
        if (rival?.opponentId) api.getRivalry(userId, rival.opponentId).then((value) => { if (!cancelled) setRivalry(value); }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [userId, tick, rival?.opponentId]);

    function enter(gameId: CompetitiveGameId, tab: 'training' | 'defy') {
        prepareGameMode(gameId,tab);
        onEnter(tab);
    }
    async function quickPlay() {
        if (!userId || busy) return;
        if (queued || activeDuel) { onEnter('defy'); return; }
        setBusy(true); setError('');
        try {
            void api.trackProductEvent('quick_play_clicked', userId, { source: 'signature_home' }).catch(() => undefined);
            await api.joinMatchmaking(userId, 2, 'snack'); onEnter('defy');
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Connection unavailable'); }
        finally { setBusy(false); }
    }
    async function rematch() {
        if (!userId || !rival?.opponentId || busy) return;
        setBusy(true); setError('');
        try { await api.createChallenge(userId, rival.opponentId, 2, isFr ? 'On remet ca ?' : 'Run it back?'); onEnter('defy'); }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Connection unavailable'); }
        finally { setBusy(false); }
    }
    function openNight(){const url=new URL(location.href);url.searchParams.set('mode','night');url.searchParams.delete('room');window.history.replaceState({},'',url);onEnter('team');}
    function joinRoom() {
        if (!/^[A-F0-9]{6}$/.test(roomCode)) return;
        const url = new URL(location.href);
        url.searchParams.set('room', roomCode);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url);
        onEnter('team');
    }
    function openTeams() {
        const url = new URL(location.href);
        url.searchParams.delete('mode');
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url);
        onEnter('team');
    }
    const games=COMPETITIVE_GAMES;
    const visibleGames = games.filter(g => category === 'all' || category === 'featured' && ['snack','pie','table','toilet'].includes(g.id) || GAME_CATEGORIES.find(c => c.id === category)?.games.some(id => id === g.id));
    return <section className={styles.home} data-testid="club-home">
        <header className={styles.intro}>
            <div><span className={styles.eyebrow}>{isFr?'LA MANUFACTURE SLAPTAX':'THE SLAPTAX FACTORY'}</span><h1>{isFr?'Bons amis. Mauvais perdants.':'Good friends. Bad losers.'}</h1></div>
            <div className={styles.identity}><ClubAvatar variant={progression?.cosmetics.avatar}/><div><span>{isFr?'DANS LE CLUB':'IN THE CLUB'}</span><strong>{playerName}</strong></div></div>
        </header>
        {(activeDuel||activeTournament||incoming>0)&&<div className={styles.resume} role="status"><span>{incoming?`${incoming} ${isFr?'défi(s) en attente':'pending challenge(s)'}`:isFr?'Ta partie t’attend !':'Your match is waiting!'}</span><button type="button" onClick={()=>onEnter(activeTournament&&!activeDuel?'tournament':'defy')}>{isFr?'Reprendre':'Resume'}<ArrowRight size={18}/></button></div>}
        <div className={styles.hero}>
            <div className={styles.heroCopy}><span className={styles.sticker}><Zap size={15}/>{isFr?'ARÈNE CENTRALE · LA CANTINE':'MAIN ARENA · THE CANTEEN'}</span><h2>{isFr?<>Braquage<br/><em>du Goûter.</em></>:<>Snack<br/><em>Heist.</em></>}</h2><p>{worldPremise(isFr)}</p><button className={styles.heroButton} onClick={()=>enter(CENTRAL_GAME,'defy')} type="button"><Play size={23} fill="currentColor"/>{isFr?'Défier un pote au Braquage':'Challenge a friend to a heist'}<ArrowRight size={22}/></button><span className={styles.heroNote}>{`${isFr?'3 CAISSES · UN STICK · BAFFE / LANCE':'3 CRATES · ONE STICK · SLAP / THROW'}`}</span></div>
            <div className={`${styles.heroArt} ${styles.snackArt}`} aria-hidden="true"><GamePoster gameId="snack"/><span className={styles.speech}>{isFr?'C’EST MON GOÛTER !':'THAT’S MY SNACK!'}</span></div>
        </div>
        <section className={styles.friendsHub} aria-label={isFr?'Retrouver mes amis':'Find my friends'}>
            <form className={styles.joinForm} onSubmit={event=>{event.preventDefault();joinRoom();}}>
                <label htmlFor="home-room-code"><Users size={19}/>{isFr?'Tes amis sont déjà là ?':'Friends already playing?'}</label>
                <p id="home-code-help">{isFr?'Leur code suffit pour rejoindre le salon.':'Join their room with its six-character code.'}</p>
                <div><input id="home-room-code" aria-describedby="home-code-help" placeholder="A1B2C3" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={6} value={roomCode} onChange={event=>setRoomCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g,''))}/><button type="submit" disabled={roomCode.length!==6}>{isFr?'Rejoindre':'Join'}<ArrowRight size={18}/></button></div>
            </form>
            <div className={styles.alternatePlay}>
                <button type="button" aria-label={isFr?'Créer une soirée à quatre':'Create a four-friend night'} onClick={openNight}><Users size={21}/><span>{isFr?'Créer une soirée à quatre':'Create a four-friend night'}<small>{isFr?'Braquage, tartes et entrepôt. Trois manches sans mise.':'Heist, pies and warehouse. Three rounds, no stakes.'}</small></span><ArrowRight size={18}/></button>
                <button type="button" aria-label={isFr?'Jouer entre amis · 2v2':'Play with friends · 2v2'} onClick={openTeams}><Users size={21}/><span>{isFr?'Jouer entre amis · 2v2':'Play with friends · 2v2'}<small>{isFr?'Deux équipes. Un goûter à voler.':'Two teams. One snack to steal.'}</small></span><ArrowRight size={18}/></button>
                <button type="button" aria-label={isFr?'Découvrir l’arène en solo':'Learn the arena solo'} onClick={()=>enter('snack','training')}><Play size={21}/><span>{isFr?'Découvrir l’arène en solo':'Learn the arena solo'}<small>{isFr?'Teste les commandes à ton rythme.':'Learn the controls at your own pace.'}</small></span><ArrowRight size={18}/></button>
            </div>
        </section>
        <section className={styles.episode} data-testid="factory-episode" aria-label={isFr?'Le feuilleton de la brigade':'The crew’s serial'}>
            <span>{isFr?'LE FEUILLETON DE LA BRIGADE':'THE CREW’S SERIAL'}</span>
            <h2>{isFr?episode.fr:episode.en}</h2><p>{isFr?episode.lineFr:episode.lineEn}</p>
            {practices[0]&&<small>{isFr?'Dernier incident : ':'Last incident: '}{factoryAftermath(practices[0].gameId,isFr)}</small>}
            <button onClick={()=>enter(episode.game,'training')}>{isFr?'Jouer cet épisode':'Play this episode'}<ArrowRight size={16}/></button>
            <small>{isFr?'Un clin d’œil à tes parties terminées. Tous les ateliers restent accessibles.':'A nod to your completed games. Every workshop remains available.'}</small>
        </section>
        <section className={styles.worldRoute} aria-label={isFr?'L’histoire de la Manufacture':'The factory story'} data-testid="factory-story"><div><span>{worldName(isFr)}</span><h2>{isFr?'Une brigade. Toute une usine à défier.':'One crew. A whole factory to challenge.'}</h2><p>{isFr?'La Cantine est votre arène. Les ateliers sont vos terrains de revanche : chaque défi raconte un autre incident du même casse.':'The Canteen is your arena. The workshops are your rematch grounds: every challenge tells another incident from the same heist.'}</p></div><ol>{['snack','decoupe','onemore','bombpass'].map(id=><li key={id}><b>{gameChapter(id,isFr)?.place}</b><span>{gameChapter(id,isFr)?.title}</span><button onClick={()=>enter(id as CompetitiveGameId,'training')}>{id==='snack'?(isFr?'Entrer à la Cantine':'Enter the Canteen'):(isFr?'Essayer le défi':'Try the challenge')}<ArrowRight size={15}/></button></li>)}</ol></section>
        <section className={styles.newGame} aria-label={isFr?'Nouveau jeu : Poule Position':'New game: Poultry Panic'}>
            <div className={styles.newGameArt}><GamePoster gameId="chicken"/></div>
            <div><span>{isFr?'LES DÉFIS DE LA FERME ROYALE':'ROYAL FARM CHALLENGES'}</span><h2>{isFr?'Poule Position':'Poultry Panic'}</h2><p>{gameChapter('chicken',isFr)?.story}</p><div><button type="button" onClick={()=>enter('chicken','training')}><Play size={17}/>{isFr?'Essayer Poule Position':'Try Poultry Panic'}</button><button type="button" onClick={()=>enter('chicken','defy')}><Swords size={17}/>{isFr?'Défier un pote':'Challenge a friend'}</button></div></div>
        </section>
        <div className={styles.sectionHeading}><h2>{isFr?'À toi de jouer':'Your next move'}</h2><p>{isFr?'En solo, en duel ou avec toute la bande.':'Solo, head to head or with the whole crew.'}</p></div>
        <div className={styles.modeRail} aria-label={isFr?'Les quatre modes de jeu':'The four game modes'}>{[{id:'training' as const,fr:'Entraînement',en:'Practice',icon:Play,tipFr:'Apprends les gestes',tipEn:'Learn the moves'},{id:'defy' as const,fr:'Défis entre amis',en:'Friend duels',icon:Swords,tipFr:'Jouez en direct',tipEn:'Play live'},{id:'challenges' as const,fr:'Challenges',en:'Challenges',icon:Link,tipFr:'Invite ou bats un score',tipEn:'Invite or beat a score'},{id:'tournament' as const,fr:'Tournois',en:'Tournaments',icon:Trophy,tipFr:'Votre coupe entre potes',tipEn:'Your friends’ cup'}].map(m=><button key={m.id} type="button" onClick={()=>onEnter(m.id)}><m.icon size={25}/><strong>{isFr?m.fr:m.en}</strong><small>{isFr?m.tipFr:m.tipEn}</small></button>)}</div>
        <div className={styles.presence}><OnlinePlayers isFr={isFr} revision={presenceRevision}/><button type="button" disabled={!userId||busy} onClick={()=>void quickPlay()}><Users size={15}/>{busy?'…':queued?(isFr?'Reprendre la recherche':'Resume search'):(isFr?'Trouver un adversaire':'Find an opponent')}</button></div>
        {rival&&<div className={styles.rival}><div className={styles.rivalAvatar}><ClubAvatar rival/></div><div><span>{isFr?'UNE AFFAIRE ENTRE VOUS':'UNFINISHED BUSINESS'}</span><strong>{rival.opponentName}</strong></div>{rivalry?.season&&<b>{rivalry.season.wins[userId||'']||0}<i>:</i>{rivalry.season.wins[rival.opponentId||'']||0}</b>}<button type="button" disabled={busy} onClick={()=>void rematch()}><RotateCcw size={18}/>{isFr?'Revanche':'Rematch'}</button></div>}
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        <SoloJourney onPlay={id=>enter(id,'training')}/>
        <section className={styles.library}>
            <header><h2>{category==='featured'?(isFr?'La Cantine et les ateliers':'The Canteen and the workshops'):(isFr?'Choisis ton prochain délire':'Pick your next game')}</h2><span aria-live="polite">{visibleGames.length} {isFr?'JEUX':'GAMES'}</span></header>
            <div className={styles.categories} role="tablist" aria-label={isFr?'Categories de jeux':'Game categories'}>{[{id:'featured',fr:'Les incontournables',en:'The featured games'},{id:'all',fr:'Tous · jeux bonus',en:'All · bonus games'},...GAME_CATEGORIES].map(c=><button type="button" role="tab" aria-selected={category===c.id} key={c.id} onClick={()=>setCategory(c.id)}>{isFr?c.fr:c.en}</button>)}</div>
            <div className={styles.libraryGrid} role="tabpanel">
                {visibleGames.map(game=><article key={game.id} data-game={game.id}>
                    <div className={styles.art}><button className={styles.guideArt} onClick={()=>setGuide(game.id)} aria-label={`${isFr?'Découvrir':'Discover'} ${gameLabel(game.id,isFr)}`}><GamePoster gameId={game.id}/><span>{isFr?'MODES & ASTUCES':'MODES & TIPS'}</span></button>{['pigeon','lift','toilet','table','garde'].includes(game.id)&&<span className={styles.featured}>{game.id==='pigeon'?(isFr?'NOUVEAU · LIVRAISON !':'NEW · DELIVERY!'):game.id==='lift'?(isFr?'NOUVEAU · QUI A PROUTÉ ?':'NEW · WHO FARTED?'):game.id==='toilet'?(isFr?'NOUVEAU · PROUT !':'NEW · PFFT!'):game.id==='garde'?(isFr?'BANANE & POÊLE':'BANANA & PAN'):(isFr?'NAPPE-OCALYPSE':'TABLECLOTH CHAOS')}</span>}</div>
                    <div className={styles.caption}><div><span>{isFr?game.skillFr:game.skillEn}</span><h3>{isFr?game.labelFr:game.labelEn}</h3><p className={styles.gameHook}>{gameChapter(game.id,isFr)?.story||gameHook(game.id,isFr)}</p></div><div className={styles.actions}>
                        <button type="button" onClick={()=>enter(game.id,'training')} title={isFr?'Jouer solo':'Play solo'} aria-label={`${isFr?'Jouer':'Play'} ${gameLabel(game.id,isFr)}`}><Play size={15} fill="currentColor"/>{isFr?'Jouer':'Play'}</button>
                        <button type="button" onClick={()=>enter(game.id,'defy')} title={isFr?'Defier un ami':'Challenge a friend'} aria-label={`${isFr?'Defier':'Challenge'}: ${isFr?game.labelFr:game.labelEn}`}><Swords size={15}/>{isFr?'Défier':'Challenge'}</button>
                    </div></div>
                </article>)}
            </div>
        </section>
        {guide&&<Suspense fallback={<p role="status">{isFr?'Ouverture du jeu…':'Opening game…'}</p>}><GameGuide gameId={guide} isFr={isFr} onClose={()=>setGuide(null)} onEnter={onEnter}/></Suspense>}
        <nav className={styles.footer}><button type="button" onClick={()=>onEnter('leaderboard')}><Trophy size={17}/>{isFr?'Classement':'Leaderboard'}</button><button type="button" onClick={()=>onEnter('stats')}><History size={17}/>{isFr?'Historique':'History'}</button><span>PLAY. LOSE. REMATCH.</span></nav>
    </section>;
}
