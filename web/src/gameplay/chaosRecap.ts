import type {PartyMoment} from './party';
export function chaosRecap(moment:PartyMoment,identity:string,fr:boolean):string|null{
 if(moment.summary.includes('forfeit'))return null;
 const s=moment.replay[moment.replay.length-1]?.state;
 if(moment.gameId==='garde'&&s?.garde){
  const rival=Object.keys(s.garde.hp).find(id=>id!==identity);if(!rival)return null;
  const bananas=s.garde.history.filter(h=>h.gags?.[rival]==='banana').length,pans=s.garde.history.filter(h=>h.gags?.[rival]==='pan').length;
  return fr?`${bananas} banane${bananas===1?'':'s'} placée${bananas===1?'':'s'} · ${pans} coup${pans===1?'':'s'} renvoyé${pans===1?'':'s'}. Revanche ?`:`${bananas} banana trap${bananas===1?'':'s'} · ${pans} attack${pans===1?'':'s'} bounced. Rematch?`;
 }
 if(moment.gameId==='table'&&s?.table){const ko=s.table.bodies.find(p=>p.id===identity)?.kos||0;return fr?`${s.table.pulls||0} coups de nappe · ${ko} KO. On remet le couvert ?`:`${s.table.pulls||0} tablecloth pulls · ${ko} KO. Another helping?`;}
 return null;
}
