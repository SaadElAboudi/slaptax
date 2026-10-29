import {apiUrl} from '../../platform/environment';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export function OnlinePlayers({isFr,revision}:{isFr:boolean;revision:number}) {
    const [count,setCount]=useState<number|null>(null);
    useEffect(()=>{
        let stopped=false,timer=0;
        let controller:AbortController|null=null;
        async function refresh() {
            controller=new AbortController();const current=controller;const timeout=window.setTimeout(()=>current.abort(),5000);
            try {
                const response=await fetch(apiUrl('/api/presence'),{cache:'no-store',signal:current.signal});
                if(!response.ok)throw new Error('Presence unavailable');
                const data=await response.json();
                if(!Number.isInteger(data.onlinePlayers)||data.onlinePlayers<0)throw new Error('Invalid presence');
                if(!stopped)setCount(data.onlinePlayers);
            } catch { if(!stopped)setCount(null); }
            clearTimeout(timeout);
            if(!stopped)timer=window.setTimeout(refresh,10000);
        }
        void refresh();
        return ()=>{stopped=true;controller?.abort();clearTimeout(timer);};
    },[revision]);
    return <span data-testid="online-players" title={isFr?'Sessions connectees sur ce serveur, onglets dedupliques.':'Connected sessions on this server, duplicate tabs excluded.'}>
        <Users size={14} aria-hidden="true"/> {count===null?(isFr?'Presence indisponible':'Presence unavailable'):`${count} ${isFr?(count===1?'joueur en ligne':'joueurs en ligne'):(count===1?'player online':'players online')}`}
    </span>;
}
