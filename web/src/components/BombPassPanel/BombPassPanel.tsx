import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './BombPassPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'player' | 'rival' | 'roundEnd' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function BombPassPanel() {
    const { stake, wallet, language, difficultyMode, startDuel, resolveDuel, lastNet } = useGameStore();
    const isFr = language === 'fr';
    const animationRef = useRef(0);
    const timeoutRef = useRef<number | null>(null);
    const phaseRef = useRef<Phase>('idle');
    const roundsRef = useRef<RoundResult[]>([]);
    const matchKindRef = useRef<MatchKind>('stake');
    const roundStartRef = useRef(0);
    const markerRef = useRef(0);
    const directionRef = useRef(1);
    const passesRef = useRef(0);
    const fuseRef = useRef(9000);
    const safeCenterRef = useRef(50);
    const safeWidthRef = useRef(26);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchKind, setMatchKind] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNumber, setRoundNumber] = useState(0);
    const [marker, setMarker] = useState(0);
    const [passes, setPasses] = useState(0);
    const [fuseLeft, setFuseLeft] = useState(0);
    const [safeCenter, setSafeCenter] = useState(50);
    const [safeWidth, setSafeWidth] = useState(26);
    const [message, setMessage] = useState(isFr ? 'Passe la bombe dans la zone verte.' : 'Pass the bomb inside the green zone.');

    const safeStake = Number(stake ?? 0);
    const safeWallet = Number(wallet ?? 0);
    const playerWins = rounds.filter((round) => round.won).length;
    const rivalWins = rounds.length - playerWins;

    const updatePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const clearTimeoutRef = useCallback(() => {
        if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }, []);

    const finishRound = useCallback((won: boolean) => {
        if (phaseRef.current !== 'player' && phaseRef.current !== 'rival') return;
        updatePhase('roundEnd');
        clearTimeoutRef();
        const updated = [
            ...roundsRef.current,
            {
                gameId: 'bombpass',
                won,
                playerMetricMs: Math.round(performance.now() - roundStartRef.current),
                difficulty: passesRef.current >= 6 ? 'elite' : passesRef.current >= 3 ? 'hard' : 'standard',
            },
        ];
        roundsRef.current = updated;
        setRounds(updated);
        setMessage(won
            ? (isFr ? 'BOOM chez le rival. Manche gagnee.' : 'BOOM on the rival. Round won.')
            : (isFr ? 'La bombe explose chez toi.' : 'The bomb exploded on you.'));

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
    }, [clearTimeoutRef, isFr, resolveDuel, updatePhase]);

    const givePlayerTurn = useCallback(() => {
        const width = clamp(28 - passesRef.current * 2.6, 11, 28);
        const center = 18 + Math.random() * 64;
        safeWidthRef.current = width;
        safeCenterRef.current = center;
        setSafeWidth(width);
        setSafeCenter(center);
        updatePhase('player');
        setMessage(isFr ? 'A TOI. Clique dans le vert.' : 'YOUR TURN. Hit the green zone.');
    }, [isFr, updatePhase]);

    const startRound = useCallback((nextRound: number) => {
        clearTimeoutRef();
        setRoundNumber(nextRound);
        passesRef.current = 0;
        setPasses(0);
        markerRef.current = 0;
        directionRef.current = 1;
        const baseFuse = difficultyMode === 'casual' ? 11500 : difficultyMode === 'hardcore' ? 7600 : 9200;
        fuseRef.current = baseFuse - (nextRound - 1) * 500;
        roundStartRef.current = performance.now();
        givePlayerTurn();
    }, [clearTimeoutRef, difficultyMode, givePlayerTurn]);

    useEffect(() => {
        let last = performance.now();
        const frame = (now: number) => {
            const dt = Math.min(0.04, (now - last) / 1000);
            last = now;
            if (phaseRef.current === 'player' || phaseRef.current === 'rival') {
                const elapsed = now - roundStartRef.current;
                const remaining = Math.max(0, fuseRef.current - elapsed);
                setFuseLeft(remaining);
                if (remaining <= 0) {
                    finishRound(phaseRef.current === 'rival');
                } else if (phaseRef.current === 'player') {
                    const speed = 72 + passesRef.current * 13;
                    markerRef.current += directionRef.current * speed * dt;
                    if (markerRef.current >= 100 || markerRef.current <= 0) {
                        markerRef.current = clamp(markerRef.current, 0, 100);
                        directionRef.current *= -1;
                    }
                    setMarker(markerRef.current);
                }
            }
            animationRef.current = window.requestAnimationFrame(frame);
        };
        animationRef.current = window.requestAnimationFrame(frame);
        return () => window.cancelAnimationFrame(animationRef.current);
    }, [finishRound]);

    useEffect(() => () => clearTimeoutRef(), [clearTimeoutRef]);

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

    function passBomb() {
        if (phaseRef.current !== 'player') return;
        const distance = Math.abs(markerRef.current - safeCenterRef.current);
        if (distance > safeWidthRef.current / 2) {
            finishRound(false);
            return;
        }

        passesRef.current += 1;
        setPasses(passesRef.current);
        updatePhase('rival');
        setMessage(isFr ? 'Bombe chez le rival...' : 'Bomb is with the rival...');
        const rivalHold = 420 + Math.random() * 650;
        timeoutRef.current = window.setTimeout(() => {
            const danger = 0.08 + passesRef.current * 0.035;
            if (Math.random() < danger) finishRound(true);
            else givePlayerTurn();
        }, rivalHold);
    }

    return (
        <section className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2>Bomb Pass</h2>
                    <p>{isFr ? 'Clique dans le vert pour renvoyer la bombe. Plus elle circule, plus la fenetre retrecit.' : 'Hit the green zone to pass the bomb. Every pass makes the window smaller.'}</p>
                </div>
                <strong>SLAP$ {safeWallet.toFixed(2)}</strong>
            </header>

            <div className={styles.scorebar}>
                <span>{isFr ? 'Toi' : 'You'} <b>{playerWins}</b></span>
                <span>{isFr ? 'Manche' : 'Round'} {Math.max(1, roundNumber)} · BO3</span>
                <span><b>{rivalWins}</b> Rival</span>
            </div>

            <div className={styles.arena}>
                <div className={`${styles.bomb} ${phase === 'rival' ? styles.rivalBomb : ''}`}>●</div>
                <div className={styles.fuse}>
                    <span style={{ width: `${clamp((fuseLeft / Math.max(fuseRef.current, 1)) * 100, 0, 100)}%` }} />
                </div>
                <strong className={styles.timer}>{(fuseLeft / 1000).toFixed(1)}s</strong>

                <button type="button" className={styles.passButton} onClick={passBomb} disabled={phase !== 'player'}>
                    <span className={styles.safeZone} style={{ left: `${safeCenter - safeWidth / 2}%`, width: `${safeWidth}%` }} />
                    <span className={styles.marker} style={{ left: `${marker}%` }} />
                </button>

                <p>{message}</p>
                <div className={styles.passes}>{isFr ? 'Passes' : 'Passes'} <strong>{passes}</strong></div>

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
