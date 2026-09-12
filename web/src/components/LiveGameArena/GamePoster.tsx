import { Timer, Bomb, Zap } from 'lucide-react';
import styles from './GamePoster.module.css';

export function GamePoster({ gameId }: { gameId: string }) {
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
