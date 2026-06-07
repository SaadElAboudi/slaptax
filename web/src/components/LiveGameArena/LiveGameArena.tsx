import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';
import { getRealtimeUrl } from '../../api/realtime';
import { useSfx } from '../../hooks/useSfx';
import { startAdaptiveMusic, stopAdaptiveMusic } from '../../hooks/useAdaptiveAudio';
import { useGameStore } from '../../hooks/useGameStore';
import styles from './LiveGameArena.module.css';

interface DuelSession {
    duelId: string;
    userId: string;
    challengerId: string;
    spectator?: boolean;
}

interface LiveGameArenaProps {
    mode: 'training' | 'duel' | 'tournament';
    gameId: CompetitiveGameId;
    series: CompetitiveGameId[];
    round: number;
    opponentName: string;
    isFr: boolean;
    duelSession?: DuelSession;
    onComplete: (result: { score: number; metric: number; authoritative?: boolean }) => void;
}

interface RoundProps {
    round: number;
    isFr: boolean;
    finish: (score: number, detail: string, authoritative?: boolean) => void;
}

const SYMBOLS = ['◆', '●', '▲', '■', '✦'];

export function LiveGameArena({ mode, gameId, series, round, opponentName, isFr, duelSession, onComplete }: LiveGameArenaProps) {
    const [phase, setPhase] = useState<'briefing' | 'countdown' | 'playing' | 'complete'>('briefing');
    const [countdown, setCountdown] = useState(3);
    const [result, setResult] = useState<{ score: number; detail: string } | null>(null);
    const startRef = useRef(0);
    const finishedRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    const { activateAudio, playReady, playWin, playLoss } = useSfx();
    const playerName = useGameStore((state) => state.playerName);
    const avatar = useGameStore((state) => state.progression?.cosmetics.avatar || 'spark');
    onCompleteRef.current = onComplete;

    function begin() {
        void activateAudio();
        playReady(Math.min(1, round / 3));
        setCountdown(3);
        setPhase('countdown');
    }

    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            startRef.current = performance.now();
            setPhase('playing');
            return;
        }
        const timer = window.setTimeout(() => setCountdown((value) => value - 1), 620);
        return () => window.clearTimeout(timer);
    }, [phase, countdown]);

    useEffect(() => {
        if (phase !== 'playing') {
            stopAdaptiveMusic();
            return;
        }
        startAdaptiveMusic(gameId, Math.min(1, .25 + round * .18));
        return stopAdaptiveMusic;
    }, [gameId, phase, round]);

    const finish = useCallback((rawScore: number, detail: string, authoritative = false) => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        const metric = Math.max(1, Math.round(performance.now() - startRef.current));
        const score = Math.max(0, Math.min(1000, Math.round(rawScore)));
        setResult({ score, detail });
        setPhase('complete');
        if (score >= 500) playWin(Math.min(1, round / 3));
        else playLoss(Math.min(1, round / 3));
        navigator.vibrate?.([35, 30, 70]);
        window.setTimeout(() => onCompleteRef.current({ score, metric, authoritative }), 1100);
    }, [playLoss, playWin, round]);

    return (
        <section className={styles.arena}>
            <header className={styles.header}>
                <div>
                    <span>{isFr ? `MANCHE ${round}` : `ROUND ${round}`}</span>
                    <h2>{gameLabel(gameId, isFr)}</h2>
                </div>
                {mode === 'training' ? (
                    <div className={styles.modeBadge}>{isFr ? 'SOLO · SANS ENJEU' : 'SOLO · NO STAKES'}</div>
                ) : (
                    <div className={styles.versus}>
                        <div><i data-avatar={avatar} /><strong>{playerName}</strong></div>
                        <span>VS</span>
                        <div><i data-avatar="rival" /><strong>{opponentName}</strong></div>
                    </div>
                )}
            </header>

            <div className={`${styles.series} ${mode === 'training' ? styles.trainingSeries : ''}`}>
                {series.map((entry, index) => (
                    <div key={`${entry}-${index}`} className={`${index + 1 === round ? styles.seriesActive : ''} ${index + 1 < round ? styles.seriesDone : ''}`}>
                        <span>R{index + 1}</span><strong>{gameLabel(entry, isFr)}</strong>
                    </div>
                ))}
            </div>

            {phase === 'briefing' && (
                <div className={styles.briefing}>
                    <div className={styles.gameMark}>{gameGlyph(gameId)}</div>
                    <span>{mode === 'training' ? (isFr ? 'EXERCICE LIBRE' : 'FREE PRACTICE') : (isFr ? 'PROCHAINE EPREUVE' : 'NEXT EVENT')}</span>
                    <h3>{gameLabel(gameId, isFr)}</h3>
                    <p>{gameRule(gameId, isFr)}</p>
                    <button type="button" onClick={begin}>{isFr ? 'Entrer dans l arene' : 'Enter the arena'}</button>
                </div>
            )}

            {phase === 'countdown' && <div className={styles.countdown}>{countdown || 'GO'}</div>}

            {phase === 'playing' && (
                <div className={styles.stage}>
                    {duelSession && ['bounce', 'symbolrush', 'bombpass'].includes(gameId) ? (
                        <SharedArenaRound round={round} gameId={gameId} isFr={isFr} finish={finish} session={duelSession} />
                    ) : gameId === 'bounce' ? (
                        <BounceRound round={round} isFr={isFr} finish={finish} />
                    ) : null}
                    {gameId === 'symbolrush' && !duelSession && <SymbolRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'bombpass' && !duelSession && <BombRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'cupshuffle' && <CupRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'duelnumeric' && <NumericRound round={round} isFr={isFr} finish={finish} />}
                </div>
            )}

            {phase === 'complete' && result && (
                <div className={`${styles.complete} ${result.score >= 500 ? styles.completeWin : styles.completeLoss}`}>
                    <div className={styles.impactLines} aria-hidden><i /><i /><i /><i /></div>
                    <span>
                        {result.score >= 500
                            ? (isFr ? 'MANCHE DOMINEE' : 'ROUND DOMINATED')
                            : (isFr ? 'IMPACT ENREGISTRE' : 'IMPACT RECORDED')}
                    </span>
                    <strong>{result.score}</strong>
                    <p>{result.detail}</p>
                    <div className={styles.syncBar}><i /></div>
                </div>
            )}
        </section>
    );
}

