import {useEffect,useState} from 'react';
import {ArrowRight,RefreshCw} from 'lucide-react';
import styles from './HistoryPanel.module.css';
import {useGameStore} from '../../hooks/useGameStore';
import {api,type HistoryResponse} from '../../api/client';
import {gameLabel} from '../../gameplay/catalog';
import {readPracticeHistory,type PracticeEntry} from '../../gameplay/practiceHistory';
import {linkScore} from '../MyChallenges/MyChallenges';

export function HistoryPanel() {
    const {userId,clientId,language}=useGameStore(),isFr=language==='fr';
    const [data,setData]=useState<HistoryResponse>({history:[]}),[solo,setSolo]=useState<PracticeEntry[]>([]);
    const [loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0),[filter,setFilter]=useState('all');
    useEffect(()=>{
        if(!userId||!clientId)return;
        let stopped=false,timer=0;
        setData({history:[]});setLoading(true);setError('');
        setSolo(readPracticeHistory(userId));
        async function refresh(){
            try{const result=await api.getHistory(userId,clientId);if(!stopped){setData(result);setError('');}}
            catch{if(!stopped)setError(isFr?'Historique indisponible. Reessaie.':'History unavailable. Try again.');}
            finally{if(!stopped){setLoading(false);timer=window.setTimeout(refresh,10000);}}
        }
        void refresh();return()=>{stopped=true;clearTimeout(timer);};
    },[userId,clientId,isFr,revision]);
    const rows=[
        ...data.history.map((item,index)=>({id:`match:${item.id||index}`,kind:'matches',at:Date.parse(item.timestamp||item.date||'')||0,
            title:item.opponentName||item.mode||item.type||(isFr?'Match':'Match'),
            outcome:typeof item.won==='boolean'?(item.won?'win':'loss'):item.result?.toLowerCase()||'finished',
            detail:`${Number(item.net||0)>=0?'+':''}SLAP$ ${Number(item.net||0).toFixed(2)}`,href:''})),
        ...(data.linkHistory||[]).map(item=>({id:item.id,kind:'links',at:item.completedAt,
            title:`${gameLabel(item.gameId,isFr)}${item.opponentName?` · ${item.opponentName}`:''}`,outcome:item.outcome,
            detail:`${linkScore(item.gameId,item.score)}${item.opponentScore!==null?` / ${linkScore(item.gameId,item.opponentScore)}`:''}`,
            href:item.expiresAt>Date.now()?'/?tab=challenges':''})),
        ...solo.map(item=>({id:item.id,kind:'solo',at:item.completedAt,title:gameLabel(item.gameId,isFr),outcome:'practice',detail:`${item.score} pts`,href:''})),
    ].filter(row=>filter==='all'||row.kind===filter).sort((a,b)=>b.at-a.at);
    const labels:Record<string,string>={win:isFr?'VICTOIRE':'WIN',loss:isFr?'DEFAITE':'LOSS',draw:isFr?'EGALITE':'DRAW',created:isFr?'DEFI CREE':'CHALLENGE CREATED',practice:isFr?'SOLO · CET APPAREIL':'SOLO · THIS DEVICE',credit:isFr?'CREDIT':'CREDIT',finished:isFr?'TERMINE':'FINISHED'};
    return <section className={styles.panel} data-testid="history-panel">
        <div className={styles.head}><h2 className={styles.title}>{isFr?'Historique':'History'}</h2><button type="button" className={styles.refresh} onClick={()=>setRevision(v=>v+1)} aria-label={isFr?'Actualiser l historique':'Refresh history'} title={isFr?'Actualiser l historique':'Refresh history'}><RefreshCw size={18}/></button></div>
        <div className={styles.filters} role="tablist" aria-label={isFr?'Filtrer l historique':'Filter history'}>{[['all','Tout','All'],['matches','Matchs','Matches'],['links','Defis par lien','Link challenges'],['solo','Solo','Solo']].map(([id,fr,en])=><button type="button" role="tab" aria-selected={filter===id} key={id} onClick={()=>setFilter(id)}>{isFr?fr:en}</button>)}</div>
        {error&&<p role="alert">{error}</p>}
        {loading?<p role="status">{isFr?'Chargement...':'Loading...'}</p>:rows.length===0&&!error?<p className={styles.empty}>{isFr?'Aucun resultat pour le moment.':'No results yet.'}</p>:null}
        <div className={styles.list}>{rows.map(row=><article key={row.id} className={styles.row} data-testid="history-row">
            <div className={`${styles.dot} ${row.outcome==='win'?styles.win:row.outcome==='loss'?styles.loss:styles.neutral}`}/>
            <div className={styles.meta}><strong>{row.title}</strong><span>{row.at?new Date(row.at).toLocaleString():(isFr?'Date inconnue':'Unknown date')}</span>{row.href&&<a href={row.href}>{isFr?'Voir le defi':'View challenge'}<ArrowRight size={14}/></a>}</div>
            <div className={styles.stats}><span>{labels[row.outcome]||labels.finished}</span><span>{row.detail}</span></div>
        </article>)}</div>
    </section>;
}
