import cutRecipes from '../../../shared/cut-recipes.json' with {type:'json'};
import {paintScenery} from './scenery';
import type { DrawingState, Point } from './party';

export function paintPath(ctx: CanvasRenderingContext2D, points: Point[] | undefined, color: string, size: number, fill = false) {
    if (!points?.length) return;
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x*size,y*size) : ctx.moveTo(x*size,y*size));
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, size * .012); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill) {ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#101a38'; ctx.lineWidth = Math.max(2,size*.008); ctx.stroke();} else ctx.stroke();
}
export function paintDrawing(ctx: CanvasRenderingContext2D, state: DrawingState | undefined, identity: string, size: number, phase: string, points: Point[] = [], side = 1, revealProgress = 1) {
    ctx.clearRect(0,0,size,size); paintScenery(ctx,'kitchen',size,size);
    ctx.strokeStyle = '#2c457a'; ctx.lineWidth = 1;
    for (let i=1;i<8;i++) {ctx.beginPath();ctx.moveTo(size*i/8,0);ctx.lineTo(size*i/8,size);ctx.moveTo(0,size*i/8);ctx.lineTo(size,size*i/8);ctx.stroke();}
    const revealing = ['reveal','done'].includes(phase), entry = state?.history[(state?.history.length||1)-1];
    const target = revealing ? entry?.target : state?.target;
    if (target?.polygon){
        ctx.fillStyle='#18264240';ctx.beginPath();ctx.roundRect(size*.045,size*.055,size*.92,size*.92,size*.045);ctx.fill();
        ctx.fillStyle='#e6b77c';ctx.beginPath();ctx.roundRect(size*.035,size*.035,size*.93,size*.93,size*.045);ctx.fill();
        ctx.strokeStyle='#ad754c';ctx.lineWidth=size*.008;ctx.stroke();
        ctx.strokeStyle='#cc995f';ctx.lineWidth=size*.004;for(let y=1;y<9;y++){ctx.beginPath();ctx.moveTo(size*.05,size*y/10);ctx.lineTo(size*.95,size*y/10);ctx.stroke();}
        const recipe=cutRecipes.recipes.find(r=>r.id===target.recipe);
        paintPath(ctx,target.polygon,recipe?.color||'#f8cf7d',size,true);
        ctx.save();ctx.beginPath();target.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*size,y*size):ctx.moveTo(x*size,y*size));ctx.closePath();ctx.clip();
        ctx.fillStyle=recipe?.detail||'#c08245';for(let i=0;i<18;i++){const x=(.15+((i*37)%70)/100)*size,y=(.15+((i*23)%70)/100)*size;ctx.beginPath();ctx.ellipse(x,y,size*(target.recipe==='fromage'?.025:.009),size*(target.recipe==='fromage'?.025:.014),i,0,Math.PI*2);ctx.fill();}
        if(target.recipe==='gateau'){ctx.strokeStyle='#fff1d7';ctx.lineWidth=size*.015;for(const y of [.32,.67]){ctx.beginPath();ctx.moveTo(size*.15,size*y);for(let i=1;i<=7;i++)ctx.lineTo(size*(.15+i*.1),size*(y+(i%2?-.025:.025)));ctx.stroke();}}
        const center=target.polygon.reduce((p,q)=>[p[0]+q[0]/target.polygon!.length,p[1]+q[1]/target.polygon!.length] as Point,[0,0] as Point);
        const x=center[0]*size,y=center[1]*size,panic=points.length===2&&!revealing;
        for(const side of [-1,1]){ctx.fillStyle='white';ctx.strokeStyle='#182642';ctx.lineWidth=size*.006;ctx.beginPath();ctx.ellipse(x+side*size*.045,y-size*.025,size*.028,size*.035,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#182642';ctx.beginPath();ctx.arc(x+side*size*.045,y-size*.02,size*.012,0,Math.PI*2);ctx.fill();}
        ctx.strokeStyle='#182642';ctx.lineWidth=size*.007;ctx.beginPath();if(panic)ctx.ellipse(x,y+size*.045,size*.018,size*.025,0,0,Math.PI*2);else{ctx.moveTo(x-size*.025,y+size*.025);ctx.quadraticCurveTo(x,y+size*.065,x+size*.025,y+size*.025);}ctx.stroke();ctx.restore();
    }
    if (target?.path) { ctx.setLineDash(revealing ? [size*.018,size*.014] : []); paintPath(ctx,target.path,'#f4d77c',size); ctx.setLineDash([]); }
    if (revealing && entry) {
        Object.entries(entry.results).forEach(([id,result]) => {
            const own = id===identity, color = own ? '#def56a' : '#ffab9c';
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
            ctx.globalAlpha=.65;paintPath(ctx,line,'#def56a',size,true);ctx.restore();
            paintPath(ctx,[[a[0]-dx*20,a[1]-dy*20],[b[0]+dx*20,b[1]+dy*20]],'#ffffff',size);
        } else paintPath(ctx,points,'#def56a',size);
    }
}
