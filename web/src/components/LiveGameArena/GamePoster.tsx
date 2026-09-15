import { Timer, Bomb, Zap, Shield, Swords } from 'lucide-react';
import styles from './GamePoster.module.css';
import { ChessPiece } from './Mat';

export function GamePoster({ gameId }: { gameId: string }) {
    if(gameId==='chroma')return <div className={styles.poster} data-game={gameId} aria-hidden="true"><svg width="280" height="180" viewBox="0 0 280 180"><g transform="translate(57 36) rotate(-16 45 60)"><rect x="0" y="7" width="90" height="114" rx="7" fill="#477982"/><rect width="90" height="114" rx="7" fill="#a6e6f0"/><path d="M12 12h30" stroke="#e8fbff" strokeWidth="4" strokeLinecap="round"/></g><g transform="translate(139 28) rotate(14 45 60)"><rect y="8" width="90" height="114" rx="7" fill="#a75047"/><rect width="90" height="114" rx="7" fill="#ff9788"/><path d="M12 12h30" stroke="#ffcfbd" strokeWidth="4" strokeLinecap="round"/></g><g transform="translate(102 54)"><rect y="8" width="82" height="107" rx="7" fill="#909e36"/><rect width="82" height="107" rx="7" fill="#def56a"/><path d="M12 12h24" stroke="#f6ffc5" strokeWidth="4" strokeLinecap="round"/><path d="m27 65 11 11 22-25" fill="none" stroke="#272d1b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></g></svg></div>;
    if(gameId==='mat')return <div className={styles.poster} data-game={gameId} aria-hidden="true"><div className={styles.mat}>{Array.from({length:16},(_,i)=><span key={i}>{i===3?<ChessPiece type="k" color="b"/>:i===9?<ChessPiece type="q" color="w"/>:i===14?<ChessPiece type="k" color="w"/>:null}</span>)}</div></div>;
    if(gameId==='garde')return <div className={styles.poster} data-game={gameId} aria-hidden="true"><div className={styles.garde}><Shield size={82} strokeWidth={1.5}/><Swords size={40}/><Shield size={82} strokeWidth={1.5}/><b>6 PV · 8 TOURS</b></div></div>;
    return <div className={styles.poster} data-game={gameId} aria-hidden="true">
        {gameId === 'trace' ? <svg viewBox="0 0 240 180" width="240" height="180"><path d="M45 130 L45 70 L120 25 L195 70 L195 130" fill="none" stroke="#f5cc73" strokeWidth="4" strokeDasharray="6 5"/><path d="M50 132 L52 73 Q118 18 190 76 L192 133" fill="none" stroke="#bdf182" strokeWidth="6" strokeLinecap="round"/></svg> : gameId === 'decoupe' ? <svg viewBox="0 0 240 180" width="240" height="180"><path d="M50 40 L180 30 L207 135 L60 154Z" fill="#c6d1db"/><path d="M50 40 L115 35 L129 145 L60 154Z" fill="#bdf182"/><path d="M110 10 L135 173" stroke="#fff" strokeWidth="3"/><text x="64" y="106" fontSize="23" fontWeight="bold" fill="#17231a">37%</text></svg> : gameId === 'contrepied' ? <div className={styles.contrepied}><span>2</span><b>5</b><i>3</i></div> : gameId === 'ricochet' ? <div className={styles.ricochet}><i/><b/><span/></div> : gameId === 'chroma' ? <div className={styles.chroma}><i/><i/><i/><b>CHROMA</b></div> : gameId === 'falsestart' ? <div className={styles.signal}><span>WAIT</span><b>GO</b><i><Zap size={26} /></i></div>
            : gameId === 'onesecond' ? <div className={styles.clock}><Timer size={32} /><b>2–10<small>s</small></b></div>
                : gameId === 'onemore' ? <div className={styles.tower}>{[0,1,2,3,4].map((n) => <i key={n} />)}</div>
                    : gameId === 'bounce' ? <div className={styles.bounce}><i /><b /><span /></div>
                        : gameId === 'symbolrush' ? <div className={styles.symbols}>{['◆','●','▲','■'].map((s) => <span key={s}>{s}</span>)}</div>
                            : gameId === 'bombpass' ? <div className={styles.bomb}><Bomb size={90} strokeWidth={1.4} /><span>00:03</span></div>
                                : gameId === 'cupshuffle' ? <div className={styles.cups}><i /><i /><i /><b /></div>
                                    : <div className={styles.numeric}><span>8 × 7</span><b>56</b></div>}
    </div>;
}
