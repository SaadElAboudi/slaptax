import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../TacticalGamePanel/TacticalGamePanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getStreak, getTacticalHeat, getTacticalPacing, gradeReactionMs, pickRandom, rangePick } from '../../gameplay/tactical';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'tell' | 'answer' | 'reveal' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type Move = 'strike' | 'guard' | 'feint' | 'call';
type Style = 'aggressive' | 'patient' | 'trickster';

const MOVE_LABELS_EN: Record<Move, string> = { strike: 'Strike', guard: 'Guard', feint: 'Feign', call: 'Call Bluff' };
const MOVE_LABELS_FR: Record<Move, string> = { strike: 'Frappe', guard: 'Garde', feint: 'Feinte', call: 'Appel Bluff' };

const STYLE_LABELS_EN: Record<Style, string> = { aggressive: 'Aggressive', patient: 'Patient', trickster: 'Trickster' };
const STYLE_LABELS_FR: Record<Style, string> = { aggressive: 'Agressif', patient: 'Patient', trickster: 'Truqueur' };

const COUNTERS: Record<Move, Move> = {
    strike: 'feint',
    guard: 'strike',
    feint: 'guard',
    call: 'strike',
};

const STYLE_CLUES_EN: Record<Style, string[]> = {
    aggressive: ['Heavy shoulders. They want to strike first.', 'A forward lean. Direct pressure.'],
    patient: ['Still breath. They are waiting.', 'No movement. They want your mistake.'],
    trickster: ['A fake twitch. They may bait.', 'Shoulder feint. Watch the trap.'],
};

const STYLE_CLUES_FR: Record<Style, string[]> = {
    aggressive: ['Epaules lourdes. Ils veulent frapper.', 'Penche en avant. Pression directe.'],
    patient: ['Respiration calme. Ils attendent.', 'Aucun mouvement. Ils veulent ton erreur.'],
    trickster: ['Fausse impulsion. Piège possible.', 'Feinte d epaule. Attention au leurre.'],
};

const DUEL_WIN_EN = [
    'You read them clean. Mind game won.',
    'That was surgical. The read was perfect.',
    'Perfect counter. The crowd felt it.',
];

const DUEL_WIN_FR = [
    'Lecture parfaite. Le duel mental est a toi.',
    'Surgical. Le read etait parfait.',
    'Contre parfait. La foule l a senti.',
];

const DUEL_LOSS_EN = [
    'You got faked out. Reset the pattern.',
    'Wrong read. Adjust and answer.',
    'They played your mind. Re-center.',
];

const DUEL_LOSS_FR = [
    'Tu t es fait feinter. Reset le pattern.',
    'Mauvaise lecture. Ajuste et reponds.',
    'Ils ont joue ton mental. Recentre-toi.',
];

function moveLabel(move: Move, isFr: boolean) {
    return isFr ? MOVE_LABELS_FR[move] : MOVE_LABELS_EN[move];
}

function styleLabel(style: Style, isFr: boolean) {
    return isFr ? STYLE_LABELS_FR[style] : STYLE_LABELS_EN[style];
}

//

function styleClue(style: Style, isFr: boolean) {
    return pickRandom(isFr ? STYLE_CLUES_FR[style] : STYLE_CLUES_EN[style]);
}

