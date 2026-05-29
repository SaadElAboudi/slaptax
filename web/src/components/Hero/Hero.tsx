import styles from './Hero.module.css';
import { useGameStore } from '../../hooks/useGameStore';

export function Hero() {
    const { wallet, stake, skillPool, apiOnline, language } = useGameStore();
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);
    const isFr = language === 'fr';

    const coverage = safeStake > 0 ? `${((safeWallet / safeStake) * 100).toFixed(0)}%` : '—';
    const lastNet = useGameStore((s) => s.lastNet);

    return (
        <section className={styles.hero}>
            <div className={styles.left}>
                <h1 className={styles.title}>SLAP$TAX</h1>
                <p className={styles.subtitle}>
                    {isFr
                        ? 'Roster competitif rationalise : jeux distincts, lisibles, nerveux, prets pour duel, partage et tournoi.'
                        : 'Curated competitive roster: distinct, readable, high-pressure games built for duel, sharing, and tournament play.'}
                </p>
                <p className={styles.roster}>
                    {isFr
                        ? 'Pool actif: Precision Rush · Quickdraw · Mental · Speed Sort · Duel Numeric'
                        : 'Live pool: Precision Rush · Quickdraw · Mind Game · Speed Sort · Duel Numeric'}
                </p>
                <div className={styles.meta}>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{isFr ? 'Serveur de Jeu' : 'Game Server'}</div>
                        <div className={`${styles.statValue} ${apiOnline ? styles.ok : styles.bad}`}>
                            {apiOnline ? (isFr ? '● En ligne' : '● Online') : (isFr ? '○ Hors ligne' : '○ Offline')}
                        </div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{isFr ? 'Couverture Wallet' : 'Wallet Coverage'}</div>
                        <div className={styles.statValue}>{coverage}</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{isFr ? 'Dernier Resultat Net' : 'Last Net Result'}</div>
                        <div
                            className={`${styles.statValue} ${lastNet == null ? '' : lastNet >= 0 ? styles.ok : styles.bad
                                }`}
                        >
                            {lastNet == null
                                ? (isFr ? 'Aucun match pour le moment' : 'No match yet')
                                : `${lastNet >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}
                        </div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statLabel}>{isFr ? 'Niveau' : 'Skill Pool'}</div>
                        <div className={styles.statValue}>{skillPool}</div>
                    </div>
                </div>
            </div>
            <div className={styles.right}>
                <span className={`${styles.apiBadge} ${apiOnline ? styles.connected : ''}`}>
                    {apiOnline ? (isFr ? '● SERVEUR EN LIGNE' : '● SERVER ONLINE') : (isFr ? '○ SERVEUR HORS LIGNE' : '○ SERVER OFFLINE')}
                </span>
            </div>
        </section>
    );
}
