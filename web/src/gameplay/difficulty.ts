import type { DifficultyMode } from '../hooks/useGameStore';

export function getDifficultyLabel(mode: DifficultyMode, isFr: boolean): string {
    if (mode === 'casual') return isFr ? 'Facile' : 'Casual';
    if (mode === 'hardcore') return isFr ? 'Difficile' : 'Hardcore';
    return isFr ? 'Normal' : 'Standard';
}

export function getRiskStakeCap(mode: DifficultyMode): number {
    if (mode === 'casual') return 5;
    if (mode === 'hardcore') return 20;
    return 10;
}

export function tuneTournamentSize(size: number, mode: DifficultyMode): number {
    const tiers = [8, 16, 32];
    const idx = tiers.indexOf(size);
    if (idx < 0) return size;
    if (mode === 'casual') return tiers[Math.max(0, idx - 1)];
    if (mode === 'hardcore') return tiers[Math.min(tiers.length - 1, idx + 1)];
    return size;
}

export function getDuelNumericTuning(mode: DifficultyMode) {
    if (mode === 'casual') {
        return {
            readyMs: 3000,
            timeoutMs: 6000,
            eliteMs: 1800,
            hardMs: 3200,
        };
    }
    if (mode === 'hardcore') {
        return {
            readyMs: 1800,
            timeoutMs: 3200,
            eliteMs: 900,
            hardMs: 1600,
        };
    }
    return {
        readyMs: 2400,
        timeoutMs: 4500,
        eliteMs: 1300,
        hardMs: 2400,
    };
}
