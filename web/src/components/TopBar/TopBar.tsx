import styles from './TopBar.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useEffect, useState } from 'react';
import { useMusicPreference } from '../../hooks/useAdaptiveAudio';

export function TopBar() {
    const { wallet, apiOnline, language, toggleLanguage, playerName, setProfile, progression, setCosmetics } = useGameStore();
    const safeWallet = Number(wallet ?? 0);
    const isFr = language === 'fr';
    const [draftName, setDraftName] = useState(playerName);
    const [lockerOpen, setLockerOpen] = useState(false);
    const { musicOn, toggleMusic } = useMusicPreference();

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
                    title={isFr ? 'Modifier le pseudo' : 'Edit nickname'}
                    aria-label={isFr ? 'Nom du joueur' : 'Player name'}
                />
                <button
                    className={styles.avatarButton}
                    type="button"
                    onClick={() => setLockerOpen((value) => !value)}
                    aria-label={isFr ? 'Ouvrir les cosmétiques' : 'Open cosmetics'}
                    aria-expanded={lockerOpen}
                >
                    <span data-avatar={progression?.cosmetics.avatar || 'spark'} />
                </button>
                <button
                    className={styles.audioButton}
                    type="button"
                    onClick={toggleMusic}
                    aria-label={musicOn ? (isFr ? 'Couper la musique' : 'Mute music') : (isFr ? 'Activer la musique' : 'Enable music')}
                    aria-pressed={musicOn}
                >
                    {musicOn ? '♪' : '×'}
                </button>
                <button className={styles.langBtn} onClick={toggleLanguage} type="button" aria-label={isFr ? 'Changer la langue' : 'Change language'}>
                    {isFr ? 'FR' : 'EN'}
                </button>
            </div>
            {lockerOpen && progression && (
                <div className={styles.locker}>
                    <header>
                        <div>
                            <span>{isFr ? 'CASIER JOUEUR' : 'PLAYER LOCKER'}</span>
                            <strong>LVL {progression.level} · {progression.rank}</strong>
                        </div>
                        <button type="button" onClick={() => setLockerOpen(false)} aria-label={isFr ? 'Fermer' : 'Close'}>×</button>
                    </header>
                    <CosmeticRow
                        label={isFr ? 'Avatar' : 'Avatar'}
                        values={['spark', 'visor', 'crown', 'phantom']}
                        unlocked={progression.cosmetics.unlocked.avatars}
                        selected={progression.cosmetics.avatar}
                        onSelect={(avatar) => void setCosmetics({ avatar })}
                    />
                    <CosmeticRow
                        label={isFr ? 'Arène' : 'Arena'}
                        values={['foundry', 'neon', 'storm']}
                        unlocked={progression.cosmetics.unlocked.arenas}
                        selected={progression.cosmetics.arena}
                        onSelect={(arena) => void setCosmetics({ arena })}
                    />
                    <CosmeticRow
                        label={isFr ? 'Traînée' : 'Trail'}
                        values={['pulse', 'ember', 'glitch']}
                        unlocked={progression.cosmetics.unlocked.trails}
                        selected={progression.cosmetics.trail}
                        onSelect={(trail) => void setCosmetics({ trail })}
                    />
                </div>
            )}
        </header>
    );
}

function CosmeticRow({
    label,
    values,
    unlocked,
    selected,
    onSelect,
}: {
    label: string;
    values: string[];
    unlocked: string[];
    selected: string;
    onSelect: (value: string) => void;
}) {
    return (
        <section className={styles.cosmeticRow}>
            <span>{label}</span>
            <div>
                {values.map((value) => (
                    <button
                        type="button"
                        key={value}
                        className={selected === value ? styles.selectedCosmetic : ''}
                        disabled={!unlocked.includes(value)}
                        onClick={() => onSelect(value)}
                        title={value}
                    >
                        {value}
                    </button>
                ))}
            </div>
        </section>
    );
}
