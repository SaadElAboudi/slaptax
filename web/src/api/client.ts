import type { CompetitiveGameId } from '../gameplay/catalog';

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
    progression?: PlayerProgression;
}

export interface PlayerProgression {
    xp: number;
    level: number;
    rankedPoints: number;
    rank: string;
    winStreak: number;
    bestStreak: number;
    badges: string[];
    mastery: Record<string, { xp: number; wins: number; plays: number }>;
    daily: {
        dayKey: string;
        claimed: boolean;
        tasks: Array<{ id: string; label: string; target: number; progress: number; rewardXp: number }>;
    };
    season: { id: string; points: number };
    cosmetics: {
        avatar: string;
        arena: string;
        trail: string;
        unlocked: {
            avatars: string[];
            arenas: string[];
            trails: string[];
        };
    };
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
    opponentId?: string;
    opponentName?: string;
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
    online?: boolean;
    lastSeenAt?: string | null;
    rank?: string;
}

export interface UsersResponse {
    activeUserId: string;
    users: UserListEntry[];
}

export interface JoinSessionResponse {
    ok: boolean;
    userId: string;
    clientId: string;
    activeUserId: string;
    user: UserListEntry;
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
    opponentId?: string;
    opponentName?: string;
}

export interface TournamentBracketMatch {
    round: number;
    match: number;
    gameId: string;
    label: string;
    playerA: { id: string; name: string; bot: boolean };
    playerB: { id: string; name: string; bot: boolean };
    scoreA: number;
    scoreB: number;
    winnerId: string;
    winnerName: string;
}

export interface TournamentBracketRound {
    round: number;
    gameId: string;
    label: string;
    matches: TournamentBracketMatch[];
}

