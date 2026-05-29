import { useState, useCallback, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import styles from './DuelPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getDifficultyLabel } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

type GameMode = 'tap_target';

const MODES: { id: GameMode; color: string }[] = [
    { id: 'tap_target', color: '#60a5fa' },
];

const MODE_LABELS_EN: Record<GameMode, string> = {
    tap_target: 'TAP TARGET',
};

const MODE_LABELS_FR: Record<GameMode, string> = {
    tap_target: 'TAP CIBLE',
};

const MODE_OBJECTIVES_EN: Record<GameMode, string> = {
    tap_target: 'Tap the target as fast as you can',
};

const MODE_OBJECTIVES_FR: Record<GameMode, string> = {
    tap_target: 'Tape la cible le plus vite possible',
};

const MODE_MISSIONS_EN: Record<GameMode, string> = {
    tap_target: 'Wait for the target, then tap it instantly.',
};

const MODE_MISSIONS_FR: Record<GameMode, string> = {
    tap_target: 'Attends la cible, puis tape dessus instantanément.',
};

const CROWD_WIN_LINES_EN = [
    'Crowd goes wild. Keep the combo alive.',
    'That was filthy. They felt that one.',
    'Perfect rhythm. Press the advantage.',
];

const CROWD_WIN_LINES_FR = [
    'La foule est en feu. Garde la serie.',
    'C etait sale. Ils l ont senti.',
    'Rythme parfait. Appuie ton avantage.',
];

const CROWD_LOSS_LINES_EN = [
    'Opponent taunts. Take the next round back.',
    'Crowd got quiet. Reset and punish.',
    'You got clipped. Breathe and answer.',
];

const CROWD_LOSS_LINES_FR = [
    'L adversaire provoque. Reprends la prochaine manche.',
    'La foule se tait. Reset et punis.',
    'Tu as pris un coup. Respire et reponds.',
];

function formatMs(ms: number) {
    return `${ms}ms`;
}

function pickRandom(items: string[]): string {
    return items[Math.floor(Math.random() * items.length)];
}

function formatRoundMetric(round: RoundResult): string {
    if (!round.playerMetricMs) return round.gameId.toUpperCase();
    return formatMs(round.playerMetricMs);
}




export function DuelPanel() {
    const { stake, wallet, isDueling, startDuel, resolveDuel, lastNet, lastRounds } =
        useGameStore();
    // Adaptive threshold for win (ms)
    const [winThreshold, setWinThreshold] = useState(400); // Start at 400ms, more forgiving
    const language = useGameStore((s) => s.language);
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { soundOn, toggleSound, activateAudio, playWin, playLoss } = useSfx();
    const isFr = language === 'fr';
    const tx = (en: string, fr: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);


    const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'result'>('idle');
    const [matchType, setMatchType] = useState<'stake' | 'practice'>('stake');
    const [round, setRound] = useState(0);
    const [mode, setMode] = useState<GameMode>('tap_target');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [targetVisible, setTargetVisible] = useState(false);
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
    const [countdown, setCountdown] = useState(3);
    const [feedback, setFeedback] = useState(tx('Press Start to begin Tap Target', 'Appuie sur Demarrer pour lancer Tap Cible'));
    const [crowdLine, setCrowdLine] = useState(tx('Calm hand. Sharp eye. Clean click.', 'Main calme. Oeil net. Clic propre.'));

    const timeoutRefs = useRef<number[]>([]);
    const targetAppearedAtRef = useRef(0);

    const totalRounds = 3;
    const modeLabels = isFr ? MODE_LABELS_FR : MODE_LABELS_EN;
    const modeObjectives = isFr ? MODE_OBJECTIVES_FR : MODE_OBJECTIVES_EN;
    const modeMissions = isFr ? MODE_MISSIONS_FR : MODE_MISSIONS_EN;
    const crowdWinLines = isFr ? CROWD_WIN_LINES_FR : CROWD_WIN_LINES_EN;
    const crowdLossLines = isFr ? CROWD_LOSS_LINES_FR : CROWD_LOSS_LINES_EN;

    useEffect(() => {
        // Prevent stale-locale phase messaging after a live language toggle.
        if (phase === 'idle') {
            setFeedback(isFr ? 'Appuie sur Demarrer pour lancer Tap Cible' : 'Press Start to begin Tap Target');
            setCrowdLine(isFr ? 'Reflexe pur. Tape la cible.' : 'Pure reflex. Tap the target.');
            return;
        }
        if (phase === 'countdown') {
            setFeedback(isFr ? 'La cible arrive. Prepare-toi.' : 'Target incoming. Get ready.');
            setCrowdLine(isFr ? 'Respire. Sois vif.' : 'Breathe. Be quick.');
            return;
        }
        if (phase === 'playing') {
            setFeedback(modeMissions[mode]);
        }
    }, [isFr, phase, mode, modeMissions]);

    const practiceWins = rounds.filter((r) => r.won).length;
    const practiceWon = practiceWins > totalRounds / 2;

    const clearFlowTimers = useCallback(() => {
        timeoutRefs.current.forEach((id) => window.clearTimeout(id));
        timeoutRefs.current = [];
    }, []);

    useEffect(() => () => clearFlowTimers(), [clearFlowTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((value) => value !== id);
            fn();
        }, delay);
        timeoutRefs.current.push(id);
    }, []);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        clearFlowTimers();
        if (!practice && safeWallet < safeStake) return;
        setMatchType(practice ? 'practice' : 'stake');
        if (!practice) startDuel();
        setRounds([]);
        setRound(1);
        setPhase('countdown');
        setCountdown(3);
        setFeedback(tx('Three rounds. Three perfect clicks.', 'Trois manches. Trois clics propres.'));
        setCrowdLine(tx('No spam. Precision only.', 'Pas de spam. Precision pure.'));

        let c = 3;
        const iv = window.setInterval(() => {
            c -= 1;
            setCountdown(c);
            if (c <= 0) {
                clearInterval(iv);
                beginRound(1, []);
            }
        }, 1000);
    }, [safeWallet, safeStake, startDuel, clearFlowTimers, activateAudio]);

    const handleStart = useCallback(() => startMatch(false), [startMatch]);
    const handleTraining = useCallback(() => startMatch(true), [startMatch]);

    function beginRound(r: number, prevRounds: RoundResult[]) {
        clearFlowTimers();
        const selectedMode = 'tap_target';
        setMode(selectedMode);
        setRound(r);
        setPhase('playing');
        setTargetVisible(false);
        setFeedback(modeMissions[selectedMode]);

        // Adaptive: if lost last round, make easier; if won, make harder (gentler steps)
        if (prevRounds.length > 0) {
            const last = prevRounds[prevRounds.length - 1];
            setWinThreshold((t) => Math.max(220, Math.min(600, last.won ? t - 15 : t + 30)));
        }

        const delay = 600 + Math.random() * 1200;
        schedule(() => {
            setTargetPos({
                x: 10 + Math.random() * 80,
                y: 20 + Math.random() * 60,
            });
            targetAppearedAtRef.current = performance.now();
            setTargetVisible(true);
        }, delay);
    }

    const handleTargetClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        if (phase !== 'playing') return;
        if (!targetVisible) return;
        // Real reflex: measure reaction time
        const now = performance.now();
        const reaction = Math.max(0, Math.floor(now - (targetAppearedAtRef.current || event.timeStamp || now)));
        const win = reaction <= winThreshold;
        const difficulty = win ? (reaction < 220 ? 'elite' : reaction < 300 ? 'hard' : 'standard') : 'easy';

        setTargetVisible(false);
        clearFlowTimers();

        const newRound: RoundResult = {
            gameId: mode,
            won: win,
            playerMetricMs: reaction,
            difficulty,
        };
        const updated = [...rounds, newRound];
        const winCount = updated.filter((r) => r.won).length;
        if (win) {
            playWin(0.7);
            setFeedback(
                reaction < 200 ? tx('Godlike reflex!', 'Reflexe divin !') :
                    reaction < 300 ? tx('Insane speed!', 'Vitesse folle !') :
                        reaction < 400 ? tx('Clean!', 'Propre !') :
                            tx('You made it! But can you go faster?', 'Bien joué ! Mais peux-tu aller plus vite ?')
            );
            setCrowdLine(pickRandom(crowdWinLines));
        } else {
            playLoss(0.5);
            setFeedback(
                reaction > 600 ? tx('Way too slow! (⩽ ' + winThreshold + 'ms)', 'Trop lent ! (⩽ ' + winThreshold + 'ms)') :
                    tx('Too slow! (⩽ ' + winThreshold + 'ms)', 'Pas assez rapide ! (⩽ ' + winThreshold + 'ms)')
            );
            setCrowdLine(pickRandom(crowdLossLines));
        }

        if (updated.length < totalRounds) {
            setRounds(updated);
            schedule(() => beginRound(round + 1, updated), 900);
        } else {
            setRounds(updated);
            setPhase('result');
            setFeedback(winCount > totalRounds / 2 ? tx('Series secured. Crowd chanting your name.', 'Serie validee. La foule chante ton nom.') : tx('Close fight. Queue again and run it back.', 'Combat serre. Relance et reprends.'));
            if (matchType === 'stake') {
                resolveDuel(winCount > totalRounds / 2, updated);
            }
        }
    }, [targetVisible, mode, round, rounds, resolveDuel, matchType, phase, clearFlowTimers, schedule, playWin, playLoss, crowdWinLines, crowdLossLines, tx, winThreshold]);

    const currentMode = MODES.find((m) => m.id === mode) ?? MODES[0];

    return (
        <div className={styles.panel}>
            {/* ─── Header ─────────────────────────── */}
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Tap Cible' : 'Tap Target'}</h2>
                    <p className={styles.sub}>{isFr ? `Réflexe pur · tape la cible dès qu'elle apparaît · Mise : SLAP$ ${safeStake}` : `Pure reflex game · tap the target as soon as it appears · Stake: SLAP$ ${safeStake}`}</p>
                </div>
                <div className={styles.walletPill}>
                    SLAP$ {safeWallet.toFixed(2)}
                </div>
            </div>

            {/* ─── Round progress ─────────────────── */}
            <div className={styles.roundRow}>
                {Array.from({ length: totalRounds }).map((_, i) => {
                    const r = rounds[i];
                    const cls = r ? (r.won ? styles.win : styles.loss) : i + 1 === round && phase === 'playing' ? styles.live : '';
                    return (
                        <span key={i} className={`${styles.roundDot} ${cls}`}>
                            {i + 1}
                        </span>
                    );
                })}
                <div className={styles.comboBar}>
                    <div
                        className={styles.comboFill}
                        style={{ width: `${(rounds.filter((r) => r.won).length / totalRounds) * 100}%` }}
                    />
                </div>
            </div>

            {/* ─── Mode chips ─────────────────────── */}
            <div className={styles.chips}>
                <span className={`${styles.chip} ${styles.hot}`}>{isFr ? 'Mode' : 'Mode'}: {modeLabels[currentMode.id]}</span>
                <span className={styles.chip}>{isFr ? 'Objectif' : 'Objective'}: {modeObjectives[currentMode.id]}</span>
                <span className={styles.chip}>{isFr ? 'Regle' : 'Rule'}: {isFr ? 'Tape la cible le plus vite possible' : 'Tap the target as fast as possible'}</span>
                <span className={styles.chip}>{isFr ? 'Mise' : 'Stake'} SLAP$ {safeStake}</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {rounds.filter((r) => r.won).length}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Niveau' : 'Difficulty'}: {getDifficultyLabel(difficultyMode, isFr)}</span>
                <span className={styles.chip}>
                    {isFr ? 'Manche' : 'Round'} {phase === 'playing' || phase === 'countdown' ? round : '—'}/{totalRounds}
                </span>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>
                    SFX: {soundOn ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* ─── Arena ──────────────────────────── */}
            <div className={`${styles.arena} ${styles[`mode_${mode}`]}`}>
                <div className={styles.missionCard}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>

                {/* Mode visual circle / ring */}
                <div className={`${styles.modeVisual} ${styles[`visual_${mode}`]}`} />

                {/* Countdown overlay */}
                {phase === 'countdown' && (
                    <div className={styles.countdownOverlay}>
                        <span className={styles.countdownNum}>{countdown || (isFr ? 'PARTEZ' : 'GO')}</span>
                    </div>
                )}

                {/* Target */}
                {phase === 'playing' && targetVisible && (
                    <button
                        className={`${styles.target} ${styles[`target_${mode}`]}`}
                        style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                        onClick={handleTargetClick}
                        aria-label={isFr ? 'Tape la cible' : 'Tap target'}
                    >
                        <span className={styles.targetLabel}>{isFr ? 'TAPE' : 'TAP'}</span>
                    </button>
                )}

                {/* Idle prompt */}
                {phase === 'idle' && (
                    <p className={styles.prompt}>{isFr ? 'Tape la cible plus vite que tout le monde.' : 'Tap the target faster than anyone.'}</p>
                )}

                {/* Result overlay */}
                {phase === 'result' && (
                    <div className={styles.resultOverlay}>
                        <h3
                            className={`${styles.resultTitle} ${matchType === 'practice'
                                ? styles.ok
                                : (lastNet ?? 0) >= 0
                                    ? styles.ok
                                    : styles.bad
                                }`}
                        >
                            {matchType === 'practice'
                                ? (practiceWon ? (isFr ? 'ENTRAINEMENT REUSSI' : 'PRACTICE CLEARED') : (isFr ? 'ENTRAINEMENT RATE' : 'PRACTICE MISSED'))
                                : (lastNet ?? 0) >= 0
                                    ? (isFr ? 'VICTOIRE' : 'VICTORY')
                                    : (isFr ? 'DEFAITE' : 'DEFEAT')}
                        </h3>
                        <p className={styles.resultNet}>
                            {matchType === 'practice'
                                ? (isFr ? 'Sans mise · portefeuille inchange' : 'No stake · no wallet change')
                                : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}
                        </p>
                        <div className={styles.resultRounds}>
                            {(matchType === 'practice' ? rounds : lastRounds).map((r, i) => (
                                <span
                                    key={i}
                                    className={`${styles.resultRoundDot} ${r.won ? styles.win : styles.loss}`}
                                >
                                    {r.won ? '✓' : '✗'} {formatRoundMetric(r)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Controls ───────────────────────── */}
            <div className={styles.controls}>
                {phase === 'idle' || phase === 'result' ? (
                    <>
                        <button
                            className={styles.btnMain}
                            onClick={handleStart}
                            disabled={safeWallet < safeStake || isDueling}
                        >
                            {phase === 'result' ? (isFr ? 'Relancer' : 'Run It Back') : (isFr ? 'Demarrer Duel Immersif' : 'Start Immersive Duel')}
                        </button>
                        <button className={styles.btn} onClick={handleTraining} disabled={isDueling}>
                            {isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}
                        </button>
                    </>
                ) : (
                    <p className={styles.hint}>
                        {phase === 'countdown'
                            ? (isFr ? `Prepare-toi… ${countdown}` : `Get ready… ${countdown}`)
                            : (targetVisible ? (isFr ? 'Pose ton clic au centre exact.' : 'Place your click exactly in the center.') : (isFr ? 'Main stable...' : 'Steady hands...'))}
                    </p>
                )}
            </div>

            {/* ─── Log ────────────────────────────── */}
            {rounds.length > 0 && (
                <div className={styles.log}>
                    {rounds.map((r, i) => (
                        <div key={i} className={`${styles.logEntry} ${r.won ? styles.logWin : styles.logLoss}`}>
                            {isFr ? 'Manche' : 'Round'} {i + 1} · {r.gameId.toUpperCase()} ·{' '}
                            {formatRoundMetric(r)} ·{' '}
                            {r.won ? (isFr ? 'GAGNE' : 'WON') : (isFr ? 'PERDU' : 'LOST')}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
