import { useEffect } from 'react';
import styles from './HistoryPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';

function formatHistoryDate(value: unknown, isFr: boolean): string {
    if (typeof value !== 'string' || !value) return isFr ? 'Date inconnue' : 'Unknown date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return isFr ? 'Date inconnue' : 'Unknown date';
    return parsed.toLocaleString();
}

function resolveOutcome(item: { won?: boolean; result?: string; net?: number }): boolean {
    if (typeof item.won === 'boolean') return item.won;
    if (typeof item.result === 'string') {
        const normalized = item.result.toUpperCase();
        if (normalized === 'WIN' || normalized === 'CREDIT') return true;
        if (normalized === 'LOSS') return false;
    }
    return Number(item.net ?? 0) >= 0;
}

export function HistoryPanel() {
    const { history, loadHistory, language } = useGameStore();
    const isFr = language === 'fr';

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return (
        <section className={styles.panel}>
            <div className={styles.head}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Historique des Matchs' : 'Match History'}</h2>
                    <p className={styles.sub}>{isFr ? 'Duels recents du joueur actif.' : 'Recent duels on the active user.'}</p>
                </div>
            </div>

            <div className={styles.list}>
                {history.length === 0 ? (
                    <div className={styles.empty}>{isFr ? 'Aucun match pour le moment.' : 'No matches yet.'}</div>
                ) : (
                    history.map((item, index) => {
                        const safeNet = Number(item.net ?? 0);
                        const rowKey = `${item.id ?? 'no-id'}-${item.timestamp ?? item.date ?? 'no-date'}-${index}`;
                        return (
                            <article key={rowKey} className={styles.row}>
                                <div className={`${styles.dot} ${resolveOutcome(item) ? styles.win : styles.loss}`} />
                                <div className={styles.meta}>
                                    <strong>{item.mode || item.type || (isFr ? 'Match' : 'Match')}</strong>
                                    <span>{formatHistoryDate(item.timestamp ?? item.date, isFr)}</span>
                                </div>
                                <div className={styles.stats}>
                                    <span>{resolveOutcome(item) ? (isFr ? 'VICTOIRE' : 'WIN') : (isFr ? 'DEFAITE' : 'LOSS')}</span>
                                    <span>{safeNet >= 0 ? '+' : ''}SLAP$ {safeNet.toFixed(2)}</span>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
}
