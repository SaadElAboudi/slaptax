import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameStore, type Tab } from './hooks/useGameStore';
import { TopBar } from './components/TopBar/TopBar';
import { Tabs } from './components/Tabs/Tabs';
import { ArenaHome } from './components/ArenaHome/ArenaHome';
import { BouncePanicPanel } from './components/BouncePanicPanel/BouncePanicPanel';
import { SymbolSprintPanel } from './components/SymbolSprintPanel/SymbolSprintPanel';
import { DuelNumericPanel } from './components/DuelNumericPanel/DuelNumericPanel';
import { BombPassPanel } from './components/BombPassPanel/BombPassPanel';
import { CupShufflePanel } from './components/CupShufflePanel/CupShufflePanel';
import { LeaderboardPanel } from './components/LeaderboardPanel/LeaderboardPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel/AnalyticsPanel';
import { HistoryPanel } from './components/HistoryPanel/HistoryPanel';
import { FriendDuelPanel } from './components/FriendDuelPanel/FriendDuelPanel';
import { TournamentPanel } from './components/TournamentPanel/TournamentPanel';
import { OnboardingModal } from './components/OnboardingModal/OnboardingModal';
import { gameLabel } from './gameplay/catalog';

function App() {
    const { bootstrap, refreshLiveState, activeTab, setActiveTab, language, lastNet } = useGameStore();
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

    const handleOnboardingClose = () => {
        try {
            localStorage.setItem('slaptax_onboarded', '1');
        } catch { }
        setShowOnboarding(false);
    };

    useEffect(() => {
        bootstrap();

        // Keep dashboard and wallet in sync with backend.
        const iv = setInterval(() => {
            useGameStore.getState().refreshLiveState();
        }, 20_000);

        const onFocus = () => refreshLiveState();
        const onVisibility = () => {
            if (!document.hidden) refreshLiveState();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            clearInterval(iv);
        };
    }, [bootstrap, refreshLiveState]);

    useEffect(() => {
        if (lastNet == null || !('vibrate' in navigator)) return;
        navigator.vibrate(lastNet >= 0 ? [40, 35, 90] : [130, 55, 130]);
    }, [lastNet]);

    function enterArena(tab: Tab) {
        setActiveTab(tab);
        setArenaOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const sectionLabels: Partial<Record<Tab, string>> = {
        defy: isFr ? 'Duel Ami' : 'Friend Duel',
        tournament: isFr ? 'Tournoi' : 'Tournament',
        leaderboard: isFr ? 'Classement' : 'Leaderboard',
        analytics: 'Analytics',
        stats: isFr ? 'Historique' : 'History',
    };
    const activeGameName = sectionLabels[activeTab] || gameLabel(activeTab, isFr);

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
                                <span>{isFr ? 'ARENE LIVE' : 'LIVE ARENA'}</span>
                                <strong>{activeGameName}</strong>
                            </div>
                            <i className={styles.livePulse} aria-hidden />
                        </div>

                        <Tabs />

                        <div key={activeTab} className={styles.panelArea}>
                            {activeTab === 'bounce' && <BouncePanicPanel />}
                            {activeTab === 'symbolrush' && <SymbolSprintPanel />}
                            {activeTab === 'bomb' && <BombPassPanel />}
                            {activeTab === 'cups' && <CupShufflePanel />}
                            {activeTab === 'duelnumeric' && <DuelNumericPanel />}
                            {activeTab === 'defy' && <FriendDuelPanel />}
                            {activeTab === 'tournament' && <TournamentPanel />}
                            {activeTab === 'leaderboard' && <LeaderboardPanel />}
                            {activeTab === 'analytics' && <AnalyticsPanel />}
                            {activeTab === 'stats' && <HistoryPanel />}
                        </div>
                    </>
                )}

                {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
            </main>
        </>
    );
}

export default App;
