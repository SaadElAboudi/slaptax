import {TowerSupport} from '../LiveGameArena/TowerSupport';
import {startGameLoop} from '../../gameplay/gameLoop';
import {useEffect,useRef} from 'react';
import {interpolateTower,paintTower,type PartyState} from '../../gameplay/party';
import styles from './StackChallenge.module.css';
export function StackChallenge({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),snapshot=useRef({party,at:performance.now()});
 useEffect(()=>{snapshot.current={party,at:performance.now()};},[party]);
 useEffect(()=>{const draw=(now:number)=>{const c=canvas.current,run=snapshot.current.party.runs[identity];if(c&&!document.hidden){const d=Math.min(2,devicePixelRatio||1),r=c.getBoundingClientRect(),w=Math.round(r.width*d),h=Math.round(r.height*d);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const ctx=c.getContext('2d');if(ctx)paintTower(ctx,interpolateTower(run,now-snapshot.current.at),w,h);} };return startGameLoop(draw);},[identity]);
 const run=party.runs[identity],enabled=active&&party.phase==='stack'&&run?.status==='playing';
 return <div className={styles.game} data-testid="stack-challenge"><header><span>{isFr?'TA TOUR':'YOUR TOWER'} <b>{run?.level||0}</b></span><strong>{Math.ceil(party.remaining/1000)} s</strong></header><button className={styles.board} disabled={!enabled||(run?.motion?.ageMs||0)<180} aria-label={isFr?'Poser le bloc':'Drop block'} onClick={()=>send('drop')}><canvas ref={canvas} data-testid="stack-canvas" data-level={run?.level||0}/></button><TowerSupport run={run} active={!!enabled} isFr={isFr} send={send}/><button className={styles.bank} disabled={!enabled||!run?.level} onClick={()=>send('bank')}>{isFr?'Sécuriser ma tour':'Bank my tower'} · {run?.level||0}</button></div>;
}
