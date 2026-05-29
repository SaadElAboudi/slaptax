import { useCallback, useState } from 'react';

type AudioContextConstructor = typeof AudioContext;

const STORAGE_KEY = 'slaptax.sfx.enabled';

function getInitialSoundOn() {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === '1';
}

function getAudioContextCtor(): AudioContextConstructor | null {
    if (typeof window === 'undefined') return null;
    return (window.AudioContext || (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext || null);
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function useSfx() {
    const [soundOn, setSoundOn] = useState(getInitialSoundOn);

    const getCtx = useCallback(() => {
        const ctor = getAudioContextCtor();
        if (!ctor) return null;

        if (!(window as Window & { __slaptaxAudioCtx?: AudioContext }).__slaptaxAudioCtx) {
            (window as Window & { __slaptaxAudioCtx?: AudioContext }).__slaptaxAudioCtx = new ctor();
        }

        return (window as Window & { __slaptaxAudioCtx?: AudioContext }).__slaptaxAudioCtx ?? null;
    }, []);

    const activateAudio = useCallback(async () => {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }, [getCtx]);

    const playTone = useCallback(
        (freq: number, durationMs: number, gain: number, type: OscillatorType, offsetSec = 0) => {
            if (!soundOn) return;
            const ctx = getCtx();
            if (!ctx || ctx.state !== 'running') return;

            const now = ctx.currentTime + offsetSec;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, now);

            const clampedGain = clamp(gain, 0.001, 0.18);
            gainNode.gain.setValueAtTime(0.0001, now);
            gainNode.gain.exponentialRampToValueAtTime(clampedGain, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(now);
            oscillator.stop(now + durationMs / 1000 + 0.02);
        },
        [getCtx, soundOn]
    );

    const levelGain = useCallback((intensity = 0) => 0.04 + clamp(intensity, 0, 1) * 0.03, []);

    const playReady = useCallback(
        (intensity = 0) => {
            const gain = levelGain(intensity);
            playTone(300, 110, gain, 'triangle');
            playTone(340, 110, gain * 0.9, 'triangle', 0.12);
        },
        [levelGain, playTone]
    );

    const playDraw = useCallback(
        (intensity = 0) => {
            const gain = levelGain(intensity) + 0.01;
            playTone(960, 90, gain, 'square');
            playTone(880, 70, gain * 0.8, 'square', 0.1);
        },
        [levelGain, playTone]
    );

    const playWin = useCallback(
        (intensity = 0) => {
            const gain = levelGain(intensity) + 0.01;
            playTone(520, 110, gain, 'triangle');
            playTone(700, 130, gain, 'triangle', 0.12);
            playTone(920, 150, gain * 0.95, 'sine', 0.24);
        },
        [levelGain, playTone]
    );

    const playLoss = useCallback(
        (intensity = 0) => {
            const gain = levelGain(intensity);
            playTone(260, 130, gain, 'sawtooth');
            playTone(180, 170, gain * 0.9, 'sawtooth', 0.11);
        },
        [levelGain, playTone]
    );

    const playFalseStart = useCallback(
        () => {
            playTone(160, 120, 0.08, 'square');
            playTone(120, 160, 0.07, 'square', 0.08);
        },
        [playTone]
    );

    const toggleSound = useCallback(() => {
        setSoundOn((prev) => {
            const next = !prev;
            window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            return next;
        });
    }, []);

    return {
        soundOn,
        toggleSound,
        activateAudio,
        playReady,
        playDraw,
        playWin,
        playLoss,
        playFalseStart,
    };
}
