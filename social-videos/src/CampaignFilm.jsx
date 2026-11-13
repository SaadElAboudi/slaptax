import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame,interpolate} from 'remotion';
import {paintDrawing} from '../../web/src/gameplay/drawing';
import {paintTower} from '../../web/src/gameplay/party';
import {paintSnack} from '../../web/src/components/LiveGameArena/Snack/paintSnack';
import {paintTable} from '../../web/src/components/LiveGameArena/Table/paintTable';
import {paintCarnival} from '../../web/src/components/LiveGameArena/Carnival/paintCarnival';
import cut from './decoupe-demo.json';
import snack from './snack-demo.json';
import tower from './tower-demo.json';
import demos from './campaign-demo.json';
import campaign from '../campaign.json';
const ink='#172d3e',cream='#fff3da',gold='#ffda77';
const blend=(f,a,b)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const decimal=n=>n.toFixed(1).replace('.',',');
const backgrounds={decoupe:'#345954',chroma:'#574270',onemore:'#473759',snack:'#294864',table:'#5d4847',pie:'#554661'};
const fixed={position:'absolute',left:70,right:170};
function Canvas({width,height,draw,frame}){const ref=useRef(null);useLayoutEffect(()=>{const c=ref.current?.getContext('2d');if(c)draw(c);},[frame]);return <canvas ref={ref} width={width} height={height} style={{width:width>height?820:820*width/height,height:width>height?820*height/width:820,display:'block'}}/>;}
function Touch({x,y,visible}){return visible&&<div style={{position:'absolute',left:x-23,top:y-23,width:46,height:46,border:'4px solid white',borderRadius:'50%',background:'#ffffff40',boxShadow:'0 0 0 11px #ffffff22'}}/>;}
function ChromaBoard({frame}){
 const s=demos.chroma.frames[Math.min(frame,359)],observe=s.phase==='observe',reveal=s.phase==='reveal',rgb=v=>`rgb(${v.join(',')})`;
 return <div style={{width:820,height:820,padding:40,boxSizing:'border-box',display:'flex',flexDirection:'column',justifyContent:'center',gap:32,background:'#273d4b'}}>
  <div style={{fontSize:30,fontWeight:900,textAlign:'center'}}>{observe?'MÉMORISE CETTE COULEUR':reveal?'LE JEU RÉVÈLE LA DIFFÉRENCE':'LA CIBLE EST CACHÉE'}</div>
  {reveal?<div style={{display:'flex',gap:26}}>{[[s.feedback.color,'CIBLE'],[s.feedback.colors.demo,'TA NUANCE']].map(([v,name])=><div key={name} style={{flex:1}}><div style={{height:430,borderRadius:24,background:rgb(v),border:`5px solid ${ink}`}}/><div style={{fontSize:29,textAlign:'center',marginTop:20,fontWeight:900}}>{name}</div></div>)}</div>:<div style={{height:500,borderRadius:26,background:rgb(observe?s.color:s.draft),border:`5px solid ${ink}`,display:'grid',placeItems:'center'}}><strong style={{fontSize:observe?90:32,color:ink,background:'#fff4dfcc',padding:'12px 22px',borderRadius:12}}>{observe?`${Math.max(1,2-Math.floor(frame/30))} s`:'AJUSTE LA NUANCE'}</strong></div>}
  <div style={{fontSize:28,lineHeight:1.35,textAlign:'center',color:'#d9e7e8'}}>{observe?'Après, il faudra la retrouver.':reveal?'Pas de bonus de vitesse. La précision compte.':'Retrouve la nuance. Puis verrouille.'}</div>
 </div>;
}
export function CampaignFilm({video:v}){
 const f=useCurrentFrame(),game=v.game;let board,status='',instruction='',headline=v.hook;
 if(game==='decoupe'){
  const a=blend(f,45,105),points=f<45?[]:[cut.points[0],[cut.points[0][0]+(cut.points[1][0]-cut.points[0][0])*a,cut.points[0][1]+(cut.points[1][1]-cut.points[0][1])*a]],served=f>=140,reveal=f>=165;
  status=reveal?`${decimal(cut.result.percent)} % servis · ${decimal(cut.result.error)} points d’écart`:'CIBLE : 37 %';instruction=f<45?'Estime la bonne portion.':f<110?'Trace une ligne.':f<165?'Touche le morceau à servir.':'À l’œil, ça paraissait parfait…';
  board=<><Canvas width={800} height={800} frame={f} draw={c=>paintDrawing(c,reveal?{history:cut.history}:{target:cut.target,history:[]},'demo',800,reveal?'reveal':'drawpath',points,served?1:-1,blend(f,165,180))}/><Touch x={f<110?(points.at(-1)?.[0]||.445)*820:230} y={f<110?(points.at(-1)?.[1]||.08)*820:450} visible={f>=45&&f<148}/></>;if(reveal)headline='Tu avais dit 37 %.';
 }else if(game==='chroma'){
  board=<ChromaBoard frame={f}/>;status=f<60?'OBSERVE · DEUX SECONDES':f<210?'RECRÉE LA COULEUR DE MÉMOIRE':'CIBLE ET TA NUANCE';instruction=f<60?'Regarde bien. Elle va disparaître.':f<210?'Même nuance… ou presque ?':'Ton ami a-t-il vraiment le même œil ?';if(f>=210)headline='Presque. Pas pareil.';
 }else if(game==='onemore'){
  const pause=tower.bank.frame,index=Math.min(tower.frames.length-1,f<pause?f:f<pause+60?pause:f-60),run=tower.frames[index],decision=f>=pause&&f<pause+60,crashed=run.status==='crashed';
  board=<><Canvas width={450} height={500} frame={f} draw={c=>paintTower(c,run,450,500,gold)}/>{decision&&<div style={{position:'absolute',inset:'240px 35px auto',padding:28,borderRadius:20,background:'#172d3ef2',fontSize:40,lineHeight:1.4,fontWeight:900}}>SÉCURISER {tower.bank.score} BLOCS ?<br/><span style={{color:gold}}>OU TENTER ENCORE UN ?</span><small style={{display:'block',fontSize:23,marginTop:15}}>Arrêt sur image</small></div>}</>;
  status=crashed?'CET ESSAI : 0 BLOC SÉCURISÉ':`${run.level} BLOCS EMPILÉS`;instruction=crashed?'L’autre choix gardait six blocs.':decision?'Tu t’arrêtes ici, toi ?':'Pose au bon moment. Garde de la marge.';if(crashed)headline='Le bloc de trop.';
 }else if(game==='snack'){
  const i=Math.min(f,snack.frames.length-1),s=snack.frames[i],own=s.bodies.find(p=>p.id==='demo-a');
  board=<Canvas width={900} height={800} frame={f} draw={c=>paintSnack(c,s,'demo-a',{x:Math.max(250,Math.min(650,own.x)),y:300,zoom:1.8},true,i/30*1000,false,800)}/>;status=`${own.captures} / 3 LIVRAISONS · UN STICK + BAFFE / LANCE`;instruction=i<83?'Attrape le goûter. Ramène-le au dépôt.':i<119?'Une caisse livrée. Le rival arrive.':i<170?'Une baffe. Le goûter tombe.':'Récupère-le. Livre avant lui.';if(i>=125&&i<170)headline='Rends. Le. Goûter.';
 }else if(game==='table'){
  const replay=f>=180&&f<300,i=replay?Math.min(demos.table.end,60+Math.floor((f-180)/2)):Math.min(f,359),s=demos.table.frames[i],aim=i<60?{dx:0,dy:-1,power:blend(i,0,59)}:null;
  board=<Canvas width={600} height={600} frame={f} draw={c=>paintTable(c,s.table,'demo',aim,i*1000/30,true,false)}/>;status=replay?'REPLAY · MÊME CHOC, RALENTI ×2':s.phase==='done'?'RIVAL HORS DE LA TABLE':'VISE LA DESTINATION · RELÂCHE POUR FONCER';instruction=i<60?'Choisis ton angle.':s.phase==='done'?'Et voilà pourquoi on ne reste pas au bord.':'Une impulsion. Attention au bord.';if(replay)headline='Regarde le choc.';
 }else if(game==='pie'){
  const s=demos.pie.frames[Math.min(f,359)],self=s.carnival.bodies.find(p=>p.id==='demo'),other=s.carnival.bodies.find(p=>p.id==='rival'),dodge=s.carnival.events.some(e=>e.age<900&&e.kind==='dodged');
  board=<Canvas width={600} height={420} frame={f} draw={c=>paintCarnival(c,s.carnival,'demo',true,other.x,false)}/>;status=`TOI ${self.score} · RIVAL ${other.score}`;instruction=dodge?'ESQUIVÉ ! Maintenant, riposte.':'Touche pour lancer. Esquive pour riposter.';if(dodge)headline='Raté. À mon tour.';
 }
 return <AbsoluteFill style={{background:backgrounds[game],color:cream,fontFamily:'Arial, sans-serif'}}>
  <div style={{...fixed,top:140,fontSize:32,fontWeight:900}}>SLAP<span style={{color:gold}}>$</span>TAX <span style={{fontSize:22,fontWeight:600,color:'#e2ddeb'}}>· LES DÉFIS ENTRE AMIS</span></div>
  <div style={{...fixed,top:205,fontSize:25,fontWeight:800,color:gold}}>{v.title.toUpperCase()}</div>
  <h1 style={{...fixed,top:260,margin:0,fontSize:74,lineHeight:1.08,fontWeight:900,letterSpacing:-2}}>{headline}</h1>
  <div style={{position:'absolute',left:70,top:500,width:820,height:820,border:`5px solid ${ink}`,borderRadius:26,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'#1e3545'}}>{board}</div>
  <div style={{...fixed,top:1355,color:gold,fontSize:27,fontWeight:900,lineHeight:1.3}}>{status}</div>
  <div style={{...fixed,top:1430,fontSize:39,lineHeight:1.25,fontWeight:800}}>{instruction}</div>
  <div style={{...fixed,top:1565,fontSize:22,lineHeight:1.5,color:'#dfebed'}}>DÉMONSTRATION SCÉNARISÉE<br/>{v.disclosure}</div>
  {f>=360&&<AbsoluteFill style={{background:backgrounds[game],padding:'360px 170px 240px 70px'}}>
   <div style={{fontSize:32,fontWeight:900,color:gold}}>SLAP$TAX · {v.title.toUpperCase()}</div>
   <div style={{fontSize:105,fontWeight:950,lineHeight:1.03,letterSpacing:-4,marginTop:70}}>Tu peux<br/>faire mieux ?</div>
   <div style={{fontSize:42,lineHeight:1.4,marginTop:50}}>Joue. Défie un ami.<br/>Prends ta revanche.</div>
   <div style={{background:gold,color:ink,borderRadius:18,padding:30,fontSize:36,fontWeight:900,marginTop:65,textAlign:'center'}}>À TOI DE JOUER ↗</div>
   <div style={{fontSize:42,lineHeight:1.5,marginTop:30,overflowWrap:'anywhere'}}>{campaign.destination.replace('https://','')}</div>
   <div style={{fontSize:22,color:'#dfebed',lineHeight:1.5,marginTop:70}}>Démonstration scénarisée.<br/>Extrait de jeu.</div>
  </AbsoluteFill>}
 </AbsoluteFill>;
}
