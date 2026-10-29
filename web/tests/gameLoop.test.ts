import test from 'node:test';
import assert from 'node:assert/strict';
import {startGameLoop} from '../src/gameplay/gameLoop.ts';
function setup(){let active=true,serial=0,changed=()=>{};const queue=new Map<number,(now:number)=>void>();let draws=0,removed=false;const stop=startGameLoop(()=>draws++,{request:f=>{queue.set(++serial,f);return serial;},cancel:id=>{queue.delete(id);},active:()=>active,subscribe:f=>{changed=f;return()=>{removed=true;};}});return{queue,stop,get draws(){return draws;},get removed(){return removed;},setActive(value:boolean){active=value;changed();},tick(){const [id,f]=queue.entries().next().value!;queue.delete(id);f(100);}};}
test('a scene owns exactly one pending animation frame',()=>{const x=setup();assert.equal(x.queue.size,1);x.tick();x.tick();assert.equal(x.draws,2);assert.equal(x.queue.size,1);x.stop();});
test('background cancels work and repeated resume events do not duplicate loops',()=>{const x=setup();x.setActive(false);assert.equal(x.queue.size,0);x.setActive(false);x.setActive(true);x.setActive(true);assert.equal(x.queue.size,1);x.tick();assert.equal(x.draws,1);x.stop();});
test('unmount releases listeners and late lifecycle events cannot restart a scene',()=>{const x=setup();x.stop();assert.equal(x.removed,true);assert.equal(x.queue.size,0);x.setActive(false);x.setActive(true);assert.equal(x.queue.size,0);});
