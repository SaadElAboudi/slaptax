import { useEffect, useRef, useState } from 'react';
import { Flag, Hand, LockKeyhole, RotateCcw, Zap } from 'lucide-react';
import { getRealtimeUrl } from '../../api/realtime';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { paintTower, type PartyState } from '../../gameplay/party';
import styles from './PartyArena.module.css';

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
    const finishRef = useRef(finish);
    finishRef.current = finish;
    const [event, setEvent] = useState<ArenaEvent | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const [clock, setClock] = useState(Date.now());
    const offset = useRef(0);
    const held = useRef(false);
    const [pressed, setPressed] = useState(false);
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
                setEvent(data);
                if (data.phase === 'done' && !completed.current) {
                    completed.current = true;
                    const party: PartyState = data.party;
                    const raw = party.scores[identity] || 0;
                    const score = session ? (data.winnerId === identity ? 1000 : 0)
                        : gameId === 'onesecond' ? Math.max(0, 1000 + raw / 3)
                            : gameId === 'onemore' ? raw * 50 : raw * 333;
                    const detail = gameId === 'onesecond' ? `${Math.abs(raw)} ms ${isFr ? "d'ecart cumule" : 'total error'}`
                        : gameId === 'onemore' ? `${raw} ${isFr ? 'blocs securises' : 'blocks banked'}` : `${raw} ${isFr ? 'points' : 'points'}`;
                    finishRef.current(score, detail, Boolean(session));
                }
            };
            ws.onclose = () => {
                setConnected(false); held.current = false; setPressed(false);
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

    function send(action: string) {
        const ws = socket.current;
        if (!active || !ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'arena.action', action, turn: latest.current?.party.turn }));
    }
    function press() {
        if (!active || submitted || held.current || party?.phase !== 'hold') return;
        held.current = true; setPressed(true); send('hold');
    }
    function release(cancel = false) {
        if (!held.current) return;
        held.current = false; setPressed(false); send(cancel ? 'cancel' : 'release');
    }
    useEffect(() => {
        const blur = () => {
            if (!held.current) return;
            held.current = false; setPressed(false);
            if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: 'arena.action', action: 'cancel', turn: latest.current?.party.turn }));
        };
        const visibility = () => { if (document.hidden) blur(); };
        window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
        return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
    }, []);
    useEffect(() => {
        if (!party) return;
        const cue = `${party.turn}:${party.phase}`;
        if (cue === soundTurn.current) return;
        soundTurn.current = cue;
        if (party.phase === 'go') playDraw();
        if (party.phase === 'reveal' && party.feedback.falseStart) playFalseStart();
    }, [party?.turn, party?.phase, playDraw, playFalseStart]);
    useEffect(() => {
        if (gameId !== 'onemore' || !canvas.current) return;
        const surface = canvas.current;
        const draw = () => {
            const ratio = Math.min(2, devicePixelRatio || 1);
            const rect = surface.getBoundingClientRect();
            surface.width = Math.max(1, Math.round(rect.width * ratio));
            surface.height = Math.max(1, Math.round(rect.height * ratio));
            const ctx = surface.getContext('2d');
            if (ctx) paintTower(ctx, run, surface.width, surface.height);
        };
        draw();
        const observer = new ResizeObserver(draw); observer.observe(surface);
        return () => observer.disconnect();
    }, [run, gameId]);

    const status = error || (!connected ? (isFr ? 'Connexion en cours…' : 'Connecting…')
        : event?.phase === 'waiting' ? (isFr ? 'En attente du rival' : 'Waiting for your rival')
            : event?.phase === 'countdown' ? `${Math.max(1, Math.ceil(((event.resumeAt || 0) - clock - offset.current) / 1000))}` : '');
    const feedback = party?.feedback;
    return <div className={styles.arena} data-testid="party-arena" data-game={gameId} data-phase={party?.phase || 'ready'}>
        <div className={styles.hud}>
            <span>{session ? (isFr ? 'FACE A FACE' : 'HEAD TO HEAD') : 'SOLO'}</span>
            <strong>{gameId === 'onemore' ? `${Math.ceil((party?.remaining || 30000) / 1000)} s` : `${party?.attempt || 1} / ${gameId === 'onesecond' ? '3' : '7 MAX'}`}</strong>
        </div>
        <div className={styles.score}>
            <span>{isFr ? 'TOI' : 'YOU'} <b>{Math.abs(party?.scores[identity] || 0)}{gameId === 'onesecond' ? ' ms' : ''}</b></span>
            {rival && <><i>VS</i><span>{isFr ? 'RIVAL' : 'RIVAL'} <b>{Math.abs(party?.scores[rival] || 0)}{gameId === 'onesecond' ? ' ms' : ''}</b></span></>}
        </div>
        {status && <div className={styles.notice} role="status">{status}</div>}
        {party?.phase === 'draw' ? <div className={styles.draw}>
            <h3>{isFr ? 'Egalite parfaite.' : 'An exact tie.'}</h3>
            <button type="button" disabled={!active || party.ready.includes(identity)} onClick={() => send('retry')}><RotateCcw size={18} />{party.ready.includes(identity) ? (isFr ? 'En attente du rival' : 'Waiting for rival') : (isFr ? 'Rejouer la manche' : 'Replay this round')}</button>
        </div> : gameId === 'falsestart' ? <>
            <button type="button" className={styles.signal} data-signal={party?.signal || 'wait'} data-testid="signal-button"
                disabled={!active || revealing || party?.phase === 'ready'} onClick={() => send('hit')}>
                <Zap size={42} />
                <strong>{revealing ? feedback?.falseStart ? (isFr ? 'TROP TOT' : 'TOO EARLY') : feedback?.timeout ? '…' : `${feedback?.reaction} ms`
                    : party?.signal === 'go' ? 'GO' : party?.signal === 'trap' ? 'NOPE' : isFr ? 'ATTENDS' : 'WAIT'}</strong>
            </button>
            <button className={styles.secondary} type="button" disabled={!active || !rival || !party?.feints[identity] || party.phase !== 'wait'} onClick={() => send('feint')}><Zap size={16} />{isFr ? 'Feinter' : 'Feint'} <span>{party?.feints[identity] ?? 1}/1</span></button>
        </> : gameId === 'onesecond' ? <>
            <button type="button" className={styles.hold} data-held={pressed} data-testid="hold-button" disabled={!active || revealing || submitted}
                onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); press(); }}
                onPointerUp={() => release()} onPointerCancel={() => release(true)} onLostPointerCapture={() => release(true)}
                onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } }} aria-label={isFr ? 'Maintenir une seconde' : 'Hold one second'}>
                <Hand size={38} /><strong>{submitted ? (isFr ? 'VERROUILLE' : 'LOCKED') : pressed ? '…' : '1.000 s'}</strong>
            </button>
            <div className={styles.attempts} aria-live="polite">
                {[0, 1, 2].map((i) => <span key={i}>{i + 1}<b>{run?.durations?.[i] === null ? '--' : run?.durations?.[i] !== undefined ? `${(run.durations[i]! / 1000).toFixed(3)} s` : '·'}</b></span>)}
            </div>
        </> : <>
            <button type="button" className={styles.stackSurface} disabled={!active || run?.status !== 'playing'} onClick={() => send('drop')} aria-label={isFr ? 'Poser le bloc' : 'Drop block'}>
                <canvas ref={canvas} data-testid="stack-canvas" data-level={run?.level || 0} />
            </button>
            <div className={styles.stackFooter}>
                <span>{run?.level || 0} {isFr ? 'BLOCS' : 'BLOCKS'}{rival ? ` · ${isFr ? 'RIVAL' : 'RIVAL'} ${party?.runs[rival]?.level || 0}` : ''}</span>
                <button type="button" disabled={!active || !run?.level || run.status !== 'playing'} onClick={() => send('bank')}><LockKeyhole size={17} />{isFr ? 'Securiser' : 'Bank tower'}</button>
            </div>
        </>}
        <div className={styles.feedback} role="status">{revealing && gameId === 'falsestart'
            ? feedback?.trapped ? (isFr ? 'La feinte a marche.' : 'The feint landed.') : feedback?.falseStart ? (isFr ? 'Un point pour le rival.' : 'A point for the rival.') : (isFr ? 'Bien vu.' : 'Good reaction.')
            : gameId === 'onemore' && run?.status === 'banked' ? (isFr ? 'Tour securisee. Au rival de tenter.' : 'Tower banked. Your rival decides.') : ''}</div>
        {session && !session.spectator && <button type="button" className={styles.forfeit} onClick={() => {
            if (confirm(isFr ? 'Abandonner cette manche ?' : 'Forfeit this round?')) socket.current?.send(JSON.stringify({ type: 'arena.forfeit' }));
        }}><Flag size={14} />{isFr ? 'Abandonner' : 'Forfeit'}</button>}
    </div>;
}
