export type TracePoint=[number,number];
// Twelve samples per 100 ms stay below the server's 1.6 units/s tracing budget.
export const TRACE_STEP=.01;
export const TRACE_QUEUE_LIMIT=240;
export function traceSegment(from:TracePoint|null,to:TracePoint):TracePoint[]{
 if(!from)return [to];
 const distance=Math.hypot(to[0]-from[0],to[1]-from[1]);
 if(distance<.0001)return [];
 const count=Math.ceil(distance/TRACE_STEP);
 return Array.from({length:count},(_,i)=>[from[0]+(to[0]-from[0])*(i+1)/count,from[1]+(to[1]-from[1])*(i+1)/count] as TracePoint);
}
export function queueTrace(queue:TracePoint[],points:TracePoint[]){
 if(queue.length+points.length>TRACE_QUEUE_LIMIT)return false;
 queue.push(...points);return true;
}