interface SharedArenaState {
    type: 'arena.state';
    duelId: string;
    round: number;
    gameId: CompetitiveGameId;
    phase: 'waiting' | 'countdown' | 'playing' | 'done';
    resumeAt: number;
    disconnectDeadline: number;
    disconnectedUserId: string | null;
    challengerId: string;
    opponentId: string;
    winnerId: string | null;
    finishReason: string;
    duration: number;
    connectedPlayers: string[];
    spectatorCount: number;
    rally?: number;
    perfects?: Record<string, number>;
    combos?: Record<string, number>;
    charges?: Record<string, number>;
    paddles?: Record<string, number>;
    balls?: Array<{ id: string; x: number; y: number; vx: number; vy: number }>;
    paddleWidth?: number;
    suddenDeath?: boolean;
    obstacles?: Array<{ x: number; y: number; width: number }>;
    sequence?: string[];
    sequenceLength?: number;
    reversed?: boolean;
    palette?: string[];
    progress?: Record<string, number>;
    errors?: Record<string, number>;
    revealEndsAt?: number;
    inputEndsAt?: number;
    holderId?: string;
    passes?: number;
    fuseEndsAt?: number;
    marker?: number;
    safeCenter?: number;
    safeWidth?: number;
    abilities?: Record<string, { shield: number; feint: number }>;
    lastAction?: { userId: string; action: string; at: number } | null;
}

