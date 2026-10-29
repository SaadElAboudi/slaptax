import { useCallback, useEffect, useState } from 'react';
import type { CompetitiveGameId } from '../gameplay/catalog';

type AudioWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
    __slaptaxAudioCtx?: AudioContext;
    __slaptaxMusic?: {
        timer: number;
        gain: GainNode;
        step: number;
        gameId: CompetitiveGameId;
        intensity: number;
    };
};

const MUSIC_KEY = 'slaptax.music.enabled';
const MUSIC_EVENT = 'slaptax:music-change';

function enabled() {
    try{return localStorage.getItem(MUSIC_KEY)==='1';}catch{return false;}
}

function context() {
    const target = window as AudioWindow;
    const Constructor = window.AudioContext || target.webkitAudioContext;
    if (!Constructor) return null;
    try{target.__slaptaxAudioCtx ||= new Constructor();}catch{return null;}
    return target.__slaptaxAudioCtx;
}

function note(ctx: AudioContext, destination: AudioNode, frequency: number, duration: number, gain: number, type: OscillatorType) {
    try{
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + .015);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
    }catch{/* Optional music must not break gameplay. */}
}

const PATTERNS: Record<CompetitiveGameId, number[]> = {
    chicken:[0],
    snack:[0],
    pigeon:[0],lift:[0],pie:[0],balloon:[0],toilet:[0],
    table: [0],
    falsestart: [110, 0, 165, 0, 110, 0, 220, 0],
    onesecond: [0],
    chroma: [0],
    ricochet: [0],
    contrepied: [0],
    garde: [0, 7],
    mat: [0, 4, 7],
    trace: [0, 7],
    decoupe: [0, 5],
    onemore: [130, 165, 196, 220, 247, 220, 196, 165],
    bounce: [110, 165, 220, 165, 132, 198, 247, 198],
    symbolrush: [196, 247, 294, 370, 294, 247, 220, 247],
    bombpass: [82, 82, 123, 92, 82, 138, 92, 110],
    cupshuffle: [147, 185, 220, 185, 165, 208, 247, 208],
    duelnumeric: [130, 195, 260, 195, 146, 219, 292, 219],
};

export function startAdaptiveMusic(gameId: CompetitiveGameId, intensity = .35) {
    if (gameId === 'onesecond') { stopAdaptiveMusic(); return; }
    if (!enabled()) return;
    const ctx = context();
    if (!ctx) return;
    void ctx.resume().catch(()=>undefined);
    stopAdaptiveMusic();

    let gain:GainNode;try{gain=ctx.createGain();}catch{return;}
    gain.gain.value = .035;
    gain.connect(ctx.destination);
    const music = {
        timer: 0,
        gain,
        step: 0,
        gameId,
        intensity,
    };
    (window as AudioWindow).__slaptaxMusic = music;

    const tick = () => {
        const active = (window as AudioWindow).__slaptaxMusic;
        if (!active || !enabled()) return;
        const pattern = PATTERNS[active.gameId];
        const frequency = pattern[active.step % pattern.length];
        const critical = Math.max(0, Math.min(1, active.intensity));
        note(ctx, active.gain, frequency, .16, .06 + critical * .035, active.gameId === 'bombpass' ? 'sawtooth' : 'triangle');
        if (active.step % 2 === 0) note(ctx, active.gain, frequency / 2, .22, .035, 'sine');
        active.step += 1;
    };
    tick();
    music.timer = window.setInterval(tick, Math.round(420 - Math.min(1, intensity) * 150));
}

export function updateAdaptiveIntensity(intensity: number) {
    const music = (window as AudioWindow).__slaptaxMusic;
    if (music) music.intensity = Math.max(0, Math.min(1, intensity));
}

export function stopAdaptiveMusic() {
    const target = window as AudioWindow;
    if (!target.__slaptaxMusic) return;
    window.clearInterval(target.__slaptaxMusic.timer);
    try{target.__slaptaxMusic.gain.disconnect();}catch{/* Already disconnected. */}
    delete target.__slaptaxMusic;
}

export function useMusicPreference() {
    const [musicOn, setMusicOn] = useState(() => {
        try {
            return enabled();
        } catch {
            return true;
        }
    });

    useEffect(() => {
        const sync = () => setMusicOn(enabled());
        window.addEventListener(MUSIC_EVENT, sync);
        return () => window.removeEventListener(MUSIC_EVENT, sync);
    }, []);

    const toggleMusic = useCallback(() => {
        const next = !enabled();
        localStorage.setItem(MUSIC_KEY, next ? '1' : '0');
        if (!next) stopAdaptiveMusic();
        window.dispatchEvent(new Event(MUSIC_EVENT));
    }, []);

    return { musicOn, toggleMusic };
}
