import {startGameLoop} from '../../gameplay/gameLoop';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, Eye, LockKeyhole, Pencil, RotateCcw, Scissors } from 'lucide-react';
import type { PartyState, Point } from '../../gameplay/party';
import cutRecipes from '../../../../shared/cut-recipes.json';
import {constrainCut} from '../../gameplay/cutGesture';
import { paintDrawing } from '../../gameplay/drawing';
import styles from './Drawing.module.css';

export function Drawing({party,identity,active,isFr,send}: {
    party:PartyState; identity:string; active:boolean; isFr:boolean;
    send:(action:string,data?:{points:Point[];side?:number})=>void;
}) {
    const target=party.drawing?.target||(['reveal','done'].includes(party.phase)?party.drawing?.history.slice(-1)[0]?.target:undefined),recipe=cutRecipes.recipes.find(r=>r.id===target?.recipe),axis=target?.axis;
    const cut=party.id==='decoupe', locked=party.answered.includes(identity), reveal=['reveal','done'].includes(party.phase);
    const enabled=active && party.phase==='drawpath' && !locked;
    const surface=useRef<HTMLCanvasElement>(null), path=useRef<Point[]>([]), pointer=useRef<number|null>(null);
    const [points,setPoints]=useState<Point[]>([]), [side,setSide]=useState(1), [sent,setSent]=useState(false);
    const latest=useRef({party,points,side}); latest.current={party,points,side};
    const phaseStarted=useRef(performance.now());
    useEffect(()=>{phaseStarted.current=performance.now();},[party.phase]);
    useEffect(()=>{
        const canvas=surface.current; if(!canvas)return;

        const render=(now:number)=>{
            const size=Math.round(canvas.getBoundingClientRect().width*Math.min(2,devicePixelRatio||1));
            if(canvas.width!==size){canvas.width=size;canvas.height=size;}
            const ctx=canvas.getContext('2d'), data=latest.current;
            if(ctx)paintDrawing(ctx,data.party.drawing,identity,size,data.party.phase,data.points,data.side,
                matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-phaseStarted.current)/500));

        };return startGameLoop(render);
    },[identity]);
    useEffect(()=>{const cancel=()=>{if(pointer.current===null)return;pointer.current=null;path.current=[];setPoints([]);},background=()=>{if(document.hidden||document.documentElement.dataset.appActive==='false')cancel();};window.addEventListener('blur',cancel);window.addEventListener('slaptax:app-state',background);document.addEventListener('visibilitychange',background);return()=>{window.removeEventListener('blur',cancel);window.removeEventListener('slaptax:app-state',background);document.removeEventListener('visibilitychange',background);};},[]);
    function position(e:PointerEvent<HTMLCanvasElement>):Point {
        const r=e.currentTarget.getBoundingClientRect();
        // Four decimals keep a full stroke below the shared socket's 4 KB limit.
        const normalized=(v:number)=>Math.round(Math.max(0,Math.min(1,v))*10000)/10000;
        return [normalized((e.clientX-r.x)/r.width),normalized((e.clientY-r.y)/r.height)];
    }
    function down(e:PointerEvent<HTMLCanvasElement>) {
        if(!enabled||sent||e.button!==0||pointer.current!==null)return;
        e.preventDefault(); const p=position(e);
        if(cut&&points.length===2){const [a,b]=points,chosen=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>=0?1:-1;setSide(chosen);if(intersects){setSent(true);send('lock',{points,side:chosen});}return;}
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
        setPoints(cut?constrainCut(path.current[0],p,axis):[...path.current]);
    }
    function up(e:PointerEvent<HTMLCanvasElement>) {
        if(pointer.current!==e.pointerId)return;
        move(e);pointer.current=null;
        if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
        if(enabled&&!cut){const p=path.current.length<2?[...path.current,path.current[0]]:path.current;setSent(true);send('lock',{points:p});}
    }
    const entry=party.drawing?.history[(party.drawing?.history.length||1)-1];
    const ownResult=entry?.results[identity];
    const celebration=reveal && ownResult && !ownResult.expired ? cut ? ownResult.error===0 ? (isFr?'PILE DANS LA CIBLE !':'RIGHT ON TARGET!') : (ownResult.error??100)<=2 ? (isFr?'TOUT PRÈS DU PARFAIT !':'SO CLOSE TO PERFECT!') : '' : ownResult.score>=980 ? (isFr?'TRACÉ DE MAÎTRE !':'MASTER STROKE!') : '' : '';
    const intersects=cut&&points.length===2&&party.drawing?.target?.polygon?.some((p)=>{
        const [a,b]=points;return ((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))>0;
    })&&party.drawing?.target?.polygon?.some((p)=>{
        const [a,b]=points;return ((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))<0;
    })&&Math.hypot(points[0][0]-points[1][0],points[0][1]-points[1][1])>=.05;
    return <section className={styles.game} data-testid="drawing" data-phase={party.phase}>
        <header><span>{reveal ? (isFr?'REVELATION':'THE REVEAL'):party.phase==='observe'?(isFr?'MEMORISE':'REMEMBER'):party.phase==='prepare'?(isFr?'PRET ?':'READY?'):cut?(isFr?'PROPORTION CIBLE':'TARGET PORTION'):(isFr?'A TOI DE TRACER':'YOUR STROKE')}
            {cut&&target&&<b>{target.percent}%</b>}</span><strong>{Math.ceil(party.remaining/1000)}<small> s</small></strong></header>
        {cut&&<div className={styles.order} data-testid="cut-order" data-axis={axis||'free'} data-recipe={target?.recipe||'legacy'}><b>{isFr?(recipe?.labelFr||'Commande du chef'):(recipe?.labelEn||'Chef’s order')}</b><span>{axis==='vertical'?(isFr?'↕ Coupe verticale guidée':'↕ Guided vertical cut'):axis==='diagonal'?(isFr?'↘ Coupe diagonale guidée':'↘ Guided diagonal cut'):(isFr?'✂ Coupe libre':'✂ Free cut')} · {party.attempt}/3</span></div>}
        <div className={styles.board} data-reveal={reveal}>
            <canvas ref={surface} data-testid="drawing-canvas" aria-label={isFr?(cut?'Surface de decoupe':'Surface de dessin'):(cut?'Cutting surface':'Drawing surface')}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={e=>{if(pointer.current!==e.pointerId)return;pointer.current=null;path.current=[];setPoints([]);}} onLostPointerCapture={e=>{if(pointer.current!==e.pointerId)return;pointer.current=null;path.current=[];setPoints([]);}} />
            {['ready','prepare'].includes(party.phase)&&<div className={styles.overlay}><strong>{party.phase==='prepare'?Math.max(1,Math.ceil(party.remaining/1000)):'...'}</strong></div>}
            {locked&&!reveal&&<div className={styles.locked}><Check size={18}/>{isFr?'Trait verrouille':'Stroke locked'}</div>}
        </div>
        <div className={styles.caption} role="status">
            {reveal?<><i/>{isFr?'TOI':'YOU'}{Object.keys(party.scores).length>1&&<><i data-rival/>RIVAL</>}<i data-target/>{isFr?'CIBLE':'TARGET'}</>:party.phase==='observe'?<><Eye size={18}/>{isFr?'2 SECONDES':'2 SECONDS'}</>:cut?<><Scissors size={18}/>{points.length===2?(isFr?'TOUCHE LE MORCEAU À SERVIR':'TAP THE PIECE TO SERVE'):(isFr?'UNE LIGNE':'ONE LINE')}</>:<><Pencil size={18}/>{isFr?'UN SEUL TRAIT':'ONE STROKE'}</>}
        </div>
        {cut&&reveal&&ownResult&&!ownResult.expired&&<p className={styles.coach} data-testid="cut-coach">{(ownResult.error??100)<=2?(isFr?'Le chef approuve !':'Chef approved!'):(ownResult.percent??0)>(entry?.target.percent??0)?(isFr?'Trop généreux ! Garde un morceau plus petit.':'Too generous! Keep a smaller piece.'):(isFr?'Le chef a encore faim ! Garde un morceau plus grand.':'Chef is still hungry! Keep a larger piece.')}</p>}
        {celebration&&<div className={styles.celebration} role="status">✦ {celebration} ✦</div>}
        {cut&&<div className={styles.menuProgress} data-testid="cut-menu-progress" aria-label={isFr?'Les trois commandes':'Three orders'}>{cutRecipes.recipes.map((r,i)=>{const result=party.drawing?.history[i]?.results[identity];return <span key={r.id} data-current={party.attempt===i+1}><b>{i+1} · {isFr?r.labelFr:r.labelEn}</b><small>{result?(result.expired?(isFr?'Temps écoulé':'Time up'):`${result.percent}% · ${result.error} ${isFr?'pts d’écart':'pts off'}`):(isFr?'À cuisiner':'To cook')}</small></span>;})}</div>}
        {reveal?<div className={styles.results}>{Object.entries(entry?.results||{}).map(([id,result])=><div key={id} data-rival={id!==identity}>
            <span>{id===identity?(isFr?'TOI':'YOU'):'RIVAL'}</span><strong>{result.expired?'--':cut?`${result.percent}%`:`${(result.score/10).toFixed(1)}%`}</strong>
            <small>{result.expired?(isFr?'EXPIRE':'EXPIRED'):cut?`${result.error} ${isFr?'pts d ecart':'pts off'}`:(isFr?'FIDELITE':'ACCURACY')}</small>
        </div>)}</div>:cut?<div className={styles.actions}>
            <button type="button" disabled={!enabled||sent||!points.length} onClick={()=>{path.current=[];setPoints([]);}} aria-label={isFr?'Recommencer la ligne':'Reset line'} title={isFr?'Recommencer la ligne':'Reset line'}><RotateCcw size={20}/></button>
            <button type="button" disabled={!enabled||sent||!intersects} onClick={()=>{setSent(true);send('lock',{points,side});}}><LockKeyhole size={18}/>{locked||sent?(isFr?'Verrouille':'Locked'):(isFr?'Valider la coupe':'Lock cut')}</button>
        </div>:<div className={styles.progress}>{[0,1,2].map(i=><span key={i} data-current={party.attempt===i+1}>0{i+1}<b>{party.drawing?.history[i]?.results[identity]?`${(party.drawing.history[i].results[identity].score/10).toFixed(1)}%`:'--'}</b></span>)}</div>}
    </section>;
}
