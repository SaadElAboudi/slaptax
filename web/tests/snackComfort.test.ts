import test from 'node:test';
import assert from 'node:assert/strict';
import {SNACK_SHAKE_MS,snackShakeOffset,snackTeamMarker} from '../src/gameplay/snackComfort.ts';

test('camera shake stays off under reduced motion and after its duration',()=>{
  assert.deepEqual(snackShakeOffset(10,7,true),{x:0,y:0});
  assert.deepEqual(snackShakeOffset(SNACK_SHAKE_MS,7,false),{x:0,y:0});
  assert.deepEqual(snackShakeOffset(-1,7,false),{x:0,y:0});
  assert.deepEqual(snackShakeOffset(NaN,7,false),{x:0,y:0});
  assert.deepEqual(snackShakeOffset(10,NaN,false),{x:0,y:0});
});

test('camera shake is bounded by its amplitude and decays toward the end',()=>{
  for(let t=0;t<SNACK_SHAKE_MS;t+=7){const o=snackShakeOffset(t,7,false);assert.ok(Math.abs(o.x)<=7&&Math.abs(o.y)<=7);}
  const early=Math.abs(snackShakeOffset(1,7,false).x)+Math.abs(snackShakeOffset(1,7,false).y);
  const late=Math.abs(snackShakeOffset(SNACK_SHAKE_MS-1,7,false).x)+Math.abs(snackShakeOffset(SNACK_SHAKE_MS-1,7,false).y);
  assert.ok(late<=early+1e-9||late<0.5);
});

test('team is identified by shape, not colour alone',()=>{
  assert.equal(snackTeamMarker(true),'disc');
  assert.equal(snackTeamMarker(false),'triangle');
});
