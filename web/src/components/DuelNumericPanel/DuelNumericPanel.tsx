import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DuelNumericPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getDuelNumericTuning } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'readyQuestion' | 'guess' | 'reveal' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

interface NumericQuestion {
    question: string;
    answers: [number, number]; // [correct, wrong]
    correctIndex: 0 | 1;
    // ...existing code...
}

// ─── Question Generator ─────────────────────────────────────────────────────

function generateNumericQuestion(isFr: boolean): NumericQuestion {
    // Choix du type de question : addition ou multiplication
    const type = Math.random() < 0.5 ? 'add' : 'mul';
    let a = Math.floor(Math.random() * 9) + 2; // 2 à 10
    let b = Math.floor(Math.random() * 9) + 2;
    // Pour rendre plus difficile parfois, on peut faire 2 chiffres x 2 chiffres
    if (Math.random() < 0.2) {
        a = Math.floor(Math.random() * 90) + 10; // 10 à 99
        b = Math.floor(Math.random() * 9) + 2;
    }
    let question = '';
    let correct = 0;
    if (type === 'add') {
        question = isFr ? `Combien fait ${a} + ${b} ?` : `What is ${a} + ${b}?`;
        correct = a + b;
    } else {
        question = isFr ? `Combien fait ${a} × ${b} ?` : `What is ${a} × ${b}?`;
        correct = a * b;
    }
    // Génère une fausse réponse plausible
    let wrong = correct;
    while (wrong === correct) {
        if (type === 'add') {
            wrong = correct + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 4) + 2);
        } else {
            wrong = correct + (Math.random() < 0.5 ? -1 : 1) * ((Math.floor(Math.random() * 3) + 1) * b);
        }
        if (wrong < 0) wrong = correct + 3;
    }
    // Mélange les réponses
    const correctIndex = Math.random() < 0.5 ? 0 : 1;
    const answers: [number, number] = correctIndex === 0 ? [correct, wrong] : [wrong, correct];
    return { question, answers, correctIndex };
}

// ─── Strings ─────────────────────────────────────────────────────────────────

