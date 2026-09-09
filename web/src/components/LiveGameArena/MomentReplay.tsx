import { useEffect, useRef, useState } from 'react';
import { Download, ImageDown, Pause, Play, Share2 } from 'lucide-react';
import { gameLabel } from '../../gameplay/catalog';
import { paintTower, type PartyMoment, type PartyState } from '../../gameplay/party';
import styles from './MomentReplay.module.css';

interface Props { moment: PartyMoment; userId: string; playerName: string; rivalName: string; isFr: boolean }

function renderMoment(canvas: HTMLCanvasElement, moment: PartyMoment, state: PartyState | undefined, names: string[], isFr: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const accent = moment.gameId === 'falsestart' ? '#f4d26a' : moment.gameId === 'onesecond' ? '#9ad9fa' : '#aff2b4';
    ctx.fillStyle = '#151a17'; ctx.fillRect(0, 0, w, 900);
    ctx.fillStyle = accent; ctx.textAlign = 'left'; ctx.font = '900 30px sans-serif'; ctx.fillText('SLAP$TAX', 42, 64);
    ctx.fillStyle = '#a5b1a8'; ctx.textAlign = 'right'; ctx.font = '14px monospace'; ctx.fillText(isFr ? 'FACE A FACE' : 'HEAD TO HEAD', w - 42, 58);
    ctx.textAlign = 'left'; ctx.font = 'bold 44px sans-serif'; ctx.fillStyle = '#f2f5ef'; ctx.fillText(gameLabel(moment.gameId, isFr), 42, 136);
    ctx.fillStyle = '#364a3a'; ctx.fillRect(42, 164, w - 84, 2);
    const players = moment.players;
    players.forEach((id, index) => {
        const x = index ? 520 : 200;
        ctx.textAlign = 'center'; ctx.fillStyle = '#bdc8bf'; ctx.font = 'bold 18px sans-serif';
        let name = names[index] || (index ? 'RIVAL' : 'PLAYER');
        while (ctx.measureText(name).width > 240 && name.length > 2) name = name.slice(0, -2) + '…';
        ctx.fillText(name, x, 214);
        const score = state?.scores[id] ?? moment.scores[id] ?? 0;
        ctx.font = 'bold 42px monospace'; ctx.fillStyle = index ? '#ffa49c' : accent;
        ctx.fillText(`${Math.abs(score)}${moment.gameId === 'onesecond' ? ' ms' : ''}`, x, 274);
    });
    if (moment.gameId === 'onemore') {
        players.forEach((id, index) => {
            const offscreen = document.createElement('canvas'); offscreen.width = 270; offscreen.height = 350;
            const c = offscreen.getContext('2d')!;
            paintTower(c, state?.runs[id], 270, 350, index ? '#ffa49c' : accent);
            ctx.drawImage(offscreen, index ? 392 : 58, 334);
        });
    } else if (moment.gameId === 'falsestart') {
        const signal = state?.signal || 'wait';
        ctx.fillStyle = signal === 'go' ? '#aff2b4' : signal === 'trap' ? '#573037' : '#2e3830';
        ctx.fillRect(145, 358, 430, 230);
        ctx.fillStyle = signal === 'go' ? '#17231a' : '#f2f5ef'; ctx.font = '900 76px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(state?.phase === 'done' ? 'FINISH' : signal.toUpperCase(), 360, 498);
    } else {
        ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(360, 490, 128, 0, Math.PI * 2); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = accent; ctx.font = 'bold 47px monospace'; ctx.fillText(`${((state?.targetMs || moment.targets?.[moment.targets.length - 1] || 1000) / 1000).toFixed(0)} s`, 360, 507);
        players.forEach((id, index) => {
            const durations = state?.runs[id]?.durations || [];
            ctx.font = '16px monospace'; ctx.fillStyle = '#dbe4dc';
            ctx.fillText(durations.map((v) => v === null ? '--' : `${(v / 1000).toFixed(3)}s`).join(' / '), index ? 520 : 200, 672);
        });
    }
    ctx.fillStyle = '#f2f5ef'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif';
    const gap = Math.abs((moment.scores[players[0]] || 0) - (moment.scores[players[1]] || 0));
    ctx.fillText(moment.summary.includes('forfeit') ? (isFr ? 'Victoire par forfait' : 'Won by forfeit') : moment.gameId === 'onesecond' ? `${gap} ms ${isFr ? "d'ecart." : 'apart.'}` : isFr ? 'On remet ca ?' : 'Run it back?', 360, 759);
    ctx.fillStyle = '#b7c5ba'; ctx.font = '17px sans-serif'; ctx.fillText(isFr ? 'La revanche vous appartient.' : 'The rematch is yours.', 360, 804);
    ctx.fillStyle = accent; ctx.fillRect(42, 850, 636, 4);
}

