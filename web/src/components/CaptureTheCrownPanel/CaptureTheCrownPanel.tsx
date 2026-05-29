import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../TacticalGamePanel/TacticalGamePanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getStreak, getTacticalHeat, getTacticalPacing, gradeReactionMs, pickRandom, rangePick } from '../../gameplay/tactical';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'reveal' | 'race' | 'hold' | 'result' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type Lane = 0 | 1 | 2;
type Pressure = 'rush' | 'flank' | 'bait';

const LANE_LABELS_EN = ['Left', 'Center', 'Right'];
const LANE_LABELS_FR = ['Gauche', 'Centre', 'Droite'];

const PRESSURE_RULES: Record<Pressure, { action: 'Brace' | 'Shift' | 'Feign' }> = {
    rush: { action: 'Brace' },
    flank: { action: 'Shift' },
    bait: { action: 'Feign' },
};

const CROWN_WIN_EN = [
    'Crown secured. The crowd follows your pace.',
    'You kept the crown alive. Clean survival.',
    'Royal control. Opponent lost the chase.',
];

const CROWN_WIN_FR = [
    'Couronne securisee. La foule suit ton rythme.',
    'Tu gardes la couronne en vie. Survie propre.',
    'Controle royal. L adversaire perd la chasse.',
];

const CROWN_LOSS_EN = [
    'You dropped the crown. Reclaim the route.',
    'Pressure cracked you. Reset the hold.',
    'Opponent forced the collapse.',
];

const CROWN_LOSS_FR = [
    'Tu perds la couronne. Reprends la route.',
    'La pression t a casse. Reset la tenue.',
    'L adversaire force la chute.',
];

function laneLabel(lane: Lane, isFr: boolean) {
    return isFr ? LANE_LABELS_FR[lane] : LANE_LABELS_EN[lane];
}

function crownHoldText(pressure: Pressure, isFr: boolean) {
    if (isFr) {
        if (pressure === 'rush') return 'Pression frontale. Pare fort.';
        if (pressure === 'flank') return 'Flanc ouvert. Glisse.';
        return 'Leurre detecte. Feinte.';
    }
    if (pressure === 'rush') return 'Direct pressure. Brace hard.';
    if (pressure === 'flank') return 'Side pressure. Shift.';
    return 'Bait pressure. Feint back.';
}

