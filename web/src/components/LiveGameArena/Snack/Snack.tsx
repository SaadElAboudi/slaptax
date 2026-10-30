import {GameSession} from '../GameSession/GameSession';
import {GameFeedback} from '../GameFeedback';
import {createPortal} from 'react-dom';
import {startGameLoop} from '../../../gameplay/gameLoop';
import {useSfx} from '../../../hooks/useSfx';
import {hapticPulse,useBooleanPreference} from '../../../hooks/useFeedbackPreferences';
import {useEffect,useRef,useState} from 'react';
import type {PartyState,SnackState} from '../../../gameplay/party';
import {gameCanvasContext} from '../../../gameplay/canvasResolution';
import {previewSnackBody} from '../../../gameplay/snack';
import {paintSnack,type SnackCamera} from './paintSnack';
import styles from './Snack.module.css';
type Input={dx:number;dy:number;ax:number;ay:number};
type Props={onLeave?:()=>void;status?:string;party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data?:Input)=>void};
export function Snack({party,identity,active,isFr,send,status,onLeave}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),root=useRef<HTMLDivElement>(null),input=useRef<Input>({dx:0,dy:0,ax:1,ay:0}),keys=useRef(new Set<string>()),stick=useRef<number|null>(null);
 const [move,setMove]=useState({x:0,y:0}),[immersive,setImmersive]=useBooleanPreference('slaptax.snack.immersive',true),[desktop,setDesktop]=useState(()=>matchMedia('(min-width:901px) and (pointer:fine)').matches);
 useEffect(()=>{const media=matchMedia('(min-width:901px) and (pointer:fine)'),sync=()=>setDesktop(media.matches);media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{if(!immersive||!desktop)return;const previous=document.body.style.overflow,app=document.getElementById('root'),wasInert=app?.inert;document.body.style.overflow='hidden';if(app)app.inert=true;root.current?.focus({preventScroll:true});return()=>{document.body.style.overflow=previous;if(app)app.inert=!!wasInert;};},[immersive,desktop]);
 const s=party.snack,self=s?.bodies.find(p=>p.id===identity),rival=s?.bodies.find(p=>(p.team??p.slot)!==(self?.team??self?.slot)),enabled=active&&party.phase==='brawl'&&!!self&&!self.respawnIn;
 const chicken=!!s?.chicken;
 const {playCluck,playEgg,playSlap}=useSfx();
 const latest=useRef({s,enabled,send,isFr});latest.current={s,enabled,send,isFr};
 const frames=useRef<{previous?:SnackState;current?:SnackState;at:number}>({at:performance.now()}),cam=useRef<SnackCamera>({x:450,y:300,zoom:1}),sent=useRef(0),lastHit=useRef('');
 useEffect(()=>{if(self){input.current.ax=(self.team??self.slot)?-1:1;input.current.ay=0;}},[self?.slot]);
 useEffect(()=>{frames.current={previous:frames.current.current,current:s,at:performance.now()};},[s]);
 function transmit(force=false){const l=latest.current;if(!l.enabled)return;if(!force&&performance.now()-sent.current<65)return;
  const p=l.s?.bodies.find(p=>p.id===identity),target=p?.carrying?{x:(p.team??p.slot)?820:80,y:300}:l.s?.bodies.filter(q=>!q.respawnIn&&(q.team??q.slot)!==(p?.team??p?.slot)).sort((a,b)=>Math.hypot(a.x-(p?.x||0),a.y-(p?.y||0))-Math.hypot(b.x-(p?.x||0),b.y-(p?.y||0)))[0];
  if(p&&target){const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;input.current.ax=dx/d;input.current.ay=dy/d;}
  l.send('input',{...input.current});sent.current=performance.now();
 }
 function stop(){input.current.dx=0;input.current.dy=0;keys.current.clear();stick.current=null;setMove({x:0,y:0});if(latest.current.enabled)latest.current.send('input',{...input.current});}
 function action(){if(!latest.current.enabled)return;transmit(true);latest.current.send(latest.current.s?.box.carrier===identity?'throw':'attack');}
 useEffect(()=>{const timer=setInterval(()=>transmit(),80),blur=()=>stop(),visibility=()=>{if(document.hidden||document.documentElement.dataset.appActive==='false')stop();};
  const up=(e:KeyboardEvent)=>{keys.current.delete(e.key.toLowerCase());updateKeys();};
  window.addEventListener('blur',blur);window.addEventListener('keyup',up);document.addEventListener('visibilitychange',visibility);window.addEventListener('slaptax:app-state',visibility);
  return()=>{clearInterval(timer);window.removeEventListener('blur',blur);window.removeEventListener('keyup',up);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('slaptax:app-state',visibility);if(latest.current.enabled)latest.current.send('input',{dx:0,dy:0,ax:input.current.ax,ay:input.current.ay});};
 },[identity]);
 useEffect(()=>{if(!enabled)stop();},[enabled]);
 function updateKeys(){const k=keys.current,dx=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('q')||k.has('arrowleft')),dy=Number(k.has('s')||k.has('arrowdown'))-Number(k.has('w')||k.has('z')||k.has('arrowup'));input.current.dx=dx;input.current.dy=dy;setMove({x:dx*22,y:dy*22});transmit(true);}
 useEffect(()=>{const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(now:number)=>{const l=latest.current,f=frames.current,viewportHeight=600,c=gameCanvasContext(canvas.current,900,viewportHeight,canvas.current?.clientWidth||900);if(c&&f.current){
   const age=Math.max(0,now-f.at),t=Math.min(1,age/50),state:SnackState={...f.current,box:f.current.box.flying&&f.previous?.box.flying?{...f.current.box,x:f.previous.box.x+(f.current.box.x-f.previous.box.x)*t,y:f.previous.box.y+(f.current.box.y-f.previous.box.y)*t}:f.current.box,bodies:f.current.bodies.map(p=>{const old=f.previous?.bodies.find(q=>q.id===p.id);if(l.enabled&&p.id===identity)return previewSnackBody(p,input.current.dx,input.current.dy,age,f.current!.walls);if(!old||p.respawnIn||old.respawnIn||Math.hypot(p.x-old.x,p.y-old.y)>120)return p;return {...p,x:old.x+(p.x-old.x)*t,y:old.y+(p.y-old.y)*t};})};
   cam.current={x:450,y:300,zoom:1};
   paintSnack(c,state,identity,cam.current,l.isFr,now,motion.matches,viewportHeight);
  }};return startGameLoop(draw);
 },[identity]);
 // Each announced event is spoken once, independent of its animation age.
 const latestEvent=s?.events.slice(-1)[0],eventKey=latestEvent?`${latestEvent.at}:${latestEvent.kind}:${latestEvent.id}`:'';
 const [announcement,setAnnouncement]=useState('');
 useEffect(()=>{if(eventKey===lastHit.current||!latestEvent)return;lastHit.current=eventKey;if(chicken){if(latestEvent.kind==='pickup'||latestEvent.kind==='chicken-escape')playCluck();if(latestEvent.kind==='egg-splat')playEgg();}if(latestEvent.kind==='hit'&&(latestEvent.id===identity||latestEvent.by===identity))playSlap();const own=latestEvent.id===identity,ally=s?.bodies.find(p=>p.id===latestEvent.id)?.team===self?.team&&s?.teamMode;const actor=own?'Tu':ally?'Ton pote':'Le rival';if((own&&latestEvent.kind==='hit')||latestEvent.kind==='capture')hapticPulse(own?18:8);setAnnouncement(latestEvent.kind==='chicken-escape'?(isFr?'Le poulet se rebelle et s’échappe !':'The chicken rebels and escapes!'):latestEvent.kind==='capture'?(isFr?`${actor} ${own?'as':'a'} livré ${chicken?'un poulet royal':'un goûter'} !`:`${own?'You':'Rival'} delivered a snack!`):latestEvent.kind==='ko'?(isFr?`${actor} ${own?'es':'est'} KO.`:`${own?'You are':'Rival is'} knocked out.`):latestEvent.kind==='pickup'?(isFr?`${actor} ${own?'portes':'porte'} ${chicken?'le poulet':'le goûter'}.`:`${own?'You carry':'Rival carries'} the snack.`):'');},[eventKey,isFr,identity]);
 function pad(e:React.PointerEvent<HTMLDivElement>,down=false){
  if(!latest.current.enabled)return;
  if(down){if(e.button!==0||stick.current!==null)return;stick.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);root.current?.focus({preventScroll:true});}
  if(stick.current!==e.pointerId)return;e.preventDefault();const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.max(30,Math.hypot(x,y));input.current.dx=x/d;input.current.dy=y/d;setMove({x:x/d*26,y:y/d*26});transmit(down);
 }
 function endPad(e:React.PointerEvent<HTMLDivElement>){if(stick.current!==e.pointerId)return;stick.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);input.current.dx=0;input.current.dy=0;setMove({x:0,y:0});transmit(true);}
 const view=<div ref={root} className={`${styles.game} ${immersive?styles.immersive:''}`} data-testid="snack-game" data-variant={chicken?'chicken':'snack'} data-character={self?.character||'flan'} data-phase={party.phase} data-manual-aim={false} tabIndex={0} aria-label={chicken?(isFr?'Arène Poule Position':'Poultry Panic arena'):(isFr?'Arène Braquage du Goûter':'Snack Heist arena')} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))stop();}} onKeyDown={e=>{if(e.key==='Escape'){setImmersive(false);stop();return;}if((e.target as HTMLElement).closest('button,input,summary,a,select,textarea'))return;const key=e.key.toLowerCase();if(['w','a','s','d','z','q','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();if(!keys.current.has(key)){keys.current.add(key);updateKeys();}}else if([' ','j'].includes(key)&&!e.repeat){if((e.target as HTMLElement).tagName==='BUTTON'&&key===' ')return;e.preventDefault();action();}}}>
  <GameFeedback party={party} identity={identity} isFr={isFr} active={active}/><div className={styles.viewControls} data-has-leave={!!onLeave&&desktop}><strong>{chicken?'POULE POSITION':(isFr?'BRAQUAGE DU GOÛTER':'SNACK HEIST')}</strong><button onClick={()=>setImmersive(v=>!v)}>{immersive?(isFr?'Réduire la vue':'Compact view'):(isFr?'Agrandir la vue':'Expand view')}</button>{onLeave&&desktop&&<button onClick={onLeave}>{isFr?'Quitter le salon':'Leave room'}</button>}</div>
  <header className={styles.hud}><span aria-label={isFr?'Ton score de livraisons':'Your delivery score'}><b>{s?.teamScores?.[self?.team??self?.slot??0]??self?.captures??0}</b> / 3 <small>{s?.teamMode?(isFr?'ÉQUIPE':'TEAM'):(isFr?'TOI':'YOU')}</small></span><strong>{Math.ceil(party.remaining/1000)} s</strong><span><b>{s?.teamScores?.[rival?.team??rival?.slot??1]??rival?.captures??0}</b> / 3 <small>{s?.teamMode?(isFr?'RIVAUX':'RIVALS'):rival?.bot?'BOT':'RIVAL'}</small></span></header>
  <div className={styles.board} data-hit={!!s?.events.some(e=>e.kind==='hit'&&e.id===identity&&e.age<140)}><canvas ref={canvas} width={900} height={600} tabIndex={0} data-testid="snack-canvas" aria-label={isFr?'Arène : flèches pour bouger, espace pour baffer ou lancer vers ton dépôt.':'Arena: arrows to move, space to slap or throw to your depot.'} onPointerMove={e=>{if(e.pointerType==='touch')return;transmit();}} onPointerDown={e=>{if(e.pointerType==='touch'||e.button!==0)return;root.current?.focus({preventScroll:true});action();}}/>

   {status&&<div className={styles.connection} role="status">{status}</div>}
   {!!self?.respawnIn&&<div className={styles.respawn} role="status">{isFr?'KO · RETOUR DANS':'KO · BACK IN'} <b>{(self.respawnIn/1000).toFixed(1)} s</b></div>}
  </div>
  {chicken&&<div className={styles.chickenStatus} data-frenzy={s?.chicken?.frenzy}><strong>{self?.carrying?(isFr?'RAMÈNE-LE AU POULAILLER !':'IT’S REBELLING! THROW!'):s?.chicken?.frenzy?(isFr?'PANIQUE FINALE · PLUIE D’ŒUFS !':'FINAL FRENZY · EGG RAIN!'):(isFr?'3 POULES AU POULAILLER = VICTOIRE':'3 CHICKENS HOME = VICTORY')}</strong>{self?.carrying&&<progress aria-label={isFr?'Temps avant la fuite du poulet':'Time before the chicken escapes'} value={s?.chicken?.carryRemaining||0} max={s?.chicken?.carryLimit||8000}/>}</div>}
  <div className={styles.objective} role="status">{self?.hasted?(isFr?'SAUMURE ALLIÉE · accélération !':'FRIENDLY BRINE · speed boost!'):chicken?(self?.carrying?(isFr?'Reviens au poulailler jaune. LANCE vise pour toi.':'Return to the yellow coop. THROW aims for you.'):s?.chicken?.eggs.some(e=>!e.exploded)?(isFr?'ŒUF EN APPROCHE ! Quitte le cercle au sol.':'INCOMING EGG! Leave the ground circle.'):s?.box.carrier?(isFr?'Intercepte le porteur. Le poulet va se rebeller !':'Intercept the carrier. The chicken will rebel!'):(isFr?'Bouge vers la poule : tu l’attrapes automatiquement.':'Move to the chicken: you pick it up automatically.')):self?.slowed?(isFr?'Retourne sur le sol sec.':'Return to dry ground.'):s?.box.contested?(isFr?'Goûter disputé : repousse le rival !':'Contested snack: push the rival away!'):self?.carrying?(isFr?'Retour au dépôt jaune. LANCE vise pour toi.':'Return to the yellow depot. THROW aims for you.'):s?.box.flying?(isFr?'EN VOL ! Attrape le goûter, les bancs le font rebondir.':'IN THE AIR! Catch it; benches bounce it.') :s?.box.carrier?(s.bodies.find(p=>p.id===s.box.carrier)?.team===self?.team&&s.teamMode?(isFr?'Protège ton partenaire et démarque-toi !':'Protect your teammate and get open!'):(isFr?'Intercepte le porteur !':'Stop the carrier!')):(isFr?'Récupère la boîte au centre → ton dépôt.':'Grab the central box → your depot.')}</div>
  <div className={styles.controls} data-manual-aim={false}>
   <div className={styles.pad} role="group" aria-label={isFr?'Déplacement':'Movement'} data-testid="snack-move-pad" onPointerDown={e=>pad(e,true)} onPointerMove={e=>pad(e)} onPointerUp={endPad} onPointerCancel={endPad} onLostPointerCapture={endPad} aria-disabled={!enabled}><i style={{transform:`translate(${move.x}px,${move.y}px)`}}/><span>{isFr?'BOUGER':'MOVE'}</span></div>
   <div className={styles.buttons}><button disabled={!enabled||!!self?.attackCooldown} onClick={()=>action()}>{self?.carrying?(isFr?'LANCE !':'THROW!'):(isFr?'BAFFE !':'SLAP!')}{self?.attackCooldown?` ${(self.attackCooldown/1000).toFixed(1)}`:''}</button></div>
  </div>
  <footer><span>{s?.teamMode?(isFr?'2V2 · 4 HUMAINS · SANS MISE':'2V2 · 4 HUMANS · NO STAKES'):rival?.bot?(isFr?'ENTRAÎNEMENT · 1 BOT ANNONCÉ':'PRACTICE · 1 DECLARED BOT'):(isFr?'DUEL · 2 HUMAINS':'DUEL · 2 HUMANS')}</span></footer>
  <p className={styles.keyboardHint}>{isFr?'Flèches / ZQSD : bouger · Espace ou clic : baffe / lancer':'Arrows / WASD: move · Space or click: slap / throw'}</p>

  <span className={styles.sr} aria-live="polite">{announcement}</span>
 </div>;
 if(onLeave&&!desktop)return <GameSession gameId={chicken?'chicken':'snack'} title={chicken?'Poule Position':(isFr?'Braquage du Goûter':'Snack Heist')} isFr={isFr} onExit={onLeave} exitLabel={isFr?'Quitter le salon':'Leave room'}>{view}</GameSession>;
 return immersive&&desktop?createPortal(view,document.body):view;
}
