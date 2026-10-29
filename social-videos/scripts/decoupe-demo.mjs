import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {drawingTarget,actDrawing,prepareDrawing,tickDrawing,cutResult}=require('../../api/games/drawing.js');
// A scripted demonstration, resolved by the production engine, not a player record.
export async function prepareDecoupe(root){
  const target=drawingTarget('decoupe',1,(min,max)=>min===0&&max===360?20:37);
  const points=[[.445,.08],[.485,.92]];
  const g={id:'decoupe',attempt:1,players:['demo'],scores:{demo:0},responses:{},drawingTargets:[target]};
  prepareDrawing(g,0);
  tickDrawing(g,2000,()=>{},()=>{});
  if(g.phase!=='drawpath'||g.deadline!==10000)throw Error('Unexpected production timing');
  if(!actDrawing(g,'demo',{action:'lock',points,side:1},7200))throw Error('Demo cut rejected');
  const result=g.drawing.history[0].results.demo;
  if(result.error!==Math.round(Math.abs(result.percent-37)*10)/10)throw Error('Invalid result');
  const opposite=cutResult(target.polygon,37,points,-1);
  if(Math.abs(result.percent+opposite.percent-100)>.11)throw Error('Invalid complementary areas');
  await writeFile(path.join(root,'src/decoupe-demo.json'),JSON.stringify({provenance:'Scripted demonstration; production drawingTarget + actDrawing; not a recorded human match.',target,points,side:1,result,history:g.drawing.history},null,2)+'\n');
  for(const [name,duration,low,high] of [['cut-sweep',.65,1200,300],['select',.12,500,750],['lock',.18,220,440],['reveal',.65,440,880]]){
    const rate=44100,count=Math.floor(rate*duration),pcm=Buffer.alloc(count*2);
    for(let i=0;i<count;i++){
      const t=i/rate, envelope=Math.sin(Math.PI*i/count)**2;
      const phase=2*Math.PI*(low*t+(high-low)*t*t/(2*duration));
      pcm.writeInt16LE(Math.round(Math.sin(phase)*envelope*.24*32767),i*2);
    }
    const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
    await writeFile(path.join(root,'public/audio',`${name}.wav`),Buffer.concat([h,pcm]));
  }
  console.log(`Découpe demo: ${result.percent}% kept, ${result.error} percentage points off (production engine).`);
}
