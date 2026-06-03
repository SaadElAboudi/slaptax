import { useEffect, useState } from 'react';
import styles from './TournamentPanel.module.css';
import { api, type TournamentResponse } from '../../api/client';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel, getRiskStakeCap, tuneTournamentSize } from '../../gameplay/difficulty';

const SIZES = [8, 16, 32];
const STAKES = [2, 5, 10, 20];
const DRAFT_GAMES = [
    { id: 'quickdraw', labelEn: 'Quickdraw', labelFr: 'Quickdraw' },
    { id: 'parryclash', labelEn: 'Parry Clash', labelFr: 'Parry Clash' },
    { id: 'mindgame', labelEn: 'Mind Game', labelFr: 'Mental' },
    { id: 'speedsort', labelEn: 'Speed Sort', labelFr: 'Speed Sort' },
    { id: 'duelnumeric', labelEn: 'Duel Numeric', labelFr: 'Duel Numeric' },
] as const;

type DraftGameId = typeof DRAFT_GAMES[number]['id'];

interface TournamentDraft {
    ban: DraftGameId;
    pick: DraftGameId;
}

function stageLabel(round: number, totalRounds: number, isFr: boolean): string {
    if (round === totalRounds) return isFr ? 'Finale' : 'Final';
    if (round === totalRounds - 1) return isFr ? 'Demi-finale' : 'Semifinal';
    if (round === totalRounds - 2) return isFr ? 'Quart de finale' : 'Quarterfinal';
    return isFr ? `Tour ${round}` : `Round ${round}`;
}

