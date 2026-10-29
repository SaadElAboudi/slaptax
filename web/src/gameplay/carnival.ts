import type {CarnivalState} from './party';
// Visual extrapolation only. Scores, hits, balloon volume and powers stay server-owned.
export function visualCarnival(state:CarnivalState,ageMs:number):CarnivalState{
 const age=Math.max(0,Math.min(100,Number.isFinite(ageMs)?ageMs:0)),elapsed=Math.min(22000,state.elapsed+age);
 return {...state,elapsed,bodies:state.bodies.map(p=>({...p,x:state.kind==='pie'?(p.manual?p.x+Math.max(-age*.0009,Math.min(age*.0009,(p.targetX??p.x)-p.x)):.5+.34*Math.sin(elapsed/700+p.slot*2.1)):p.x})),shots:state.shots.map(s=>({...s,progress:Math.min(1,s.progress+age/350)})),events:state.events.map(e=>({...e,age:e.age+age}))};
}
