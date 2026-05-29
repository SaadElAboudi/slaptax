import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useGameStore } from './hooks/useGameStore';
import { TopBar } from './components/TopBar/TopBar';
import { Ticker } from './components/Ticker/Ticker';
import { Hero } from './components/Hero/Hero';
import { Lobby } from './components/Lobby/Lobby';
import { Tabs } from './components/Tabs/Tabs';
import { DuelPanel } from './components/DuelPanel/DuelPanel';
import { QuickdrawPanel } from './components/QuickdrawPanel/QuickdrawPanel';
import { ParryClashPanel } from './components/ParryClashPanel/ParryClashPanel';
import { MindGameDuelPanel } from './components/MindGameDuelPanel/MindGameDuelPanel';
import { SpeedSortPanel } from './components/SpeedSortPanel/SpeedSortPanel';
import { DuelNumericPanel } from './components/DuelNumericPanel/DuelNumericPanel';
import { MobileAdvancedBtn } from './components/MobileAdvancedBtn/MobileAdvancedBtn';
import { LeaderboardPanel } from './components/LeaderboardPanel/LeaderboardPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel/AnalyticsPanel';
import { HistoryPanel } from './components/HistoryPanel/HistoryPanel';
import { FriendDuelPanel } from './components/FriendDuelPanel/FriendDuelPanel';
import { TournamentPanel } from './components/TournamentPanel/TournamentPanel';
import { useMediaQuery } from './hooks/useMediaQuery';
import { OnboardingModal } from './components/OnboardingModal/OnboardingModal';

function App() {
    const { bootstrap, refreshLiveState, activeTab, mobileAdvancedOpen } = useGameStore();
    const isMobile = useMediaQuery('(max-width: 767px)');
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

    const showAdvancedSections = !isMobile || mobileAdvancedOpen;

    return (
        <>
            <div className={styles.tapeBg} aria-hidden />

            <TopBar />
            <Ticker />

            <main className={styles.container}>
                {showAdvancedSections && (
                    <>
                        <Hero />
                        <Lobby />
                    </>
                )}

                <Tabs />

                <div className={styles.panelArea}>
                    {activeTab === 'duel' && <DuelPanel />}
                    {activeTab === 'quickdraw' && <QuickdrawPanel />}
                    {activeTab === 'parry' && <ParryClashPanel />}
                    {activeTab === 'mindgame' && <MindGameDuelPanel />}
                    {activeTab === 'speedsort' && <SpeedSortPanel />}
                    {activeTab === 'duelnumeric' && <DuelNumericPanel />}
                    {activeTab === 'defy' && <FriendDuelPanel />}
                    {activeTab === 'tournament' && <TournamentPanel />}
                    {activeTab === 'leaderboard' && <LeaderboardPanel />}
                    {activeTab === 'analytics' && <AnalyticsPanel />}
                    {activeTab === 'stats' && <HistoryPanel />}
                </div>

                {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
                <MobileAdvancedBtn />
            </main>
        </>
    );
}

export default App;
