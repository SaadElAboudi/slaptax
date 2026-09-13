import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Play, Swords, Trophy, Zap, Timer, Layers3 } from 'lucide-react';
import { api, type RivalryResponse } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { SIGNATURE_GAMES, COMPETITIVE_GAMES, GAME_CATEGORIES, type CompetitiveGameId } from '../../gameplay/catalog';
import { GamePoster } from '../LiveGameArena/GamePoster';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import styles from './ArenaHome.module.css';

interface ArenaHomeProps { onEnter: (tab: Tab) => void }
const MARKS = [Zap, Timer, Layers3];
const HOOKS = {
    fr: ['Tu paniques trop vite.', 'Tu pensais etre precis ?', 'Tu aurais du t arreter.'],
    en: ['You blinked first.', 'Think you have perfect timing?', 'You should have stopped.'],
};

export function ArenaHome({ onEnter }: ArenaHomeProps) {
    const { language, userId, playerName, history, favoriteRivalId } = useGameStore();
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
    return <section className={styles.home}>
        <div className={styles.topline}><span>{playerName}</span><span>{isFr ? 'LE TERRAIN DES RIVALITES' : 'HOME OF FRIENDLY RIVALRIES'}</span></div>
        <header className={styles.intro}>
            <div><span>SLAP$TAX</span><h1>{isFr ? 'Entre vous deux, qui gagne ?' : 'Between you two, who wins?'}</h1></div>
            <button type="button" onClick={() => onEnter('tournament')}><Trophy size={17} />{isFr ? 'Tournois' : 'Tournaments'}<ChevronRight size={16} /></button>
        </header>
        {(activeDuel || activeTournament || incoming > 0) && <div className={styles.resume}>
            <span>{incoming ? `${incoming} ${isFr ? 'defi en attente' : 'pending challenge'}` : (isFr ? 'Une partie est en cours.' : 'A match is in progress.')}</span>
            <button type="button" onClick={() => onEnter(activeTournament && !activeDuel ? 'tournament' : 'defy')}>{isFr ? 'Reprendre' : 'Resume'}<ArrowRight size={17} /></button>
        </div>}
        {(['garde','trace','decoupe','contrepied','ricochet','chroma'] as const).map((id)=><section className={styles.chromaFeature} key={id}>
            <div className={styles.chromaArt}><GamePoster gameId={id} /></div>
            <div><span>{isFr ? 'NOUVELLE EPREUVE' : 'NEW EVENT'}</span><h2>{id.toUpperCase()}</h2><p>{id==='garde'?(isFr?'Il charge. Tu fais quoi ?':'They are charging. Your move?'):id==='trace'?(isFr?'Tu pensais avoir une bonne memoire ?':'Thought you had a good memory?'):id==='decoupe'?(isFr?'37 %. Au juger.':'37%. By eye.'):id==='contrepied' ? (isFr ? 'Ta meilleure carte. Mais au bon moment.' : 'Your best card. At the right moment.') : id==='ricochet' ? (isFr ? 'Ton beau tir ne tient qu a un choc.' : 'One collision changes everything.') : (isFr ? 'Tu crois avoir l oeil ?' : 'Think you have an eye for color?')}</p></div>
            <button type="button" onClick={() => enter(id,'training')}><Play size={18}/>{isFr ? 'Jouer':'Play'} {id.toUpperCase()}</button>
            <button type="button" onClick={() => enter(id,'defy')} aria-label={`${isFr ? 'Defier sur':'Challenge on'} ${id.toUpperCase()}`} title={`${isFr ? 'Defier sur':'Challenge on'} ${id.toUpperCase()}`}><Swords size={18}/></button>
        </section>)}
        <div className={styles.games}>
            {SIGNATURE_GAMES.map((game, index) => {
                const Icon = MARKS[index];
                return <article key={game.id} className={styles.game} data-game={game.id}>
                    <div className={styles.gameArt}><GamePoster gameId={game.id} /></div>
                    <div className={styles.cardHeading}><Icon size={19} /><span>0{index + 1}</span><small>{index === 0 ? 'REFLEX' : index === 1 ? 'PRECISION' : 'RISK'}</small></div>
                    <h2>{isFr ? game.labelFr : game.labelEn}</h2>
                    <p>{HOOKS[isFr ? 'fr' : 'en'][index]}</p>
                    <div className={styles.actions}>
                        <button type="button" onClick={() => enter(game.id, 'defy')}><Swords size={17} />{isFr ? 'Defier un ami' : 'Challenge a friend'}</button>
                        <button type="button" onClick={() => enter(game.id, 'training')} title={isFr ? 'Jouer solo' : 'Play solo'} aria-label={`${isFr ? 'Jouer solo' : 'Play solo'}: ${isFr ? game.labelFr : game.labelEn}`}><Play size={18} /></button>
                    </div>
                </article>;
            })}
        </div>
        {rival && <div className={styles.rival}>
            <div><span>{isFr ? 'VOTRE SAISON' : 'YOUR SEASON'} · {rivalry?.season?.month || ''}</span><h2>{isFr ? 'Toi' : 'You'} <small>vs</small> {rival.opponentName}</h2></div>
            <strong>{rivalry?.season?.wins[userId || ''] || 0}<i>:</i>{rivalry?.season?.wins[rival.opponentId || ''] || 0}</strong>
            <button type="button" disabled={busy} onClick={() => void rematch()}>{isFr ? 'La revanche' : 'Run it back'}<ArrowRight size={18} /></button>
        </div>}
        <div className={styles.matchmaking}>
            <div><strong>{isFr ? 'Un nouvel adversaire ?' : 'A new opponent?'}</strong><span>{queued ? (isFr ? 'Recherche en cours' : 'Finding a rival') : 'BO3 · LIVE'}</span></div>
            <button type="button" disabled={!userId || busy} onClick={() => void quickPlay()}>{busy ? '…' : queued ? (isFr ? 'Entrer dans le salon' : 'Enter the room') : (isFr ? 'Trouver un rival' : 'Find a rival')}<ArrowRight size={18} /></button>
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <section className={styles.library}>
            <header><h2>{isFr ? 'Choisis ton terrain.' : 'Pick your playground.'}</h2><span>{COMPETITIVE_GAMES.length} {isFr ? 'JEUX' : 'GAMES'}</span></header>
            <div className={styles.categories} role="tablist" aria-label={isFr ? 'Categories de jeux' : 'Game categories'}>
                {[{ id: 'all', fr: 'Tous', en: 'All games' }, ...GAME_CATEGORIES].map((entry) => <button type="button" role="tab" aria-selected={category === entry.id} key={entry.id} onClick={() => setCategory(entry.id)}>{isFr ? entry.fr : entry.en}</button>)}
            </div>
            <div className={styles.libraryGrid} role="tabpanel">
                {COMPETITIVE_GAMES.filter((game) => category === 'all' || GAME_CATEGORIES.find((entry) => entry.id === category)?.games.some((id) => id === game.id)).map((game) => <article key={game.id}>
                    <GamePoster gameId={game.id} />
                    <div><span>{isFr ? game.skillFr : game.skillEn}</span><h3>{isFr ? game.labelFr : game.labelEn}</h3><div className={styles.libraryActions}>
                        <button type="button" onClick={() => enter(game.id, 'training')}><Play size={16} />{isFr ? 'Jouer' : 'Play'}</button>
                        <button type="button" title={isFr ? 'Defier un ami' : 'Challenge a friend'} aria-label={`${isFr ? 'Defier' : 'Challenge'}: ${isFr ? game.labelFr : game.labelEn}`} onClick={() => enter(game.id, 'defy')}><Swords size={17} /></button>
                    </div></div>
                </article>)}
            </div>
        </section>
        <nav className={styles.footer}><button type="button" onClick={() => onEnter('leaderboard')}>{isFr ? 'Classement' : 'Leaderboard'}</button><button type="button" onClick={() => onEnter('stats')}>{isFr ? 'Historique' : 'History'}</button></nav>
    </section>;
}
