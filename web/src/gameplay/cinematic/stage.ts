import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {PartyState} from '../party';

const palette=[0xffc84b,0xff667e,0x55d7c2,0xae86ff];
type Avatar={group:T.Group;left:T.Mesh;right:T.Mesh;armL:T.Mesh;armR:T.Mesh;ring:T.Mesh;wasOut:boolean};
export function createStage(canvas:HTMLCanvasElement,kind:'race'|'table',identity:string,initial:PartyState,initialBots:string[]){
 const coarse=matchMedia('(pointer:coarse)').matches;
 const renderer=new T.WebGLRenderer({canvas,antialias:!coarse,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.25:1.5));
 renderer.shadowMap.enabled=!matchMedia('(pointer:coarse)').matches;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new T.Scene();scene.background=new T.Color(0x19202f);scene.fog=new T.Fog(0x19202f,24,58);
 const camera=new T.PerspectiveCamera(40,1,.1,100);
 const target=kind==='race'?new T.Vector3(0,.7,-1):new T.Vector3(0,0,0);
 camera.position.set(kind==='race'?0:6,kind==='race'?10.5:10,kind==='race'?22:16);camera.lookAt(target);
 scene.add(new T.HemisphereLight(0xc7e5ff,0x554054,1.9));
 const key=new T.DirectionalLight(0xffe6c9,3.4);key.position.set(-8,16,9);key.castShadow=true;
 key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:45});key.shadow.bias=-.0015;scene.add(key);
 const rim=new T.DirectionalLight(0x69cfff,2.1);rim.position.set(9,8,-10);scene.add(rim);
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
 const boxGeo=new RoundedBoxGeometry(1,1,1,2,.12);geometries.add(boxGeo);
 const sphereGeo=new T.SphereGeometry(1,16,12);geometries.add(sphereGeo);
 const cylinderGeo=new T.CylinderGeometry(1,1,1,24);geometries.add(cylinderGeo);
 function material(color:number,metalness=.05,roughness=.65){const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;}
 const navy=material(0x202738,.2),cream=material(0xf0dfc7),coral=material(0xe7667a),teal=material(0x58b8b1),gold=material(0xf4c568,.3);
 const glass=material(0x142433,.55,.17),floor=material(0x384254,.1,.8);
 function mesh(geometry:T.BufferGeometry,mat:T.Material,parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,shadow=false){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
 function box(mat:T.Material,parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,shadow=false){return mesh(boxGeo,mat,parent,x,y,z,sx,sy,sz,shadow);}
 function ball(mat:T.Material,parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,shadow=false){return mesh(sphereGeo,mat,parent,x,y,z,sx,sy,sz,shadow);}
 function batch(mat:T.Material,transforms:number[][]){const inst=new T.InstancedMesh(boxGeo,mat,transforms.length),dummy=new T.Object3D();transforms.forEach(([x,y,z,sx,sy,sz],i)=>{dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.receiveShadow=true;scene.add(inst);return inst;}
 box(floor,scene,0,kind==='table'?-3.4:-.35,0,24,.6,30);
 // Architecture and audience sit outside the playable surface.
 batch(coral,[-1,1].flatMap(side=>[-11,-7,-3,1,5,9].map(z=>[side*9,2,z,.55,4.5,.55])));
 batch(navy,[-1,1].flatMap(side=>[0,1,2].map(i=>[side*(7.8+i*.65),i*.48-.05,0,.75,.8,25])));
 batch(teal,[-1,1].flatMap(side=>[-10,-7,-4,-1,2,5,8,11].map((z,i)=>[side*(8.3+(i%2)*.4),.7+(i%2)*.45,z,.42,.65,.45])));
 box(navy,scene,0,3.7,-12.5,22,8,.7);box(coral,scene,0,.4,-11.8,21,.8,.4);
 const lightMaterial=new T.MeshBasicMaterial({color:0xf8ead2});materials.add(lightMaterial);
 batch(lightMaterial,[-1,1].flatMap(side=>[-8,0,8].map(z=>[side*8.5,4.5,z,.12,.12,3])));
 const avatars=new Map<string,Avatar>();
 function avatar(id:string,index:number,bot:boolean){const group=new T.Group(),mat=material(palette[index%4],.15,.36);scene.add(group);
  const left=box(navy,group,-.18,.21,0,.22,.43,.28),right=box(navy,group,.18,.21,0,.22,.43,.28);
  box(mat,group,0,.68,0,.72,.65,.46,true);box(cream,group,0,.72,.24,.3,.3,.03);
  ball(mat,group,0,1.2,0,.43,.4,.37,true);box(glass,group,0,1.2,.32,.64,.24,.13);
  for(const x of [-.15,.15])box(lightMaterial,group,x,1.22,.4,.065,.09,.02);
  const armL=box(mat,group,-.46,.7,0,.19,.52,.23),armR=box(mat,group,.46,.7,0,.19,.52,.23);
  if(bot){box(navy,group,0,1.66,0,.045,.22,.045);ball(mat,group,0,1.8,0,.08,.08,.08);}
  const shadowGeo=new T.CircleGeometry(.55,20);geometries.add(shadowGeo);const shadowMat=new T.MeshBasicMaterial({color:0x101522,transparent:true,opacity:.3,depthWrite:false});materials.add(shadowMat);const contact=new T.Mesh(shadowGeo,shadowMat);contact.rotation.x=-Math.PI/2;contact.position.y=.012;group.add(contact);
  const ringGeo=new T.TorusGeometry(.55,.025,6,32);geometries.add(ringGeo);
  const ring=new T.Mesh(ringGeo,id===identity?lightMaterial:mat);ring.rotation.x=-Math.PI/2;ring.position.y=.02;group.add(ring);
  const a={group,left,right,armL,armR,ring,wasOut:false};avatars.set(id,a);return a;
 }
 let guardian:T.Group|null=null,eyes:T.MeshStandardMaterial|null=null,table:T.Mesh|null=null,edge:T.Mesh|null=null;
 const lamps:T.Mesh[]=[];
 if(kind==='race'){
  batch(teal,[-3,-1,1,3].map(x=>[x,-.015,0,1.85,.1,16]));
  batch(cream,[-4,-2,0,2,4].map(x=>[x,.045,0,.025,.025,16]));
  batch(gold,[-3,-1,1,3].map(x=>[x,.075,-6.4,1.8,.04,.2]));
  batch(cream,Array.from({length:16},(_,i)=>[-3.75+i*.5,.09,-6.7,.24,.04,.35]));
  guardian=new T.Group();guardian.position.set(0,0,-9.1);scene.add(guardian);
  box(coral,guardian,0,1.65,0,3.5,3.1,1.6,true);box(cream,guardian,0,3.7,0,4.4,2.4,2,true);
  box(glass,guardian,0,3.7,1.05,3.7,1.15,.2);
  eyes=material(0x80ffd2,.1,.2);eyes.emissive.set(0x80ffd2);eyes.emissiveIntensity=.65;
  for(const x of [-.95,.95])ball(eyes,guardian,x,3.7,1.3,.4,.4,.14);
  for(const x of [-2.25,2.25])box(coral,guardian,x,1.75,0,.65,2.4,.85,true);
  for(const x of [-.95,.95])box(navy,guardian,x,.18,.4,.9,.35,1.4,true);
  box(navy,guardian,0,1.65,.83,1.6,1.1,.15);for(const y of [1.35,1.65,1.95])box(cream,guardian,0,y,.94,1.1,.08,.08);
  box(cream,scene,0,5.5,-8.8,12,.2,.25);
  box(gold,guardian,0,5.13,0,.18,.7,.18);ball(gold,guardian,0,5.6,0,.25,.25,.25);
  for(const x of [-4.8,4.8]){box(navy,scene,x,1.3,-7.5,.3,2.7,.3);lamps.push(ball(eyes,scene,x,2.8,-7.5,.22,.22,.22));}
 }else{
  // Every moving body is server-owned. The tabletop is a real 3D surface.
  box(navy,scene,0,-2.7,0,13,.4,13);table=box(coral,scene,0,-.3,0,10.4,.6,10.4,true);
  edge=box(cream,scene,0,-.12,0,10.5,.15,10.5);
  for(const x of [-3.9,3.9])for(const z of [-3.9,3.9])box(gold,scene,x,-1.6,z,.45,2.8,.45);
  const markerGeo=new T.RingGeometry(.9,1,48);geometries.add(markerGeo);const marker=new T.Mesh(markerGeo,gold);marker.rotation.x=-Math.PI/2;marker.position.y=.015;scene.add(marker);
 }
 const observer=new ResizeObserver(()=>resize());
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 observer.observe(canvas);resize();
 const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();
 const aimArrow=new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(),2,0xfff0b7,.45,.25);aimArrow.visible=false;scene.add(aimArrow);
 const initialIds=kind==='race'?Object.keys(initial.survival?.players||initial.scores):initial.table?.bodies.map(p=>p.id)||Object.keys(initial.scores);
 initialIds.forEach((id,i)=>avatar(id,i,initialBots.includes(id)||!!initial.table?.bodies.find(p=>p.id===id)?.bot));
 const ready=renderer.compileAsync(scene,camera);
 let previousTime=0,lastShadow=0,lastSignal='',started=performance.now();
 function render(party:PartyState,botIds:string[],now:number,reduced:boolean,aim?:{dx:number;dy:number;power:number}|null){
  const dt=Math.min(.08,Math.max(0,(now-previousTime)/1000));previousTime=now;
  const participants=kind==='race'?Object.entries(party.survival?.players||{}).map(([id,p])=>({id,progress:p.progress,out:p.out,finished:p.finished,x:0,y:0,bot:botIds.includes(id)})):(party.table?.bodies||[]).map(p=>({...p,progress:0,finished:false}));
  for(const [i,p]of participants.entries()){
   const a=avatars.get(p.id)||avatar(p.id,i,p.bot),run=kind==='race'&&party.survival?.signal==='go'&&!p.out&&!p.finished;
   const x=kind==='race'?-3+i*2:(p.x-300)/50,z=kind==='race'?6-p.progress*12:(p.y-300)/50;
   const factor=Math.min(1,dt*16);
   if(!a.group.userData.placed){a.group.position.set(x,0,z);a.group.userData.placed=true;}else{a.group.position.x=T.MathUtils.lerp(a.group.position.x,x,factor);a.group.position.z=T.MathUtils.lerp(a.group.position.z,z,factor);}
   if(p.out&&!a.wasOut)a.group.userData.outAt=now;a.wasOut=p.out;
   const fall=p.out?Math.min(1,(now-(a.group.userData.outAt||now))/600):0;
   a.group.position.y=p.out?-fall*4:run&&!reduced?Math.abs(Math.sin(now/95+i))*.055:0;
   a.group.rotation.z=p.out?fall*.9:0;
   a.group.rotation.y=kind==='race'?Math.PI:(p.id===identity?0:Math.atan2(-x,-z));
   a.group.visible=fall<1;
   const stride=run&&!reduced?Math.sin(now/105+i)*.55:0;a.left.rotation.x=stride;a.right.rotation.x=-stride;a.armL.rotation.x=-stride*.65;a.armR.rotation.x=stride*.65;
   a.ring.visible=!p.out;
  }
  if(kind==='race'&&guardian&&eyes){const signal=party.survival?.signal||'stop',color=signal==='go'?0x83ffd4:signal==='release'?0xffc74b:0xff4268;
   if(signal!==lastSignal){eyes.color.set(color);eyes.emissive.set(color);lastSignal=signal;}
   guardian.rotation.y=T.MathUtils.lerp(guardian.rotation.y,signal==='go'?-.5:0,Math.min(1,dt*7));
   if(!reduced){const ease=Math.max(0,1-(now-started)/1600);camera.position.set(ease*1.5,10.5+ease,22+ease*2);camera.lookAt(target);}
  }
  if(kind==='table'&&table&&edge&&party.table){const size=(600-party.table.bound*2)/50;table.scale.x=size;table.scale.z=size;edge.scale.x=size+.08;edge.scale.z=size+.08;
   table.material=party.table.cloth?.phase==='warning'?gold:coral;
  }
  const own=party.table?.bodies.find(p=>p.id===identity);aimArrow.visible=kind==='table'&&!!aim&&!!own&&!own.out;
  if(aimArrow.visible&&aim&&own){aimArrow.position.set((own.x-300)/50,.2,(own.y-300)/50);aimArrow.setDirection(new T.Vector3(aim.dx,0,aim.dy).normalize());aimArrow.setLength(1+aim.power*2,.4,.22);}
  if(now-lastShadow>200){renderer.shadowMap.needsUpdate=true;lastShadow=now;}
  const before=performance.now();renderer.render(scene,camera);canvas.dataset.renderMs=(performance.now()-before).toFixed(1);
 }
 return{ready,render,reduceQuality(level:number){renderer.setPixelRatio(Math.min(devicePixelRatio||1,level===1?.8:.6));renderer.shadowMap.enabled=false;resize();},project(nx:number,ny:number){ray.setFromCamera(new T.Vector2(nx*2-1,1-ny*2),camera);if(!ray.ray.intersectPlane(plane,hit))return null;return{x:hit.x*50+300,y:hit.z*50+300};},dispose(){observer.disconnect();aimArrow.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();key.shadow.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
