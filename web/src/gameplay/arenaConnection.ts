/** Controls are usable only while the latest authoritative snapshot is fresh. */
export const ARENA_STALE_MS=3000;
export function arenaConnection(connected:boolean,phase:string|undefined,lastReceived:number,now:number){
 if(!connected)return 'reconnecting' as const;
 if(phase==='playing'&&now-lastReceived>=ARENA_STALE_MS)return 'stale' as const;
 return phase==='playing'?'live' as const:'waiting' as const;
}
