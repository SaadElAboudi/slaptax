import {useEffect,useRef,useState} from 'react';
import {Check,Send} from 'lucide-react';
import type {PartyState,RicochetBoard} from '../../gameplay/party';
import {paintRicochet} from '../../gameplay/ricochet';
import styles from './Ricochet.module.css';

export function Ricochet({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:{angle:number;power:number})=>void}) {
    const [angle,setAngle]=useState(0),[power,setPower]=useState(35);
    const locked=party.answered.includes(identity),enabled=active && party.phase==='aim' && !locked;
    const canvas=useRef<HTMLCanvasElement>(null);
    const state=useRef({party,angle,power});state.current={party,angle,power};
    const frames=useRef<{before?:RicochetBoard;after?:RicochetBoard;at:number}>({at:0});
    useEffect(()=>{frames.current={before:frames.current.after,after:party.board,at:performance.now()};},[party.board]);
    useEffect(()=>{
        const surface=canvas.current;if(!surface)return;
        const resize=()=>{const size=Math.round(surface.clientWidth*Math.min(2,devicePixelRatio||1));surface.width=size;surface.height=size;};
        resize();const observer=new ResizeObserver(resize);observer.observe(surface);let raf=0;
        const draw=(now:number)=>{
            const ctx=surface.getContext('2d'),s=state.current,f=frames.current,t=Math.min(1,(now-f.at)/50);
            let board=f.after;
            if(board && s.party.phase==='flight') board={...board,pucks:board.pucks.map((p)=>{
                const prev=f.before?.pucks.find((v)=>v.id===p.id);return prev ? {...p,x:prev.x+(p.x-prev.x)*t,y:prev.y+(p.y-prev.y)*t}:p;
            })};
            if(ctx)paintRicochet(ctx,board,identity,surface.width,surface.height,s.party.phase==='aim' ? {angle:s.angle,power:s.power}:undefined);
            raf=requestAnimationFrame(draw);
        };
        raf=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(raf);observer.disconnect();};
    },[identity]);
    function aim(e:React.PointerEvent<HTMLCanvasElement>) {
        if(!enabled)return;
        const origin=party.board?.origins[identity];if(!origin)return;
        const flipped=Object.keys(party.board!.origins).indexOf(identity)===1;
        const p=flipped ? {x:600-origin.x,y:600-origin.y}:origin,rect=e.currentTarget.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width*600,y=(e.clientY-rect.top)/rect.height*600;
        setAngle(Math.round(Math.max(-70,Math.min(70,Math.atan2(x-p.x,p.y-y)*180/Math.PI))));
    }
    return <section className={styles.game} data-testid="ricochet" data-phase={party.phase}>
        <header><span>{party.phase==='flight' ? (isFr ? 'PALets EN JEU'.toUpperCase() : 'PUCKS IN PLAY') : party.phase==='reveal' ? (isFr ? 'PLUS PRES DU CENTRE' : 'CLOSER TO CENTER') : locked ? (isFr ? 'TIR VERROUILLE' : 'SHOT LOCKED') : (isFr ? 'CHOISIS TON ANGLE' : 'PICK YOUR ANGLE')}</span><b>{Math.ceil(party.remaining/1000)} s</b></header>
        <canvas ref={canvas} data-testid="ricochet-canvas" aria-label={isFr ? 'Plateau de Ricochet' : 'Ricochet board'}
            onPointerDown={(e)=>{if(!enabled || e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);aim(e);}}
            onPointerMove={(e)=>{if(e.currentTarget.hasPointerCapture(e.pointerId))aim(e);}}
            onPointerUp={(e)=>{if(e.currentTarget.hasPointerCapture(e.pointerId)){aim(e);e.currentTarget.releasePointerCapture(e.pointerId);}}}/>
        <div className={styles.standing}>{Object.entries(party.scores).map(([id,score])=><span key={id}>{id===identity ? (isFr ? 'TOI':'YOU'):'RIVAL'} <b>{score ? ((10000-score)/10).toFixed(1):'--'}</b></span>)}</div>
        <div className={styles.controls}>
            <label>Angle <input type="range" min="-70" max="70" value={angle} disabled={!enabled} onChange={(e)=>setAngle(Number(e.target.value))}/><output>{angle}&deg;</output></label>
            <label>{isFr ? 'Puissance':'Power'}<input type="range" min="1" max="100" value={power} disabled={!enabled} onChange={(e)=>setPower(Number(e.target.value))}/><output>{power}</output></label>
        </div>
        <button type="button" disabled={!enabled} onClick={()=>send('shoot',{angle,power})}>{locked ? <Check size={18}/>:<Send size={18}/>} {locked ? (isFr ? 'Tir verrouille':'Shot locked') : (isFr ? 'Verrouiller le tir':'Lock shot')}</button>
    </section>;
}
