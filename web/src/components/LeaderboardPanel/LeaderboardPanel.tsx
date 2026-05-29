import styles from './LeaderboardPanel.module.css';
import { useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';

export function LeaderboardPanel() {
    const { leaderboard, loadLeaderboard, apiOnline, language } = useGameStore();
    const isFr = language === 'fr';

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    return (
        <section className={styles.panel}>
            <div className={styles.head}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Classement' : 'Leaderboard'}</h2>
                    <p className={styles.sub}>{isFr ? 'Trie par victoires puis taux de victoire.' : 'Sorted by wins, then win rate.'}</p>
                </div>
                <span className={`${styles.badge} ${apiOnline ? styles.ok : styles.bad}`}>{apiOnline ? (isFr ? 'DIRECT' : 'LIVE') : (isFr ? 'HORS LIGNE' : 'OFFLINE')}</span>
            </div>

            <div className={styles.list}>
                {leaderboard.length === 0 ? (
                    <div className={styles.empty}>{isFr ? 'Aucune donnee de classement pour le moment.' : 'No leaderboard data yet.'}</div>
                ) : (
                    leaderboard.map((row, index) => (
                        <article key={row.id} className={styles.row}>
                            <div className={styles.rank}>{index + 1}</div>
                            <div className={styles.meta}>
                                <strong>{row.playerName}</strong>
                                <span>{row.skillPool} · cap SLAP$ {row.stakeCap}</span>
                            </div>
                            <div className={styles.stats}>
                                <span>{row.wins}W / {row.losses}L</span>
                                <span>{row.winRate}%</span>
                                <span>SLAP$ {Number(row.wallet ?? 0).toFixed(2)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}
