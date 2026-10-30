import refinement from '../../../../shared/party-refinement.json';
import type {PartyRun} from '../../gameplay/party';
import styles from './TowerSupport.module.css';
export function TowerSupport({run,isFr}:{run:PartyRun|undefined;active:boolean;isFr:boolean;send:(action:string)=>void}){
 const width=run?.layers?.slice(-1)[0]?.width??refinement.tower.initialWidth,spent=!!((run?.rescues||0)+(run?.repairs||0));
 return <div className={styles.support} data-testid="tower-support" data-protected={!!run?.buoy}>
  <p role="status">{isFr?'LARGEUR':'WIDTH'} {Math.round(width/refinement.tower.initialWidth*100)} % · {run?.buoy?(isFr?'BOUÉE AUTOMATIQUE · prochaine chute protégée':'AUTOMATIC LIFELINE · next fall protected'):spent?(isFr?'Bouée utilisée · sécurise au bon moment':'Lifeline spent · bank wisely'):`${Math.min(refinement.tower.perfectsForBuoy,run?.perfectStreak||0)} / ${refinement.tower.perfectsForBuoy} ${isFr?'parfaits = une bouée':'perfects = a lifeline'}`}</p>

 </div>;
}
