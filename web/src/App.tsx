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
import { useRealtime } from './api/realtime';
import { api } from './api/client';
import { LinkChallenge } from './components/TrainingPanel/LinkChallenge';
import { MyChallenges } from './components/MyChallenges/MyChallenges';

function App() {
    const { bootstrap, refreshLiveState, activeTab, setActiveTab, language, userId, progression } = useGameStore();
    const isFr = language === 'fr';
    const [linkChallenge, setLinkChallenge] = useState(() => new URLSearchParams(window.location.search).get('link'));
    useEffect(() => {
        if (!userId) return;
        const heartbeat = window.setInterval(() => {
            if (!document.hidden) void api.getMatchmakingStatus(userId).catch(() => undefined);
        }, 20000);
        return () => clearInterval(heartbeat);
    }, [userId]);
    const [arenaOpen, setArenaOpen] = useState(() => {
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        return Boolean(requestedTab);
    });

    useRealtime(userId, (event) => {
        if (event.type === 'state.changed') void refreshLiveState();
    });


    useEffect(() => {
        bootstrap();
        const requestedTab = new URLSearchParams(window.location.search).get('tab');
        if (requestedTab && ['training', 'bounce', 'symbolrush', 'bomb', 'cups', 'duelnumeric', 'defy', 'tournament', 'leaderboard', 'stats', 'challenges'].includes(requestedTab)) {
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

    useEffect(() => {
        document.documentElement.dataset.arena = progression?.cosmetics.arena || 'foundry';
        document.documentElement.dataset.trail = progression?.cosmetics.trail || 'pulse';
    }, [progression?.cosmetics.arena, progression?.cosmetics.trail]);

    useEffect(() => {
        if (!arenaOpen) return;
        const params = new URLSearchParams(window.location.search);
        params.set('tab', activeTab);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [activeTab, arenaOpen]);

    useEffect(() => {
        const restoreRoute = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            setLinkChallenge(params.get('link'));
            const valid = Boolean(tab && ['training','defy','tournament','leaderboard','stats','challenges'].includes(tab));
            if (valid) setActiveTab(tab as Tab);
            setArenaOpen(valid);
        };
        window.addEventListener('popstate', restoreRoute);
        return () => window.removeEventListener('popstate', restoreRoute);
    }, [setActiveTab]);

    function enterArena(tab: Tab) {
        const params = new URLSearchParams(window.location.search);
        params.delete('link');
        params.set('tab', tab);
        const next = `${window.location.pathname}?${params.toString()}`;
        if (`${window.location.pathname}${window.location.search}` !== next) window.history.pushState({}, '', next);
        setLinkChallenge(null);
        setActiveTab(tab);
        setArenaOpen(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function leaveArena() {
        setArenaOpen(false);
        setLinkChallenge(null);
        const params = new URLSearchParams(window.location.search);
        params.delete('link');
        params.delete('game');
        params.delete('tab');
        params.delete('invite');
        params.delete('room');
        params.delete('token');
        const query = params.toString();
        const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
        if (`${window.location.pathname}${window.location.search}` !== next) window.history.pushState({}, '', next);
        window.scrollTo({top:0,behavior:'instant'});
    }

    const sectionLabels: Partial<Record<Tab, string>> = {
        training: isFr ? 'Jouer en solo' : 'Solo play',
        defy: isFr ? 'Avec un ami' : 'Friend Duel',
        tournament: isFr ? 'Tournoi' : 'Tournament',
        leaderboard: isFr ? 'Classement' : 'Leaderboard',
        stats: isFr ? 'Historique' : 'History',
        challenges: isFr ? 'Mes defis' : 'My challenges',
    };
    const activeGameName = sectionLabels[activeTab] || (isFr ? 'Entrainement' : 'Training');
    const modeStatus: Record<Tab, { label: string; tone: string }> = {
        training: { label: 'SOLO', tone: styles.statusSolo },
        defy: { label: '1V1', tone: styles.statusLive },
        tournament: { label: isFr ? 'COUPE' : 'CUP', tone: styles.statusTournament },
        leaderboard: { label: 'TOP', tone: styles.statusMeta },
        stats: { label: isFr ? 'BILAN' : 'LOG', tone: styles.statusMeta },
        challenges: {label:isFr?'DÉFI':'LINK',tone:styles.statusMeta},
    };

    return (
        <>
            <div className={styles.tapeBg} aria-hidden />

            <TopBar onHome={leaveArena} />

            <main className={`${styles.container} ${arenaOpen ? styles.arenaMode : styles.homeMode}`}>
                {linkChallenge ? <LinkChallenge id={linkChallenge}/> : !arenaOpen ? (
                    <ArenaHome onEnter={enterArena} />
                ) : (
                    <>
                        <div className={styles.matchHeader}>
                            <button type="button" onClick={leaveArena} aria-label={isFr ? 'Retour a l arene' : 'Back to arena'}>
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


                        <div key={activeTab} className={styles.panelArea}>
                            {activeTab === 'training' && <TrainingPanel />}
                            {activeTab === 'defy' && <FriendDuelPanel />}
                            {activeTab === 'tournament' && <TournamentPanel />}
                            {activeTab === 'leaderboard' && <LeaderboardPanel />}
                            {activeTab === 'stats' && <HistoryPanel />}
                            {activeTab === 'challenges' && <MyChallenges />}
                        </div>
                    </>
                )}

                {!linkChallenge && <Tabs home={!arenaOpen} onHome={leaveArena} onEnter={enterArena} />}
            </main>
        </>
    );
}

export default App;
