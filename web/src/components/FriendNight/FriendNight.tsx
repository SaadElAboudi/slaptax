import playlist from '../../../../shared/friend-night.json' with {type:'json'};
import type {PartyState} from '../../gameplay/party';
import {gameLabel} from '../../gameplay/catalog';
import {SnackPortrait} from '../LiveGameArena/Snack/SnackPortrait';
import styles from './FriendNight.module.css';
export type NightResult={gameId:string;points:Record<string,number>;raw:Record<string,number>;feats:Record<string,Record<string,number>>};
export type NightMember={id:string;name:string;character:string;team:number;online:boolean};
export type NightRoom={code:string;mode:'heist'|'night';host:string;phase:string;round:number;stage:number;gameId:string;scores:Record<string,number>;results:NightResult[];startAt:number;disconnectUntil:number;reason:string;votes:string[];players:NightMember[];party:PartyState|null;at:number};
export {playlist as NIGHT_PLAYLIST};
export function nightTitle(room:NightRoom,id:string,fr:boolean){
 const feat=(game:string,key:string)=>room.results.find(r=>r.gameId===game)?.feats[id]?.[key]||0;
 if(feat('snack','interceptions')>0)return fr?'Voleur de goûters':'Snack thief';
 if(feat('pie','dodges')>0)return fr?'Intouchable à la crème':'Cream dodger';
 if(feat('pie','hits')>0)return fr?'Pâtissier de combat':'Combat baker';
 if(feat('onemore','bank')>0)return fr?'Architecte prudent':'Careful architect';
 if(feat('onemore','level')>0)return fr?'Le bloc de trop':'One block too far';
 return fr?'La revanche lui va bien':'Born for the rematch';
}
export function NightJourney({room,fr}:{room:NightRoom;fr:boolean}){
 return <ol className={styles.journey} aria-label={fr?'Les trois manches':'Three rounds'}>{playlist.map((g,i)=><li key={g.id} aria-current={i===room.stage?'step':undefined} data-done={i<room.results.length}><b>{i<room.results.length?'✓':i+1}</b><span>{fr?g.fr:g.en}</span></li>)}</ol>;
}
export function NightStandings({room,identity,fr,onNext,onShare}:{room:NightRoom;identity:string;fr:boolean;onNext:()=>void;onShare:()=>void}){
 const done=room.phase==='done',valid=room.reason==='finished',ranked=[...room.players].sort((a,b)=>(room.scores[b.id]||0)-(room.scores[a.id]||0)),best=room.scores[ranked[0]?.id]||0;
 const leaders=ranked.filter(p=>(room.scores[p.id]||0)===best);
 return <section className={styles.standings} data-testid="night-standings">
  <span>{done?(fr?'LE VERDICT DES POTES':'THE FRIENDS’ VERDICT'):(fr?`MANCHE ${room.stage+1} TERMINÉE`:`ROUND ${room.stage+1} COMPLETE`)}</span>
  <h2>{!valid?(fr?'On reprend une autre fois ?':'Another time?'):done?leaders.length===1?`${leaders[0].name} ${fr?'règne sur la soirée !':'rules tonight!'}`:(fr?'La couronne se partage !':'Share the crown!'):(fr?'Même salon. Nouvelle crasse.':'Same room. New tricks.')}</h2>
  {!valid&&<p>{fr?'La connexion a interrompu la manche. Points conservés pour les manches terminées, sans désigner de champion.':'The round was interrupted. Completed-round points remain, with no champion declared.'}</p>}
  <div className={styles.table} role="table" aria-label={fr?'Classement de la soirée':'Night standings'}>
   <div role="row" className={styles.tableHead}><span role="columnheader">{fr?'JOUEUR':'PLAYER'}</span>{playlist.map((g,i)=><span role="columnheader" title={fr?g.fr:g.en} key={g.id}>{i+1}</span>)}<span role="columnheader">PTS</span></div>
   {ranked.map(p=><div role="row" key={p.id} data-self={p.id===identity}><span role="cell"><SnackPortrait character={p.character}/><strong>{p.name}{p.id===identity?(fr?' · toi':' · you'):''}</strong></span>{playlist.map(g=><span role="cell" key={g.id}>{room.results.find(r=>r.gameId===g.id)?.points[p.id]??'—'}</span>)}<b role="cell">{room.scores[p.id]||0}</b></div>)}
  </div>
  <p>{fr?'Victoire : 3 points · égalité : 1 chacun · défaite : 0. Chaque manche compte.':'Win: 3 points · tie: 1 each · loss: 0. Every round counts.'}</p>
  {done&&valid&&<div className={styles.titles}>{ranked.map(p=><article key={p.id}><strong>{p.name}</strong><span>{nightTitle(room,p.id,fr)}</span></article>)}</div>}
  {!done&&<p className={styles.next}>{fr?'À SUIVRE':'UP NEXT'} · {fr?playlist[room.stage+1]?.fr:playlist[room.stage+1]?.en}<small>{fr?playlist[room.stage+1]?.tipFr:playlist[room.stage+1]?.tipEn}</small></p>}
  <button type="button" disabled={room.votes.includes(identity)||room.players.some(p=>!p.online)} onClick={onNext}>{room.votes.includes(identity)?(fr?'Tu es prêt !':'You’re ready!'):done?(fr?'Revanche à quatre':'Four-friend rematch'):(fr?'Prêt pour la suite':'Ready for the next round')} · {room.votes.length}/4</button>
  {room.players.some(p=>!p.online)&&<p role="status">{fr?'En attente de reconnexion : ':'Waiting for: '}{room.players.filter(p=>!p.online).map(p=>p.name).join(', ')}</p>}
  {done&&valid&&<button type="button" onClick={onShare}>{fr?'Partager le bilan':'Share the results'}</button>}
  {room.results.length>0&&<details><summary>{fr?'Les vrais faits de gloire':'The real highlights'}</summary>{room.results.map(r=><div key={r.gameId}><h3>{gameLabel(r.gameId,fr)}</h3>{room.players.map(p=>{const f=r.feats[p.id]||{};return <p key={p.id}><b>{p.name}</b> · {r.gameId==='snack'?`${f.captures||0} ${fr?'livraisons':'deliveries'}, ${f.interceptions||0} ${fr?'interceptions':'steals'}`:r.gameId==='pie'?`${f.hits||0} ${fr?'tartes réussies':'pies landed'}, ${f.dodges||0} ${fr?'esquives':'dodges'}`:`${f.bank||0} ${fr?'blocs sécurisés':'blocks banked'} (${f.level||0} ${fr?'posés':'placed'})`}</p>;})}</div>)}</details>}
 </section>;
}
