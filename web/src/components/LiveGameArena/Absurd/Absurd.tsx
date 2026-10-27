import {gameCanvasContext} from '../../../gameplay/canvasResolution';
import {useEffect,useRef,useState} from 'react';
import type {PartyState} from '../../../gameplay/party';
import {paintAbsurd} from './paintAbsurd';
import styles from '../Carnival/Carnival.module.css';
type Data={x:number}|{lane:number};
export function Absurd({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:Data)=>void}){
 const [flight,setFlight]=useState(.5);
 const canvas=useRef<HTMLCanvasElement>(null),sent=useRef(0),pointer=useRef<number|null>(null),s=party.absurd,p=s?.bodies.find(p=>p.id===identity),pigeon=party.id==='pigeon',enabled=active&&party.phase==='brawl',fr=isFr;
 useEffect(()=>{const c=gameCanvasContext(canvas.current,600,440);if(c&&s)paintAbsurd(c,s,identity,fr,matchMedia('(prefers-reduced-motion: reduce)').matches);},[s,identity,fr]);
 useEffect(()=>{if(p)setFlight((p.x-50)/500);},[p?.slot]);
 useEffect(()=>{if(!enabled)pointer.current=null;},[enabled]);
 function steer(e:React.PointerEvent<HTMLCanvasElement>,force=false){if(!enabled||!pigeon||(!force&&performance.now()-sent.current<80))return;const r=e.currentTarget.getBoundingClientRect(),w=Math.min(r.width,r.height*600/440),left=r.left+(r.width-w)/2,x=Math.max(0,Math.min(1,((e.clientX-left)/w*600-50)/500));setFlight(x);send('steer',{x});sent.current=performance.now();}
 return <div className={styles.game} data-testid="absurd-game">
  <div className={styles.scores}>{s?.bodies.map(q=><span key={q.id}>{q.id===identity?(fr?'TOI':'YOU'):q.bot?'BOT':'RIVAL'} <b>{q.score}</b></span>)}<strong>{Math.ceil(party.remaining/1000)} s</strong></div>
  <canvas ref={canvas} width={600} height={440} data-testid={`${party.id}-canvas`} style={{touchAction:pigeon?'none':'auto'}} aria-label={pigeon?(fr?'Pilote ton pigeon en glissant le doigt':'Slide to fly your pigeon'):(fr?'Trois places dans un ascenseur piégé':'Three spots in a trapped elevator')} onPointerDown={e=>{if(!pigeon||!enabled||!e.isPrimary||e.button!==0)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steer(e,true);}} onPointerMove={e=>{if(pointer.current===e.pointerId)steer(e);}} onPointerUp={()=>pointer.current=null} onPointerCancel={()=>pointer.current=null}/>
  {pigeon?<>
   <p className={styles.tip}>{fr?'Glisse pour voler. Vise la voiture rose, anticipe le vent et les 0,9 s de chute !':'Slide to fly. Aim for the pink car; lead the wind and 0.9 s fall!'}</p>
   <label className={styles.aim}>{fr?'PILOTAGE':'FLIGHT'}<input type="range" min="0" max="1" step="0.01" value={flight} disabled={!enabled} aria-label={fr?'Piloter le pigeon':'Fly pigeon'} onChange={e=>{const x=Number(e.target.value);setFlight(x);send('steer',{x});}}/></label>
   <div className={styles.actions}><button disabled={!enabled||!!p?.cooldown} onClick={()=>send('drop')}>{(fr?'LARGUE !':'DROP!')+(p?.cooldown?` · ${(p.cooldown/1000).toFixed(1)} s`:'')}</button><button disabled={!enabled||!!p?.shieldCooldown} onClick={()=>send('umbrella')}>{(fr?'PARASOL !':'UMBRELLA!')+(p?.shieldCooldown?` · ${(p.shieldCooldown/1000).toFixed(1)} s`:'')}</button></div>
   <p className={styles.note}>{fr?'Rival : +100 ou +180 au centre · ta voiture : −50 · parasol : 0,65 s.':'Rival: +100 or +180 bullseye · own car: −50 · umbrella: 0.65 s.'}</p>
  </>:<>
   <p className={styles.tip} data-testid="lift-prompt">{p?.confirmed?(fr?'Place choisie. Tu peux encore changer !':'Spot picked. You can still switch!'):(fr?'Choisis une place à CHAQUE passage pour marquer !':'Pick a spot EVERY wave to score!')}</p>
   <div className={styles.actions} style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>{[0,1,2].map(lane=><button key={lane} disabled={!enabled||!!p?.cooldown} aria-pressed={p?.lane===lane&&!!p.confirmed} onClick={()=>send('lane',{lane})}>{fr?['GAUCHE','MILIEU','DROITE'][lane]:['LEFT','MIDDLE','RIGHT'][lane]}</button>)}</div>
   <div className={styles.actions} style={{marginTop:8,gridTemplateColumns:'1fr'}}><button disabled={!enabled||!p?.ammo||!!p?.proutCooldown} onClick={()=>send('prout')}>{fr?'PROUT CIBLÉ !':'TARGETED FART!'} <small>{p?.ammo||0} / 2 · {fr?'2 haricots = 1 recharge':'2 beans = 1 recharge'}{p?.proutCooldown?` · ${(p.proutCooldown/1000).toFixed(1)} s`:''}</small></button></div>
   <p className={styles.note}>{fr?'Nuage vert = danger · haricot = bonus · contour rouge = piège du pote.':'Green cloud = danger · bean = bonus · red border = friend’s trap.'}</p>
  </>}
  <footer>{s?.bodies.some(q=>q.bot)?(fr?'SOLO CONTRE UN BOT':'SOLO VS ONE BOT'):(fr?'DUEL · DEUX HUMAINS':'DUEL · TWO HUMANS')}</footer>
 </div>;
}
