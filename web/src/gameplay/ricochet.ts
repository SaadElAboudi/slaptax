import type {RicochetBoard} from './party';

export function paintRicochet(ctx:CanvasRenderingContext2D,board:RicochetBoard | undefined,viewer:string,
    width:number,height:number,aim?:{angle:number;power:number}) {
    const size=Math.min(width,height),scale=size/600;
    ctx.save();ctx.clearRect(0,0,width,height);ctx.scale(scale,scale);
    ctx.fillStyle='#172422';ctx.fillRect(0,0,600,600);
    const ids=Object.keys(board?.origins || {}),flipped=ids.indexOf(viewer)===1;
    const pos=(p:{x:number;y:number})=>flipped ? {x:600-p.x,y:600-p.y} : p;
    ctx.strokeStyle='#314842';ctx.lineWidth=1;
    for(let x=60;x<600;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke();ctx.beginPath();ctx.moveTo(0,x);ctx.lineTo(600,x);ctx.stroke();}
    for(const r of [150,100,50]){ctx.beginPath();ctx.arc(300,300,r,0,Math.PI*2);ctx.strokeStyle=r===50 ? '#e7e5ca' : '#647c70';ctx.lineWidth=r===50 ? 2:1;ctx.stroke();}
    ctx.fillStyle='#e7e5ca';ctx.beginPath();ctx.arc(300,300,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#91ad9f';ctx.lineWidth=10;ctx.lineCap='round';
    for(const [x1,y1,x2,y2] of [[8,8,592,8],[8,592,592,592],[8,8,8,220],[8,380,8,592],[592,8,592,220],[592,380,592,592]]) {
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    ctx.fillStyle='#d7787b';ctx.fillRect(0,245,4,110);ctx.fillRect(596,245,4,110);
    if(aim && board?.origins[viewer]) {
        const p=pos(board.origins[viewer]),angle=aim.angle*Math.PI/180,length=65+aim.power;
        ctx.strokeStyle='#d7f48b';ctx.lineWidth=3;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x+Math.sin(angle)*length,p.y-Math.cos(angle)*length);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#d7f48b';ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#d7f48b66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,23,0,Math.PI*2);ctx.stroke();
    }
    for(const puck of board?.pucks || []) {
        const p=pos(puck),own=puck.owner===viewer;
        ctx.fillStyle='#0005';ctx.beginPath();ctx.arc(p.x+2,p.y+4,15,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=own ? '#d7f48b' : '#ff929d';ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=own ? '#5d762d' : '#9a4454';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#172422';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(puck.id.split('-')[0],p.x,p.y);
    }
    ctx.restore();
}
