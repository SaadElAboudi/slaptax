import styles from './TopBar.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel } from '../../gameplay/difficulty';
import { useEffect, useState } from 'react';

export function TopBar() {
    const { wallet, apiOnline, language, toggleLanguage, difficultyMode, cycleDifficultyMode, playerName, setProfile, userId, clientId } = useGameStore();
    const safeWallet = Number(wallet ?? 0);
    const isFr = language === 'fr';
    const [draftName, setDraftName] = useState(playerName);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setDraftName(playerName);
    }, [playerName]);

    const commitName = () => {
        const next = draftName.trim();
        if (!next || next === playerName) return;
        setProfile(next);
    };

    const shortUserId = userId ? `${userId.slice(0, 8)}...` : null;
    const shortClientId = clientId ? `${clientId.slice(0, 8)}...` : null;

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftName(e.target.value);
    };

    const handleCopyUserId = async () => {
        if (!userId) return;
        try {
            await navigator.clipboard.writeText(userId);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch {
            setCopied(false);
        }
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
                    style={{ width: 110, marginLeft: 6, marginRight: 6, fontWeight: 700, textAlign: 'center', borderRadius: 8, border: '1px solid #ffd400', background: '#23272f', color: '#ffd400', padding: '4px 8px' }}
                />
                {shortUserId && (
                    <span className={styles.idBadge} title={isFr ? `ID joueur: ${userId}` : `Player ID: ${userId}`}>
                        {isFr ? 'J' : 'U'}#{shortUserId}
                    </span>
                )}
                {userId && (
                    <button
                        className={`${styles.copyIdBtn} ${copied ? styles.copyIdBtnDone : ''}`}
                        onClick={handleCopyUserId}
                        type="button"
                        title={isFr ? 'Copier l ID joueur' : 'Copy player ID'}
                    >
                        {copied ? (isFr ? 'Copie' : 'Copied') : (isFr ? 'Copier ID' : 'Copy ID')}
                    </button>
                )}
                {shortClientId && (
                    <span className={styles.idBadgeMuted} title={isFr ? `ID client: ${clientId}` : `Client ID: ${clientId}`}>
                        C#{shortClientId}
                    </span>
                )}
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
