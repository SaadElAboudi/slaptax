import refinement from '../../../shared/party-refinement.json' with {type:'json'};
import {paintScenery} from './scenery';
export interface PartyRun {
    durations?: Array<number | null>;
    errors?: number[];
    layers?: Array<{ x: number; width: number }>;
    moving?: { x: number; width: number };
    motion?: { ageMs: number; speed: number };
    level?: number;
    bank?: number;
    perfects?: number;
    perfectStreak?:number;buoy?:boolean;rescues?:number;repairs?:number;
    status?: 'playing' | 'crashed' | 'banked';
}

export function interpolateTower(run: PartyRun | undefined, elapsedMs: number): PartyRun | undefined {
    if (!run?.motion || !run.moving || run.status !== 'playing') return run;
    const wave = ((run.motion.ageMs + Math.max(0, Math.min(150, elapsedMs))) / 1000 * run.motion.speed) % 2;
    return { ...run, moving: { width: run.moving.width, x: (wave <= 1 ? wave : 2 - wave) * (1 - run.moving.width) } };
}

export interface PartyState {
    snack?: SnackState;
    id: string;
    phase: 'ready' | 'wait' | 'go' | 'prepare' | 'timing' | 'stack' | 'reveal' | 'done' | 'draw' | 'observe' | 'mix' | 'aim' | 'flight' | 'choose' | 'drawpath' | 'solve' | 'brawl';
    absurd?:AbsurdState;
    carnival?:CarnivalState;
    toilet?:ToiletState;
    table?: TableState;
    mat?: MatState;
    drawing?: DrawingState;
    contrepied?: ContrepiedState;
    garde?: GardeState;
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

export interface ChessPieceState { square:string; type:'p'|'n'|'b'|'r'|'q'|'k'; color:'w'|'b' }
export interface MatState {
    fen:string; board:ChessPieceState[]; turn:'w'|'b'; legal:string[]; selected?:string; tieWindowMs:number;
    solution?:string; puzzleId?:string; rating?:number;
    results?:Record<string,{move:string|null;ms:number|null;mate:boolean;expired:boolean}>;
}

export interface ContrepiedState {
    rewards: number[];
    hands: Record<string, number[]>;
    selected?: number;
    botId: string | null;
    botScore: number;
    history: Array<{ exchange: number; reward: number; cards: Record<string, number>; expired: string[]; winnerId: string | null }>;
}

export type GardeAction = 'attack' | 'charge' | 'defend' | 'prank' | 'miss';
export interface GardeState {
    hp:Record<string,number>; charged:Record<string,boolean>; canDefend:Record<string,boolean>;
    selected?:GardeAction; botId:string|null; winnerId:string|null; finished:boolean;
    history:Array<{exchange:number;actions:Record<string,GardeAction>;before:Record<string,number>;hp:Record<string,number>;damage:Record<string,number>;gags?:Record<string,'pan'|'banana'|'bonk'|null>;chargedBefore:Record<string,boolean>}>;
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

export type Point = [number, number];
export interface DrawingTarget { recipe?:string;axis?:'free'|'vertical'|'diagonal';path?: Point[]; polygon?: Point[]; percent?: number }
export interface DrawingResult { points?: Point[]; piece?: Point[]; side?: number; percent?: number; error?: number; score: number; expired?: boolean }
export interface DrawingState {
    target?: DrawingTarget;
    history: Array<{ attempt: number; target: DrawingTarget; results: Record<string, DrawingResult> }>;
}

export function paintTower(ctx: CanvasRenderingContext2D, run: PartyRun | undefined, width: number, height: number, color = '#def56a') {
    ctx.clearRect(0, 0, width, height);
    paintScenery(ctx, 'warehouse', width, height);
    // The gantry cable follows the real moving block, never predicts a drop.
    if(run?.status==='playing'&&run.moving){const x=(run.moving.x+run.moving.width/2)*width;ctx.strokeStyle='#253e47';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,Math.max(12,height-16-(Math.min(12,run.layers?.length||1)+1)*Math.min(24,(height-65)/13)));ctx.stroke();}
    const layers = run?.layers || [{ x: .19, width: .62 }];
    const visible = layers.slice(-12);
    const step = Math.min(24, (height - 65) / 13);
    ctx.strokeStyle = '#a6e1d2';
    for (let row = 1; row <= 13; row++) {
        ctx.beginPath(); ctx.moveTo(0, height - row * step); ctx.lineTo(width, height - row * step); ctx.stroke();
    }
    const blockFace=(x:number,y:number,w:number,h:number,fill:string,moving=false)=>{
        ctx.fillStyle='#18264230';ctx.beginPath();ctx.roundRect(x+2,y+4,w,h,5);ctx.fill();
        ctx.fillStyle=fill;ctx.strokeStyle='#182642';ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(6,h/3));ctx.fill();ctx.stroke();
        ctx.fillStyle='#ffffff60';ctx.fillRect(x+4,y+3,Math.max(0,w-8),2);
        if(w>30&&h>10){const mid=x+w/2,eye=Math.min(9,w/6);ctx.fillStyle='#182642';
            for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(mid+side*eye,y+h*.48,2,3,0,0,Math.PI*2);ctx.fill();}
            ctx.strokeStyle='#182642';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mid-3,y+h*.73);ctx.quadraticCurveTo(mid,y+h*(moving?.55:.97),mid+3,y+h*.73);ctx.stroke();
        }
    };
    visible.forEach((block, i) => {
        const palette=['#bc9fee','#ff9d8b','#89dced','#ffdc6e'];
        blockFace(block.x*width,height-16-(i+1)*step,block.width*width,step-3,i===visible.length-1?color:palette[i%4]);
    });
    if (run?.status === 'playing' && run.moving) {
        const base=layers[layers.length-1]!,left=Math.max(base.x,run.moving.x),right=Math.min(base.x+base.width,run.moving.x+run.moving.width),overlap=Math.max(0,right-left),aligned=Math.abs(base.x-run.moving.x)<refinement.tower.perfectTolerance;
        ctx.save();ctx.strokeStyle=aligned?'#fff4a3':'#c8e9e888';ctx.lineWidth=2;ctx.setLineDash([5,6]);for(const edge of [base.x,base.x+base.width]){ctx.beginPath();ctx.moveTo(edge*width,height-16-(visible.length+2)*step);ctx.lineTo(edge*width,height-16-visible.length*step);ctx.stroke();}ctx.restore();
        blockFace(run.moving.x*width,height-16-(visible.length+1)*step,run.moving.width*width,step-3,'#ffdc6e',true);
        const y=height-16-(visible.length+1)*step;
        ctx.fillStyle=overlap<refinement.tower.minOverlap?'#f77d86':aligned?'#fff5a3':'#8fe5be';ctx.fillRect(left*width,y+step-7,overlap*width,4);
        ctx.fillStyle='#f77d8688';if(run.moving.x<base.x)ctx.fillRect(run.moving.x*width,y,(Math.min(base.x,run.moving.x+run.moving.width)-run.moving.x)*width,step-3);if(run.moving.x+run.moving.width>base.x+base.width)ctx.fillRect(Math.max(run.moving.x,base.x+base.width)*width,y,(run.moving.x+run.moving.width-Math.max(run.moving.x,base.x+base.width))*width,step-3);
        if(run.buoy){ctx.strokeStyle='#b8f5ec';ctx.lineWidth=3;ctx.strokeRect(base.x*width-2,height-16-visible.length*step-2,base.width*width+4,step+1);}

    }
    if (run?.status === 'crashed') {
        ctx.fillStyle = '#ffab9c'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif';
        ctx.fillText('CRASH', width / 2, 44);
    }
}

