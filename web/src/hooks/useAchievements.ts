import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import {applyAchievement,emptyAchievements,type AchievementProgress,type AchievementEvent,type AchievementId} from '../gameplay/achievements';
export {ACHIEVEMENTS} from '../gameplay/achievements';
type State={profiles:Record<string,AchievementProgress>;notice:{userId:string;ids:AchievementId[]}|null;record:(userId:string|null,event:AchievementEvent)=>void;dismiss:()=>void};
export const useAchievements=create<State>()(persist((set,get)=>({profiles:{},notice:null,record:(userId,event)=>{
 if(!userId)return;const previous=get().profiles[userId]||emptyAchievements(),next=applyAchievement(previous,event,Date.now());if(next.progress===previous)return;
 set(state=>({profiles:{...state.profiles,[userId]:next.progress},notice:next.added.length?{userId,ids:next.added}:state.notice}));
},dismiss:()=>set({notice:null})}),{name:'slaptax.achievements.v1',partialize:state=>({profiles:state.profiles}),storage:createJSONStorage(()=>({getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>{try{localStorage.setItem(key,value);}catch{/* Session progress remains available. */}},removeItem:key=>{try{localStorage.removeItem(key);}catch{/* Optional persistence. */}}}))}));
