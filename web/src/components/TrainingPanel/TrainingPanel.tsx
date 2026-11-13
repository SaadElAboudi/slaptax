import {factoryAftermath} from '../../gameplay/factoryComedy';
import {gameChapter} from '../../gameplay/world';
import {hasScoreChallenge,preferredGame,prepareGameMode} from '../../gameplay/gameExperience';
import type {SoloReward} from '../../api/client';
import {SoloVictory} from './SoloVictory';
import { useMemo, useRef, useState } from 'react';
import {readPracticeHistory,recordPractice} from '../../gameplay/practiceHistory';
import { COMPETITIVE_GAMES, PRACTICE_GAMES, gameLabel, isPartyGame, type CompetitiveGameId } from '../../gameplay/catalog';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './TrainingPanel.module.css';
import { Share2 } from 'lucide-react';
import { GamePoster } from '../LiveGameArena/GamePoster';
import {TrainingTutorial} from './TrainingTutorial';
import {useBooleanPreference} from '../../hooks/useFeedbackPreferences';
import {useAchievements} from '../../hooks/useAchievements';

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
    const recorded=useRef(''),sessionId=useRef(crypto.randomUUID());
    const userId=useGameStore(s=>s.userId),recordAchievement=useAchievements(s=>s.record);
    const [guideSeen,setGuideSeen]=useBooleanPreference(`slaptax.tutorial.training.${userId||'guest'}.${gameId}`,false);
    const [replayGuide,setReplayGuide]=useState(false);
    const guideOpen=replayGuide||(!!userId&&!guideSeen);
    function closeGuide(){setGuideSeen(true);setReplayGuide(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('[data-testid=training-guide-replay]')?.focus());}
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
        setGameId(next);setReplayGuide(false);
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
        if(recorded.current!==key){recordPractice(useGameStore.getState().userId||'',gameId,next.score);recordAchievement(userId,{id:`training:${sessionId.current}:${key}`,type:'training',score:next.score});recorded.current=key;}
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
        const target = Math.min(1000, Math.max(best + 1, result.score < 400 ? 400 : result.score < 700 ? 700 : result.score < 900 ? 900 : result.score + 1));
        const recent = readPracticeHistory(useGameStore.getState().userId || '').slice(0, 3).map(entry => entry.gameId);
        const nextGame = COMPETITIVE_GAMES.find(game => !recent.includes(game.id) && game.id !== gameId) || COMPETITIVE_GAMES.find(game => game.id !== gameId)!;
        return (
            <section className={styles.result}>
                <span>{gameChapter(gameId,isFr)?.place}</span><SoloVictory result={result} best={best} isFr={isFr}/>
                <span>{isRecord ? (isFr ? 'NOUVEAU RECORD' : 'NEW RECORD') : (isFr ? 'SESSION TERMINEE' : 'SESSION COMPLETE')}</span>
                <h2>{result.score}<small> / 1000</small></h2>
                <p data-testid="factory-aftermath">{factoryAftermath(gameId,isFr)}</p>
                <p>{gameLabel(gameId, isFr)} · {(result.metric / 1000).toFixed(1)}s</p>
                <div className={styles.rematchGoal} data-testid="practice-next-goal"><strong>{result.score >= 1000 ? (isFr ? 'Score parfait. Qui peut faire aussi bien ?' : 'Perfect score. Who can match it?') : (isFr ? `Prochain défi : ${target} points` : `Next challenge: ${target} points`)}</strong><span>{result.score >= 1000 ? (isFr ? 'Défie un ami pour départager vos talents.' : 'Challenge a friend to test your skills.') : (isFr ? `Encore ${target-result.score} points. Tu connais le geste : à toi la revanche.` : `${target-result.score} more points. You know the move: run it back.`)}</span></div>
                <div className={styles.resultActions}>

                    <button type="button" onClick={replay}>{isFr ? 'Je prends ma revanche' : 'Run it back'}</button>
                    {hasScoreChallenge(gameId)&&<button type="button" onClick={()=>{location.href=`/?tab=training&link=new&game=${gameId}`;}}><Share2 size={18}/>{isFr?'Défier un ami par lien':'Create a link challenge'}</button>}
                    {['stopgo','fragile'].includes(gameId)&&<button type="button" onClick={()=>setActiveTab('survival')}>{isFr?'Jouer à quatre':'Play with four'}</button>}
                    {!['stopgo','fragile'].includes(gameId)&&!hasScoreChallenge(gameId)&&<button type="button" onClick={() => {prepareGameMode(gameId,'defy');setActiveTab('defy');}}>{isFr ? 'Défier un ami en direct' : 'Challenge a friend live'}</button>}
                    <button type="button" className={styles.secondary} onClick={() => { setPlaying(false); selectGame(nextGame.id); }}>
                        {isFr ? 'Essayer un autre jeu' : 'Try another game'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            {!playing&&guideOpen&&<TrainingTutorial key={gameId} gameId={gameId} isFr={isFr} isParty={isPartyGame(gameId)} onClose={closeGuide}/> }
            {!playing&&!guideOpen&&<button type="button" className={styles.linkChallengeButton} data-testid="training-guide-replay" onClick={()=>setReplayGuide(true)}>{isFr?'Revoir le guide':'Replay guide'}</button>}
            <LiveGameArena
                key={`${gameId}-${level}-${attempt}`}
                mode="training"
                gameId={gameId}
                series={[gameId]}
                round={effectiveLevel}
                opponentName=""
                isFr={isFr}
                onComplete={complete}
                onStart={() => {setPlaying(true);setGuideSeen(true);setReplayGuide(false);}}
            />
            {!playing&&<>
            <details className={styles.config}><summary>{isFr?'Changer de jeu':'Change game'}<span>{gameLabel(gameId,isFr)}</span></summary>
                <div className={styles.games}>
                    {PRACTICE_GAMES.map((game) => (
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
            {!playing&&hasScoreChallenge(gameId)&&<button type="button" className={styles.linkChallengeButton} onClick={()=>{location.href=`/?tab=training&link=new&game=${gameId}`;}}><Share2 size={18}/>{isFr?'Défier un ami par lien':'Create a link challenge'}</button>}
        </section>
    );
}
