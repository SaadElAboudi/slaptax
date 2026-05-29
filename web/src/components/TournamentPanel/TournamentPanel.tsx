import { useEffect, useState } from 'react';
import styles from './TournamentPanel.module.css';
import { api, type TournamentResponse } from '../../api/client';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel, getRiskStakeCap, tuneTournamentSize } from '../../gameplay/difficulty';

const SIZES = [8, 16, 32];
const STAKES = [2, 5, 10, 20];
const DRAFT_GAMES = [
    { id: 'precision', labelEn: 'Precision Rush', labelFr: 'Precision Rush' },
    { id: 'quickdraw', labelEn: 'Quickdraw', labelFr: 'Quickdraw' },
    { id: 'mindgame', labelEn: 'Mind Game', labelFr: 'Mental' },
    { id: 'speedsort', labelEn: 'Speed Sort', labelFr: 'Speed Sort' },
    { id: 'duelnumeric', labelEn: 'Duel Numeric', labelFr: 'Duel Numeric' },
] as const;

type DraftGameId = typeof DRAFT_GAMES[number]['id'];

interface TournamentDraft {
    ban: DraftGameId;
    pick: DraftGameId;
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
    const [draft, setDraft] = useState<TournamentDraft>({ ban: 'mindgame', pick: 'precision' });
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<TournamentResponse | null>(null);
    const tunedSize = tuneTournamentSize(size, difficultyMode);

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
                    <div className={styles.kpis}>
                        <span className={`${styles.status} ${result.tournament.champion ? styles.win : styles.loss}`}>
                            {result.tournament.champion ? (isFr ? 'Champion' : 'Champion') : (isFr ? 'Elimine' : 'Eliminated')}
                        </span>
                        <span>{isFr ? 'Manches' : 'Rounds'}: {result.tournament.run.length || result.tournament.rounds}</span>
                        <span>
                            Net: {result.tournament.net >= 0 ? '+' : ''}SLAP$ {result.tournament.net.toFixed(2)}
                        </span>
                        {result.tournament.draftSummary && <span>{result.tournament.draftSummary}</span>}
                    </div>

                    <div className={styles.rounds}>
                        {result.tournament.run.map((r) => (
                            <article key={`${r.round}-${r.opponentLevel}`} className={styles.roundCard}>
                                <strong>{isFr ? 'Manche' : 'Round'} {r.round}</strong>
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
