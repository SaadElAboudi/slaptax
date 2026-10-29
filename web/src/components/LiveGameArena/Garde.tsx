import {GameBuddy} from '../GameBuddy/GameBuddy';
import { Banana, Heart, LockKeyhole, Shield, Swords, Zap, Minus } from 'lucide-react';
import type { GardeAction, GardeState, PartyState } from '../../gameplay/party';
import styles from './Garde.module.css';

const icons = { prank:Banana, attack:Swords, charge:Zap, defend:Shield, miss:Minus };
export const gardeLabel = (action:GardeAction,isFr:boolean) => ({prank:isFr?'Banane':'Banana',attack:isFr?'Attaque':'Attack',charge:isFr?'Charge':'Charge',defend:isFr?'Defense':'Defend',miss:isFr?'Expire':'Expired'})[action];

export function Garde({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string)=>void}) {
    const c=party.garde;if(!c)return null;
    const participant=Object.keys(party.scores).includes(identity),self=participant?identity:Object.keys(c.hp)[0];
    const rival=Object.keys(c.hp).find(id=>id!==self)!;
    const reveal=['reveal','done'].includes(party.phase),last=reveal?c.history[c.history.length-1]:undefined;
    const locked=party.answered.includes(identity),enabled=active&&participant&&party.phase==='choose'&&!locked;
    const names={[self]:participant?(isFr?'TOI':'YOU'):(isFr?'JOUEUR 1':'PLAYER 1'),[rival]:rival===c.botId?(isFr?'BOT D ENTRAINEMENT':'PRACTICE BOT'):'RIVAL'};
    return <section className={styles.game} data-testid="garde" data-phase={party.phase} tabIndex={0} onKeyDown={e=>{if(!enabled||e.repeat||['BUTTON','INPUT'].includes((e.target as HTMLElement).tagName))return;const action=({1:'attack',2:'charge',3:'defend',4:'prank'} as const)[Number(e.key) as 1|2|3|4];if(action){e.preventDefault();if(action!=='defend'||c.canDefend[self])send(action);}}}>
        <header><span>{c.botId?(isFr?'ENTRAINEMENT CONTRE UN BOT':'PRACTICE AGAINST A BOT'):(isFr?'CHOIX SIMULTANES':'SIMULTANEOUS PICKS')}</span><strong>{Math.ceil(party.remaining/1000)}<small> s</small></strong></header>
        <div className={styles.health}>{[self,rival].map((id,index)=><div key={id} data-rival={Boolean(index)}><span>{names[id]}<b><Heart size={14}/><span data-testid={index?'rival-hp':'self-hp'}>{c.hp[id]}</span>/6</b></span><div className={styles.pips} aria-label={`${names[id]} ${c.hp[id]} ${isFr?'PV':'HP'}`}>{Array.from({length:6},(_,i)=><i key={i} data-filled={i<c.hp[id]}/>)}</div></div>)}</div>
        <div className={styles.field} data-reveal={reveal}>
            {[self,rival].map((id,index)=>{
                const action=last?.actions[id]||(!index&&participant?c.selected:undefined),Icon=action?icons[action]:LockKeyhole;
                return <div className={styles.fighter} key={`${party.turn}-${id}`} data-side={index?'rival':'self'} data-action={reveal?action:undefined} data-charged={c.charged[id]} data-hit={Boolean(last?.damage[id])}>
                    <span className={styles.charge}>{c.charged[id]?<><Zap size={14}/>{isFr?'CHARGE':'CHARGED'}</>:c.canDefend[id]?<><Shield size={14}/>{isFr?'GARDE PRETE':'GUARD READY'}</>:<><Shield size={14}/>{isFr?'RECUPERATION':'RECOVERING'}</>}</span>
                    <div className={styles.armor} data-gag={last?.gags?.[id]||undefined}><GameBuddy gameId="garde" rival={Boolean(index)} mood={last?.damage[id]?'oops':reveal&&action==='attack'?'happy':c.charged[id]?'wow':'focus'}/></div><GardeProp action={action||(c.charged[id]?'charge':undefined)} charged={reveal?!!last?.chargedBefore[id]:c.charged[id]}/>
                    <div className={styles.action} data-testid={index?'rival-action':'self-action'}><Icon size={22}/><span>{action?gardeLabel(action,isFr):'?'}</span></div>
                    {last?.gags?.[id]&&<span className={styles.gag} data-testid={index?'rival-gag':'self-gag'}>{last.gags[id]==='banana'?(isFr?'GLISSADE !':'SLIPPERY!'):last.gags[id]==='pan'?(isFr?'DANS TA POÊLE !':'PAN IN YOUR FACE!'):'PAF !'}</span>}
                    {last&&<strong className={styles.damage}>{last.damage[id]?`-${last.damage[id]}`:last.actions[id]==='defend'&&last.actions[index?self:rival]==='attack'?(isFr?'BLOQUE':'BLOCKED'):''}</strong>}
                </div>;
            })}
            <span className={styles.vs}>VS</span>
        </div>
        <p className={styles.status} role="status">{last?c.finished?c.winnerId===null?(isFr?'Egalite parfaite.':'An exact tie.'):c.winnerId===self?(isFr?'Avantage final pour toi.':'You finish ahead.'):(isFr?'L adversaire termine devant.':'Your opponent finishes ahead.'):(isFr?'Les choix sont reveles.':'Picks revealed.'):locked?(isFr?'Choix verrouille.':'Choice locked.'):(isFr?'Banane piège charge. Attaque bat banane. Défense renvoie attaque.':'Banana traps charge. Attack beats banana. Guard bounces attack.')}</p>
        {participant&&<div className={styles.controls} role="group" aria-label={isFr?'Ton action':'Your action'}>{(['attack','charge','defend','prank'] as const).map(action=>{
            const Icon=icons[action],unavailable=action==='defend'&&!c.canDefend[self];
            return <button type="button" key={action} disabled={!enabled||unavailable} data-selected={c.selected===action} aria-pressed={c.selected===action} aria-label={gardeLabel(action,isFr)} title={unavailable?(isFr?'Defense indisponible ce tour':'Defense unavailable this turn'):gardeLabel(action,isFr)} onClick={()=>send(action)}>
                <Icon size={25}/><strong>{gardeLabel(action,isFr)}</strong><small>{action==='attack'?`${c.charged[self]?2:1} ${isFr?'DEGATS':'DAMAGE'}`:action==='charge'?'2 '+(isFr?'AU PROCHAIN':'NEXT ATTACK'):action==='prank'?(isFr?'PIÈGE LA CHARGE':'TRAPS CHARGE'):unavailable?(isFr?'RECUP.':'RECOVERY'):(isFr?'RENVOIE LE COUP':'BOUNCES ATTACK')}</small>
            </button>;
        })}</div>}
        {c.history.length>0&&<details className={styles.log}><summary>{isFr?'Historique':'History'} · {c.history.length}</summary><GardeHistory game={c} identity={self} isFr={isFr}/></details>}
    </section>;
}

