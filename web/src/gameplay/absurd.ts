import type {AbsurdState} from './party';

export const pigeonCarX=(slot:number,elapsed:number)=>300+Math.sin(elapsed/1050+slot*2.3)*205;

// Short visual projection only: the server still decides every collision and score.
export function visualAbsurd(state:AbsurdState,ageMs:number,lanes:Map<string,{from:number;to:number;at:number}>,now:number):AbsurdState{
 const age=Math.max(0,Math.min(100,Number.isFinite(ageMs)?ageMs:0)),elapsed=state.elapsed+age;
 return {...state,elapsed,wind:Math.sin(elapsed/2300)*58,
  bodies:state.bodies.map(p=>{
   const transition=lanes.get(p.id),t=transition?Math.max(0,Math.min(1,(now-transition.at)/140)):1;
   return {...p,x:p.x+Math.max(-age*.32,Math.min(age*.32,(p.targetX??p.x)-p.x)),carX:pigeonCarX(p.slot,elapsed),
    visualLane:transition?transition.from+(transition.to-transition.from)*(1-(1-t)**3):p.lane};
  }),
  shots:state.shots.map(b=>({...b,x:b.x+Math.sin((state.elapsed+age/2)/2300)*58*age/1000,progress:Math.min(1,b.progress+age/900)})),
  wave:state.wave?{...state.wave,remaining:Math.max(0,state.wave.remaining-age)}:null,
  strikes:state.strikes.map(a=>({...a,remaining:Math.max(0,a.remaining-age)})),events:state.events.map(e=>({...e,age:e.age+age}))};
}
// Same midpoint integration as the authoritative 50 ms ballistic simulation.
export function pigeonLanding(x:number,elapsed:number,duration=900){
 let landing=x;for(let t=0;t<duration;t+=50){const step=Math.min(50,duration-t);landing+=Math.sin((elapsed+t+step/2)/2300)*58*step/1000;};return landing;
}
