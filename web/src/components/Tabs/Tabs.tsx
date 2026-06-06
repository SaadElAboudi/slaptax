import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';

const ALL_TABS: { id: Tab; label: string; advanced?: boolean }[] = [
    { id: 'training', label: 'Training' },
    { id: 'defy', label: 'Friend Duel' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'stats', label: 'History' },
];

const TAB_LABELS_FR: Record<Tab, string> = {
    training: 'Entrainement',
    defy: 'Duel Ami',
    tournament: 'Tournoi',
    leaderboard: 'Classement',
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
