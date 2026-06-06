import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CupShufflePanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'reveal' | 'shuffle' | 'choose' | 'roundEnd' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

const CUP_IDS = [0, 1, 2];

export function CupShufflePanel() {
    const { stake, wallet, language, difficultyMode, startDuel, resolveDuel, lastNet } = useGameStore();
    const isFr = language === 'fr';
    const timeoutRef = useRef<number | null>(null);
    const phaseRef = useRef<Phase>('idle');
    const roundsRef = useRef<RoundResult[]>([]);
    const matchKindRef = useRef<MatchKind>('stake');
    const orderRef = useRef(CUP_IDS);
    const tokenCupRef = useRef(0);
    const chooseStartRef = useRef(0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchKind, setMatchKind] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNumber, setRoundNumber] = useState(0);
    const [order, setOrder] = useState(CUP_IDS);
    const [tokenCup, setTokenCup] = useState(0);
    const [swapCount, setSwapCount] = useState(0);
    const [message, setMessage] = useState(isFr ? 'Trouve le jeton.' : 'Find the token.');

    const safeStake = Number(stake ?? 0);
    const safeWallet = Number(wallet ?? 0);
    const playerWins = rounds.filter((round) => round.won).length;
    const rivalWins = rounds.length - playerWins;

    const clearTimer = useCallback(() => {
        if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }, []);

    const updatePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const finishRound = useCallback((won: boolean) => {
        if (phaseRef.current !== 'choose') return;
        updatePhase('roundEnd');
        const updated = [
            ...roundsRef.current,
            {
                gameId: 'cupshuffle',
                won,
                playerMetricMs: Math.round(performance.now() - chooseStartRef.current),
                difficulty: swapCount >= 7 ? 'elite' : swapCount >= 5 ? 'hard' : 'standard',
            },
        ];
        roundsRef.current = updated;
        setRounds(updated);
        setMessage(won
            ? (isFr ? 'Bien suivi. Le jeton est a toi.' : 'Clean tracking. Token found.')
            : (isFr ? 'Mauvais gobelet.' : 'Wrong cup.'));

        const wins = updated.filter((round) => round.won).length;
        const losses = updated.length - wins;
        timeoutRef.current = window.setTimeout(() => {
            if (wins === 2 || losses === 2) {
                updatePhase('matchEnd');
                if (matchKindRef.current === 'stake') void resolveDuel(wins === 2, updated);
            } else {
                startRound(updated.length + 1);
            }
        }, 1200);
    }, [isFr, resolveDuel, swapCount, updatePhase]);

    const performSwaps = useCallback((remaining: number, delay: number) => {
        if (remaining <= 0) {
            updatePhase('choose');
            chooseStartRef.current = performance.now();
            setMessage(isFr ? 'Ou est le jeton ?' : 'Where is the token?');
            return;
        }
        const first = Math.floor(Math.random() * 3);
        let second = Math.floor(Math.random() * 3);
        while (second === first) second = Math.floor(Math.random() * 3);
        const next = [...orderRef.current];
        [next[first], next[second]] = [next[second], next[first]];
        orderRef.current = next;
        setOrder(next);
        timeoutRef.current = window.setTimeout(() => performSwaps(remaining - 1, delay), delay);
    }, [isFr, updatePhase]);

    const startRound = useCallback((nextRound: number) => {
        clearTimer();
        const nextToken = Math.floor(Math.random() * 3);
        const swaps = 1 + nextRound * 2;
        const delayBase = difficultyMode === 'casual' ? 720 : difficultyMode === 'hardcore' ? 450 : 580;
        const delay = Math.max(360, delayBase - nextRound * 35);
        orderRef.current = [...CUP_IDS];
        tokenCupRef.current = nextToken;
        setOrder([...CUP_IDS]);
        setTokenCup(nextToken);
        setSwapCount(swaps);
        setRoundNumber(nextRound);
        setMessage(isFr ? 'Le jeton est ici. Regarde bien.' : 'The token is here. Watch closely.');
        updatePhase('reveal');
        timeoutRef.current = window.setTimeout(() => {
            updatePhase('shuffle');
            setMessage(isFr ? 'Suis le bon gobelet.' : 'Track the correct cup.');
            performSwaps(swaps, delay);
        }, 1800);
    }, [clearTimer, difficultyMode, isFr, performSwaps, updatePhase]);

    useEffect(() => () => clearTimer(), [clearTimer]);

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

    function chooseSlot(slot: number) {
        if (phaseRef.current !== 'choose') return;
        const won = orderRef.current[slot] === tokenCupRef.current;
        navigator.vibrate?.(won ? [25, 25, 45] : 110);
        finishRound(won);
    }

    return (
        <section className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2>Cup Shuffle</h2>
                    <p>{isFr ? 'Repere le jeton, suis son gobelet pendant le melange, puis choisis.' : 'Spot the token, track its cup through the shuffle, then choose.'}</p>
                </div>
                <strong>SLAP$ {safeWallet.toFixed(2)}</strong>
            </header>

            <div className={styles.scorebar}>
                <span>{isFr ? 'Toi' : 'You'} <b>{playerWins}</b></span>
                <span>{isFr ? 'Manche' : 'Round'} {Math.max(1, roundNumber)} · {swapCount} swaps</span>
                <span><b>{rivalWins}</b> Rival</span>
            </div>

            <div className={styles.arena}>
                <p>{message}</p>
                <div className={styles.table}>
                    {CUP_IDS.map((cupId) => {
                        const slot = order.indexOf(cupId);
                        const showToken = (phase === 'reveal' || phase === 'roundEnd' || phase === 'matchEnd') && cupId === tokenCup;
                        return (
                            <button
                                key={cupId}
                                type="button"
                                className={styles.cup}
                                style={{ transform: `translateX(${slot * 100}%)` }}
                                onClick={() => chooseSlot(slot)}
                                disabled={phase !== 'choose'}
                                aria-label={`${isFr ? 'Gobelet' : 'Cup'} ${slot + 1}`}
                            >
                                <span className={styles.shell}>▰</span>
                                {showToken && <span className={styles.token}>●</span>}
                            </button>
                        );
                    })}
                </div>

                <div className={styles.slotLabels}>
                    <span>1</span><span>2</span><span>3</span>
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

            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button type="button" onClick={() => startMatch(true)}>{isFr ? 'Entrainement' : 'Practice'}</button>
                    <button type="button" className={styles.primary} onClick={() => startMatch(false)} disabled={safeWallet < safeStake}>Duel · SLAP$ {safeStake}</button>
                </div>
            )}
        </section>
    );
}