export function TournamentPanel() {
    const refreshLiveState = useGameStore((s) => s.refreshLiveState);
    const wallet = useGameStore((s) => s.wallet);
    const language = useGameStore((s) => s.language);
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const isFr = language === 'fr';
    const safeWallet = Number(wallet ?? 0);
    const stakeCap = getRiskStakeCap(difficultyMode);
    const cappedStakes = STAKES.filter((s) => s <= stakeCap);

    const [size, setSize] = useState(8);
    const [stake, setStake] = useState(5);
    const [draft, setDraft] = useState<TournamentDraft>({ ban: 'mindgame', pick: 'quickdraw' });
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<TournamentResponse | null>(null);
    const tunedSize = tuneTournamentSize(size, difficultyMode);
    const roundsToClear = Math.log2(tunedSize);
    const projectedPool = tunedSize * stake;
    const projectedPayout = projectedPool * 0.94;
    const recommendedStake = cappedStakes[Math.min(cappedStakes.length - 1, difficultyMode === 'casual' ? 0 : difficultyMode === 'hardcore' ? cappedStakes.length - 1 : Math.max(0, cappedStakes.length - 2))] ?? 2;
    const presets = [
        { key: 'sprint', label: isFr ? 'Sprint' : 'Sprint', size: 8, stake: cappedStakes[0] ?? 2 },
        { key: 'main', label: isFr ? 'Main Event' : 'Main Event', size: 16, stake: recommendedStake },
        { key: 'major', label: isFr ? 'Major' : 'Major', size: 32, stake: cappedStakes[cappedStakes.length - 1] ?? 5 },
    ];

    function applyPreset(nextSize: number, nextStake: number) {
        setSize(nextSize);
        setStake(nextStake);
    }

    useEffect(() => {
        const effectiveCap = Math.min(stakeCap, safeWallet);
        if (stake <= effectiveCap) return;
        const affordable = STAKES.filter((s) => s <= effectiveCap);
        if (affordable.length > 0) {
            setStake(affordable[affordable.length - 1]);
        }
    }, [safeWallet, stake, stakeCap]);

    useEffect(() => {
        setDraft((current) => {
            const allowed = new Set(DRAFT_GAMES.map((game) => game.id));
            const ban = allowed.has(current.ban) ? current.ban : DRAFT_GAMES[0].id;
            const pickCandidate = allowed.has(current.pick) && current.pick !== ban ? current.pick : DRAFT_GAMES[1].id;
            const pick = pickCandidate === ban ? DRAFT_GAMES[2].id : pickCandidate;
            return { ban, pick };
        });
    }, []);

    async function handleRun() {
        setRunning(true);
        setError('');
        try {
            const data = await api.simulateTournament(tunedSize, stake, draft);
            setResult(data);
            await refreshLiveState();
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Le tournoi a echoue' : 'Tournament failed'));
        } finally {
            setRunning(false);
        }
    }

    return (
        <section className={styles.panel}>
            <div className={styles.head}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Tournoi' : 'Tournament'}</h2>
                    <p className={styles.sub}>{isFr ? 'Bracket stable pour tester un format battle-royal sans casser le wallet ni la session.' : 'Stable bracket mode to stress-test a battle-royale format without breaking wallet flow or session state.'}</p>
                    <p className={styles.wallet}>{isFr ? 'Wallet' : 'Wallet'}: SLAP$ {safeWallet.toFixed(2)}</p>
                    <p className={styles.meta}>{isFr ? 'Difficulte globale' : 'Global difficulty'}: {getDifficultyLabel(difficultyMode, isFr)} · {isFr ? 'Bracket simule' : 'Simulated bracket'}: {tunedSize}</p>
                </div>
            </div>

            <div className={styles.gameStrip}>
                {DRAFT_GAMES.map((game) => (
                    <span
                        key={game.id}
                        className={`${styles.gameTag} ${draft.pick === game.id ? styles.gamePick : ''} ${draft.ban === game.id ? styles.gameBan : ''}`}
                    >
                        {draft.ban === game.id ? 'BAN' : draft.pick === game.id ? 'PICK' : 'POOL'} · {isFr ? game.labelFr : game.labelEn}
                    </span>
                ))}
            </div>

            <div className={styles.presetRow}>
                {presets.map((preset) => (
                    <button
                        key={preset.key}
                        type="button"
                        className={`${styles.presetBtn} ${size === preset.size && stake === preset.stake ? styles.presetActive : ''}`}
                        onClick={() => applyPreset(preset.size, preset.stake)}
                    >
                        {preset.label} · {preset.size}p · SLAP$ {preset.stake}
                    </button>
                ))}
            </div>

            <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>{isFr ? 'Parcours requis' : 'Path to clear'}</span>
                    <strong>{roundsToClear} {isFr ? 'matchs sans choke' : 'straight wins'}</strong>
                    <span>{isFr ? 'Une seule defaite et tu sors.' : 'One loss and the run is over.'}</span>
                </div>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>{isFr ? 'Prize pool simule' : 'Simulated prize pool'}</span>
                    <strong>SLAP$ {projectedPool.toFixed(2)}</strong>
                    <span>{isFr ? 'Payout champion estime' : 'Projected champion payout'}: SLAP$ {projectedPayout.toFixed(2)}</span>
                </div>
                <div className={styles.overviewCard}>
                    <span className={styles.overviewLabel}>{isFr ? 'Meta draft' : 'Draft meta'}</span>
                    <strong>{isFr ? 'Ban' : 'Ban'} {DRAFT_GAMES.find((game) => game.id === draft.ban)?.[isFr ? 'labelFr' : 'labelEn']}</strong>
                    <span>{isFr ? 'Pick de confort' : 'Comfort pick'}: {DRAFT_GAMES.find((game) => game.id === draft.pick)?.[isFr ? 'labelFr' : 'labelEn']}</span>
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.draftBox}>
                    <div className={styles.draftHead}>
                        <strong>{isFr ? 'Draft tournoi' : 'Tournament draft'}</strong>
                        <span>{isFr ? 'Un ban, un jeu favori, puis le bracket roule.' : 'One ban, one favorite game, then the bracket rolls.'}</span>
                    </div>
                    <div className={styles.draftGrid}>
                        <label>
                            {isFr ? 'Ban' : 'Ban'}
                            <select value={draft.ban} onChange={(e) => setDraft((d) => ({ ...d, ban: e.target.value as DraftGameId, pick: d.pick === e.target.value ? DRAFT_GAMES.find((g) => g.id !== e.target.value)?.id ?? d.pick : d.pick }))}>
                                {DRAFT_GAMES.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {isFr ? game.labelFr : game.labelEn}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            {isFr ? 'Pick' : 'Pick'}
                            <select value={draft.pick} onChange={(e) => setDraft((d) => ({ ...d, pick: e.target.value as DraftGameId }))}>
                                {DRAFT_GAMES.map((game) => (
                                    <option key={game.id} value={game.id} disabled={game.id === draft.ban}>
                                        {isFr ? game.labelFr : game.labelEn}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <label>
                    {isFr ? 'Taille du bracket' : 'Bracket size'}
                    <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                        {SIZES.map((s) => (
                            <option key={s} value={s}>{s} {isFr ? 'joueurs' : 'players'}</option>
                        ))}
                    </select>
                </label>

                <label>
                    {isFr ? 'Mise' : 'Stake'}
                    <select value={stake} onChange={(e) => setStake(Number(e.target.value))}>
                        {cappedStakes.map((s) => (
                            <option key={s} value={s} disabled={s > safeWallet}>SLAP$ {s}</option>
                        ))}
                    </select>
                </label>

                <button className={styles.main} onClick={handleRun} disabled={running || stake > safeWallet || stake > stakeCap}>
                    {running ? (isFr ? 'Simulation...' : 'Simulating...') : (isFr ? 'Lancer le Tournoi' : 'Run Tournament')}
                </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {result && (
                <div className={styles.result}>
                    <div className={styles.resultHero}>
                        <div>
                            <p className={styles.resultEyebrow}>{isFr ? 'Run termine' : 'Run complete'}</p>
                            <h3 className={styles.resultTitle}>
                                {result.tournament.champion
                                    ? (isFr ? 'Tu prends le bracket' : 'You cleared the bracket')
                                    : (isFr ? `Sortie en ${stageLabel(result.tournament.run[result.tournament.run.length - 1]?.round || 1, result.tournament.rounds, true)}` : `Out in ${stageLabel(result.tournament.run[result.tournament.run.length - 1]?.round || 1, result.tournament.rounds, false)}`)}
                            </h3>
                            <p className={styles.resultCopy}>
                                {result.tournament.champion
                                    ? (isFr ? 'Le draft a tenu, la bankroll survit, et le run est clean.' : 'Draft held, bankroll survived, and the run stayed clean.')
                                    : (isFr ? 'Le format est bon quand la pression monte: une erreur et le run casse.' : 'This format gets honest under pressure: one mistake breaks the run.')}
                            </p>
                        </div>
                        <div className={styles.heroStats}>
                            <span className={`${styles.status} ${result.tournament.champion ? styles.win : styles.loss}`}>
                                {result.tournament.champion ? (isFr ? 'Champion' : 'Champion') : (isFr ? 'Elimine' : 'Eliminated')}
                            </span>
                            <span>{isFr ? 'Net' : 'Net'}: {result.tournament.net >= 0 ? '+' : ''}SLAP$ {result.tournament.net.toFixed(2)}</span>
                            <span>{isFr ? 'Payout' : 'Payout'}: SLAP$ {result.tournament.payout.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className={styles.kpis}>
                        <span>{isFr ? 'Manches' : 'Rounds'}: {result.tournament.run.length || result.tournament.rounds}</span>
                        <span>{isFr ? 'Bracket' : 'Bracket'}: {tunedSize} {isFr ? 'joueurs' : 'players'}</span>
                        <span>{isFr ? 'Draft favori' : 'Favored pick'}: {DRAFT_GAMES.find((game) => game.id === draft.pick)?.[isFr ? 'labelFr' : 'labelEn']}</span>
                        {result.tournament.draftSummary && <span>{result.tournament.draftSummary}</span>}
                    </div>

                    <div className={styles.progressTrack}>
                        {Array.from({ length: result.tournament.rounds }, (_, index) => {
                            const roundNumber = index + 1;
                            const playedRound = result.tournament.run.find((round) => round.round === roundNumber);
                            const stateClass = !playedRound ? styles.pending : playedRound.won ? styles.stepWin : styles.stepLoss;

                            return (
                                <div key={roundNumber} className={`${styles.progressStep} ${stateClass}`}>
                                    <span className={styles.progressStage}>{stageLabel(roundNumber, result.tournament.rounds, isFr)}</span>
                                    <strong>{playedRound ? (playedRound.won ? (isFr ? 'Passe' : 'Cleared') : (isFr ? 'Stop' : 'Stopped')) : (isFr ? 'A venir' : 'Pending')}</strong>
                                    <span>{playedRound?.label || playedRound?.gameId || (isFr ? 'A definir' : 'TBD')}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.rounds}>
                        {result.tournament.run.map((r) => (
                            <article key={`${r.round}-${r.opponentLevel}`} className={styles.roundCard}>
                                <strong>{stageLabel(r.round, result.tournament.rounds, isFr)}</strong>
                                <span>{r.label || r.gameId || (isFr ? 'Jeu' : 'Game')}: {r.gameId || '?'}</span>
                                <span>{isFr ? 'Niveau adversaire' : 'Opponent level'} {r.opponentLevel ?? '?'}</span>
                                <span>Score {r.scoreFor ?? '?'} - {r.scoreAgainst ?? '?'}</span>
                                <span className={r.won ? styles.win : styles.loss}>{r.won ? (isFr ? 'GAGNE' : 'WIN') : (isFr ? 'PERDU' : 'LOSS')}</span>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
