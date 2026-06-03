import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DuelNumericPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getDifficultyLabel, getDuelNumericTuning } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'readyQuestion' | 'guess' | 'reveal' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type QuestionKind = 'math' | 'pattern' | 'compare' | 'trap';

interface NumericQuestion {
    kind: QuestionKind;
    question: string;
    answers: number[];
    correctIndex: number;
    pressure: number;
}

const WIN_FR = ['Calcul sec. Tu passes devant.', 'Lecture instantanee. Point vole.', 'Trop rapide. Trop propre.'];
const WIN_EN = ['Clean calculation. You take the point.', 'Instant read. Point stolen.', 'Too fast. Too clean.'];
const LOSS_FR = ['Bonne idee, mauvais tempo.', 'Le piege numerique t a ralenti.', 'Adversaire plus vif sur les chiffres.'];
const LOSS_EN = ['Good idea, bad tempo.', 'The number trap slowed you down.', 'Opponent was sharper on the numbers.'];
const KINDS: QuestionKind[] = ['math', 'pattern', 'compare', 'trap'];

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function uniqueAnswers(correct: number, candidates: number[]) {
    const values = [correct, ...candidates].filter((value) => Number.isFinite(value) && value >= 0);
    const unique = Array.from(new Set(values)).slice(0, 4);
    while (unique.length < 4) unique.push(correct + unique.length * 3 + 1);
    const answers = shuffle(unique);
    return { answers, correctIndex: answers.indexOf(correct) };
}

function generateNumericQuestion(isFr: boolean, roundIndex: number, pressureBoost: number): NumericQuestion {
    const kind = KINDS[(Math.floor(Math.random() * KINDS.length) + roundIndex) % KINDS.length];
    const pressure = 1 + pressureBoost + roundIndex * 0.08;

    if (kind === 'pattern') {
        const start = 2 + Math.floor(Math.random() * 8);
        const step = 2 + Math.floor(Math.random() * 6);
        const seq = [start, start + step, start + step * 2, start + step * 3];
        const correct = start + step * 4;
        const { answers, correctIndex } = uniqueAnswers(correct, [correct + step, correct - step, correct + 2, correct - 2]);
        return {
            kind,
            question: isFr ? `Suite: ${seq.join(' · ')} · ?` : `Pattern: ${seq.join(' · ')} · ?`,
            answers,
            correctIndex,
            pressure,
        };
    }

    if (kind === 'compare') {
        const a = 12 + Math.floor(Math.random() * 28);
        const b = 3 + Math.floor(Math.random() * 9);
        const c = 10 + Math.floor(Math.random() * 40);
        const left = a + b * 3;
        const right = c + Math.floor(Math.random() * 18);
        const correct = Math.max(left, right);
        const { answers, correctIndex } = uniqueAnswers(correct, [Math.min(left, right), correct + 4, Math.abs(left - right)]);
        return {
            kind,
            question: isFr ? `Le plus grand: ${left} ou ${right} ?` : `Bigger number: ${left} or ${right}?`,
            answers,
            correctIndex,
            pressure,
        };
    }

    if (kind === 'trap') {
        const a = 6 + Math.floor(Math.random() * 14);
        const b = 2 + Math.floor(Math.random() * 8);
        const c = 2 + Math.floor(Math.random() * 7);
        const correct = a + b * c;
        const { answers, correctIndex } = uniqueAnswers(correct, [(a + b) * c, correct + b, correct - c, a * b + c]);
        return {
            kind,
            question: isFr ? `${a} + ${b} x ${c}` : `${a} + ${b} x ${c}`,
            answers,
            correctIndex,
            pressure,
        };
    }

    const multiply = Math.random() < 0.52;
    const a = multiply ? 3 + Math.floor(Math.random() * 13) : 14 + Math.floor(Math.random() * 50);
    const b = multiply ? 3 + Math.floor(Math.random() * 11) : 8 + Math.floor(Math.random() * 35);
    const correct = multiply ? a * b : a + b;
    const { answers, correctIndex } = uniqueAnswers(correct, [correct + a, correct - b, correct + 7, correct - 3]);
    return {
        kind,
        question: multiply
            ? isFr ? `${a} x ${b}` : `${a} x ${b}`
            : isFr ? `${a} + ${b}` : `${a} + ${b}`,
        answers,
        correctIndex,
        pressure,
    };
}