export function MindGameDuelPanel() {
    // Ajout : type de manche (bluff ou logique)
    type RoundType = 'bluff' | 'logique';
    const [roundType, setRoundType] = useState<RoundType>('logique');
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
    const [opponentStyle, setOpponentStyle] = useState<Style>('patient');
    const [opponentMove, setOpponentMove] = useState<Move>('guard');
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [feedback, setFeedback] = useState(tx('Read the player. Win the read.', 'Lis le joueur. Gagne la lecture.'));
    const [crowdLine, setCrowdLine] = useState(tx('The arena loves a smart read.', 'L arene adore une bonne lecture.'));
    //
    const [riskLine, setRiskLine] = useState(tx('You can also call the bluff if you dare.', 'Tu peux aussi appeler le bluff si tu oses.'));

    const timeoutRefs = useRef<number[]>([]);
    const tellStartRef = useRef(0);
    const lockedRef = useRef(false);

    const duelWins = rounds.filter((r) => r.won).length;
    const streak = getStreak(rounds);
    const heat = getTacticalHeat(streak);
    const totalRounds = 3;

    useEffect(() => {
        if (phase === 'idle') {
            setFeedback(isFr ? 'Lis le style. Puis reponds.' : 'Read the style. Then answer.');
            setCrowdLine(isFr ? 'Le mental fait la difference.' : 'The mental edge matters.');
            return;
        }
        if (phase === 'tell') {
            setFeedback(isFr ? `Indice : ${styleClue(opponentStyle, true)}` : `Tell: ${styleClue(opponentStyle, false)}`);
            setCrowdLine(isFr ? 'Observe. Ne precipite pas.' : 'Observe. Do not rush.');
            setRiskLine(isFr ? 'Appel bluff = gros coup si le style ment.' : 'Call bluff = huge swing if the style is fake.');
            return;
        }
        if (phase === 'answer') {
            setFeedback(isFr ? 'Choisis ta ligne.' : 'Choose your line.');
            setCrowdLine(isFr ? 'Le bon read decide tout.' : 'The right read decides everything.');
            setRiskLine(isFr ? 'Tu peux jouer safe ou tenter le call bluff.' : 'You can play safe or risk the bluff call.');
        }
    }, [isFr, phase, opponentStyle]);

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

    const startRound = useCallback((r: number, prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        const balance = prevRounds.filter((x) => x.won).length - (prevRounds.length - prevRounds.filter((x) => x.won).length);
        // Déterminer le type de manche (50/50)
        const type: RoundType = Math.random() < 0.5 ? 'bluff' : 'logique';
        setRoundType(type);
        // Style et move comme avant
        const styles: Style[] = ['aggressive', 'patient', 'trickster'];
        const style = pickRandom(styles);
        let move: Move;
        if (type === 'bluff') {
            // Forcer feint ou call
            move = pickRandom(['feint', 'call']);
        } else {
            // Forcer strike ou guard
            move = pickRandom(['strike', 'guard']);
        }
        const tellMs = rangePick(pacing.telegraphMs) + (balance < 0 ? 220 : balance > 1 ? -120 : 0);
        const answerMs = rangePick(pacing.responseMs);

        setPhase('tell');
        setRoundNum(r);
        setOpponentStyle(style);
        setOpponentMove(move);
        setSelectedMove(null);
        //
        lockedRef.current = false;
        playReady(heat === 'hot' ? 1 : heat === 'warm' ? 0.55 : 0.25);

        schedule(() => {
            setPhase('answer');
            tellStartRef.current = performance.now();
            playDraw(heat === 'hot' ? 0.9 : 0.45);
            schedule(() => {
                if (lockedRef.current) return;
                lockedRef.current = true;
                setPhase('reveal');
                //
                setFeedback(tx('You hesitated. The read faded.', 'Tu as hesite. La lecture s est evaporee.'));
                setCrowdLine(pickRandom(isFr ? DUEL_LOSS_FR : DUEL_LOSS_EN));
                playLoss(heat === 'hot' ? 0.8 : 0.45);

                setRounds((prev) => {
                    const updated = [...prev, { gameId: 'mindgameduel', won: false, playerMetricMs: answerMs, difficulty: gradeReactionMs(answerMs, pacing) }];
                    schedule(() => {
                        if (updated.length < totalRounds) startRound(updated.length + 1, updated, kind);
                        else {
                            setPhase('matchEnd');
                            if (kind === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                        }
                    }, pacing.settleMs[0]);
                    return updated;
                });
            }, answerMs);
        }, tellMs);
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
        setFeedback(practice ? tx('Training duel. No stake.', 'Duel mental en entrainement. Sans mise.') : tx('Mind game duel. Read first.', 'Duel mental. Lis d abord.'));
        setCrowdLine(tx('The smallest detail wins.', 'Le moindre detail gagne.'));
        schedule(() => startRound(1, [], kind), 0);
    }, [activateAudio, clearTimers, safeWallet, safeStake, startDuel, schedule, startRound, tx]);

    const handleMove = useCallback((move: Move) => {
        if (phase !== 'answer' || lockedRef.current) return;
        lockedRef.current = true;
        clearTimers();
        const reaction = Math.max(0, Math.round(performance.now() - tellStartRef.current));
        const won = move === 'call' ? opponentStyle === 'trickster' : COUNTERS[move] === opponentMove;
        setSelectedMove(move);
        //
        setPhase('reveal');
        if (roundType === 'bluff') {
            setFeedback(
                move === 'call'
                    ? (won ? tx('Bluff called. You caught the trap.', 'Bluff appele. Tu catches le piege.') : tx('Bad call. They were not faking.', 'Mauvais appel. Ce n etait pas une feinte.'))
                    : (won ? tx('Feinte parfaite. Bluff reussi.', 'Feinte parfaite. Bluff reussi.') : tx('Bluff rate. Pris a ton propre jeu.', 'Bluff rate. Pris a ton propre jeu.'))
            );
        } else {
            setFeedback(won ? tx('You won the read.', 'Tu gagnes la lecture.') : tx('They read you first.', 'Ils t ont lu avant.'));
        }
        setCrowdLine(won ? pickRandom(isFr ? DUEL_WIN_FR : DUEL_WIN_EN) : pickRandom(isFr ? DUEL_LOSS_FR : DUEL_LOSS_EN));

        setRounds((prev) => {
            const updated = [...prev, { gameId: 'mindgameduel', won, playerMetricMs: reaction, difficulty: gradeReactionMs(reaction, pacing) }];
            if (won) playWin(reaction < pacing.eliteMs ? 1 : 0.75);
            else playLoss(0.45);
            schedule(() => {
                if (updated.length < totalRounds) startRound(updated.length + 1, updated, matchType);
                else {
                    setPhase('matchEnd');
                    if (matchType === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                }
            }, pacing.settleMs[1]);
            return updated;
        });
    }, [phase, clearTimers, opponentMove, isFr, pacing, playWin, playLoss, schedule, startRound, matchType, resolveDuel, tx]);

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Duel Mental' : 'Mind Game Duel'}</h2>
                    <p className={styles.sub}>{isFr ? `Lecture, bluff, contre · duel 1v1 moins rush · Mise : SLAP$ ${safeStake}` : `Read, bluff, counter · less rush, more read · Stake: SLAP$ ${safeStake}`}</p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </div>

            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Jeu' : 'Game'}: MIND</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {duelWins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Style adverse' : 'Opponent style'}: {styleLabel(opponentStyle, isFr)}</span>
                <span className={styles.chip}>{isFr ? 'Chaleur' : 'Heat'}: {heat.toUpperCase()}</span>
                <span className={styles.chip}>{isFr ? 'Risque' : 'Risk'}: {moveLabel('call', isFr)}</span>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>{soundOn ? 'SFX ON' : 'SFX OFF'}</button>
            </div>

            <div className={styles.arena}>
                <div className={styles.missionCard + ' ' + styles.feedback}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>
                {phase === 'idle' && <div className={styles.resultOverlay}><h3 className={styles.resultTitle}>{isFr ? 'LIS LE VISAGE' : 'READ THE FACE'}</h3><p className={styles.resultNet}>{isFr ? 'Le plus lent a perdre est le plus rapide a gagner.' : 'The slowest to panic is fastest to win.'}</p></div>}
                {(phase === 'tell' || phase === 'answer') && (
                    <div style={{ position: 'absolute', inset: '78px 12px 60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {(roundType === 'bluff' ? (['feint', 'call'] as Move[]) : (['strike', 'guard'] as Move[])).map((move) => {
                            const active = selectedMove === move;
                            const beating = move !== 'call' && COUNTERS[move] === opponentMove;
                            // Ajout : style premium selon résultat
                            let btnClass = styles.moveBtn;
                            if ((phase === 'tell' || phase === 'answer') && selectedMove === move) {
                                btnClass += ' ' + (rounds[roundNum - 1]?.won ? styles.win : styles.loss);
                            }
                            return (
                                <button
                                    key={move}
                                    type="button"
                                    onClick={() => handleMove(move)}
                                    disabled={phase !== 'answer'}
                                    className={btnClass}
                                    style={{
                                        borderRadius: 18,
                                        border: active ? '2px solid var(--accent)' : move === 'call' ? '1px solid rgba(255,212,0,0.45)' : beating && phase === 'answer' ? '2px solid var(--ok)' : '1px solid rgba(255,255,255,0.08)',
                                        background: active ? 'rgba(255,212,0,0.14)' : move === 'call' ? 'rgba(255,212,0,0.06)' : 'rgba(255,255,255,0.03)',
                                        color: 'var(--text)',
                                        fontFamily: 'Space Mono, monospace',
                                        fontWeight: 700,
                                        cursor: phase === 'answer' ? 'pointer' : 'default',
                                        minHeight: 180,
                                        position: 'relative',
                                    }}
                                >
                                    <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 10 }}>{isFr ? styleLabel(opponentStyle, true) : styleLabel(opponentStyle, false)}</div>
                                    <div style={{ fontFamily: 'Black Ops One, cursive', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>{moveLabel(move, isFr)}</div>
                                    <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: '0.72rem' }}>{move === 'call' ? (isFr ? 'Gros risque / gros swing' : 'High risk / high swing') : phase === 'answer' ? (isFr ? 'Choisis' : 'Pick') : (COUNTERS[move] === opponentMove ? (isFr ? 'Bonne lecture' : 'Good read') : (isFr ? 'Carte possible' : 'Possible line'))}</div>
                                    {/* Affichage du type de manche */}
                                    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#ffd700', textShadow: '0 2px 8px #222' }}>
                                        {roundType === 'bluff' ? (isFr ? 'Round de bluff' : 'Bluff round') : (isFr ? 'Round logique' : 'Logic round')}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
                {phase === 'reveal' && selectedMove && (
                    <div className={rounds[roundNum - 1]?.won ? styles.flashWin : styles.flashLoss} />
                )}
                {phase === 'matchEnd' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${duelWins > totalRounds / 2 ? styles.ok : styles.bad}`}>{duelWins > totalRounds / 2 ? (isFr ? 'MENTAL DOMINE' : 'MENTAL DOMINATED') : (isFr ? 'MENTAL PERDU' : 'MENTAL LOST')}</h3>
                        <p className={styles.resultNet}>{matchType === 'practice' ? (isFr ? 'Sans mise' : 'No stake') : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}</p>
                        <div className={styles.resultRounds}>{rounds.map((r, i) => <span key={i} className={`${styles.resultRoundDot} ${r.won ? styles.win : styles.loss}`}>{r.won ? '✓' : '✗'} {r.playerMetricMs ?? '--'}ms</span>)}</div>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                {(phase === 'idle' || phase === 'matchEnd') ? (
                    <>
                        <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>{phase === 'matchEnd' ? (isFr ? 'Relancer' : 'Run It Back') : (isFr ? 'Demarrer Duel Mental' : 'Start Mind Duel')}</button>
                        <button className={styles.btn} onClick={() => startMatch(true)} disabled={isDueling}>{isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}</button>
                    </>
                ) : (
                    <p className={styles.sub}>{phase === 'tell' ? (isFr ? 'Lis le tell.' : 'Read the tell.') : (isFr ? 'Joue la bonne ligne.' : 'Play the right line.')}</p>
                )}
            </div>

            <div className={styles.log}>
                <div className={styles.logEntry}>{riskLine}</div>
            </div>
        </section>
    );
}
