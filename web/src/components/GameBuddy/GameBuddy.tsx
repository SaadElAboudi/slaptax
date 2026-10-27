import styles from './GameBuddy.module.css';
export type BuddyMood='ready'|'focus'|'happy'|'oops'|'wow';
export function GameBuddy({gameId,mood='ready',rival=false}:{gameId:string;mood?:BuddyMood;rival?:boolean}){
 const color=rival?'#ff9388':gameId==='table'?'#ffda52':gameId==='chroma'?'#c1a2f3':['trace','decoupe'].includes(gameId)?'#8ee4d1':['onesecond','falsestart'].includes(gameId)?'#ffdd68':'#9ed5fb';
 return <svg className={styles.buddy} data-mood={mood} viewBox="0 0 120 120" aria-hidden="true">
  <ellipse cx="60" cy="108" rx="36" ry="7" fill="#142644" opacity=".25"/>
  <g className={styles.body} stroke="#182642" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
   <path d="m31 73-12 12 8 8 13-7m49-13 12 12-8 8-13-7" fill={color}/>
   <path d="m44 98-6 8h15m23-8 6 8H67" fill="#182642"/>
   <path d="M27 86V55Q24 27 60 27T93 55V86Q88 105 60 103T27 86Z" fill={color}/>
   <path d="M37 47q1-10 13-12" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="6"/>
   {gameId==='toilet'?<><path d="M28 36V15h64v21" fill="#fff6e6"/><path d="M50 23h20" stroke="#8fcfe6" strokeWidth="7"/><path d="m92 83 12-6" stroke="#a0cc83" strokeWidth="9"/></>:gameId==='table'?<><circle cx="60" cy="24" r="9" fill="#ff6f86"/><path d="M60 15q-3-12 10-13" fill="none"/></>:gameId==='garde'?<><path d="M26 48 34 25 60 14 86 25 94 48 60 42Z" fill={rival?'#eb7684':'#7f99df'}/><path d="M60 17V6l13 5-13 7" fill="#ffdd68"/></>:gameId==='chroma'?<><path d="M28 38Q30 10 61 20q32-13 32 18Z" fill="#fff2db"/><path d="m81 93 17-28 7 4-15 29" fill="#f8bb8c"/><path d="m98 65 4-13 9 5-6 12" fill="#b69aef"/></>:gameId==='contrepied'?<><path d="m28 38 1-23 21 15 11-23 12 23 20-15-1 23Z" fill="#bca1ef"/><circle cx="61" cy="8" r="5" fill="#ffdd68"/></>:gameId==='onesecond'?<><circle cx="60" cy="25" r="14" fill="#fff1bf"/><path d="M60 16v10l7 4" fill="none"/></>:gameId==='decoupe'?<><path d="M31 36Q12 9 39 12Q49-6 61 13Q91 0 90 34Z" fill="#fff7e4"/><path d="M34 36h54"/></>:gameId==='mat'?<path d="m34 33-8-19 22 9L60 7l13 16 22-9-9 19Z" fill="#ffdd68"/>:gameId==='trace'?<path d="m35 32 37-21 13 19Z" fill="#e18bbf"/>:gameId==='bombpass'?<><path d="M60 28q-5-19 11-19" fill="none"/><path d="m76 5 6-4m-3 14 9 2" stroke="#ffdd68"/></>:<path d="M48 29Q34 8 54 15l8 13q12-27 18-11L70 30" fill={color}/>}
   {[-1,1].map(side=><g key={side}><ellipse cx={60+side*14} cy="60" rx="10" ry={mood==='wow'?14:12} fill="white"/>{mood==='oops'?<path d={`m${55+side*14} 55 10 10m0-10-10 10`} fill="none"/>:mood==='happy'?<path d={`m${54+side*14} 61q6-9 12 0`} fill="none"/>:<circle cx={60+side*14} cy={mood==='focus'?57:61} r="4" fill="#182642"/>}</g>)}
   {mood==='focus'&&<path d="m35 43 17 5m16 0 17-5"/>}
   {mood==='oops'||mood==='wow'?<ellipse cx="60" cy="86" rx="6" ry="9" fill="#182642"/>:<path d="M49 80q11 23 22 0Z" fill="#fff9ea"/>}
   <path d="M32 77h6m44 0h6" stroke="#ef7e95" strokeWidth="5"/>
  </g>
 </svg>;
}
