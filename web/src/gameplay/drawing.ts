import type { DrawingState, Point } from './party';

export function paintPath(ctx: CanvasRenderingContext2D, points: Point[] | undefined, color: string, size: number, fill = false) {
    if (!points?.length) return;
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x*size,y*size) : ctx.moveTo(x*size,y*size));
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, size * .012); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) {ctx.closePath(); ctx.fillStyle = color; ctx.fill();} else ctx.stroke();
}
export function paintDrawing(ctx: CanvasRenderingContext2D, state: DrawingState | undefined, identity: string, size: number, phase: string, points: Point[] = [], side = 1, revealProgress = 1) {
    ctx.clearRect(0,0,size,size); ctx.fillStyle = '#161b1c'; ctx.fillRect(0,0,size,size);
    ctx.strokeStyle = '#273234'; ctx.lineWidth = 1;
    for (let i=1;i<8;i++) {ctx.beginPath();ctx.moveTo(size*i/8,0);ctx.lineTo(size*i/8,size);ctx.moveTo(0,size*i/8);ctx.lineTo(size,size*i/8);ctx.stroke();}
    const revealing = ['reveal','done'].includes(phase), entry = state?.history[(state?.history.length||1)-1];
    const target = revealing ? entry?.target : state?.target;
    if (target?.polygon) paintPath(ctx,target.polygon,'#c6d1db',size,true);
    if (target?.path) { ctx.setLineDash(revealing ? [size*.018,size*.014] : []); paintPath(ctx,target.path,'#f5cc73',size); ctx.setLineDash([]); }
    if (revealing && entry) {
        Object.entries(entry.results).forEach(([id,result]) => {
            const own = id===identity, color = own ? '#bdf182' : '#ff91a7';
            ctx.globalAlpha = revealProgress;
            if (result.piece) {ctx.globalAlpha = .5*revealProgress;paintPath(ctx,result.piece,color,size,true);ctx.globalAlpha=revealProgress;}
            paintPath(ctx,result.points,color,size);
        }); ctx.globalAlpha = 1;
    } else {
        if (target?.polygon && points.length===2) {
            const [a,b]=points, dx=b[0]-a[0],dy=b[1]-a[1];
            // The preview marks only the selected half-plane, never its percentage.
            ctx.save(); ctx.beginPath(); target.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*size,y*size):ctx.moveTo(x*size,y*size));ctx.closePath();ctx.clip();
            const line:Point[]=[[a[0]-dx*20,a[1]-dy*20],[b[0]+dx*20,b[1]+dy*20],[b[0]+dx*20-dy*side*20,b[1]+dy*20+dx*side*20],[a[0]-dx*20-dy*side*20,a[1]-dy*20+dx*side*20]];
            ctx.globalAlpha=.65;paintPath(ctx,line,'#bdf182',size,true);ctx.restore();
            paintPath(ctx,[[a[0]-dx*20,a[1]-dy*20],[b[0]+dx*20,b[1]+dy*20]],'#ffffff',size);
        } else paintPath(ctx,points,'#bdf182',size);
    }
}
