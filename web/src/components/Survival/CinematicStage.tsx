import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import type {PartyState} from '../../gameplay/party';
import {startGameLoop} from '../../gameplay/gameLoop';
import {createStage} from '../../gameplay/cinematic/stage';
import styles from './Survival.module.css';
export type StageProjection=((x:number,y:number)=>{x:number;y:number}|null)|null;
export function CinematicStage({party,identity,botIds=[],kind='race',projection,onReady,aim,snapshot,isFr=true}:{party:PartyState;identity:string;botIds?:string[];kind?:'race'|'table';projection?:MutableRefObject<StageProjection>;onReady?:(ready:boolean)=>void;aim?:{dx:number;dy:number;power:number}|null;snapshot?:()=>PartyState;isFr?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null),latest=useRef({party,botIds,aim,snapshot}),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[quality,setQuality]=useState(0),[attempt,setAttempt]=useState(0);
 latest.current={party,botIds,aim,snapshot};
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  setFailed(false);setReady(false);setQuality(0);
  let stage:ReturnType<typeof createStage>|undefined,disposed=false,stop=()=>{};
  const fallback=()=>{stop();if(projection)projection.current=null;setFailed(true);setReady(false);onReady?.(false);};
  try{stage=createStage(canvas,kind,identity,latest.current.party,latest.current.botIds);}catch{fallback();return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer:coarse)');let last=0,frames=0,slowFrames=0,level=0;
  stage.ready.then(()=>{if(disposed||!stage)return;if(projection)projection.current=stage.project;onReady?.(true);setReady(true);
   stop=startGameLoop(now=>{
    const interval=level===2?66:level===1?50:coarse.matches?32:0;
    if(now-last<interval)return;
    const gap=last?now-last:0;last=now;
    try{stage!.render(latest.current.snapshot?.()||latest.current.party,latest.current.botIds,now,(reduced.matches||document.documentElement.dataset.reduceMotion==='true'),latest.current.aim);}catch{fallback();return;}
    canvas.dataset.frames=String(++frames);
    // Shader startup and a single delayed frame must never replace the scene with 2D.
    // Sustained pressure reduces resolution and cadence while keeping the same 3D scene.
    const cost=Number(canvas.dataset.renderMs);
    slowFrames=frames>3&&(cost>65||gap>110)?slowFrames+1:Math.max(0,slowFrames-1);
    if(level<2&&slowFrames>=6){stage!.reduceQuality(++level);setQuality(level);canvas.dataset.quality=String(level);slowFrames=0;}
   });
  }).catch(()=>{if(!disposed)fallback();});
  const lost=(e:Event)=>{e.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',lost);
  return()=>{disposed=true;stop();canvas.removeEventListener('webglcontextlost',lost);if(projection)projection.current=null;stage?.dispose();onReady?.(false);};
 },[kind,identity,attempt]);
 return <><canvas key={attempt} ref={ref} className={styles.stageCanvas} data-testid={`${kind}-scene-3d`} data-renderer={failed?'fallback':ready?'webgl':'warming'} aria-hidden="true" style={failed?{display:'none'}:{opacity:ready?1:0}}/>
  <div className={styles.renderStatus} data-testid="scene-render-status" role="status"><span>{failed?(isFr?'Vue légère · 3D indisponible':'Light view · 3D unavailable'):ready?(quality?(isFr?'3D · qualité adaptée':'3D · adaptive quality'):(isFr?'ARÈNE 3D':'3D ARENA')):(isFr?'Préparation de la 3D…':'Preparing 3D…')}</span>{failed&&<button type="button" onClick={()=>setAttempt(n=>n+1)}>{isFr?'Réessayer la 3D':'Retry 3D'}</button>}</div>
 </>;
}
