import {useEffect,useRef,useState} from 'react';
import type {PartyState,ToiletState} from '../../../gameplay/party';
import {paintToilet} from './paintToilet';
import styles from './Toilet.module.css';
export function Toilet({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:{dx:number;dy:number})=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),target=useRef<{x:number;y:number}|null>(null),keys=useRef(new Set<string>()),pointer=useRef<number|null>(null),sentAt=useRef(0);
 const latest=useRef({party,active,isFr,send});latest.current={party,active,isFr,send};
 const frames=useRef<{before?:ToiletState;after?:ToiletState;at:number}>({at:0});
 useEffect(()=>{frames.current={before:frames.current.after,after:party.toilet,at:performance.now()};},[party.toilet]);
 const [holding,setHolding]=useState(false),own=party.toilet?.bodies.find(p=>p.id===identity),enabled=active&&party.phase==='brawl';
 useEffect(()=>{
  const surface=canvas.current;if(!surface)return;let frame=0;const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const resize=()=>{surface.width=Math.max(1,Math.round(surface.clientWidth*Math.min(2,devicePixelRatio||1)));surface.height=surface.width;};resize();const observer=new ResizeObserver(resize);observer.observe(surface);
  const draw=(now:number)=>{const ctx=surface.getContext('2d'),s=latest.current;if(ctx&&s.party.toilet){ctx.save();ctx.scale(surface.width/600,surface.height/600);const f=frames.current,t=Math.max(0,Math.min(1,(now-f.at)/50)),state={...s.party.toilet,bodies:s.party.toilet.bodies.map(p=>{const prev=f.before?.bodies.find(q=>q.id===p.id);return prev&&Math.hypot(p.x-prev.x,p.y-prev.y)<100?{...p,x:prev.x+(p.x-prev.x)*t,y:prev.y+(p.y-prev.y)*t}:p;})};paintToilet(ctx,state,identity,now,s.isFr,motion.matches);ctx.restore();}frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[identity]);
 function stop(){target.current=null;keys.current.clear();pointer.current=null;setHolding(false);latest.current.send('steer',{dx:0,dy:0});}
 function drive(force=false){const s=latest.current;if(!s.active||s.party.phase!=='brawl')return;const now=performance.now();if(!force&&now-sentAt.current<70)return;const p=s.party.toilet?.bodies.find(p=>p.id===identity);if(!p)return;
  let dx=Number(keys.current.has('ArrowRight'))-Number(keys.current.has('ArrowLeft')),dy=Number(keys.current.has('ArrowDown'))-Number(keys.current.has('ArrowUp'));
  if(target.current){dx=target.current.x-p.x;dy=target.current.y-p.y;const d=Math.hypot(dx,dy);dx=d<8?0:dx/Math.max(50,d);dy=d<8?0:dy/Math.max(50,d);}
  if(target.current||keys.current.size){s.send('steer',{dx,dy});sentAt.current=now;}
 }
 useEffect(()=>{
  const timer=window.setInterval(drive,80),blur=()=>stop();window.addEventListener('blur',blur);const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[identity]);
 function position(e:React.PointerEvent<HTMLCanvasElement>,immediate=false){const r=e.currentTarget.getBoundingClientRect();target.current={x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*600};drive(immediate);}
 const state:ToiletState|undefined=party.toilet,boost=()=>{if(enabled&&(own?.cooldown||0)<=0){drive(true);send('boost');}};
 return <section className={styles.game} data-testid="toilet-game" data-phase={party.phase}>
  <header><div><strong>{isFr?'BRAQUAGE DE CANARDS':'RUBBER DUCK HEIST'}</strong><span>{isFr?'Le plus de canards en 25 secondes.':'Most ducks in 25 seconds wins.'}</span></div><b>{Math.ceil(party.remaining/1000)} s</b></header>
  <div className={styles.board}><canvas ref={canvas} tabIndex={0} data-testid="toilet-canvas" data-player-x={own?.x} data-player-y={own?.y} data-loot={own?.loot||0} aria-label={isFr?'Pilote ta toilette. Maintiens ton doigt et glisse. Flèches pour rouler, espace pour le prout turbo.':'Drive your toilet. Hold and drag. Arrow keys steer, space uses fart turbo.'}
   onPointerDown={e=>{if(!enabled||e.button!==0)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);position(e,true);setHolding(true);}}
   onPointerMove={e=>{if(pointer.current===e.pointerId)position(e);}} onPointerUp={e=>{if(pointer.current===e.pointerId)stop();}} onPointerCancel={stop}
   onKeyDown={e=>{if(!enabled)return;if(e.key.startsWith('Arrow')){e.preventDefault();keys.current.add(e.key);drive();setHolding(true);}else if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();boost();}}}
   onKeyUp={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();keys.current.delete(e.key);if(!keys.current.size)stop();else drive();}}}/>
   {state?.flush==='warning'&&<span className={styles.alert}>{isFr?'⚠ LA CHASSE ARRIVE !':'⚠ FLUSH INCOMING!'}</span>}
   {state?.flush==='flush'&&<span className={styles.alert} data-flush="true">{isFr?'ÇA ASPIRE ! ÉLOIGNE-TOI DU TROU !':'SUCTION! GET AWAY FROM THE DRAIN!'}</span>}
  </div>
  <div className={styles.controls}><div><strong>{own?.loot||0} 🦆</strong><span>{own?.stunned?(isFr?'PLOUF ! Repars vite !':'SPLASH! Get going!'):holding?(isFr?'Ça roule !':'Rolling!'):(isFr?'Maintiens et glisse pour rouler':'Hold and drag to drive')}</span></div><button type="button" data-testid="toilet-boost" disabled={!enabled||own?.stunned||(own?.cooldown||0)>0} onClick={boost}>{(own?.cooldown||0)>0?`${((own?.cooldown||0)/1000).toFixed(1)} s`:(isFr?'PROUT TURBO !':'FART TURBO!')}</button></div>
  <p className={styles.mode}>{state?.bodies.some(p=>p.bot)?(isFr?'SOLO · CONTRE 3 BOTS':'SOLO · VS 3 BOTS'):(isFr?'DUEL · 2 HUMAINS':'DUEL · 2 HUMANS')} · {state?.golden?(isFr?'CANARDS DORÉS = 3 !':'GOLD DUCKS = 3!'):(isFr?'Turbo + collision = vole un canard !':'Turbo + collision = steal a duck!')}</p>
 </section>;
}
