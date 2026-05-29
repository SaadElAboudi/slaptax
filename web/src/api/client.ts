// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
    status: string;
    players: number;
    timestamp: string;
}

export interface GameState {
    userId: string | null;
    playerName: string;
    wallet: number;
    stake: number;
    skillPool: string;
    apiBase: string;
}

export interface HistoryEntry {
    id?: string;
    timestamp?: string;
    date?: string;
    mode?: string;
    type?: string;
    stake?: number;
    won?: boolean;
    result?: string;
    net: number;
    rounds?: RoundResult[];
}

export interface HistoryResponse {
    history: HistoryEntry[];
}

export interface UserListEntry {
    id: string;
    playerName: string;
    wallet: number;
    stake: number;
    stats: {
        matches: number;
        wins: number;
        losses: number;
        winRate: number;
    };
}

export interface UsersResponse {
    activeUserId: string;
    users: UserListEntry[];
}

export interface RoundResult {
    gameId: string;
    won: boolean;
    playerMetricMs?: number;
    difficulty?: string;
}

export interface DuelResult {
    ok?: boolean;
    won?: boolean;
    net?: number;
    wallet: number;
    newWallet?: number;
    rounds?: RoundResult[];
    message?: string;
    duel?: {
        won: boolean;
        net: number;
        rounds?: RoundResult[];
    };
}

export interface TournamentRunRound {
    round: number;
    opponentLevel: number;
    won: boolean;
    scoreFor: number;
    scoreAgainst: number;
    gameId?: string;
    label?: string;
}

export interface TournamentResult {
    champion: boolean;
    rounds: number;
    run: TournamentRunRound[];
    net: number;
    payout: number;
    games?: string[];
    draftSummary?: string;
}

export interface TournamentResponse {
    ok: boolean;
    tournament: TournamentResult;
    wallet: number;
    activeUserId: string;
}

export interface P2PDuel {
    id: string;
    challengerId: string;
    opponentId: string;
    stake: number;
    status: 'pending' | 'done';
    createdAt: string;
    playedAt?: string;
    winnerId?: string;
    loserId?: string;
}

export interface Challenge {
    id: string;
    challengerId: string;
    opponentId: string;
    stake: number;
    status: 'pending' | 'accepted' | 'declined';
    message?: string;
    createdAt: string;
    challengerName?: string;
    opponentName?: string;
    direction?: 'incoming' | 'outgoing';
    duelId?: string;
}

export interface ChallengeListResponse {
    ok: boolean;
    challenges: Challenge[];
}

export interface CreateDuelResponse {
    ok: boolean;
    duel: P2PDuel;
    draftSummary?: string;
}

export interface CreateChallengeResponse {
    ok: boolean;
    challenge: Challenge;
    draftSummary?: string;
}

export interface AcceptChallengeResponse {
    ok: boolean;
    challenge: Challenge;
    duel: P2PDuel;
    draftSummary?: string;
}

export interface PlayP2PResponse {
    ok: boolean;
    duel: P2PDuel;
    winnerId: string;
    loserId: string;
    challengerWallet: number;
    opponentWallet: number;
    rounds?: Array<{
        round: number;
        gameId: string;
        label?: string;
        challengerMetric?: number;
        opponentMetric?: number;
        winner?: string;
    }>;
    games?: string[];
    draftSummary?: string;
}

export interface RivalryResponse {
    ok: boolean;
    exists: boolean;
    wins?: Record<string, number>;
}

export interface LeaderboardEntry {
    id: string;
    playerName: string;
    wins: number;
    losses: number;
    winRate: number;
    matches: number;
    totalNet: number;
    wallet: number;
    skillPool: string;
    stakeCap: number;
}

export interface ApiStats {
    totalDuels: number;
    totalWins: number;
    totalLosses: number;
    topPlayers: LeaderboardEntry[];
}

export interface LeaderboardResponse {
    ok: boolean;
    leaderboard: LeaderboardEntry[];
}

