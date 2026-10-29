import {stopAdaptiveMusic} from '../hooks/useAdaptiveAudio';
import {App as NativeApp} from '@capacitor/app';
import {Network} from '@capacitor/network';
import {isNative,publicUrl} from './environment';

export function invitationRoute(value:string):string|null{
 try{
  const url=new URL(value),publicOrigin=new URL(publicUrl()).origin;
  if(!((url.protocol==='https:'&&url.origin===publicOrigin)||(url.protocol==='slaptax:'&&url.hostname==='play')))return null;
  if(url.pathname!=='/'&&url.pathname!=='')return null;
  const allowed=['tab','game','invite','link','room','token','mode'],params=new URLSearchParams();
  for(const key of allowed){const entry=url.searchParams.get(key);if(entry&&entry.length<=200)params.set(key,entry);}
  return params.toString()?`/?${params}`:'/';
 }catch{return null;}
}
export async function prepareNative(){
 if(!isNative())return;
 document.documentElement.dataset.native='true';
 function openInvitation(value:string,launch=false){const route=invitationRoute(value);if(!route)return;
  if(!launch&&document.querySelector('[data-focus="true"]')&&!window.confirm('Ouvrir cette invitation et quitter la partie ?'))return;
  history.pushState({},'',route);window.dispatchEvent(new PopStateEvent('popstate'));
 }
 await NativeApp.addListener('appUrlOpen',event=>openInvitation(event.url));
 // A WebView reload on a privacy/deletion receipt must never replay the original launch invitation.
 const launch=await NativeApp.getLaunchUrl();if(launch?.url&&['/','/index.html',''].includes(location.pathname)&&!location.search)openInvitation(launch.url,true);
 await NativeApp.addListener('appStateChange',({isActive})=>{
  document.documentElement.dataset.appActive=String(isActive);
  if(!isActive){stopAdaptiveMusic();const ctx=(window as Window&{__slaptaxAudioCtx?:AudioContext}).__slaptaxAudioCtx;void ctx?.suspend().catch(()=>undefined);}
  window.dispatchEvent(new Event(isActive?'focus':'blur'));
  window.dispatchEvent(new CustomEvent('slaptax:app-state',{detail:{isActive}}));
 });
 await Network.addListener('networkStatusChange',({connected})=>{
  window.dispatchEvent(new Event(connected?'online':'offline'));
  if(connected)window.dispatchEvent(new Event('focus'));
 });
 await NativeApp.addListener('backButton',({canGoBack})=>{
  const dialog=document.querySelector('dialog[open]');if(dialog){dialog.dispatchEvent(new Event('cancel',{cancelable:true}));return;}
  if(document.querySelector('[role="dialog"]')){window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return;}
  if(document.querySelector('[data-focus="true"]')&&!window.confirm('Quitter cette partie et revenir en arrière ?'))return;
  if(canGoBack){history.back();return;}
  if(location.search){history.replaceState({},'','/');window.dispatchEvent(new PopStateEvent('popstate'));return;}
  void NativeApp.minimizeApp();
 });
}
