import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,interpolate} from 'remotion';
import {paintDrawing} from '../../web/src/gameplay/drawing';
import demo from './decoupe-demo.json';
const lime='#def56a', white='#f5f5f8', muted='#bdbdc9', gold='#f4d77c';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const lerp=(f,a,b,x=0,y=1)=>interpolate(f,[a,b],[x,y],clamp);
const number=n=>n.toFixed(1).replace('.',',');
const size=800, left=92, top=555;
export function DecoupeFilm({video:v}){
 const f=useCurrentFrame(),canvas=useRef(null);
 const draw=lerp(f,82,124),hasLine=f>=83,selected=f>=155,locked=f>=195,reveal=f>=211,end=f>=359;
 const points=hasLine?[demo.points[0],[demo.points[0][0]+(demo.points[1][0]-demo.points[0][0])*draw,demo.points[0][1]+(demo.points[1][1]-demo.points[0][1])*draw]]:[];
 useLayoutEffect(()=>{
   const c=canvas.current?.getContext('2d');if(!c)return;
   const state=reveal?{history:demo.history}:{target:demo.target,history:[]};
   paintDrawing(c,state,'demo',size,reveal?'reveal':'drawpath',points,selected?1:-1,lerp(f,211,223));
 },[f]);
 const fadeEnd=lerp(f,359,371);
 const px=draw<1?points.at(-1)?.[0]??demo.points[0][0]:(selected ? .28 : .73);
 const py=draw<1?points.at(-1)?.[1]??demo.points[0][1]:.55;
 const gestureVisible=f>=73&&f<179;
 const instructions=f<73?'37 % de la forme. Tu couperais où ?':f<135?'Trace une ligne.':f<185?'Touche le côté que tu gardes.':f<211?'Valide ta coupe.':f<290?'Le jeu mesure la surface conservée.':'Tu pensais être plus précis ?';
 const musicVolume=frame=>0.18*interpolate(frame,[0,12,195,211,264,350,450],[0,1,1,.3,.65,.65,0],clamp);
 return <AbsoluteFill style={{background:'#16161c',color:white,fontFamily:'Arial, sans-serif'}}>
   <div style={{position:'absolute',top:0,left:0,right:0,height:11,background:lime}}/>
   <div style={{position:'absolute',left:92,right:168,top:155,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
    <div style={{fontSize:34,fontWeight:900,letterSpacing:-1}}>SLAP<span style={{color:lime}}>$</span>TAX</div>
    <div style={{fontSize:22,color:muted,letterSpacing:3}}>DÉCOUPE / 01</div>
   </div>
   <div style={{position:'absolute',left:92,top:209,fontSize:18,color:muted}}>DÉMONSTRATION ANIMÉE · MOTEUR DU JEU</div>
   <div style={{position:'absolute',left:92,right:168,top:268,opacity:1-fadeEnd}}>
     <div style={{fontSize:76,lineHeight:1.04,fontWeight:900,letterSpacing:-3}}>{reveal?'Tu avais dit 37 %.':'Découpe 37 %.'}</div>
     <div style={{fontSize:34,color:muted,marginTop:17}}>{reveal?'Voilà ce que tu as vraiment gardé.':'À vue d’œil. Sans calculer.'}</div>
   </div>
   <div style={{position:'absolute',left:92,right:168,top:450,display:'flex',alignItems:'center',justifyContent:'space-between',opacity:1-fadeEnd}}>
     <div style={{display:'flex',alignItems:'center',gap:22}}><span style={{color:muted,fontSize:20,fontWeight:800}}>PROPORTION<br/>CIBLE</span><strong style={{fontSize:64,color:gold,letterSpacing:-3}}>37<span style={{fontSize:35}}> %</span></strong></div>
     <div style={{textAlign:'right'}}><div style={{fontSize:17,color:muted}}>ESSAI 1 / 3</div><div style={{fontSize:37,color:reveal?lime:'#a6e6f0',fontWeight:900,marginTop:5}}>{reveal?'RÉSULTAT':locked?'VERROUILLÉ':`${Math.max(1,8-Math.floor(Math.max(0,f-45)/30))} s`}</div></div>
   </div>
   <div style={{position:'absolute',left,top,width:size,height:size,border:'2px solid #535360',borderRadius:14,overflow:'hidden',opacity:1-fadeEnd,transform:`scale(${reveal?interpolate(f,[211,221,235],[1,1.018,1],clamp):1})`}}>
     <canvas ref={canvas} width={size} height={size} style={{width:size,height:size,display:'block'}}/>
     {gestureVisible&&<div style={{position:'absolute',left:px*size-25,top:py*size-25,width:50,height:50,border:'3px solid #fff',borderRadius:'50%',background:'#ffffff40',boxShadow:'0 0 0 12px #ffffff12',opacity:lerp(f,73,82)*lerp(f,170,179,1,0)}}/>}
     {!hasLine&&<div style={{position:'absolute',left:30,bottom:28,fontSize:19,color:muted}}>UNE LIGNE. UN CÔTÉ À GARDER.</div>}
     {selected&&!locked&&<div style={{position:'absolute',left:50,top:510,fontSize:20,fontWeight:900,color:'#202517',background:lime,padding:'10px 14px',borderRadius:5}}>CÔTÉ GARDÉ ✓</div>}
     {locked&&!reveal&&<div style={{position:'absolute',bottom:25,left:25,right:25,background:'#24242eeb',color:lime,textAlign:'center',padding:20,fontSize:27,fontWeight:800}}>✓ COUPE VERROUILLÉE</div>}
   </div>
   <div style={{position:'absolute',top:1390,left:92,width:800,opacity:1-fadeEnd}}>
     {reveal?<div style={{display:'flex',gap:14}}>
       <div style={{flex:1,padding:'16px 22px',background:'#25292b',border:'1px solid #525c36',borderRadius:10}}><div style={{fontSize:17,color:muted}}>SURFACE GARDÉE</div><div style={{fontSize:56,fontWeight:900,color:lime}}>{number(demo.result.percent*lerp(f,211,232))}<span style={{fontSize:28}}> %</span></div></div>
       <div style={{flex:1,padding:'16px 22px',background:'#29262b',border:'1px solid #63534d',borderRadius:10}}><div style={{fontSize:17,color:muted}}>ÉCART À LA CIBLE</div><div style={{fontSize:56,fontWeight:900,color:'#ffab9c'}}>{number(demo.result.error*lerp(f,211,232))}<span style={{fontSize:25}}> pts</span></div></div>
     </div>:<div style={{height:90,background:hasLine?lime:'#35363a',color:hasLine?'#202517':'#95959e',display:'flex',justifyContent:'center',alignItems:'center',gap:18,fontSize:30,fontWeight:900,borderRadius:10,boxShadow:hasLine?'0 6px 0 #889e30':'none',transform:locked?'translateY(4px)':'none'}}>{locked?'✓ Coupe validée':'⌁ Valider la coupe'}</div>}
   </div>
   <div style={{position:'absolute',top:1555,left:92,width:800,fontSize:30,lineHeight:1.2,fontWeight:700,color:reveal?white:muted,opacity:1-fadeEnd}}>{instructions}</div>
   <div style={{position:'absolute',top:1650,left:92,width:800,display:'flex',gap:12,opacity:1-fadeEnd}}>{['TRACE','CHOISIS','VALIDE'].map((s,i)=><div key={s} style={{flex:1,borderTop:`3px solid ${f>=[82,155,195][i]?lime:'#41414c'}`,paddingTop:12,color:f>=[82,155,195][i]?lime:'#767681',fontSize:18,letterSpacing:2}}>{i+1}. {s}</div>)}</div>
   {end&&<AbsoluteFill style={{background:'#16161c',opacity:fadeEnd,padding:'440px 168px 300px 92px'}}>
     <div style={{fontSize:23,color:gold,letterSpacing:3}}>DÉCOUPE · SLAP$TAX</div>
     <div style={{marginTop:40,fontSize:100,lineHeight:1,fontWeight:900,letterSpacing:-5}}>Tu fais<br/><span style={{color:lime}}>mieux ?</span></div>
     <div style={{marginTop:50,fontSize:36,lineHeight:1.3,color:muted}}>Joue. Envoie ton défi.<br/>Demande la revanche.</div>
     <div style={{marginTop:65,padding:'27px 32px',background:lime,color:'#202517',fontSize:31,fontWeight:900,borderRadius:9}}>À toi de couper ↗</div>
     <div style={{fontSize:23,color:muted,marginTop:22}}>Slap Tax · lien en bio</div>
     <div style={{marginTop:100,fontSize:27,fontWeight:900}}>Bons amis.<br/>Mauvais perdants.</div>
     <div style={{marginTop:34,fontSize:18,color:muted}}>1 essai montré · une partie comporte 3 formes</div>
   </AbsoluteFill>}
   {v.music&&<Audio src={staticFile(v.music)} volume={musicVolume}/>}
   <Sequence from={82}><Audio src={staticFile('audio/cut-sweep.wav')} volume={.4}/></Sequence>
   <Sequence from={155}><Audio src={staticFile('audio/select.wav')} volume={.35}/></Sequence>
   <Sequence from={195}><Audio src={staticFile('audio/lock.wav')} volume={.4}/></Sequence>
   <Sequence from={211}><Audio src={staticFile('audio/reveal.wav')} volume={.45}/></Sequence>
   {v.voice&&<Sequence from={8}><Audio src={staticFile(v.voice)} volume={1}/></Sequence>}
 </AbsoluteFill>;
}
