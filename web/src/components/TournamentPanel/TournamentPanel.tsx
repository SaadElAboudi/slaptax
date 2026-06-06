import { useEffect, useState } from 'react';
import { api, type LiveTournament } from '../../api/client';
import { COMPETITIVE_GAMES, type CompetitiveGameId } from '../../gameplay/catalog';
import { getRiskStakeCap } from '../../gameplay/difficulty';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './TournamentPanel.module.css';

const SIZES = [8, 16, 32];
const STAKES = [2, 5, 10, 20];

function stageLabel(round: number, total: number, isFr: boolean) {
    if (round === total) return isFr ? 'Finale' : 'Final';
    if (round === total - 1) return isFr ? 'Demi-finale' : 'Semifinal';
    if (round === total - 2) return isFr ? 'Quart de finale' : 'Quarterfinal';
    return isFr ? `Tour ${round}` : `Round ${round}`;
}

export function TournamentPanel() {
    const userId = useGameStore((state) => state.userId);
    const wallet = useGameStore((state) => state.wallet);
    const language = useGameStore((state) => state.language);
    const difficulty = useGameStore((state) => state.difficultyMode);
    const refreshLiveState = useGameStore((state) => state.refreshLiveState);
    const isFr = language === 'fr';
    const stakeCap = getRiskStakeCap(difficulty);

    const [size, setSize] = useState(8);
    const [stake, setStake] = useState(5);
    const [preferredGame, setPreferredGame] = useState<CompetitiveGameId>('bounce');
    const [tournament, setTournament] = useState<LiveTournament | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [intermission, setIntermission] = useState<LiveTournament['rounds'][number] | null>(null);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const affordable = STAKES.filter((value) => value <= Math.min(Number(wallet), stakeCap));

    useEffect(() => {
        if (!userId || tournament) return;
        void api.getActiveLiveTournament(userId)
            .then((data) => {
                if (data.tournament) setTournament(data.tournament);
            })
            .catch(() => {
                // No resumable tournament yet.
            });
    }, [userId, tournament]);

    async function startTournament() {
        if (!userId) return;
        setBusy(true);
        setError('');
        try {
            const fallbackBan = COMPETITIVE_GAMES.find((game) => game.id !== preferredGame)?.id || 'duelnumeric';
            const data = await api.createLiveTournament(size, stake, { ban: fallbackBan, pick: preferredGame }, userId);
            if (data.tournament) setTournament(data.tournament);
            await refreshLiveState();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Tournament unavailable');
        } finally {
            setBusy(false);
        }
    }

    async function submitRound(result: { score: number; metric: number }) {
        if (!userId || !tournament) return;
        setBusy(true);
        try {
            const data = await api.submitLiveTournamentRound(tournament.id, userId, result.score, result.metric);
            if (data.tournament) {
                setTournament(data.tournament);
                setIntermission(data.tournament.rounds[data.tournament.rounds.length - 1] || null);
            }
            await refreshLiveState();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Round submission failed');
        } finally {
            setBusy(false);
        }
    }

    async function abandonTournament() {
        if (!userId || !tournament) return;
        setBusy(true);
        try {
            const data = await api.abandonLiveTournament(tournament.id, userId);
            if (data.tournament) setTournament(data.tournament);
            setIntermission(null);
            await refreshLiveState();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to leave tournament');
        } finally {
            setBusy(false);
        }
    }

    if (intermission && tournament) {
        return (
            <section className={`${styles.intermission} ${intermission.won ? styles.roundWin : styles.roundLoss}`}>
                <span>{intermission.won ? (isFr ? 'QUALIFIE' : 'QUALIFIED') : (isFr ? 'ELIMINE' : 'ELIMINATED')}</span>
                <h2>{intermission.scoreFor} - {intermission.scoreAgainst}</h2>
                <p>{intermission.label} · {intermission.opponentName}</p>
                <div className={styles.intermissionPath}>
                    {tournament.rounds.map((entry) => <i key={entry.round} className={entry.won ? styles.pathWin : styles.pathLoss} />)}
                    {Array.from({ length: tournament.roundsTotal - tournament.rounds.length }, (_, index) => <i key={`pending-${index}`} />)}
                </div>
                <button type="button" onClick={() => setIntermission(null)}>
                    {tournament.status === 'done' ? (isFr ? 'Voir le bilan' : 'See results') : (isFr ? 'Continuer le run' : 'Continue run')}
                </button>
            </section>
        );
    }

    if (tournament?.status === 'playing') {
        return (
            <div className={styles.liveRun}>
                <div className={styles.runRail}>
                    {Array.from({ length: tournament.roundsTotal }, (_, index) => {
                        const round = index + 1;
                        const played = tournament.rounds.find((entry) => entry.round === round);
                        return (
                            <div key={round} className={`${styles.runStep} ${played?.won ? styles.cleared : ''} ${round === tournament.currentRound ? styles.current : ''}`}>
                                <span>{stageLabel(round, tournament.roundsTotal, isFr)}</span>
                                <strong>{played ? `${played.scoreFor}-${played.scoreAgainst}` : round === tournament.currentRound ? 'LIVE' : 'LOCKED'}</strong>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.leaveActions}>
                    {confirmLeave && <span>{isFr ? 'La mise sera perdue.' : 'Your stake will be lost.'}</span>}
                    <button
                        type="button"
                        className={confirmLeave ? styles.confirmLeave : styles.leaveRun}
                        onClick={() => confirmLeave ? void abandonTournament() : setConfirmLeave(true)}
                        disabled={busy}
                    >
                        {confirmLeave ? (isFr ? 'Confirmer l abandon' : 'Confirm leave') : (isFr ? 'Quitter le tournoi' : 'Leave tournament')}
                    </button>
                    {confirmLeave && <button type="button" className={styles.cancelLeave} onClick={() => setConfirmLeave(false)}>{isFr ? 'Annuler' : 'Cancel'}</button>}
                </div>
                <LiveGameArena
                    key={`${tournament.id}-${tournament.currentRound}`}
                    mode="tournament"
                    gameId={tournament.games[tournament.currentRound - 1]}
                    series={tournament.games}
                    round={tournament.currentRound}
                    opponentName={`${isFr ? 'Seed' : 'Seed'} ${Math.max(1, Math.floor(tournament.size / (2 ** tournament.currentRound)))}`}
                    isFr={isFr}
                    onComplete={submitRound}
                />
            </div>
        );
    }

    if (tournament?.status === 'done') {
        return (
            <section className={`${styles.result} ${tournament.champion ? styles.champion : styles.eliminated}`}>
                <span>{tournament.champion ? (isFr ? 'CHAMPION' : 'CHAMPION') : (isFr ? 'ELIMINE' : 'ELIMINATED')}</span>
                <h2>{tournament.champion ? (isFr ? 'Bracket conquis' : 'Bracket conquered') : (isFr ? 'Le run s arrete ici' : 'The run ends here')}</h2>
                <div className={styles.resultRounds}>
                    {tournament.rounds.map((round) => (
                        <div key={round.round}>
                            <span>{stageLabel(round.round, tournament.roundsTotal, isFr)}</span>
                            <strong>{round.scoreFor} - {round.scoreAgainst}</strong>
                            <small>{round.label}</small>
                        </div>
                    ))}
                </div>
                <strong>{tournament.net && tournament.net > 0 ? '+' : ''}SLAP$ {Number(tournament.net || 0).toFixed(2)}</strong>
                <button type="button" onClick={() => setTournament(null)}>{isFr ? 'Nouveau tournoi' : 'New tournament'}</button>
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            <header className={styles.hero}>
                <div>
                    <span>LAST PLAYER STANDING</span>
                    <h2>{isFr ? 'Tournoi live' : 'Live Tournament'}</h2>
                    <p>{isFr ? 'Chaque qualification se gagne dans un vrai jeu. Une defaite et le run est termine.' : 'Every qualification is earned in a real game. One loss ends the run.'}</p>
                </div>
                <strong>SLAP$ {Number(wallet).toFixed(2)}</strong>
            </header>

            <div className={styles.presets}>
                {SIZES.map((value) => (
                    <button type="button" key={value} className={size === value ? styles.active : ''} onClick={() => setSize(value)}>
                        <strong>{value}</strong><span>{isFr ? 'participants' : 'entrants'}</span>
                    </button>
                ))}
            </div>

            <div className={styles.path}>
                {Array.from({ length: Math.log2(size) }, (_, index) => (
                    <div key={index}><span>0{index + 1}</span><strong>{stageLabel(index + 1, Math.log2(size), isFr)}</strong></div>
                ))}
            </div>

            <div className={styles.draftLabel}>
                <strong>{isFr ? 'Ton épreuve favorite' : 'Your preferred event'}</strong>
                <span>{isFr ? 'Elle sera prioritaire dans la rotation.' : 'It will be prioritized in your rotation.'}</span>
            </div>
            <div className={styles.draft}>
                {COMPETITIVE_GAMES.map((game) => (
                    <button
                        type="button"
                        key={game.id}
                        className={preferredGame === game.id ? styles.pick : ''}
                        onClick={() => setPreferredGame(game.id)}
                    >
                        <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                        <span>{preferredGame === game.id ? (isFr ? 'FAVORI' : 'PREFERRED') : (isFr ? game.skillFr : game.skillEn)}</span>
                    </button>
                ))}
            </div>

            <div className={styles.footer}>
                <label>{isFr ? 'Mise d entree' : 'Entry stake'}
                    <select value={stake} onChange={(event) => setStake(Number(event.target.value))}>
                        {affordable.map((value) => <option key={value} value={value}>SLAP$ {value}</option>)}
                    </select>
                </label>
                <div><span>{isFr ? 'Matchs a gagner' : 'Wins required'}</span><strong>{Math.log2(size)}</strong></div>
                <div><span>{isFr ? 'Prix potentiel' : 'Potential prize'}</span><strong>SLAP$ {(size * stake * .72).toFixed(2)}</strong></div>
                <button type="button" onClick={startTournament} disabled={busy || !userId || affordable.length === 0}>
                    {busy ? (isFr ? 'Création...' : 'Creating...') : (isFr ? 'Entrer dans le bracket' : 'Enter bracket')}
                </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
        </section>
    );
}
