import { useEffect, useRef, useState } from 'react';
import { Flag, LockKeyhole, RotateCcw, Square, Timer, Zap, Check } from 'lucide-react';
import { getRealtimeUrl } from '../../api/realtime';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { interpolateTower, paintTower, type PartyState } from '../../gameplay/party';
import styles from './PartyArena.module.css';
import { Chroma } from './Chroma';
import { Ricochet } from './Ricochet';
import { Contrepied } from './Contrepied';
import { Garde } from './Garde';
import { Mat } from './Mat';
import { Drawing } from './Drawing';
import type { Point } from '../../gameplay/party';

interface Props {
    gameId: string;
    round: number;
    isFr: boolean;
    session?: { userId: string; challengerId: string; duelId: string; spectator?: boolean };
    finish: (score: number, detail: string, authoritative?: boolean) => void;
}
interface ArenaEvent {
    type: string; duelId: string; round: number; phase: string; at: number;
    resumeAt: number; disconnectDeadline: number; party: PartyState; winnerId: string | null;
}

export function PartyArena({ gameId, round, isFr, session, finish }: Props) {
    const userId = useGameStore((s) => s.userId) || '';
    const identity = session?.userId || userId;
    const practiceId = useRef(crypto.randomUUID());
    const duelId = session?.duelId || `practice:${identity}:${practiceId.current}`;
    const socket = useRef<WebSocket | null>(null);
    const latest = useRef<ArenaEvent | null>(null);
    const receivedAt = useRef(0);
    const finishRef = useRef(finish);
    finishRef.current = finish;
    const [event, setEvent] = useState<ArenaEvent | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [clock, setClock] = useState(Date.now());
    const offset = useRef(0);
    const canvas = useRef<HTMLCanvasElement>(null);
    const completed = useRef(false);
    const { playDraw, playFalseStart } = useSfx();
    const soundTurn = useRef('');

    useEffect(() => {
        if (!identity) return;
        let stopped = false;
        let retry = 0;
        let attempts = 0;
        const connect = () => {
            const ws = new WebSocket(getRealtimeUrl(identity));
            socket.current = ws;
            ws.onopen = () => {
                setConnected(true); setError(''); attempts = 0;
                ws.send(JSON.stringify(session
                    ? { type: session.spectator ? 'arena.watch' : 'arena.join', duelId, round }
                    : { type: 'party.practice', practiceId: practiceId.current, gameId }));
            };
            ws.onmessage = (message) => {
                let data;
                try { data = JSON.parse(String(message.data)); } catch { return; }
                if (data?.type === 'arena.error') { setError(isFr ? 'Manche indisponible. Reviens au duel.' : 'Round unavailable. Return to the duel.'); return; }
                if (data?.type !== 'arena.state' || data.duelId !== duelId || !data.party || (session && data.round !== round)) return;
                offset.current = data.at - Date.now();
                latest.current = data;
                receivedAt.current = performance.now();
                setEvent(data);
                if (data.phase === 'done' && !completed.current) {
                    completed.current = true;
                    const party: PartyState = data.party;
                    const raw = party.scores[identity] || 0;
                    const score = session ? (data.winnerId === identity ? 1000 : 0)
                        : gameId === 'mat' ? party.mat?.results?.[identity]?.mate ? 500 + raw / 40 : 0
                        : gameId === 'garde' ? party.garde?.winnerId === identity ? 1000 : party.garde?.winnerId === null ? 500 : 0
                        : ['trace','decoupe'].includes(gameId) ? raw / 3
                        : gameId === 'contrepied' ? raw * 1000 / 15
                        : gameId === 'ricochet' ? raw / 10
                        : gameId === 'chroma' ? Math.max(0, 1000 + raw / (3 * 255 * Math.sqrt(3)))
                        : gameId === 'onesecond' ? Math.max(0, 1000 + raw / 3)
                            : gameId === 'onemore' ? raw * 50 : raw * 1000 / 3;
                    const matResult = party.mat?.results?.[identity];
                    const detail = gameId === 'mat' ? matResult?.mate ? `MAT · ${((matResult.ms || 0)/1000).toFixed(2)} s` : matResult?.expired ? (isFr?'Temps ecoule':'Time up') : (isFr?'Pas de mat':'Not checkmate') : gameId === 'contrepied' ? `${raw} / 15 ${isFr ? 'points remportes' : 'points won'}${!session ? ` · ${isFr ? 'bot' : 'bot'} ${party.contrepied?.botScore || 0}` : ''}` : gameId === 'ricochet' ? raw ? `${((10000-raw)/10).toFixed(1)} ${isFr ? 'du centre' : 'from center'}` : (isFr ? 'Aucun palet restant' : 'No remaining puck') : gameId === 'chroma' ? `${(Math.abs(raw)/1000).toFixed(1)} ${isFr ? 'de distance RVB cumulee' : 'total RGB distance'}` : gameId === 'onesecond' ? `${Math.abs(raw)} ms ${isFr ? "d'ecart cumule" : 'total error'}`
                        : gameId === 'onemore' ? `${raw} ${isFr ? 'blocs securises' : 'blocks banked'}` : `${raw} ${isFr ? 'points' : 'points'}`;
                    finishRef.current(score, gameId === 'garde' ? `${raw} ${isFr?'PV':'HP'} · ${!session ? `BOT ${party.garde?.hp[party.garde.botId||'']||0} ${isFr?'PV':'HP'}` : `${isFr?'TOUR':'TURN'} ${party.attempt}`}` : ['trace','decoupe'].includes(gameId) ? `${(raw/30).toFixed(1)}% ${isFr ? 'score moyen' : 'average score'}` : detail, Boolean(session));
                }
            };
            ws.onclose = () => {
                setConnected(false);
                if (!stopped && !completed.current) retry = window.setTimeout(connect, Math.min(5000, 400 * 2 ** attempts++));
            };
        };
        connect();
        const timer = window.setInterval(() => setClock(Date.now()), 100);
        return () => { stopped = true; clearTimeout(retry); clearInterval(timer); socket.current?.close(); };
    }, [identity, duelId, gameId, round, session?.spectator, Boolean(session), isFr]);

    const party = event?.party;
    const rival = Object.keys(party?.scores || {}).find((id) => id !== identity);
    const active = connected && event?.phase === 'playing' && !session?.spectator && !error;
    const run = party?.runs[identity];
    const submitted = party?.answered.includes(identity);
    const revealing = party?.phase === 'reveal';

    function send(action: string, data?: { move:string } | { rgb: number[] } | { angle: number; power: number } | { card: number } | {points:Point[];side?:number}) {
        const ws = socket.current;
        if (!active || !ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'arena.action', action, turn: latest.current?.party.turn, ...data }));
    }
    function stopClock() {
        if (!active || submitted || party?.phase !== 'timing') return;
        send('stop');
    }
    useEffect(() => {
        const blur = () => {
            if (gameId !== 'onesecond' || latest.current?.party.phase !== 'timing' || session?.spectator) return;
            if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: 'arena.action', action: 'cancel', turn: latest.current.party.turn }));
        };
        const visibility = () => { if (document.hidden) blur(); };
        window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
        return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
    }, [gameId, session?.spectator]);
    useEffect(() => {
        if (!party) return;
        const cue = `${party.turn}:${party.phase}`;
        if (cue === soundTurn.current) return;
        soundTurn.current = cue;
        if (party.phase === 'go' || party.phase === 'timing' || party.phase === 'flight' || party.phase === 'drawpath' || party.phase === 'solve') playDraw();
        if (['mat','garde','trace','decoupe','contrepied'].includes(gameId) && party.phase === 'reveal') playDraw();
        if (party.phase === 'reveal' && party.feedback.falseStart) playFalseStart();
    }, [party?.turn, party?.phase, playDraw, playFalseStart]);
    useEffect(() => {
        if (gameId !== 'onemore' || !canvas.current) return;
        const surface = canvas.current;
        const resize = () => {
            const ratio = Math.min(2, devicePixelRatio || 1);
            const rect = surface.getBoundingClientRect();
            surface.width = Math.max(1, Math.round(rect.width * ratio));
            surface.height = Math.max(1, Math.round(rect.height * ratio));
        };
        let frame = 0;
        const draw = (now: number) => {
            const state = latest.current;
            const ctx = surface.getContext('2d');
            const elapsed = state?.phase === 'playing' ? now - receivedAt.current : 0;
            if (ctx) paintTower(ctx, interpolateTower(state?.party.runs[identity], elapsed), surface.width, surface.height);
            frame = requestAnimationFrame(draw);
        };
        resize(); frame = requestAnimationFrame(draw);
        const observer = new ResizeObserver(resize); observer.observe(surface);
        return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }, [gameId, identity]);

    const status = error || (!connected ? (isFr ? 'Connexion en cours…' : 'Connecting…')
        : event?.phase === 'waiting' ? (isFr ? 'En attente du rival' : 'Waiting for your rival')
            : event?.phase === 'countdown' ? `${Math.max(1, Math.ceil(((event.resumeAt || 0) - clock - offset.current) / 1000))}` : '');
    const feedback = party?.feedback;
    const preparing = party?.phase === 'prepare';
    const targetSeconds = (party?.targetMs || 0) / 1000;
    const attemptIndex = Math.max(0, (party?.attempt || 1) - 1);
    const duration = run?.durations?.[attemptIndex];
    const delta = duration == null ? null : duration - (party?.targetMs || 0);
    return <div className={styles.arena} data-testid="party-arena" data-game={gameId} data-phase={party?.phase || 'ready'}>
        <div className={styles.hud}>
            <span>{session ? (isFr ? 'FACE A FACE' : 'HEAD TO HEAD') : 'SOLO'}</span>
            <strong>{gameId === 'mat' ? '1 POSITION' : gameId === 'onemore' ? `${Math.ceil((party?.remaining || 30000) / 1000)} s` : `${party?.attempt || 1} / ${gameId === 'garde' ? '8 MAX' : gameId === 'contrepied' ? '5' : ['trace','decoupe','onesecond','chroma','ricochet'].includes(gameId) ? '3' : '7 MAX'}`}</strong>
        </div>
        {!['mat','garde','ricochet','contrepied'].includes(gameId) && <div className={styles.score}>
            <span>{isFr ? 'TOI' : 'YOU'} <b>{gameId === 'chroma' ? (Math.abs(party?.scores[identity] || 0)/1000).toFixed(1) : Math.abs(party?.scores[identity] || 0)}{gameId === 'onesecond' ? ' ms' : gameId === 'chroma' ? ' RGB' : ''}</b></span>
            {rival && <><i>VS</i><span>RIVAL <b>{gameId === 'chroma' ? (Math.abs(party?.scores[rival] || 0)/1000).toFixed(1) : Math.abs(party?.scores[rival] || 0)}{gameId === 'onesecond' ? ' ms' : gameId === 'chroma' ? ' RGB' : ''}</b></span></>}
        </div>}
        {status && <div className={event?.phase === 'countdown' || event?.phase === 'waiting' ? styles.countIn : styles.notice} role="status"><span>{event?.phase === 'countdown' ? (isFr ? 'ENTREE DANS L ARENE' : 'ENTERING THE ARENA') : ''}</span><strong key={status}>{status}</strong></div>}
        {gameId === 'mat' && party && party.phase !== 'draw' && <Mat key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send}/>}
        {party?.phase === 'draw' ? <div className={styles.draw}>
            <h3>{isFr ? 'Egalite parfaite.' : 'An exact tie.'}</h3>
            <button type="button" disabled={!active || party.ready.includes(identity)} onClick={() => send('retry')}><RotateCcw size={18} />{party.ready.includes(identity) ? (isFr ? 'En attente du rival' : 'Waiting for rival') : (isFr ? 'Rejouer la manche' : 'Replay this round')}</button>
        </div> : gameId === 'garde' ? party && <Garde key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send}/> : ['trace','decoupe'].includes(gameId) ? party && <Drawing key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send} /> : gameId === 'contrepied' ? party && <Contrepied key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send} /> : gameId === 'ricochet' ? party && <Ricochet key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send} /> : gameId === 'chroma' ? party && <Chroma key={party.turn} party={party} identity={identity} active={active} isFr={isFr} send={send} /> : gameId === 'falsestart' ? <>
            <button type="button" className={styles.signal} data-signal={party?.signal || 'wait'} data-testid="signal-button"
                disabled={!active || revealing || party?.phase === 'ready'} onClick={() => send('hit')}>
                <Zap size={42} />
                <strong>{revealing ? feedback?.falseStart ? (isFr ? 'TROP TOT' : 'TOO EARLY') : feedback?.timeout ? '…' : `${feedback?.reaction} ms`
                    : party?.signal === 'go' ? 'GO' : party?.signal === 'trap' ? 'NOPE' : isFr ? 'ATTENDS' : 'WAIT'}</strong>
            </button>
            <button className={styles.secondary} type="button" disabled={!active || !rival || !party?.feints[identity] || party.phase !== 'wait'} onClick={() => send('feint')}><Zap size={16} />{isFr ? 'Feinter' : 'Feint'} <span>{party?.feints[identity] ?? 1}/1</span></button>
        </> : gameId === 'onesecond' ? <>
            <div className={styles.target}><span>{isFr ? 'CIBLE' : 'TARGET'}</span><strong data-testid="clock-target" data-ms={party?.targetMs || 0}>{targetSeconds || '–'}<small> s</small></strong><span>{isFr ? 'ERREUR TOTALE MINIMALE' : 'LOWEST TOTAL ERROR'}</span></div>
            <button type="button" className={styles.clockButton} data-state={party?.phase} data-testid="clock-button" disabled={!active || party?.phase !== 'timing' || submitted}
                onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); stopClock(); }}
                onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); stopClock(); } }}
                onClick={(e) => { if (e.detail === 0) stopClock(); }} aria-label={isFr ? 'Arreter le chrono' : 'Stop the clock'}>
                {submitted || revealing ? <Check size={28} /> : preparing ? <Timer size={28} /> : <Square size={28} />}
                <strong>{preparing ? Math.max(1, Math.ceil((party?.remaining || 0) / 1000)) : revealing ? duration == null ? '—' : `${(duration / 1000).toFixed(3)} s` : submitted ? (isFr ? 'VERROUILLE' : 'LOCKED') : party?.clockSignal ? (isFr ? 'TOP CHRONO' : 'GO!') : 'STOP'}</strong>
                <span>{preparing ? (isFr ? 'PRET ?' : 'READY?') : revealing ? delta === null ? (isFr ? 'ESSAI MANQUE' : 'MISSED ATTEMPT') : `${delta > 0 ? '+' : ''}${delta} ms` : submitted ? (isFr ? 'AU RIVAL' : 'RIVAL IS PLAYING') : party?.phase === 'timing' ? (isFr ? 'A TOI DE JUGER' : 'TRUST YOUR TIMING') : '3 · 2 · 1'}</span>
            </button>
            <div className={styles.attempts} aria-live="polite">
                {[0, 1, 2].map((i) => <span key={i} data-current={i === attemptIndex}>{party?.targets?.[i] ? `${party.targets[i] / 1000} s` : `0${i + 1}`}<b>{run?.durations?.[i] === null ? '--' : run?.errors?.[i] !== undefined ? `${run.errors[i]} ms` : '·'}</b></span>)}
            </div>
        </> : gameId === 'mat' ? null : <>
            <button type="button" className={styles.stackSurface} disabled={!active || run?.status !== 'playing' || (run.motion?.ageMs || 0) < 180} onClick={() => send('drop')} aria-label={isFr ? 'Poser le bloc' : 'Drop block'}>
                <canvas ref={canvas} data-testid="stack-canvas" data-level={run?.level || 0} />
            </button>
            <div className={styles.stackFooter}>
                <span>{run?.level || 0} {isFr ? 'BLOCS' : 'BLOCKS'}{rival ? ` · ${isFr ? 'RIVAL' : 'RIVAL'} ${party?.runs[rival]?.level || 0}` : ''}</span>
                <button type="button" disabled={!active || !run?.level || run.status !== 'playing'} onClick={() => send('bank')}><LockKeyhole size={17} />{isFr ? 'Securiser' : 'Bank tower'}</button>
            </div>
        </>}
        <div className={styles.feedback} role="status">{revealing && gameId === 'falsestart'
            ? feedback?.timeout ? (isFr ? 'Personne n a appuye.' : 'Nobody tapped.') : feedback?.falseStart ? feedback.actor === identity ? (isFr ? 'Trop tot. Le rival prend le point.' : 'Too early. Your rival takes the point.') : (isFr ? 'Le rival a craque. Ton point.' : 'Your rival jumped. Your point.') : feedback?.actor === identity ? (isFr ? 'Le point est pour toi.' : 'You take the point.') : (isFr ? 'Le rival a ete plus rapide.' : 'Your rival was faster.')
            : gameId === 'onemore' && run?.status === 'crashed' ? (isFr ? 'Tour perdue. Le rival peut encore chuter.' : 'Tower lost. Your rival can still fall.') : gameId === 'onemore' && run?.status === 'banked' ? (isFr ? 'Tour securisee. Au rival de tenter.' : 'Tower banked. Your rival decides.') : ''}</div>
        {session && !session.spectator && <button type="button" className={styles.forfeit} onClick={() => {
            if (confirm(isFr ? 'Abandonner cette manche ?' : 'Forfeit this round?')) socket.current?.send(JSON.stringify({ type: 'arena.forfeit' }));
        }}><Flag size={14} />{isFr ? 'Abandonner' : 'Forfeit'}</button>}
    </div>;
}
