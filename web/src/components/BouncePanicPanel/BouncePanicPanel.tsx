import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './BouncePanicPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'countdown' | 'playing' | 'roundEnd' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

const WIDTH = 900;
const HEIGHT = 500;
const BASE_PADDLE = 176;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 11;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function BouncePanicPanel() {
    const { stake, wallet, language, difficultyMode, startDuel, resolveDuel, lastNet } = useGameStore();
    const isFr = language === 'fr';
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef(0);
    const timeoutRef = useRef<number | null>(null);
    const playerXRef = useRef(WIDTH / 2);
    const keysRef = useRef({ left: false, right: false });
    const phaseRef = useRef<Phase>('idle');
    const matchKindRef = useRef<MatchKind>('stake');
    const roundsRef = useRef<RoundResult[]>([]);
    const gameRef = useRef({
        ballX: WIDTH / 2,
        ballY: HEIGHT / 2,
        velocityX: 180,
        velocityY: 250,
        botX: WIDTH / 2,
        rally: 0,
        elapsed: 0,
        lastTime: 0,
    });

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchKind, setMatchKind] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNumber, setRoundNumber] = useState(0);
    const [countdown, setCountdown] = useState(3);
    const [rally, setRally] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [message, setMessage] = useState(isFr ? 'Garde la balle en vie.' : 'Keep the ball alive.');

    const playerWins = rounds.filter((round) => round.won).length;
    const rivalWins = rounds.length - playerWins;
    const safeStake = Number(stake ?? 0);
    const safeWallet = Number(wallet ?? 0);

    const clearScheduled = useCallback(() => {
        if (timeoutRef.current != null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const schedule = useCallback((fn: () => void, delay: number) => {
        clearScheduled();
        timeoutRef.current = window.setTimeout(fn, delay);
    }, [clearScheduled]);

    const updatePhase = useCallback((next: Phase) => {
        phaseRef.current = next;
        setPhase(next);
    }, []);

    const finishRound = useCallback((won: boolean) => {
        if (phaseRef.current !== 'playing') return;
        updatePhase('roundEnd');
        const snapshot = gameRef.current;
        const result: RoundResult = {
            gameId: 'bounce',
            won,
            playerMetricMs: Math.round(snapshot.elapsed * 1000),
            difficulty: snapshot.rally >= 12 ? 'elite' : snapshot.rally >= 6 ? 'hard' : 'standard',
        };
        const updated = [...roundsRef.current, result];
        roundsRef.current = updated;
        setRounds(updated);
        setMessage(won
            ? (isFr ? 'Le rival a laisse passer la balle.' : 'The rival dropped the ball.')
            : (isFr ? 'Balle perdue. La manche lui revient.' : 'Ball lost. Round to the rival.'));

        const wins = updated.filter((round) => round.won).length;
        const losses = updated.length - wins;
        if (wins === 2 || losses === 2) {
            schedule(() => {
                updatePhase('matchEnd');
                if (matchKindRef.current === 'stake') {
                    void resolveDuel(wins === 2, updated);
                }
            }, 1000);
            return;
        }
        schedule(() => startRound(updated.length + 1), 1100);
    }, [isFr, resolveDuel, schedule, updatePhase]);

    const drawArena = useCallback((ctx: CanvasRenderingContext2D) => {
        const game = gameRef.current;
        const paddleWidth = clamp(BASE_PADDLE - game.rally * 5, 92, BASE_PADDLE);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#080d16';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 14]);
        ctx.beginPath();
        ctx.moveTo(0, HEIGHT / 2);
        ctx.lineTo(WIDTH, HEIGHT / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const glow = ctx.createRadialGradient(game.ballX, game.ballY, 2, game.ballX, game.ballY, 42);
        glow.addColorStop(0, 'rgba(255, 230, 80, 0.5)');
        glow.addColorStop(1, 'rgba(255, 212, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(game.ballX, game.ballY, 42, 0, Math.PI * 2);
        ctx.fill();

        if (game.rally >= 6) {
            ctx.fillStyle = 'rgba(91, 192, 235, 0.78)';
            ctx.fillRect(WIDTH / 2 - 150, HEIGHT / 2 - 9, 92, 18);
            ctx.fillRect(WIDTH / 2 + 58, HEIGHT / 2 - 9, 92, 18);
        }

        ctx.fillStyle = '#ef476f';
        ctx.fillRect(game.botX - paddleWidth / 2, 34, paddleWidth, PADDLE_HEIGHT);
        ctx.fillStyle = '#ffd400';
        ctx.fillRect(playerXRef.current - paddleWidth / 2, HEIGHT - 50, paddleWidth, PADDLE_HEIGHT);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(game.ballX, game.ballY, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }, []);

    const startRound = useCallback((nextRound: number) => {
        clearScheduled();
        setRoundNumber(nextRound);
        setCountdown(3);
        setRally(0);
        setSpeed(0);
        setMessage(isFr ? 'Prepare ton paddle.' : 'Ready your paddle.');
        updatePhase('countdown');
        playerXRef.current = WIDTH / 2;
        gameRef.current = {
            ballX: WIDTH / 2,
            ballY: HEIGHT / 2,
            velocityX: (Math.random() > 0.5 ? 1 : -1) * (165 + Math.random() * 60),
            velocityY: (Math.random() > 0.5 ? 1 : -1) * 245,
            botX: WIDTH / 2,
            rally: 0,
            elapsed: 0,
            lastTime: 0,
        };

        let value = 3;
        const tick = () => {
            value -= 1;
            if (value > 0) {
                setCountdown(value);
                schedule(tick, 600);
            } else {
                gameRef.current.lastTime = performance.now();
                updatePhase('playing');
                setMessage(isFr ? 'Rallye lance.' : 'Rally live.');
            }
        };
        schedule(tick, 600);
    }, [clearScheduled, isFr, schedule, updatePhase]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const frame = (time: number) => {
            const game = gameRef.current;
            if (!game.lastTime) game.lastTime = time;
            const dt = Math.min(0.024, (time - game.lastTime) / 1000);
            game.lastTime = time;

            if (phaseRef.current === 'playing') {
                game.elapsed += dt;
                const paddleWidth = clamp(BASE_PADDLE - game.rally * 5, 92, BASE_PADDLE);
                const keyDirection = Number(keysRef.current.right) - Number(keysRef.current.left);
                playerXRef.current = clamp(playerXRef.current + keyDirection * 520 * dt, paddleWidth / 2, WIDTH - paddleWidth / 2);

                const botError = difficultyMode === 'casual' ? 52 : difficultyMode === 'hardcore' ? 18 : 34;
                const botTarget = game.ballX + Math.sin(game.elapsed * 2.4) * botError;
                const botSpeed = (difficultyMode === 'casual' ? 250 : difficultyMode === 'hardcore' ? 390 : 320) + game.rally * 8;
                game.botX += clamp(botTarget - game.botX, -botSpeed * dt, botSpeed * dt);
                game.botX = clamp(game.botX, paddleWidth / 2, WIDTH - paddleWidth / 2);

                game.ballX += game.velocityX * dt;
                game.ballY += game.velocityY * dt;

                if (game.ballX <= BALL_RADIUS || game.ballX >= WIDTH - BALL_RADIUS) {
                    game.ballX = clamp(game.ballX, BALL_RADIUS, WIDTH - BALL_RADIUS);
                    game.velocityX *= -1;
                }

                if (game.rally >= 6 && game.ballY > HEIGHT / 2 - 20 && game.ballY < HEIGHT / 2 + 20) {
                    const inLeftBlock = game.ballX > WIDTH / 2 - 160 && game.ballX < WIDTH / 2 - 48;
                    const inRightBlock = game.ballX > WIDTH / 2 + 48 && game.ballX < WIDTH / 2 + 160;
                    if (inLeftBlock || inRightBlock) {
                        game.velocityY *= -1;
                        game.ballY += Math.sign(game.velocityY) * 22;
                    }
                }

                const playerTop = HEIGHT - 50;
                if (
                    game.velocityY > 0
                    && game.ballY + BALL_RADIUS >= playerTop
                    && game.ballY - BALL_RADIUS <= playerTop + PADDLE_HEIGHT
                    && Math.abs(game.ballX - playerXRef.current) <= paddleWidth / 2 + BALL_RADIUS
                ) {
                    const offset = (game.ballX - playerXRef.current) / (paddleWidth / 2);
                    game.ballY = playerTop - BALL_RADIUS;
                    game.velocityY = -Math.abs(game.velocityY) * 1.045;
                    game.velocityX += offset * 90;
                    game.rally += 1;
                    setRally(game.rally);
                }

                const botBottom = 34 + PADDLE_HEIGHT;
                if (
                    game.velocityY < 0
                    && game.ballY - BALL_RADIUS <= botBottom
                    && game.ballY + BALL_RADIUS >= 34
                    && Math.abs(game.ballX - game.botX) <= paddleWidth / 2 + BALL_RADIUS
                ) {
                    const offset = (game.ballX - game.botX) / (paddleWidth / 2);
                    game.ballY = botBottom + BALL_RADIUS;
                    game.velocityY = Math.abs(game.velocityY) * 1.045;
                    game.velocityX += offset * 72;
                    game.rally += 1;
                    setRally(game.rally);
                }

                const currentSpeed = Math.round(Math.hypot(game.velocityX, game.velocityY));
                setSpeed(currentSpeed);
                if (game.ballY < -BALL_RADIUS * 2) finishRound(true);
                if (game.ballY > HEIGHT + BALL_RADIUS * 2) finishRound(false);
            }

            drawArena(ctx);
            animationRef.current = window.requestAnimationFrame(frame);
        };

        animationRef.current = window.requestAnimationFrame(frame);
        return () => window.cancelAnimationFrame(animationRef.current);
    }, [difficultyMode, drawArena, finishRound]);

    useEffect(() => {
        const down = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = true;
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = true;
        };
        const up = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = false;
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = false;
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, []);

    useEffect(() => () => clearScheduled(), [clearScheduled]);

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

    function movePaddle(clientX: number) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        playerXRef.current = clamp(((clientX - rect.left) / rect.width) * WIDTH, 46, WIDTH - 46);
    }

    return (
        <section className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <h2>Bounce Panic</h2>
                    <p>{isFr ? 'Ne laisse jamais tomber la balle. Chaque retour accelere le chaos.' : 'Never drop the ball. Every return accelerates the chaos.'}</p>
                </div>
                <strong className={styles.wallet}>SLAP$ {safeWallet.toFixed(2)}</strong>
            </header>

            <div className={styles.scorebar}>
                <span>{isFr ? 'Toi' : 'You'} <strong>{playerWins}</strong></span>
                <span className={styles.roundLabel}>{isFr ? 'Manche' : 'Round'} {Math.max(1, roundNumber)} · BO3</span>
                <span><strong>{rivalWins}</strong> Rival</span>
            </div>

            <div className={styles.arenaWrap}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    width={WIDTH}
                    height={HEIGHT}
                    onPointerMove={(event) => movePaddle(event.clientX)}
                    onPointerDown={(event) => movePaddle(event.clientX)}
                />
                {phase === 'countdown' && <div className={styles.countdown}>{countdown}</div>}
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

            <div className={styles.pressureRail}>
                <div><span>RALLY</span><strong>{rally}</strong></div>
                <div><span>{isFr ? 'VITESSE' : 'SPEED'}</span><strong>{speed}</strong></div>
                <div><span>{isFr ? 'DANGER' : 'DANGER'}</span><strong>{rally >= 12 ? 'MAX' : rally >= 6 ? 'HIGH' : 'LOW'}</strong></div>
            </div>

            <p className={styles.hint}>{isFr ? 'Deplace la souris, touche l ecran, ou utilise A/D et les fleches.' : 'Move the mouse, touch the arena, or use A/D and arrow keys.'}</p>
            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button type="button" onClick={() => startMatch(true)}>{isFr ? 'Entrainement' : 'Practice'}</button>
                    <button type="button" className={styles.primary} onClick={() => startMatch(false)} disabled={safeWallet < safeStake}>
                        {isFr ? `Duel · SLAP$ ${safeStake}` : `Duel · SLAP$ ${safeStake}`}
                    </button>
                </div>
            )}
        </section>
    );
}