function SharedArenaRound({
    round,
    gameId,
    isFr,
    finish,
    session,
}: RoundProps & { gameId: CompetitiveGameId; session: DuelSession }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const stateRef = useRef<SharedArenaState | null>(null);
    const frameRef = useRef(0);
    const completedRef = useRef(false);
    const [state, setState] = useState<SharedArenaState | null>(null);
    const [countdown, setCountdown] = useState(0);
    const isChallenger = session.userId === session.challengerId;
    const rivalId = state
        ? (session.userId === state.challengerId ? state.opponentId : state.challengerId)
        : '';

    useEffect(() => {
        let stopped = false;
        let reconnectTimer = 0;
        let attempt = 0;

        function connect() {
            if (stopped) return;
            const socket = new WebSocket(getRealtimeUrl(session.userId));
            socketRef.current = socket;
            socket.addEventListener('open', () => {
                attempt = 0;
                socket.send(JSON.stringify({
                    type: session.spectator ? 'arena.watch' : 'arena.join',
                    duelId: session.duelId,
                    round,
                }));
            });
            socket.addEventListener('message', (message) => {
                let event: SharedArenaState | null = null;
                try {
                    event = JSON.parse(String(message.data));
                } catch {
                    return;
                }
                if (event?.type !== 'arena.state' || event.duelId !== session.duelId || event.round !== round) return;
                stateRef.current = event;
                setState(event);
                if (event.phase === 'done' && event.winnerId && !completedRef.current) {
                    completedRef.current = true;
                    const won = event.winnerId === session.userId;
                    finish(
                        won ? 1000 : 0,
                        won
                            ? (isFr ? 'Victoire arbitree par le serveur' : 'Server-authoritative victory')
                            : (isFr ? 'Manche perdue' : 'Round lost'),
                        true
                    );
                }
            });
            socket.addEventListener('close', () => {
                if (stopped) return;
                attempt += 1;
                reconnectTimer = window.setTimeout(connect, Math.min(8000, 400 * (2 ** attempt)));
            });
        }

        connect();
        return () => {
            stopped = true;
            window.clearTimeout(reconnectTimer);
            socketRef.current?.close();
        };
    }, [finish, isFr, round, session.duelId, session.spectator, session.userId]);

    useEffect(() => {
        if (state?.phase !== 'countdown') {
            setCountdown(0);
            return;
        }
        const update = () => {
            const remaining = Math.max(0, Math.ceil(((stateRef.current?.resumeAt || 0) - Date.now()) / 1000));
            setCountdown(remaining);
        };
        update();
        const timer = window.setInterval(update, 100);
        return () => window.clearInterval(timer);
    }, [state?.phase]);

    useEffect(() => {
        if (gameId !== 'bounce') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        const drawingCanvas = canvas;
        const drawingContext = context;

        function resize() {
            const rect = drawingCanvas.getBoundingClientRect();
            const ratio = Math.min(2, window.devicePixelRatio || 1);
            drawingCanvas.width = Math.max(1, Math.round(rect.width * ratio));
            drawingCanvas.height = Math.max(1, Math.round(rect.height * ratio));
            drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function draw() {
            const width = drawingCanvas.clientWidth;
            const height = drawingCanvas.clientHeight;
            const current = stateRef.current;
            drawingContext.clearRect(0, 0, width, height);
            drawingContext.fillStyle = '#070b10';
            drawingContext.fillRect(0, 0, width, height);
            drawingContext.strokeStyle = 'rgba(255,255,255,.08)';
            drawingContext.setLineDash([10, 12]);
            drawingContext.beginPath();
            drawingContext.moveTo(0, height / 2);
            drawingContext.lineTo(width, height / 2);
            drawingContext.stroke();
            drawingContext.setLineDash([]);

            if (current) {
                const selfId = session.userId;
                const currentRivalId = selfId === current.challengerId ? current.opponentId : current.challengerId;
                const mirror = !isChallenger;
                const localX = (value: number) => (mirror ? 1 - value : value);
                const localY = (value: number) => (mirror ? 1 - value : value);
                const paddleWidth = (current.paddleWidth || .22) * width;

                drawingContext.fillStyle = '#ef476f';
                drawingContext.fillRect(localX(current.paddles?.[currentRivalId] || .5) * width - paddleWidth / 2, 18, paddleWidth, 9);
                drawingContext.fillStyle = '#ffd400';
                drawingContext.fillRect(localX(current.paddles?.[selfId] || .5) * width - paddleWidth / 2, height - 27, paddleWidth, 10);

                for (const obstacle of current.obstacles || []) {
                    drawingContext.fillStyle = 'rgba(239,71,111,.78)';
                    drawingContext.fillRect(
                        localX(obstacle.x) * width - obstacle.width * width / 2,
                        localY(obstacle.y) * height - 4,
                        obstacle.width * width,
                        8
                    );
                }
                for (const ball of current.balls || []) {
                    const ballX = localX(ball.x) * width;
                    const ballY = localY(ball.y) * height;
                    const glow = drawingContext.createRadialGradient(ballX, ballY, 2, ballX, ballY, 28);
                    glow.addColorStop(0, 'rgba(255,240,125,.9)');
                    glow.addColorStop(1, 'rgba(255,212,0,0)');
                    drawingContext.fillStyle = glow;
                    drawingContext.beginPath();
                    drawingContext.arc(ballX, ballY, 28, 0, Math.PI * 2);
                    drawingContext.fill();
                    drawingContext.fillStyle = '#ffd400';
                    drawingContext.beginPath();
                    drawingContext.arc(ballX, ballY, 9, 0, Math.PI * 2);
                    drawingContext.fill();
                }
            }
            frameRef.current = requestAnimationFrame(draw);
        }

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(drawingCanvas);
        frameRef.current = requestAnimationFrame(draw);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frameRef.current);
        };
    }, [gameId, isChallenger, session.userId]);

    function send(action: Record<string, unknown>) {
        if (session.spectator) return;
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: 'arena.action', ...action }));
    }

    function move(clientX: number) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const localX = Math.max(.07, Math.min(.93, (clientX - rect.left) / rect.width));
        send({
            action: 'move',
            x: isChallenger ? localX : 1 - localX,
        });
    }

    const phase = state?.phase || 'waiting';
    const status = phase === 'waiting'
        ? (isFr ? 'En attente du rival...' : 'Waiting for rival...')
        : phase === 'countdown'
            ? `${isFr ? 'Reprise' : 'Starting'} ${countdown || 'GO'}`
            : phase === 'playing'
                ? (isFr ? 'ECHANGE LIVE' : 'LIVE RALLY')
                : (isFr ? 'MANCHE TERMINEE' : 'ROUND COMPLETE');

    if (gameId === 'symbolrush') {
        const revealing = Boolean(state?.sequence?.length);
        const myProgress = state?.progress?.[session.userId] || 0;
        const rivalProgress = state?.progress?.[rivalId] || 0;
        const length = state?.sequenceLength || 1;
        return (
            <div className={styles.game}>
                <div className={styles.liveHud}>
                    <span>{status}</span>
                    <span>{state?.reversed ? 'REVERSE MEMORY' : 'COMMON SEQUENCE'}</span>
                </div>
                <div className={styles.duelProgress}>
                    <div><span>YOU</span><i style={{ width: `${myProgress / length * 100}%` }} /></div>
                    <div><span>RIVAL</span><i style={{ width: `${rivalProgress / length * 100}%` }} /></div>
                </div>
                <div className={styles.symbolBoard} data-testid="symbol-board">
                    {Array.from({ length }, (_, index) => (
                        <span key={index} className={revealing ? styles.symbolFlash : myProgress > index ? styles.symbolLocked : ''}>
                            {revealing ? state?.sequence?.[index] : myProgress > index ? '✓' : '?'}
                        </span>
                    ))}
                </div>
                <div className={styles.symbolPad} data-testid="symbol-pad">
                    {(state?.palette || SYMBOLS).map((symbol) => (
                        <button
                            type="button"
                            key={symbol}
                        disabled={session.spectator || phase !== 'playing' || revealing}
                            onClick={() => send({ action: 'answer', symbol })}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
                <p>{isFr ? 'Même séquence, progression rivale visible, réponses cachées.' : 'Same sequence, rival progress visible, answers hidden.'}</p>
            </div>
        );
    }

    if (gameId === 'bombpass') {
        const holding = state?.holderId === session.userId;
        const fuse = Math.max(0, ((state?.fuseEndsAt || Date.now()) - Date.now()) / 1000);
        const ability = state?.abilities?.[session.userId];
        return (
            <div className={styles.game}>
                <div className={styles.liveHud}>
                    <span>{holding ? (isFr ? 'TU AS LA BOMBE' : 'YOU HOLD THE BOMB') : (isFr ? 'CHEZ LE RIVAL' : 'RIVAL HOLDS IT')}</span>
                    <span>PASSES <strong data-testid="bomb-passes">{state?.passes || 0}</strong></span>
                </div>
                <div className={`${styles.bombCore} ${fuse < 2.5 ? styles.bombCritical : ''}`}>
                    <span>●</span>
                    <i style={{ width: `${Math.min(100, fuse / 8 * 100)}%` }} />
                </div>
                <button
                    type="button"
                    className={styles.bombTrack}
                    data-testid="bomb-track"
                    disabled={session.spectator || !holding || phase !== 'playing'}
                    onClick={() => send({ action: 'pass' })}
                >
                    <span
                        className={styles.safeZone}
                        style={{
                            left: `${((state?.safeCenter || .5) - (state?.safeWidth || .2) / 2) * 100}%`,
                            width: `${(state?.safeWidth || .2) * 100}%`,
                        }}
                    />
                    <i style={{ left: `${(state?.marker || 0) * 100}%` }} />
                </button>
                <div className={styles.powerBar}>
                    <button type="button" disabled={session.spectator || !holding || !ability?.feint} onClick={() => send({ action: 'feint' })}>FEINT ×{ability?.feint || 0}</button>
                    <span>SHIELD ×{ability?.shield || 0}</span>
                </div>
                <p>{isFr ? 'Passe dans la zone sûre. Feinte une fois, bouclier automatique une fois.' : 'Pass in the safe zone. One feint, one automatic shield.'}</p>
            </div>
        );
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}>
                <span>{status}</span>
                <span>RALLY <strong data-testid="shared-bounce-rally">{state?.rally || 0}</strong></span>
            </div>
            <canvas
                ref={canvasRef}
                className={styles.bounceCanvas}
                data-testid="bounce-canvas"
                tabIndex={0}
                onPointerMove={(event) => {
                    if (event.pointerType === 'mouse' || event.currentTarget.hasPointerCapture(event.pointerId)) move(event.clientX);
                }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    move(event.clientX);
                }}
                onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            />
            <div className={styles.powerBar}>
                {(['speed', 'multiball', 'shrink'] as const).map((power) => (
                    <button
                        type="button"
                        key={power}
                        disabled={session.spectator || (state?.charges?.[session.userId] || 0) < 1 || phase !== 'playing'}
                        onClick={() => send({ action: 'power', power })}
                    >
                        {power.toUpperCase()}
                    </button>
                ))}
                <span>PERFECT {state?.perfects?.[session.userId] || 0}</span>
            </div>
            <p>{state?.suddenDeath ? 'SUDDEN DEATH' : (isFr ? 'Perfect returns = bonus offensifs.' : 'Perfect returns charge offensive powers.')}</p>
        </div>
    );
}

