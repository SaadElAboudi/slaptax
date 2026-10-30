/** Ignore thumb jitter, then ramp smoothly to full speed at the edge. */
export function touchStick(x:number,y:number,radius=30,deadZone=6){
 const distance=Math.hypot(x,y);
 if(!Number.isFinite(distance)||distance<=deadZone)return {x:0,y:0};
 const strength=Math.min(1,(distance-deadZone)/(radius-deadZone));
 return {x:x/distance*strength,y:y/distance*strength};
}
export function snackActionBlocked(enabled:boolean,carrying:boolean,cooldown:number){return !enabled||(!carrying&&cooldown>0);}
