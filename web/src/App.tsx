import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameStore, type Tab } from './hooks/useGameStore';
import { TopBar } from './components/TopBar/TopBar';
import { Tabs } from './components/Tabs/Tabs';
import { ArenaHome } from './components/ArenaHome/ArenaHome';
import { LeaderboardPanel } from './components/LeaderboardPanel/LeaderboardPanel';
import { HistoryPanel } from './components/HistoryPanel/HistoryPanel';
import { FriendDuelPanel } from './components/FriendDuelPanel/FriendDuelPanel';
import { TournamentPanel } from './components/TournamentPanel/TournamentPanel';
import { TrainingPanel } from './components/TrainingPanel/TrainingPanel';
import { OnboardingModal } from './components/OnboardingModal/OnboardingModal';
import { useRealtime } from './api/realtime';

function App() {
    const { bootstrap, refreshLiveState, activeTab, setActiveTab, language, userId } = useGameStore();
    const isFr = language === 'fr';
    const [arenaOpen, setArenaOpen] = useState(() => {
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        return Boolean(requestedTab);
    });
    const [showOnboarding, setShowOnboarding] = useState(() => {
        try {
            return !localStorage.getItem('slaptax_onboarded');
        } catch {
            return true;
        }
    });

    useRealtime(userId, (event) => {
        if (event.type === 'state.changed') void refreshLiveState();
    });

    const handleOnboardingComplete = (tab: Tab) => {
        try {
            localStorage.setItem('slaptax_onboarded', '1');
        } catch { }
        setShowOnboarding(false);
        enterArena(tab);
    };

    useEffect(() => {
        bootstrap();
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        if (requestedTab && ['training', 'bounce', 'symbolrush', 'bomb', 'cups', 'duelnumeric', 'defy', 'tournament', 'leaderboard', 'stats'].includes(requestedTab)) {
            const migratedTab = ['bounce', 'symbolrush', 'bomb', 'cups', 'duelnumeric'].includes(requestedTab) ? 'training' : requestedTab;
            setActiveTab(migratedTab as Tab);
            setArenaOpen(true);
        }

        const onFocus = () => refreshLiveState();
        const onVisibility = () => {
            if (!document.hidden) refreshLiveState();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [bootstrap, refreshLiveState]);

    function enterArena(tab: Tab) {
        setActiveTab(tab);
        setArenaOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const sectionLabels: Partial<Record<Tab, string>> = {
        training: isFr ? 'Entrainement' : 'Training',
        defy: isFr ? 'Duel Ami' : 'Friend Duel',
        tournament: isFr ? 'Tournoi' : 'Tournament',
        leaderboard: isFr ? 'Classement' : 'Leaderboard',
        stats: isFr ? 'Historique' : 'History',
    };
    const activeGameName = sectionLabels[activeTab] || (isFr ? 'Entrainement' : 'Training');
    const modeStatus: Record<Tab, { label: string; tone: string }> = {
        training: { label: 'SOLO', tone: styles.statusSolo },
        defy: { label: '1V1', tone: styles.statusLive },
        tournament: { label: 'RUN', tone: styles.statusTournament },
        leaderboard: { label: 'RANK', tone: styles.statusMeta },
        stats: { label: isFr ? 'BILAN' : 'LOG', tone: styles.statusMeta },
    };

    return (
        <>
            <div className={styles.tapeBg} aria-hidden />

            <TopBar />

            <main className={`${styles.container} ${arenaOpen ? styles.arenaMode : styles.homeMode}`}>
                {!arenaOpen ? (
                    <ArenaHome onEnter={enterArena} />
                ) : (
                    <>
                        <div className={styles.matchHeader}>
                            <button type="button" onClick={() => setArenaOpen(false)} aria-label={isFr ? 'Retour a l arene' : 'Back to arena'}>
                                ←
                            </button>
                            <div>
                                <span>{isFr ? 'SLAP$TAX ARENE' : 'SLAP$TAX ARENA'}</span>
                                <strong>{activeGameName}</strong>
                            </div>
                            <span className={`${styles.modeStatus} ${modeStatus[activeTab].tone}`}>
                                {modeStatus[activeTab].label}
                            </span>
                        </div>

                        <Tabs />

                        <div key={activeTab} className={styles.panelArea}>
                            {activeTab === 'training' && <TrainingPanel />}
                            {activeTab === 'defy' && <FriendDuelPanel />}
                            {activeTab === 'tournament' && <TournamentPanel />}
                            {activeTab === 'leaderboard' && <LeaderboardPanel />}
                            {activeTab === 'stats' && <HistoryPanel />}
                        </div>
                    </>
                )}

                {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
            </main>
        </>
    );
}

export default App;
