import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'training', label: 'Training', icon: '↗' },
    { id: 'defy', label: 'Friend Duel', icon: 'VS' },
    { id: 'tournament', label: 'Tournament', icon: '◆' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '↑' },
    { id: 'stats', label: 'History', icon: '≡' },
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
                    <span aria-hidden>{t.icon}</span>
                    <b>{isFr ? TAB_LABELS_FR[t.id] : t.label}</b>
                </button>
            ))}
        </nav>
    );
}
