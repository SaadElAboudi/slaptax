import { create } from 'zustand';
import { api, type AnalyticsKpi, type HistoryEntry, type LeaderboardEntry, type RoundResult } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tab = 'quickdraw' | 'parry' | 'mindgame' | 'speedsort' | 'duelnumeric' | 'defy' | 'tournament' | 'leaderboard' | 'analytics' | 'stats';
export type QuickMode = 'duel' | 'defy' | 'tournament';
export type SkillPool = 'Rookie' | 'Contender' | 'Elite' | 'Legend';
export type Language = 'en' | 'fr';
export type DifficultyMode = 'casual' | 'standard' | 'hardcore';

interface GameStore {
    // Server
    apiBase: string;
    apiOnline: boolean;
    setApiBase: (base: string) => void;
    checkHealth: () => Promise<void>;
    loadState: () => Promise<void>;

    // Player
    userId: string | null;
    clientId: string;
    playerName: string;
    wallet: number;
    stake: number;
    skillPool: SkillPool;
    setProfile: (name: string) => void;
    joinSession: (name?: string) => Promise<void>;
    setUserId: (id: string | null) => void;
    setWallet: (amount: number) => void;
    setStake: (amount: number) => Promise<void>;

    // Navigation
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
    quickMode: QuickMode;
    setQuickMode: (mode: QuickMode) => void;

    // Difficulty
    difficultyMode: DifficultyMode;
    setDifficultyMode: (mode: DifficultyMode) => void;
    cycleDifficultyMode: () => void;

    // Mobile UX
    mobileAdvancedOpen: boolean;
    setMobileAdvancedOpen: (open: boolean) => void;
    toggleMobileAdvanced: () => void;

    // History
    history: HistoryEntry[];
    loadHistory: () => Promise<void>;

    // Live panels
    leaderboard: LeaderboardEntry[];
    analyticsKpi: AnalyticsKpi | null;
    loadLeaderboard: () => Promise<void>;
    loadAnalytics: () => Promise<void>;
    loadDashboardData: () => Promise<void>;
    refreshLiveState: () => Promise<void>;

    // Duel
    isDueling: boolean;
    lastRounds: RoundResult[];
    lastNet: number | null;
    startDuel: () => void;
    cancelDuel: () => void;
    resolveDuel: (won: boolean, rounds: RoundResult[]) => Promise<void>;

    // Bootstrap
    bootstrap: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
    // Server
    apiBase: (() => { try { return localStorage.getItem('slaptax_api_base') || 'http://localhost:8787'; } catch { return 'http://localhost:8787'; } })(),
    apiOnline: false,
    setApiBase: (base) => {
        try { localStorage.setItem('slaptax_api_base', base); } catch { /* ignore */ }
        set({ apiBase: base });
    },
    checkHealth: async () => {
        try {
            await api.health(get().apiBase);
            set({ apiOnline: true });
        } catch {
            set({ apiOnline: false });
        }
    },
    loadState: async () => {
        try {
            const state = await api.getState(get().userId, get().clientId);
            set({
                wallet: state.wallet,
                stake: state.stake,
                playerName: state.playerName || get().playerName,
                skillPool: (state.skillPool as SkillPool) || 'Rookie',
            });
        } catch {
            /* API offline, keep local */
        }
    },

    // Player
    userId: (() => { try { return localStorage.getItem('slaptax_user_id'); } catch { return null; } })(),
    clientId: (() => {
        try {
            const existing = localStorage.getItem('slaptax_client_id');
            if (existing) return existing;
            const created = crypto.randomUUID();
            localStorage.setItem('slaptax_client_id', created);
            return created;
        } catch {
            return `client-${Math.random().toString(36).slice(2)}`;
        }
    })(),
    playerName: (() => { try { return localStorage.getItem('slaptax_player_name') || 'Player'; } catch { return 'Player'; } })(),
    wallet: 25,
    stake: 5,
    skillPool: 'Rookie',
    setProfile: (name) => {
        try { localStorage.setItem('slaptax_player_name', name); } catch { /* ignore */ }
        set({ playerName: name });
        // Changing name means joining as a distinct online identity.
        void get().joinSession(name);
    },
    joinSession: async (name) => {
        const playerName = String(name || get().playerName || 'Player').trim();
        if (!playerName) return;
        try {
            const joined = await api.joinSession(playerName, get().clientId);
            set({ userId: joined.userId, playerName: playerName });
            try {
                localStorage.setItem('slaptax_user_id', joined.userId);
                localStorage.setItem('slaptax_player_name', playerName);
            } catch { /* ignore */ }
        } catch {
            /* offline or API issue */
        }
    },
    setUserId: (id) => {
        try {
            if (id) localStorage.setItem('slaptax_user_id', id);
            else localStorage.removeItem('slaptax_user_id');
        } catch { /* ignore */ }
        set({ userId: id });
    },
    setWallet: (amount) => set({ wallet: amount }),
    setStake: async (amount) => {
        set({ stake: amount });
        try {
            const state = await api.setStake(amount, get().userId);
            set({ wallet: state.wallet });
        } catch { /* offline — keep local */ }
    },

