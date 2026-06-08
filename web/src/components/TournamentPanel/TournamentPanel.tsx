import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    api,
    type DuelRoomState,
    type LiveDuelMatch,
    type MultiplayerTournament,
    type MultiplayerTournamentResponse,
} from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { COMPETITIVE_GAMES, gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './TournamentPanel.module.css';

const SIZES = [4, 8, 16] as const;

export function TournamentPanel() {
    const userId = useGameStore((state) => state.userId);
    const language = useGameStore((state) => state.language);
    const refreshLiveState = useGameStore((state) => state.refreshLiveState);
    const isFr = language === 'fr';
    const [size, setSize] = useState<4 | 8 | 16>(4);
    const [visibility, setVisibility] = useState<'public' | 'private'>('private');
    const [name, setName] = useState('Arena Cup');
    const [tournaments, setTournaments] = useState<MultiplayerTournament[]>([]);
    const [tournament, setTournament] = useState<MultiplayerTournament | null>(null);
    const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
    const [match, setMatch] = useState<LiveDuelMatch | null>(null);
    const [room, setRoom] = useState<DuelRoomState | null>(null);
    const [spectatorMatch, setSpectatorMatch] = useState<MultiplayerTournamentResponse['spectatorMatch']>(null);
    const [spectating, setSpectating] = useState(false);
    const [roomReady, setRoomReady] = useState(false);
    const [selectedGames, setSelectedGames] = useState<CompetitiveGameId[]>(['bounce', 'symbolrush', 'bombpass']);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);

    useRealtime(userId, (event) => {
        if (event.type === 'state.changed' || event.type === 'presence.changed' || event.type === 'connected') {
            setTick((value) => value + 1);
        }
    });

    const loadList = useCallback(async () => {
        if (!userId) return;
        const data = await api.listMultiplayerTournaments(userId);
        setTournaments(data.tournaments);
        const active = data.tournaments.find(
            (entry) => entry.entrants.some((entrant) => entrant.id === userId) && entry.status !== 'done'
        );
        if (active && !tournament) setTournament(active);
    }, [tournament, userId]);

    const loadTournament = useCallback(async () => {
        if (!userId || !tournament) return;
        const params = new URLSearchParams(window.location.search);
        const data = await api.getMultiplayerTournament(tournament.id, userId, params.get('token') || undefined);
        setTournament(data.tournament);
        setRoomReady(Boolean(data.tournament.readyBy?.[userId]));
        setSelectedGames(data.tournament.games || ['bounce', 'symbolrush', 'bombpass']);
        setActiveDuelId(data.activeDuelId || null);
        setSpectatorMatch(data.spectatorMatch || null);
    }, [tournament?.id, userId]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('room');
        const token = params.get('token') || undefined;
        if (!roomId || !userId || tournament?.id === roomId) return;
        void api.getMultiplayerTournament(roomId, userId, token)
            .then(async (data) => {
                const joined = data.tournament.entrants.some((entrant) => entrant.id === userId);
                if (!joined && data.tournament.status === 'waiting') {
                    await api.joinMultiplayerTournament(roomId, userId, token);
                }
                const refreshed = await api.getMultiplayerTournament(roomId, userId, token);
                setTournament(refreshed.tournament);
            })
            .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Private room unavailable'));
    }, [userId, tournament?.id]);

    useEffect(() => {
        void loadList().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Tournament lobby unavailable'));
    }, [loadList, tick]);

    useEffect(() => {
        void loadTournament().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Bracket unavailable'));
    }, [loadTournament, tick]);

    useEffect(() => {
        if (!tournament) return;
        const params = new URLSearchParams(window.location.search);
        params.set('tab', 'tournament');
        params.set('room', tournament.id);
        if (tournament.inviteToken) params.set('token', tournament.inviteToken);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }, [tournament?.id, tournament?.inviteToken]);

    useEffect(() => {
        if (!activeDuelId || !userId) {
            setMatch(null);
            setRoom(null);
            return;
        }
        void api.getLiveDuel(activeDuelId, userId)
            .then(async (data) => {
                setMatch(data.match);
                if (data.match.status === 'pending') {
                    setRoom((await api.getDuelRoom(activeDuelId, userId)).room);
                }
            })
            .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Match unavailable'));
    }, [activeDuelId, tick, userId]);

    async function createTournament() {
        if (!userId) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.createMultiplayerTournament(userId, size, visibility, name);
            const room = await api.getMultiplayerTournament(data.tournament.id, userId);
            setTournament(room.tournament);
            setSelectedGames(room.tournament.games);
            await loadList();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Creation failed');
        } finally {
            setBusy(false);
        }
    }

    async function joinTournament(entry: MultiplayerTournament) {
        if (!userId) return;
        setBusy(true);
        try {
            await api.joinMultiplayerTournament(entry.id, userId, entry.inviteToken);
            const data = await api.getMultiplayerTournament(entry.id, userId);
            setTournament(data.tournament);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to join');
        } finally {
            setBusy(false);
        }
    }

    async function toggleRoomReady() {
        if (!userId || !tournament) return;
        setBusy(true);
        try {
            const next = !roomReady;
            await api.setMultiplayerTournamentReady(tournament.id, userId, next);
            setRoomReady(next);
            await loadTournament();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Ready state unavailable');
        } finally {
            setBusy(false);
        }
    }

    async function toggleGame(gameId: CompetitiveGameId) {
        if (!userId || !tournament || tournament.hostId !== userId) return;
        if (selectedGames.includes(gameId)) return;
        const next = [...selectedGames, gameId].slice(-3);
        setSelectedGames(next);
        try {
            await api.configureMultiplayerTournament(tournament.id, userId, next);
            await loadTournament();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Rotation unavailable');
        }
    }

    async function copyRoomLink() {
        if (!tournament?.inviteToken) return;
        const link = `${window.location.origin}${window.location.pathname}?tab=tournament&room=${encodeURIComponent(tournament.id)}&token=${encodeURIComponent(tournament.inviteToken)}`;
        try {
            await navigator.clipboard.writeText(link);
            setInviteCopied(true);
        } catch {
            setInviteCopied(false);
        }
    }

    function leaveRoom() {
        setTournament(null);
        setActiveDuelId(null);
        setMatch(null);
        setRoom(null);
        const params = new URLSearchParams(window.location.search);
        params.delete('room');
        params.delete('token');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }

    async function startTournament() {
        if (!userId || !tournament) return;
        setBusy(true);
        try {
            await api.startMultiplayerTournament(tournament.id, userId);
            await loadTournament();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to start');
        } finally {
            setBusy(false);
        }
    }

    async function toggleReady() {
        if (!activeDuelId || !userId) return;
        setBusy(true);
        try {
            const data = await api.setDuelReady(activeDuelId, userId, !room?.readyBy[userId]);
            setRoom(data.room);
            const bothReady = data.room.readyBy[data.room.challengerId] && data.room.readyBy[data.room.opponentId];
            if (bothReady) {
                const started = await api.startLiveDuel(activeDuelId, userId);
                setMatch(started.match);
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Ready failed');
        } finally {
            setBusy(false);
        }
    }

    async function completeRound(result: { score: number; metric: number; authoritative?: boolean }) {
        if (!activeDuelId || !userId || !match) return;
        try {
            if (!result.authoritative && match.attemptToken) {
                await api.submitLiveDuelRound(
                    activeDuelId,
                    userId,
                    match.currentRound,
                    result.score,
                    result.metric,
                    match.attemptToken
                );
            }
            const duel = await api.getLiveDuel(activeDuelId, userId);
            setMatch(duel.match);
            await loadTournament();
            await refreshLiveState();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Round sync failed');
        }
    }

    const myMatch = useMemo(() => {
        if (!tournament || !userId) return null;
        return tournament.bracket
            .flatMap((round) => round.matches)
            .find((entry) => entry.playerAId === userId || entry.playerBId === userId) || null;
    }, [tournament, userId]);

    if (spectating && spectatorMatch && userId) {
        return (
            <div className={styles.liveRun}>
                <button className={styles.stopWatching} type="button" onClick={() => setSpectating(false)}>
                    {isFr ? 'Quitter le mode spectateur' : 'Leave spectator mode'}
                </button>
                <LiveGameArena
                    key={`spectator-${spectatorMatch.duelId}-${spectatorMatch.currentRound}`}
                    mode="tournament"
                    gameId={spectatorMatch.games[spectatorMatch.currentRound - 1]}
                    series={spectatorMatch.games}
                    round={spectatorMatch.currentRound}
                    opponentName={spectatorMatch.opponentName}
                    isFr={isFr}
                    duelSession={{
                        duelId: spectatorMatch.duelId,
                        userId,
                        challengerId: spectatorMatch.challengerId,
                        spectator: true,
                    }}
                    onComplete={() => setSpectating(false)}
                />
            </div>
        );
    }

    if (match?.status === 'playing' && userId) {
        return (
            <div className={styles.liveRun}>
                <Bracket tournament={tournament} userId={userId} isFr={isFr} />
                <LiveGameArena
                    key={`${match.duelId}-${match.currentRound}`}
                    mode="tournament"
                    gameId={match.games[match.currentRound - 1]}
                    series={match.games}
                    round={match.currentRound}
                    opponentName={match.opponentName}
                    isFr={isFr}
                    duelSession={{
                        duelId: match.duelId,
                        userId,
                        challengerId: match.challengerId,
                    }}
                    onComplete={completeRound}
                />
            </div>
        );
    }

    if (tournament) {
        const joined = Boolean(userId && tournament.entrants.some((entry) => entry.id === userId));
        const isHost = tournament.hostId === userId;
        const ready = Boolean(room && userId && room.readyBy[userId]);
        const rivalId = room?.challengerId === userId ? room.opponentId : room?.challengerId;
        const rivalReady = Boolean(room && rivalId && room.readyBy[rivalId]);
        const eliminated = tournament.status === 'playing' && joined && !activeDuelId && myMatch?.status === 'done' && myMatch.winnerId !== userId;
        const everyoneReady = tournament.entrants.length === tournament.size
            && tournament.entrants.every((entrant) => entrant.ready);

        return (
            <section className={styles.panel}>
                <header className={styles.hero}>
                    <div>
                        <span>{tournament.visibility === 'public' ? 'PUBLIC CUP' : 'PRIVATE CUP'}</span>
                        <h2>{tournament.name}</h2>
                        <p>{tournament.entrants.length}/{tournament.size} {isFr ? 'joueurs humains' : 'human players'}</p>
                    </div>
                    <button type="button" onClick={leaveRoom}>{isFr ? 'Retour' : 'Back'}</button>
                </header>

                {tournament.status === 'waiting' && (
                    <div className={styles.waitingRoom}>
                        <div className={styles.roomTools}>
                            <div>
                                <small>{isFr ? 'ROOM PERSISTANTE' : 'PERSISTENT ROOM'}</small>
                                <strong>{tournament.id.slice(0, 8).toUpperCase()}</strong>
                            </div>
                            {tournament.inviteToken && (
                                <button type="button" onClick={() => void copyRoomLink()}>
                                    {inviteCopied ? (isFr ? 'Lien copié' : 'Link copied') : (isFr ? 'Inviter des amis' : 'Invite friends')}
                                </button>
                            )}
                        </div>
                        <div className={styles.roster}>
                            {Array.from({ length: tournament.size }, (_, index) => {
                                const entrant = tournament.entrants[index];
                                return (
                                    <div key={entrant?.id || index} className={entrant ? styles.filledSeed : ''}>
                                        <span>{index + 1}</span>
                                        <strong>{entrant?.name || (isFr ? 'Place libre' : 'Open slot')}</strong>
                                        <i>{entrant ? (entrant.ready ? 'READY' : entrant.online ? 'ONLINE' : 'OFFLINE') : 'OPEN'}</i>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.gameRotation}>
                            <span>{isFr ? 'ROTATION DE LA ROOM' : 'ROOM ROTATION'}</span>
                            <div>
                                {COMPETITIVE_GAMES.map((game) => (
                                    <button
                                        type="button"
                                        key={game.id}
                                        className={selectedGames.includes(game.id) ? styles.active : ''}
                                        onClick={() => void toggleGame(game.id)}
                                        disabled={!isHost}
                                    >
                                        {isFr ? game.labelFr : game.labelEn}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {!joined && <button type="button" onClick={() => joinTournament(tournament)} disabled={busy}>{isFr ? 'Rejoindre' : 'Join tournament'}</button>}
                        {joined && (
                            <button type="button" className={roomReady ? styles.cancelReady : ''} onClick={toggleRoomReady} disabled={busy}>
                                {roomReady ? (isFr ? 'Annuler READY' : 'Cancel READY') : (isFr ? 'Je suis READY' : 'I am READY')}
                            </button>
                        )}
                        {isHost && (
                            <button type="button" onClick={startTournament} disabled={busy || !everyoneReady}>
                                {everyoneReady
                                    ? (isFr ? 'Lancer le bracket' : 'Start bracket')
                                    : `${isFr ? 'Prêts' : 'Ready'} ${tournament.entrants.filter((entrant) => entrant.ready).length}/${tournament.size}`}
                            </button>
                        )}
                    </div>
                )}

                {tournament.status !== 'waiting' && <Bracket tournament={tournament} userId={userId || ''} isFr={isFr} />}

                {match?.status === 'pending' && (
                    <div className={styles.readyMatch}>
                        <span>{isFr ? 'TON PROCHAIN MATCH' : 'YOUR NEXT MATCH'}</span>
                        <strong>{ready ? 'READY' : 'YOU'} VS {rivalReady ? 'READY' : match.opponentName}</strong>
                        <button type="button" onClick={toggleReady} disabled={busy}>{ready ? (isFr ? 'Annuler' : 'Cancel ready') : 'READY'}</button>
                    </div>
                )}

                {eliminated && (
                    <div className={styles.notice}>
                        <span>{isFr ? 'Éliminé. Le bracket reste visible en direct.' : 'Eliminated. The live bracket remains available.'}</span>
                        {spectatorMatch && <button type="button" onClick={() => setSpectating(true)}>{isFr ? 'Regarder le match' : 'Watch live match'}</button>}
                    </div>
                )}
                {tournament.status === 'done' && (
                    <div className={styles.champion}>
                        <span>CHAMPION</span>
                        <strong>{tournament.entrants.find((entry) => entry.id === tournament.championId)?.name || 'Player'}</strong>
                        <button type="button" onClick={leaveRoom}>{isFr ? 'Retour aux rooms' : 'Back to rooms'}</button>
                    </div>
                )}
                {error && <p className={styles.error}>{error}</p>}
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            <header className={styles.hero}>
                <div>
                    <span>HUMAN BRACKET</span>
                    <h2>{isFr ? 'Tournois live' : 'Live tournaments'}</h2>
                    <p>{isFr ? 'Chaque case du bracket est un vrai duel BO3.' : 'Every bracket slot is a real BO3 duel.'}</p>
                </div>
            </header>
            <div className={styles.createRoom}>
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
                <div className={styles.presets}>
                    {SIZES.map((value) => <button type="button" key={value} className={size === value ? styles.active : ''} onClick={() => setSize(value)}>{value}</button>)}
                </div>
                <div className={styles.presets}>
                    {(['public', 'private'] as const).map((value) => <button type="button" key={value} className={visibility === value ? styles.active : ''} onClick={() => setVisibility(value)}>{value.toUpperCase()}</button>)}
                </div>
                <button type="button" onClick={createTournament} disabled={busy}>{isFr ? 'Créer le tournoi' : 'Create tournament'}</button>
            </div>
            <div className={styles.tournamentList}>
                {tournaments.filter((entry) => entry.status !== 'done').map((entry) => (
                    <button type="button" key={entry.id} onClick={() => setTournament(entry)}>
                        <span>{entry.visibility.toUpperCase()}</span>
                        <strong>{entry.name}</strong>
                        <i>{entry.entrants.length}/{entry.size}</i>
                    </button>
                ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
        </section>
    );
}

function Bracket({ tournament, userId, isFr }: { tournament: MultiplayerTournament | null; userId: string; isFr: boolean }) {
    if (!tournament) return null;
    return (
        <div className={styles.bracket}>
            {tournament.bracket.map((round) => (
                <section key={round.round}>
                    <span>{round.matches.length === 1 ? (isFr ? 'FINALE' : 'FINAL') : `ROUND ${round.round}`}</span>
                    {round.matches.map((match) => (
                        <div key={match.id} className={match.playerAId === userId || match.playerBId === userId ? styles.myBracketMatch : ''}>
                            <p className={match.winnerId === match.playerAId ? styles.winner : ''}>{match.playerAName}</p>
                            <strong>{match.status === 'done' ? '✓' : gameLabel('bounce', isFr)}</strong>
                            <p className={match.winnerId === match.playerBId ? styles.winner : ''}>{match.playerBName}</p>
                        </div>
                    ))}
                </section>
            ))}
        </div>
    );
}
