import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {paintTower} from '../../web/src/gameplay/party';
import tower from './tower-demo.json';
import bomb from './bomb-demo.json';
const label={position:'absolute',left:70,right:140,fontFamily:'Arial, sans-serif'};
function Footer(){return <div style={{...label,top:1600,fontSize:23,color:'#d9def1'}}>SLAP$TAX · DÉMO SCÉNARISÉE · MOTEUR DU JEU</div>;}
export function TowerFilm(){
 const f=useCurrentFrame(),c=useRef(null),pause=tower.bank.frame,i=Math.min(tower.frames.length-1,f<pause?f:f<pause+90?pause:f-90),run=tower.frames[i],decision=f>=pause&&f<pause+90,crashed=run.status==='crashed';
 useLayoutEffect(()=>{const ctx=c.current?.getContext('2d');if(ctx)paintTower(ctx,run,450,500,'#ffda75');},[i]);
 return <AbsoluteFill style={{background:'#382d52',color:'#fff6dc',fontFamily:'Arial, sans-serif'}}>
  <div style={{...label,top:135,fontSize:30,color:'#d8b7ff'}}>TOUR DE TROP · LE CHOIX DE TROP</div>
  <div style={{...label,top:215,fontSize:79,lineHeight:1.05,fontWeight:900}}>{crashed?'Il fallait s’arrêter.':decision?'Tu sécurises…\nou tu tentes ?':'« Encore un. »'}</div>
  <div style={{position:'absolute',left:65,top:480,border:'5px solid #211a35',borderRadius:30,overflow:'hidden'}}><canvas ref={c} width={450} height={500} style={{width:900,height:1000}}/></div>
  {decision&&<div style={{position:'absolute',left:105,top:700,right:160,padding:35,border:'4px solid #211a35',borderRadius:24,background:'#382d52ed',fontSize:43,lineHeight:1.35,fontWeight:900}}>SÉCURISER : {tower.bank.score} BLOCS<br/><span style={{color:'#ffcf83'}}>ENCORE UN : risque de tout perdre</span></div>}
  {crashed&&<div style={{position:'absolute',left:105,top:720,right:160,padding:40,borderRadius:24,background:'#211a35f5',fontSize:64,fontWeight:900,color:'#ffada3'}}>PLOUF.<div style={{fontSize:32,color:'#fff',marginTop:25}}>Cette tentative : 0 bloc sécurisé.<br/>L’autre choix gardait {tower.bank.score} blocs.</div></div>}
  <div style={{...label,top:1500,fontSize:35,fontWeight:900,color:'#ffda75'}}>{crashed?'Ton pote aurait arrêté quand ?':`${run.level||0} BLOCS · POSER OU SÉCURISER`}</div><Footer/>
 </AbsoluteFill>;
}
export function BombFilm(){
 const f=useCurrentFrame(),s=bomb.frames[Math.min(f,bomb.frames.length-1)],done=s.phase==='done',danger=s.fuse<2.5;
 const last=bomb.frames.slice(0,f+1).findLastIndex((p,i)=>i>0&&p.holder!==bomb.frames[i-1].holder),t=Math.min(1,Math.max(0,(f-last)/10));
 const to=s.holder==='a'?250:710,from=s.holder==='a'?710:250,x=last>=0?from+(to-from)*t:to;
 const scale=danger&&!done?1+Math.sin(f*.6)*.04:1;
 return <AbsoluteFill style={{background:done?'#c74d39':danger?'#63333f':'#203c49',color:'#fff1d6',fontFamily:'Arial, sans-serif'}}>
  <div style={{...label,top:135,fontSize:30,color:'#ffce85'}}>PASSE OU BOUM · LE COLIS DE L’INTENDANT</div>
  <div style={{...label,top:235,fontSize:82,lineHeight:1.05,fontWeight:900}}>{done?'Service après…\nBOUM.':danger?'Maintenant,\nc’est urgent.':'« Tiens.\nC’est pour toi. »'}</div>
  <div style={{position:'absolute',left:90,top:590,width:820,display:'flex',justifyContent:'space-between',fontSize:33,fontWeight:900}}><span style={{color:s.holder==='a'?'#ffe596':'#8caaa9'}}>TOI</span><span style={{color:s.holder==='b'?'#ffe596':'#8caaa9'}}>TON POTE</span></div>
  <div style={{position:'absolute',left:done?300:x-150,top:750,width:300,height:300,borderRadius:'50%',border:'8px solid #152b37',background:done?'#ffe096':'#45687a',boxShadow:'inset -20px -18px #182e45, inset 12px 10px #6b8f9d',transform:`scale(${done?1.5:scale})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:done?75:80,fontWeight:900}}>{done?'BOUM':s.fuse.toFixed(1)}{!done&&<><i style={{position:'absolute',width:40,height:55,borderRadius:'50%',background:'#fff',top:45,left:65,border:'5px solid #182642'}}/><i style={{position:'absolute',width:40,height:55,borderRadius:'50%',background:'#fff',top:45,right:65,border:'5px solid #182642'}}/></>}</div>
  {!done&&<><div style={{position:'absolute',top:1200,left:90,width:820,height:90,borderRadius:15,border:'4px solid #152b37',background:'#37568f'}}><div style={{position:'absolute',left:`${(s.center-s.width/2)*100}%`,width:`${s.width*100}%`,height:'100%',background:'#9bdeb6'}}/><div style={{position:'absolute',left:`${s.marker*100}%`,width:12,height:'100%',background:'#fff4b4'}}/></div><div style={{...label,top:1340,fontSize:37,fontWeight:900}}>ZONE VERTE → PASSE. SINON…</div></>}
  <div style={{...label,top:1470,fontSize:37,fontWeight:900,color:'#ffdd90'}}>{done?'Le colis a explosé. Une revanche ?':`${s.passes} PASSES · UN SEUL BOUTON`}</div><Footer/>
 </AbsoluteFill>;
}
