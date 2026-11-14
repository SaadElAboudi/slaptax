/// <reference lib="webworker" />
import {createStage,type StageViewport} from './stage';
import type {PartyState} from '../party';
type Aim={dx:number;dy:number;power:number}|null;
type Init={type:'init';kind:'race'|'table';canvas:OffscreenCanvas;identity:string;party:PartyState;botIds:string[];viewport:StageViewport;reduced:boolean};
type Message=Init|{type:'state';party:PartyState;botIds:string[];reduced:boolean;aim?:Aim}|{type:'resize';viewport:StageViewport}|{type:'active';value:boolean}|{type:'quality';level:number}|{type:'dispose'};
let stage:ReturnType<typeof createStage>|undefined,party:PartyState,botIds:string[]=[],reduced=false,active=true,ready=false,stopped=false,pending:number|null=null,last=0,lastReport=0,frames=0,level=0,kind:'race'|'table'='race',aim:Aim=null;
const request=(fn:FrameRequestCallback)=>typeof self.requestAnimationFrame==='function'?self.requestAnimationFrame(fn):self.setTimeout(()=>fn(performance.now()),32);
const cancel=()=>{if(pending!==null){if(typeof self.cancelAnimationFrame==='function')self.cancelAnimationFrame(pending);else self.clearTimeout(pending);}pending=null;};
function schedule(){if(!stopped&&ready&&active&&pending===null)pending=request(draw);}
function draw(now:number){pending=null;if(stopped||!active||!stage)return;const interval=level===2?66:level===1?50:32;
 if(now-last>=interval){const gap=last?now-last:0;last=now;try{const cost=stage.render(party,botIds,now,reduced,aim);frames++;if(now-lastReport>=150){lastReport=now;self.postMessage({type:'frame',frames,cost,gap});}}catch{self.postMessage({type:'failed'});stopped=true;return;}}
 schedule();
}
self.onmessage=async(event:MessageEvent<Message>)=>{const message=event.data;
 try{
  if(message.type==='init'){message.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stopped=true;cancel();self.postMessage({type:'failed'});});party=message.party;botIds=message.botIds;reduced=message.reduced;kind=message.kind;stage=createStage(message.canvas,kind,message.identity,party,botIds,message.viewport);await stage.ready;if(stopped){stage.dispose();return;}ready=true;self.postMessage({type:'ready',camera:kind==='table'?stage.cameraSnapshot():undefined});schedule();}
  if(message.type==='state'){party=message.party;botIds=message.botIds;reduced=message.reduced;aim=message.aim||null;}
  if(message.type==='resize'){stage?.resize(message.viewport);if(ready&&kind==='table')self.postMessage({type:'projection',camera:stage?.cameraSnapshot()});}
  if(message.type==='active'){active=message.value;last=0;if(active)schedule();else cancel();}
  if(message.type==='quality'){level=message.level;stage?.reduceQuality(level);}
  if(message.type==='dispose'){stopped=true;cancel();stage?.dispose();self.close();}
 }catch{self.postMessage({type:'failed'});stopped=true;cancel();}
};
