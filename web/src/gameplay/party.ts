export interface PartyRun {
    durations?: Array<number | null>;
    errors?: number[];
    layers?: Array<{ x: number; width: number }>;
    moving?: { x: number; width: number };
    motion?: { ageMs: number; speed: number };
    level?: number;
    bank?: number;
    perfects?: number;
    status?: 'playing' | 'crashed' | 'banked';
}

export function interpolateTower(run: PartyRun | undefined, elapsedMs: number): PartyRun | undefined {
    if (!run?.motion || !run.moving || run.status !== 'playing') return run;
    const wave = ((run.motion.ageMs + Math.max(0, Math.min(150, elapsedMs))) / 1000 * run.motion.speed) % 2;
    return { ...run, moving: { width: run.moving.width, x: (wave <= 1 ? wave : 2 - wave) * (1 - run.moving.width) } };
}

export interface PartyState {
    id: string;
    phase: 'ready' | 'wait' | 'go' | 'prepare' | 'timing' | 'stack' | 'reveal' | 'done' | 'draw' | 'observe' | 'mix' | 'aim' | 'flight';
    board?: RicochetBoard;
    color?: number[];
    draft?: number[];
    turn: number;
    attempt: number;
    remaining: number;
    scores: Record<string, number>;
    feedback: { color?: number[]; colors?: Record<string, number[]>; actor?: string; falseStart?: boolean; reaction?: number; trapped?: boolean; timeout?: boolean; durations?: Record<string, number | null> };
    feints: Record<string, number>;
    ready: string[];
    signal: 'go' | 'trap' | 'wait';
    answered: string[];
    targetMs?: number;
    targets?: number[];
    clockSignal?: boolean;
    runs: Record<string, PartyRun>;
    winnerId: string | null;
    summary: string;
}

export interface RicochetBoard {
    size:number;
    pucks:Array<{id:string;owner:string;x:number;y:number}>;
    origins:Record<string,{x:number;y:number}>;
}

export interface PartyMoment {
    targets?: number[];
    gameId: string;
    players: string[];
    scores: Record<string, number>;
    runs: Record<string, PartyRun>;
    replay: Array<{ at: number; state: PartyState }>;
    summary: string;
}

export function paintTower(ctx: CanvasRenderingContext2D, run: PartyRun | undefined, width: number, height: number, color = '#93f1b5') {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#151719';
    ctx.fillRect(0, 0, width, height);
    const layers = run?.layers || [{ x: .19, width: .62 }];
    const visible = layers.slice(-12);
    const step = Math.min(24, (height - 65) / 13);
    ctx.strokeStyle = '#323638';
    for (let row = 1; row <= 13; row++) {
        ctx.beginPath(); ctx.moveTo(0, height - row * step); ctx.lineTo(width, height - row * step); ctx.stroke();
    }
    visible.forEach((block, i) => {
        ctx.fillStyle = i === visible.length - 1 ? color : '#52675f';
        ctx.fillRect(block.x * width, height - 16 - (i + 1) * step, block.width * width, step - 3);
    });
    if (run?.status === 'playing' && run.moving) {
        ctx.fillStyle = '#f4d26a';
        ctx.fillRect(run.moving.x * width, height - 16 - (visible.length + 1) * step, run.moving.width * width, step - 3);
    }
    if (run?.status === 'crashed') {
        ctx.fillStyle = '#ff8c94'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif';
        ctx.fillText('CRASH', width / 2, 44);
    }
}
