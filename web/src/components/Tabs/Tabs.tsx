import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const ALL_TABS: { id: Tab; label: string; advanced?: boolean }[] = [
    { id: 'duel', label: 'Precision Rush' },
    { id: 'quickdraw', label: 'Quickdraw' },
    { id: 'parry', label: 'Parry Clash', advanced: true },
    { id: 'mindgame', label: 'Mind Game', advanced: true },
    { id: 'speedsort', label: 'Speed Sort', advanced: true },
    { id: 'duelnumeric', label: 'Duel Numeric', advanced: true },
    { id: 'defy', label: 'Friend Duel' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'leaderboard', label: 'Leaderboard', advanced: true },
    { id: 'analytics', label: 'Analytics', advanced: true },
    { id: 'stats', label: 'History', advanced: true },
];

const TAB_LABELS_FR: Record<Tab, string> = {
    duel: 'Precision Rush',
    quickdraw: 'Quickdraw',
    parry: 'Parry Clash',
    mindgame: 'Mental',
    speedsort: 'Speed Sort',
    duelnumeric: 'Duel Numeric',
    defy: 'Duel Ami',
    tournament: 'Tournoi',
    leaderboard: 'Classement',
    analytics: 'Analytics',
    stats: 'Historique',
};

export function Tabs() {
    const { activeTab, setActiveTab, mobileAdvancedOpen, setMobileAdvancedOpen, language } = useGameStore();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isFr = language === 'fr';

    const visible = ALL_TABS.filter(
        (t) => !t.advanced || !isMobile || mobileAdvancedOpen
    );

    return (
        <nav className={styles.tabs} aria-label={isFr ? 'Navigation principale' : 'Main navigation'}>
            {visible.map((t) => (
                <button
                    key={t.id}
                    className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab(t.id);
                        if (isMobile && mobileAdvancedOpen && !t.advanced) {
                            setMobileAdvancedOpen(false);
                        }
                    }}
                    aria-current={activeTab === t.id ? 'page' : undefined}
                >
                    {isFr ? TAB_LABELS_FR[t.id] : t.label}
                </button>
            ))}
        </nav>
    );
}
