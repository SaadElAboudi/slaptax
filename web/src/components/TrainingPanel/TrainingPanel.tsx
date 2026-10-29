import {hasScoreChallenge,preferredGame,prepareGameMode} from '../../gameplay/gameExperience';
import type {SoloReward} from '../../api/client';
import {SoloVictory} from './SoloVictory';
import { useMemo, useRef, useState } from 'react';
import {recordPractice} from '../../gameplay/practiceHistory';
import { COMPETITIVE_GAMES, gameLabel, isPartyGame, type CompetitiveGameId } from '../../gameplay/catalog';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './TrainingPanel.module.css';
import { Share2 } from 'lucide-react';
import { GamePoster } from '../LiveGameArena/GamePoster';

interface TrainingResult {
    score: number;
    metric: number;
    soloReward?:SoloReward;
}

const LEVELS = [1, 2, 3] as const;
const LEVEL_LABELS = {
    fr: ['Tranquille', 'Standard', 'Intense'],
    en: ['Relaxed', 'Standard', 'Intense'],
};

export function TrainingPanel() {
    const language = useGameStore((state) => state.language);
    const setActiveTab = useGameStore((state) => state.setActiveTab);
    const isFr = language === 'fr';
    const [gameId, setGameId] = useState<CompetitiveGameId>(()=>preferredGame('training'));
    const [level, setLevel] = useState<(typeof LEVELS)[number]>(1);
    const [attempt, setAttempt] = useState(1);
    const [result, setResult] = useState<TrainingResult | null>(null);
    const [playing, setPlaying] = useState(false);
    const recorded=useRef('');
    const effectiveLevel = isPartyGame(gameId) ? 1 : level;
    const bestKey = `slaptax_training_${gameId === 'onesecond' ? 'v3' : 'v2'}_best_${gameId}_${effectiveLevel}`;

    const best = useMemo(() => {
        try {
            return Number(localStorage.getItem(bestKey) || 0);
        } catch {
            return 0;
        }
    }, [bestKey, attempt]);

    function selectGame(next: CompetitiveGameId) {
        prepareGameMode(next,'training');
        setGameId(next);
        setResult(null);
        setAttempt((value) => value + 1);
        try {
            localStorage.setItem('slaptax_training_game', next);
        } catch {
            // Training still works without persistence.
        }
    }

    function complete(next: TrainingResult) {
        const key=`${gameId}:${level}:${attempt}`;
        if(recorded.current!==key){recordPractice(useGameStore.getState().userId||'',gameId,next.score);recorded.current=key;}
        setResult(next);
        void useGameStore.getState().refreshLiveState();
        if (next.score > best) {
            try {
                localStorage.setItem(bestKey, String(next.score));
            } catch {
                // Best score persistence is optional.
            }
        }
    }

    function replay() {
        setPlaying(false);
        setResult(null);
        setAttempt((value) => value + 1);
    }

    if (result) {
        const isRecord = result.score > best;
        return (
            <section className={styles.result}>
                <SoloVictory result={result} best={best} isFr={isFr}/>
                <span>{isRecord ? (isFr ? 'NOUVEAU RECORD' : 'NEW RECORD') : (isFr ? 'SESSION TERMINEE' : 'SESSION COMPLETE')}</span>
                <h2>{result.score}<small> / 1000</small></h2>
                <p>{gameLabel(gameId, isFr)} · {(result.metric / 1000).toFixed(1)}s</p>
                <div className={styles.resultActions}>

                    <button type="button" onClick={replay}>{isFr ? 'Rejouer' : 'Replay'}</button>
                    {hasScoreChallenge(gameId)&&<button type="button" onClick={()=>{location.href=`/?tab=training&link=new&game=${gameId}`;}}><Share2 size={18}/>{isFr?'Creer un defi par lien':'Create a link challenge'}</button>}
                    <button type="button" onClick={() => {
                        try { localStorage.setItem('slaptax_duel_game', gameId); } catch { /* Optional preference. */ }
                        setActiveTab('defy');
                    }}>{isFr ? 'Defier un ami' : 'Challenge a friend'}</button>
                    <button type="button" className={styles.secondary} onClick={() => { setPlaying(false); setResult(null); }}>
                        {isFr ? 'Changer d exercice' : 'Change drill'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            {!playing && <>
            <header className={styles.head}>
                <p>{isFr?'Découvre le jeu et bats ton propre score.':'Learn the game and beat your own score.'}</p>
                <div className={styles.best}><span>{isFr?'RECORD SOLO':'SOLO BEST'}</span><strong>{best || '--'}</strong></div>
            </header>

            <details className={styles.config}><summary>{isFr?'Changer de jeu':'Change game'}<span>{gameLabel(gameId,isFr)}</span></summary>
                <div className={styles.games}>
                    {COMPETITIVE_GAMES.map((game) => (
                        <button type="button" key={game.id} aria-pressed={game.id === gameId} className={game.id === gameId ? styles.selected : ''} onClick={() => selectGame(game.id)}>
                            <div className={styles.gamePreview} aria-hidden="true"><GamePoster gameId={game.id}/></div>
                            <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                            <span>{isFr ? game.skillFr : game.skillEn}</span>
                        </button>
                    ))}
                </div>
                {!isPartyGame(gameId) && <div className={styles.levels}>
                    <span>{isFr ? 'INTENSITE' : 'INTENSITY'}</span>
                    {LEVELS.map((value) => (
                        <button
                            type="button"
                            key={value}
                            className={level === value ? styles.levelActive : ''}
                            onClick={() => {
                                setLevel(value);
                                setAttempt((current) => current + 1);
                            }}
                        >
                            {LEVEL_LABELS[isFr ? 'fr' : 'en'][value - 1]}
                        </button>
                    ))}
                </div>}
            </details>

            </>}
            <LiveGameArena
                key={`${gameId}-${level}-${attempt}`}
                mode="training"
                gameId={gameId}
                series={[gameId]}
                round={effectiveLevel}
                opponentName=""
                isFr={isFr}
                onComplete={complete}
                onStart={() => setPlaying(true)}
            />
            {!playing&&hasScoreChallenge(gameId)&&<button type="button" className={styles.linkChallengeButton} onClick={()=>{location.href=`/?tab=training&link=new&game=${gameId}`;}}><Share2 size={18}/>{isFr?'Creer un defi par lien':'Create a link challenge'}</button>}
        </section>
    );
}
