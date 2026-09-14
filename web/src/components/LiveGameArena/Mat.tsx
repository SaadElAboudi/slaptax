import { useRef, useState } from 'react';
import { Check, LockKeyhole, Timer } from 'lucide-react';
import type { ChessPieceState, MatState, PartyState } from '../../gameplay/party';
import { CHESS_PATHS } from '../../gameplay/chessPieces';
import styles from './Mat.module.css';

export function ChessPiece({ type, color }: Pick<ChessPieceState,'type'|'color'>) {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d={CHESS_PATHS[type]} fill={color==='w'?'#fffdf3':'#25292d'} stroke={color==='w'?'#393e42':'#e1e6e3'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}
const names = {fr:{p:'pion',n:'cavalier',b:'fou',r:'tour',q:'dame',k:'roi'},en:{p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'}};
export function MatBoard({ state, isFr, disabled=true, onMove }: {state:MatState;isFr:boolean;disabled?:boolean;onMove?:(move:string)=>void}) {
    const [from,setFrom]=useState('');
    const [promotion,setPromotion]=useState<string[]>([]);
    const [focused,setFocused]=useState(0);
    const [pending,setPending]=useState('');
    const refs=useRef<Array<HTMLButtonElement|null>>([]);
    const files=state.turn==='w'?'abcdefgh':'hgfedcba';
    const ranks=state.turn==='w'?'87654321':'12345678';
    const squares=[...ranks].flatMap(rank=>[...files].map(file=>file+rank));
    const locked=disabled||Boolean(state.selected)||Boolean(pending);
    const selection=state.solution||state.selected||pending;
    function commit(move:string){setPending(move);setPromotion([]);onMove?.(move);}
    function choose(square:string){
        if(locked)return;
        const moves=state.legal.filter(m=>m.slice(0,2)===from&&m.slice(2,4)===square);
        if(moves.length>1){setPromotion(moves);return;}
        if(moves.length===1){commit(moves[0]);return;}
        setPromotion([]);
        setFrom(state.board.some(p=>p.square===square&&p.color===state.turn)?square:'');
    }
    return <div className={styles.boardWrap}>
        <div className={styles.board} role="group" aria-label={isFr?'Echiquier':'Chessboard'} data-testid="mat-board">
            {squares.map((square,i)=>{
                const piece=state.board.find(p=>p.square===square);
                const target=!locked&&state.legal.some(m=>m.slice(0,2)===from&&m.slice(2,4)===square);
                return <button key={square} ref={el=>{refs.current[i]=el;}} type="button" data-square={square}
                    className={styles.square} data-dark={(i+Math.floor(i/8))%2===1} data-selected={square===from||selection?.slice(0,2)===square||selection?.slice(2,4)===square}
                    aria-label={`${square}${piece?` ${names[isFr?'fr':'en'][piece.type]} ${piece.color==='w'?(isFr?'blanc':'white'):(isFr?'noir':'black')}`:''}`}
                    aria-disabled={locked} tabIndex={focused===i?0:-1} onFocus={()=>setFocused(i)} onClick={()=>choose(square)}
                    onKeyDown={e=>{
                        const step=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8} as Record<string,number>)[e.key];
                        if(step!==undefined){e.preventDefault();const next=Math.max(0,Math.min(63,i+step));refs.current[next]?.focus();}
                        if(e.key==='Escape'){setFrom('');setPromotion([]);}
                    }}>
                    {piece&&<ChessPiece {...piece}/>}
                    {target&&<i className={styles.hint}/>}
                    {i%8===0&&<small className={styles.rank}>{square[1]}</small>}
                    {i>=56&&<small className={styles.file}>{square[0]}</small>}
                </button>;
            })}
        </div>
        {promotion.length>0&&!locked&&<div className={styles.promotion} role="group" aria-label="Promotion">
            {promotion.map(move=><button key={move} type="button" title={names[isFr?'fr':'en'][move[4] as 'q']} aria-label={`${isFr?'Promouvoir en':'Promote to'} ${names[isFr?'fr':'en'][move[4] as 'q']}`} onClick={()=>commit(move)}><ChessPiece type={move[4] as 'q'} color={state.turn}/></button>)}
        </div>}
    </div>;
}
export function Mat({party,identity,active,isFr,send}:{party:PartyState;identity:string;active:boolean;isFr:boolean;send:(action:string,data:{move:string})=>void}) {
    const state=party.mat;
    if(!state)return <div className={styles.placeholder}><Timer size={32}/></div>;
    const result=state.results?.[identity];
    const locked=party.answered.includes(identity);
    return <section className={styles.mat}>
        <div className={styles.top}><span><i data-white={state.turn==='w'}/>{state.turn==='w'?(isFr?'TRAIT AUX BLANCS':'WHITE TO MOVE'):(isFr?'TRAIT AUX NOIRS':'BLACK TO MOVE')}</span><strong><Timer size={15}/>{Math.max(0,Math.ceil(party.remaining/1000))} s</strong></div>
        <div className={styles.progress}><i style={{transform:`scaleX(${party.phase==='solve'?Math.max(0,party.remaining/20000):0})`}}/></div>
        <MatBoard state={state} isFr={isFr} disabled={!active||party.phase!=='solve'} onMove={move=>send('move',{move})}/>
        <div className={styles.status} role="status">{result?<><Check size={17}/><strong>{result.mate?'MAT':result.expired?(isFr?'TEMPS ECOULE':'TIME UP'):(isFr?'PAS DE MAT':'NOT CHECKMATE')}</strong>{result.ms!==null&&<span>{(result.ms/1000).toFixed(2)} s</span>}</>:locked?<><LockKeyhole size={17}/>{isFr?'COUP VERROUILLE':'MOVE LOCKED'}</>:<strong>{isFr?'MAT EN UN COUP':'MATE IN ONE'}</strong>}</div>
        {state.solution&&<div className={styles.solution}>{isFr?'SOLUTION':'SOLUTION'} <b>{state.solution.slice(0,2)} → {state.solution.slice(2,4)}{state.solution[4]?` = ${state.solution[4].toUpperCase()}`:''}</b></div>}
    </section>;
}
