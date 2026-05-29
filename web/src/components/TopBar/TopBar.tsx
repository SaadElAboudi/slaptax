import styles from './TopBar.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel } from '../../gameplay/difficulty';

export function TopBar() {
    const { wallet, apiOnline, language, toggleLanguage, difficultyMode, cycleDifficultyMode, playerName, setProfile } = useGameStore();
    const safeWallet = Number(wallet ?? 0);
    const isFr = language === 'fr';

    // For quick user switching (dev/testing):
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile(e.target.value);
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.brand}>
                SLAP<span className={styles.dollar}>$</span>TAX
            </div>
            <div className={styles.right}>
                <span className={styles.liveDot}>{isFr ? 'DIRECT' : 'LIVE'}</span>
                <span className={`${styles.walletChip} ${apiOnline ? styles.online : ''}`}>
                    SLAP$ {safeWallet.toFixed(2)}
                </span>
                {/* Player name display and quick edit */}
                <input
                    className={styles.playerNameInput}
                    type="text"
                    value={playerName}
                    onChange={handleNameChange}
                    maxLength={20}
                    title={isFr ? 'Changer de joueur' : 'Switch user'}
                    style={{ width: 110, marginLeft: 6, marginRight: 6, fontWeight: 700, textAlign: 'center', borderRadius: 8, border: '1px solid #ffd400', background: '#23272f', color: '#ffd400', padding: '4px 8px' }}
                />
                <span
                    className={`${styles.serverDot} ${apiOnline ? styles.ok : styles.bad}`}
                    title={apiOnline ? (isFr ? 'Serveur en ligne' : 'Server online') : (isFr ? 'Serveur hors ligne' : 'Server offline')}
                >
                    {apiOnline ? (isFr ? '● EN LIGNE' : '● ONLINE') : (isFr ? '○ HORS LIGNE' : '○ OFFLINE')}
                </span>
                <button className={styles.langBtn} onClick={cycleDifficultyMode} type="button" aria-label={isFr ? 'Changer la difficulté' : 'Change difficulty'}>
                    {getDifficultyLabel(difficultyMode, isFr)}
                </button>
                <button className={styles.langBtn} onClick={toggleLanguage} type="button" aria-label={isFr ? 'Changer la langue' : 'Change language'}>
                    {isFr ? 'FR' : 'EN'}
                </button>
            </div>
        </header>
    );
}
