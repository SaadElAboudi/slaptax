import {useSfx} from '../../hooks/useSfx';
import {hapticPulse} from '../../hooks/useFeedbackPreferences';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {createCombat,stepCombat,neutral,KITS,FIELD,type Kit,type Combat,type Command} from '../../gameplay/combatArena';
import {startGameLoop} from '../../gameplay/gameLoop';
import {useGameStore} from '../../hooks/useGameStore';
import {paintCombat} from './paintCombat';
import styles from './CombatArena.module.css';
export function CombatArena(){
 const audio=useSfx(),sound=useRef(audio);sound.current=audio;
 const fr=useGameStore(s=>s.language==='fr'),[kit,setKit]=useState<Kit>('volt'),[game,setGame]=useState<Combat|null>(null),[paused,setPaused]=useState(false),[revision,refresh]=useState(0);
 const canvas=useRef<HTMLCanvasElement>(null),input=useRef<Command>(neutral()),keys=useRef(new Set<string>()),left=useRef<HTMLSpanElement>(null),right=useRef<HTMLSpanElement>(null),frames=useRef(0);
 const gesture=useRef<Record<string,number>>({}),frameTime=useRef(0),pauseRef=useRef(paused);pauseRef.current=paused;
 function clear(){input.current=neutral();keys.current.clear();gesture.current={};for(const el of[left.current,right.current])if(el)el.style.transform='';}
 function start(){void sound.current.activateAudio();clear();setPaused(false);setGame(createCombat(kit,Date.now()>>>0));}
 useEffect(()=>{if(!game)return;const el=canvas.current,ctx=el?.getContext('2d',{alpha:false});if(!el||!ctx)return;
  let width=0,height=0,last=0,accumulator=0,lastUi=0,lastCooldown=0,lastHp=game.players[0].hp,lastKills=0,lastWinner:typeof game.winner=null;frames.current=0;
  const resize=()=>{const r=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};const observer=new ResizeObserver(resize);observer.observe(el);resize();el.focus({preventScroll:true});
  const reset=()=>{clear();last=0;setPaused(true);};
  const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('button,input,textarea,select'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','z','q','e','shift'].includes(key)){e.preventDefault();if(e.type==='keydown')keys.current.add(key);else keys.current.delete(key);}};
  const visibility=()=>{if(document.hidden||document.documentElement.dataset.appActive==='false')reset();};
  window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);window.addEventListener('slaptax:app-state',visibility);
  const stop=startGameLoop(now=>{
   const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
   if(!pauseRef.current){
    const c=input.current,k=keys.current,keyboard=k.size>0;
    const command={...c};if(keyboard){command.mx=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('q')||k.has('arrowleft'));command.my=Number(k.has('s')||k.has('arrowdown'))-Number(k.has('w')||k.has('z')||k.has('arrowup'));command.fire||=k.has(' ');command.dash||=k.has('shift');command.super||=k.has('e');}
    accumulator=Math.min(.05,accumulator+elapsed);while(accumulator>=1/120){stepCombat(game,command,1/120);accumulator-=1/120;}c.dash=false;c.super=false;
   }else accumulator=0;
   const own=game.players[0];
   if(own.cooldown>lastCooldown+.02)sound.current.playSlap();
   if(own.hp<lastHp){sound.current.playEgg();hapticPulse(12);}
   if(own.kills>lastKills){sound.current.playDraw(.2);hapticPulse(18);}
   if(game.winner!==null&&lastWinner===null){if(game.winner===0)sound.current.playWin(.4);else sound.current.playLoss(.2);}
   lastCooldown=own.cooldown;lastHp=own.hp;lastKills=own.kills;lastWinner=game.winner;
   paintCombat(ctx,game,input.current,width,height,document.documentElement.dataset.reduceMotion==='true'||matchMedia('(prefers-reduced-motion: reduce)').matches);
   el.dataset.frames=String(++frames.current);el.dataset.playerX=game.players[0].x.toFixed(1);el.dataset.playerY=game.players[0].y.toFixed(1);el.dataset.shots=String(game.shots.length);el.dataset.elapsed=game.time.toFixed(2);frameTime.current=elapsed*1000;
   if(now-lastUi>100){lastUi=now;refresh(n=>n+1);}
  });
  return()=>{stop();observer.disconnect();window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('slaptax:app-state',visibility);clear();};
 },[game]);
 function stick(e:PointerEvent<HTMLDivElement>,side:'move'|'aim',ending=false){
  if(ending){if(gesture.current[side]!==e.pointerId)return;delete gesture.current[side];if(side==='move'){input.current.mx=0;input.current.my=0;}else input.current.fire=false;const el=side==='move'?left.current:right.current;if(el)el.style.transform='';return;}
  if(e.type==='pointerdown'){if(gesture.current[side]!==undefined)return;gesture.current[side]=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);}
  if(gesture.current[side]!==e.pointerId)return;
  e.preventDefault();const rect=e.currentTarget.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,len=Math.hypot(dx,dy),radius=rect.width*.32,scale=Math.min(1,len/radius),x=len?dx/len*scale:0,y=len?dy/len*scale:0;
  const el=side==='move'?left.current:right.current;if(el)el.style.transform=`translate(${x*radius}px,${y*radius}px)`;
  if(side==='move'){input.current.mx=x;input.current.my=y;}else{if(len>6){input.current.ax=x;input.current.ay=y;}input.current.fire=true;}
 }
 const p=game?.players[0],winner=game?.winner;
 const occupied=game?.players.filter(p=>p.hp>0&&Math.hypot(p.x-FIELD.zone.x,p.y-FIELD.zone.y)<FIELD.zone.r)||[];const contested=occupied.some(p=>p.team===0)&&occupied.some(p=>p.team===1);
 return <section className={styles.shell} data-testid="combat-arena" data-version={revision}>
 {!game?<div className={styles.intro}><small>{fr?'LABO DE COMBAT · CONTRE DES ROBOTS':'COMBAT LAB · BOT PRACTICE'}</small><h1>SLAP / ZONE</h1><p>{fr?'Trois contre trois. Gagne le centre, repousse l’équipe adverse. Chaque tir et chaque esquive comptent.':'Three against three. Hold the center. Push the other team back. Every shot and dodge counts.'}</p>
 <div className={styles.kits} role="group" aria-label={fr?'Choisir un combattant':'Choose a fighter'}>{(Object.keys(KITS) as Kit[]).map(id=><button key={id} type="button" className={styles.kit} aria-pressed={kit===id} onClick={()=>setKit(id)}><i className={styles.face} style={{background:KITS[id].color}} aria-hidden="true"/><strong>{KITS[id].name}</strong><span>{id==='volt'?(fr?'Rapide · tir continu':'Rapid · sustained fire'):id==='brick'?(fr?'Solide · tir dispersé':'Tank · spread shot'):(fr?'Précis · longue portée':'Precision · long range')}</span></button>)}</div>
 <button className={styles.start} type="button" onClick={start}>{fr?'Lancer le combat':'Start combat'}</button><p className={styles.notice}>{fr?'Prototype local : 2 alliés et 3 adversaires robots. Sans classement ni récompense.':'Local prototype: 2 allied bots and 3 enemy bots. No ranking or rewards.'}</p></div>:<>
 <div className={styles.board}>
 <canvas tabIndex={0} ref={canvas} className={styles.canvas} data-testid="combat-canvas" aria-label={fr?'Arène de capture de zone, équipe bleue contre équipe rose':'Zone capture arena, blue against pink'}/>
 <div className={styles.hud}><div className={styles.score}><small>{fr?'TON ÉQUIPE':'YOUR TEAM'}</small>{Math.floor(game.score[0])}%<progress value={game.score[0]} max={100} aria-label={fr?'Score de ton équipe':'Your team score'}/></div><div className={styles.clock}>{Math.max(0,Math.ceil(FIELD.limit-game.time))}<small>{game.zone===2?(contested?(fr?'ZONE DISPUTÉE':'ZONE CONTESTED'):(fr?'PRENDS LA ZONE':'TAKE THE ZONE')):game.zone===0?(fr?'ZONE BLEUE':'BLUE ZONE'):(fr?'ZONE ROSE':'PINK ZONE')}</small></div><div className={styles.score}><small>{fr?'ADVERSAIRES':'OPPONENTS'}</small>{Math.floor(game.score[1])}%<progress value={game.score[1]} max={100} aria-label={fr?'Score adverse':'Opponent score'}/></div></div>
 <button type="button" className={styles.pause} onClick={()=>{clear();setPaused(true);}}>{fr?'Pause':'Pause'}</button>
 {p&&p.hp<=0&&winner===null&&!paused&&<div className={styles.ko} role="status">{fr?'Retour dans':'Back in'} {Math.ceil(p.respawn)} s</div>}
 {!paused&&winner===null&&<div className={styles.controls}>{(['move','aim'] as const).map(side=><div key={side} role="group" aria-label={side==='move'?(fr?'Déplacement':'Movement'):(fr?'Visée et tir':'Aim and fire')} className={styles.stick} data-testid={`combat-${side}`} onPointerDown={e=>stick(e,side)} onPointerMove={e=>stick(e,side)} onPointerUp={e=>stick(e,side,true)} onPointerCancel={e=>stick(e,side,true)} onLostPointerCapture={e=>stick(e,side,true)}><b>{side==='move'?(fr?'BOUGER':'MOVE'):(fr?'VISER / TIRER':'AIM / FIRE')}</b><span ref={side==='move'?left:right} className={styles.knob}/></div>)}<div className={styles.abilities}><button type="button" disabled={!p||p.hp<=0||p.dash>0} onClick={()=>{input.current.dash=true;}}>{p&&p.dash>0?`${p.dash.toFixed(1)}s`:(fr?'Esquive':'Dash')}</button><button type="button" disabled={!p||p.hp<=0||p.charge<100} onClick={()=>input.current.super=true}>SUPER {Math.floor(p?.charge||0)}%</button></div></div>}
 {paused&&winner===null&&<div className={styles.overlay}><h2>Pause</h2><p>{fr?'La partie est arrêtée, les robots aussi.':'The match is paused, including the bots.'}</p><button className={styles.start} type="button" onClick={()=>{clear();setPaused(false);canvas.current?.focus({preventScroll:true});}}>{fr?'Reprendre le combat':'Resume combat'}</button><button className={styles.start} type="button" onClick={()=>setGame(null)}>{fr?'Changer de combattant':'Change fighter'}</button></div>}
 {winner!==null&&<div className={styles.overlay} role="status"><h2>{winner===0?(fr?'VICTOIRE':'VICTORY'):winner===1?(fr?'DÉFAITE':'DEFEAT'):(fr?'ÉGALITÉ':'DRAW')}</h2><p>{Math.floor(game.score[0])} — {Math.floor(game.score[1])}<br/>{p?.kills} KO · {p?.deaths} {fr?'retours':'respawns'}</p><button className={styles.start} type="button" onClick={start}>{fr?'Revanche':'Rematch'}</button><button className={styles.start} type="button" onClick={()=>setGame(null)}>{fr?'Changer de combattant':'Change fighter'}</button></div>}
 </div><div className={styles.status}><span>{fr?'Vie':'HP'} {Math.ceil(p?.hp||0)} / {p?KITS[p.kit].hp:0} · {p?.kills} KO</span><span>{fr?'Entraînement local · 5 robots':'Local training · 5 bots'}</span></div>
 <p className={styles.hint}>{fr?'Gauche : bouger. Droite : orienter et maintenir pour tirer. Occupe le cercle central pour marquer.':'Left: move. Right: aim and hold to fire. Hold the center circle to score.'}<br/>{fr?'Clavier : ZQSD / flèches · Espace : tirer · Maj : esquiver · E : super.':'Keyboard: WASD / arrows · Space: fire · Shift: dash · E: super.'}</p></>}
 </section>;
}
