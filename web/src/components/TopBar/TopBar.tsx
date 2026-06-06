import styles from './TopBar.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel } from '../../gameplay/difficulty';
import { useEffect, useState } from 'react';

export function TopBar() {
    const { wallet, apiOnline, language, toggleLanguage, difficultyMode, cycleDifficultyMode, playerName, setProfile } = useGameStore();
    const safeWallet = Number(wallet ?? 0);
    const isFr = language === 'fr';
    const [draftName, setDraftName] = useState(playerName);

    useEffect(() => {
        setDraftName(playerName);
    }, [playerName]);

    const commitName = () => {
        const next = draftName.trim();
        if (!next || next === playerName) return;
        setProfile(next);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftName(e.target.value);
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.brand}>
                SLAP<span className={styles.dollar}>$</span>TAX
            </div>
            <div className={styles.right}>
                <span className={`${styles.liveDot} ${apiOnline ? styles.live : styles.offline}`}>
                    {apiOnline ? (isFr ? 'LIVE' : 'LIVE') : 'OFF'}
                </span>
                <span className={`${styles.walletChip} ${apiOnline ? styles.online : ''}`}>
                    SLAP$ {safeWallet.toFixed(2)}
                </span>
                <input
                    className={styles.playerNameInput}
                    type="text"
                    value={draftName}
                    onChange={handleNameChange}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitName();
                        }
                    }}
                    maxLength={20}
                    title={isFr ? 'Changer de joueur' : 'Switch user'}
                    aria-label={isFr ? 'Nom du joueur' : 'Player name'}
                />
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
