import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
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
    const { activeTab, setActiveTab, language } = useGameStore();
    const isFr = language === 'fr';

    return (
        <nav className={styles.tabs} aria-label={isFr ? 'Navigation principale' : 'Main navigation'}>
            {ALL_TABS.map((t) => (
                <button
                    key={t.id}
                    className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab(t.id);
                    }}
                    aria-current={activeTab === t.id ? 'page' : undefined}
                >
                    {isFr ? TAB_LABELS_FR[t.id] : t.label}
                </button>
            ))}
        </nav>
    );
}