function BounceRound({ round, isFr, finish }: RoundProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameRef = useRef(0);
    const paddleRef = useRef(.5);
    const [rally, setRally] = useState(0);
    const [speed, setSpeed] = useState(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const drawingCanvas = canvas;
        const context = ctx;
        const started = performance.now();
        const state = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            rally: 0,
            width: 0,
            height: 0,
        };
        let previous = started;
        let stopped = false;

        function resize() {
            const rect = drawingCanvas.getBoundingClientRect();
            const ratio = Math.min(2, window.devicePixelRatio || 1);
            const width = Math.max(320, rect.width);
            const height = Math.max(210, rect.height);
            drawingCanvas.width = Math.round(width * ratio);
            drawingCanvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            if (!state.width) {
                state.x = width * .5;
                state.y = height * .5;
                const launchSpeed = 245 + Math.min(90, round * 18);
                state.vx = launchSpeed * .62;
                state.vy = launchSpeed * .78;
            } else {
                state.x *= width / state.width;
                state.y *= height / state.height;
            }
            state.width = width;
            state.height = height;
        }

        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(drawingCanvas);

        function draw(now: number) {
            if (stopped) return;
            const dt = Math.min(.032, Math.max(0, (now - previous) / 1000));
            previous = now;
            const previousY = state.y;
            state.x += state.vx * dt;
            state.y += state.vy * dt;

            const ballRadius = 9;
            const paddleY = state.height - 24;
            const minimumPaddle = state.width < 520 ? 68 : 80;
            const paddleWidth = Math.max(
                minimumPaddle,
                state.width * (.34 - round * .025 - Math.min(14, state.rally) * .009)
            );
            const paddleX = paddleRef.current * state.width;
            const survival = (now - started) / 1000;
            const obstacleY = state.height * .37;
            const obstacleWidth = Math.max(76, state.width * Math.max(.14, .25 - round * .018));
            const obstacleX = state.width / 2
                + Math.sin(survival * (1.15 + round * .16)) * state.width * .27;

            if (state.x <= ballRadius || state.x >= state.width - ballRadius) {
                state.x = Math.max(ballRadius, Math.min(state.width - ballRadius, state.x));
                state.vx *= -1;
            }

            if (state.y <= ballRadius + 16 && state.vy < 0) {
                state.y = ballRadius + 16;
                state.vy = Math.abs(state.vy);
                state.vx += (Math.random() - .5) * 28;
            }

            const crossesObstacleDown = state.vy > 0
                && previousY + ballRadius <= obstacleY
                && state.y + ballRadius >= obstacleY;
            const crossesObstacleUp = state.vy < 0
                && previousY - ballRadius >= obstacleY + 9
                && state.y - ballRadius <= obstacleY + 9;
            if (
                (crossesObstacleDown || crossesObstacleUp)
                && Math.abs(state.x - obstacleX) <= obstacleWidth / 2 + ballRadius
            ) {
                state.y = crossesObstacleDown ? obstacleY - ballRadius : obstacleY + 9 + ballRadius;
                state.vy *= -1;
                state.vx += (state.x - obstacleX) * .08;
            }

            if (state.y + ballRadius >= paddleY && state.vy > 0) {
                if (Math.abs(state.x - paddleX) <= paddleWidth / 2 + ballRadius) {
                    const impact = Math.max(-1, Math.min(1, (state.x - paddleX) / (paddleWidth / 2)));
                    const nextSpeed = Math.min(500 + round * 45, Math.hypot(state.vx, state.vy) * 1.055);
                    const horizontal = Math.max(.2, Math.abs(impact)) * Math.sign(impact || state.vx || 1);
                    state.x = Math.max(ballRadius, Math.min(state.width - ballRadius, state.x));
                    state.y = paddleY - ballRadius;
                    state.vx = nextSpeed * horizontal * .78;
                    state.vy = -Math.sqrt(Math.max(nextSpeed * nextSpeed - state.vx * state.vx, nextSpeed * nextSpeed * .35));
                    state.rally += 1;
                    setRally(state.rally);
                    setSpeed(nextSpeed / 300);
                    navigator.vibrate?.(12);
                } else if (state.y > state.height + ballRadius * 2) {
                    stopped = true;
                    const survival = (now - started) / 1000;
                    finish(Math.min(1000, 300 + state.rally * 55 + survival * 12), `${state.rally} ${isFr ? 'retours' : 'returns'} · ${survival.toFixed(1)}s`);
                    return;
                }
            }

            const width = state.width;
            const height = state.height;
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#070b10';
            context.fillRect(0, 0, width, height);
            context.strokeStyle = 'rgba(255,255,255,.08)';
            context.setLineDash([10, 12]);
            context.beginPath(); context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke();
            context.setLineDash([]);

            context.fillStyle = '#ef476f';
            context.fillRect(obstacleX - obstacleWidth / 2, obstacleY, obstacleWidth, 9);
            context.fillStyle = '#ffd400';
            context.fillRect(paddleX - paddleWidth / 2, paddleY, paddleWidth, 10);
            const glow = context.createRadialGradient(state.x, state.y, 2, state.x, state.y, 28);
            glow.addColorStop(0, 'rgba(255,240,125,.85)');
            glow.addColorStop(1, 'rgba(255,212,0,0)');
            context.fillStyle = glow; context.beginPath(); context.arc(state.x, state.y, 28, 0, Math.PI * 2); context.fill();
            context.fillStyle = '#ffd400'; context.beginPath(); context.arc(state.x, state.y, ballRadius, 0, Math.PI * 2); context.fill();
            frameRef.current = requestAnimationFrame(draw);
        }
        frameRef.current = requestAnimationFrame(draw);
        return () => {
            stopped = true;
            resizeObserver.disconnect();
            cancelAnimationFrame(frameRef.current);
        };
    }, [finish, isFr, round]);

    function move(clientX: number) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        paddleRef.current = Math.max(.06, Math.min(.94, (clientX - rect.left) / rect.width));
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>RALLY <strong data-testid="bounce-rally">{rally}</strong></span><span>SPEED <strong>x{speed.toFixed(1)}</strong></span></div>
            <canvas
                ref={canvasRef}
                className={styles.bounceCanvas}
                data-testid="bounce-canvas"
                width={900}
                height={430}
                tabIndex={0}
                aria-label={isFr ? 'Terrain Bounce Panic. Déplace le paddle.' : 'Bounce Panic field. Move the paddle.'}
                onPointerMove={(event) => {
                    if (event.pointerType === 'mouse' || event.currentTarget.hasPointerCapture(event.pointerId)) move(event.clientX);
                }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    move(event.clientX);
                }}
                onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        paddleRef.current = Math.max(.06, Math.min(.94, paddleRef.current + (event.key === 'ArrowLeft' ? -.08 : .08)));
                    }
                }}
            />
            <p>{isFr ? 'Deplace le paddle. Une balle perdue termine la manche.' : 'Move the paddle. One dropped ball ends the round.'}</p>
        </div>
    );
}

