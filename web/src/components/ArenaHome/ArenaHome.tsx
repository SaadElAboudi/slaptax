import { useMemo, useState } from 'react';
import styles from './ArenaHome.module.css';
import { COMPETITIVE_GAMES } from '../../gameplay/catalog';
import { useGameStore, type Tab } from '../../hooks/useGameStore';

interface ArenaHomeProps {
    onEnter: (tab: Tab) => void;
}

const GAME_MARKS: Record<string, string> = {
    bounce: '↗',
    symbolrush: '◆',
    bombpass: '●',
    cupshuffle: '▰',
    duelnumeric: '42',
};

export function ArenaHome({ onEnter }: ArenaHomeProps) {
    const language = useGameStore((state) => state.language);
    const playerName = useGameStore((state) => state.playerName);
    const wallet = useGameStore((state) => state.wallet);
    const history = useGameStore((state) => state.history);
    const isFr = language === 'fr';
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedGame = COMPETITIVE_GAMES[selectedIndex];

    const streak = useMemo(() => {
        let value = 0;
        for (const entry of history) {
            const won = entry.won === true || entry.result === 'WIN';
            if (!won) break;
            value += 1;
        }
        return value;
    }, [history]);

    function quickPlay() {
        const index = Math.floor(Math.random() * COMPETITIVE_GAMES.length);
        onEnter(COMPETITIVE_GAMES[index].tab);
    }

    return (
        <section className={styles.home}>
            <div className={styles.statusRail}>
                <div>
                    <span>{isFr ? 'JOUEUR' : 'PLAYER'}</span>
                    <strong>{playerName}</strong>
                </div>
                <div>
                    <span>{isFr ? 'SERIE' : 'STREAK'}</span>
                    <strong>{streak}×</strong>
                </div>
                <div>
                    <span>BANK</span>
                    <strong>SLAP$ {Number(wallet ?? 0).toFixed(0)}</strong>
                </div>
            </div>

            <div className={styles.stage}>
                <div className={styles.crowd} aria-hidden>
                    {Array.from({ length: 28 }, (_, index) => <i key={index} />)}
                </div>
                <div className={styles.spotlight} aria-hidden />
                <div className={styles.gameMark} aria-hidden>{GAME_MARKS[selectedGame.id]}</div>
                <div className={styles.stageCopy}>
                    <span className={styles.eyebrow}>{isFr ? 'PROCHAIN MATCH' : 'NEXT MATCH'}</span>
                    <h1>{isFr ? selectedGame.labelFr : selectedGame.labelEn}</h1>
                    <p>{isFr ? selectedGame.skillFr : selectedGame.skillEn}</p>
                </div>
                <button className={styles.playButton} type="button" onClick={() => onEnter(selectedGame.tab)}>
                    <span>{isFr ? 'JOUER' : 'PLAY'}</span>
                    <small>BO3</small>
                </button>
            </div>

            <div className={styles.selector} aria-label={isFr ? 'Choisir un jeu' : 'Choose a game'}>
                {COMPETITIVE_GAMES.map((game, index) => (
                    <button
                        key={game.id}
                        type="button"
                        className={index === selectedIndex ? styles.selected : ''}
                        onClick={() => setSelectedIndex(index)}
                        aria-pressed={index === selectedIndex}
                    >
                        <span>{GAME_MARKS[game.id]}</span>
                        <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                    </button>
                ))}
            </div>

            <div className={styles.actions}>
                <button type="button" className={styles.quickPlay} onClick={quickPlay}>
                    <span>!</span>
                    <strong>{isFr ? 'MATCH RAPIDE' : 'QUICK MATCH'}</strong>
                </button>
                <button type="button" onClick={() => onEnter('defy')}>
                    <span>VS</span>
                    <strong>{isFr ? 'DEFIER' : 'CHALLENGE'}</strong>
                </button>
                <button type="button" onClick={() => onEnter('tournament')}>
                    <span>T</span>
                    <strong>{isFr ? 'TOURNOI' : 'TOURNAMENT'}</strong>
                </button>
            </div>

            <div className={styles.secondary}>
                <button type="button" onClick={() => onEnter('leaderboard')}>{isFr ? 'Classement' : 'Leaderboard'}</button>
                <button type="button" onClick={() => onEnter('stats')}>{isFr ? 'Historique' : 'History'}</button>
            </div>
        </section>
    );
}
