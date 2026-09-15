import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Eye, Palette } from 'lucide-react';
import { useSfx } from '../../hooks/useSfx';
import { hapticPulse } from '../../hooks/useFeedbackPreferences';
import type { PartyState } from '../../gameplay/party';
import styles from './Chroma.module.css';

export const colorCss = (rgb: number[] = [128, 128, 128]) => `rgb(${rgb.join(',')})`;

export function hsvRgb(h: number, s: number, v: number) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    const channels = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
    return channels.map((n) => Math.round((n + m) * 255));
}

export function Chroma({ party, identity, active, isFr, send }: {
    party: PartyState; identity: string; active: boolean; isFr: boolean;
    send: (action: string, data?: { rgb: number[] }) => void;
}) {
    const [hsv, setHsv] = useState([180, 0, 128 / 255]);
    const value = useRef(hsv);
    const lastSend = useRef(0);
    const {playColor}=useSfx();
    const lastCue=useRef('');
    useEffect(()=>{
        if(lastCue.current===party.phase||!active)return;lastCue.current=party.phase;
        if(party.phase==='observe'||party.phase==='mix'||party.phase==='reveal')playColor(party.phase);
    },[party.phase,active,playColor]);
    const locked = party.answered.includes(identity);
    const mixing = party.phase === 'mix';
    const revealing = ['reveal', 'done'].includes(party.phase);
    const enabled = active && mixing && !locked;
    function change(next: number[], force = false) {
        value.current = next; setHsv(next);
        if (force || performance.now() - lastSend.current >= 65) {
            send('color', { rgb: hsvRgb(next[0], next[1], next[2]) });
            lastSend.current = performance.now();
        }
    }
    function move(e: React.PointerEvent<HTMLDivElement>) {
        if (!enabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const rect = e.currentTarget.getBoundingClientRect();
        change([value.current[0], Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)), 1-Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))]);
    }
    const swatch = hsvRgb(...hsv as [number,number,number]);
    const ownError=(party.runs[identity]?.errors?.[party.attempt-1]||0)/1000;
    const rival=Object.keys(party.feedback.colors||{}).find(id=>id!==identity);
    const rivalError=rival?(party.runs[rival]?.errors?.[party.attempt-1]||0)/1000:null;
    const verdict=rivalError===null?(ownError<15?(isFr?'Presque identique.':'Almost identical.'):(isFr?'Chaque nuance compte.':'Every shade counts.')):ownError===rivalError?(isFr?'Le meme oeil.':'Same eye.'):ownError<rivalError?(isFr?'Tu avais l oeil.':'You had the eye.'):(isFr?'Bien vu, le rival.':'Your rival saw it.');
    return <section className={styles.chroma} data-testid="chroma" data-phase={party.phase}>
        <header><div><span>{isFr?'COULEUR':'COLOR'} 0{party.attempt}<i>/ 03</i></span><div className={styles.steps}>{[1,2,3].map(n=><b key={n} data-current={n===party.attempt} data-done={n<party.attempt}/>)}</div></div><strong data-urgent={mixing&&party.remaining<=3000}>{Math.ceil(party.remaining/1000)}<small> s</small></strong></header>
        <div className={styles.phaseTitle} role="status"><span>{revealing?(isFr?'LE VERDICT':'THE VERDICT'):locked?(isFr?'BIEN RECU':'LOCKED IN'):mixing?(isFr?'A TOI DE JOUER':'YOUR TURN'):(isFr?'OUVRE GRAND LES YEUX':'EYES OPEN')}</span><h3>{revealing?verdict:locked?(isFr?'Au rival de voir.':'Over to your rival.'):mixing?(isFr?'Tu la revois ?':'Still see it?'):party.phase==='observe'?(isFr?'Garde-la en tete.':'Keep it in mind.'):(isFr?'Prends une bonne inspiration.':'Take a breath.')}</h3></div>
        {revealing?<><div className={styles.results}>
            <div><div className={styles.swatch} style={{background:colorCss(party.feedback.color)}}/><b>{isFr?'CIBLE':'TARGET'}</b><span>{isFr?'RVB':'RGB'}</span></div>
            {Object.entries(party.feedback.colors||{}).map(([id,rgb])=><div key={id} data-self={id===identity}><div className={styles.swatch} style={{background:colorCss(rgb)}}/><b>{id===identity?(isFr?'TOI':'YOU'):'RIVAL'}</b><span>{((party.runs[id]?.errors?.[party.attempt-1]||0)/1000).toFixed(1)} {isFr?'d ecart':'away'}</span></div>)}
        </div><div className={styles.totals}><span>{isFr?'TOTAL RVB':'TOTAL RGB'}</span>{Object.entries(party.scores).map(([id,score])=><b key={id}>{id===identity?(isFr?'TOI':'YOU'):'RIVAL'} {(Math.abs(score)/1000).toFixed(1)}</b>)}</div></>:mixing?<>
            <div className={styles.preview} style={{background:colorCss(swatch)}} aria-label={isFr?'Ta couleur':'Your color'}><span>{locked?<Check size={18}/>:<Palette size={18}/>}</span></div>
            <div className={styles.picker} data-testid="chroma-picker" data-locked={locked} style={{backgroundColor:colorCss(hsvRgb(hsv[0],1,1))}}
                onPointerDown={e=>{if(!enabled||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);move(e);}}
                onPointerMove={move} onPointerUp={e=>{if(!enabled)return;move(e);change(value.current,true);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
                onPointerCancel={()=>{if(enabled)change(value.current,true);}}>
                <i style={{left:`${hsv[1]*100}%`,top:`${(1-hsv[2])*100}%`}}/>
            </div>
            <div className={styles.controls}>
                {[(isFr?'Teinte':'Hue'),'Saturation',(isFr?'Luminosite':'Brightness')].map((label,i)=><label key={label}>{label}<input type="range" min="0" max={i?100:359} value={i?Math.round(hsv[i]*100):hsv[i]} disabled={!enabled} aria-label={label} className={i===0?styles.hue:''} onChange={e=>{const next=[...value.current];next[i]=Number(e.target.value)/(i?100:1);change(next,true);}}/></label>)}
            </div>
            <button type="button" disabled={!enabled} onClick={()=>{send('lock',{rgb:hsvRgb(...value.current as [number,number,number])});playColor('lock');hapticPulse(15);}}>{locked?<Check size={20}/>:<LockKeyhole size={20}/>} {locked?(isFr?'Couleur verrouillee':'Color locked'):(isFr?'Verrouiller':'Lock color')}</button>
        </>:<div className={styles.observation} style={{background:party.phase==='observe'?colorCss(party.color):undefined}}>
            {party.phase==='observe'?<span className={styles.observeLabel}><Eye size={18}/>{isFr?'MEMORISE':'REMEMBER'}</span>:<strong key={Math.ceil(party.remaining/1000)}>{party.phase==='prepare'?Math.max(1,Math.ceil(party.remaining/1000)):'CHROMA'}</strong>}
        </div>}
    </section>;
}