const WIN_FR = [
    'Lecture mathematique. Exact.',
    'Logique eclair. Adversaire coinc.',
    'Calcul impeccable.',
];
const WIN_EN = [
    'Math reading. Exact.',
    'Lightning logic. Opponent blocked.',
    'Flawless calculation.',
];
const LOSS_FR = [
    'Mauvais calcul. Recommence.',
    'La regle t a trompe. Reset.',
    'L adversaire a vu plus vite.',
];
const LOSS_EN = [
    'Wrong calculation. Try again.',
    'The rule tricked you. Reset.',
    'Opponent saw faster.',
];

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function getStreak(results: RoundResult[]): number {
    let s = 0;
    for (let i = results.length - 1; i >= 0; i--) {
        if (!results[i].won) break;
        s++;
    }
    return s;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DuelNumericPanel() {
    const { stake, wallet, startDuel, resolveDuel, language } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { activateAudio, playReady, playDraw, playWin, playLoss } = useSfx();
    const tuning = getDuelNumericTuning(difficultyMode);

    const isFr = language === 'fr';
    const tx = (en: string, fr: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [question, setQuestion] = useState<NumericQuestion | null>(null);
    const [playerChoice, setPlayerChoice] = useState<0 | 1 | null>(null);
    const [feedback, setFeedback] = useState(tx('Lis la question. Choisis la bonne réponse.', 'Read the question. Pick the right answer.'));
    const [crowdLine, setCrowdLine] = useState(tx('Maths sous pression.', 'Math under pressure.'));
    const [reactionMs, setReactionMs] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerRefs = useRef<number[]>([]);
    const guessStartRef = useRef(0);
    const handledRef = useRef(false);
    const intervalRef = useRef<number | null>(null);

    const streak = getStreak(rounds);
    const totalRounds = 3;

    const clearTimers = useCallback(() => {
        timerRefs.current.forEach((id) => window.clearTimeout(id));
        timerRefs.current = [];
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timerRefs.current = timerRefs.current.filter((v) => v !== id);
            fn();
        }, delay);
        timerRefs.current.push(id);
    }, []);

    const finishRound = useCallback((won: boolean, msUsed: number, prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        handledRef.current = true;
        setPhase('reveal');
        setReactionMs(msUsed);
        setFeedback(won ? pickRandom(isFr ? WIN_FR : WIN_EN) : pickRandom(isFr ? LOSS_FR : LOSS_EN));
        setCrowdLine(won
            ? tx('Les maths sont à toi.', 'The numbers bend to you.')
            : tx('Mauvaise réponse. Essaie encore.', 'Wrong answer. Try again.'));

        if (won) playWin(streak >= 2 ? 1 : 0.7);
        else playLoss(0.45);

        const newRound: RoundResult = {
            gameId: 'duelnumeric',
            won,
            playerMetricMs: msUsed,
            difficulty: msUsed < tuning.eliteMs ? 'elite' : msUsed < tuning.hardMs ? 'hard' : 'standard',
        };
        const updated = [...prevRounds, newRound];

        schedule(() => {
            if (updated.length < totalRounds) {
                beginRound(updated, kind);
            } else {
                const finalWins = updated.filter((x) => x.won).length;
                setPhase('matchEnd');
                setFeedback(finalWins > totalRounds / 2
                    ? tx('Match gagné. Les maths triomphent.', 'Match won. Math prevails.')
                    : tx('Adversaire plus rapide. Reviens.', 'Opponent calculates faster. Come back.'));
                setCrowdLine(finalWins > totalRounds / 2
                    ? tx('Rythme génie.', 'GENIUS PACE.')
                    : tx('Prochain challenger, montre ta force.', 'Next challenger, show your skill.'));
                if (kind === 'stake') resolveDuel(finalWins > totalRounds / 2, updated);
            }
        }, 1400);
    }, [clearTimers, isFr, tx, playWin, playLoss, streak, schedule, resolveDuel, tuning]);

    const beginRound = useCallback((prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        handledRef.current = false;
        const newQuestion = generateNumericQuestion(isFr);
        setQuestion(newQuestion);
        setPlayerChoice(null);
        setPhase('readyQuestion');
        setFeedback(isFr ? 'Lis bien la question...' : 'Read the question...');
        setCrowdLine(isFr ? 'Concentre-toi.' : 'Focus.');
        playReady(streak >= 2 ? 0.9 : 0.4);

        schedule(() => {
            setPhase('guess');
            guessStartRef.current = performance.now();
            setTimeLeft(tuning.timeoutMs);
            setCrowdLine(isFr ? 'Réponds vite !' : 'Answer fast!');
            playDraw(0.8);

            let remaining = tuning.timeoutMs;
            intervalRef.current = window.setInterval(() => {
                remaining -= 100;
                setTimeLeft(Math.max(0, remaining));
                if (remaining <= 0 && intervalRef.current !== null) {
                    window.clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }, 100);

            schedule(() => {
                if (handledRef.current) return;
                finishRound(false, tuning.timeoutMs, prevRounds, kind);
            }, tuning.timeoutMs);
        }, tuning.readyMs);
    }, [clearTimers, schedule, playReady, playDraw, isFr, tuning, finishRound, streak]);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        clearTimers();
        if (!practice && safeWallet < safeStake) return;
        const kind: MatchKind = practice ? 'practice' : 'stake';
        setMatchType(kind);
        if (!practice) startDuel();
        setRounds([]);
        setPlayerChoice(null);
        setPhase('idle');
        setFeedback(practice
            ? tx('Entrainement. Sans mise. Affute tes maths.', 'Training. No stake. Sharpen your math.')
            : tx('Duel Numeric. Logique rapide, bonne réponse.', 'Duel Numeric. Fast logic, right answer.'));
        setCrowdLine(tx('Les nombres ne mentent jamais. Mais ils trompent.', 'Numbers never lie. But they trick.'));
        schedule(() => beginRound([], kind), 0);
    }, [activateAudio, clearTimers, safeWallet, safeStake, startDuel, schedule, beginRound, tx]);

    const handleGuess = useCallback((choice: 0 | 1) => {
        if (phase !== 'guess' || handledRef.current || !question) return;
        const msUsed = Math.round(performance.now() - guessStartRef.current);
        const isCorrect = choice === question.correctIndex;
        finishRound(isCorrect, msUsed, rounds, matchType);
        setPlayerChoice(choice);
    }, [phase, question, rounds, matchType, finishRound]);

    const wins = rounds.filter((r) => r.won).length;
    const progressPct = (timeLeft / tuning.timeoutMs) * 100;
    const roundNum = Math.min(rounds.length + (phase === 'reveal' ? 1 : 0), totalRounds);

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Duel Numéric' : 'Duel Numeric'}</h2>
                    <p className={styles.sub}>{isFr ? `3 manches, logique et rapidité !` : '3 rounds, logic and speed!'}</p>
                </div>
                <div className={styles.walletPill}>💰 {safeWallet.toFixed(2)}€</div>
            </div>

            {/* Chips d'état premium */}
            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Jeu' : 'Game'}: NUMÉRIC</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {wins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Manche' : 'Round'}: {roundNum} / {totalRounds}</span>
            </div>

            {/* Résumé des manches */}
            <div className={styles.roundSummary}>
                {Array.from({ length: totalRounds }).map((_, i) => (
                    <span key={i} className={
                        styles.summaryDot +
                        (rounds[i]?.won === true ? ' ' + styles.dotWin : '') +
                        (rounds[i]?.won === false ? ' ' + styles.dotLoss : '')
                    }>
                        {rounds[i]?.won === true ? (isFr ? 'Gagné' : 'Win') : rounds[i]?.won === false ? (isFr ? 'Perdu' : 'Loss') : ''}
                    </span>
                ))}
            </div>

            {/* Encart de jeu (arena) */}
            <div className={styles.arena}>
                {/* Feedback premium */}
                <div className={styles.feedbackTop}>{feedback}</div>

                {/* Timer animé */}
                {(phase === 'guess' || phase === 'reveal') && (
                    <div className={styles.timerBar}>
                        <div
                            className={styles.timerFill}
                            style={{
                                width: progressPct + '%',
                                background: progressPct > 50 ? '#4ade80' : progressPct > 20 ? '#facc15' : '#f43f5e',
                                transition: 'width 95ms linear, background 0.3s ease',
                            }}
                        />
                    </div>
                )}

                {/* Question et réponses */}
                {(phase === 'readyQuestion' || phase === 'guess' || phase === 'reveal') && question && (
                    <div className={styles.guessArea}>
                        <div className={styles.question}>{question.question}</div>
                        <div className={styles.numbersDisplay}>
                            {question.answers.map((ans, idx) => (
                                <button
                                    key={idx}
                                    className={
                                        styles.numBtn +
                                        (playerChoice === idx
                                            ? (idx === question.correctIndex ? ' ' + styles.selected : ' ' + styles.wrong)
                                            : '')
                                    }
                                    disabled={phase !== 'guess' || playerChoice !== null}
                                    onClick={() => handleGuess(idx as 0 | 1)}
                                >
                                    {ans}
                                </button>
                            ))}
                        </div>
                        {/* Flash visuel win/loss */}
                        {phase === 'reveal' && playerChoice !== null && (
                            <div className={playerChoice === question.correctIndex ? styles.flashWin : styles.flashLoss} />
                        )}
                    </div>
                )}

                {/* Temps de réaction */}
                {phase === 'reveal' && (
                    <div style={{ color: '#ffd700', fontWeight: 600, fontSize: '1.1em', margin: '12px 0', textAlign: 'center' }}>
                        {isFr ? 'Temps de réaction' : 'Reaction time'} : <b>{reactionMs} ms</b>
                    </div>
                )}

                {/* Crowd line en bas de l'arena */}
                <div className={styles.crowdLine}>{crowdLine}</div>
            </div>

            {/* Actions principales premium, toujours en bas */}
            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake}>
                        {isFr ? 'Jouer (mise)' : 'Play (stake)'}
                    </button>
                    <button className={styles.btnSec} onClick={() => startMatch(true)}>
                        {isFr ? 'Entraînement' : 'Practice'}
                    </button>
                    {safeWallet < safeStake && (
                        <div style={{ color: '#f43f5e', marginTop: 8, fontSize: '0.9em', width: '100%' }}>
                            {isFr ? 'Solde insuffisant pour miser.' : 'Not enough balance to stake.'}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
