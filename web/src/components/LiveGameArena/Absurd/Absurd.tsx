import {startGameLoop} from '../../../gameplay/gameLoop';
import {gameCanvasContext} from '../../../gameplay/canvasResolution';
import {useEffect,useRef,useState} from 'react';
import type {PartyState} from '../../../gameplay/party';
import {visualAbsurd} from '../../../gameplay/absurd';
import {paintAbsurd} from './paintAbsurd';
import styles from '../Carnival/Carnival.module.css';
type Data={x:number}|{lane:number};
export function Absurd({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:Data)=>void}){
 const [flight,setFlight]=useState(.5);
 const canvas=useRef<HTMLCanvasElement>(null),sent=useRef(0),pointer=useRef<number|null>(null),s=party.absurd,p=s?.bodies.find(p=>p.id===identity),pigeon=party.id==='pigeon',enabled=active&&party.phase==='brawl',fr=isFr;
 const latest=useRef({s,enabled,fr}),sampledAt=useRef(performance.now()),lanes=useRef(new Map<string,{from:number;to:number;at:number}>());latest.current={s,enabled,fr};
 useEffect(()=>{
  const now=performance.now();sampledAt.current=now;
  for(const body of s?.bodies||[]){const old=lanes.current.get(body.id);if(!old)lanes.current.set(body.id,{from:body.lane,to:body.lane,at:now});else if(old.to!==body.lane){const t=Math.max(0,Math.min(1,(now-old.at)/140)),from=old.from+(old.to-old.from)*(1-(1-t)**3);lanes.current.set(body.id,{from,to:body.lane,at:now});}}
 },[s]);
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(now:number)=>{const state=latest.current,c=gameCanvasContext(canvas.current,600,440);if(c&&state.s){const animate=state.enabled&&!motion.matches;paintAbsurd(c,animate?visualAbsurd(state.s,now-sampledAt.current,lanes.current,now):state.s,identity,state.fr,motion.matches);}};
  return startGameLoop(draw);
 },[identity]);
 useEffect(()=>{if(p)setFlight((p.x-50)/500);},[p?.slot]);
 useEffect(()=>{if(!enabled)pointer.current=null;},[enabled]);
 function steer(e:React.PointerEvent<HTMLCanvasElement>,force=false){if(!enabled||!pigeon||(!force&&performance.now()-sent.current<80))return;const r=e.currentTarget.getBoundingClientRect(),w=Math.min(r.width,r.height*600/440),left=r.left+(r.width-w)/2,x=Math.max(0,Math.min(1,((e.clientX-left)/w*600-50)/500));setFlight(x);send('steer',{x});sent.current=performance.now();}
 function keyboard(e:React.KeyboardEvent<HTMLDivElement>){
  if(!enabled||['INPUT','BUTTON','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;
  const key=e.key.toLowerCase();
  if(pigeon&&['arrowleft','arrowright','a','q','d'].includes(key)){e.preventDefault();const x=Math.max(0,Math.min(1,flight+(['arrowleft','a','q'].includes(key)?-.07:.07)));setFlight(x);send('steer',{x});}
  else if(!pigeon&&['1','2','3'].includes(key)){e.preventDefault();send('lane',{lane:Number(key)-1});}

  else if(!e.repeat&&[' ','j'].includes(key)){e.preventDefault();send(pigeon?'drop':'prout');}
 }
 return <div className={styles.game} data-testid="absurd-game" tabIndex={0} onKeyDown={keyboard}>
  <div className={styles.scores}>{s?.bodies.map(q=><span key={q.id}>{q.id===identity?(fr?'TOI':'YOU'):q.bot?'BOT':'RIVAL'} <b>{q.score}</b></span>)}<strong>{Math.ceil(party.remaining/1000)} s</strong></div>
  <canvas ref={canvas} tabIndex={0} width={600} height={440} data-testid={`${party.id}-canvas`} style={{touchAction:pigeon?'none':'auto'}} aria-label={pigeon?(fr?'Pilote ton pigeon en glissant le doigt':'Slide to fly your pigeon'):(fr?'Trois places dans un ascenseur piégé':'Three spots in a trapped elevator')} onPointerDown={e=>{if(!pigeon||!enabled||!e.isPrimary||e.button!==0)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steer(e,true);}} onPointerMove={e=>{if(pointer.current===e.pointerId)steer(e);}} onPointerUp={()=>pointer.current=null} onPointerCancel={()=>pointer.current=null}/>
  {pigeon?<>
   <p className={styles.tip}>{fr?'Glisse pour voler. Le viseur montre la chute, la silhouette rose la voiture dans 0,9 s. Fais-les coïncider !':'Slide to fly. Match the landing sight with the pink car silhouette 0.9 s ahead!'}</p>
   <div className={styles.actions}><button disabled={!enabled||!!p?.cooldown} onClick={()=>send('drop')}>{(fr?'LARGUE !':'DROP!')+(p?.cooldown?` · ${(p.cooldown/1000).toFixed(1)} s`:'')}</button></div>
   <div className={styles.refinement} data-testid="pigeon-streak">{fr?'PLEIN CENTRE':'BULLSEYE'} ×{p?.deliveryStreak||0}</div>
   <p className={styles.note}>{fr?'Voiture rose : des points. Voiture jaune : évite-la !':'Pink car: points. Yellow car: avoid it!'}</p>
  </>:<>
   <p className={styles.tip} data-testid="lift-prompt">{p?.confirmed?(fr?'Place choisie. Tu peux encore changer !':'Spot picked. You can still switch!'):(fr?'Choisis une place à CHAQUE passage pour marquer !':'Pick a spot EVERY wave to score!')}</p>
   <div className={styles.actions} style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>{[0,1,2].map(lane=><button key={lane} disabled={!enabled||!!p?.cooldown} aria-pressed={p?.lane===lane&&!!p.confirmed} onClick={()=>send('lane',{lane})}>{fr?['GAUCHE','MILIEU','DROITE'][lane]:['LEFT','MIDDLE','RIGHT'][lane]}</button>)}</div>
   <div className={styles.actions} style={{marginTop:8,gridTemplateColumns:'1fr'}}><button disabled={!enabled||!p?.ammo||!!p?.proutCooldown} onClick={()=>send('prout')}>{fr?'PROUT CIBLÉ !':'TARGETED FART!'} <small>{p?.ammo||0} / 2 · {fr?'2 haricots = 1 recharge':'2 beans = 1 recharge'}{p?.proutCooldown?` · ${(p.proutCooldown/1000).toFixed(1)} s`:''}</small></button></div>
   <p className={styles.note}>{fr?'Nuage vert = danger · haricot = bonus · contour rouge = piège du pote.':'Green cloud = danger · bean = bonus · red border = friend’s trap.'}</p>
  </>}
  <p className={styles.keyboardHint}>{pigeon?(fr?'← → ou A/D : voler · Espace : larguer':'← → or A/D: fly · Space: drop'):(fr?'1 / 2 / 3 : choisir une place · Espace : prout':'1 / 2 / 3: pick a spot · Space: fart')}</p>
  <footer>{s?.bodies.some(q=>q.bot)?(fr?'SOLO CONTRE UN BOT':'SOLO VS ONE BOT'):(fr?'DUEL · DEUX HUMAINS':'DUEL · TWO HUMANS')}</footer>
 </div>;
}