export function GardeHistory({game,identity,isFr}:{game:GardeState;identity:string;isFr:boolean}) {
    const ids=[identity,...Object.keys(game.hp).filter(id=>id!==identity)];
    return <div className={styles.history} data-testid="garde-history"><div className={styles.row}><span>#</span><span>{isFr?'TOI':'YOU'}</span><span>PV</span><span>{game.botId?(isFr?'BOT':'BOT'):'RIVAL'}</span><span>PV</span></div>{game.history.map(entry=><div className={styles.row} key={entry.exchange}><span>{entry.exchange}</span>{ids.map(id=>{const action=entry.actions[id],Icon=icons[action];return <div className={styles.entry} key={id}><span><Icon size={13}/>{gardeLabel(action,isFr)}{action==='attack'&&entry.chargedBefore[id]?' ×2':''}</span><b>{entry.hp[id]}</b></div>;})}</div>)}</div>;
}

function GardeProp({action,charged}:{action?:GardeAction;charged:boolean}){
 if(!action||action==='miss')return null;
 return <svg className={styles.prop} viewBox="0 0 100 100" aria-hidden="true"><g stroke="#182642" strokeWidth="5" strokeLinejoin="round">
 {action==='prank'?<><path d="M15 20q20 60 67 12-8 62-53 42Q6 64 15 20Z" fill="#ffdf58"/><path d="m35 55-8 31 28-16 25 17-8-31" fill="#fff0a5"/><path d="m15 20 9-8" fill="none"/></>:action==='defend'?<><path d="m53 58 26 30" strokeWidth="13"/><circle cx="38" cy="37" r="30" fill="#8ca8bc"/><circle cx="38" cy="37" r="21" fill="#c3d8dc"/></>:charged||action==='charge'?<><path d="m10 50 68-34v68Z" fill="#92dbcc"/><path d="m74 50 20-28v56Z" fill="#70b7c3"/><ellipse cx="40" cy="49" rx="31" ry="20" fill="#92dbcc"/><circle cx="25" cy="43" r="8" fill="white"/><circle cx="24" cy="43" r="3" fill="#182642" stroke="none"/><path d="m49 37-3 24m10-22-3 18" fill="none"/></>:<><rect x="28" y="61" width="45" height="25" rx="5" fill="#fff1ca"/><path d="M25 65Q4 46 24 22q12-13 32-6 28-1 29 29 0 22-22 25Z" fill="#f08e91"/><path d="M18 45q20-13 25 10" fill="none"/></>}
 </g></svg>;
}