function SymbolRound({ round, isFr, finish }: RoundProps) {
    const sequence = useMemo(() => makeSequence(Math.min(6, 3 + round)), [round]);
    const palette = useMemo(() => shuffle(SYMBOLS), []);
    const [phase, setPhase] = useState<'reveal' | 'input'>('reveal');
    const [revealIndex, setRevealIndex] = useState(0);
    const [input, setInput] = useState<string[]>([]);
    const [errors, setErrors] = useState(0);
    const [time, setTime] = useState(10);

    useEffect(() => {
        if (phase !== 'reveal') return;
        if (revealIndex >= sequence.length) {
            const timer = window.setTimeout(() => setPhase('input'), 500);
            return () => window.clearTimeout(timer);
        }
        const timer = window.setTimeout(() => setRevealIndex((value) => value + 1), 650);
        return () => window.clearTimeout(timer);
    }, [phase, revealIndex, sequence.length]);

    useEffect(() => {
        if (phase !== 'input') return;
        const timer = window.setInterval(() => setTime((value) => value - .1), 100);
        return () => window.clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        if (time <= 0) finish(input.length * 120, `${input.length}/${sequence.length} ${isFr ? 'symboles' : 'symbols'}`);
    }, [finish, input.length, isFr, sequence.length, time]);

    function choose(symbol: string) {
        const index = input.length;
        if (symbol !== sequence[index]) {
            setErrors((value) => value + 1);
            setTime((value) => Math.max(0, value - 1.2));
            navigator.vibrate?.(80);
            return;
        }
        const next = [...input, symbol];
        setInput(next);
        if (next.length === sequence.length) {
            finish(700 + time * 24 - errors * 85, `${errors} ${isFr ? 'erreur' : 'mistake'} · ${time.toFixed(1)}s`);
        }
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>{phase === 'reveal' ? 'MEMORIZE' : 'REBUILD'}</span><span><strong>{time.toFixed(1)}s</strong></span></div>
            <div
                className={styles.symbolBoard}
                data-testid="symbol-board"
                data-qa-sequence={typeof navigator !== 'undefined' && navigator.webdriver ? sequence.join('') : undefined}
            >
                {sequence.map((symbol, index) => (
                    <span key={index} className={phase === 'reveal' && index === revealIndex - 1 ? styles.symbolFlash : input[index] ? styles.symbolLocked : ''}>
                        {phase === 'reveal' ? (index === revealIndex - 1 ? symbol : '·') : input[index] || '?'}
                    </span>
                ))}
            </div>
            <div className={styles.symbolPad} data-testid="symbol-pad">
                {palette.map((symbol) => <button type="button" key={symbol} onClick={() => choose(symbol)} disabled={phase !== 'input'}>{symbol}</button>)}
            </div>
            <p>{errors > 0 ? `+${(errors * 1.2).toFixed(1)}s penalty` : (isFr ? 'Chaque erreur retire du temps.' : 'Every mistake removes time.')}</p>
        </div>
    );
}