export interface TableBody {id:string;bot:boolean;x:number;y:number;vx:number;vy:number;out:boolean;fallAge:number;cooldown:number;kos:number}
export interface TableState {pulls?:number;cloth?:{phase:string;direction:number};bound:number;elapsed:number;hits:number;lastHit:{x:number;y:number;age:number;strength:number}|null;winnerId:string|null;bodies:TableBody[]}

export interface ToiletState {elapsed:number;flush:'calm'|'warning'|'flush';golden:boolean;bumpers:Array<{x:number;y:number;r:number}>;bodies:Array<{id:string;bot:boolean;slot:number;x:number;y:number;vx:number;vy:number;loot:number;collected:number;flushes:number;cooldown:number;boosting:boolean;stunned:boolean}>;ducks:Array<{id:number;x:number;y:number;value:number}>;event:{kind:'boost'|'bonk'|'steal'|'duck'|'flush';id:string;x:number;y:number;at:number;age:number;value?:number}|null}

export interface CarnivalState {
 kind:string;elapsed:number;sabotages?:{target:string;remaining:number}[];
 bodies:{id:string;slot:number;bot:boolean;score:number;hits:number;combo:number;misses:number;dodges?:number;revenge?:boolean;shield?:boolean;blocks?:number;targetVolume?:number;targetBanks?:number;venting?:boolean;ventCooldown?:number;volume:number;serial:number;inflating:boolean;x:number;manual?:boolean;targetX?:number;cooldown:number;ducking:boolean;duckCooldown:number;pokeCooldown:number;creamed:boolean}[];
 shots:{id:string;target:string;aim:number;fromX?:number;revenge?:boolean;at:number;landsAt:number;progress:number}[];
 events:{kind:string;id:string;at:number;value:number;serial:number;age:number}[];
}

