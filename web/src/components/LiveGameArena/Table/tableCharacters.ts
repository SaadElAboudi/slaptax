import type {TableState} from '../../../gameplay/party';

const INK='#182642';
export const TABLE_CAST=[
 {name:'FLANFLAN',color:'#ffda52',light:'#fff1a2'},
 {name:'RONCHON',color:'#ff8c80',light:'#ffc6a8'},
 {name:'GUIMAUVE',color:'#bca1ef',light:'#e5d4ff'},
 {name:'CORNICHON',color:'#70d9ba',light:'#c1ffe0'},
];
/** Characters remain centred on the authoritative 30px collision radius. */
export function paintCharacter(ctx:CanvasRenderingContext2D,p:TableState['bodies'][number],index:number,state:TableState,now:number,aiming:boolean,reduced:boolean){
 const cast=TABLE_CAST[index%4],speed=Math.hypot(p.vx,p.vy);
 const hit=state.lastHit,bonk=!!hit&&hit.age<380&&Math.hypot(p.x-hit.x,p.y-hit.y)<95;
 const scared=p.out||Math.min(p.x-state.bound,600-state.bound-p.x,p.y-state.bound,600-state.bound-p.y)<48;
 const blink=Math.sin(now/650+index*2)>.992;
 const wobble=reduced?0:Math.sin(now/85+index)*Math.min(speed*.012,.13);
 ctx.rotate(wobble);ctx.scale(1+(bonk&&!reduced?.13:0),1-(bonk&&!reduced?.11:0));
 ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';
 function shape(fill:string,draw:()=>void){ctx.fillStyle=fill;ctx.beginPath();draw();ctx.fill();ctx.stroke();}
 // Tiny feet and flailing arms give each impact a readable silhouette.
 for(const side of [-1,1]){
  shape(cast.color,()=>ctx.ellipse(side*29,scared?-15:7,7,11,side*(scared?.8:-.4),0,Math.PI*2));
  shape(INK,()=>ctx.ellipse(side*13,27,9,5,side*.2,0,Math.PI*2));
 }
 shape(cast.color,()=>{
  if(index%4===0){ctx.moveTo(-29,19);ctx.bezierCurveTo(-33,-9,-20,-30,0,-30);ctx.bezierCurveTo(24,-30,30,-7,30,19);ctx.quadraticCurveTo(0,34,-29,19);}
  else if(index%4===1)ctx.roundRect(-29,-27,58,55,[13,13,20,20]);
  else if(index%4===2){ctx.moveTo(-29,21);ctx.lineTo(-29,-6);ctx.bezierCurveTo(-29,-39,29,-39,29,-6);ctx.lineTo(29,21);ctx.quadraticCurveTo(19,32,10,22);ctx.quadraticCurveTo(0,34,-10,22);ctx.quadraticCurveTo(-19,32,-29,21);}
  else ctx.ellipse(0,-1,24,32,-.12,0,Math.PI*2);
 });
 ctx.fillStyle=cast.light;ctx.beginPath();ctx.ellipse(-12,-16,6,10,.6,0,Math.PI*2);ctx.fill();
 // Pudding cherry, grumpy brows, marshmallow tuft, pickle bumps.
 if(index%4===0){shape('#ff646f',()=>ctx.arc(3,-32,7,0,Math.PI*2));ctx.beginPath();ctx.moveTo(4,-38);ctx.quadraticCurveTo(4,-45,11,-44);ctx.stroke();}
 if(index%4===2){shape(cast.color,()=>{ctx.moveTo(-9,-27);ctx.quadraticCurveTo(-16,-43,2,-33);ctx.quadraticCurveTo(17,-42,12,-26);});}
 if(index%4===3){ctx.fillStyle='#39b690';for(const [x,y] of [[-14,-19],[16,-10],[-15,16],[12,23]]){ctx.beginPath();ctx.ellipse(x,y,3,4,0,0,Math.PI*2);ctx.fill();}}
 // White eyes with pupils that look into the dash, panic, or spin after a real collision.
 for(const side of [-1,1]){
  const x=side*11;
  shape('white',()=>ctx.ellipse(x,-5,8,scared?11:9,0,0,Math.PI*2));
  ctx.fillStyle=INK;
  if(p.out||bonk){ctx.beginPath();ctx.moveTo(x-3,-8);ctx.lineTo(x+3,-2);ctx.moveTo(x+3,-8);ctx.lineTo(x-3,-2);ctx.stroke();}
  else if(blink&&!reduced){ctx.beginPath();ctx.moveTo(x-4,-5);ctx.lineTo(x+4,-5);ctx.stroke();}
  else{ctx.beginPath();ctx.arc(x+(aiming?0:Math.max(-2,Math.min(2,p.vx*.15))),aiming?-8:-4,3.5,0,Math.PI*2);ctx.fill();}
 }
 if(index%4===1||aiming){ctx.beginPath();ctx.moveTo(-19,-19);ctx.lineTo(-5,-14);ctx.moveTo(5,-14);ctx.lineTo(19,-19);ctx.stroke();}
 ctx.fillStyle='#f06b87';ctx.globalAlpha=.6;for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*20,7,5,3,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 if(scared||bonk)shape(INK,()=>ctx.ellipse(0,15,5,7,0,0,Math.PI*2));
 else if(index%4===1){ctx.beginPath();ctx.moveTo(-6,16);ctx.quadraticCurveTo(0,10,6,16);ctx.stroke();}
 else{shape('#fff9ea',()=>{ctx.moveTo(-9,10);ctx.quadraticCurveTo(0,27,9,10);ctx.closePath();});}
 if(scared&&!p.out){shape('#7ee1ff',()=>{ctx.moveTo(30,-28);ctx.quadraticCurveTo(19,-13,30,-13);ctx.quadraticCurveTo(40,-13,30,-28);});}
 if(bonk&&!reduced){ctx.fillStyle='#ffef69';for(let j=0;j<3;j++){const a=now/180+j*2.1;ctx.font='bold 17px sans-serif';ctx.fillText('✦',Math.cos(a)*30-6,-36+Math.sin(a)*5);}}
}
