import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { COMPETITIVE_GAMES } from '../../gameplay/catalog';

const ALL_TABS: { id: Tab; label: string; advanced?: boolean }[] = [
    ...COMPETITIVE_GAMES.map((game, index) => ({
        id: game.tab,
        label: game.labelEn,
        advanced: index > 1,
    })),
    { id: 'defy', label: 'Friend Duel' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'leaderboard', label: 'Leaderboard', advanced: true },
    { id: 'analytics', label: 'Analytics', advanced: true },
    { id: 'stats', label: 'History', advanced: true },
];

const TAB_LABELS_FR: Record<Tab, string> = {
    bounce: 'Bounce Panic',
    symbolrush: 'Symbol Sprint',
    bomb: 'Bomb Pass',
    cups: 'Cup Shuffle',
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
