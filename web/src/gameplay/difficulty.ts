import type { DifficultyMode } from '../hooks/useGameStore';

export function getDifficultyLabel(mode: DifficultyMode, isFr: boolean): string {
    if (mode === 'casual') return isFr ? 'Facile' : 'Casual';
    if (mode === 'hardcore') return isFr ? 'Difficile' : 'Hardcore';
    return isFr ? 'Normal' : 'Standard';
}

export function getDuelTuning(mode: DifficultyMode) {
    if (mode === 'casual') {
        return { reflexWinMs: 740, precisionPx: 13, timingDelta: 12 };
    }
    if (mode === 'hardcore') {
        return { reflexWinMs: 600, precisionPx: 9, timingDelta: 8 };
    }
    return { reflexWinMs: 680, precisionPx: 11, timingDelta: 10 };
}

export function getQuickdrawTuning(mode: DifficultyMode) {
    if (mode === 'casual') {
        return {
            opponentMsOffset: 140,
            timeoutMsMin: 1100,
            timeoutMsMax: 1600,
            timeoutMargin: 420,
            eliteMs: 220,
            hardMs: 320,
            standardMs: 460,
        };
    }
    if (mode === 'hardcore') {
        return {
            opponentMsOffset: -80,
            timeoutMsMin: 820,
            timeoutMsMax: 1100,
            timeoutMargin: 160,
            eliteMs: 130,
            hardMs: 190,
            standardMs: 260,
        };
    }
    return {
        opponentMsOffset: 0,
        timeoutMsMin: 900,
        timeoutMsMax: 1200,
        timeoutMargin: 250,
        eliteMs: 150,
        hardMs: 220,
        standardMs: 320,
    };
}

export function getParryTuning(mode: DifficultyMode) {
    if (mode === 'casual') {
        return {
            windowBoost: 70,
            telegraphBoost: 180,
            eliteMs: 170,
            hardMs: 290,
        };
    }
    if (mode === 'hardcore') {
        return {
            windowBoost: -50,
            telegraphBoost: -100,
            eliteMs: 120,
            hardMs: 220,
        };
    }
    return {
        windowBoost: 0,
        telegraphBoost: 0,
        eliteMs: 150,
        hardMs: 260,
    };
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

export function getSpeedSortTuning(mode: DifficultyMode) {
    if (mode === 'casual') {
        return {
            itemCount: 5,
            memorizeMs: 2800,
            timeoutMs: 5200,
            eliteMs: 1500,
            hardMs: 2800,
        };
    }
    if (mode === 'hardcore') {
        return {
            itemCount: 7,
            memorizeMs: 1800,
            timeoutMs: 3200,
            eliteMs: 900,
            hardMs: 1800,
        };
    }
    return {
        itemCount: 6,
        memorizeMs: 2400,
        timeoutMs: 4200,
        eliteMs: 1200,
        hardMs: 2400,
    };
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
