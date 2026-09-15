import { useCallback, useSyncExternalStore } from 'react';

const EVENT='slaptax:feedback-change';
export const SFX_KEY='slaptax.sfx.enabled';
const HAPTIC_KEY='slaptax.haptics.enabled';
const transient=new Map<string,boolean>();
export function preference(key:string,fallback:boolean){if(transient.has(key))return transient.get(key)!;try{const v=localStorage.getItem(key);return v===null?fallback:v==='1';}catch{return fallback;}}
function subscribe(fn:()=>void){const sync=(e:StorageEvent)=>{if(e.key)transient.delete(e.key);else transient.clear();fn();};window.addEventListener(EVENT,fn);window.addEventListener('storage',sync);return ()=>{window.removeEventListener(EVENT,fn);window.removeEventListener('storage',sync);};}
function write(key:string,value:boolean){transient.set(key,value);try{localStorage.setItem(key,value?'1':'0');}catch{/* Settings remain usable without persistent storage. */}window.dispatchEvent(new Event(EVENT));}
export function useFeedbackPreferences(){
    const soundOn=useSyncExternalStore(subscribe,()=>preference(SFX_KEY,true),()=>true);
    const hapticsOn=useSyncExternalStore(subscribe,()=>preference(HAPTIC_KEY,false),()=>false);
    const toggleSound=useCallback(()=>write(SFX_KEY,!preference(SFX_KEY,true)),[]);
    const toggleHaptics=useCallback(()=>write(HAPTIC_KEY,!preference(HAPTIC_KEY,false)),[]);
    return {soundOn,hapticsOn,toggleSound,toggleHaptics};
}
export function hapticPulse(pattern:number|number[]=12){
    if(!preference(HAPTIC_KEY,false)||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    navigator.vibrate?.(pattern);
}
