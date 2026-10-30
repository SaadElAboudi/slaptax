import {useEffect,useRef,useState} from 'react';
import type {PartyState} from '../../gameplay/party';
import {canteenDrama} from '../../gameplay/factoryComedy';
import {gameFeedback,type GameMoment} from '../../gameplay/gameFeedback';
import {hapticPulse} from '../../hooks/useFeedbackPreferences';
import styles from './GameFeedback.module.css';
export function GameFeedback({party,identity,isFr,active}:{party?:PartyState;identity:string;isFr:boolean;active:boolean}){
 const previous=useRef<PartyState|undefined>(undefined),lastCue=useRef(0);
 const [moment,setMoment]=useState<(GameMoment&{serial:number})|null>(null);
 useEffect(()=>{
  const before=previous.current;previous.current=party;
  if(!party||!before||!active)return;
  const next=canteenDrama(before,party,identity)??gameFeedback(before,party,identity),now=performance.now();
  if(next&&now-lastCue.current>650){lastCue.current=now;setMoment({...next,serial:now});if(next.kind!=='warning')hapticPulse(next.kind==='skill'?16:10);}
 },[party,identity,active]);
 useEffect(()=>{if(!moment)return;const timer=window.setTimeout(()=>setMoment(null),1250);return()=>clearTimeout(timer);},[moment]);
 return <div className={styles.layer} role="status" aria-live="polite" aria-atomic="true">{moment&&active&&<div key={moment.serial} className={styles.toast} data-kind={moment.kind} data-testid="game-moment"><span aria-hidden="true">{moment.kind==='skill'?'✦':moment.kind==='warning'?'!':'★'}</span><div><strong>{isFr?moment.fr:moment.en}</strong>{moment.value&&<b>{moment.value}</b>}</div></div>}</div>;
}