export interface AnalyticsKpi {
    totalPlayedDuels: number;
    rematchRate: number;
    duelsPerActiveUser: number;
    losersReplayRate24h: number;
    targets: {
        rematchRate: number;
        duelsPerActiveUser: number;
        losersReplayRate24h: number;
    };
}

export interface AnalyticsResponse {
    ok: boolean;
    kpi: AnalyticsKpi;
}

// ─── Client ───────────────────────────────────────────────────────────────────

const DEFAULT_BASE = 'http://localhost:8787';

function getBase(): string {
    try {
        return localStorage.getItem('slaptax_api_base') || DEFAULT_BASE;
    } catch {
        return DEFAULT_BASE;
    }
}

async function req<T>(
    method: string,
    path: string,
    body?: unknown,
    base?: string
): Promise<T> {
    const apiBase = base ?? getBase();
    const res = await fetch(`${apiBase}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

export const api = {
    health: (base?: string) => req<HealthResponse>('GET', '/api/health', undefined, base),

    getState: (userId?: string | null) => {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return req<GameState>('GET', `/api/state${qs}`);
    },

    getHistory: () => req<HistoryResponse>('GET', '/api/history'),

    getStats: () => req<ApiStats>('GET', '/api/stats'),

    getLeaderboard: () => req<LeaderboardResponse>('GET', '/api/leaderboard'),

    getAnalyticsKpi: () => req<AnalyticsResponse>('GET', '/api/analytics/kpi'),

    simulateTournament: (size: number, stake: number, draft?: unknown) =>
        req<TournamentResponse>('POST', '/api/tournament/simulate', { size, stake, draft }),

    createUser: (playerName: string) =>
        req<GameState & { userId: string }>('POST', '/api/users', { playerName }),

    selectUser: (userId: string) =>
        req<GameState>('POST', '/api/session/select-user', { userId }),

    setProfile: (playerName: string) =>
        req<GameState>('POST', '/api/profile', { playerName }),

    setStake: (stake: number, userId?: string | null) =>
        req<GameState>('POST', '/api/stake', { stake, userId }),

    playDuel: (stake: number) =>
        req<DuelResult>('POST', '/api/duel/play', { stake }),

    resolveReflex: (
        stake: number,
        won: boolean,
        rounds: RoundResult[],
        userId?: string | null
    ) => req<DuelResult>('POST', '/api/duel/reflex', { stake, won, rounds, userId }),

    listUsers: () => req<UsersResponse>('GET', '/api/users'),

    createDuel: (challengerId: string, opponentId: string, stake: number, draft?: unknown) =>
        req<CreateDuelResponse>('POST', '/api/duels', { challengerId, opponentId, stake, draft }),

    playP2PDuel: (duelId: string) =>
        req<PlayP2PResponse>('POST', `/api/duels/${encodeURIComponent(duelId)}/play`),

    rematchP2P: (duelId: string) =>
        req<CreateDuelResponse>('POST', `/api/duels/${encodeURIComponent(duelId)}/rematch`),

    createChallenge: (challengerId: string, opponentId: string, stake: number, draftOrMessage?: unknown, message?: string) =>
        req<CreateChallengeResponse>('POST', '/api/challenges', {
            challengerId,
            opponentId,
            stake,
            draft: message === undefined ? undefined : draftOrMessage,
            message: message === undefined ? draftOrMessage : message,
        }),

    listChallenges: (userId: string, status = 'pending') =>
        req<ChallengeListResponse>('GET', `/api/challenges?userId=${encodeURIComponent(userId)}&status=${encodeURIComponent(status)}`),

    acceptChallenge: (challengeId: string, userId: string) =>
        req<AcceptChallengeResponse>('POST', `/api/challenges/${encodeURIComponent(challengeId)}/accept`, { userId }),

    declineChallenge: (challengeId: string, userId: string) =>
        req<{ ok: boolean; challenge: Challenge }>('POST', `/api/challenges/${encodeURIComponent(challengeId)}/decline`, { userId }),

    getRivalry: (userAId: string, userBId: string) =>
        req<RivalryResponse>('GET', `/api/rivalries/${encodeURIComponent(userAId)}/vs/${encodeURIComponent(userBId)}`),
};
