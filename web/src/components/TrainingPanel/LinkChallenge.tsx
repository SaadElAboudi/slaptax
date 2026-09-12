import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Share2 } from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { Drawing } from '../LiveGameArena/Drawing';
import { GamePoster } from '../LiveGameArena/GamePoster';
import { MomentReplay } from '../LiveGameArena/MomentReplay';
import { getCompetitiveGame } from '../../gameplay/catalog';
import type { DrawingState, PartyState, Point } from '../../gameplay/party';
import styles from './LinkChallenge.module.css';
import { useSfx } from '../../hooks/useSfx';

interface Challenge {id:string;gameId:'trace'|'decoupe';hostName:string;expiresAt:number;published:boolean}
interface Snapshot {challenge:Challenge;party?:PartyState;result?:{ownScore:number;hostScore:number;ownHistory:DrawingState['history'];hostHistory:DrawingState['history'];isHost:boolean}}

export function LinkChallenge({id}:{id:string}) {
    const {userId,language,playerName}=useGameStore(), isFr=language==='fr';
    const {activateAudio,playDraw}=useSfx();
    const [data,setData]=useState<Snapshot|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
    const [challengeId,setChallengeId]=useState(id==='new'?'':id);
    const sequence=useRef(0), mounted=useRef(true);
    const requested=new URLSearchParams(location.search).get('game')==='decoupe'?'decoupe':'trace';
    const gameId=data?.challenge.gameId||requested, game=getCompetitiveGame(gameId)!;
    useEffect(()=>{if(['drawpath','reveal'].includes(data?.party?.phase||''))playDraw();},[data?.party?.turn,data?.party?.phase,playDraw]);
    const request=useCallback(async(operation:string,body:object={})=>{
        const current=++sequence.current;
        const response=await fetch(`/api/link-challenges${challengeId?`/${challengeId}/${operation}`:''}`,{
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,clientId:localStorage.getItem('slaptax_client_id'),...body}),
        });
        const result=await response.json();
        if(!response.ok)throw new Error(response.status===410?(isFr?'Ce defi a expire.':'This challenge expired.'):response.status===429?(isFr?'Limite de defis atteinte.':'Challenge limit reached.'):response.status===409?(isFr?'Essai indisponible ou delai depasse.':'Attempt unavailable or deadline reached.'):(isFr?'Defi indisponible. Reessaie.':'Challenge unavailable. Try again.'));
        if(mounted.current&&current===sequence.current){setData(result);setError('');}
        return result as Snapshot;
    },[challengeId,userId,isFr]);
    useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
    useEffect(()=>{
        if(!challengeId||!userId)return;
        let stopped=false,timer=0;
        const poll=async()=>{
            try{const result=await request('state');if(result.party?.phase==='done')return;}
            catch(e){if(!stopped)setError((e as Error).message);}
            if(!stopped)timer=window.setTimeout(poll,300);
        };void poll();return()=>{stopped=true;clearTimeout(timer);++sequence.current;};
    },[challengeId,userId,request]);
    async function start() {
        if(busy||!userId)return;setBusy(true);
        void activateAudio();
        try {
            if(!challengeId){const created=await request('',{gameId});setChallengeId(created.challenge.id);
                const params=new URLSearchParams(location.search);params.set('link',created.challenge.id);history.replaceState({},'',`/?${params}`);
            }else await request('start');
        }catch(e){setError((e as Error).message);}finally{setBusy(false);}
    }
    async function send(action:string,payload?:{points:Point[];side?:number}) {
        try {await request('action',{action,turn:data?.party?.turn,...payload});}
        catch(e){setError((e as Error).message);}
    }
    const url=`${location.origin}/?tab=training&link=${challengeId}`;
    async function share(native:boolean) {
        try{if(native&&navigator.share)await navigator.share({title:`${gameId.toUpperCase()} · SLAP$TAX`,text:isFr?'Tu peux faire mieux ?':'Can you beat this?',url});
            else {await navigator.clipboard.writeText(url);setMessage(isFr?'Lien copie':'Link copied');}}
        catch(e){if((e as Error).name!=='AbortError')setMessage(isFr?'Copie le lien ci-dessous.':'Copy the link below.');}
    }
    const result=data?.result, party=data?.party;
    const hostId=result?Object.keys(result.hostHistory[0]?.results||{})[0]:'';
    const players=result?.isHost?[userId!]:[userId!,hostId];
    const combined=result?.ownHistory.map((entry,i)=>({...entry,results:{...result.hostHistory[i]?.results,...entry.results}}));
    return <section className={styles.panel} data-testid="link-challenge">
        <header><a href="/?tab=training" aria-label={isFr?'Retour':'Back'} title={isFr?'Retour':'Back'}><ArrowLeft size={20}/></a><div><span>{isFr?'DEFI PAR LIEN · SANS MISE':'LINK CHALLENGE · NO STAKES'}</span><h2>{gameId.toUpperCase()}</h2></div></header>
        {error&&<p role="alert" className={styles.error}>{error}</p>}
        {result&&party?<>
            <div className={styles.result}><span>{result.isHost?(isFr?'DEFI PRET':'CHALLENGE READY'):result.ownScore===result.hostScore?(isFr?'EGALITE':'TIED'):result.ownScore>result.hostScore?(isFr?'DEFI REMPORTE':'CHALLENGE WON'):(isFr?'BIEN TENTE':'GOOD ATTEMPT')}</span>
                <h3>{(result.ownScore/30).toFixed(1)}<small>%</small></h3>
                {!result.isHost&&<p>{data.challenge.hostName} : {(result.hostScore/30).toFixed(1)}%</p>}
            </div>
            <div className={styles.actions}><button type="button" onClick={()=>void share(true)}><Share2 size={18}/>{isFr?'Partager le defi':'Share challenge'}</button><button type="button" onClick={()=>void share(false)} aria-label={isFr?'Copier le lien':'Copy link'} title={isFr?'Copier le lien':'Copy link'}><Copy size={18}/></button></div>
            <input className={styles.link} readOnly value={url} aria-label={isFr?'Lien du defi':'Challenge link'} onFocus={e=>e.target.select()}/>
            <p role="status">{message}</p>
            <MomentReplay moment={{gameId,players,scores:{[userId!]:result.ownScore,...(!result.isHost?{[hostId]:result.hostScore}:{})},runs:{},summary:'drawing-three-attempts',
                replay:[{at:0,state:{...party,drawing:{history:combined||[]}}}]}} userId={userId!} playerName={playerName} rivalName={data.challenge.hostName} isFr={isFr}/>
            <a className={styles.new} href={`/?tab=training&link=new&game=${gameId}`}>{isFr?'Nouveau defi, nouvelles formes':'New challenge, new shapes'}<ArrowRight size={18}/></a>
        </>:party?<><div className={styles.round}><span>{isFr?'ESSAI':'ATTEMPT'} {party.attempt}/3</span><b>{isFr?'SCORE RIVAL MASQUE':'RIVAL SCORE HIDDEN'}</b></div><Drawing key={party.turn} party={party} identity={userId||''} active={!error&&!busy} isFr={isFr} send={(a,p)=>void send(a,p)}/></>:<div className={styles.brief}>
            <GamePoster gameId={gameId}/><h3>{data?.challenge.published?`${data.challenge.hostName} ${isFr?'te defie':'challenges you'}`:(isFr?'A toi de fixer la barre.':'Set the bar.')}</h3>
            <p>{isFr?game.ruleFr:game.ruleEn}</p><span>{isFr?'3 ESSAIS · UNE PARTICIPATION · LIEN VALABLE 7 JOURS':'3 ATTEMPTS · ONE ENTRY · LINK VALID FOR 7 DAYS'}</span>
            <button type="button" disabled={busy||!userId} onClick={()=>void start()}>{busy?(isFr?'Connexion...':'Connecting...'):challengeId?(isFr?'Entrer dans l arene':'Enter the arena'):(isFr?'Creer mon defi':'Create challenge')}<ArrowRight size={20}/></button>
        </div>}
    </section>;
}
