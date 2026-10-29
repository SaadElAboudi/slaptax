import type {SnackState,SnackBody} from './party';
export function previewSnackBody(body:SnackBody,dx:number,dy:number,elapsed:number,walls:SnackState['walls']):SnackBody{
 if(body.respawnIn||body.dashing)return body;
 const dt=Math.min(100,Math.max(0,elapsed))/1000,d=Math.max(1,Math.hypot(dx,dy)),speed=body.speed??(body.carrying?165:215),p={...body};
 p.x=Math.max(28,Math.min(872,p.x+dx/d*speed*dt));
 for(const w of walls)if(p.x>w.x-23&&p.x<w.x+w.w+23&&p.y>w.y-23&&p.y<w.y+w.h+23)p.x=dx>0?w.x-23:w.x+w.w+23;
 p.y=Math.max(28,Math.min(572,p.y+dy/d*speed*dt));
 for(const w of walls)if(p.x>w.x-23&&p.x<w.x+w.w+23&&p.y>w.y-23&&p.y<w.y+w.h+23)p.y=dy>0?w.y-23:w.y+w.h+23;
 return p;
}
