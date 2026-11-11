import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import type {PartyState} from '../../gameplay/party';
import {startGameLoop} from '../../gameplay/gameLoop';
import {createStage} from '../../gameplay/cinematic/stage';
import styles from './Survival.module.css';
export type StageProjection=((x:number,y:number)=>{x:number;y:number}|null)|null;
export function CinematicStage({party,identity,botIds=[],kind='race',projection,onReady,aim,snapshot}:{party:PartyState;identity:string;botIds?:string[];kind?:'race'|'table';projection?:MutableRefObject<StageProjection>;onReady?:(ready:boolean)=>void;aim?:{dx:number;dy:number;power:number}|null;snapshot?:()=>PartyState}){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef({party,botIds,aim,snapshot}),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);latest.current={party,botIds,aim,snapshot};
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;let stage:ReturnType<typeof createStage>;
  try{stage=createStage(canvas,kind,identity,latest.current.party,latest.current.botIds);}catch{setFailed(true);onReady?.(false);return;}
  let disposed=false,stop=()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer:coarse)');let last=0,frames=0,slowFrames=0;
  stage.ready.then(()=>{if(disposed)return;if(projection)projection.current=stage.project;onReady?.(true);setReady(true);
   stop=startGameLoop(now=>{if(coarse.matches&&now-last<32)return;const gap=last?now-last:0;last=now;stage.render(latest.current.snapshot?.()||latest.current.party,latest.current.botIds,now,reduced.matches,latest.current.aim);canvas.dataset.frames=String(++frames);slowFrames=gap>100?slowFrames+1:Math.max(0,slowFrames-1);if(Number(canvas.dataset.renderMs)>180||slowFrames>=5){stop();if(projection)projection.current=null;setFailed(true);onReady?.(false);stage.dispose();disposed=true;}});
  }).catch(()=>{if(!disposed){setFailed(true);onReady?.(false);}});
  const lost=(e:Event)=>{e.preventDefault();stop();setFailed(true);if(projection)projection.current=null;onReady?.(false);};canvas.addEventListener('webglcontextlost',lost);
  return()=>{const alreadyDisposed=disposed;disposed=true;stop();canvas.removeEventListener('webglcontextlost',lost);if(projection)projection.current=null;if(!alreadyDisposed)stage.dispose();onReady?.(false);};
 },[kind,identity]);
 return <canvas ref={ref} className={styles.stageCanvas} data-testid={`${kind}-scene-3d`} data-renderer={failed?'fallback':ready?'webgl':'warming'} aria-hidden="true" style={failed?{display:'none'}:{opacity:ready?1:0}}/>;
}
