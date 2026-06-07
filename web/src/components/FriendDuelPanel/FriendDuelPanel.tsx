import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Challenge, type DuelRoomState, type LiveDuelMatch, type OpenInvite, type UserListEntry } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { COMPETITIVE_GAMES, gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';
import { getRiskStakeCap } from '../../gameplay/difficulty';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import styles from './FriendDuelPanel.module.css';

const STAKES = [2, 5, 10, 20];

interface DraftPlan {
    challenger: { ban: CompetitiveGameId; pick: CompetitiveGameId };
    opponent: { ban: CompetitiveGameId; pick: CompetitiveGameId };
}

function createDraft(preferred: CompetitiveGameId): DraftPlan {
    const ids = COMPETITIVE_GAMES.map((game) => game.id);
    const challengerBan = ids.find((id) => id !== preferred) || 'duelnumeric';
    const opponentBan = ids.find((id) => id !== preferred && id !== challengerBan) || 'bombpass';
    const opponentPick = ids.find((id) => id !== preferred && id !== challengerBan && id !== opponentBan) || preferred;
    return {
        challenger: { ban: challengerBan, pick: preferred },
        opponent: { ban: opponentBan, pick: opponentPick },
    };
}

export function FriendDuelPanel() {
    const userId = useGameStore((state) => state.userId);
    const clientId = useGameStore((state) => state.clientId);
    const wallet = useGameStore((state) => state.wallet);
    const language = useGameStore((state) => state.language);
    const difficulty = useGameStore((state) => state.difficultyMode);
    const refreshLiveState = useGameStore((state) => state.refreshLiveState);
    const isFr = language === 'fr';
    const stakeCap = getRiskStakeCap(difficulty);

    const [users, setUsers] = useState<UserListEntry[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [opponentId, setOpponentId] = useState('');
    const [stake, setStake] = useState(5);
    const [message, setMessage] = useState('');
    const [preferredGame, setPreferredGame] = useState<CompetitiveGameId>('bounce');
    const [bestOf, setBestOf] = useState(3);
    const [duelId, setDuelId] = useState<string | null>(null);
    const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [linkInvite, setLinkInvite] = useState<OpenInvite | null>(null);
    const [room, setRoom] = useState<DuelRoomState | null>(null);
    const [match, setMatch] = useState<LiveDuelMatch | null>(null);
    const [busy, setBusy] = useState(false);
    const [matchmaking, setMatchmaking] = useState(false);
    const [error, setError] = useState('');
    const [intermission, setIntermission] = useState<LiveDuelMatch['rounds'][number] | null>(null);
    const [realtimeTick, setRealtimeTick] = useState(0);
    const seenRoundsRef = useRef<number | null>(null);

    useRealtime(userId, (event) => {
        if (event.type === 'state.changed' || event.type === 'presence.changed' || event.type === 'connected') {
            setRealtimeTick((value) => value + 1);
        }
    });

    const opponents = useMemo(() => users.filter((user) => user.id !== userId), [users, userId]);
    const incoming = challenges.filter((challenge) => challenge.direction === 'incoming' && challenge.status === 'pending');
    const outgoing = challenges.filter((challenge) => challenge.direction === 'outgoing' && challenge.status === 'pending');
    const affordableStakes = STAKES.filter((value) => value <= Math.min(Number(wallet), stakeCap));
    const myRole = match?.challengerId === userId ? 'challenger' : 'opponent';
    const rivalRole = myRole === 'challenger' ? 'opponent' : 'challenger';
    const submitted = !!(match && userId && match.submittedBy[String(match.currentRound)]?.includes(userId));

    async function loadLobby() {
        if (!userId) return;
        const [userData, challengeData] = await Promise.all([
            api.listUsers(userId, clientId),
            api.listChallenges(userId, 'all'),
        ]);
        setUsers(userData.users);
        setChallenges(challengeData.challenges);
        setOpponentId((current) => current || userData.users.find((user) => user.id !== userId)?.id || '');

        const accepted = pendingChallengeId
            ? challengeData.challenges.find((challenge) => challenge.id === pendingChallengeId && challenge.status === 'accepted' && challenge.duelId)
            : null;
        if (accepted?.duelId && !duelId) setDuelId(accepted.duelId);
    }

    useEffect(() => {
        void loadLobby().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Lobby unavailable'));
    }, [userId, clientId, duelId, pendingChallengeId, realtimeTick]);

    useEffect(() => {
        if (!userId || duelId) return;
        void api.getActiveLiveDuel(userId)
            .then((data) => {
                if (!data.match) return;
                setDuelId(data.match.duelId);
                setMatch(data.match);
                seenRoundsRef.current = data.match.rounds.length;
            })
            .catch(() => {
                // No match to recover.
            });
    }, [userId, duelId]);

    useEffect(() => {
        const inviteId = new URLSearchParams(window.location.search).get('invite');
        if (!inviteId || !userId || duelId) return;

        void api.getOpenInvite(inviteId)
            .then(async ({ invite }) => {
                setLinkInvite(invite);
                if (invite.challengerId === userId) {
                    setInviteLink(window.location.href);
                    return;
                }
                const claimed = await api.claimOpenInvite(inviteId, userId);
                setOpponentId(invite.challengerId);
                setDuelId(claimed.duel.id);
                window.history.replaceState({}, '', `${window.location.pathname}?tab=defy`);
            })
            .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Invitation unavailable'));
    }, [userId, duelId]);

    useEffect(() => {
        if (!duelId || !userId) return;
        let cancelled = false;

        async function sync() {
            try {
                const data = await api.getLiveDuel(duelId as string, userId as string);
                if (cancelled) return;
                const previousCount = seenRoundsRef.current;
                if (previousCount == null) {
                    seenRoundsRef.current = data.match.rounds.length;
                } else if (data.match.rounds.length > previousCount) {
                    seenRoundsRef.current = data.match.rounds.length;
                    setIntermission(data.match.rounds[data.match.rounds.length - 1] || null);
                }
                setMatch(data.match);
                if (data.match.status === 'done' && data.match.rematchId) {
                    setDuelId(data.match.rematchId);
                    setMatch(null);
                    setRoom(null);
                    return;
                }
                if (data.match.status === 'pending') {
                    const roomData = await api.getDuelRoom(duelId as string, userId as string);
                    if (!cancelled) setRoom(roomData.room);
                }
                if (data.match.status === 'done') await refreshLiveState();
            } catch {
                const roomData = await api.getDuelRoom(duelId as string, userId as string);
                if (!cancelled) setRoom(roomData.room);
            }
        }

        void sync();
        return () => {
            cancelled = true;
        };
    }, [duelId, userId, refreshLiveState, realtimeTick]);

    useEffect(() => {
        if (!duelId || !userId || !room) return;
        const bothReady = room.readyBy[room.challengerId] && room.readyBy[room.opponentId];
        if (!bothReady || match?.status === 'playing' || match?.status === 'done') return;
        void api.startLiveDuel(duelId, userId).then((data) => setMatch(data.match)).catch((cause: unknown) => {
            setError(cause instanceof Error ? cause.message : 'Unable to start match');
        });
    }, [duelId, userId, room, match?.status]);

    async function createInviteLink() {
        if (!userId) return;
        setBusy(true);
        setError('');
        try {
            const created = await api.createOpenInvite(userId, stake, createDraft(preferredGame), message, bestOf);
            const link = `${window.location.origin}${window.location.pathname}?tab=defy&invite=${encodeURIComponent(created.challenge.id)}`;
            setInviteLink(link);
            setPendingChallengeId(created.challenge.id);
            try {
                await navigator.clipboard.writeText(link);
                setLinkCopied(true);
            } catch {
                setLinkCopied(false);
            }
            setMessage('');
            await loadLobby();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Challenge failed');
        } finally {
            setBusy(false);
        }
    }

    async function sendDirectChallenge() {
        if (!userId || !opponentId) return;
        setBusy(true);
        setError('');
        try {
            const created = await api.createChallenge(userId, opponentId, stake, createDraft(preferredGame), message, bestOf);
            setPendingChallengeId(created.challenge.id);
            setMessage('');
            await loadLobby();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Challenge failed');
        } finally {
            setBusy(false);
        }
    }

    async function toggleMatchmaking() {
        if (!userId) return;
        setBusy(true);
        try {
            if (matchmaking) {
                await api.cancelMatchmaking(userId);
                setMatchmaking(false);
                return;
            }
            const data = await api.joinMatchmaking(userId, stake);
            if (data.status === 'matched' && data.duel) {
                setDuelId(data.duel.id);
                setMatchmaking(false);
            } else {
                setMatchmaking(true);
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Matchmaking unavailable');
        } finally {
            setBusy(false);
        }
    }

    async function copyInviteLink() {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setLinkCopied(true);
        } catch {
            setLinkCopied(false);
        }
    }

    async function acceptChallenge(challenge: Challenge) {
        if (!userId) return;
        setBusy(true);
        try {
            const data = await api.acceptChallenge(challenge.id, userId);
            setOpponentId(challenge.challengerId);
            setDuelId(data.duel.id);
            setRoom((await api.getDuelRoom(data.duel.id, userId)).room);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Accept failed');
        } finally {
            setBusy(false);
        }
    }

    async function toggleReady() {
        if (!duelId || !userId) return;
        setBusy(true);
        try {
            const next = !room?.readyBy[userId];
            const data = await api.setDuelReady(duelId, userId, next);
            setRoom(data.room);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Ready failed');
        } finally {
            setBusy(false);
        }
    }

    async function submitRound(result: { score: number; metric: number; authoritative?: boolean }) {
        if (!duelId || !userId || !match) return;
        setBusy(true);
        try {
            if (result.authoritative) {
                const data = await api.getLiveDuel(duelId, userId);
                if (data.match.rounds.length > match.rounds.length) {
                    seenRoundsRef.current = data.match.rounds.length;
                    setIntermission(data.match.rounds[data.match.rounds.length - 1] || null);
                }
                setMatch(data.match);
                await refreshLiveState();
                return;
            }
            if (!match.attemptToken) throw new Error(isFr ? 'Tentative expirée. Reconnexion...' : 'Attempt expired. Reconnecting...');
            const data = await api.submitLiveDuelRound(duelId, userId, match.currentRound, result.score, result.metric, match.attemptToken);
            if (data.match.rounds.length > match.rounds.length) {
                seenRoundsRef.current = data.match.rounds.length;
                setIntermission(data.match.rounds[data.match.rounds.length - 1] || null);
            }
            setMatch(data.match);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Score submission failed');
        } finally {
            setBusy(false);
        }
    }

    if (intermission && match) {
        const wonRound = intermission.winnerId === userId;
        const myRoundScore = match.challengerId === userId ? intermission.challengerScore : intermission.opponentScore;
        const rivalRoundScore = match.challengerId === userId ? intermission.opponentScore : intermission.challengerScore;
        return (
            <section className={`${styles.intermission} ${wonRound ? styles.intermissionWin : styles.intermissionLoss}`}>
                <span>{wonRound ? (isFr ? 'MANCHE GAGNEE' : 'ROUND WON') : (isFr ? 'MANCHE PERDUE' : 'ROUND LOST')}</span>
                <h2>{myRoundScore} - {rivalRoundScore}</h2>
                <p>{gameLabel(intermission.gameId, isFr)}</p>
                <div className={styles.scoreboard}>
                    <strong>{match.score[myRole]}</strong><span>BO3</span><strong>{match.score[rivalRole]}</strong>
                </div>
                <button type="button" onClick={() => setIntermission(null)}>
                    {match.status === 'done' ? (isFr ? 'Voir le resultat' : 'See result') : (isFr ? 'Manche suivante' : 'Next round')}
                </button>
            </section>
        );
    }

    async function rematch() {
        if (!duelId) return;
        setBusy(true);
        try {
            const data = await api.rematchP2P(duelId);
            setDuelId(data.duel.id);
            setMatch(null);
            setRoom(null);
        } finally {
            setBusy(false);
        }
    }

    async function react(reaction: string) {
        if (!duelId || !userId) return;
        const data = await api.reactToDuel(duelId, userId, reaction);
        setMatch((current) => current ? { ...current, reactions: data.reactions } : current);
    }

    async function shareResult() {
        if (!match) return;
        const text = match.winnerId === userId
            ? `SLAP$TAX ${match.score[myRole]}-${match.score[rivalRole]} victory`
            : `SLAP$TAX duel ${match.score[myRole]}-${match.score[rivalRole]}`;
        if (navigator.share) {
            await navigator.share({ title: 'SLAP$TAX', text, url: window.location.origin });
        } else {
            await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
        }
    }

    if (match?.status === 'playing') {
        if (submitted) {
            return (
                <section className={styles.waiting}>
                    <span className={styles.liveDot} />
                    <p>{isFr ? 'SCORE VERROUILLE' : 'SCORE LOCKED'}</p>
                    <h2>{isFr ? `${match.opponentName} joue sa manche` : `${match.opponentName} is playing`}</h2>
                    <div className={styles.scoreboard}>
                        <strong>{match.score[myRole]}</strong><span>BO3</span><strong>{match.score[rivalRole]}</strong>
                    </div>
                </section>
            );
        }
        return (
            <LiveGameArena
                key={`${match.duelId}-${match.currentRound}`}
                mode="duel"
                gameId={match.games[match.currentRound - 1]}
                series={match.games}
                round={match.currentRound}
                opponentName={match.opponentName}
                isFr={isFr}
                duelSession={{
                    duelId: match.duelId,
                    userId: userId as string,
                    challengerId: match.challengerId,
                }}
                onComplete={submitRound}
            />
        );
    }

    if (match?.status === 'done') {
        const won = match.winnerId === userId;
        return (
            <section className={`${styles.final} ${won ? styles.finalWin : styles.finalLoss}`}>
                <span>{won ? (isFr ? 'VICTOIRE' : 'VICTORY') : (isFr ? 'DEFAITE' : 'DEFEAT')}</span>
                <h2>{match.score[myRole]} - {match.score[rivalRole]}</h2>
                <div className={styles.roundRecap}>
                    {match.rounds.map((round) => (
                        <div key={round.round}>
                            <span>R{round.round}</span>
                            <strong>{round.challengerScore} - {round.opponentScore}</strong>
                        </div>
                    ))}
                </div>
                <div className={styles.reactions}>
                    {['GG', 'WOW', 'CLOSE'].map((reaction) => <button type="button" key={reaction} onClick={() => void react(reaction)}>{reaction}</button>)}
                    <button type="button" onClick={() => void shareResult()}>{isFr ? 'Partager' : 'Share'}</button>
                </div>
                <div className={styles.reactionFeed}>
                    {match.reactions?.slice(-4).map((entry, index) => <span key={`${entry.at}-${index}`}>{entry.reaction}</span>)}
                </div>
                <button type="button" onClick={rematch} disabled={busy}>{isFr ? 'Revanche immédiate' : 'Instant rematch'}</button>
            </section>
        );
    }

    const ready = !!(room && userId && room.readyBy[userId]);
    const rivalId = room?.challengerId === userId ? room?.opponentId : room?.challengerId;
    const rivalReady = !!(room && rivalId && room.readyBy[rivalId]);

    return (
        <section className={styles.panel}>
            <header className={styles.hero}>
                <div>
                    <span>LIVE 1V1</span>
                    <h2>{isFr ? 'Duel entre amis' : 'Friend Duel'}</h2>
                    <p>{isFr ? 'Trois jeux. Deux victoires. Aucun resultat simule.' : 'Three games. Two wins. No simulated outcome.'}</p>
                </div>
                <strong>SLAP$ {Number(wallet).toFixed(2)}</strong>
            </header>

            {linkInvite && !duelId && linkInvite.challengerId !== userId && (
                <div className={styles.inviteBanner}>
                    <span>{isFr ? 'INVITATION RECUE' : 'INVITE RECEIVED'}</span>
                    <strong>{linkInvite.challengerName}</strong>
                    <small>SLAP$ {linkInvite.stake}</small>
                </div>
            )}

            {duelId ? (
                <div className={styles.readyRoom}>
                    <div className={styles.readyTitle}>
                        <span>{isFr ? 'SALON PRIVE' : 'PRIVATE ROOM'}</span>
                        <strong>{duelId.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className={styles.players}>
                        <div className={ready ? styles.isReady : ''}><strong>{isFr ? 'TOI' : 'YOU'}</strong><span>{ready ? 'READY' : 'WAITING'}</span></div>
                        <b>VS</b>
                        <div className={rivalReady ? styles.isReady : ''}><strong>{opponents.find((entry) => entry.id === rivalId)?.playerName || 'RIVAL'}</strong><span>{rivalReady ? 'READY' : 'WAITING'}</span></div>
                    </div>
                    <button className={styles.primary} type="button" onClick={toggleReady} disabled={busy}>
                        {ready ? (isFr ? 'Annuler READY' : 'Cancel READY') : (isFr ? 'Je suis READY' : 'I am READY')}
                    </button>
                </div>
            ) : (
                <div className={styles.setup}>
                    <div className={styles.setupIntro}>
                        <strong>{isFr ? '1. Configure la partie' : '1. Set up the match'}</strong>
                        <span>{isFr ? 'Ton épreuve favorite sera incluse dans la rotation BO3.' : 'Your preferred event will be included in the BO3 rotation.'}</span>
                    </div>
                    <div className={styles.fields}>
                        <label>{isFr ? 'Mise' : 'Stake'}
                            <select value={stake} onChange={(event) => setStake(Number(event.target.value))}>
                                {affordableStakes.map((value) => <option key={value} value={value}>SLAP$ {value}</option>)}
                            </select>
                        </label>
                        <label>{isFr ? 'Invitation directe' : 'Direct invite'}
                            <select value={opponentId} onChange={(event) => setOpponentId(event.target.value)} disabled={opponents.length === 0}>
                                {opponents.length === 0 && <option value="">{isFr ? 'Aucun joueur disponible' : 'No player available'}</option>}
                                {opponents.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.online ? '● ' : '○ '}{user.playerName} · {user.rank || 'Rookie'}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>{isFr ? 'Format' : 'Format'}
                            <select value={bestOf} onChange={(event) => setBestOf(Number(event.target.value))}>
                                {[1, 3, 5, 7].map((value) => <option key={value} value={value}>BO{value}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className={styles.gameDraft}>
                        {COMPETITIVE_GAMES.map((game) => (
                            <button
                                type="button"
                                key={game.id}
                                className={preferredGame === game.id ? styles.picked : ''}
                                onClick={() => setPreferredGame(game.id)}
                            >
                                <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                                <span>{preferredGame === game.id ? (isFr ? 'FAVORI' : 'PREFERRED') : (isFr ? game.skillFr : game.skillEn)}</span>
                            </button>
                        ))}
                    </div>
                    <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={isFr ? 'Ajoute un message...' : 'Add a message...'} maxLength={140} />
                    <div className={styles.setupIntro}>
                        <strong>{isFr ? '2. Invite ton rival' : '2. Invite your rival'}</strong>
                        <span>{isFr ? 'Le lien fonctionne même si ton ami n est pas encore inscrit.' : 'The link works even if your friend has not joined yet.'}</span>
                    </div>
                    <div className={styles.setupActions}>
                        <button className={styles.primary} type="button" onClick={createInviteLink} disabled={busy}>
                            {busy ? (isFr ? 'Création...' : 'Creating...') : (isFr ? 'Créer et copier le lien' : 'Create and copy link')}
                        </button>
                        <button className={styles.secondary} type="button" onClick={sendDirectChallenge} disabled={busy || !opponentId}>
                            {isFr ? 'Defier ce joueur' : 'Challenge this player'}
                        </button>
                        <button className={styles.secondary} type="button" onClick={toggleMatchmaking} disabled={busy}>
                            {matchmaking ? (isFr ? 'Quitter la file' : 'Leave queue') : (isFr ? 'Match rapide' : 'Quick match')}
                        </button>
                    </div>
                    {inviteLink && (
                        <div className={styles.shareLink}>
                            <span>{linkCopied ? (isFr ? 'LIEN COPIE' : 'LINK COPIED') : (isFr ? 'LIEN PRET' : 'LINK READY')}</span>
                            <input readOnly value={inviteLink} onFocus={(event) => event.currentTarget.select()} />
                            <button type="button" onClick={() => void copyInviteLink()}>{isFr ? 'Copier' : 'Copy'}</button>
                        </div>
                    )}
                </div>
            )}

            {incoming.length > 0 && !duelId && (
                <div className={styles.inbox}>
                    <span>{isFr ? 'DEFIS ENTRANTS' : 'INCOMING'}</span>
                    {incoming.map((challenge) => (
                        <article key={challenge.id}>
                            <div><strong>{challenge.challengerName}</strong><small>SLAP$ {challenge.stake}</small></div>
                            <button type="button" onClick={() => acceptChallenge(challenge)} disabled={busy}>{isFr ? 'Accepter' : 'Accept'}</button>
                        </article>
                    ))}
                </div>
            )}
            {outgoing.length > 0 && !duelId && <p className={styles.pending}>{isFr ? 'Invitation envoyee. En attente du rival...' : 'Invite sent. Waiting for your rival...'}</p>}
            {error && <p className={styles.error}>{error}</p>}
        </section>
    );
}
