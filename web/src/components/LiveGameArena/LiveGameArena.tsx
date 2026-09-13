import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameLabel, getCompetitiveGame, isPartyGame, type CompetitiveGameId } from '../../gameplay/catalog';
import { PartyArena } from './PartyArena';
import { getRealtimeUrl } from '../../api/realtime';
import { useSfx } from '../../hooks/useSfx';
import { startAdaptiveMusic, stopAdaptiveMusic } from '../../hooks/useAdaptiveAudio';
import { useGameStore } from '../../hooks/useGameStore';
import styles from './LiveGameArena.module.css';
import { GamePoster } from './GamePoster';
import { ArrowRight, X } from 'lucide-react';

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
    onStart?: () => void;
    onComplete: (result: { score: number; metric: number; authoritative?: boolean }) => void;
}

interface RoundProps {
    round: number;
    isFr: boolean;
    finish: (score: number, detail: string, authoritative?: boolean) => void;
}

const SYMBOLS = ['◆', '●', '▲', '■', '✦'];

export function LiveGameArena({ mode, gameId, series, round, opponentName, isFr, duelSession, onStart, onComplete }: LiveGameArenaProps) {
    const [phase, setPhase] = useState<'briefing' | 'countdown' | 'playing' | 'complete'>('briefing');
    const [countdown, setCountdown] = useState(3);
    const [result, setResult] = useState<{ score: number; detail: string } | null>(null);
    const startRef = useRef(0);
    const finishedRef = useRef(false);
    const completionTimer = useRef(0);
    const onCompleteRef = useRef(onComplete);
    const { activateAudio, playReady, playWin, playLoss, playDraw } = useSfx();
    const playerName = useGameStore((state) => state.playerName);
    const avatar = useGameStore((state) => state.progression?.cosmetics.avatar || 'spark');
    const usesSharedArena = Boolean(duelSession) || isPartyGame(gameId);
    onCompleteRef.current = onComplete;
    useEffect(() => () => window.clearTimeout(completionTimer.current), []);

    function begin() {
        onStart?.();
        void activateAudio();
        playReady(Math.min(1, round / 3));
        if (usesSharedArena) {
            startRef.current = performance.now();
            setPhase('playing');
            return;
        }
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
        if (gameId === 'garde' && score === 500) playDraw();
        else if (score >= 500) playWin(Math.min(1, round / 3));
        else playLoss(Math.min(1, round / 3));
        navigator.vibrate?.([35, 30, 70]);
        completionTimer.current = window.setTimeout(() => onCompleteRef.current({ score, metric, authoritative }), 1600);
    }, [playLoss, playWin, playDraw, gameId, round]);

    return (
        <section className={styles.arena} data-game={gameId} data-phase={phase} data-focus={phase === 'playing' || phase === 'countdown'}>
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
                {mode === 'training' && phase === 'playing' && <button type="button" className={styles.exitPractice} onClick={() => setPhase('briefing')} aria-label={isFr ? 'Quitter l exercice' : 'Exit practice'} title={isFr ? 'Quitter l exercice' : 'Exit practice'}><X size={20} /></button>}
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
                    <div className={styles.poster}><GamePoster gameId={gameId} /></div>
                    <span>{mode === 'training' ? (isFr ? 'EXERCICE LIBRE' : 'FREE PRACTICE') : (isFr ? 'PROCHAINE EPREUVE' : 'NEXT EVENT')}</span>
                    <h3>{gameLabel(gameId, isFr)}</h3>
                    <p>{gameRule(gameId, isFr)}</p>
                    <div className={styles.briefStats}>
                        <span>{gameId==='garde'?(isFr?'6 PV · 8 TOURS MAX':'6 HP · 8 TURNS MAX'):['trace','decoupe','chroma','onesecond'].includes(gameId) ? (isFr ? '3 ESSAIS' : '3 ATTEMPTS') : gameId === 'contrepied' ? (isFr ? '5 ECHANGES' : '5 EXCHANGES') : gameId === 'ricochet' ? (isFr ? '3 SALVES' : '3 VOLLEYS') : gameId === 'falsestart' ? '3 POINTS' : gameId === 'onemore' ? '30 s MAX' : gameId === 'bounce' ? '45 s MAX' : gameId === 'cupshuffle' ? (isFr ? '3 OBSERVATIONS' : '3 REVEALS') : gameId === 'duelnumeric' ? '5 QUESTIONS' : gameId === 'bombpass' ? (isFr ? '1 BOMBE' : '1 BOMB') : (isFr ? 'MEMOIRE EXPRESS' : 'QUICK MEMORY')}</span>
                        <span>{mode === 'training' ? (isFr ? 'RECORD PERSONNEL' : 'PERSONAL BEST') : (isFr ? 'FACE A FACE' : 'HEAD TO HEAD')}</span>
                    </div>
                    <button type="button" onClick={begin}>{isFr ? 'Entrer dans l arene' : 'Enter the arena'}<ArrowRight size={18} /></button>
                </div>
            )}

            {phase === 'countdown' && <div className={styles.countdown}>{countdown || 'GO'}</div>}

            {phase === 'playing' && (
                <div className={styles.stage}>
                    {isPartyGame(gameId) ? <PartyArena gameId={gameId} round={round} isFr={isFr} session={duelSession} finish={finish} /> : duelSession && usesSharedArena ? (
                        <SharedArenaRound round={round} gameId={gameId} isFr={isFr} finish={finish} session={duelSession} />
                    ) : gameId === 'bounce' ? (
                        <BounceRound round={round} isFr={isFr} finish={finish} />
                    ) : null}
                    {gameId === 'symbolrush' && !duelSession && <SymbolRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'bombpass' && !duelSession && <BombRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'cupshuffle' && !duelSession && <CupRound round={round} isFr={isFr} finish={finish} />}
                    {gameId === 'duelnumeric' && !duelSession && <NumericRound round={round} isFr={isFr} finish={finish} />}
                </div>
            )}

            {phase === 'complete' && result && (
                <div className={`${styles.complete} ${result.score >= 500 ? styles.completeWin : styles.completeLoss}`}>
                    <div className={styles.impactLines} aria-hidden><i /><i /><i /><i /></div>
                    <span>
                        {gameId==='garde' ? result.score===500?(isFr?'EGALITE':'DRAW'):result.score>500?(isFr?'VICTOIRE':'VICTORY'):(isFr?'DEFAITE':'DEFEAT') : ['trace','decoupe'].includes(gameId) ? (isFr ? 'TROIS FORMES. TON RESULTAT.' : 'THREE SHAPES. YOUR RESULT.') : result.score >= 500
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
    at: number;
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
    paddleWidths?: Record<string, number>;
    stage?: number;
    totalStages?: number;
    challengePhase?: 'waiting' | 'reveal' | 'shuffle' | 'answer' | 'feedback';
    phaseEndsAt?: number;
    scores?: Record<string, number>;
    answered?: string[];
    feedback?: Record<string, boolean>;
    order?: number[];
    swap?: number;
    swapCount?: number;
    swapDuration?: number;
    tokenCup?: number | null;
    question?: { label: string; options: number[] } | null;
    suddenDeath?: boolean;
    obstacles?: Array<{ x: number; y: number; width: number }>;
    sequence?: string[];
    sequenceLength?: number;
    reversed?: boolean;
    palettes?: Record<string, string[]>;
    progress?: Record<string, number>;
    errors?: Record<string, number>;
    shieldArmed?: Record<string, boolean>;
    jammedUntil?: Record<string, number>;
    revealEndsAt?: number;
    inputEndsAt?: number;
    holderId?: string;
    passes?: number;
    fuseEndsAt?: number;
    marker?: number;
    safeCenter?: number;
    safeWidth?: number;
    abilities?: Record<string, { shield: number; feint?: number; jam?: number }>;
    lastAction?: { userId: string; action: string; targetId?: string; at: number } | null;
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
    const serverOffsetRef = useRef(0);
    const [state, setState] = useState<SharedArenaState | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [disconnectSeconds, setDisconnectSeconds] = useState(0);
    const [connection, setConnection] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
    const [arenaError, setArenaError] = useState('');
    const [pendingStage, setPendingStage] = useState<number | null>(null);
    const lastMoveRef = useRef(0);
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
            setConnection(attempt ? 'reconnecting' : 'connecting');
            const socket = new WebSocket(getRealtimeUrl(session.userId));
            socketRef.current = socket;
            socket.addEventListener('open', () => {
                attempt = 0;
                setConnection('connected');
                socket.send(JSON.stringify({
                    type: session.spectator ? 'arena.watch' : 'arena.join',
                    duelId: session.duelId,
                    round,
                }));
            });
            socket.addEventListener('message', (message) => {
                let event: SharedArenaState | { type: 'arena.error'; error: string } | null = null;
                try {
                    event = JSON.parse(String(message.data));
                } catch {
                    return;
                }
                if (event?.type === 'arena.error') {
                    setArenaError(isFr ? 'Cette manche a change. Actualise le duel pour reprendre.' : 'This round changed. Refresh the duel to rejoin.');
                    return;
                }
                if (event?.type !== 'arena.state' || event.duelId !== session.duelId || event.round !== round) return;
                if (typeof event.at === 'number') serverOffsetRef.current = event.at - Date.now();
                stateRef.current = event;
                setState(event);
                if (event.phase === 'done' && event.winnerId && !completedRef.current) {
                    completedRef.current = true;
                    const won = event.winnerId === session.userId;
                    finish(
                        won ? 1000 : 0,
                        won
                            ? (isFr ? 'Ton rival est battu.' : 'You beat your rival.')
                            : (isFr ? 'Manche perdue' : 'Round lost'),
                        true
                    );
                }
            });
            socket.addEventListener('close', () => {
                if (stopped) return;
                setConnection('reconnecting');
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
        if (state?.phase !== 'countdown' && !state?.disconnectDeadline) {
            setCountdown(0);
            setDisconnectSeconds(0);
            return;
        }
        const update = () => {
            const serverNow = Date.now() + serverOffsetRef.current;
            const current = stateRef.current;
            setCountdown(Math.max(0, Math.ceil(((current?.resumeAt || 0) - serverNow) / 1000)));
            setDisconnectSeconds(Math.max(0, Math.ceil(((current?.disconnectDeadline || 0) - serverNow) / 1000)));
        };
        update();
        const timer = window.setInterval(update, 100);
        return () => window.clearInterval(timer);
    }, [state?.disconnectDeadline, state?.phase]);

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
                const rivalWidth = (current.paddleWidths?.[currentRivalId] || current.paddleWidth || .22) * width;
                const selfWidth = (current.paddleWidths?.[selfId] || current.paddleWidth || .22) * width;

                drawingContext.fillStyle = '#ef476f';
                drawingContext.fillRect(localX(current.paddles?.[currentRivalId] ?? .5) * width - rivalWidth / 2, height * .06 - 5, rivalWidth, 10);
                drawingContext.fillStyle = '#ffd400';
                drawingContext.fillRect(localX(current.paddles?.[selfId] ?? .5) * width - selfWidth / 2, height * .94 - 5, selfWidth, 10);

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
                    drawingContext.ellipse(ballX, ballY, width * .016, height * .016, 0, 0, Math.PI * 2);
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

    function forfeit() {
        if (session.spectator || !window.confirm(isFr ? 'Abandonner cette manche ?' : 'Forfeit this round?')) return;
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: 'arena.forfeit' }));
    }

    function move(clientX: number) {
        const now = performance.now();
        if (now - lastMoveRef.current < 32) return;
        lastMoveRef.current = now;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const localX = Math.max(.07, Math.min(.93, (clientX - rect.left) / rect.width));
        send({
            action: 'move',
            x: isChallenger ? localX : 1 - localX,
        });
    }

    const phase = state?.phase || 'waiting';
    const disconnectedSelf = state?.disconnectedUserId === session.userId;
    const interruption = arenaError || (connection !== 'connected'
        ? (isFr ? 'Connexion perdue. Reprise en cours...' : 'Connection lost. Rejoining...')
        : state?.disconnectDeadline
            ? disconnectedSelf
                ? (isFr ? `Reconnexion... forfait dans ${disconnectSeconds}s` : `Reconnecting... forfeit in ${disconnectSeconds}s`)
                : (isFr ? `Rival déconnecté · reprise pendant ${disconnectSeconds}s` : `Rival disconnected · resuming for ${disconnectSeconds}s`)
            : '');
    const status = phase === 'waiting'
        ? (isFr ? 'En attente du rival...' : 'Waiting for rival...')
        : phase === 'countdown'
            ? `${isFr ? 'Reprise' : 'Starting'} ${countdown || 'GO'}`
            : phase === 'playing'
                ? (isFr ? 'ECHANGE LIVE' : 'LIVE RALLY')
                : (isFr ? 'MANCHE TERMINEE' : 'ROUND COMPLETE');

    if (gameId === 'cupshuffle' || gameId === 'duelnumeric') {
        const stage = state?.stage || 0;
        const answering = phase === 'playing' && state?.challengePhase === 'answer';
        const answered = state?.answered?.includes(session.userId) || pendingStage === stage;
        const feedback = state?.challengePhase === 'feedback';
        const remaining = Math.max(0, ((state?.phaseEndsAt || 0) - Date.now() - serverOffsetRef.current) / 1000);
        const submit = (value: number) => {
            if (!answering || answered || session.spectator) return;
            setPendingStage(stage);
            send({ action: 'answer', stage, value });
        };
        return (
            <div className={styles.game}>
                {interruption && <div className={styles.connectionNotice} role="status">{interruption}</div>}
                <div className={styles.liveHud}>
                    <span>{phase !== 'playing' ? status : state?.suddenDeath ? (isFr ? 'EGALITE · DEPARTAGE' : 'TIEBREAK') : `${stage} / ${state?.totalStages || 3}`}</span>
                    <strong>{phase === 'playing' ? `${remaining.toFixed(1)} s` : '--'}</strong>
                </div>
                <div className={styles.raceScore}>
                    <div><span>{isFr ? 'TOI' : 'YOU'}</span><strong>{state?.scores?.[session.userId] || 0}</strong></div>
                    <span>VS</span>
                    <div><span>{isFr ? 'RIVAL' : 'RIVAL'}</span><strong>{state?.scores?.[rivalId] || 0}</strong></div>
                </div>
                {gameId === 'cupshuffle' ? (
                    <div className={styles.cupTable} data-testid="cup-table" data-phase={state?.challengePhase}>
                        {[0, 1, 2].map((id) => {
                            const slot = (state?.order || [0, 1, 2]).indexOf(id);
                            return <button type="button" key={id} className={styles.cup}
                                style={{ transform: `translateX(${slot * 100}%)`, transitionDuration: `${state?.swapDuration || 500}ms` }}
                                aria-label={`${isFr ? 'Gobelet' : 'Cup'} ${slot + 1}`}
                                disabled={!answering || answered || session.spectator} onClick={() => submit(slot)}>
                                <span className={styles.cupShell} />
                                {state?.tokenCup === id && <i className={styles.cupToken} />}
                            </button>;
                        })}
                    </div>
                ) : (
                    <>
                        <div className={styles.equation} data-testid="numeric-equation">{state?.question?.label || '…'}</div>
                        <div className={styles.answerGrid} data-testid="numeric-answers">
                            {!state?.question && [0, 1, 2, 3].map((slot) => <button type="button" key={`waiting-${slot}`} disabled>--</button>)}
                            {(state?.question?.options || []).map((value) => <button type="button" key={value}
                                disabled={!answering || answered || session.spectator} onClick={() => submit(value)}>{value}</button>)}
                        </div>
                    </>
                )}
                <div className={styles.roundFeedback} role="status" data-correct={feedback ? String(Boolean(state?.feedback?.[session.userId])) : undefined}>
                    {phase !== 'playing' ? status : feedback
                        ? state?.feedback?.[session.userId] ? (isFr ? 'BIEN JOUE !' : 'NAILED IT!') : (isFr ? 'RATE. PROCHAINE CHANCE.' : 'MISSED. NEXT CHANCE.')
                        : answered ? (isFr ? 'REPONSE VERROUILLEE' : 'ANSWER LOCKED')
                            : state?.challengePhase === 'reveal' ? (isFr ? 'REPERE LE JETON' : 'FIND THE TOKEN')
                                : state?.challengePhase === 'shuffle' ? (isFr ? 'GARDE LE FIL' : 'KEEP TRACK')
                                    : (isFr ? 'A TOI DE JOUER' : 'YOUR MOVE')}
                </div>
                {!session.spectator && <button type="button" className={styles.forfeitButton} onClick={forfeit}>{isFr ? 'Abandonner la manche' : 'Forfeit round'}</button>}
            </div>
        );
    }

    if (gameId === 'symbolrush') {
        const revealing = Boolean(state?.sequence?.length);
        const myProgress = state?.progress?.[session.userId] || 0;
        const rivalProgress = state?.progress?.[rivalId] || 0;
        const length = state?.sequenceLength || 1;
        const ability = state?.abilities?.[session.userId];
        const shieldArmed = Boolean(state?.shieldArmed?.[session.userId]);
        const jammed = (state?.jammedUntil?.[session.userId] || 0) > Date.now() + serverOffsetRef.current;
        return (
            <div className={styles.game}>
                {interruption && <div className={styles.connectionNotice} role="status">{interruption}</div>}
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
                    {(state?.palettes?.[session.userId] || SYMBOLS).map((symbol) => (
                        <button
                            type="button"
                            key={symbol}
                            disabled={session.spectator || phase !== 'playing' || revealing || jammed}
                            onClick={() => send({ action: 'answer', symbol })}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
                <div className={styles.powerBar}>
                    <button
                        type="button"
                        data-testid="symbol-shield"
                        disabled={session.spectator || phase !== 'playing' || revealing || shieldArmed || !ability?.shield}
                        onClick={() => send({ action: 'power', power: 'shield' })}
                    >
                        {shieldArmed ? 'SHIELD ARMED' : `SHIELD ×${ability?.shield || 0}`}
                    </button>
                    <button
                        type="button"
                        data-testid="symbol-jam"
                        disabled={session.spectator || phase !== 'playing' || revealing || !ability?.jam}
                        onClick={() => send({ action: 'power', power: 'jam' })}
                    >
                        JAM ×{ability?.jam || 0}
                    </button>
                    <span>COMBO {state?.combos?.[session.userId] || 0}</span>
                </div>
                {!session.spectator && <button type="button" className={styles.forfeitButton} onClick={forfeit}>{isFr ? 'Abandonner la manche' : 'Forfeit round'}</button>}
                <p>
                    {jammed
                        ? (isFr ? 'BROUILLAGE ADVERSE' : 'RIVAL JAM ACTIVE')
                        : (isFr ? 'Shield absorbe une erreur. Un combo de 3 recharge Jam.' : 'Shield blocks one error. A 3-hit combo recharges Jam.')}
                </p>
            </div>
        );
    }

    if (gameId === 'bombpass') {
        const holding = state?.holderId === session.userId;
        const fuse = Math.max(0, ((state?.fuseEndsAt || Date.now()) - Date.now() - serverOffsetRef.current) / 1000);
        const ability = state?.abilities?.[session.userId];
        return (
            <div className={styles.game}>
                {interruption && <div className={styles.connectionNotice} role="status">{interruption}</div>}
                <div className={styles.liveHud}>
                    <span>{holding ? (isFr ? 'TU AS LA BOMBE' : 'YOU HOLD THE BOMB') : (isFr ? 'CHEZ LE RIVAL' : 'RIVAL HOLDS IT')}</span>
                    <span>PASSES <strong data-testid="bomb-passes">{state?.passes || 0}</strong></span>
                </div>
                <div className={`${styles.bombCore} ${fuse < 2.5 ? styles.bombCritical : ''}`}>
                    <span className={styles.bombOrb}><b>{fuse.toFixed(1)}</b></span>
                    <i style={{ width: `${Math.min(100, fuse / 8 * 100)}%` }} />
                </div>
                <button
                    type="button"
                    className={styles.bombTrack}
                    data-testid="bomb-track"
                    aria-label={isFr ? 'Passer la bombe' : 'Pass the bomb'}
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
                {!session.spectator && <button type="button" className={styles.forfeitButton} onClick={forfeit}>{isFr ? 'Abandonner la manche' : 'Forfeit round'}</button>}
                <p>{isFr ? 'Passe dans la zone sûre. Feinte une fois, bouclier automatique une fois.' : 'Pass in the safe zone. One feint, one automatic shield.'}</p>
            </div>
        );
    }

    return (
        <div className={styles.game}>
            {interruption && <div className={styles.connectionNotice} role="status">{interruption}</div>}
            <div className={styles.liveHud}>
                <span>{status}</span>
                <span>RALLY <strong data-testid="shared-bounce-rally">{state?.rally || 0}</strong></span>
            </div>
            <canvas
                ref={canvasRef}
                className={styles.bounceCanvas}
                data-testid="bounce-canvas"
                tabIndex={0}
                aria-label={isFr ? 'Terrain Bounce Panic' : 'Bounce Panic field'}
                onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
                    event.preventDefault();
                    const current = stateRef.current?.paddles?.[session.userId] ?? .5;
                    const delta = (event.key === 'ArrowLeft' ? -.07 : .07) * (isChallenger ? 1 : -1);
                    send({ action: 'move', x: Math.max(.07, Math.min(.93, current + delta)) });
                }}
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
            {!session.spectator && <button type="button" className={styles.forfeitButton} onClick={forfeit}>{isFr ? 'Abandonner la manche' : 'Forfeit round'}</button>}
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
        const openingGraceMs = 3200;
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
            const width = Math.max(1, rect.width);
            const height = Math.max(1, rect.height);
            drawingCanvas.width = Math.round(width * ratio);
            drawingCanvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            if (!state.width) {
                state.x = width * .5;
                state.y = height * .5;
                const launchSpeed = 245 + Math.min(90, round * 18);
                state.vx = launchSpeed * .16;
                state.vy = -launchSpeed * .78;
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
            if (survival >= 45) {
                stopped = true;
                finish(Math.min(1000, state.rally * 55 + 200), `${state.rally} ${isFr ? 'retours' : 'returns'} · 45s`);
                return;
            }
            const obstacleY = state.height * .37;
            const obstacleWidth = Math.max(76, state.width * Math.max(.14, .25 - round * .018));
            const obstacleX = state.width / 2
                + Math.sin(survival * (1.15 + round * .16)) * state.width * .27;
            const obstacleActive = survival >= 8;

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
                obstacleActive
                &&
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
                } else if (now - started < openingGraceMs) {
                    // Give touch players one readable opening exchange before a miss can end the round.
                    const recoverySpeed = Math.max(255, Math.hypot(state.vx, state.vy));
                    const recoveryDirection = Math.sign(paddleX - state.x || state.vx || 1);
                    state.y = paddleY - ballRadius;
                    state.vx = recoveryDirection * recoverySpeed * .42;
                    state.vy = -recoverySpeed * .9;
                    state.rally += 1;
                    setRally(state.rally);
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

            if (obstacleActive) {
                context.fillStyle = '#ef476f';
                context.fillRect(obstacleX - obstacleWidth / 2, obstacleY, obstacleWidth, 9);
            }
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
    const deadline = useRef(0);

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
        deadline.current = performance.now() + 10000;
        const timer = window.setInterval(() => setTime(Math.max(0, (deadline.current - performance.now()) / 1000)), 50);
        return () => window.clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        if (time <= 0) finish(input.length * 120, `${input.length}/${sequence.length} ${isFr ? 'symboles' : 'symbols'}`);
    }, [finish, input.length, isFr, sequence.length, time]);

    function choose(symbol: string) {
        if (phase !== 'input' || performance.now() >= deadline.current) return;
        const index = input.length;
        if (symbol !== sequence[index]) {
            setErrors((value) => value + 1);
            deadline.current -= 1200;
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
    const [view, setView] = useState({ marker: 0, passes: 0, fuse: 8, perfects: 0, center: 50 });
    const run = useRef({ started: 0, deadline: 0, passes: 0, perfects: 0, center: 50, lastTap: 0, done: false });
    const markerAt = (now: number) => {
        const wave = ((now - run.current.started) / 1000 * (85 + run.current.passes * 7)) % 200;
        return wave <= 100 ? wave : 200 - wave;
    };
    useEffect(() => {
        const current = run.current;
        current.started = performance.now();
        current.deadline = current.started + 8500 - round * 450;
        let frame = 0;
        const tick = (now: number) => {
            if (current.done) return;
            const fuse = Math.max(0, (current.deadline - now) / 1000);
            setView({ marker: markerAt(now), passes: current.passes, fuse, perfects: current.perfects, center: current.center });
            if (!fuse) {
                current.done = true;
                finish(current.passes * 90 + current.perfects * 15, `${current.passes} passes · BOOM`);
                return;
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [finish, round]);

    function pass() {
        const current = run.current;
        const now = performance.now();
        if (current.done || now >= current.deadline || now - current.lastTap < 180) return;
        current.lastTap = now;
        const distance = Math.abs(markerAt(now) - current.center);
        if (distance > Math.max(11, 27 - current.passes * 2.4) / 2) {
            current.done = true;
            finish(current.passes * 90 + current.perfects * 15, isFr ? 'Hors zone !' : 'Outside the zone!');
            return;
        }
        if (distance < 4) current.perfects++;
        current.passes++;
        current.deadline = Math.min(now + 9000, current.deadline + 720);
        current.center = 22 + Math.random() * 56;
        navigator.vibrate?.(20);
        if (current.passes >= 8 + round) {
            current.done = true;
            finish(850 + current.perfects * 15, `${current.passes} passes · ${current.perfects} perfect`);
        }
    }

    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>PASSES <strong data-testid="bomb-passes">{view.passes}</strong></span><span>PERFECT <strong>{view.perfects}</strong></span></div>
            <div className={`${styles.bombCore} ${view.fuse < 2.5 ? styles.bombCritical : ''}`}>
                <span className={styles.bombOrb}><b>{view.fuse.toFixed(1)}</b></span>
                <i style={{ width: `${Math.max(0, view.fuse / 8.5) * 100}%` }} />
            </div>
            <button type="button" className={styles.bombTrack} data-testid="bomb-track" onClick={pass} disabled={performance.now() - run.current.lastTap < 180} aria-label={isFr ? 'Passer la bombe' : 'Pass the bomb'}>
                <span className={styles.safeZone} style={{ left: `${view.center - Math.max(11, 27 - view.passes * 2.4) / 2}%`, width: `${Math.max(11, 27 - view.passes * 2.4)}%` }} />
                <i style={{ left: `${view.marker}%` }} />
            </button>
            <p>{isFr ? 'Dans la zone : passe. Au centre : perfect.' : 'Inside: pass. Dead center: perfect.'}</p>
        </div>
    );
}

function CupRound({ round, isFr, finish }: RoundProps) {
    const [stage, setStage] = useState(1);
    const [phase, setPhase] = useState<'reveal' | 'shuffle' | 'choose' | 'feedback'>('reveal');
    const [order, setOrder] = useState([0, 1, 2]);
    const [step, setStep] = useState(0);
    const [correct, setCorrect] = useState(false);
    const score = useRef(0);
    const hits = useRef(0);
    const locked = useRef(false);
    const deadline = useRef(0);
    const tokenCup = useMemo(() => Math.floor(Math.random() * 3), [stage]);
    const swaps = useMemo(() => makeSwaps(3 + round + stage), [round, stage]);
    const duration = Math.max(320, 650 - round * 40 - stage * 50);

    useEffect(() => {
        if (phase === 'reveal') {
            const timer = window.setTimeout(() => setPhase('shuffle'), 1400);
            return () => window.clearTimeout(timer);
        }
        if (phase === 'shuffle') {
            const timer = window.setTimeout(() => {
                if (step >= swaps.length) {
                    deadline.current = performance.now() + 5000;
                    locked.current = false;
                    setPhase('choose');
                    return;
                }
                const [a, b] = swaps[step];
                setOrder((current) => {
                    const next = [...current];
                    [next[a], next[b]] = [next[b], next[a]];
                    return next;
                });
                setStep((value) => value + 1);
            }, duration + 100);
            return () => window.clearTimeout(timer);
        }
        if (phase === 'choose') {
            const timer = window.setTimeout(() => {
                locked.current = true;
                setCorrect(false);
                setPhase('feedback');
            }, Math.max(0, deadline.current - performance.now()));
            return () => window.clearTimeout(timer);
        }
        const timer = window.setTimeout(() => {
            if (stage === 3) {
                finish(score.current, `${hits.current}/3 · ${isFr ? 'gobelets retrouves' : 'cups found'}`);
            } else {
                setStage((value) => value + 1);
                setStep(0);
                setOrder([0, 1, 2]);
                setPhase('reveal');
            }
        }, 1100);
        return () => window.clearTimeout(timer);
    }, [phase, step, swaps, duration, stage, finish, isFr]);

    function choose(slot: number) {
        if (phase !== 'choose' || locked.current || performance.now() >= deadline.current) return;
        locked.current = true;
        const won = order[slot] === tokenCup;
        if (won) {
            hits.current++;
            score.current += Math.round(260 + Math.max(0, deadline.current - performance.now()) / 70);
        }
        setCorrect(won);
        setPhase('feedback');
        navigator.vibrate?.(won ? 20 : 70);
    }
    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>{stage} / 3</span><span><strong>{hits.current}</strong> / 3</span></div>
            <div className={styles.cupTable} data-testid="cup-table" data-phase={phase}>
                {[0, 1, 2].map((id) => {
                    const slot = order.indexOf(id);
                    return <button type="button" key={id} className={styles.cup}
                        style={{ transform: `translateX(${slot * 100}%)`, transitionDuration: `${duration}ms` }}
                        disabled={phase !== 'choose'} aria-label={`${isFr ? 'Gobelet' : 'Cup'} ${slot + 1}`} onClick={() => choose(slot)}>
                        <span className={styles.cupShell} />
                        {(phase === 'reveal' || phase === 'feedback') && id === tokenCup && <i className={styles.cupToken} />}
                    </button>;
                })}
            </div>
            <div className={styles.roundFeedback} role="status" data-correct={phase === 'feedback' ? String(correct) : undefined}>
                {phase === 'feedback' ? correct ? (isFr ? 'BIEN VU !' : 'GOOD EYE!') : (isFr ? 'PERDU DE VUE' : 'LOST TRACK')
                    : phase === 'reveal' ? (isFr ? 'REPERE LE JETON' : 'FIND THE TOKEN')
                        : phase === 'shuffle' ? (isFr ? 'GARDE LE FIL' : 'KEEP TRACK') : (isFr ? 'OU EST LE JETON ?' : 'WHERE IS THE TOKEN?')}
            </div>
        </div>
    );
}

function NumericRound({ round, isFr, finish }: RoundProps) {
    const questions = useMemo(() => Array.from({ length: 5 }, () => makeQuestion(round)), [round]);
    const [index, setIndex] = useState(0);
    const [time, setTime] = useState(6);
    const [feedback, setFeedback] = useState<boolean | null>(null);
    const score = useRef(0);
    const hits = useRef(0);
    const locked = useRef(false);
    const deadline = useRef(0);
    const question = questions[index];

    useEffect(() => {
        if (feedback !== null) {
            const timer = window.setTimeout(() => {
                if (index === 4) finish(score.current, `${hits.current}/5 · ${isFr ? 'bonnes reponses' : 'correct answers'}`);
                else { setIndex((value) => value + 1); setFeedback(null); }
            }, 850);
            return () => window.clearTimeout(timer);
        }
        locked.current = false;
        deadline.current = performance.now() + 6000;
        setTime(6);
        const timer = window.setInterval(() => {
            const remaining = Math.max(0, (deadline.current - performance.now()) / 1000);
            setTime(remaining);
            if (!remaining) { locked.current = true; setFeedback(false); }
        }, 50);
        return () => window.clearInterval(timer);
    }, [feedback, index, finish, isFr]);

    function answer(value: number) {
        if (locked.current || performance.now() >= deadline.current) return;
        locked.current = true;
        const correct = value === question.answer;
        if (correct) {
            hits.current++;
            score.current += Math.round(180 + Math.max(0, deadline.current - performance.now()) / 300);
        }
        setFeedback(correct);
        navigator.vibrate?.(correct ? 15 : 60);
    }
    return (
        <div className={styles.game}>
            <div className={styles.liveHud}><span>{index + 1} / 5</span><span><strong>{time.toFixed(1)} s</strong></span></div>
            <div className={styles.equation} data-testid="numeric-equation" data-question={index}>{question.label}</div>
            <div className={styles.answerGrid} data-testid="numeric-answers">
                {question.options.map((option) => <button type="button" key={option} disabled={feedback !== null} onClick={() => answer(option)}>{option}</button>)}
            </div>
            <div className={styles.roundFeedback} role="status" data-correct={feedback === null ? undefined : String(feedback)}>
                {feedback === null ? (isFr ? 'UNE SEULE REPONSE' : 'ONE ANSWER ONLY')
                    : feedback ? (isFr ? 'BIEN JOUE !' : 'NAILED IT!') : `${isFr ? 'LA REPONSE' : 'THE ANSWER'} : ${question.answer}`}
            </div>
        </div>
    );
}

function gameRule(gameId: CompetitiveGameId, isFr: boolean) {
    if (isPartyGame(gameId)) { const game = getCompetitiveGame(gameId)!; return isFr ? game.ruleFr : game.ruleEn; }
    const rules = {
        bounce: ['Deplace ton paddle et garde la balle en vie. Une erreur termine la manche.', 'Move your paddle and keep the ball alive. One miss ends the round.'],
        symbolrush: ['Memorise la suite animee puis reconstruis-la avant la fin du chrono.', 'Memorize the animated sequence, then rebuild it before time runs out.'],
        bombpass: ['Enchaine les passes dans la zone sure avant l explosion.', 'Chain passes through the safe zone before the explosion.'],
        cupshuffle: ['Trois melanges de plus en plus rapides. Retrouve le jeton : une seule reponse par passage.', 'Three increasingly fast shuffles. Find the token: one answer per shuffle.'],
        duelnumeric: ['Cinq questions, six secondes chacune. Une seule reponse : vise juste, puis vise vite.', 'Five questions, six seconds each. One answer: accuracy first, then speed.'],
    } as const;
    return rules[gameId as keyof typeof rules][isFr ? 0 : 1];
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
