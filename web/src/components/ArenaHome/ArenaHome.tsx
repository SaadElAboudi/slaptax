import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { COMPETITIVE_GAMES } from '../../gameplay/catalog';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import styles from './ArenaHome.module.css';

interface ArenaHomeProps {
    onEnter: (tab: Tab) => void;
}

const GAME_MARKS: Record<string, string> = {
    bounce: '↗',
    symbolrush: '◆',
    bombpass: '●',
    cupshuffle: '▰',
    duelnumeric: '42',
};

export function ArenaHome({ onEnter }: ArenaHomeProps) {
    const language = useGameStore((state) => state.language);
    const playerName = useGameStore((state) => state.playerName);
    const userId = useGameStore((state) => state.userId);
    const wallet = useGameStore((state) => state.wallet);
    const history = useGameStore((state) => state.history);
    const progression = useGameStore((state) => state.progression);
    const isFr = language === 'fr';
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeDuel, setActiveDuel] = useState(false);
    const [activeTournament, setActiveTournament] = useState(false);
    const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
    const [quickPlayBusy, setQuickPlayBusy] = useState(false);
    const [quickPlayError, setQuickPlayError] = useState('');
    const [realtimeTick, setRealtimeTick] = useState(0);
    const selectedGame = COMPETITIVE_GAMES[selectedIndex];

    useRealtime(userId, (event) => {
        if (event.type === 'state.changed' || event.type === 'connected') {
            setRealtimeTick((value) => value + 1);
        }
    });

    const localStreak = useMemo(() => {
        let value = 0;
        for (const entry of history) {
            const won = entry.won === true || entry.result === 'WIN';
            if (!won) break;
            value += 1;
        }
        return value;
    }, [history]);
    const streak = progression?.winStreak ?? localStreak;
    const dailyDone = progression?.daily.tasks.filter((task) => task.progress >= task.target).length || 0;
    const dailyTotal = progression?.daily.tasks.length || 3;

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        Promise.all([
            api.getActiveLiveDuel(userId),
            api.getActiveLiveTournament(userId),
            api.getMatchmakingStatus(userId),
        ]).then(([duel, tournament, matchmaking]) => {
            if (cancelled) return;
            setActiveDuel(Boolean(duel.match));
            setActiveTournament(Boolean(tournament.tournament));
            setMatchmakingStatus(matchmaking.status);
        }).catch(() => {
            // The home remains fully usable while the live service reconnects.
        });
        return () => {
            cancelled = true;
        };
    }, [userId, realtimeTick]);

    async function quickPlay() {
        if (!userId) return;
        setQuickPlayError('');
        if (matchmakingStatus !== 'idle') {
            onEnter('defy');
            return;
        }
        setQuickPlayBusy(true);
        void api.trackProductEvent('quick_play_clicked', userId, { source: 'home' }).catch(() => undefined);
        try {
            const result = await api.joinMatchmaking(userId, 2);
            setMatchmakingStatus(result.status);
            onEnter('defy');
        } catch (cause) {
            setQuickPlayError(cause instanceof Error ? cause.message : (isFr ? 'Matchmaking indisponible' : 'Matchmaking unavailable'));
        } finally {
            setQuickPlayBusy(false);
        }
    }

    function openTraining() {
        try {
            localStorage.setItem('slaptax_training_game', selectedGame.id);
        } catch {
            // Training falls back to Bounce Panic.
        }
        onEnter('training');
    }

    return (
        <section className={styles.home}>
            <div className={styles.statusRail}>
                <div>
                    <span>{isFr ? 'JOUEUR' : 'PLAYER'}</span>
                    <strong>{playerName}</strong>
                </div>
                <div>
                    <span>{progression?.rank || (isFr ? 'RANG' : 'RANK')} · LVL {progression?.level || 1}</span>
                    <strong>{isFr ? 'Série' : 'Streak'} {streak}×</strong>
                </div>
                <div>
                    <span>BANK</span>
                    <strong>SLAP$ {Number(wallet ?? 0).toFixed(0)}</strong>
                </div>
            </div>

            <div className={styles.progressionRail}>
                <div>
                    <span>XP {progression?.xp || 0}</span>
                    <i style={{ width: `${Math.min(100, ((progression?.xp || 0) % 1200) / 12)}%` }} />
                </div>
                <div>
                    <span>{isFr ? 'MISSIONS DU JOUR' : 'DAILY MISSIONS'}</span>
                    <strong>{dailyDone}/{dailyTotal}</strong>
                </div>
                <div>
                    <span>{isFr ? 'MEILLEURE SERIE' : 'BEST STREAK'}</span>
                    <strong>{progression?.bestStreak || streak}×</strong>
                </div>
            </div>

            {(activeDuel || activeTournament) && (
                <div className={styles.resume}>
                    <div>
                        <span>{isFr ? 'SESSION EN COURS' : 'ACTIVE SESSION'}</span>
                        <strong>{isFr ? 'Ta partie t attend.' : 'Your game is waiting.'}</strong>
                    </div>
                    <div>
                        {activeDuel && <button type="button" onClick={() => onEnter('defy')}>{isFr ? 'Reprendre le duel' : 'Resume duel'}</button>}
                        {activeTournament && <button type="button" onClick={() => onEnter('tournament')}>{isFr ? 'Reprendre le tournoi' : 'Resume tournament'}</button>}
                    </div>
                </div>
            )}

            <div className={`${styles.quickPlay} ${matchmakingStatus === 'waiting' ? styles.quickPlaySearching : ''}`}>
                <div className={styles.quickPlaySignal} aria-hidden>
                    <i />
                    <i />
                    <i />
                </div>
                <div>
                    <span>{matchmakingStatus === 'waiting' ? (isFr ? 'RECHERCHE EN COURS' : 'SEARCHING') : 'MATCHMAKING LIVE'}</span>
                    <strong>{isFr ? 'Jouer maintenant' : 'Play now'}</strong>
                    <p>
                        {matchmakingStatus === 'waiting'
                            ? (isFr ? 'Ta place est conservée. Entre dans le salon pour suivre la recherche.' : 'Your place is saved. Enter the room to follow the search.')
                            : (isFr ? 'Un rival humain, une série BO3, aucune configuration.' : 'One human rival, one BO3 series, zero setup.')}
                    </p>
                </div>
                <button type="button" onClick={() => void quickPlay()} disabled={quickPlayBusy}>
                    {quickPlayBusy
                        ? (isFr ? 'Connexion...' : 'Connecting...')
                        : matchmakingStatus === 'idle'
                            ? (isFr ? 'Trouver un rival' : 'Find a rival')
                            : (isFr ? 'Entrer dans le salon' : 'Enter the room')}
                    <b aria-hidden>→</b>
                </button>
                {quickPlayError && <small>{quickPlayError}</small>}
            </div>

            <header className={styles.intro}>
                <span>{isFr ? 'CHOISIS TON TERRAIN' : 'CHOOSE YOUR ARENA'}</span>
                <h1>{isFr ? 'Comment veux-tu jouer ?' : 'How do you want to play?'}</h1>
                <p>{isFr ? 'Trois modes distincts, une seule progression.' : 'Three distinct modes, one shared progression.'}</p>
            </header>

            <div className={styles.modeGrid}>
                <article className={styles.trainingMode}>
                    <span>SOLO</span>
                    <strong>{isFr ? 'Entrainement' : 'Training'}</strong>
                    <p>{isFr ? 'Apprends les jeux et bats tes records, sans mise.' : 'Learn every game and beat your records, with no stake.'}</p>
                    <button type="button" onClick={openTraining}>{isFr ? 'Jouer solo' : 'Play solo'} <b>→</b></button>
                </article>
                <article className={styles.duelMode}>
                    <span>1V1 · BO3</span>
                    <strong>{isFr ? 'Duel entre amis' : 'Friend duel'}</strong>
                    <p>{isFr ? 'Partage un lien. Le premier à deux manches gagne.' : 'Share a link. First to win two rounds takes it.'}</p>
                    <button type="button" onClick={() => onEnter('defy')}>{isFr ? 'Créer un duel' : 'Create duel'} <b>→</b></button>
                </article>
                <article className={styles.tournamentMode}>
                    <span>LAST STANDING</span>
                    <strong>{isFr ? 'Tournoi' : 'Tournament'}</strong>
                    <p>{isFr ? 'Enchaine les adversaires. Une défaite termine le run.' : 'Clear each opponent. One loss ends the run.'}</p>
                    <button type="button" onClick={() => onEnter('tournament')}>{isFr ? 'Lancer un run' : 'Start a run'} <b>→</b></button>
                </article>
            </div>

            <div className={styles.trainingStrip}>
                <div className={styles.gamePreview}>
                    <span aria-hidden>{GAME_MARKS[selectedGame.id]}</span>
                    <div>
                        <small>{isFr ? 'ECHAUFFEMENT RAPIDE' : 'QUICK WARM-UP'}</small>
                        <strong>{isFr ? selectedGame.labelFr : selectedGame.labelEn}</strong>
                        <p>{isFr ? selectedGame.skillFr : selectedGame.skillEn}</p>
                    </div>
                    <button type="button" onClick={openTraining}>{isFr ? 'Jouer' : 'Play'}</button>
                </div>
                <div className={styles.selector} aria-label={isFr ? 'Choisir une épreuve' : 'Choose an event'}>
                    {COMPETITIVE_GAMES.map((game, index) => (
                        <button
                            key={game.id}
                            type="button"
                            className={index === selectedIndex ? styles.selected : ''}
                            onClick={() => setSelectedIndex(index)}
                            aria-label={isFr ? game.labelFr : game.labelEn}
                            aria-pressed={index === selectedIndex}
                        >
                            {GAME_MARKS[game.id]}
                        </button>
                    ))}
                </div>
            </div>

            <nav className={styles.secondary} aria-label={isFr ? 'Progression' : 'Progress'}>
                <button type="button" onClick={() => onEnter('leaderboard')}>{isFr ? 'Voir le classement' : 'View leaderboard'}</button>
                <button type="button" onClick={() => onEnter('stats')}>{isFr ? 'Voir mon historique' : 'View my history'}</button>
            </nav>
        </section>
    );
}