export function CaptureTheCrownPanel() {
    const { stake, wallet, isDueling, startDuel, resolveDuel, lastNet, language } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { activateAudio, soundOn, toggleSound, playReady, playDraw, playWin, playLoss } = useSfx();

    const isFr = language === 'fr';
    const tx = (en: string, fr: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);
    const pacing = getTacticalPacing(difficultyMode);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNum, setRoundNum] = useState(0);
    const [crownLane, setCrownLane] = useState<Lane>(1);
    const [pressure, setPressure] = useState<Pressure>('rush');
    const [feedback, setFeedback] = useState(tx('The crown is above the arena.', 'La couronne plane au-dessus de l arene.'));
    const [crowdLine, setCrowdLine] = useState(tx('One grab, one hold, one escape.', 'Une prise, une tenue, une fuite.'));
    const [reactionMs, setReactionMs] = useState(0);
    const [holdAction, setHoldAction] = useState<string>('');

    const timeoutRefs = useRef<number[]>([]);
    const raceStartRef = useRef(0);
    const holdStartRef = useRef(0);
    const roundLockedRef = useRef(false);

    const crownWins = rounds.filter((r) => r.won).length;
    const streak = getStreak(rounds);
    const heat = getTacticalHeat(streak);
    const totalRounds = 3;

    useEffect(() => {
        if (phase === 'idle') {
            setFeedback(isFr ? 'Attrape la couronne puis tiens la ligne.' : 'Grab the crown, then hold the line.');
            setCrowdLine(isFr ? 'Calme avant l embrasement.' : 'Calm before the flare-up.');
            return;
        }
        if (phase === 'reveal') {
            setFeedback(isFr ? `Couronne en ${laneLabel(crownLane, true)}.` : `Crown in ${laneLabel(crownLane, false)}.`);
            setCrowdLine(isFr ? 'Lis le spawn. Va proprement.' : 'Read the spawn. Go clean.');
            return;
        }
        if (phase === 'race') {
            setFeedback(isFr ? 'Va chercher la couronne.' : 'Take the crown now.');
            setCrowdLine(isFr ? 'Pas de panique. Saisis le bon couloir.' : 'No panic. Take the right lane.');
            return;
        }
        if (phase === 'hold') {
            setFeedback(tx('Hold phase. Read the pressure.', 'Phase de tenue. Lis la pression.'));
            setCrowdLine(tx(crownHoldText(pressure, false), crownHoldText(pressure, true)));
        }
    }, [isFr, phase, crownLane, pressure, tx]);

    const clearTimers = useCallback(() => {
        timeoutRefs.current.forEach((id) => window.clearTimeout(id));
        timeoutRefs.current = [];
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((value) => value !== id);
            fn();
        }, delay);
        timeoutRefs.current.push(id);
    }, []);

    const advanceRound = useCallback((r: number, prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        const balance = prevRounds.filter((x) => x.won).length - (prevRounds.length - prevRounds.filter((x) => x.won).length);
        const lane = rangePick([0, 2]) as Lane;
        const pressurePool: Pressure[] = ['rush', 'flank', 'bait'];
        const holdWindow = rangePick(pacing.responseMs) + (balance < 0 ? 220 : balance > 1 ? -120 : 0);

        setPhase('reveal');
        setRoundNum(r);
        setCrownLane(lane);
        setPressure(pickRandom(pressurePool));
        setReactionMs(0);
        setHoldAction('');
        roundLockedRef.current = false;
        playReady(heat === 'hot' ? 1 : heat === 'warm' ? 0.55 : 0.25);

        schedule(() => {
            setPhase('race');
            raceStartRef.current = performance.now();
            playDraw(heat === 'hot' ? 0.9 : 0.45);
            schedule(() => {
                if (roundLockedRef.current) return;
                roundLockedRef.current = true;
                setPhase('result');
                setReactionMs(holdWindow);
                setFeedback(tx('Too slow. Crown stolen.', 'Trop lent. Couronne volee.'));
                setCrowdLine(pickRandom(isFr ? CROWN_LOSS_FR : CROWN_LOSS_EN));
                playLoss(heat === 'hot' ? 0.8 : 0.45);

                setRounds((prev) => {
                    const updated = [...prev, { gameId: 'crownrush', won: false, playerMetricMs: holdWindow, difficulty: gradeReactionMs(holdWindow, pacing) }];
                    schedule(() => {
                        if (updated.length < totalRounds) advanceRound(updated.length + 1, updated, kind);
                        else {
                            setPhase('matchEnd');
                            if (kind === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                        }
                    }, pacing.settleMs[0]);
                    return updated;
                });
            }, holdWindow);
        }, rangePick(pacing.telegraphMs));
    }, [clearTimers, pacing, playReady, playDraw, playLoss, heat, isFr, resolveDuel, schedule, tx]);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        clearTimers();
        if (!practice && safeWallet < safeStake) return;
        const kind: MatchKind = practice ? 'practice' : 'stake';
        setMatchType(kind);
        if (!practice) startDuel();
        setRounds([]);
        setRoundNum(0);
        setPhase('idle');
        setFeedback(practice ? tx('Training crown run. No stake.', 'Entrainement couronne. Sans mise.') : tx('Crown raid. Grab and survive.', 'Raid de couronne. Prends et survis.'));
        setCrowdLine(tx('Take it, then protect it.', 'Prends-la, puis protege-la.'));
        schedule(() => advanceRound(1, [], kind), 0);
    }, [activateAudio, clearTimers, safeWallet, safeStake, startDuel, schedule, advanceRound, tx]);

    const handleLane = useCallback((lane: Lane) => {
        if (phase === 'race' && !roundLockedRef.current) {
            const reaction = Math.max(0, Math.round(performance.now() - raceStartRef.current));
            const won = lane === crownLane;
            if (!won) return;
            roundLockedRef.current = true;
            clearTimers();
            setPhase('hold');
            holdStartRef.current = performance.now();
            setReactionMs(reaction);
            setFeedback(isFr ? 'Couronne prise. Tiens la pression.' : 'Crown secured. Hold the pressure.');
            setCrowdLine(isFr ? 'Maintenant, tiens la ligne.' : 'Now hold the line.');
            playWin(reaction < pacing.eliteMs ? 1 : 0.75);
            schedule(() => {
                setHoldAction('');
                setFeedback(tx('Pressure wave incoming. Pick the right defense.', 'Vague de pression. Choisis la bonne defense.'));
            }, 250);
            return;
        }

        if (phase !== 'hold' || roundLockedRef.current) return;
        roundLockedRef.current = true;
        clearTimers();
        const reaction = Math.max(0, Math.round(performance.now() - holdStartRef.current));
        const required = PRESSURE_RULES[pressure].action;
        const won = (lane === 0 ? 'Brace' : lane === 1 ? 'Shift' : 'Feign') === required;

        setReactionMs(reaction);
        setHoldAction(required);
        setPhase('result');
        setFeedback(won ? tx('You kept the crown alive.', 'Tu gardes la couronne en vie.') : tx('The hold cracked.', 'La tenue a casse.'));
        setCrowdLine(won ? pickRandom(isFr ? CROWN_WIN_FR : CROWN_WIN_EN) : pickRandom(isFr ? CROWN_LOSS_FR : CROWN_LOSS_EN));

        setRounds((prev) => {
            const updated = [...prev, { gameId: 'crownrush', won, playerMetricMs: reaction, difficulty: gradeReactionMs(reaction, pacing) }];
            if (won) playWin(reaction < pacing.eliteMs ? 1 : 0.7);
            else playLoss(0.45);
            schedule(() => {
                if (updated.length < totalRounds) advanceRound(updated.length + 1, updated, matchType);
                else {
                    setPhase('matchEnd');
                    if (matchType === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                }
            }, pacing.settleMs[1]);
            return updated;
        });
    }, [phase, clearTimers, isFr, pacing, pressure, playWin, playLoss, schedule, advanceRound, matchType, resolveDuel, tx]);

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Capture de la Couronne' : 'Capture the Crown'}</h2>
                    <p className={styles.sub}>{isFr ? `Spawn + prise + survie · rythme pose · Mise : SLAP$ ${safeStake}` : `Spawn + grab + survival · paced duel · Stake: SLAP$ ${safeStake}`}</p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </div>

            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Jeu' : 'Game'}: CROWN</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {crownWins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Chaleur' : 'Heat'}: {heat.toUpperCase()}</span>
                <span className={styles.chip}>{isFr ? 'Difficulte' : 'Difficulty'}: {difficultyMode}</span>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>{soundOn ? 'SFX ON' : 'SFX OFF'}</button>
            </div>

            <div className={styles.arena}>
                <div className={styles.missionCard}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>
                {(phase === 'reveal' || phase === 'race') && (
                    <div style={{ position: 'absolute', inset: '78px 12px 60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[0, 1, 2].map((lane) => {
                            const active = crownLane === lane;
                            return (
                                <button
                                    key={lane}
                                    type="button"
                                    onClick={() => handleLane(lane as Lane)}
                                    disabled={phase !== 'race'}
                                    style={{
                                        borderRadius: 18,
                                        border: active ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                                        background: active ? 'rgba(255,212,0,0.14)' : 'rgba(255,255,255,0.03)',
                                        color: 'var(--text)',
                                        fontFamily: 'Space Mono, monospace',
                                        fontWeight: 700,
                                        cursor: phase === 'race' ? 'pointer' : 'default',
                                        minHeight: 190,
                                        position: 'relative',
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 12, left: 12, right: 12, color: 'var(--muted)', fontSize: '0.7rem' }}>{laneLabel(lane as Lane, isFr)}</div>
                                    <div style={{ fontFamily: 'Black Ops One, cursive', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', marginTop: 40 }}>{active ? '👑' : '⬚'}</div>
                                    <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: 'var(--muted)', fontSize: '0.72rem' }}>{phase === 'reveal' ? (isFr ? 'Couronne en approche' : 'Crown incoming') : (isFr ? 'Clique pour prendre' : 'Click to grab')}</div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {phase === 'hold' && (
                    <div style={{ position: 'absolute', inset: '78px 12px 60px', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Black Ops One, cursive', fontSize: 'clamp(1.7rem, 4vw, 3rem)', color: 'var(--accent)' }}>{isFr ? 'TENUE DE LA COURONNE' : 'CROWN HOLD'}</div>
                        <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: '0.84rem', maxWidth: 420 }}>{isFr ? crownHoldText(pressure, true) : crownHoldText(pressure, false)}</div>
                        <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {isFr ? 'Brace = bloquer · Shift = bouger · Feign = leurre' : 'Brace = block · Shift = move · Feign = fake'}
                        </div>
                        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: 'min(480px, 100%)' }}>
                            {['Brace', 'Shift', 'Feign'].map((action, idx) => {
                                const active = holdAction === action;
                                return (
                                    <button
                                        key={action}
                                        type="button"
                                        onClick={() => handleLane(idx as Lane)}
                                        style={{
                                            padding: '12px 10px',
                                            borderRadius: 14,
                                            border: active ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                                            background: active ? 'rgba(255,212,0,0.14)' : 'rgba(255,255,255,0.03)',
                                            color: 'var(--text)',
                                            fontFamily: 'Space Mono, monospace',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {action}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {phase === 'result' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${rounds[roundNum - 1]?.won ? styles.ok : styles.bad}`}>{rounds[roundNum - 1]?.won ? (isFr ? 'COURONNE TENUE' : 'CROWN HELD') : (isFr ? 'COURONNE PERDUE' : 'CROWN LOST')}</h3>
                        <p className={styles.resultNet}>{isFr ? 'Reaction' : 'Reaction'}: {reactionMs}ms</p>
                        <p className={styles.resultDetail}>{isFr ? 'Une bonne defence garde la couronne.' : 'A good defense keeps the crown alive.'}</p>
                    </div>
                )}

                {phase === 'matchEnd' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${crownWins > totalRounds / 2 ? styles.ok : styles.bad}`}>{crownWins > totalRounds / 2 ? (isFr ? 'REINE DU MATCH' : 'MATCH ROYALTY') : (isFr ? 'MATCH PERDU' : 'MATCH LOST')}</h3>
                        <p className={styles.resultNet}>{matchType === 'practice' ? (isFr ? 'Sans mise' : 'No stake') : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}</p>
                        <div className={styles.resultRounds}>{rounds.map((r, i) => <span key={i} className={`${styles.resultRoundDot} ${r.won ? styles.win : styles.loss}`}>{r.won ? '✓' : '✗'} {r.playerMetricMs ?? '--'}ms</span>)}</div>
                    </div>
                )}

                {phase === 'idle' && <div className={styles.resultOverlay}><h3 className={styles.resultTitle}>{isFr ? 'COURONNE EN ATTENTE' : 'CROWN WAITING'}</h3><p className={styles.resultNet}>{isFr ? 'Lecture, prise, survie.' : 'Read, grab, survive.'}</p></div>}
            </div>

            <div className={styles.controls}>
                {(phase === 'idle' || phase === 'matchEnd') ? (
                    <>
                        <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>{phase === 'matchEnd' ? (isFr ? 'Relancer' : 'Run It Back') : (isFr ? 'Demarrer Couronne' : 'Start Crown Run')}</button>
                        <button className={styles.btn} onClick={() => startMatch(true)} disabled={isDueling}>{isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}</button>
                    </>
                ) : (
                    <p className={styles.sub}>{phase === 'reveal' ? (isFr ? 'Lis la telegraphie.' : 'Read the telegraph.') : phase === 'race' ? (isFr ? 'Prends la lane.' : 'Take the lane.') : (isFr ? 'Tiens la couronne.' : 'Hold the crown.')}</p>
                )}
            </div>
        </section>
    );
}
