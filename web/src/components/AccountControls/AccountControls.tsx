import {PlayerSafety} from './PlayerSafety';
import {useState} from 'react';
import {api} from '../../api/client';
import {useGameStore} from '../../hooks/useGameStore';
import styles from './AccountControls.module.css';
export function AccountControls(){
 const {userId,clientId,language}=useGameStore(),fr=language==='fr';
 const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function erase(){if(!userId||busy)return;setBusy(true);setError('');
  try{
   await api.deleteAccount(userId,clientId);
   try{for(const key of Object.keys(localStorage))if(/^slaptax[_\.]/.test(key))localStorage.removeItem(key);}catch{/* In-memory identity is reset by navigation. */}
   // Stop current sockets/intervals and show a receipt without recreating a profile.
   location.replace('/account-deleted');
  }catch{setError(fr?'La suppression a échoué. Réessaie ou contacte gignoski@gmail.com.':'Deletion failed. Try again or contact gignoski@gmail.com.');setBusy(false);}
 }
 return <section className={styles.controls}>
  <nav aria-label={fr?'Informations et confidentialité':'Information and privacy'}><a href="/privacy">{fr?'Confidentialité':'Privacy'}</a><a href="/support">Support</a><a href="/terms">{fr?'Règles et conditions':'Rules and terms'}</a></nav>
  <PlayerSafety/>
  {!confirm?<button type="button" disabled={!userId} onClick={()=>setConfirm(true)}>{fr?'Supprimer mon profil et mes données':'Delete my profile and data'}</button>:<div>
   <p>{fr?'Cette action est définitive : ton profil, ta progression et tes invitations seront supprimés. Les parties et tournois concernés seront annulés.':'This is permanent: your profile, progress and invitations will be deleted. Affected matches and tournaments will be cancelled.'}</p>
   <button type="button" disabled={busy} onClick={()=>void erase()}>{busy?(fr?'Suppression…':'Deleting…'):(fr?'Confirmer la suppression définitive':'Confirm permanent deletion')}</button>
   <button type="button" disabled={busy} onClick={()=>setConfirm(false)}>{fr?'Annuler':'Cancel'}</button>
  </div>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
