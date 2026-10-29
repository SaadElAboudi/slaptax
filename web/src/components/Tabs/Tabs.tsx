import styles from './Tabs.module.css';
import {useGameStore,type Tab} from '../../hooks/useGameStore';
import {Gamepad2,Swords,Link,Trophy} from 'lucide-react';
export function Tabs({home,onHome,onEnter}:{home:boolean;onHome:()=>void;onEnter:(tab:Tab)=>void}){
 const {activeTab,language}=useGameStore();const fr=language==='fr';
 const items=[{id:'home',fr:'Jeux',en:'Games',icon:Gamepad2},{id:'defy',fr:'Défis amis',en:'Friend duels',icon:Swords},{id:'challenges',fr:'Challenges',en:'Challenges',icon:Link},{id:'tournament',fr:'Tournois',en:'Tournaments',icon:Trophy}];
 return <nav className={styles.tabs} aria-label={fr?'Navigation principale':'Main navigation'}>{items.map(t=>{
 const selected=t.id==='home'?(home||activeTab==='training'):!home&&activeTab===t.id;
 return <button type="button" key={t.id} data-tab={t.id} className={`${styles.tab} ${selected?styles.active:''}`} aria-current={selected?'page':undefined} onClick={()=>t.id==='home'?onHome():onEnter(t.id as Tab)}><t.icon size={23} strokeWidth={2.7}/><b>{fr?t.fr:t.en}</b></button>;
 })}</nav>;
}
