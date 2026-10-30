import test from 'node:test';
import assert from 'node:assert/strict';
import {gameCanvasContext} from '../src/gameplay/canvasResolution.ts';
test('Retina allocation follows the displayed width and caps at 2x',()=>{
 (globalThis as any).document={hidden:false,documentElement:{dataset:{}}};(globalThis as any).window={devicePixelRatio:3};
 const transform:number[]=[];const ctx={setTransform:(...n:number[])=>transform.push(...n)};const canvas={width:0,height:0,clientWidth:300,getContext:()=>ctx} as unknown as HTMLCanvasElement;
 assert.equal(gameCanvasContext(canvas,600,420),ctx);assert.equal(canvas.width,600);assert.equal(canvas.height,420);assert.deepEqual(transform,[1,0,0,1,0,0]);
 (globalThis as any).document.hidden=true;assert.equal(gameCanvasContext(canvas,600,420),null);
});
test('an unavailable visible canvas triggers recovery, while backgrounding remains a normal pause',()=>{
 (globalThis as any).document={hidden:false,documentElement:{dataset:{}}};
 (globalThis as any).window={devicePixelRatio:2};
 const canvas={width:600,height:420,clientWidth:300,getContext:()=>null} as unknown as HTMLCanvasElement;
 assert.throws(()=>gameCanvasContext(canvas,600,420),/Game canvas is unavailable/);
 (globalThis as any).document.hidden=true;
 assert.equal(gameCanvasContext(canvas,600,420),null);
 (globalThis as any).document.hidden=false;
 (globalThis as any).document.documentElement.dataset.appActive='false';
 assert.equal(gameCanvasContext(canvas,600,420),null);
 assert.equal(gameCanvasContext(null,600,420),null);
});
