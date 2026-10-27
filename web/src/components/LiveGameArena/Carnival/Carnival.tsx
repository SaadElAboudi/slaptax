import {gameCanvasContext} from '../../../gameplay/canvasResolution';
import {useEffect,useRef,useState} from 'react';
import type {PartyState} from '../../../gameplay/party';
import {visualCarnival} from '../../../gameplay/carnival';
import {paintCarnival} from './paintCarnival';
import styles from './Carnival.module.css';
type Props={party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:{aim:number}|{serial:number})=>void};
export function Carnival({party,identity,active,isFr,send}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),[aim,setAim]=useState(.5);
 const hold=useRef<{serial:number;pointer:number|null}|null>(null);
 const s=party.carnival,p=s?.bodies.find(p=>p.id===identity),pie=party.id==='pie',enabled=active&&party.phase==='brawl';
 const latest=useRef({send,s,enabled,aim,isFr});latest.current={send,s,enabled,aim,isFr};
 const sampledAt=useRef(performance.now());
 useEffect(()=>{sampledAt.current=performance.now();},[s]);
 useEffect(()=>{
  let frame=0;const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(now:number)=>{const state=latest.current,c=gameCanvasContext(canvas.current,600,420);if(c&&state.s){const age=state.enabled&&!motion.matches?Math.max(0,Math.min(100,now-sampledAt.current)):0;paintCarnival(c,visualCarnival(state.s,age),identity,state.isFr,pie?state.aim:undefined,motion.matches);}frame=requestAnimationFrame(draw);};
  frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[identity,pie]);
 function stop(){const previous=hold.current;if(!previous)return;hold.current=null;latest.current.send('bank',{serial:previous.serial});}
 function start(pointer:number|null){if(!enabled||!p||p.cooldown||hold.current)return;hold.current={serial:p.serial,pointer};send('inflate',{serial:p.serial});}
 useEffect(()=>{
  const pointerEnd=(e:PointerEvent)=>{if(hold.current?.pointer===e.pointerId)stop();};
  const timer=setInterval(()=>{const h=hold.current,state=latest.current;if(h&&state.enabled)state.send('inflate',{serial:h.serial});},180);
  const visibility=()=>{if(document.hidden)stop();};window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',visibility);
  return()=>{clearInterval(timer);window.removeEventListener('pointerup',pointerEnd);window.removeEventListener('pointercancel',pointerEnd);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',visibility);hold.current=null;};
 },[]);
 useEffect(()=>{if(!enabled||(hold.current&&hold.current.serial!==p?.serial))hold.current=null;},[enabled,p?.serial]);
 const label=(fr:string,en:string)=>isFr?fr:en;
 return <div className={styles.game} data-testid="carnival-game">
  <div className={styles.scores}>{s?.bodies.map(q=><span key={q.id}>{q.id===identity?label('TOI','YOU'):q.bot?'BOT':'RIVAL'} <b>{q.score}</b></span>)}<strong>{Math.ceil(party.remaining/1000)} s</strong></div>
  <canvas ref={canvas} width={600} height={420} data-testid={`${party.id}-canvas`} onPointerDown={e=>{if(!pie||!enabled||p?.cooldown||e.button!==0||!e.isPrimary)return;e.preventDefault();const r=e.currentTarget.getBoundingClientRect(),w=Math.min(r.width,r.height*600/420),left=r.left+(r.width-w)/2,value=Math.max(0,Math.min(1,((e.clientX-left)/w*600-70)/460));setAim(value);send('throw',{aim:value});}} style={pie?{touchAction:'manipulation'}:undefined} aria-label={pie?label('Bataille de tartes : vise le rival en haut','Pie fight: aim at the rival above'):label('Ballons : ton ballon à gauche','Balloons: your balloon on the left')}/>
  <p className={styles.tip}>{pie?label('Touche devant sa tête pour lancer. Anticipe les 0,35 s de vol !','Tap ahead of their face to throw. Lead the 0.35 s flight!'):label('Maintiens pour gonfler. Relâche pour encaisser. Dès 70 %, ça peut péter !','Hold to pump. Release to bank. Above 70%, it could pop!')}</p>
  {pie?<>
   <label className={styles.aim}>{label('VISÉE','AIM')}<input type="range" min="0" max="1" step="0.005" value={aim} onChange={e=>setAim(Number(e.target.value))} aria-label={label('Viser la tarte','Aim pie')} disabled={!enabled}/></label>
   <div className={styles.actions}><button disabled={!enabled||!!p?.cooldown} onClick={()=>send('throw',{aim})}>{p?.cooldown?`${label('TARTE','PIE')} · ${(p.cooldown/1000).toFixed(1)} s`:label('ENTARTE !','THROW PIE!')}</button><button disabled={!enabled||!!p?.duckCooldown} onClick={()=>send('duck')}>{p?.duckCooldown?`${label('ESQUIVE','DUCK')} · ${(p.duckCooldown/1000).toFixed(1)} s`:label('ESQUIVE !','DUCK!')}</button></div>
   <p className={styles.note} data-testid="carnival-power">{p?.revenge?label('GROSSE TARTE PRÊTE · prochaine touche +100 !','MEGA PIE READY · next hit +100!'):p?.combo?`${p.combo} ${label('touches de suite · bonus combo','hits in a row · combo bonus')}`:label('100 pts la touche · 200 en plein centre + combo','100 per hit · 200 bullseye + combo')}</p>
  </>:<>
   <div className={styles.actions}><button className={styles.pump} disabled={!enabled||!!p?.cooldown} onPointerDown={e=>{if(e.button!==0||!e.isPrimary||hold.current)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);start(e.pointerId);}} onPointerUp={e=>{if(hold.current?.pointer===e.pointerId)stop();}} onPointerCancel={e=>{if(hold.current?.pointer===e.pointerId)stop();}} onLostPointerCapture={e=>{if(hold.current?.pointer===e.pointerId)stop();}} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();start(null);}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();stop();}}} onBlur={stop}>{label('GONFLE…','PUMP…')}<small>{(p?.volume||0)>=10?`${label('relâche','release')} = +${Math.round((p?.volume||0)**2/20)}`:label('relâche = points','release = points')}</small></button><button disabled={!enabled||(p?.score||0)<25||!!p?.pokeCooldown||(s?.bodies.find(q=>q.id!==identity)?.volume||0)<10} onClick={()=>send('poke')}>{label('COUP DE POMPE !','SNEAKY PUMP!')}<small>{p?.pokeCooldown?`${(p.pokeCooldown/1000).toFixed(1)} s`:label('−25 pts · rival +12 %','−25 pts · rival +12%')}</small></button></div>
   <p className={styles.note} data-testid="carnival-power">{p?.shield?label('CASQUE PASSOIRE · le prochain sabotage est bloqué !','COLANDER HELMET · next sabotage blocked!'):label('Encaisse à 70 % ou plus : gagne un casque anti-sabotage.','Bank at 70% or above: earn an anti-sabotage helmet.')}</p>
  </>}
  <footer>{s?.bodies.some(q=>q.bot)?label('SOLO CONTRE UN BOT','SOLO VS ONE BOT'):label('DUEL · DEUX HUMAINS','DUEL · TWO HUMANS')}</footer>
 </div>;
}
