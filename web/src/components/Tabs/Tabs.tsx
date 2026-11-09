import styles from './Tabs.module.css';
import {useGameStore,type Tab} from '../../hooks/useGameStore';
import {Gamepad2,Swords,Link,Trophy} from 'lucide-react';
export function Tabs({home,onHome,onEnter}:{home:boolean;onHome:()=>void;onEnter:(tab:Tab)=>void}){
 const {activeTab,language}=useGameStore();const fr=language==='fr';
 const items=[{id:'home',fr:'Jeux',en:'Games',icon:Gamepad2},{id:'challenges',fr:'Scores à battre',en:'Beat a score',icon:Link},{id:'defy',fr:'En direct',en:'Play live',icon:Swords},{id:'survival',fr:'À quatre',en:'Four friends',icon:Trophy}];
 return <nav className={styles.tabs} aria-label={fr?'Navigation principale':'Main navigation'}>{items.map(t=>{
 const selected=t.id==='home'?(home||activeTab==='training'):!home&&activeTab===t.id;
 return <button type="button" key={t.id} data-tab={t.id} className={`${styles.tab} ${selected?styles.active:''}`} aria-current={selected?'page':undefined} onClick={()=>t.id==='home'?onHome():onEnter(t.id as Tab)}><t.icon size={23} strokeWidth={2.7}/><b>{fr?t.fr:t.en}</b></button>;
 })}</nav>;
}
