import {GameBuddy} from '../GameBuddy/GameBuddy';
import {SoloJourney} from '../SoloJourney/SoloJourney';
import { useEffect, useState } from 'react';
import { ArrowRight, Play, Swords, Trophy, RotateCcw, Users, History, Zap, Link } from 'lucide-react';
import { api, type RivalryResponse } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { gameLabel, gameHook, COMPETITIVE_GAMES, GAME_CATEGORIES, type CompetitiveGameId } from '../../gameplay/catalog';
import { GamePoster } from '../LiveGameArena/GamePoster';
import { ClubAvatar } from '../ClubAvatar/ClubAvatar';
import { OnlinePlayers } from './OnlinePlayers';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import styles from './ArenaHome.module.css';

interface ArenaHomeProps { onEnter: (tab: Tab) => void }

export function ArenaHome({ onEnter }: ArenaHomeProps) {
    const { language, userId, playerName, history, favoriteRivalId, progression } = useGameStore();
    const isFr = language === 'fr';
    const [activeDuel, setActiveDuel] = useState(false);
    const [activeTournament, setActiveTournament] = useState(false);
    const [queued, setQueued] = useState(false);
    const [incoming, setIncoming] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('all');
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
        try { localStorage.setItem(tab === 'training' ? 'slaptax_training_game' : 'slaptax_duel_game', gameId); } catch { /* Optional preference. */ }
        onEnter(tab);
    }
    async function quickPlay() {
        if (!userId || busy) return;
        if (queued || activeDuel) { onEnter('defy'); return; }
        setBusy(true); setError('');
        try {
            void api.trackProductEvent('quick_play_clicked', userId, { source: 'signature_home' }).catch(() => undefined);
            await api.joinMatchmaking(userId, 2); onEnter('defy');
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
    const games=[...COMPETITIVE_GAMES].sort((a,b)=>Number(b.id==='toilet')-Number(a.id==='toilet'));
    return <section className={styles.home} data-testid="club-home">
        <header className={styles.intro}>
            <div><span className={styles.eyebrow}>{isFr?'LE TERRAIN DE JEU DES POTES':'YOUR FRIENDS’ PLAYGROUND'}</span><h1>{isFr?'Bons amis. Mauvais perdants.':'Good friends. Bad losers.'}</h1></div>
            <div className={styles.identity}><ClubAvatar variant={progression?.cosmetics.avatar}/><div><span>{isFr?'DANS LE CLUB':'IN THE CLUB'}</span><strong>{playerName}</strong></div></div>
        </header>
        {(activeDuel||activeTournament||incoming>0)&&<div className={styles.resume} role="status"><span>{incoming?`${incoming} ${isFr?'défi(s) en attente':'pending challenge(s)'}`:isFr?'Ta partie t’attend !':'Your match is waiting!'}</span><button type="button" onClick={()=>onEnter(activeTournament&&!activeDuel?'tournament':'defy')}>{isFr?'Reprendre':'Resume'}<ArrowRight size={18}/></button></div>}
        <div className={styles.hero}>
            <div className={styles.heroCopy}><span className={styles.sticker}><Zap size={15}/>{isFr?'PETITS JEUX. GROS EGO.':'SMALL GAMES. BIG EGOS.'}</span><h2>{isFr?<>À toi de<br/><em>les battre.</em></>:<>Your turn<br/><em>to win.</em></>}</h2><p>{isFr?'Des parties courtes, de grandes catastrophes. Des chocs, du bluff et des catastrophes à partager.':'Short games, spectacular disasters. Bumps, bluffs and disasters to share.'}</p><button className={styles.heroButton} onClick={()=>enter('toilet','training')} type="button"><Play size={23} fill="currentColor"/>{isFr?'Jouer maintenant':'Play now'}<ArrowRight size={22}/></button><span className={styles.heroNote}>{`${gameLabel('toilet',isFr)} · ${isFr?'contre 3 bots':'vs 3 bots'}`}</span></div>
            <div className={styles.heroArt} aria-hidden="true"><div className={styles.burst}/><span className={styles.starOne}>✦</span><span className={styles.starTwo}>✦</span><div className={styles.heroRival}><GameBuddy gameId="garde" rival mood="oops"/></div><div className={styles.heroAvatar}><GameBuddy gameId="toilet" mood="happy"/></div><span className={styles.speech}>{isFr?'REVANCHE ?':'REMATCH?'}</span><span className={styles.versus}>VS</span></div>
        </div>
        <div className={styles.playbar}>
            <button className={styles.primary} type="button" onClick={()=>onEnter('defy')}><Swords size={28}/><span><strong>{isFr?'Avec un ami':'With a friend'}</strong><small>{isFr?'Choisis un rival et lance le duel':'Pick a rival and start a duel'}</small></span><ArrowRight size={20}/></button>
            <button type="button" onClick={()=>onEnter('challenges')}><Link size={25}/><span><strong>{isFr?'Mes défis':'My challenges'}</strong><small>{isFr?'Partage un score à battre':'Share a score to beat'}</small></span><ArrowRight size={20}/></button>
        </div>
        <div className={styles.presence}><OnlinePlayers isFr={isFr} revision={presenceRevision}/><button type="button" disabled={!userId||busy} onClick={()=>void quickPlay()}><Users size={15}/>{busy?'…':queued?(isFr?'Reprendre la recherche':'Resume search'):(isFr?'Trouver un adversaire':'Find an opponent')}</button></div>
        {rival&&<div className={styles.rival}><div className={styles.rivalAvatar}><ClubAvatar rival/></div><div><span>{isFr?'UNE AFFAIRE ENTRE VOUS':'UNFINISHED BUSINESS'}</span><strong>{rival.opponentName}</strong></div>{rivalry?.season&&<b>{rivalry.season.wins[userId||'']||0}<i>:</i>{rivalry.season.wins[rival.opponentId||'']||0}</b>}<button type="button" disabled={busy} onClick={()=>void rematch()}><RotateCcw size={18}/>{isFr?'Revanche':'Rematch'}</button></div>}
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        <SoloJourney onPlay={id=>enter(id,'training')}/>
        <section className={styles.library}>
            <header><h2>{isFr?'Les fauteurs de troubles':'Meet the troublemakers'}</h2><span>{games.length} {isFr?'JEUX':'GAMES'}</span></header>
            <div className={styles.categories} role="tablist" aria-label={isFr?'Categories de jeux':'Game categories'}>{[{id:'all',fr:'Tous',en:'All games'},...GAME_CATEGORIES].map(c=><button type="button" role="tab" aria-selected={category===c.id} key={c.id} onClick={()=>setCategory(c.id)}>{isFr?c.fr:c.en}</button>)}</div>
            <div className={styles.libraryGrid} role="tabpanel">
                {games.filter(g=>category==='all'||GAME_CATEGORIES.find(c=>c.id===category)?.games.some(id=>id===g.id)).map(game=><article key={game.id} data-game={game.id}>
                    <div className={styles.art}><GamePoster gameId={game.id}/>{['pigeon','lift','toilet','table','garde'].includes(game.id)&&<span className={styles.featured}>{game.id==='pigeon'?(isFr?'NOUVEAU · LIVRAISON !':'NEW · DELIVERY!'):game.id==='lift'?(isFr?'NOUVEAU · QUI A PROUTÉ ?':'NEW · WHO FARTED?'):game.id==='toilet'?(isFr?'NOUVEAU · PROUT !':'NEW · PFFT!'):game.id==='garde'?(isFr?'BANANE & POÊLE':'BANANA & PAN'):(isFr?'NAPPE-OCALYPSE':'TABLECLOTH CHAOS')}</span>}</div>
                    <div className={styles.caption}><div><span>{isFr?game.skillFr:game.skillEn}</span><h3>{isFr?game.labelFr:game.labelEn}</h3><p className={styles.gameHook}>{gameHook(game.id,isFr)}</p></div><div className={styles.actions}>
                        <button type="button" onClick={()=>enter(game.id,'training')} title={isFr?'Jouer solo':'Play solo'} aria-label={`${isFr?'Jouer':'Play'} ${gameLabel(game.id,isFr)}`}><Play size={15} fill="currentColor"/>{isFr?'Jouer':'Play'}</button>
                        <button type="button" onClick={()=>enter(game.id,'defy')} title={isFr?'Defier un ami':'Challenge a friend'} aria-label={`${isFr?'Defier':'Challenge'}: ${isFr?game.labelFr:game.labelEn}`}><Swords size={15}/>{isFr?'Défier':'Challenge'}</button>
                    </div></div>
                </article>)}
            </div>
        </section>
        <nav className={styles.footer}><button type="button" onClick={()=>onEnter('leaderboard')}><Trophy size={17}/>{isFr?'Classement':'Leaderboard'}</button><button type="button" onClick={()=>onEnter('stats')}><History size={17}/>{isFr?'Historique':'History'}</button><span>PLAY. LOSE. REMATCH.</span></nav>
    </section>;
}