function BombRound({ round, isFr, finish }: RoundProps) {
    const [marker, setMarker] = useState(0);
    const [direction, setDirection] = useState(1);
    const [passes, setPasses] = useState(0);
    const [fuse, setFuse] = useState(8.5 - round * .45);
    const safeCenter = useMemo(() => 22 + Math.random() * 56, [passes]);
    const safeWidth = Math.max(11, 27 - passes * 2.4);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setMarker((value) => {
                const next = value + direction * (2.2 + passes * .24);
                if (next >= 100 || next <= 0) {
                    setDirection((current) => -current);
                    return Math.max(0, Math.min(100, next));
                }
                return next;
            });
            setFuse((value) => value - .025);
        }, 25);
        return () => window.clearInterval(timer);
    }, [direction, passes]);

    useEffect(() => {
        if (fuse <= 0) finish(passes * 118, `${passes} passes · BOOM`);
    }, [finish, fuse, passes]);

    function pass() {
        const hit = Math.abs(marker - safeCenter) <= safeWidth / 2;
        if (!hit) {
            finish(passes * 105, `${passes} passes · ${isFr ? 'zone ratee' : 'missed zone'}`);
            return;
        }
        const next = passes + 1;
        setPasses(next);
        setFuse((value) => Math.min(9, value + .72));
        navigator.vibrate?.(20);
        if (next >= 8 + round) finish(920 + fuse * 7, `${next} passes · ${fuse.toFixed(1)}s`);
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>PASSES <strong data-testid="bomb-passes">{passes}</strong></span><span>FUSE <strong>{Math.max(0, fuse).toFixed(1)}s</strong></span></div>
            <div className={`${styles.bombCore} ${fuse < 2.5 ? styles.bombCritical : ''}`}><span>●</span><i style={{ width: `${Math.max(0, fuse / 8.5) * 100}%` }} /></div>
            <button type="button" className={styles.bombTrack} data-testid="bomb-track" onClick={pass}>
                <span className={styles.safeZone} style={{ left: `${safeCenter - safeWidth / 2}%`, width: `${safeWidth}%` }} />
                <i style={{ left: `${marker}%` }} />
            </button>
            <p>{isFr ? 'Clique quand le curseur traverse le vert. La fenetre retrecit.' : 'Tap as the marker crosses green. The window keeps shrinking.'}</p>
        </div>
    );
}

