import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './QuickdrawPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getDifficultyLabel, getQuickdrawTuning } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'ready' | 'delay' | 'draw' | 'result' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type Lane = 'left' | 'center' | 'right';
type Heat = 'cold' | 'warm' | 'hot' | 'fire';

const LANES: Lane[] = ['left', 'center', 'right'];
const TOTAL_ROUNDS = 3;

function pickLane(): Lane {
    return LANES[Math.floor(Math.random() * LANES.length)];
}

function getHeat(wins: number): Heat {
    if (wins >= 3) return 'fire';
    if (wins === 2) return 'hot';
    if (wins === 1) return 'warm';
    return 'cold';
}

function formatLane(lane: Lane, isFr: boolean) {
    if (lane === 'left') return isFr ? 'Gauche' : 'Left';
    if (lane === 'center') return isFr ? 'Centre' : 'Center';
    return isFr ? 'Droite' : 'Right';
}

function formatRoundMetric(round: RoundResult) {
    if (round.playerMetricMs === -50) return 'FALSE';
    return `${round.playerMetricMs ?? 0}ms`;
}

export function QuickdrawPanel() {
    const { stake, wallet, language, isDueling, lastNet, startDuel, resolveDuel } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const tuning = getQuickdrawTuning(difficultyMode);
    const { soundOn, toggleSound, activateAudio, playReady, playDraw, playWin, playLoss, playFalseStart } = useSfx();

    const isFr = language === 'fr';
    const tx = useCallback((en: string, fr: string) => (isFr ? fr : en), [isFr]);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [roundNum, setRoundNum] = useState(1);
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [targetLane, setTargetLane] = useState<Lane>('center');
    const [opponentMs, setOpponentMs] = useState(0);
    const [reactionMs, setReactionMs] = useState(0);
    const [feedback, setFeedback] = useState(tx('Step into the arena.', 'Entre dans l arene.'));
    const [crowdLine, setCrowdLine] = useState(tx('Silence before the storm.', 'Silence avant la tempete.'));

    const timerRefs = useRef<number[]>([]);
    const drawAtRef = useRef(0);
    const roundSettledRef = useRef(false);
    const matchTypeRef = useRef<MatchKind>('stake');

    const wins = rounds.filter((round) => round.won).length;
    const heat = getHeat(wins);
    const arenaPhaseClass =
        phase === 'ready' ? styles.phase_ready :
            phase === 'delay' ? styles.phase_delay :
                phase === 'draw' ? styles.phase_draw :
                    '';

    const clearTimers = useCallback(() => {
        timerRefs.current.forEach((id) => window.clearTimeout(id));
        timerRefs.current = [];
    }, []);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timerRefs.current = timerRefs.current.filter((value) => value !== id);
            fn();
        }, delay);
        timerRefs.current.push(id);
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    useEffect(() => {
        if (phase === 'idle') {
            setFeedback(tx('Step into the arena.', 'Entre dans l arene.'));
            setCrowdLine(tx('Silence before the storm.', 'Silence avant la tempete.'));
        }
    }, [phase, tx]);

    const finishRound = useCallback((won: boolean, metricMs: number, opponentMetric: number) => {
        if (roundSettledRef.current) return;
        roundSettledRef.current = true;
        clearTimers();

        const difficulty =
            metricMs < 0 ? 'false-start' :
                metricMs <= tuning.eliteMs ? 'elite' :
                    metricMs <= tuning.hardMs ? 'hard' :
                        metricMs <= tuning.standardMs ? 'standard' : 'late';

        const nextRound: RoundResult = {
            gameId: 'quickdraw',
            won,
            playerMetricMs: metricMs,
            difficulty,
        };
        const updated = [...rounds, nextRound];
        const nextWins = updated.filter((round) => round.won).length;
        const matchWon = nextWins > TOTAL_ROUNDS / 2;

        setRounds(updated);
        setReactionMs(metricMs);
        setOpponentMs(opponentMetric);
        setPhase('result');

        if (metricMs < 0) {
            playFalseStart();
            setFeedback(tx('False start. The crowd saw it.', 'Faux depart. La foule l a vu.'));
            setCrowdLine(tx('Too hungry. Hold your nerve.', 'Trop presse. Garde tes nerfs.'));
        } else if (won) {
            playWin(0.7);
            setFeedback(tx(`Clean draw in ${metricMs}ms.`, `Draw propre en ${metricMs}ms.`));
            setCrowdLine(metricMs <= tuning.eliteMs
                ? tx('Elite hands. No wasted motion.', 'Mains elite. Aucun mouvement perdu.')
                : tx('You beat the signal and the opponent.', 'Tu bats le signal et l adversaire.'));
        } else {
            playLoss(0.5);
            setFeedback(tx(`Too late: ${metricMs}ms vs ${opponentMetric}ms.`, `Trop tard : ${metricMs}ms contre ${opponentMetric}ms.`));
            setCrowdLine(tx('Reset your breathing. Next round is live.', 'Reset ta respiration. Prochaine manche live.'));
        }

        schedule(() => {
            if (updated.length < TOTAL_ROUNDS) {
                beginRound(updated.length + 1);
                return;
            }

            setPhase('matchEnd');
            setFeedback(matchWon
                ? tx('Match won. Fast hands, clean money.', 'Match gagne. Mains rapides, cash propre.')
                : tx('Match lost. The rematch is waiting.', 'Match perdu. La revanche attend.'));
            setCrowdLine(matchWon
                ? tx('The arena remembers that draw.', 'L arene se souvient de ce draw.')
                : tx('One tap away. Run it back.', 'A un tap pres. Relance.'));

            if (matchTypeRef.current === 'stake') {
                resolveDuel(matchWon, updated);
            }
        }, 1150);
    }, [clearTimers, playFalseStart, playLoss, playWin, resolveDuel, rounds, schedule, tuning.eliteMs, tuning.hardMs, tuning.standardMs, tx]);

    const beginRound = useCallback((round: number) => {
        clearTimers();
        const lane = pickLane();
        roundSettledRef.current = false;
        setRoundNum(round);
        setPhase('ready');
        setTargetLane(lane);
        setOpponentMs(0);
        setReactionMs(0);
        setFeedback(tx('Hands off. Wait for the signal.', 'Mains levees. Attends le signal.'));
        setCrowdLine(tx('No early taps. Watch the lanes.', 'Pas de tap trop tot. Regarde les lignes.'));
        playReady(0.4);

        schedule(() => {
            setPhase('delay');
            setFeedback(tx('Hold...', 'Tiens...'));
            setCrowdLine(tx('The room is holding its breath.', 'La salle retient son souffle.'));
        }, 450);

        const drawDelay = tuning.timeoutMsMin + Math.random() * (tuning.timeoutMsMax - tuning.timeoutMsMin);
        schedule(() => {
            const opponentMetric = Math.max(
                120,
                Math.round(
                    tuning.standardMs +
                    tuning.opponentMsOffset +
                    (Math.random() - 0.5) * tuning.timeoutMargin
                )
            );
            setOpponentMs(opponentMetric);
            setPhase('draw');
            setFeedback(tx(`Hit ${formatLane(lane, false).toUpperCase()} now.`, `Tape ${formatLane(lane, true).toUpperCase()} maintenant.`));
            setCrowdLine(tx('DRAW.', 'DRAW.'));
            drawAtRef.current = performance.now();
            playDraw(0.8);

            schedule(() => {
                finishRound(false, tuning.standardMs + tuning.timeoutMargin, opponentMetric);
            }, tuning.standardMs + tuning.timeoutMargin);
        }, drawDelay);
    }, [clearTimers, finishRound, playDraw, playReady, schedule, tuning.opponentMsOffset, tuning.standardMs, tuning.timeoutMargin, tuning.timeoutMsMax, tuning.timeoutMsMin, tx]);

    const startMatch = useCallback((practice: boolean) => {
        if (!practice && safeWallet < safeStake) return;
        activateAudio();
        clearTimers();
        const nextKind = practice ? 'practice' : 'stake';
        matchTypeRef.current = nextKind;
        setMatchType(nextKind);
        setRounds([]);
        setRoundNum(1);
        setPhase('ready');
        if (!practice) startDuel();
        beginRound(1);
    }, [activateAudio, beginRound, clearTimers, safeStake, safeWallet, startDuel]);

    const handleLaneClick = useCallback((lane: Lane) => {
        if (phase === 'ready' || phase === 'delay') {
            finishRound(false, -50, Math.max(120, tuning.standardMs + tuning.opponentMsOffset));
            return;
        }

        if (phase !== 'draw') return;

        const metricMs = Math.max(0, Math.round(performance.now() - drawAtRef.current));
        const opponentMetric = opponentMs || Math.max(120, tuning.standardMs + tuning.opponentMsOffset);
        finishRound(lane === targetLane && metricMs < opponentMetric, metricMs, opponentMetric);
    }, [finishRound, opponentMs, phase, targetLane, tuning.opponentMsOffset, tuning.standardMs]);

    const matchWon = wins > TOTAL_ROUNDS / 2;

    return (
        <section className={styles.panel} data-premium="true">
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Quickdraw</h2>
                    <p className={styles.sub}>
                        {tx(`Pure reflex lane duel · Stake: SLAP$ ${safeStake}`, `Duel reflexe par ligne · Mise : SLAP$ ${safeStake}`)}
                    </p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </header>

            <div className={styles.roundRow}>
                {Array.from({ length: TOTAL_ROUNDS }).map((_, index) => {
                    const round = rounds[index];
                    const statusClass = round ? (round.won ? styles.win : styles.loss) : index + 1 === roundNum && phase !== 'idle' && phase !== 'matchEnd' ? styles.live : '';
                    return (
                        <span key={index} className={`${styles.roundDot} ${statusClass}`}>
                            {index + 1}
                        </span>
                    );
                })}
                <div className={styles.comboBar}>
                    <div className={`${styles.comboFill} ${styles[`comboFill_${heat}`]}`} style={{ width: `${(wins / TOTAL_ROUNDS) * 100}%` }} />
                </div>
            </div>

            <div className={styles.chips}>
                <span className={`${styles.chip} ${styles.hot}`}>{tx('Mode', 'Mode')}: {matchType === 'practice' ? tx('Practice', 'Entrainement') : tx('Stake', 'Mise')}</span>
                <span className={`${styles.chip} ${styles[`heatChip_${heat}`]}`}>{tx('Heat', 'Heat')}: {heat.toUpperCase()}</span>
                <span className={styles.chip}>{tx('Difficulty', 'Difficulte')}: {getDifficultyLabel(difficultyMode, isFr)}</span>
                <span className={styles.chip}>{tx('Round', 'Manche')}: {phase === 'idle' ? '-' : roundNum}/{TOTAL_ROUNDS}</span>
                <span className={styles.chip}>{tx('Opponent', 'Adversaire')}: {opponentMs ? `${opponentMs}ms` : '-'}</span>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>
                    SFX: {soundOn ? 'ON' : 'OFF'}
                </button>
            </div>

            <div className={`${styles.arena} ${arenaPhaseClass}`}>
                <div className={styles.missionCard}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>

                {(phase === 'idle' || phase === 'ready' || phase === 'delay') && (
                    <div className={styles.readyDisplay}>
                        <div className={styles.pulseCircle} />
                        <div className={styles.readyText}>
                            {phase === 'idle' ? tx('READY?', 'PRET ?') : phase === 'ready' ? tx('HANDS OFF', 'MAINS LEVEES') : tx('HOLD', 'TIENS')}
                        </div>
                        <p className={styles.hint}>{tx('Tap only when a lane turns hot.', 'Tape seulement quand une ligne chauffe.')}</p>
                    </div>
                )}

                {phase === 'draw' && (
                    <div className={styles.drawDisplay}>
                        <div className={`${styles.drawText} ${styles.shake}`}>DRAW</div>
                        <div className={styles.laneGrid}>
                            {LANES.map((lane) => (
                                <button
                                    key={lane}
                                    type="button"
                                    className={`${styles.laneCard} ${lane === targetLane ? styles.laneHot : styles.laneCold}`}
                                    onClick={() => handleLaneClick(lane)}
                                >
                                    <span className={styles.laneLabel}>{formatLane(lane, isFr)}</span>
                                    <strong>{lane === targetLane ? tx('FIRE', 'FEU') : tx('HOLD', 'ATTENDS')}</strong>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(phase === 'result' || phase === 'matchEnd') && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${phase === 'matchEnd' ? (matchWon ? styles.ok : styles.bad) : rounds[rounds.length - 1]?.won ? styles.ok : styles.bad}`}>
                            {phase === 'matchEnd'
                                ? matchWon ? tx('MATCH WON', 'MATCH GAGNE') : tx('MATCH LOST', 'MATCH PERDU')
                                : rounds[rounds.length - 1]?.won ? tx('ROUND WON', 'MANCHE GAGNEE') : tx('ROUND LOST', 'MANCHE PERDUE')}
                        </h3>
                        <p className={styles.resultDetail}>
                            {reactionMs < 0 ? tx('False start', 'Faux depart') : `${reactionMs}ms vs ${opponentMs || '-'}ms`}
                        </p>
                        {phase === 'matchEnd' && (
                            <p className={styles.resultNet}>
                                {matchType === 'practice'
                                    ? tx('No stake · wallet unchanged', 'Sans mise · portefeuille inchange')
                                    : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}
                            </p>
                        )}
                        <div className={styles.resultRounds}>
                            {rounds.map((round, index) => (
                                <span key={index} className={`${styles.resultRoundDot} ${round.won ? styles.win : styles.loss}`}>
                                    {round.won ? 'WIN' : 'LOSS'} · {formatRoundMetric(round)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                {(phase === 'idle' || phase === 'matchEnd') ? (
                    <>
                        <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>
                            {phase === 'matchEnd' ? tx('Run It Back', 'Relancer') : tx('Start Quickdraw', 'Demarrer Quickdraw')}
                        </button>
                        <button className={styles.btn} onClick={() => startMatch(true)} disabled={isDueling}>
                            {tx('Training (No Stake)', 'Entrainement (Sans Mise)')}
                        </button>
                    </>
                ) : (
                    <p className={styles.nextRound}>
                        {phase === 'draw'
                            ? tx('Pick the hot lane before the opponent.', 'Choisis la ligne chaude avant l adversaire.')
                            : tx('Hold. Early taps lose the round.', 'Tiens. Un tap trop tot perd la manche.')}
                    </p>
                )}
            </div>

            {rounds.length > 0 && (
                <div className={styles.log}>
                    {rounds.map((round, index) => (
                        <div key={index} className={`${styles.logEntry} ${round.won ? styles.logWin : styles.logLoss}`}>
                            {tx('Round', 'Manche')} {index + 1} · QUICKDRAW · {formatRoundMetric(round)} · {round.won ? tx('WON', 'GAGNE') : tx('LOST', 'PERDU')}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
