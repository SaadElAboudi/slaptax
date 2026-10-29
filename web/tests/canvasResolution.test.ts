import test from 'node:test';
import assert from 'node:assert/strict';
import {gameCanvasContext} from '../src/gameplay/canvasResolution.ts';
test('Retina allocation follows the displayed width and caps at 2x',()=>{
 (globalThis as any).document={hidden:false,documentElement:{dataset:{}}};(globalThis as any).window={devicePixelRatio:3};
 const transform:number[]=[];const ctx={setTransform:(...n:number[])=>transform.push(...n)};const canvas={width:0,height:0,clientWidth:300,getContext:()=>ctx} as unknown as HTMLCanvasElement;
 assert.equal(gameCanvasContext(canvas,600,420),ctx);assert.equal(canvas.width,600);assert.equal(canvas.height,420);assert.deepEqual(transform,[1,0,0,1,0,0]);
 (globalThis as any).document.hidden=true;assert.equal(gameCanvasContext(canvas,600,420),null);
});
