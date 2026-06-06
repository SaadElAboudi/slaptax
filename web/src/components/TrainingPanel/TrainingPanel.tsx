import { useMemo, useState } from 'react';
import { COMPETITIVE_GAMES, gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './TrainingPanel.module.css';

interface TrainingResult {
    score: number;
    metric: number;
}

const LEVELS = [1, 2, 3] as const;
const LEVEL_LABELS = {
    fr: ['Tranquille', 'Standard', 'Intense'],
    en: ['Relaxed', 'Standard', 'Intense'],
};

export function TrainingPanel() {
    const language = useGameStore((state) => state.language);
    const isFr = language === 'fr';
    const [gameId, setGameId] = useState<CompetitiveGameId>(() => {
        try {
            const stored = localStorage.getItem('slaptax_training_game');
            return COMPETITIVE_GAMES.some((game) => game.id === stored) ? stored as CompetitiveGameId : 'bounce';
        } catch {
            return 'bounce';
        }
    });
    const [level, setLevel] = useState<(typeof LEVELS)[number]>(1);
    const [attempt, setAttempt] = useState(1);
    const [result, setResult] = useState<TrainingResult | null>(null);

    const best = useMemo(() => {
        try {
            return Number(localStorage.getItem(`slaptax_training_best_${gameId}_${level}`) || 0);
        } catch {
            return 0;
        }
    }, [gameId, level, attempt]);

    function selectGame(next: CompetitiveGameId) {
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
        setResult(next);
        if (next.score > best) {
            try {
                localStorage.setItem(`slaptax_training_best_${gameId}_${level}`, String(next.score));
            } catch {
                // Best score persistence is optional.
            }
        }
    }

    function replay() {
        setResult(null);
        setAttempt((value) => value + 1);
    }

    if (result) {
        const isRecord = result.score > best;
        return (
            <section className={styles.result}>
                <span>{isRecord ? (isFr ? 'NOUVEAU RECORD' : 'NEW RECORD') : (isFr ? 'SESSION TERMINEE' : 'SESSION COMPLETE')}</span>
                <h2>{result.score}</h2>
                <p>{gameLabel(gameId, isFr)} · {(result.metric / 1000).toFixed(1)}s</p>
                <div className={styles.resultActions}>
                    <button type="button" onClick={replay}>{isFr ? 'Rejouer' : 'Replay'}</button>
                    <button type="button" className={styles.secondary} onClick={() => setResult(null)}>
                        {isFr ? 'Changer d exercice' : 'Change drill'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            <header className={styles.head}>
                <div>
                    <span>{isFr ? 'ZONE SANS ENJEU' : 'NO-STAKES ZONE'}</span>
                    <h2>{isFr ? 'Entrainement' : 'Training'}</h2>
                    <p>{isFr ? 'Travaille une epreuve librement. Aucun adversaire, aucune mise, aucun impact sur ton classement.' : 'Practice one event freely. No opponent, no stake, no ranking impact.'}</p>
                </div>
                <div className={styles.best}><span>BEST</span><strong>{best || '--'}</strong></div>
            </header>

            <div className={styles.config}>
                <div className={styles.games}>
                    {COMPETITIVE_GAMES.map((game) => (
                        <button type="button" key={game.id} className={game.id === gameId ? styles.selected : ''} onClick={() => selectGame(game.id)}>
                            <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                            <span>{isFr ? game.skillFr : game.skillEn}</span>
                        </button>
                    ))}
                </div>
                <div className={styles.levels}>
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
                </div>
            </div>

            <LiveGameArena
                key={`${gameId}-${level}-${attempt}`}
                mode="training"
                gameId={gameId}
                series={[gameId]}
                round={level}
                opponentName=""
                isFr={isFr}
                onComplete={complete}
            />
        </section>
    );
}
