import { Heart, LockKeyhole, Shield, Swords, Zap, Minus } from 'lucide-react';
import type { GardeAction, GardeState, PartyState } from '../../gameplay/party';
import styles from './Garde.module.css';

const icons = { attack:Swords, charge:Zap, defend:Shield, miss:Minus };
export const gardeLabel = (action:GardeAction,isFr:boolean) => ({attack:isFr?'Attaque':'Attack',charge:isFr?'Charge':'Charge',defend:isFr?'Defense':'Defend',miss:isFr?'Expire':'Expired'})[action];

export function Garde({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string)=>void}) {
    const c=party.garde;if(!c)return null;
    const participant=Object.keys(party.scores).includes(identity),self=participant?identity:Object.keys(c.hp)[0];
    const rival=Object.keys(c.hp).find(id=>id!==self)!;
    const reveal=['reveal','done'].includes(party.phase),last=reveal?c.history[c.history.length-1]:undefined;
    const locked=party.answered.includes(identity),enabled=active&&participant&&party.phase==='choose'&&!locked;
    const names={[self]:participant?(isFr?'TOI':'YOU'):(isFr?'JOUEUR 1':'PLAYER 1'),[rival]:rival===c.botId?(isFr?'BOT D ENTRAINEMENT':'PRACTICE BOT'):'RIVAL'};
    return <section className={styles.game} data-testid="garde" data-phase={party.phase}>
        <header><span>{c.botId?(isFr?'ENTRAINEMENT CONTRE UN BOT':'PRACTICE AGAINST A BOT'):(isFr?'CHOIX SIMULTANES':'SIMULTANEOUS PICKS')}</span><strong>{Math.ceil(party.remaining/1000)}<small> s</small></strong></header>
        <div className={styles.health}>{[self,rival].map((id,index)=><div key={id} data-rival={Boolean(index)}><span>{names[id]}<b><Heart size={14}/><span data-testid={index?'rival-hp':'self-hp'}>{c.hp[id]}</span>/6</b></span><div className={styles.pips} aria-label={`${names[id]} ${c.hp[id]} ${isFr?'PV':'HP'}`}>{Array.from({length:6},(_,i)=><i key={i} data-filled={i<c.hp[id]}/>)}</div></div>)}</div>
        <div className={styles.field} data-reveal={reveal}>
            {[self,rival].map((id,index)=>{
                const action=last?.actions[id]||(!index&&participant?c.selected:undefined),Icon=action?icons[action]:LockKeyhole;
                return <div className={styles.fighter} key={`${party.turn}-${id}`} data-side={index?'rival':'self'} data-action={reveal?action:undefined} data-charged={c.charged[id]} data-hit={Boolean(last?.damage[id])}>
                    <span className={styles.charge}>{c.charged[id]?<><Zap size={14}/>{isFr?'CHARGE':'CHARGED'}</>:c.canDefend[id]?<><Shield size={14}/>{isFr?'GARDE PRETE':'GUARD READY'}</>:<><Shield size={14}/>{isFr?'RECUPERATION':'RECOVERING'}</>}</span>
                    <svg className={styles.armor} viewBox="0 0 120 150" aria-hidden="true"><path d="M60 12L95 30L91 73L75 93L103 106L108 138H12L17 106L45 93L29 73L25 30Z"/><path d="M27 48L60 59L93 48M60 59V89M37 75L60 89L83 75M45 96L60 113L75 96"/><path d="M36 38H49M71 38H84"/></svg>
                    <div className={styles.action} data-testid={index?'rival-action':'self-action'}><Icon size={22}/><span>{action?gardeLabel(action,isFr):'?'}</span></div>
                    {last&&<strong className={styles.damage}>{last.damage[id]?`-${last.damage[id]}`:last.actions[id]==='defend'&&last.actions[index?self:rival]==='attack'?(isFr?'BLOQUE':'BLOCKED'):''}</strong>}
                </div>;
            })}
            <span className={styles.vs}>VS</span>
        </div>
        <p className={styles.status} role="status">{last?c.finished?c.winnerId===null?(isFr?'Egalite parfaite.':'An exact tie.'):c.winnerId===self?(isFr?'Avantage final pour toi.':'You finish ahead.'):(isFr?'L adversaire termine devant.':'Your opponent finishes ahead.'):(isFr?'Les choix sont reveles.':'Picks revealed.'):locked?(isFr?'Choix verrouille.':'Choice locked.'):(isFr?'Ton prochain mouvement ?':'Your next move?')}</p>
        {participant&&<div className={styles.controls} role="group" aria-label={isFr?'Ton action':'Your action'}>{(['attack','charge','defend'] as const).map(action=>{
            const Icon=icons[action],unavailable=action==='defend'&&!c.canDefend[self];
            return <button type="button" key={action} disabled={!enabled||unavailable} data-selected={c.selected===action} aria-pressed={c.selected===action} aria-label={gardeLabel(action,isFr)} title={unavailable?(isFr?'Defense indisponible ce tour':'Defense unavailable this turn'):gardeLabel(action,isFr)} onClick={()=>send(action)}>
                <Icon size={25}/><strong>{gardeLabel(action,isFr)}</strong><small>{action==='attack'?`${c.charged[self]?2:1} ${isFr?'DEGATS':'DAMAGE'}`:action==='charge'?'2 '+(isFr?'AU PROCHAIN':'NEXT ATTACK'):unavailable?(isFr?'RECUP.':'RECOVERY'):(isFr?'BLOQUE TOUT':'BLOCK ALL')}</small>
            </button>;
        })}</div>}
        {c.history.length>0&&<details className={styles.log}><summary>{isFr?'Historique':'History'} · {c.history.length}</summary><GardeHistory game={c} identity={self} isFr={isFr}/></details>}
    </section>;
}

export function GardeHistory({game,identity,isFr}:{game:GardeState;identity:string;isFr:boolean}) {
    const ids=[identity,...Object.keys(game.hp).filter(id=>id!==identity)];
    return <div className={styles.history} data-testid="garde-history"><div className={styles.row}><span>#</span><span>{isFr?'TOI':'YOU'}</span><span>PV</span><span>{game.botId?(isFr?'BOT':'BOT'):'RIVAL'}</span><span>PV</span></div>{game.history.map(entry=><div className={styles.row} key={entry.exchange}><span>{entry.exchange}</span>{ids.map(id=>{const action=entry.actions[id],Icon=icons[action];return <div className={styles.entry} key={id}><span><Icon size={13}/>{gardeLabel(action,isFr)}{action==='attack'&&entry.chargedBefore[id]?' ×2':''}</span><b>{entry.hp[id]}</b></div>;})}</div>)}</div>;
}