function CupRound({ round, isFr, finish }: RoundProps) {
    const tokenCup = useMemo(() => Math.floor(Math.random() * 3), []);
    const swaps = useMemo(() => makeSwaps(4 + round * 2), [round]);
    const [order, setOrder] = useState([0, 1, 2]);
    const [phase, setPhase] = useState<'reveal' | 'shuffle' | 'choose'>('reveal');
    const [step, setStep] = useState(0);
    const chooseStarted = useRef(0);

    useEffect(() => {
        if (phase !== 'reveal') return;
        const timer = window.setTimeout(() => setPhase('shuffle'), 1600);
        return () => window.clearTimeout(timer);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'shuffle') return;
        if (step >= swaps.length) {
            chooseStarted.current = performance.now();
            setPhase('choose');
            return;
        }
        const timer = window.setTimeout(() => {
            const [a, b] = swaps[step];
            setOrder((current) => {
                const copy = [...current];
                [copy[a], copy[b]] = [copy[b], copy[a]];
                return copy;
            });
            setStep((value) => value + 1);
        }, Math.max(300, 590 - round * 65));
        return () => window.clearTimeout(timer);
    }, [phase, round, step, swaps]);

    function choose(slot: number) {
        const won = order[slot] === tokenCup;
        const reaction = performance.now() - chooseStarted.current;
        finish(won ? Math.max(650, 1000 - reaction * .12) : 120, won ? `${reaction.toFixed(0)}ms` : (isFr ? 'mauvais gobelet' : 'wrong cup'));
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>{phase === 'reveal' ? 'LOCK ON' : phase === 'shuffle' ? 'TRACK' : 'CHOOSE'}</span><span><strong>{step}/{swaps.length}</strong></span></div>
            <div className={styles.cupTable} data-testid="cup-table">
                {[0, 1, 2].map((cupId) => {
                    const slot = order.indexOf(cupId);
                    return (
                        <button
                            type="button"
                            key={cupId}
                            className={styles.cup}
                            style={{ transform: `translateX(${slot * 100}%)` }}
                            disabled={phase !== 'choose'}
                            onClick={() => choose(slot)}
                        >
                            <span>▰</span>
                            {phase === 'reveal' && cupId === tokenCup && <i>●</i>}
                        </button>
                    );
                })}
            </div>
            <div className={styles.slotLabels}><span>1</span><span>2</span><span>3</span></div>
            <p>{phase === 'choose' ? (isFr ? 'Choisis maintenant.' : 'Pick now.') : (isFr ? 'Ne perds pas le jeton.' : 'Do not lose the token.')}</p>
        </div>
    );
}