    // Navigation
    activeTab: 'quickdraw',
    setActiveTab: (tab) => {
        const state = get();
        const leavingActiveDuel = state.activeTab !== tab && state.isDueling;

        if (!leavingActiveDuel) {
            set({ activeTab: tab });
            return;
        }

        // Leaving an active stake duel counts as forfeit.
        set({ activeTab: tab, isDueling: false });

        void (async () => {
            const lockedStake = Number(state.stake ?? 0);
            try {
                const result = await api.resolveReflex(lockedStake, false, [], state.userId);
                const net = Number(result.net ?? result.duel?.net ?? -Math.abs(lockedStake));
                const wallet = Number(result.newWallet ?? result.wallet ?? Math.max(0, get().wallet + net));
                set({ lastRounds: [], lastNet: net, wallet });
                await get().loadDashboardData();
            } catch {
                const net = -Math.abs(lockedStake);
                set({ lastRounds: [], lastNet: net, wallet: Math.max(0, get().wallet + net) });
            }
        })();
    },
    language: (() => {
        try {
            const lang = localStorage.getItem('slaptax_lang');
            return lang === 'fr' ? 'fr' : 'en';
        } catch {
            return 'en';
        }
    })(),
    setLanguage: (language) => {
        try { localStorage.setItem('slaptax_lang', language); } catch { /* ignore */ }
        set({ language });
    },
    toggleLanguage: () =>
        set((s) => {
            const next = s.language === 'en' ? 'fr' : 'en';
            try { localStorage.setItem('slaptax_lang', next); } catch { /* ignore */ }
            return { language: next };
        }),
    quickMode: 'duel',
    setQuickMode: (mode) => set({ quickMode: mode }),

    difficultyMode: (() => {
        try {
            const value = localStorage.getItem('slaptax_difficulty_mode');
            return value === 'casual' || value === 'hardcore' ? value : 'standard';
        } catch {
            return 'standard';
        }
    })(),
    setDifficultyMode: (mode) => {
        try { localStorage.setItem('slaptax_difficulty_mode', mode); } catch { /* ignore */ }
        set({ difficultyMode: mode });
    },
    cycleDifficultyMode: () =>
        set((s) => {
            const next = s.difficultyMode === 'casual' ? 'standard' : s.difficultyMode === 'standard' ? 'hardcore' : 'casual';
            try { localStorage.setItem('slaptax_difficulty_mode', next); } catch { /* ignore */ }
            return { difficultyMode: next };
        }),

    // Mobile
    mobileAdvancedOpen: false,
    setMobileAdvancedOpen: (open) => set({ mobileAdvancedOpen: open }),
    toggleMobileAdvanced: () =>
        set((s) => ({ mobileAdvancedOpen: !s.mobileAdvancedOpen })),

    // History
    history: [],
    loadHistory: async () => {
        try {
            const data = await api.getHistory(get().userId, get().clientId);
            set({ history: Array.isArray(data.history) ? data.history : [] });
        } catch { /* offline */ }
    },

    leaderboard: [],
    analyticsKpi: null,
    loadLeaderboard: async () => {
        try {
            const data = await api.getLeaderboard();
            set({ leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [] });
        } catch { /* offline */ }
    },
    loadAnalytics: async () => {
        try {
            const data = await api.getAnalyticsKpi();
            set({ analyticsKpi: data.kpi ?? null });
        } catch { /* offline */ }
    },
    loadDashboardData: async () => {
        await Promise.all([get().loadHistory(), get().loadLeaderboard(), get().loadAnalytics()]);
    },
    refreshLiveState: async () => {
        await Promise.all([get().checkHealth(), get().loadState(), get().loadDashboardData()]);
    },

    // Duel
    isDueling: false,
    lastRounds: [],
    lastNet: null,
    startDuel: () => set({ isDueling: true }),
    cancelDuel: () => set({ isDueling: false }),
    resolveDuel: async (won, rounds) => {
        const { stake, userId } = get();
        try {
            const result = await api.resolveReflex(stake, won, rounds, userId);
            const net = Number(result.net ?? result.duel?.net ?? (won ? stake : -stake));
            const wallet = Number(result.newWallet ?? result.wallet ?? Math.max(0, get().wallet + net));
            set({
                isDueling: false,
                lastRounds: rounds,
                lastNet: net,
                wallet,
            });
            await get().loadDashboardData();
        } catch {
            const net = won ? stake : -stake;
            set({
                isDueling: false,
                lastRounds: rounds,
                lastNet: net,
                wallet: Math.max(0, get().wallet + net),
            });
        }
    },

    // Bootstrap
    bootstrap: async () => {
        await get().joinSession();
        await get().refreshLiveState();
    },
}));
