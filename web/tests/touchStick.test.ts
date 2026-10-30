import test from 'node:test';
import assert from 'node:assert/strict';
import {touchStick,snackActionBlocked} from '../src/gameplay/touchStick.ts';
test('thumb jitter is neutral and a full diagonal never moves faster than a straight line',()=>{assert.deepEqual(touchStick(3,4),{x:0,y:0});assert.deepEqual(touchStick(30,0),{x:1,y:0});assert.equal(touchStick(18,0).x,.5);assert.ok(Math.abs(Math.hypot(...Object.values(touchStick(100,100)))-1)<1e-9);assert.deepEqual(touchStick(NaN,0),{x:0,y:0});});
test('a carrier can throw during slap cooldown but not while disconnected',()=>{assert.equal(snackActionBlocked(true,true,500),false);assert.equal(snackActionBlocked(true,false,500),true);assert.equal(snackActionBlocked(false,true,0),true);});
