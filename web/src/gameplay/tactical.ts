import type { DifficultyMode } from '../hooks/useGameStore';

export type TacticalHeat = 'calm' | 'warm' | 'hot';

export interface TacticalPacing {
    telegraphMs: [number, number];
    responseMs: [number, number];
    settleMs: [number, number];
    eliteMs: number;
    hardMs: number;
    forgivenessTiles: number;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function rangePick([min, max]: [number, number]) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

export function getTacticalPacing(mode: DifficultyMode): TacticalPacing {
    if (mode === 'casual') {
        return {
            telegraphMs: [1700, 2600],
            responseMs: [1800, 2800],
            settleMs: [1200, 1700],
            eliteMs: 280,
            hardMs: 520,
            forgivenessTiles: 1,
        };
    }

    if (mode === 'hardcore') {
        return {
            telegraphMs: [1000, 1700],
            responseMs: [1100, 1800],
            settleMs: [900, 1400],
            eliteMs: 180,
            hardMs: 340,
            forgivenessTiles: 0,
        };
    }

    return {
        telegraphMs: [1300, 2100],
        responseMs: [1400, 2200],
        settleMs: [1000, 1500],
        eliteMs: 220,
        hardMs: 420,
        forgivenessTiles: 0,
    };
}

export function getTacticalHeat(streak: number): TacticalHeat {
    if (streak >= 3) return 'hot';
    if (streak >= 1) return 'warm';
    return 'calm';
}

export function gradeReactionMs(ms: number, pacing: TacticalPacing) {
    if (ms <= pacing.eliteMs) return 'elite';
    if (ms <= pacing.hardMs) return 'hard';
    return 'standard';
}

export function getStreak(results: Array<{ won?: boolean }>) {
    let streak = 0;
    for (let i = results.length - 1; i >= 0; i -= 1) {
        if (!results[i].won) break;
        streak += 1;
    }
    return streak;
}
