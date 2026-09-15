import { useEffect, useState } from 'react';
import { ArrowRight, Play, Swords, Trophy, RotateCcw, Users, History } from 'lucide-react';
import { api, type RivalryResponse } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { SIGNATURE_GAMES, COMPETITIVE_GAMES, GAME_CATEGORIES, type CompetitiveGameId } from '../../gameplay/catalog';
import { GamePoster } from '../LiveGameArena/GamePoster';
import { ClubAvatar } from '../ClubAvatar/ClubAvatar';
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
    const [rivalry, setRivalry] = useState<RivalryResponse | null>(null);
    const rival = history.find((entry) => entry.opponentId === favoriteRivalId && entry.opponentName)
        || history.find((entry) => entry.opponentId && entry.opponentName);
    useRealtime(userId, () => setTick((value) => value + 1));
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
    const games=[...COMPETITIVE_GAMES].sort((a,b)=>Number(b.id==='chroma')-Number(a.id==='chroma'));
    return <section className={styles.home} data-testid="club-home">
        <header className={styles.intro}>
            <div><span className={styles.eyebrow}>SLAP$TAX SOCIAL CLUB</span><h1>{isFr?'Bons amis. Mauvais perdants.':'Good friends. Bad losers.'}</h1></div>
            <div className={styles.identity}><ClubAvatar variant={progression?.cosmetics.avatar}/><div><span>{isFr?'DANS LE CLUB':'IN THE CLUB'}</span><strong>{playerName}</strong></div></div>
        </header>
        {(activeDuel||activeTournament||incoming>0)&&<div className={styles.resume} role="status"><span>{incoming?`${incoming} ${isFr?'defi(s) en attente':'pending challenge(s)'}`:isFr?'Ta partie t attend.':'Your match is waiting.'}</span><button type="button" onClick={()=>onEnter(activeTournament&&!activeDuel?'tournament':'defy')}>{isFr?'Reprendre':'Resume'}<ArrowRight size={18}/></button></div>}
        <div className={styles.playbar}>
            <button className={styles.primary} type="button" onClick={()=>enter('chroma','defy')}><Swords size={22}/>{isFr?'Defier un ami':'Challenge a friend'}<ArrowRight size={20}/></button>
            <button type="button" disabled={!userId||busy} onClick={()=>void quickPlay()}><Users size={19}/>{busy?'…':queued?(isFr?'Entrer dans le salon':'Enter the room'):(isFr?'Trouver un rival':'Find a rival')}</button>
            <button type="button" onClick={()=>onEnter('tournament')}><Trophy size={19}/>{isFr?'Tournois':'Tournaments'}</button>
        </div>
        {rival&&<div className={styles.rival}><div className={styles.rivalAvatar}><ClubAvatar rival/></div><div><span>{isFr?'UNE AFFAIRE ENTRE VOUS':'UNFINISHED BUSINESS'}</span><strong>{rival.opponentName}</strong></div>{rivalry?.season&&<b>{rivalry.season.wins[userId||'']||0}<i>:</i>{rivalry.season.wins[rival.opponentId||'']||0}</b>}<button type="button" disabled={busy} onClick={()=>void rematch()}><RotateCcw size={18}/>{isFr?'Revanche':'Rematch'}</button></div>}
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        <section className={styles.library}>
            <header><h2>{isFr?'Choisis ton terrain.':'Pick your playground.'}</h2><span>{games.length} {isFr?'JEUX':'GAMES'}</span></header>
            <div className={styles.categories} role="tablist" aria-label={isFr?'Categories de jeux':'Game categories'}>{[{id:'all',fr:'Tous',en:'All games'},...GAME_CATEGORIES].map(c=><button type="button" role="tab" aria-selected={category===c.id} key={c.id} onClick={()=>setCategory(c.id)}>{isFr?c.fr:c.en}</button>)}</div>
            <div className={styles.libraryGrid} role="tabpanel">
                {games.filter(g=>category==='all'||GAME_CATEGORIES.find(c=>c.id===category)?.games.some(id=>id===g.id)).map(game=><article key={game.id} data-game={game.id}>
                    <div className={styles.art}><GamePoster gameId={game.id}/>{game.id==='chroma'&&<span className={styles.featured}>{isFr?'LE DUEL EN COULEUR':'THE COLOR DUEL'}</span>}</div>
                    <div className={styles.caption}><div><span>{isFr?game.skillFr:game.skillEn}</span><h3>{isFr?game.labelFr:game.labelEn}</h3></div><div className={styles.actions}>
                        <button type="button" onClick={()=>enter(game.id,'training')} title={isFr?'Jouer solo':'Play solo'} aria-label={SIGNATURE_GAMES.some(g=>g.id===game.id)?`${isFr?'Jouer solo':'Play solo'}: ${isFr?game.labelFr:game.labelEn}`:`${isFr?'Jouer':'Play'} ${game.id.toUpperCase()}`}><Play size={18}/></button>
                        <button type="button" onClick={()=>enter(game.id,'defy')} title={isFr?'Defier un ami':'Challenge a friend'} aria-label={`${isFr?'Defier':'Challenge'}: ${isFr?game.labelFr:game.labelEn}`}><Swords size={18}/></button>
                    </div></div>
                </article>)}
            </div>
        </section>
        <nav className={styles.footer}><button type="button" onClick={()=>onEnter('leaderboard')}><Trophy size={17}/>{isFr?'Classement':'Leaderboard'}</button><button type="button" onClick={()=>onEnter('stats')}><History size={17}/>{isFr?'Historique':'History'}</button><span>PLAY. LOSE. REMATCH.</span></nav>
    </section>;
}
