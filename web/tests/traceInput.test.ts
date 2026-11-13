import test from 'node:test';import assert from 'node:assert/strict';
import {traceSegment,queueTrace,TRACE_STEP,TRACE_QUEUE_LIMIT,type TracePoint} from '../src/gameplay/traceInput.ts';
test('a fast outline retains all corners and bounds the distance between consecutive samples',()=>{
 const path:TracePoint[]=[[.2,.2],[.8,.2],[.5,.8],[.2,.2]],queue:TracePoint[]=[];let previous:TracePoint|null=null;
 for(const point of path){assert.equal(queueTrace(queue,traceSegment(previous,point)),true);previous=point;}
 assert.ok(queue.length<TRACE_QUEUE_LIMIT);for(const corner of path)assert.ok(queue.some(p=>Math.hypot(p[0]-corner[0],p[1]-corner[1])<1e-10));
 for(let i=1;i<queue.length;i++)assert.ok(Math.hypot(queue[i][0]-queue[i-1][0],queue[i][1]-queue[i-1][1])<=TRACE_STEP+1e-10);
});
test('a full queue rejects excess input without deleting an earlier valid prefix',()=>{const queue:TracePoint[]=Array.from({length:TRACE_QUEUE_LIMIT},()=>[.2,.2]);const before=structuredClone(queue);assert.equal(queueTrace(queue,[[.3,.2]]),false);assert.deepEqual(queue,before);});
