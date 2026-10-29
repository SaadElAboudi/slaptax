import type {ChickenState} from '../../../gameplay/party';
const ink='#27243f';
export function paintRoyalChicken(c:CanvasRenderingContext2D,x:number,y:number,size=1,panic=0,now=0,reduced=false){
 c.save();c.translate(x,y);c.scale(size,size);const flap=reduced?0:Math.sin(now/(panic>.7?45:130))*7;
 c.fillStyle='#27243f44';c.beginPath();c.ellipse(1,25,27,8,0,0,Math.PI*2);c.fill();c.lineWidth=3;c.strokeStyle=ink;c.fillStyle='#ffe9b5';
 for(const side of [-1,1]){c.beginPath();c.ellipse(side*24,4+flap,12,7,side*.5,0,Math.PI*2);c.fill();c.stroke();}
 c.fillStyle=panic>.7?'#ffd0af':'#fff5dc';c.beginPath();c.ellipse(0,0,23,27,0,0,Math.PI*2);c.fill();c.stroke();
 c.fillStyle='#ffc74c';c.beginPath();c.moveTo(-17,-22);c.lineTo(-21,-40);c.lineTo(-7,-33);c.lineTo(0,-47);c.lineTo(8,-33);c.lineTo(21,-40);c.lineTo(17,-22);c.closePath();c.fill();c.stroke();c.fillStyle='#b987ea';c.beginPath();c.arc(0,-29,4,0,Math.PI*2);c.fill();c.stroke();
 for(const side of [-1,1]){c.fillStyle='white';c.beginPath();c.ellipse(side*9,-5,8,10,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=ink;c.beginPath();c.arc(side*9+(panic>.7?side:2),-3,3.5,0,Math.PI*2);c.fill();}
 c.fillStyle='#f5a63e';c.beginPath();c.moveTo(-7,7);c.lineTo(8,7);c.lineTo(0,16);c.closePath();c.fill();c.stroke();c.strokeStyle='#d46f67';c.lineWidth=5;c.beginPath();c.moveTo(-5,24);c.lineTo(-10,30);c.moveTo(6,24);c.lineTo(11,30);c.stroke();c.restore();
}
export function paintChickenFloor(c:CanvasRenderingContext2D){
 c.fillStyle='#6471a0';c.fillRect(0,0,900,600);
 for(let x=0;x<900;x+=75)for(let y=0;y<600;y+=75){c.fillStyle=(x+y)%150?'#737fa8':'#6b769f';c.fillRect(x+2,y+2,71,71);c.fillStyle='#b9c4dd55';c.fillRect(x+6,y+6,4,4);}
 for(const y of [8,566]){c.fillStyle='#2a2c49';c.fillRect(8,y,884,26);c.save();c.beginPath();c.rect(8,y,884,26);c.clip();c.strokeStyle='#efc75c';c.lineWidth=12;for(let x=0;x<940;x+=32){c.beginPath();c.moveTo(x,y+26);c.lineTo(x+22,y);c.stroke();}c.restore();}
 c.fillStyle='#41466c';c.font='900 18px sans-serif';c.textAlign='center';c.fillText('ROYAL POULTRY CO.',450,65);c.strokeStyle='#d4d6ec66';c.lineWidth=4;c.setLineDash([12,12]);c.strokeRect(345,190,210,220);c.setLineDash([]);
}
export function paintEggWarnings(c:CanvasRenderingContext2D,state:ChickenState,reduced:boolean){
 for(const egg of state.eggs){c.save();c.translate(egg.x,egg.y);
  if(egg.exploded){c.globalAlpha=Math.min(1,egg.remaining/400);c.fillStyle='#ffdb5fa0';c.beginPath();c.ellipse(0,0,egg.radius,egg.radius*.8,0,0,Math.PI*2);c.fill();c.fillStyle='#ffb83f';c.beginPath();c.arc(0,0,34,0,Math.PI*2);c.fill();}
  else{c.fillStyle='#f8817540';c.strokeStyle='#ffdd83';c.lineWidth=5;c.setLineDash([10,7]);c.beginPath();c.arc(0,0,egg.radius,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.strokeStyle='#fb9f91';c.beginPath();c.moveTo(-17,0);c.lineTo(17,0);c.moveTo(0,-17);c.lineTo(0,17);c.stroke();const height=reduced?42:42+egg.landsIn*.13;c.fillStyle='#fff1cc';c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.ellipse(0,-height,17,24,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff2cc';c.font='900 14px sans-serif';c.textAlign='center';c.fillText('!',0,5);}
  c.restore();
 }
}
