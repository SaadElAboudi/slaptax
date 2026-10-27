import {useEffect,useRef,useState} from 'react';
import {ArrowUp,MoveUpRight} from 'lucide-react';
import type {PartyState,TableState} from '../../../gameplay/party';
import {paintTable} from './paintTable';
import styles from './Table.module.css';
type Aim={dx:number;dy:number;power:number};
export function Table({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data:{dx:number;dy:number;power:number})=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),pointer=useRef<number|null>(null),[aim,setAim]=useState<Aim|null>(null);
 const latest=useRef({party,aim,isFr}),history=useRef<TableState[]>([]),replay=useRef<{frames:TableState[];start:number}|null>(null);latest.current={party,aim,isFr};
 const received=useRef({state:party.table,at:performance.now()});
 if(received.current.state!==party.table)received.current={state:party.table,at:performance.now()};
 const own=party.table?.bodies.find(p=>p.id===identity),enabled=active&&party.phase==='brawl'&&!own?.out;
 useEffect(()=>{if(!party.table)return;
  if(party.phase==='done'&&!replay.current)replay.current={frames:[...history.current,structuredClone(party.table)],start:performance.now()};
  else if(party.phase==='brawl'){history.current.push(structuredClone(party.table));history.current=history.current.slice(-30);}
 },[party.table,party.phase]);
 useEffect(()=>{
  const c=canvas.current;if(!c)return;let raf=0;
  const resize=()=>{c.width=Math.max(1,Math.round(c.clientWidth*Math.min(2,devicePixelRatio||1)));c.height=c.width;};resize();
  const observer=new ResizeObserver(resize);observer.observe(c);
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function draw(now:number){const ctx=c!.getContext('2d'),s=latest.current;if(ctx&&s.party.table){let state=s.party.table;
   if(s.party.phase==='done'&&replay.current?.frames.length){const r=replay.current;const frame=Math.max(0,Math.min(r.frames.length-1,Math.floor((now-r.start)/40)));state=r.frames[frame];if(frame===r.frames.length-1){const age=Math.max(0,now-r.start-frame*40);state={...state,bodies:state.bodies.map(p=>p.out?{...p,fallAge:p.fallAge+age}:p),lastHit:state.lastHit?{...state.lastHit,age:state.lastHit.age+age}:null};}}
   else{const age=Math.min(150,Math.max(0,now-received.current.at));state={...state,bodies:state.bodies.map(p=>p.out?{...p,fallAge:p.fallAge+age}:p),lastHit:state.lastHit?{...state.lastHit,age:state.lastHit.age+age}:null};}
   ctx.save();ctx.scale(c!.width/600,c!.height/600);paintTable(ctx,state,identity,s.party.phase==='brawl'?s.aim:null,now,s.isFr,motion.matches);ctx.restore();
  }raf=requestAnimationFrame(draw);}
  raf=requestAnimationFrame(draw);return()=>{observer.disconnect();cancelAnimationFrame(raf);};
 },[identity]);
 function position(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*600};}
 function update(e:React.PointerEvent<HTMLCanvasElement>){if(pointer.current!==e.pointerId||!own)return;const p=position(e),dx=p.x-own.x,dy=p.y-own.y,d=Math.hypot(dx,dy);setAim({dx:dx/(d||1),dy:dy/(d||1),power:Math.min(1,d/130)});}
 function fire(next:Aim){if(enabled&&(own?.cooldown||0)<=0)send('dash',next);setAim(null);}
 const opponents=party.table?.bodies.filter(p=>p.id!==identity&&!p.out).length||0;
 return <section className={styles.game} data-testid="table-game" data-phase={party.phase}>
  <header><strong>{party.phase==='done'?(isFr?'LE DERNIER CHOC':'THE FINAL BUMP'):own?.out?(isFr?'PLOUF !':'SPLASH!'):`${opponents} ${isFr?'adversaire(s) sur la table':'rival(s) on the table'}`}</strong><span>{Math.ceil(party.remaining/1000)} s</span></header>
  <div className={styles.board}><canvas ref={canvas} data-testid="table-canvas" data-player-x={own?.x} data-player-y={own?.y} data-opponents={opponents} tabIndex={0} aria-label={isFr?'Table de jeu. Glisse depuis ton personnage. Flèches pour viser, espace pour te propulser.':'Game table. Drag from your character. Arrow keys aim, space dashes.'}
   onPointerDown={e=>{if(!enabled||!own||e.button!==0)return;const p=position(e);if(Math.hypot(p.x-own.x,p.y-own.y)>85)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);setAim({dx:0,dy:-1,power:0});}}
   onPointerMove={update} onPointerUp={e=>{if(pointer.current!==e.pointerId||!own)return;const p=position(e),dx=p.x-own.x,dy=p.y-own.y,d=Math.hypot(dx,dy);pointer.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(d>12)fire({dx:dx/d,dy:dy/d,power:Math.min(1,d/130)});else setAim(null);}}
   onPointerCancel={()=>{pointer.current=null;setAim(null);}}
   onKeyDown={e=>{const a:Record<string,Aim>={ArrowUp:{dx:0,dy:-1,power:.8},ArrowDown:{dx:0,dy:1,power:.8},ArrowLeft:{dx:-1,dy:0,power:.8},ArrowRight:{dx:1,dy:0,power:.8}};if(a[e.key]){e.preventDefault();setAim(a[e.key]);}else if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();fire(aim||{dx:0,dy:-1,power:.8});}}}/>
   {party.phase==='done'&&<span className={styles.replay}>{isFr?'REPLAY · DERNIÈRES SECONDES':'REPLAY · LAST SECONDS'}</span>}
  </div>
  <p className={styles.hint}><MoveUpRight size={18}/>{isFr?'Glisse depuis ton perso. Relâche. BOUM !':'Drag from your character. Release. BOOM!'}</p>
  <div className={styles.footer}><span>{party.table?.bodies.some(p=>p.bot)?(isFr?'SOLO CONTRE 3 BOTS':'SOLO VS 3 BOTS'):(isFr?'DUEL · 2 JOUEURS HUMAINS':'DUEL · 2 HUMAN PLAYERS')}</span><button type="button" disabled={!enabled||(own?.cooldown||0)>0} onClick={()=>fire(aim||{dx:0,dy:-1,power:.8})}><ArrowUp size={18}/>{(own?.cooldown||0)>0?(isFr?'Recharge…':'Recharging…'):(isFr?'Se propulser':'Dash')}</button></div>
  {party.table?.cloth?.phase!=='calm'&&party.table?.cloth&&<p className={styles.warning} data-testid="table-cloth">{party.table.cloth.direction>0?'→':'←'} {party.table.cloth.phase==='warning'?(isFr?'ATTENTION AU COUP DE NAPPE !':'TABLECLOTH PULL INCOMING!'):(isFr?'QUI A TIRÉ LA NAPPE ?!':'WHO PULLED THE TABLECLOTH?!')}</p>}
  {(party.table?.elapsed||0)>10000&&party.phase==='brawl'&&<p className={styles.warning}>{isFr?'La table rétrécit. Rapproche-toi du centre !':'The table is shrinking. Get closer to the center!'}</p>}
 </section>;
}
