import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, Eye, LockKeyhole, Pencil, RotateCcw, Scissors } from 'lucide-react';
import type { PartyState, Point } from '../../gameplay/party';
import { paintDrawing } from '../../gameplay/drawing';
import styles from './Drawing.module.css';

export function Drawing({party,identity,active,isFr,send}: {
    party:PartyState; identity:string; active:boolean; isFr:boolean;
    send:(action:string,data?:{points:Point[];side?:number})=>void;
}) {
    const cut=party.id==='decoupe', locked=party.answered.includes(identity), reveal=['reveal','done'].includes(party.phase);
    const enabled=active && party.phase==='drawpath' && !locked;
    const surface=useRef<HTMLCanvasElement>(null), path=useRef<Point[]>([]), pointer=useRef<number|null>(null);
    const [points,setPoints]=useState<Point[]>([]), [side,setSide]=useState(1), [sent,setSent]=useState(false);
    const latest=useRef({party,points,side}); latest.current={party,points,side};
    const phaseStarted=useRef(performance.now());
    useEffect(()=>{phaseStarted.current=performance.now();},[party.phase]);
    useEffect(()=>{
        const canvas=surface.current; if(!canvas)return;
        let frame=0;
        const render=(now:number)=>{
            const size=Math.round(canvas.getBoundingClientRect().width*Math.min(2,devicePixelRatio||1));
            if(canvas.width!==size){canvas.width=size;canvas.height=size;}
            const ctx=canvas.getContext('2d'), data=latest.current;
            if(ctx)paintDrawing(ctx,data.party.drawing,identity,size,data.party.phase,data.points,data.side,
                matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-phaseStarted.current)/500));
            frame=requestAnimationFrame(render);
        };frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
    },[identity]);
    function position(e:PointerEvent<HTMLCanvasElement>):Point {
        const r=e.currentTarget.getBoundingClientRect();
        // Four decimals keep a full stroke below the shared socket's 4 KB limit.
        const normalized=(v:number)=>Math.round(Math.max(0,Math.min(1,v))*10000)/10000;
        return [normalized((e.clientX-r.x)/r.width),normalized((e.clientY-r.y)/r.height)];
    }
    function down(e:PointerEvent<HTMLCanvasElement>) {
        if(!enabled||sent||e.button!==0||pointer.current!==null)return;
        e.preventDefault(); const p=position(e);
        if(cut&&points.length===2){const [a,b]=points;setSide((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>=0?1:-1);return;}
        pointer.current=e.pointerId; e.currentTarget.setPointerCapture(e.pointerId);path.current=[p];setPoints([...path.current]);
    }
    function move(e:PointerEvent<HTMLCanvasElement>) {
        if(!enabled||pointer.current!==e.pointerId)return;
        const p=position(e), last=path.current[path.current.length-1];
        if(cut)path.current=[path.current[0],p];
        else if(Math.hypot(p[0]-last[0],p[1]-last[1])>.004){
            if(path.current.length>=126)path.current=path.current.filter((_,i)=>i%2===0);
            path.current.push(p);
        }
        setPoints([...path.current]);
    }
    function up(e:PointerEvent<HTMLCanvasElement>) {
        if(pointer.current!==e.pointerId)return;
        move(e);pointer.current=null;
        if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
        if(enabled&&!cut){const p=path.current.length<2?[...path.current,path.current[0]]:path.current;setSent(true);send('lock',{points:p});}
    }
    const entry=party.drawing?.history[(party.drawing?.history.length||1)-1];
    const intersects=cut&&points.length===2&&party.drawing?.target?.polygon?.some((p)=>{
        const [a,b]=points;return ((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))>0;
    })&&party.drawing?.target?.polygon?.some((p)=>{
        const [a,b]=points;return ((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))<0;
    })&&Math.hypot(points[0][0]-points[1][0],points[0][1]-points[1][1])>=.05;
    return <section className={styles.game} data-testid="drawing" data-phase={party.phase}>
        <header><span>{reveal ? (isFr?'REVELATION':'THE REVEAL'):party.phase==='observe'?(isFr?'MEMORISE':'REMEMBER'):party.phase==='prepare'?(isFr?'PRET ?':'READY?'):cut?(isFr?'PROPORTION CIBLE':'TARGET PORTION'):(isFr?'A TOI DE TRACER':'YOUR STROKE')}
            {cut&&party.drawing?.target&&<b>{party.drawing.target.percent}%</b>}</span><strong>{Math.ceil(party.remaining/1000)}<small> s</small></strong></header>
        <div className={styles.board} data-reveal={reveal}>
            <canvas ref={surface} data-testid="drawing-canvas" aria-label={isFr?(cut?'Surface de decoupe':'Surface de dessin'):(cut?'Cutting surface':'Drawing surface')}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
            {['ready','prepare'].includes(party.phase)&&<div className={styles.overlay}><strong>{party.phase==='prepare'?Math.max(1,Math.ceil(party.remaining/1000)):'...'}</strong></div>}
            {locked&&!reveal&&<div className={styles.locked}><Check size={18}/>{isFr?'Trait verrouille':'Stroke locked'}</div>}
        </div>
        <div className={styles.caption} role="status">
            {reveal?<><i/>{isFr?'TOI':'YOU'}{Object.keys(party.scores).length>1&&<><i data-rival/>RIVAL</>}<i data-target/>{isFr?'CIBLE':'TARGET'}</>:party.phase==='observe'?<><Eye size={18}/>{isFr?'2 SECONDES':'2 SECONDS'}</>:cut?<><Scissors size={18}/>{points.length===2?(isFr?'COTE CONSERVE':'SELECTED SIDE'):(isFr?'UNE LIGNE':'ONE LINE')}</>:<><Pencil size={18}/>{isFr?'UN SEUL TRAIT':'ONE STROKE'}</>}
        </div>
        {reveal?<div className={styles.results}>{Object.entries(entry?.results||{}).map(([id,result])=><div key={id} data-rival={id!==identity}>
            <span>{id===identity?(isFr?'TOI':'YOU'):'RIVAL'}</span><strong>{result.expired?'--':cut?`${result.percent}%`:`${(result.score/10).toFixed(1)}%`}</strong>
            <small>{result.expired?(isFr?'EXPIRE':'EXPIRED'):cut?`${result.error} ${isFr?'pts d ecart':'pts off'}`:(isFr?'FIDELITE':'ACCURACY')}</small>
        </div>)}</div>:cut?<div className={styles.actions}>
            <button type="button" disabled={!enabled||sent||!points.length} onClick={()=>{path.current=[];setPoints([]);}} aria-label={isFr?'Recommencer la ligne':'Reset line'} title={isFr?'Recommencer la ligne':'Reset line'}><RotateCcw size={20}/></button>
            <button type="button" disabled={!enabled||sent||!intersects} onClick={()=>{setSent(true);send('lock',{points,side});}}><LockKeyhole size={18}/>{locked||sent?(isFr?'Verrouille':'Locked'):(isFr?'Valider la coupe':'Lock cut')}</button>
        </div>:<div className={styles.progress}>{[0,1,2].map(i=><span key={i} data-current={party.attempt===i+1}>0{i+1}<b>{party.drawing?.history[i]?.results[identity]?`${(party.drawing.history[i].results[identity].score/10).toFixed(1)}%`:'--'}</b></span>)}</div>}
    </section>;
}
