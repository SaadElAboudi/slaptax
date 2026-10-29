import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {constrainCut} from '../src/gameplay/cutGesture.ts';
import type {Point} from '../src/gameplay/party.ts';
const {cutDirectionAllowed}=createRequire(import.meta.url)('../../api/games/drawing.js');
test('guided cuts fit the normalized board and satisfy the actual server directions',()=>{
 for(const axis of ['vertical','diagonal'])for(const [a,b]of [[[.1,.2],[.8,.9]],[[0,.9],[.2,1]],[[.9,0],[1,.1]],[[.5,.05],[.5,.95]]] as [Point,Point][]){const points=constrainCut(a,b,axis);assert.ok(cutDirectionAllowed(points,axis));assert.ok(points.flat().every(v=>v>=0&&v<=1));}
});
test('free and legacy gestures are preserved, and an accidental tap does not become a cut',()=>{
 const a:Point=[.3,.4],b:Point=[.8,.2];for(const axis of ['free',undefined])assert.deepEqual(constrainCut(a,b,axis),[a,b]);const tap:Point=[.301,.401];for(const axis of ['vertical','diagonal']){const points=constrainCut(a,tap,axis);assert.deepEqual(points,[a,tap]);assert.equal(cutDirectionAllowed(points,axis),false);}
});
test('guided cut follows the gesture position rather than solving any target percentage',()=>{
 const left=constrainCut([.2,.1],[.2,.9],'vertical'),right=constrainCut([.7,.1],[.7,.9],'vertical');assert.notDeepEqual(left,right);assert.equal(left[0][0],.2);assert.equal(right[0][0],.7);
});
