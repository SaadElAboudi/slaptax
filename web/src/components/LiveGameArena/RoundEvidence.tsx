import { useEffect, useRef } from 'react';
import type { PartyMoment } from '../../gameplay/party';
import { paintDrawing } from '../../gameplay/drawing';
import styles from './RoundEvidence.module.css';
import { GardeHistory } from './Garde';
import { MatBoard } from './Mat';

export function RoundEvidence({moment,userId,isFr}:{moment:PartyMoment;userId:string;isFr:boolean}) {
    const canvas=useRef<HTMLCanvasElement>(null),state=moment.replay[moment.replay.length-1]?.state;
    useEffect(()=>{
        const c=canvas.current?.getContext('2d');if(!c)return;
        (state?.drawing?.history||[]).forEach((entry,i)=>{c.save();c.translate(i*200,0);paintDrawing(c,{history:[entry]},userId,190,'done');c.restore();});
    },[moment,userId]);
    if(moment.gameId==='mat'&&state?.mat)return <div className={styles.evidence} data-testid="round-evidence"><div style={{maxWidth:280,margin:'auto'}}><MatBoard state={state.mat} isFr={isFr}/></div><div className={styles.legend}>{moment.players.map(id=>{const r=state.mat?.results?.[id];return <span key={id}>{id===userId?(isFr?'TOI':'YOU'):'RIVAL'} : {r?.mate?'MAT':r?.expired?(isFr?'EXPIRE':'EXPIRED'):(isFr?'MANQUE':'MISSED')} {r?.ms!=null?`${(r.ms/1000).toFixed(2)} s`:''} {r?.move||''}</span>;})}</div></div>;
    if(moment.gameId==='garde' && state?.garde)return <div className={styles.evidence} data-testid="round-evidence"><GardeHistory game={state.garde} identity={userId} isFr={isFr}/></div>;
    if(['trace','decoupe'].includes(moment.gameId))return <div className={styles.evidence} data-testid="round-evidence">
        <canvas ref={canvas} width={600} height={190} aria-label={isFr?'Les trois essais compares':'Three attempts compared'}/>
        <div className={styles.legend}><span>{isFr?'TOI':'YOU'}</span><span>RIVAL</span><span>{isFr?'CIBLE':'TARGET'}</span></div>
    </div>;
    if(moment.gameId==='chroma')return <div className={styles.evidence} data-testid="round-evidence"><div className={styles.swatches}>
        {[{label:isFr?'CIBLE':'TARGET',rgb:state?.feedback.color},...moment.players.map(id=>({label:id===userId?(isFr?'TOI':'YOU'):'RIVAL',rgb:state?.feedback.colors?.[id]}))].map(({label,rgb})=><div key={label}><i style={{background:rgb?`rgb(${rgb.join(',')})`:'#384348'}}/><span>{label}</span></div>)}
    </div></div>;
    if(moment.gameId==='onesecond')return <div className={styles.evidence} data-testid="round-evidence">{(moment.targets||[]).map((target,i)=><div className={styles.clock} key={i}>
        <span>{target/1000}s</span><div><i/>{moment.players.map(id=>{const duration=moment.runs[id]?.durations?.[i];return duration==null?null:<b key={id} data-rival={id!==userId} style={{left:`${50+Math.max(-45,Math.min(45,(duration-target)/20))}%`}}/>;})}</div>
        <small>{moment.runs[userId]?.errors?.[i]??'--'} ms</small>
    </div>)}</div>;
    if(moment.gameId==='contrepied')return <div className={styles.evidence} data-testid="round-evidence"><div className={styles.cards}>{state?.contrepied?.history.map(entry=><div key={entry.exchange} data-won={entry.winnerId===userId}><span>+{entry.reward}</span><b>{entry.cards[userId]} / {entry.cards[moment.players.find(id=>id!==userId)||'']}</b><small>{entry.winnerId===null?'--':entry.winnerId===userId?(isFr?'TOI':'YOU'):'RIVAL'}</small></div>)}</div></div>;
    return null;
}
