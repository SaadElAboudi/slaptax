import styles from './AnalyticsPanel.module.css';
import { useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';

function metricState(value: number, target: number) {
    if (value >= target) return 'good';
    if (value >= target * 0.6) return 'warn';
    return 'bad';
}

export function AnalyticsPanel() {
    const { analyticsKpi, loadAnalytics, language } = useGameStore();
    const isFr = language === 'fr';

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    if (!analyticsKpi) {
        return <section className={styles.panel}>{isFr ? 'Chargement analytics…' : 'Loading analytics…'}</section>;
    }

    const items = [
        {
            label: isFr ? 'Taux de revanche' : 'Rematch rate',
            value: `${analyticsKpi.rematchRate}%`,
            target: `${analyticsKpi.targets.rematchRate}%`,
            state: metricState(analyticsKpi.rematchRate, analyticsKpi.targets.rematchRate),
        },
        {
            label: isFr ? 'Duels par joueur actif' : 'Duels per active user',
            value: analyticsKpi.duelsPerActiveUser.toFixed(1),
            target: analyticsKpi.targets.duelsPerActiveUser.toString(),
            state: metricState(analyticsKpi.duelsPerActiveUser, analyticsKpi.targets.duelsPerActiveUser),
        },
        {
            label: isFr ? 'Taux de replay < 24h' : 'Replay rate < 24h',
            value: `${analyticsKpi.losersReplayRate24h}%`,
            target: `${analyticsKpi.targets.losersReplayRate24h}%`,
            state: metricState(analyticsKpi.losersReplayRate24h, analyticsKpi.targets.losersReplayRate24h),
        },
        {
            label: isFr ? 'Duels joues' : 'Played duels',
            value: analyticsKpi.totalPlayedDuels.toString(),
            target: '—',
            state: 'good',
        },
    ] as const;

    return (
        <section className={styles.panel}>
            <div className={styles.head}>
                <div>
                    <h2 className={styles.title}>Analytics</h2>
                    <p className={styles.sub}>{isFr ? 'KPI en direct depuis le backend.' : 'Live KPIs from the backend.'}</p>
                </div>
            </div>

            <div className={styles.grid}>
                {items.map((item) => (
                    <article key={item.label} className={`${styles.card} ${styles[item.state]}`}>
                        <span className={styles.label}>{item.label}</span>
                        <strong className={styles.value}>{item.value}</strong>
                        <span className={styles.target}>{isFr ? 'Objectif' : 'Target'}: {item.target}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}
