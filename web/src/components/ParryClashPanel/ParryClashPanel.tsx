import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ParryClashPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getDifficultyLabel, getParryTuning } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'telegraph' | 'strike' | 'result' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type Lane = 'left' | 'center' | 'right';

const LANES: Lane[] = ['left', 'center', 'right'];

export function ParryClashPanel() {
    const { stake, wallet, language, isDueling, lastNet, startDuel, resolveDuel } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { soundOn, toggleSound, activateAudio, playReady, playDraw, playWin, playLoss, playFalseStart } = useSfx();
    const tuning = getParryTuning(difficultyMode);

    const isFr = language === 'fr';
    const tx = (fr: string, en: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNum, setRoundNum] = useState(1);
    const [targetLane, setTargetLane] = useState<Lane>('left');
    const [laneHint, setLaneHint] = useState<Lane | null>(null);
    const [parryWindowMs, setParryWindowMs] = useState(200);
    const [feedback, setFeedback] = useState(tx('Lis la feinte. Prépare-toi.', 'Read the feint. Get ready.'));
    const [crowdLine, setCrowdLine] = useState(tx('Focus. Prêt à parer.', 'Focus. Ready to parry.'));
    const [reactionMs, setReactionMs] = useState(0);
    const [playerWins, setPlayerWins] = useState(0);
    const [totalRounds] = useState(3);

    // Timing refs
    const strikeHandledRef = useRef(false);
    const strikeAtRef = useRef(0);
    const parryWindowRef = useRef(200);
    const timerRefs = useRef<number[]>([]);

    const clearTimers = useCallback(() => {
        timerRefs.current.forEach((id) => window.clearTimeout(id));
        timerRefs.current = [];
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timerRefs.current = timerRefs.current.filter((v) => v !== id);
            fn();
        }, delay);
        timerRefs.current.push(id);
    }, []);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        setMatchType(practice ? 'practice' : 'stake');
        setRounds([]);
        setRoundNum(1);
        setPlayerWins(0);
        setPhase('telegraph');
        setFeedback(tx('Lis la feinte. Prépare-toi.', 'Read the feint. Get ready.'));
        setCrowdLine(tx('Focus. Prêt à parer.', 'Focus. Ready to parry.'));
        beginRound(1);
        if (!practice) startDuel();
    }, [activateAudio, startDuel, tx]);

    const beginRound = useCallback((round: number) => {
        clearTimers();
        strikeHandledRef.current = false;
        setPhase('telegraph');
        setRoundNum(round);
        setLaneHint(null);
        setFeedback(tx('Lis la feinte. Prépare-toi.', 'Read the feint. Get ready.'));
        setCrowdLine(tx('Focus. Prêt à parer.', 'Focus. Ready to parry.'));
        // Randomize target lane
        const lane: Lane = LANES[Math.floor(Math.random() * LANES.length)];
        setTargetLane(lane);
        // Randomize hint (sometimes correct, sometimes not)
        setLaneHint(Math.random() < 0.7 ? lane : LANES[Math.floor(Math.random() * LANES.length)]);
        // Parry window
        const baseWindow = 200 + tuning.windowBoost;
        setParryWindowMs(baseWindow);
        parryWindowRef.current = baseWindow;
        // Telegraph phase
        playReady();
        schedule(() => {
            setPhase('strike');
            setFeedback(tx('Choisis la bonne réaction!', 'Choose the right reaction!'));
            setCrowdLine(tx('Fenêtre de parade ouverte.', 'Parry window open.'));
            playDraw();
            strikeAtRef.current = performance.now();
        }, 1200 + tuning.telegraphBoost);
    }, [clearTimers, playReady, playDraw, schedule, tx, tuning]);

    const handleParry = useCallback((lane: Lane) => {
        if ((phase !== 'strike' && phase !== 'telegraph') || strikeHandledRef.current) return;
        strikeHandledRef.current = true;
        clearTimers();
        const falseStart = phase === 'telegraph';
        const delta = Math.max(0, Math.round(performance.now() - strikeAtRef.current));
        const activeWindowMs = parryWindowRef.current;
        const won = !falseStart && lane === targetLane && delta <= activeWindowMs;
        const metric = falseStart ? -50 : delta;
        setPhase('result');
        setReactionMs(metric);
        setFeedback(falseStart
            ? tx('Fausse parade. Attends la frappe.', 'False parry. Wait for the strike.')
            : won
                ? tx(`Parade parfaite en ${delta}ms.`, `Perfect parry in ${delta}ms.`)
                : tx(`Mauvaise lecture. ${lane.toUpperCase()} vs ${targetLane.toUpperCase()}.`, `Missed read. ${lane.toUpperCase()} vs ${targetLane.toUpperCase()}.`));
        setCrowdLine(falseStart
            ? tx('La salle a vu le bait.', 'The room saw the bait.')
            : won
                ? tx('La foule explose. Nerfs d acier.', 'Crowd explodes. Steel nerves.')
                : tx('Tu t es fait ouvrir.', 'You got opened up.'));
        if (falseStart) playFalseStart(); else if (won) playWin(); else playLoss();
        setRounds((prev) => {
            const updated = [...prev, { gameId: 'parryclash', won, playerMetricMs: metric }];
            const wins = updated.filter((r) => r.won).length;
            setPlayerWins(wins);
            schedule(() => {
                if (updated.length < totalRounds) {
                    beginRound(updated.length + 1);
                } else {
                    setPhase('matchEnd');
                    setFeedback(wins > totalRounds / 2 ? tx('Match gagné. Parade de génie.', 'Match win. Genius parry.') : tx('Match perdu. Reviens plus fort.', 'Match loss. Come back stronger.'));
                    setCrowdLine(wins > totalRounds / 2 ? tx('Rythme parfait.', 'Perfect rhythm.') : tx('Prochain challenger, montre ta force.', 'Next challenger, show your skill.'));
                    if (matchType === 'stake') resolveDuel(wins > totalRounds / 2, updated);
                }
            }, 1400);
            return updated;
        });
    }, [phase, clearTimers, playFalseStart, playWin, playLoss, tx, targetLane, schedule, beginRound, matchType, resolveDuel, totalRounds]);

    // UI
    return (
        <section className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Parry Clash</h2>
                    <p className={styles.sub}>{tx(`Lis la feinte · pare la bonne ligne · Mise : SLAP$ ${safeStake}`, `Read the feint · parry the right lane · Stake: SLAP$ ${safeStake}`)}</p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </header>
            <div className={styles.chips}>
                <div className={styles.chip}>{tx('Mise', 'Stake')}: {safeStake} SLAP$</div>
                <div className={styles.chip}>{tx('Difficulte', 'Difficulty')}: {getDifficultyLabel(difficultyMode, isFr)}</div>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>
                    SFX: {soundOn ? 'ON' : 'OFF'}
                </button>
            </div>
            <div className={styles.arena + ' ' + (phase === 'strike' ? styles.phase_strike : '')}>
                <div className={styles.feedbackTop}>{feedback}</div>
                <div className={styles.centerState}>
                    {phase === 'telegraph' && <p className={styles.state}>{isFr ? 'LIS LA FEINTE' : 'READ THE FEINT'}</p>}
                    {phase === 'strike' && <p className={styles.stateHot}>{isFr ? 'CHOISIS LA BONNE REACTION' : 'CHOOSE THE RIGHT REACTION'}</p>}
                    {laneHint && <p className={styles.hint}>{isFr ? 'Indice ligne' : 'Hint lane'}: {laneHint.toUpperCase()}</p>}
                    {phase === 'strike' && <p className={styles.hint}>{isFr ? 'Fenetre' : 'Window'}: {parryWindowMs}ms</p>}
                </div>
                {phase === 'result' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={styles.resultTitle + ' ' + (rounds[roundNum - 1]?.won ? styles.ok : styles.bad)}>
                            {rounds[roundNum - 1]?.playerMetricMs === -50 ? (isFr ? 'FAUSSE PARADE' : 'FALSE PARRY') : rounds[roundNum - 1]?.won ? (isFr ? 'PARADE GAGNEE' : 'PARRY WIN') : (isFr ? 'PARADE PERDUE' : 'PARRY LOSS')}
                        </h3>
                        <p className={styles.resultDetail}>{isFr ? 'Reaction' : 'Reaction'}: {reactionMs}ms</p>
                    </div>
                )}
                {phase === 'matchEnd' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={styles.resultTitle + ' ' + (playerWins > totalRounds / 2 ? styles.ok : styles.bad)}>
                            {playerWins > totalRounds / 2 ? (isFr ? 'MATCH GAGNE' : 'MATCH WIN') : (isFr ? 'MATCH PERDU' : 'MATCH LOSS')}
                        </h3>
                        <p className={styles.resultDetail}>
                            {matchType === 'practice' ? (isFr ? 'Sans mise · mode entrainement' : 'No stake · training mode') : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}
                        </p>
                    </div>
                )}
            </div>
            <div className={styles.crowdLine}>{crowdLine}</div>
            <div className={styles.controls}>
                {LANES.map((lane) => (
                    <button key={lane} className={styles.btnLane} onClick={() => handleParry(lane)} disabled={phase !== 'strike' && phase !== 'telegraph'}>
                        {isFr
                            ? lane === 'left' ? 'Gauche · Bloquer' : lane === 'center' ? 'Centre · Contrer' : 'Droite · Esquiver'
                            : lane === 'left' ? 'Left · Block' : lane === 'center' ? 'Center · Counter' : 'Right · Dodge'}
                    </button>
                ))}
            </div>
            <div className={styles.controls}>
                {(phase === 'idle' || phase === 'matchEnd') && (
                    <>
                        <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>
                            {phase === 'matchEnd' ? (isFr ? 'Relancer' : 'Run Another') : (isFr ? 'Demarrer Parry Clash' : 'Start Parry Clash')}
                        </button>
                        <button className={styles.btn} onClick={() => startMatch(true)} disabled={isDueling}>
                            {isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}
                        </button>
                    </>
                )}
            </div>
            {rounds.length > 0 && (
                <div className={styles.log}>
                    {rounds.map((r, i) => (
                        <div key={i} className={styles.logEntry + ' ' + (r.won ? styles.logWin : styles.logLoss)}>
                            {isFr ? 'Manche' : 'Round'} {i + 1} · {r.playerMetricMs === -50 ? (isFr ? 'FAUSSE PARADE' : 'FALSE PARRY') : `${r.playerMetricMs}ms`} · {r.won ? (isFr ? 'GAGNE' : 'WON') : (isFr ? 'PERDU' : 'LOST')}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
