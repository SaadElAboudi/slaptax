/** Static scenery: no random numbers, no timers, no invented gameplay objects.
 * Kept behind the playfield so targets and collision coordinates stay unchanged. */
export type WorkshopScene = 'street' | 'elevator' | 'bakery' | 'pressure' | 'washroom' | 'canteen' | 'warehouse' | 'kitchen';
const ink = '#182a39';
function panel(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,r=8){
 c.fillStyle=color;c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();
}
function bolt(c:CanvasRenderingContext2D,x:number,y:number){c.fillStyle='#b8d0cf';c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(x-2,y+2);c.lineTo(x+2,y-2);c.stroke();}
function drawScenery(c:CanvasRenderingContext2D,scene:WorkshopScene,width:number,height:number){
 c.save();c.scale(width/600,height/600);
 const sky=scene==='street',warm=['bakery','kitchen','canteen'].includes(scene);
 const gradient=c.createLinearGradient(0,0,0,600);gradient.addColorStop(0,sky?'#78c9db':warm?'#9bb9ad':'#709b9d');gradient.addColorStop(1,sky?'#e2f2d6':warm?'#e9d6ac':'#c3ddd1');c.fillStyle=gradient;c.fillRect(0,0,600,600);
 if(sky){
  // Two layers of original wonky buildings; far windows remain low contrast.
  for(let i=0;i<11;i++){const x=i*62-25,y=235+(i*37%100);c.fillStyle=i%2?'#8db9bb':'#a4c9c3';c.fillRect(x,y,58,430-y);for(let j=0;j<3;j++)for(let k=0;k<3;k++){c.fillStyle='#cce1cb';c.fillRect(x+10+j*15,y+17+k*24,7,12);}}
  for(let i=0;i<5;i++){const x=i*145-30,y=340+(i%2)*25;panel(c,x,y,120,180,i%2?'#c6b897':'#d5c9a8',4);for(let j=0;j<3;j++){panel(c,x+12+j*33,y+16,23,38,'#6c9da5',3);}panel(c,x+10,y+79,100,16,i%2?'#c47a72':'#67a18d',3);}
 }else{
  for(let x=0;x<600;x+=100){c.strokeStyle='#ffffff24';c.lineWidth=3;c.beginPath();c.moveTo(x,0);c.lineTo(x,600);c.stroke();}
  // Overhead steel beam, lamps and insulated side pipes frame the arena.
  panel(c,0,0,600,34,'#344e55',0);
  for(const x of [24,576]){panel(c,x-8,42,16,510,'#668c8d',5);for(const y of [70,290,510])panel(c,x-13,y,26,12,'#adc4b9',3);bolt(c,x,17);}
  for(const x of [150,450]){c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.moveTo(x,34);c.lineTo(x,55);c.stroke();panel(c,x-35,52,70,12,'#f7d976',4);c.fillStyle='#fff4b522';c.beginPath();c.moveTo(x-25,65);c.lineTo(x-95,220);c.lineTo(x+95,220);c.lineTo(x+25,65);c.fill();}
  if(scene==='warehouse'){
   for(const x of [75,525]){panel(c,x-13,80,26,480,'#dcaa50',3);for(let y=90;y<540;y+=65){c.strokeStyle='#6c765c';c.lineWidth=5;c.beginPath();c.moveTo(x-10,y);c.lineTo(x+10,y+50);c.stroke();}}
   c.strokeStyle='#8aa9a1';c.lineWidth=6;c.beginPath();c.moveTo(88,110);c.lineTo(512,110);c.moveTo(88,210);c.lineTo(512,210);c.stroke();
  }
  if(scene==='pressure')for(const x of [70,530]){panel(c,x-20,150,40,300,'#5e8790',18);panel(c,x-12,165,24,245,'#a9d6d0',10);for(let y=190;y<390;y+=45){c.strokeStyle='#527a7b';c.lineWidth=2;c.beginPath();c.moveTo(x-10,y);c.lineTo(x+5,y);c.stroke();}}
  if(scene==='elevator'){panel(c,245,45,110,35,'#233e48',7);c.fillStyle='#f9d879';c.font='900 22px sans-serif';c.textAlign='center';c.fillText('▲ 13 ▼',300,70);}
  c.fillStyle=warm?'#968f74':'#789a92';c.fillRect(0,540,600,60);c.strokeStyle='#4b6967';c.lineWidth=3;c.beginPath();c.moveTo(0,540);c.lineTo(600,540);for(let x=-300;x<900;x+=100){c.moveTo(300+(x-300)*.75,540);c.lineTo(x,600);}c.stroke();
 }
 // Soft edge shading gives depth without obscuring the center or adding animation.
 const shade=c.createLinearGradient(0,0,600,0);shade.addColorStop(0,'#172b3930');shade.addColorStop(.12,'#172b3900');shade.addColorStop(.88,'#172b3900');shade.addColorStop(1,'#172b3930');c.fillStyle=shade;c.fillRect(0,0,600,600);
 c.restore();
}
// Keep at most four 600 x 600 static backdrops (about 5.8 MB of pixel data).
// Characters, targets and effects are still drawn live above this layer.
const backdrops=new Map<WorkshopScene,HTMLCanvasElement>();
export function paintScenery(c:CanvasRenderingContext2D,scene:WorkshopScene,width:number,height:number){
 if(typeof document==='undefined'){drawScenery(c,scene,width,height);return;}
 let backdrop=backdrops.get(scene);
 if(!backdrop){const surface=document.createElement('canvas');surface.width=600;surface.height=600;const context=surface.getContext('2d');if(!context){drawScenery(c,scene,width,height);return;}drawScenery(context,scene,600,600);if(backdrops.size>=4)backdrops.delete(backdrops.keys().next().value!);backdrops.set(scene,surface);backdrop=surface;}
 c.drawImage(backdrop,0,0,width,height);
}
/** Metal rim only: usable board coordinates are not reduced by decoration. */
export function paintRim(c:CanvasRenderingContext2D,size:number){c.save();c.scale(size/600,size/600);c.strokeStyle=ink;c.lineWidth=10;c.strokeRect(5,5,590,590);for(const x of [13,587])for(const y of [13,587])bolt(c,x,y);c.restore();}