function NumericRound({ round, isFr, finish }: RoundProps) {
    const questions = useMemo(() => Array.from({ length: 4 + round }, () => makeQuestion(round)), [round]);
    const [index, setIndex] = useState(0);
    const [errors, setErrors] = useState(0);
    const [time, setTime] = useState(12);
    const question = questions[index];

    useEffect(() => {
        const timer = window.setInterval(() => setTime((value) => value - .1), 100);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (time <= 0) finish(index * 135, `${index}/${questions.length}`);
    }, [finish, index, questions.length, time]);

    function answer(value: number) {
        if (value !== question.answer) {
            setErrors((count) => count + 1);
            setTime((value) => Math.max(0, value - 1));
            navigator.vibrate?.(70);
            return;
        }
        if (index === questions.length - 1) {
            finish(720 + time * 20 - errors * 70, `${questions.length}/${questions.length} · ${time.toFixed(1)}s`);
        } else {
            setIndex((count) => count + 1);
        }
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>STACK <strong>{index + 1}/{questions.length}</strong></span><span>TIME <strong>{time.toFixed(1)}s</strong></span></div>
            <div className={styles.equation} data-testid="numeric-equation">{question.label}</div>
            <div className={styles.answerGrid} data-testid="numeric-answers">
                {question.options.map((option) => <button type="button" key={option} onClick={() => answer(option)}>{option}</button>)}
            </div>
            <p>{errors ? `${errors} ${isFr ? 'erreur, -1s chacune' : 'miss, -1s each'}` : (isFr ? 'Lis, tranche, enchaine.' : 'Read, decide, chain.')}</p>
        </div>
    );
}

function gameGlyph(gameId: CompetitiveGameId) {
    return { bounce: '●', symbolrush: '◆▲', bombpass: '●', cupshuffle: '▰', duelnumeric: '42' }[gameId];
}

function gameRule(gameId: CompetitiveGameId, isFr: boolean) {
    const rules = {
        bounce: ['Deplace ton paddle et garde la balle en vie. Une erreur termine la manche.', 'Move your paddle and keep the ball alive. One miss ends the round.'],
        symbolrush: ['Memorise la suite animee puis reconstruis-la avant la fin du chrono.', 'Memorize the animated sequence, then rebuild it before time runs out.'],
        bombpass: ['Enchaine les passes dans la zone sure avant l explosion.', 'Chain passes through the safe zone before the explosion.'],
        cupshuffle: ['Verrouille le jeton, suis les deplacements et choisis le bon gobelet.', 'Lock onto the token, track every move, and choose the right cup.'],
        duelnumeric: ['Resous une pile de problemes sous pression, sans casser ton rythme.', 'Clear a stack of problems under pressure without breaking pace.'],
    } as const;
    return rules[gameId][isFr ? 0 : 1];
}

function makeSequence(length: number) {
    const sequence: string[] = [];
    while (sequence.length < length) {
        const options = SYMBOLS.filter((symbol) => symbol !== sequence[sequence.length - 1]);
        sequence.push(options[Math.floor(Math.random() * options.length)]);
    }
    return sequence;
}

function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
}

function makeSwaps(length: number): Array<[number, number]> {
    return Array.from({ length }, () => {
        const a = Math.floor(Math.random() * 3);
        let b = Math.floor(Math.random() * 3);
        while (a === b) b = Math.floor(Math.random() * 3);
        return [a, b];
    });
}

function makeQuestion(round: number) {
    const a = 5 + Math.floor(Math.random() * (12 + round * 4));
    const b = 2 + Math.floor(Math.random() * 9);
    const multiply = Math.random() > .62;
    const answer = multiply ? a * b : a + b;
    const candidates = new Set([answer, answer + b, Math.max(0, answer - a), answer + 3, Math.max(0, answer - 2)]);
    let offset = 1;
    while (candidates.size < 4) {
        candidates.add(answer + offset);
        offset += 1;
    }
    const options = shuffle(Array.from(candidates).filter((value) => value !== answer)).slice(0, 3);
    return { label: `${a} ${multiply ? '×' : '+'} ${b}`, answer, options: shuffle([answer, ...options]) };
}
