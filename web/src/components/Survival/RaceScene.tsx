import {useId} from 'react';
import type {PartyState} from '../../gameplay/party';
import styles from './Survival.module.css';
export function RaceScene({party,identity,names,fr,botIds}:{party:PartyState;identity:string;names:Record<string,string>;fr:boolean;botIds:string[]}){
 const uid=useId().replace(/:/g,''),state=party.survival!;
 const colors=['#ffe17d','#ff9b9b','#8edcca','#b4a3ff'];
 const signal=state.signal;
 return <div className={styles.raceSet} data-testid="race-scene-fallback">
 <svg viewBox="0 0 600 340" role="img" aria-label={fr?'La piste des challengers : quatre couloirs, le portique surveille vos mouvements.':'The challengers’ track: four lanes under the watchful gate.'}>
 <defs><linearGradient id={`${uid}floor`} x2="0" y2="1"><stop stopColor="#233c48"/><stop offset="1" stopColor="#122734"/></linearGradient><pattern id={`${uid}tiles`} width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#b7c9ae" strokeOpacity=".07"/></pattern></defs>
 <rect width="600" height="340" rx="20" fill={`url(#${uid}floor)`}/><rect width="600" height="340" rx="20" fill={`url(#${uid}tiles)`}/>
 <path d="M0 83 140 57H600V90H0Z" fill="#0c202b"/><path d="M0 83H600M28 330H575" stroke="#7b9694" strokeWidth="2"/>
 <g opacity=".25" fill="none" stroke="#bde2d3"><path d="M25 12 155 82H225L55 12M575 12 445 82H375L545 12"/></g>
 <g transform="translate(260 7)"><path d="M8 57V21Q8 4 25 4H61Q78 4 78 21V57" fill="#728d88" stroke="#0d202e" strokeWidth="4"/><rect x="18" y="16" width="50" height="30" rx="10" fill="#152734"/><circle cx="32" cy="31" r="7" fill={signal==='go'?'#9bf1c1':signal==='release'?'#ffda78':'#ff7e82'}/><circle cx="55" cy="31" r="7" fill={signal==='go'?'#9bf1c1':signal==='release'?'#ffda78':'#ff7e82'}/><path d="M25 53H61M30 60H56" stroke="#b4c5b5" strokeWidth="3"/><path d="M43 4V0" stroke="#ffdc7d" strokeWidth="4"/></g>
 <text x="24" y="44" fill="#9db9b5" fontSize="12" letterSpacing="3">SLAP TAX</text><text x="575" y="43" textAnchor="end" fill="#ffe2a1" fontSize="12" letterSpacing="2">01 / ARENA</text>
 {[0,1,2,3].map(i=><g key={i}><rect x="120" y={103+i*53} width="425" height="45" rx="6" fill={i%2?'#537275':'#49686d'} fillOpacity=".48"/><path d={`M130 ${143+i*53}H540`} stroke="#b5cfbf" strokeOpacity=".24" strokeDasharray="8 9"/><text x="20" y={130+i*53} fill={colors[i]} fontSize="14" fontWeight="700">{Object.values(names)[i]?.slice(0,13)||`${fr?'Joueur':'Player'} ${i+1}`}</text></g>)}
 <path d="M530 99V312" stroke="#f8ebc8" strokeWidth="7" strokeDasharray="8 7"/><path d="M547 97V315" stroke="#ffe17d" strokeWidth="2"/>
 {Object.entries(state.players).map(([id,p],i)=><g key={id} className={styles.runner} style={{transform:`translate(${140+p.progress*377}px, ${122+i*53}px)`,opacity:p.out?.35:1}} data-running={signal==='go'&&p.progress>0&&!p.out&&!p.finished}>
 <ellipse cy="17" rx="20" ry="6" fill="#071923" opacity=".5"/>
 <g className={styles.runnerBody}><path d="m-10 8-4 12m23-12 5 12" stroke="#162939" strokeWidth="6" strokeLinecap="round"/><rect x="-15" y="-13" width="30" height="30" rx="8" fill={colors[i]} stroke="#142b3a" strokeWidth="3"/><path d="m-16-1-5 8m37-8 5 8" stroke={colors[i]} strokeWidth="5" strokeLinecap="round"/><rect x="-17" y="-26" width="34" height="25" rx={botIds.includes(id)?4:11} fill={colors[i]} stroke="#142b3a" strokeWidth="3"/><rect x="-12" y="-20" width="25" height="12" rx="5" fill="#152c3b"/><path d="M-5-16v4m12-4v4" stroke="#f4fbdd" strokeWidth="3" strokeLinecap="round"/>{botIds.includes(id)&&<><path d="M0-27V-33" stroke={colors[i]} strokeWidth="3"/><circle cy="-35" r="3" fill="#ffde7e"/></>}<text y="11" textAnchor="middle" fontSize="9" fill="#193442" fontWeight="900">{id===identity?'★':String(i+1).padStart(2,'0')}</text></g>
 {p.finished&&<text x="10" y="-28" fill="#ffdf80" fontSize="22">★</text>}{p.out&&<path d="m-9-13 18 16m0-16-18 16" stroke="#ff7b85" strokeWidth="5"/>}
 </g>)}
 </svg><div className={styles.raceCaption}><span>{fr?'DÉPART':'START'}</span><b>{fr?'LA LIGNE OU LA SORTIE':'THE LINE OR THE EXIT'}</b><span>{fr?'ARRIVÉE':'FINISH'}</span></div>
 </div>;
}
