import styles from './Tabs.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';
import { Play, Swords, Trophy, ChartNoAxesColumnIncreasing, History, Link, type LucideIcon } from 'lucide-react';

const ALL_TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'training', label: 'Training', icon: Play },
    { id: 'defy', label: 'Friend Duel', icon: Swords },
    { id: 'challenges', label: 'My challenges', icon: Link },
    { id: 'tournament', label: 'Tournament', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: ChartNoAxesColumnIncreasing },
    { id: 'stats', label: 'History', icon: History },
];

const TAB_LABELS_FR: Record<Tab, string> = {
    training: 'Entrainement',
    defy: 'Duel Ami',
    tournament: 'Tournoi',
    leaderboard: 'Classement',
    stats: 'Historique',
    challenges: 'Mes defis',
};

export function Tabs() {
    const { activeTab, setActiveTab, language } = useGameStore();
    const isFr = language === 'fr';

    return (
        <nav className={styles.tabs} aria-label={isFr ? 'Navigation principale' : 'Main navigation'}>
            {ALL_TABS.map((t) => (
                <button
                    key={t.id}
                    data-tab={t.id}
                    className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab(t.id);
                    }}
                    aria-current={activeTab === t.id ? 'page' : undefined}
                >
                    <span aria-hidden><t.icon size={19} strokeWidth={1.8} /></span>
                    <b>{isFr ? TAB_LABELS_FR[t.id] : t.label}</b>
                </button>
            ))}
        </nav>
    );
}
