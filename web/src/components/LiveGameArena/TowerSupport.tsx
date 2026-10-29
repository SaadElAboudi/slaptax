import refinement from '../../../../shared/party-refinement.json';
import type {PartyRun} from '../../gameplay/party';
import styles from './TowerSupport.module.css';
export function TowerSupport({run,active,isFr,send}:{run:PartyRun|undefined;active:boolean;isFr:boolean;send:(action:string)=>void}){
 const width=run?.layers?.slice(-1)[0]?.width??refinement.tower.initialWidth,spent=!!((run?.rescues||0)+(run?.repairs||0));
 return <div className={styles.support} data-testid="tower-support" data-protected={!!run?.buoy}>
  <p role="status">{isFr?'LARGEUR':'WIDTH'} {Math.round(width/refinement.tower.initialWidth*100)} % · {run?.buoy?(isFr?'BOUÉE PRÊTE · garde-la ou répare':'LIFELINE READY · keep it or repair'):spent?(isFr?'Bouée utilisée · sécurise au bon moment':'Lifeline spent · bank wisely'):`${Math.min(refinement.tower.perfectsForBuoy,run?.perfectStreak||0)} / ${refinement.tower.perfectsForBuoy} ${isFr?'parfaits = une bouée':'perfects = a lifeline'}`}</p>
  {run?.buoy&&<button type="button" data-testid="tower-repair" disabled={!active||run.status!=='playing'||width>=refinement.tower.initialWidth-1e-9} onClick={()=>send('repair')}>{isFr?'RÉPARER · dépenser ma bouée':'REPAIR · spend my lifeline'}<small>{isFr?'Élargit de 12 % du terrain · remplace la protection':'Adds 12% of the field · replaces protection'}</small></button>}
 </div>;
}
