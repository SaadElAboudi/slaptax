import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {paintSnack} from '../../web/src/components/LiveGameArena/Snack/paintSnack';
import demo from './snack-demo.json';
export function SnackFilm({video:v}){
 const frame=useCurrentFrame(),canvas=useRef(null),i=Math.min(demo.frames.length-1,Math.floor((frame+(v.demoStart||0)*30)*(v.demoSpeed||1))),state=demo.frames[i];
 const scene=v.scenes.find(s=>frame>=s.from*30&&frame<s.to*30)||v.scenes.at(-1);
 useLayoutEffect(()=>{const c=canvas.current?.getContext('2d');if(c)paintSnack(c,state,'demo-a',{x:450,y:300,zoom:1},true,i/30*1000,false,600);},[i]);
 return <AbsoluteFill style={{background:'#1d3062',color:'#fff5db',fontFamily:'Arial, sans-serif'}}>
  <div style={{position:'absolute',top:140,left:70,right:130,fontSize:34,fontWeight:900}}>SLAP<span style={{color:'#ffda50'}}>$</span>TAX · LA CANTINE</div>
  <div style={{position:'absolute',top:235,left:70,right:150,fontSize:73,lineHeight:1.06,fontWeight:900,color:'#ffdf65'}}>{v.hook}</div>
  <div style={{position:'absolute',top:490,left:70,right:140,fontSize:29,lineHeight:1.4,color:'#d4e1f5'}}>{v.setup}</div>
  <div style={{position:'absolute',left:42,top:650,width:960,height:640,border:'5px solid #101c38',borderRadius:24,overflow:'hidden'}}><canvas ref={canvas} width={900} height={600} style={{width:960,height:640}}/></div>
  <div style={{position:'absolute',top:1325,left:70,right:140,padding:24,borderRadius:18,background:'#ffdf65',color:'#172849',fontSize:39,lineHeight:1.2,fontWeight:900}}>{scene.text}</div>
  <div style={{position:'absolute',top:1520,left:70,right:140,fontSize:26,fontWeight:700}}>UN STICK · BAFFE / LANCE · 3 CAISSES</div>
  <div style={{position:'absolute',top:1600,left:70,right:140,fontSize:24,color:'#d4e1f5'}}>DÉMO SCÉNARISÉE · MOTEUR DU JEU</div>
  {frame>=(v.duration-2.5)*30&&<AbsoluteFill style={{background:'#1d3062f5',padding:'490px 140px 300px 70px'}}><div style={{fontSize:28,color:'#ffdf65'}}>BRAQUAGE DU GOÛTER</div><div style={{fontSize:88,lineHeight:1.05,fontWeight:900,marginTop:35}}>Ton pote<br/>fait mieux ?</div><div style={{fontSize:38,lineHeight:1.4,marginTop:45}}>{v.cta}</div><div style={{fontSize:26,color:'#ffdf65',marginTop:45}}>slaptax-r9na.onrender.com</div><div style={{fontSize:22,color:'#c5d4ee',marginTop:55}}>Démonstration scénarisée · pas une partie humaine</div></AbsoluteFill>}
 </AbsoluteFill>;
}
