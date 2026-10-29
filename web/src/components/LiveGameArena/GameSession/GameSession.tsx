import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {gameControls} from '../../../gameplay/gameControls';
import {gameTip,gameWorld} from '../../../gameplay/gameExperience';
import styles from './GameSession.module.css';
/** One viewport for every mini-game; the same component serves web and native. */
export function GameSession({children,gameId,title,isFr,onExit,exitLabel}:{children:ReactNode;gameId:string;title:string;isFr:boolean;onExit?:()=>void;exitLabel?:string}){
 const [help,setHelp]=useState(false),[touch,setTouch]=useState(()=>matchMedia('(pointer:coarse)').matches);
 const frame=useRef<HTMLDivElement>(null),helpButton=useRef<HTMLButtonElement>(null),helpId=useId();
 useEffect(()=>{const media=matchMedia('(pointer:coarse)'),changed=()=>setTouch(media.matches);media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);},[]);
 const focusScene=()=>{if(!matchMedia('(pointer:fine)').matches||helpButton.current?.getAttribute('aria-expanded')==='true')return false;const target=frame.current?.querySelector<HTMLElement>('[data-testid="absurd-game"], [data-testid="carnival-game"], canvas[tabindex], [data-testid="garde"], [data-testid="bomb-track"], [data-testid="stack-canvas"]');const control=target?.closest<HTMLElement>('button')||target;if(!control)return false;control.focus({preventScroll:true});return document.activeElement===control;};
 useEffect(()=>{
  const previous=document.body.style.overflow,app=document.getElementById('root'),wasInert=app?.inert;document.body.style.overflow='hidden';if(app)app.inert=true;
  let focused=false;const attempt=()=>{if(!focused&&focusScene()){focused=true;observer.disconnect();}};const observer=new MutationObserver(attempt);if(frame.current)observer.observe(frame.current,{childList:true,subtree:true});const timer=window.setTimeout(attempt,100);
  return()=>{clearTimeout(timer);observer.disconnect();document.body.style.overflow=previous;if(app)app.inert=!!wasInert;};
 },[]);
 return createPortal(<div className={styles.session} data-game-session={gameId} data-touch={touch} ref={frame} onKeyDown={e=>{if(e.key==='Escape'&&help){e.preventDefault();setHelp(false);focusScene();}}}>
  <header className={styles.header}><div><small>{gameWorld(gameId,isFr)}</small><h2>{title}</h2></div><nav><button ref={helpButton} aria-expanded={help} aria-controls={helpId} onClick={()=>{if(help)requestAnimationFrame(()=>{focusScene();});setHelp(v=>!v);}}>{isFr?'Commandes':'Controls'} <span aria-hidden="true">?</span></button>{onExit&&<button aria-label={exitLabel||(isFr?'Quitter l exercice':'Exit practice')} onClick={onExit}>{isFr?'Quitter':'Exit'}</button>}</nav></header>
  {help&&<aside id={helpId} className={styles.help} aria-label={isFr?'Aide de jeu':'Game help'}><strong>{gameControls(gameId,isFr,touch)}</strong><p>{gameTip(gameId,isFr)}</p><small>{isFr?'La partie continue pendant la consultation.':'The match continues while you read.'}</small></aside>}
  <main className={styles.playfield}>{children}</main>
  <div className={styles.hint}>{gameControls(gameId,isFr,touch)}</div>
 </div>,document.body);
}