export function MomentReplay({ moment, userId, playerName, rivalName, isFr }: Props) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [frame, setFrame] = useState(Math.max(0, moment.replay.length - 1));
    const [playing, setPlaying] = useState(false);
    const [namesOn, setNamesOn] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const mounted = useRef(true);
    const recorder = useRef<MediaRecorder | null>(null);
    const exportFrame = useRef(0);
    const canVideo = typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
    const names = moment.players.map((id, index) => namesOn ? id === userId ? playerName : rivalName : `${isFr ? 'JOUEUR' : 'PLAYER'} ${index + 1}`);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; cancelAnimationFrame(exportFrame.current); if (recorder.current?.state === 'recording') recorder.current.stop(); };
    }, []);
    useEffect(() => {
        if (canvas.current && !busy) renderMoment(canvas.current, moment, moment.replay[frame]?.state, names, isFr);
    }, [moment, frame, namesOn, playerName, rivalName, busy, isFr]);
    useEffect(() => {
        if (!playing) return;
        const firstAt = moment.replay[0]?.at || 0;
        const duration = Math.max(100, (moment.replay[moment.replay.length - 1]?.at || 0) - firstAt);
        const started = performance.now();
        let animation = 0;
        const step = (now: number) => {
            const elapsed = now - started;
            const index = moment.replay.findIndex((entry) => entry.at - firstAt >= elapsed);
            setFrame(index < 0 ? moment.replay.length - 1 : index);
            if (elapsed >= duration) setPlaying(false); else animation = requestAnimationFrame(step);
        };
        animation = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animation);
    }, [playing, moment]);

    function download(blob: Blob, extension: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `slaptax-${moment.gameId}.${extension}`; a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    async function snapshot(share: boolean) {
        if (!canvas.current) return;
        setMessage(''); setPlaying(false);
        renderMoment(canvas.current, moment, moment.replay[moment.replay.length - 1]?.state, names, isFr);
        const blob = await new Promise<Blob | null>((resolve) => canvas.current!.toBlob(resolve, 'image/png'));
        if (!blob) { setMessage(isFr ? 'Export indisponible.' : 'Export unavailable.'); return; }
        const file = new File([blob], 'slaptax-moment.png', { type: 'image/png' });
        try {
            if (share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'SLAP$TAX' });
            else download(blob, 'png');
        } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setMessage(isFr ? 'Partage indisponible.' : 'Sharing unavailable.'); }
    }
    function video() {
        if (!canvas.current || !canVideo || busy) return;
        setPlaying(false); setBusy(true); setMessage('');
        const surface = canvas.current;
        const stream = surface.captureStream(30);
        const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
        const chunks: BlobPart[] = [];
        try {
            const recording = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            recorder.current = recording;
            recording.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
            recording.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                if (!mounted.current) return;
                if (chunks.length) download(new Blob(chunks, { type: recording.mimeType }), recording.mimeType.includes('mp4') ? 'mp4' : 'webm');
                setBusy(false);
            };
            recording.onerror = () => { stream.getTracks().forEach((track) => track.stop()); if (mounted.current) { setBusy(false); setMessage(isFr ? 'Export video indisponible.' : 'Video export unavailable.'); } };
            recording.start();
            const start = performance.now();
            const base = moment.replay[0]?.at || 0;
            const length = Math.max(500, (moment.replay[moment.replay.length - 1]?.at || base) - base);
            const draw = (now: number) => {
                const index = moment.replay.findIndex((entry) => entry.at - base >= now - start);
                renderMoment(surface, moment, moment.replay[index < 0 ? moment.replay.length - 1 : index]?.state, names, isFr);
                if (now - start > length + 700) recording.stop(); else exportFrame.current = requestAnimationFrame(draw);
            };
            exportFrame.current = requestAnimationFrame(draw);
        } catch { stream.getTracks().forEach((track) => track.stop()); setBusy(false); setMessage(isFr ? 'Export video indisponible.' : 'Video export unavailable.'); }
    }
    return <div className={styles.replay} data-testid="moment-replay">
        <div className={styles.heading}><strong>{isFr ? 'Le moment decisif' : 'The decisive moment'}</strong><span>SLAP$TAX</span></div>
        <canvas ref={canvas} width={720} height={900} aria-label={isFr ? 'Replay du duel' : 'Duel replay'} />
        <div className={styles.timeline}><button type="button" disabled={busy || !moment.replay.length} onClick={() => { setFrame(0); setPlaying(!playing); }} title={playing ? 'Pause' : 'Replay'} aria-label={playing ? 'Pause' : 'Replay'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <input type="range" min={0} max={Math.max(0, moment.replay.length - 1)} value={frame} disabled={busy} aria-label={isFr ? 'Position du replay' : 'Replay position'} onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} /></div>
        <label className={styles.privacy}><input type="checkbox" checked={namesOn} disabled={busy} onChange={(e) => setNamesOn(e.target.checked)} />{isFr ? 'Inclure les pseudos' : 'Include player names'}</label>
        <div className={styles.tools}>
            <button type="button" disabled={busy} onClick={() => void snapshot(true)}><Share2 size={16} />{isFr ? 'Partager' : 'Share'}</button>
            <button type="button" disabled={busy} onClick={() => void snapshot(false)} title="PNG" aria-label={isFr ? "Telecharger l'image" : 'Download image'}><ImageDown size={18} /></button>
            <button type="button" disabled={busy || !canVideo} onClick={video} title={canVideo ? 'Video' : 'Video export unavailable'} aria-label={isFr ? 'Telecharger le replay' : 'Download replay'}><Download size={18} /></button>
        </div>
        <p role="status">{busy ? (isFr ? 'Export en cours…' : 'Exporting…') : message}</p>
    </div>;
}