export interface TournamentResult {
    champion: boolean;
    rounds: number;
    run: TournamentRunRound[];
    net: number;
    payout: number;
    championId?: string;
    championName?: string;
    entrants?: Array<{ id: string; name: string; bot: boolean }>;
    bracket?: TournamentBracketRound[];
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
    status: 'pending' | 'playing' | 'done';
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
    status: 'open' | 'pending' | 'accepted' | 'declined';
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

export interface DuelRoomState {
    duelId: string;
    seriesId: string;
    status: 'pending' | 'playing' | 'done';
    challengerId: string;
    opponentId: string;
    readyBy: Record<string, boolean>;
    readyCountdownAt: string | null;
    games: string[];
    currentRound: number;
    score: { challenger: number; opponent: number };
    createdAt: string;
}

export interface LiveDuelRound {
    round: number;
    gameId: CompetitiveGameId;
    challengerScore: number;
    opponentScore: number;
    challengerMetric: number;
    opponentMetric: number;
    winnerId: string;
}

export interface LiveDuelMatch {
    duelId: string;
    status: 'pending' | 'playing' | 'done';
    challengerId: string;
    opponentId: string;
    opponentName: string;
    stake: number;
    games: CompetitiveGameId[];
    currentRound: number;
    score: { challenger: number; opponent: number };
    rounds: LiveDuelRound[];
    winnerId: string | null;
    loserId: string | null;
    rematchId: string | null;
    rematch: {
        status: 'pending' | 'accepted' | 'declined';
        requestedBy: string;
        requestedAt: string;
        respondedAt: string | null;
    } | null;
    attemptToken: string | null;
    roundStartedAt: string | null;
    submittedBy: Record<string, string[]>;
    reactions: Array<{ userId: string; reaction: string; at: string }>;
}

export interface LiveTournament {
    id: string;
    userId: string;
    size: number;
    stake: number;
    status: 'playing' | 'done';
    games: CompetitiveGameId[];
    currentRound: number;
    roundsTotal: number;
    rounds: Array<{
        round: number;
        gameId: CompetitiveGameId;
        label: string;
        opponentName: string;
        scoreFor: number;
        scoreAgainst: number;
        metric: number;
        won: boolean;
    }>;
    champion?: boolean;
    abandoned?: boolean;
    payout?: number;
    net?: number;
    attemptToken: string;
    roundStartedAt: string;
}

export interface LiveTournamentResponse {
    ok: boolean;
    tournament: LiveTournament | null;
    wallet?: number;
}

export interface MultiplayerTournamentMatch {
    id: string;
    duelId: string;
    playerAId: string;
    playerBId: string;
    playerAName: string;
    playerBName: string;
    winnerId: string | null;
    winnerName: string | null;
    status: 'pending' | 'done';
    deadlineAt: string;
}

export interface MultiplayerTournament {
    id: string;
    kind: 'multiplayer';
    name: string;
    hostId: string;
    size: 4 | 8 | 16;
    visibility: 'public' | 'private';
    status: 'waiting' | 'playing' | 'done';
    entrants: Array<{ id: string; name: string; online: boolean; bot: boolean }>;
    bracket: Array<{ round: number; matches: MultiplayerTournamentMatch[] }>;
    currentRound: number;
    championId: string | null;
}

export interface MultiplayerTournamentResponse {
    ok: boolean;
    tournament: MultiplayerTournament;
    activeDuelId?: string | null;
    spectatorMatch?: {
        duelId: string;
        challengerId: string;
        opponentName: string;
        games: CompetitiveGameId[];
        currentRound: number;
        status: 'playing';
    } | null;
}

export interface OpenInvite {
    id: string;
    status: 'open' | 'accepted';
    challengerId: string;
    challengerName: string;
    stake: number;
    message: string;
    duelId: string | null;
}

export interface DuelRoomResponse {
    ok: boolean;
    room: DuelRoomState;
    bothReady?: boolean;
    serverClock?: string;
}

export interface RivalryResponse {
    ok: boolean;
    exists: boolean;
    users?: Array<string | { id: string; playerName: string }>;
    wins: Record<string, number>;
    last5: Array<{ winnerId: string; date: string }>;
}

export interface RematchResponse {
    ok: boolean;
    status: 'pending' | 'accepted' | 'declined';
    duel?: P2PDuel | null;
    match?: LiveDuelMatch;
    rematch?: LiveDuelMatch['rematch'];
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
    quickPlayUsers: number;
    matchmakingMatchedUsers: number;
    matchmakingConversion: number;
    viralActionUsers: number;
    targets: {
        rematchRate: number;
        duelsPerActiveUser: number;
        losersReplayRate24h: number;
        matchmakingConversion: number;
    };
}

export interface AnalyticsResponse {
    ok: boolean;
    kpi: AnalyticsKpi;
}

// ─── Client ───────────────────────────────────────────────────────────────────

const DEFAULT_BASE = '';

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
        let detail = text;
        try {
            const parsed = JSON.parse(text) as { error?: string; message?: string };
            detail = parsed.error || parsed.message || text;
        } catch {
            // Keep the plain-text response when the API did not return JSON.
        }
        throw new Error(detail || `Request failed (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export const api = {
    health: (base?: string) => req<HealthResponse>('GET', '/api/health', undefined, base),

    getState: (userId?: string | null, clientId?: string | null) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (clientId) params.set('clientId', clientId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return req<GameState>('GET', `/api/state${qs}`);
    },

    getHistory: (userId?: string | null, clientId?: string | null) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (clientId) params.set('clientId', clientId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return req<HistoryResponse>('GET', `/api/history${qs}`);
    },

    getStats: (userId?: string | null, clientId?: string | null) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (clientId) params.set('clientId', clientId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return req<ApiStats>('GET', `/api/stats${qs}`);
    },

    getLeaderboard: () => req<LeaderboardResponse>('GET', '/api/leaderboard'),

    getAnalyticsKpi: () => req<AnalyticsResponse>('GET', '/api/analytics/kpi'),

    simulateTournament: (size: number, stake: number, draft?: unknown) =>
        req<TournamentResponse>('POST', '/api/tournament/simulate', { size, stake, draft }),

    createUser: (playerName: string) =>
        req<GameState & { userId: string }>('POST', '/api/users', { playerName }),

    joinSession: (playerName: string, clientId: string) =>
        req<JoinSessionResponse>('POST', '/api/session/join', { playerName, clientId }),

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

    listUsers: (userId?: string | null, clientId?: string | null) => {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (clientId) params.set('clientId', clientId);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return req<UsersResponse>('GET', `/api/users${qs}`);
    },

    createDuel: (challengerId: string, opponentId: string, stake: number, draft?: unknown) =>
        req<CreateDuelResponse>('POST', '/api/duels', { challengerId, opponentId, stake, draft }),

    joinMatchmaking: (userId: string, stake: number) =>
        req<{ ok: boolean; status: 'waiting' | 'matched'; duel?: P2PDuel }>('POST', '/api/matchmaking/join', { userId, stake }),

    getMatchmakingStatus: (userId: string) =>
        req<{ ok: boolean; status: 'idle' | 'waiting' | 'matched'; joinedAt?: string | null; duel?: P2PDuel }>(
            'GET',
            `/api/matchmaking/status?userId=${encodeURIComponent(userId)}`
        ),

    cancelMatchmaking: (userId: string) =>
        req<{ ok: boolean }>('POST', '/api/matchmaking/cancel', { userId }),

    playP2PDuel: (duelId: string) =>
        req<PlayP2PResponse>('POST', `/api/duels/${encodeURIComponent(duelId)}/play`),

    getDuelRoom: (duelId: string, userId: string) =>
        req<DuelRoomResponse>('GET', `/api/duels/${encodeURIComponent(duelId)}/room?userId=${encodeURIComponent(userId)}`),

    setDuelReady: (duelId: string, userId: string, ready: boolean) =>
        req<DuelRoomResponse>('POST', `/api/duels/${encodeURIComponent(duelId)}/ready`, { userId, ready }),

    startLiveDuel: (duelId: string, userId: string) =>
        req<{ ok: boolean; match: LiveDuelMatch }>('POST', `/api/duels/${encodeURIComponent(duelId)}/start`, { userId }),

    getLiveDuel: (duelId: string, userId: string) =>
        req<{ ok: boolean; match: LiveDuelMatch }>('GET', `/api/duels/${encodeURIComponent(duelId)}/match?userId=${encodeURIComponent(userId)}`),

    getActiveLiveDuel: (userId: string) =>
        req<{ ok: boolean; match: LiveDuelMatch | null }>('GET', `/api/duels/active?userId=${encodeURIComponent(userId)}`),

    submitLiveDuelRound: (duelId: string, userId: string, round: number, score: number, metric: number, attemptToken: string) =>
        req<{ ok: boolean; match: LiveDuelMatch }>('POST', `/api/duels/${encodeURIComponent(duelId)}/rounds`, {
            userId,
            round,
            score,
            metric,
            attemptToken,
        }),

    respondToRematch: (duelId: string, userId: string, action: 'request' | 'accept' | 'decline') =>
        req<RematchResponse>('POST', `/api/duels/${encodeURIComponent(duelId)}/rematch`, { userId, action }),

    reactToDuel: (duelId: string, userId: string, reaction: string) =>
        req<{ ok: boolean; reactions: LiveDuelMatch['reactions'] }>('POST', `/api/duels/${encodeURIComponent(duelId)}/reactions`, {
            userId,
            reaction,
        }),

    createChallenge: (challengerId: string, opponentId: string, stake: number, draftOrMessage?: unknown, message?: string, bestOf = 3) =>
        req<CreateChallengeResponse>('POST', '/api/challenges', {
            challengerId,
            opponentId,
            stake,
            draft: message === undefined ? undefined : draftOrMessage,
            message: message === undefined ? draftOrMessage : message,
            bestOf,
        }),

    createOpenInvite: (challengerId: string, stake: number, draft: unknown, message?: string, bestOf = 3) =>
        req<{ ok: boolean; challenge: Challenge }>('POST', '/api/invites', {
            challengerId,
            stake,
            draft,
            message,
            bestOf,
        }),

    getOpenInvite: (inviteId: string) =>
        req<{ ok: boolean; invite: OpenInvite }>('GET', `/api/invites/${encodeURIComponent(inviteId)}`),

    claimOpenInvite: (inviteId: string, userId: string) =>
        req<AcceptChallengeResponse>('POST', `/api/invites/${encodeURIComponent(inviteId)}/claim`, { userId }),

    listChallenges: (userId: string, status = 'pending') =>
        req<ChallengeListResponse>('GET', `/api/challenges?userId=${encodeURIComponent(userId)}&status=${encodeURIComponent(status)}`),

    acceptChallenge: (challengeId: string, userId: string) =>
        req<AcceptChallengeResponse>('POST', `/api/challenges/${encodeURIComponent(challengeId)}/accept`, { userId }),

    declineChallenge: (challengeId: string, userId: string) =>
        req<{ ok: boolean; challenge: Challenge }>('POST', `/api/challenges/${encodeURIComponent(challengeId)}/decline`, { userId }),

    getRivalry: (userAId: string, userBId: string) =>
        req<RivalryResponse>('GET', `/api/rivalries/${encodeURIComponent(userAId)}/vs/${encodeURIComponent(userBId)}`),

    trackProductEvent: (type: 'quick_play_clicked' | 'invite_link_copied' | 'result_shared', userId: string, properties?: Record<string, unknown>) =>
        req<{ ok: boolean }>('POST', '/api/analytics/events', { type, userId, properties }),

    createLiveTournament: (size: number, stake: number, draft: unknown, userId: string) =>
        req<LiveTournamentResponse>('POST', '/api/tournaments/live', { size, stake, draft, userId }),

    getLiveTournament: (tournamentId: string, userId: string) =>
        req<LiveTournamentResponse>('GET', `/api/tournaments/${encodeURIComponent(tournamentId)}?userId=${encodeURIComponent(userId)}`),

    getActiveLiveTournament: (userId: string) =>
        req<LiveTournamentResponse>('GET', `/api/tournaments/active?userId=${encodeURIComponent(userId)}`),

    submitLiveTournamentRound: (tournamentId: string, userId: string, score: number, metric: number, attemptToken: string) =>
        req<LiveTournamentResponse>('POST', `/api/tournaments/${encodeURIComponent(tournamentId)}/rounds`, {
            userId,
            score,
            metric,
            attemptToken,
        }),

    abandonLiveTournament: (tournamentId: string, userId: string) =>
        req<LiveTournamentResponse>('POST', `/api/tournaments/${encodeURIComponent(tournamentId)}/abandon`, { userId }),

    listMultiplayerTournaments: (userId: string) =>
        req<{ ok: boolean; tournaments: MultiplayerTournament[] }>('GET', `/api/arena-tournaments?userId=${encodeURIComponent(userId)}`),

    createMultiplayerTournament: (hostId: string, size: number, visibility: 'public' | 'private', name: string) =>
        req<MultiplayerTournamentResponse>('POST', '/api/arena-tournaments', { hostId, size, visibility, name }),

    getMultiplayerTournament: (tournamentId: string, userId: string) =>
        req<MultiplayerTournamentResponse>('GET', `/api/arena-tournaments/${encodeURIComponent(tournamentId)}?userId=${encodeURIComponent(userId)}`),

    joinMultiplayerTournament: (tournamentId: string, userId: string) =>
        req<MultiplayerTournamentResponse>('POST', `/api/arena-tournaments/${encodeURIComponent(tournamentId)}/join`, { userId }),

    startMultiplayerTournament: (tournamentId: string, userId: string) =>
        req<MultiplayerTournamentResponse>('POST', `/api/arena-tournaments/${encodeURIComponent(tournamentId)}/start`, { userId }),

    setCosmetics: (userId: string, cosmetics: Partial<PlayerProgression['cosmetics']>) =>
        req<{ ok: boolean; cosmetics: PlayerProgression['cosmetics'] }>('POST', '/api/progression/cosmetics', {
            userId,
            cosmetics,
        }),
};