export interface AbsurdState {
 kind:string;elapsed:number;wind:number;
 wave:{index:number;gas:number|null;gases?:number[];bean:number|null;remaining:number}|null;
 bodies:{id:string;slot:number;bot:boolean;score:number;hits:number;misses:number;blocks:number;ownGoals:number;deliveryStreak?:number;perfects?:number;parries?:number;pranks:number;stinks:number;beans:number;streak?:number;breathing?:boolean;breathCooldown?:number;ammo:number;lane:number;confirmed:boolean;x:number;targetX?:number;visualLane?:number;carX:number;cooldown:number;umbrella:boolean;shieldCooldown:number;proutCooldown:number}[];
 shots:{id:number;owner:string;x:number;at:number;landsAt:number;progress:number}[];
 strikes:{id:number;owner:string;target:string;lane:number;remaining:number;at:number;impactAt:number}[];
 events:{serial:number;kind:string;id:string;at:number;value:number;age:number}[];
}

export interface SnackBody {ammo?:number;ammoMax?:number;ammoReloadIn?:number;superCharge?:number;superWindup?:number;superAimX?:number;superAimY?:number;supersUsed?:number;wardRemaining?:number;regenIn?:number;hasted?:boolean;team?:number;throws?:number;passes?:number;interceptions?:number;assists?:number;character?:string;maxHp?:number;speed?:number;slowed?:boolean;selectionLocked?:boolean;skillCooldown?:number;skillWindup?:number;guardRemaining?:number;guardX?:number;guardY?:number;range?:number;id:string;slot:number;bot:boolean;x:number;y:number;ax:number;ay:number;dx:number;dy:number;hp:number;kos:number;captures:number;carrying:boolean;attackCooldown:number;windup:number;dashCooldown:number;dashing:boolean;respawnIn:number;shielded:boolean}
export interface ChickenState {carryRemaining:number;carryLimit:number;frenzy:boolean;eggs:{id:number;x:number;y:number;radius:number;landsIn:number;remaining:number;exploded:boolean}[]}
export interface SnackState {chicken?:ChickenState;teamMode?:boolean;winnerTeam?:number|null;teamScores?:number[];zones?:{id:string;owner:string;fromX?:number;fromY?:number;x:number;y:number;radius:number;activeIn:number;remaining:number}[];elapsed:number;winnerId:string|null;walls:{x:number;y:number;w:number;h:number}[];box:{x:number;y:number;carrier:string|null;contested?:boolean;readyIn:number;vx?:number;vy?:number;flying?:boolean;thrownBy?:string|null;bounces?:number};events:{kind:string;id:string;x:number;y:number;at:number;age:number;ax?:number;ay?:number;by?:string}[];bodies:SnackBody[]}