function getStreak(results: RoundResult[]): number {
    let streak = 0;
    for (let i = results.length - 1; i >= 0; i -= 1) {
        if (!results[i].won) break;
        streak += 1;
    }
    return streak;
}

function grade(ms: number, eliteMs: number, hardMs: number, correct: boolean) {
    if (!correct) return 'miss';
    if (ms <= eliteMs) return 'elite';
    if (ms <= hardMs) return 'hard';
    return 'standard';
}

export function DuelNumericPanel() {
    const { stake, wallet, isDueling, startDuel, resolveDuel, lastNet, language } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { soundOn, toggleSound, activateAudio, playReady, playDraw, playWin, playLoss } = useSfx();
    const tuning = getDuelNumericTuning(difficultyMode);

    const isFr = language === 'fr';
    const tx = useCallback((en: string, fr: string) => (isFr ? fr : en), [isFr]);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [question, setQuestion] = useState<NumericQuestion | null>(null);
    const [playerChoice, setPlayerChoice] = useState<number | null>(null);
    const [feedback, setFeedback] = useState(tx('Read fast. Answer faster.', 'Lis vite. Reponds plus vite.'));
    const [crowdLine, setCrowdLine] = useState(tx('Numbers under pressure.', 'Chiffres sous pression.'));
    const [reactionMs, setReactionMs] = useState(0);
    const [opponentMs, setOpponentMs] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerRefs = useRef<number[]>([]);
    const guessStartRef = useRef(0);
    const handledRef = useRef(false);
    const intervalRef = useRef<number | null>(null);

    const totalRounds = 3;
    const wins = rounds.filter((round) => round.won).length;
    const streak = getStreak(rounds);
    const roundNum = Math.min(rounds.length + (phase === 'idle' || phase === 'matchEnd' ? 0 : 1), totalRounds);
    const progressPct = Math.max(0, Math.min(100, (timeLeft / tuning.timeoutMs) * 100));
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
            timerRefs.current = timerRefs.current.filter((value) => value !== id);
            fn();
        }, delay);
        timerRefs.current.push(id);
    }, []);

    const finishRound = useCallback((choice: number | null, msUsed: number, prevRounds: RoundResult[], kind: MatchKind, activeQuestion: NumericQuestion, activeOpponentMs: number) => {
        if (handledRef.current) return;
        clearTimers();
        handledRef.current = true;

        const correct = choice === activeQuestion.correctIndex;
        const won = correct && msUsed < activeOpponentMs;
        const newRound: RoundResult = {
            gameId: 'duelnumeric',
            won,
            playerMetricMs: msUsed,
            difficulty: grade(msUsed, tuning.eliteMs, tuning.hardMs, correct),
        };
        const updated = [...prevRounds, newRound];

        setPhase('reveal');
        setPlayerChoice(choice);
        setReactionMs(msUsed);
        setRounds(updated);
        setFeedback(won
            ? pickRandom(isFr ? WIN_FR : WIN_EN)
            : !correct
                ? tx('Wrong answer. Speed cannot save it.', 'Mauvaise reponse. La vitesse ne sauve pas.')
                : tx(`Correct, but slower: ${msUsed}ms vs ${activeOpponentMs}ms.`, `Correct, mais trop lent : ${msUsed}ms contre ${activeOpponentMs}ms.`));
        setCrowdLine(won ? tx('You beat the board and the rival.', 'Tu bats le board et le rival.') : pickRandom(isFr ? LOSS_FR : LOSS_EN));

        if (won) playWin(msUsed <= tuning.eliteMs ? 1 : 0.72);
        else playLoss(0.48);

        schedule(() => {
            if (updated.length < totalRounds) {
                beginRound(updated, kind);
                return;
            }

            const finalWins = updated.filter((round) => round.won).length;
            setPhase('matchEnd');
            setFeedback(finalWins > totalRounds / 2
                ? tx('Match won. Logic stayed cold.', 'Match gagne. Logique froide.')
                : tx('Match lost. One sharper answer flips it.', 'Match perdu. Une reponse plus nette change tout.'));
            setCrowdLine(finalWins > totalRounds / 2 ? tx('GENIUS PACE.', 'RYTHME GENIE.') : tx('Run the numbers again.', 'Refais tourner les chiffres.'));
            if (kind === 'stake') resolveDuel(finalWins > totalRounds / 2, updated);
        }, 1300);
    }, [clearTimers, isFr, playLoss, playWin, resolveDuel, schedule, tuning.eliteMs, tuning.hardMs, tx]);

    const beginRound = useCallback((prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        handledRef.current = false;
        const nextQuestion = generateNumericQuestion(isFr, prevRounds.length, prevRounds.length === 2 ? 0.25 : 0);
        const nextOpponentMs = Math.max(720, Math.round(tuning.hardMs + tuning.timeoutMs * 0.18 - nextQuestion.pressure * 110 + Math.random() * 520));

        setQuestion(nextQuestion);
        setOpponentMs(nextOpponentMs);
        setPlayerChoice(null);
        setTimeLeft(tuning.timeoutMs);
        setPhase('readyQuestion');
        setFeedback(prevRounds.length === 2
            ? tx('Clutch round. No slow math.', 'Round clutch. Pas de maths lentes.')
            : tx('Read the board.', 'Lis le board.'));
        setCrowdLine(tx('Opponent is already calculating.', 'L adversaire calcule deja.'));
        playReady(streak >= 2 ? 0.9 : 0.4);

        schedule(() => {
            setPhase('guess');
            guessStartRef.current = performance.now();
            setFeedback(tx('Answer now.', 'Reponds maintenant.'));
            setCrowdLine(tx(`Beat ${nextOpponentMs}ms.`, `Bats ${nextOpponentMs}ms.`));
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

            schedule(() => finishRound(null, tuning.timeoutMs, prevRounds, kind, nextQuestion, nextOpponentMs), tuning.timeoutMs);
        }, tuning.readyMs);
    }, [clearTimers, finishRound, isFr, playDraw, playReady, schedule, streak, tuning.hardMs, tuning.readyMs, tuning.timeoutMs, tx]);

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
            ? tx('Practice. Build clean calculation speed.', 'Entrainement. Monte ta vitesse propre.')
            : tx('Duel Numeric. Correct is not enough.', 'Duel Numeric. Juste ne suffit pas.'));
        setCrowdLine(tx('Beat the answer and the rival.', 'Bats la reponse et le rival.'));
        schedule(() => beginRound([], kind), 0);
    }, [activateAudio, beginRound, clearTimers, safeStake, safeWallet, schedule, startDuel, tx]);

    const handleGuess = useCallback((choice: number) => {
        if (phase !== 'guess' || handledRef.current || !question) return;
        const msUsed = Math.max(0, Math.round(performance.now() - guessStartRef.current));
        finishRound(choice, msUsed, rounds, matchType, question, opponentMs);
    }, [finishRound, matchType, opponentMs, phase, question, rounds]);

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Duel Numeric' : 'Duel Numeric'}</h2>
                    <p className={styles.sub}>
                        {tx(`4 choices · beat the rival clock · Stake: SLAP$ ${safeStake}`, `4 choix · bats le chrono rival · Mise : SLAP$ ${safeStake}`)}
                    </p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </div>

            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {wins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Manche' : 'Round'}: {roundNum || '-'}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Rival' : 'Rival'}: {opponentMs || '-'}ms</span>
                <span className={styles.chip}>{isFr ? 'Difficulte' : 'Difficulty'}: {getDifficultyLabel(difficultyMode, isFr)}</span>
                {phase === 'matchEnd' && matchType === 'stake' && lastNet != null && (
                    <span className={`${styles.chip} ${lastNet >= 0 ? styles.chipWin : styles.chipLoss}`}>{lastNet >= 0 ? '+' : ''}SLAP$ {lastNet.toFixed(2)}</span>
                )}
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>
                    {soundOn ? 'SFX ON' : 'SFX OFF'}
                </button>
            </div>

            <div className={styles.roundSummary}>
                {Array.from({ length: totalRounds }).map((_, index) => (
                    <span key={index} className={`${styles.summaryDot} ${rounds[index]?.won === true ? styles.dotWin : ''} ${rounds[index]?.won === false ? styles.dotLoss : ''}`}>
                        {rounds[index]?.won === true ? 'WIN' : rounds[index]?.won === false ? 'LOSS' : ''}
                    </span>
                ))}
            </div>

            <div className={styles.arena}>
                <div className={styles.feedbackTop}>{feedback}</div>

                {(phase === 'guess' || phase === 'reveal') && (
                    <div className={styles.timerBar}>
                        <div
                            className={styles.timerFill}
                            style={{
                                width: `${progressPct}%`,
                                background: progressPct > 50 ? '#4ade80' : progressPct > 20 ? '#facc15' : '#f43f5e',
                            }}
                        />
                    </div>
                )}

                {phase === 'idle' && (
                    <div className={styles.centeredOverlay}>
                        <div className={styles.bigLabel}>{isFr ? 'PRET ?' : 'READY?'}</div>
                        <p className={styles.hint}>{tx('Correct answer plus faster clock wins the round.', 'Bonne reponse plus chrono rapide gagne la manche.')}</p>
                    </div>
                )}

                {(phase === 'readyQuestion' || phase === 'guess' || phase === 'reveal') && question && (
                    <div className={styles.guessArea}>
                        <div className={styles.ruleBox}>
                            <div className={styles.ruleTitle}>{question.kind.toUpperCase()}</div>
                            <div className={styles.question}>{question.question}</div>
                            <p className={styles.hint}>{tx(`Rival clock: ${opponentMs}ms`, `Chrono rival : ${opponentMs}ms`)}</p>
                        </div>
                        <div className={styles.numbersDisplay}>
                            {question.answers.map((answer, index) => {
                                const selected = playerChoice === index;
                                const correct = index === question.correctIndex;
                                const revealClass = phase === 'reveal' && correct ? styles.selected : phase === 'reveal' && selected ? styles.wrong : '';
                                return (
                                    <button
                                        key={`${answer}-${index}`}
                                        className={`${styles.numBtn} ${selected ? styles.selected : ''} ${revealClass}`}
                                        disabled={phase !== 'guess' || playerChoice !== null}
                                        onClick={() => handleGuess(index)}
                                    >
                                        {answer}
                                    </button>
                                );
                            })}
                        </div>
                        {phase === 'reveal' && (
                            <>
                                <p className={styles.hint}>{tx(`You: ${reactionMs}ms · Rival: ${opponentMs}ms`, `Toi : ${reactionMs}ms · Rival : ${opponentMs}ms`)}</p>
                                <div className={rounds[rounds.length - 1]?.won ? styles.flashWin : styles.flashLoss} />
                            </>
                        )}
                    </div>
                )}

                {phase === 'matchEnd' && (
                    <div className={styles.centeredOverlay}>
                        <div className={`${styles.bigLabel} ${wins > totalRounds / 2 ? styles.labelWin : styles.labelLoss}`}>
                            {wins > totalRounds / 2 ? (isFr ? 'MATCH GAGNE' : 'MATCH WON') : (isFr ? 'MATCH PERDU' : 'MATCH LOST')}
                        </div>
                        <p className={styles.hint}>
                            {matchType === 'practice'
                                ? tx('No stake. Pattern learned.', 'Sans mise. Pattern appris.')
                                : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}
                        </p>
                    </div>
                )}

                <div className={styles.crowdLine}>{crowdLine}</div>
            </div>

            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>
                        {phase === 'matchEnd' ? (isFr ? 'Relancer' : 'Run It Back') : (isFr ? 'Jouer la Mise' : 'Play Stake')}
                    </button>
                    <button className={styles.btnSec} onClick={() => startMatch(true)} disabled={isDueling}>
                        {isFr ? 'Entrainement' : 'Practice'}
                    </button>
                </div>
            )}
        </section>
    );
}
