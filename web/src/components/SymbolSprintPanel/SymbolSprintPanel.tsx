import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './SymbolSprintPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'reveal' | 'input' | 'roundEnd' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

const SYMBOLS = ['◆', '●', '▲', '■', '✦'];

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
}

function makeSequence(length: number): string[] {
    const result: string[] = [];
    while (result.length < length) {
        const pool = result.length > 0 ? SYMBOLS.filter((symbol) => symbol !== result[result.length - 1]) : SYMBOLS;
        result.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return result;
}

export function SymbolSprintPanel() {
    const { stake, wallet, language, difficultyMode, startDuel, resolveDuel, lastNet } = useGameStore();
    const isFr = language === 'fr';
    const safeStake = Number(stake ?? 0);
    const safeWallet = Number(wallet ?? 0);
    const timerRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const penaltyRef = useRef(0);
    const roundsRef = useRef<RoundResult[]>([]);
    const matchKindRef = useRef<MatchKind>('stake');
    const phaseRef = useRef<Phase>('idle');
    const sequenceRef = useRef<string[]>([]);
    const inputRef = useRef<string[]>([]);
    const rivalTimeRef = useRef(5000);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchKind, setMatchKind] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNumber, setRoundNumber] = useState(0);
    const [sequence, setSequence] = useState<string[]>([]);
    const [input, setInput] = useState<string[]>([]);
    const [palette, setPalette] = useState<string[]>(SYMBOLS);
    const [elapsed, setElapsed] = useState(0);
    const [penalty, setPenalty] = useState(0);
    const [rivalTime, setRivalTime] = useState(0);
    const [message, setMessage] = useState(isFr ? 'Observe. Memorise. Recompose.' : 'Watch. Memorize. Rebuild.');
    const [mistake, setMistake] = useState(false);

    const playerWins = rounds.filter((round) => round.won).length;
    const rivalWins = rounds.length - playerWins;
    const currentTotal = elapsed + penalty;
    const displaySequence = useMemo(
        () => phase === 'reveal' ? sequence : sequence.map((_, index) => input[index] || '?'),
        [input, phase, sequence]
    );

    const updatePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const clearClocks = useCallback(() => {
        if (timerRef.current != null) window.clearInterval(timerRef.current);
        if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
        timerRef.current = null;
        timeoutRef.current = null;
    }, []);

    const finishRound = useCallback((won: boolean, finalTime: number) => {
        if (phaseRef.current !== 'input') return;
        clearClocks();
        updatePhase('roundEnd');
        const updated = [
            ...roundsRef.current,
            {
                gameId: 'symbolrush',
                won,
                playerMetricMs: Math.round(finalTime),
                difficulty: sequenceRef.current.length >= 5 ? 'hard' : 'standard',
            },
        ];
        roundsRef.current = updated;
        setRounds(updated);
        setMessage(won
            ? (isFr ? 'Sequence parfaite. Tu bats le rival.' : 'Perfect sequence. You beat the rival.')
            : (isFr ? 'Le rival termine avant toi.' : 'The rival finished first.'));

        const wins = updated.filter((round) => round.won).length;
        const losses = updated.length - wins;
        timeoutRef.current = window.setTimeout(() => {
            if (wins === 2 || losses === 2) {
                updatePhase('matchEnd');
                if (matchKindRef.current === 'stake') void resolveDuel(wins === 2, updated);
            } else {
                startRound(updated.length + 1);
            }
        }, 1100);
    }, [clearClocks, isFr, resolveDuel, updatePhase]);

    const beginInput = useCallback(() => {
        updatePhase('input');
        startTimeRef.current = performance.now();
        penaltyRef.current = 0;
        setElapsed(0);
        setPenalty(0);
        setMessage(isFr ? 'Recompose la suite avant le rival.' : 'Rebuild the sequence before the rival.');
        timerRef.current = window.setInterval(() => {
            const next = performance.now() - startTimeRef.current;
            setElapsed(next);
            if (next + penaltyRef.current >= rivalTimeRef.current) {
                finishRound(false, next + penaltyRef.current);
            }
        }, 33);
    }, [finishRound, isFr, updatePhase]);

    const startRound = useCallback((nextRound: number) => {
        clearClocks();
        const length = 2 + nextRound;
        const nextSequence = makeSequence(length);
        const rivalBase = difficultyMode === 'casual' ? 2500 : difficultyMode === 'hardcore' ? 1850 : 2200;
        const nextRivalTime = length * rivalBase + 1200 + Math.floor(Math.random() * 700);
        const revealTime = 1800 + length * (difficultyMode === 'hardcore' ? 520 : 700);
        sequenceRef.current = nextSequence;
        inputRef.current = [];
        rivalTimeRef.current = nextRivalTime;
        setRoundNumber(nextRound);
        setSequence(nextSequence);
        setInput([]);
        setPalette(shuffle(SYMBOLS));
        setRivalTime(nextRivalTime);
        setMistake(false);
        setMessage(isFr ? 'Memorise la suite.' : 'Memorize the sequence.');
        updatePhase('reveal');
        timeoutRef.current = window.setTimeout(beginInput, revealTime);
    }, [beginInput, clearClocks, difficultyMode, isFr, updatePhase]);

    useEffect(() => () => clearClocks(), [clearClocks]);

    function startMatch(practice: boolean) {
        if (!practice && safeWallet < safeStake) return;
        const kind: MatchKind = practice ? 'practice' : 'stake';
        matchKindRef.current = kind;
        setMatchKind(kind);
        roundsRef.current = [];
        setRounds([]);
        if (!practice) startDuel();
        startRound(1);
    }

    function chooseSymbol(symbol: string) {
        if (phaseRef.current !== 'input') return;
        const target = sequenceRef.current[inputRef.current.length];
        if (symbol !== target) {
            navigator.vibrate?.(70);
            penaltyRef.current += 400;
            setPenalty(penaltyRef.current);
            setMistake(true);
            setMessage(isFr ? '+0.4s. Reste calme.' : '+0.4s. Stay composed.');
            window.setTimeout(() => setMistake(false), 240);
            return;
        }

        const updated = [...inputRef.current, symbol];
        navigator.vibrate?.(18);
        inputRef.current = updated;
        setInput(updated);
        setMessage(updated.length === sequenceRef.current.length
            ? (isFr ? 'Suite complete.' : 'Sequence complete.')
            : (isFr ? `${updated.length}/${sequenceRef.current.length} corrects` : `${updated.length}/${sequenceRef.current.length} correct`));

        if (updated.length === sequenceRef.current.length) {
            const finalTime = performance.now() - startTimeRef.current + penaltyRef.current;
            finishRound(finalTime < rivalTimeRef.current, finalTime);
        }
    }

    return (
        <section className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2>Symbol Sprint</h2>
                    <p>{isFr ? 'Memorise la suite, puis reconstruis-la plus vite que ton rival.' : 'Memorize the sequence, then rebuild it faster than your rival.'}</p>
                </div>
                <strong className={styles.wallet}>SLAP$ {safeWallet.toFixed(2)}</strong>
            </header>

            <div className={styles.scorebar}>
                <span>{isFr ? 'Toi' : 'You'} <strong>{playerWins}</strong></span>
                <span>{isFr ? 'Manche' : 'Round'} {Math.max(1, roundNumber)} · BO3</span>
                <span><strong>{rivalWins}</strong> Rival</span>
            </div>

            <div className={`${styles.arena} ${mistake ? styles.mistake : ''}`}>
                <div className={styles.timerRow}>
                    <div>
                        <span>{isFr ? 'TON TEMPS' : 'YOUR TIME'}</span>
                        <strong>{(currentTotal / 1000).toFixed(2)}s</strong>
                    </div>
                    <div>
                        <span>{isFr ? 'RIVAL FINIT A' : 'RIVAL FINISHES AT'}</span>
                        <strong>{(rivalTime / 1000).toFixed(2)}s</strong>
                    </div>
                </div>

                <div className={styles.sequence} aria-label={isFr ? 'Suite de symboles' : 'Symbol sequence'}>
                    {displaySequence.map((symbol, index) => (
                        <span key={`${roundNumber}-${index}`} className={input[index] ? styles.locked : ''}>{symbol}</span>
                    ))}
                </div>

                <div className={styles.status}>
                    <strong>{phase === 'reveal' ? (isFr ? 'MEMORISE' : 'MEMORIZE') : phase === 'input' ? (isFr ? 'RECOMPOSE' : 'REBUILD') : message}</strong>
                    {phase === 'input' && penalty > 0 && <span>+{(penalty / 1000).toFixed(1)}s {isFr ? 'penalite' : 'penalty'}</span>}
                </div>

                <div className={styles.palette}>
                    {palette.map((symbol) => (
                        <button key={symbol} type="button" onClick={() => chooseSymbol(symbol)} disabled={phase !== 'input'}>
                            {symbol}
                        </button>
                    ))}
                </div>

                {(phase === 'roundEnd' || phase === 'matchEnd') && (
                    <div className={styles.overlay}>
                        <strong>{message}</strong>
                        {phase === 'matchEnd' && (
                            <>
                                <span>{playerWins > rivalWins ? (isFr ? 'MATCH GAGNE' : 'MATCH WON') : (isFr ? 'MATCH PERDU' : 'MATCH LOST')}</span>
                                {matchKind === 'stake' && lastNet != null && <b>{lastNet >= 0 ? '+' : ''}SLAP$ {lastNet.toFixed(2)}</b>}
                                <button type="button" onClick={() => startMatch(false)}>{isFr ? 'Rejouer' : 'Play again'}</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className={styles.message}>{message}</p>
            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button type="button" onClick={() => startMatch(true)}>{isFr ? 'Entrainement' : 'Practice'}</button>
                    <button type="button" className={styles.primary} onClick={() => startMatch(false)} disabled={safeWallet < safeStake}>
                        Duel · SLAP$ {safeStake}
                    </button>
                </div>
            )}
        </section>
    );
}
