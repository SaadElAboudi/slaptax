// Deterministic, bounded bursts. No timers, allocations retained or random state.
export function paintImpact(c:CanvasRenderingContext2D,x:number,y:number,age:number,color:string,reduced=false){
 if(age<0||age>500)return;
 const t=age/500;c.save();c.globalAlpha=1-t;c.strokeStyle='#182642';c.lineWidth=2;c.fillStyle=color;
 if(!reduced){for(let i=0;i<8;i++){const a=i*Math.PI/4,reach=18+t*70,dx=x+Math.cos(a)*reach,dy=y+Math.sin(a)*reach+t*t*25;c.save();c.translate(dx,dy);c.rotate(a+t*3);c.fillRect(-4,-7,8,14);c.strokeRect(-4,-7,8,14);c.restore();}}
 c.lineWidth=4;c.beginPath();c.ellipse(x,y,22+t*35,12+t*22,0,0,Math.PI*2);c.stroke();c.restore();
}
