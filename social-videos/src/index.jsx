import React from 'react';
import {registerRoot,Composition,AbsoluteFill,Audio,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import videos from './catalog.json';
import {SnackFilm} from './SnackFilm';
import {DecoupeFilm} from './DecoupeFilm';
const accent='#def56a', bg='#101514';
function Film({video:v}) {
  const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig();
  const progress=frame/(durationInFrames-1);
  const scene=v.scenes.find(s=>frame>=s.from*fps&&frame<s.to*fps)||v.scenes.at(-1);
  const fade=interpolate(frame,[0,5,durationInFrames-10,durationInFrames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:bg,color:'#f4f5ed',fontFamily:'Arial, sans-serif'}}>
    {v.footage?<OffthreadVideo src={staticFile(v.footage)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/>:
      <AbsoluteFill style={{justifyContent:'center',alignItems:'center',padding:90}}>
        <div style={{fontSize:24,color:'#9ba99d',letterSpacing:4}}>STORYBOARD · CAPTURE À FOURNIR</div>
        <div style={{fontSize:90,fontWeight:900,color:accent,marginTop:35,textTransform:'uppercase'}}>{v.game}</div>
        <div style={{width:650,height:650,border:`3px solid ${accent}`,marginTop:45,display:'flex',alignItems:'center',justifyContent:'center',transform:`rotate(${Math.sin(frame/25)*3}deg)`}}>
          <div style={{fontSize:130,fontWeight:900,color:accent}}>{v.game==='decoupe'?'37 %':v.game==='falsestart'?'GO ?':'À TOI'}</div>
        </div>
      </AbsoluteFill>}
    <div style={{position:'absolute',top:180,left:70,right:150,opacity:fade}}>
      <div style={{fontSize:30,fontWeight:900,color:accent}}>SLAP$TAX <span style={{fontWeight:400,color:'#fff',fontSize:22}}> / {v.day.toString().padStart(2,'0')}</span></div>
      <div style={{fontSize:66,lineHeight:1.08,fontWeight:900,marginTop:26,textShadow:'0 3px 12px #000',background:'#101514ed',padding:20}}>{v.hook}</div>
    </div>
    <div style={{position:'absolute',left:70,right:170,bottom:350,background:'#101514ed',borderLeft:`6px solid ${accent}`,padding:'24px 28px',fontSize:44,lineHeight:1.2,fontWeight:700,opacity:fade}}>{scene.text}</div>
    <div style={{position:'absolute',bottom:285,left:70,fontSize:24,color:accent}}>BONS AMIS. MAUVAIS PERDANTS.</div>
    {v.status!=='approved'&&<div style={{position:'absolute',top:130,right:160,fontSize:20,background:'#a53722',padding:'8px 14px'}}>BROUILLON</div>}
    <div style={{position:'absolute',bottom:260,left:70,width:760,height:4,background:'#43513f'}}><div style={{width:`${progress*100}%`,height:'100%',background:accent}}/></div>
    {v.music&&<Audio src={staticFile(v.music)} volume={f=>0.22*interpolate(f,[0,12,durationInFrames-20,durationInFrames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>}
    {v.voice&&<Sequence from={8}><Audio src={staticFile(v.voice)} volume={1}/></Sequence>}
  </AbsoluteFill>;
}
function Root(){return <>{videos.map(video=><Composition key={video.id} id={video.id} component={video.renderer==='snack-engine-demo'?SnackFilm:video.id==='01-decoupe-37'?DecoupeFilm:Film} defaultProps={{video}} durationInFrames={video.duration*30} fps={30} width={1080} height={1920}/>)}</>;}
registerRoot(Root);
