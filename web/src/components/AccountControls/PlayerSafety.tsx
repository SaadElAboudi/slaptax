import {useState} from 'react';
import {api,type UserListEntry} from '../../api/client';
import {useGameStore} from '../../hooks/useGameStore';
export function PlayerSafety(){
 const {userId,clientId,language}=useGameStore(),fr=language==='fr';
 const [open,setOpen]=useState(false),[players,setPlayers]=useState<UserListEntry[]>([]),[target,setTarget]=useState(''),[blocked,setBlocked]=useState<string[]>([]),[reason,setReason]=useState('name'),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function load(){setOpen(true);if(!userId)return;try{const [users,safety]=await Promise.all([api.listUsers(userId,clientId),api.playerSafety({userId,clientId,action:'list'})]);setPlayers(users.users.filter(u=>u.id!==userId));setBlocked(safety.blockedUsers);}catch{setNotice(fr?'Impossible de charger les joueurs.':'Unable to load players.');}}
 async function act(action:'block'|'unblock'|'report'){if(!userId||!target||busy)return;setBusy(true);try{const result=await api.playerSafety({userId,clientId,targetId:target,action,reason});setBlocked(result.blockedUsers);setNotice(action==='report'?(fr?'Signalement enregistré pour examen par le support.':'Report recorded for support review.'):(fr?'Préférence enregistrée.':'Preference saved.'));}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
 return <div><button type="button" onClick={()=>open?setOpen(false):void load()}>{fr?'Signaler ou bloquer un joueur':'Report or block a player'}</button>{open&&<>
 <label>{fr?'Joueur':'Player'}<select aria-label={fr?'Joueur':'Player'} value={target} onChange={e=>setTarget(e.target.value)}><option value="">{fr?'Choisir un joueur':'Choose a player'}</option>{players.map(p=><option key={p.id} value={p.id}>{p.playerName} · {p.id.slice(0,6)}</option>)}</select></label>
 <label>{fr?'Motif':'Reason'}<select aria-label={fr?'Motif':'Reason'} value={reason} onChange={e=>setReason(e.target.value)}>{[['name','Pseudo inapproprié','Inappropriate name'],['harassment','Harcèlement','Harassment'],['cheating','Triche','Cheating'],['other','Autre','Other']].map(([id,frText,enText])=><option key={id} value={id}>{fr?frText:enText}</option>)}</select></label>
 <button type="button" disabled={!target||busy} onClick={()=>void act('report')}>{fr?'Envoyer le signalement':'Submit report'}</button>
 <button type="button" disabled={!target||busy} onClick={()=>void act(blocked.includes(target)?'unblock':'block')}>{blocked.includes(target)?(fr?'Débloquer':'Unblock'):(fr?'Bloquer les prochains duels':'Block future duels')}</button>
 <p>{fr?'Le blocage empêche les prochains duels directs et rencontres rapides. Il ne termine pas une partie en cours.':'Blocking prevents future direct duels and quick matches. It does not end a current match.'}</p>
 </>}{notice&&<p role="status">{notice}</p>}</div>;
}
