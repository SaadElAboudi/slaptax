import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Challenge, type DuelRoomState, type LiveDuelMatch, type OpenInvite, type RivalryResponse, type UserListEntry } from '../../api/client';
import { useRealtime } from '../../api/realtime';
import { COMPETITIVE_GAMES, gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';
import { getRiskStakeCap } from '../../gameplay/difficulty';
import { useGameStore } from '../../hooks/useGameStore';
import { LiveGameArena } from '../LiveGameArena/LiveGameArena';
import { MomentReplay } from '../LiveGameArena/MomentReplay';
import { GameVeto } from '../GameVeto/GameVeto';
import { RoundRecap } from '../LiveGameArena/RoundRecap';
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

interface ShareMoment {
    kind: 'comeback' | 'perfect' | 'sudden' | 'clutch' | 'clean' | 'revenge';
    labelFr: string;
    labelEn: string;
    headlineFr: string;
    headlineEn: string;
}

function getShareMoment(match: LiveDuelMatch, userId: string | null, myRole: 'challenger' | 'opponent', rivalRole: 'challenger' | 'opponent'): ShareMoment {
    const won = match.winnerId === userId;
    const myRounds = match.rounds.map((round) => myRole === 'challenger' ? round.challengerScore : round.opponentScore);
    const rivalRounds = match.rounds.map((round) => rivalRole === 'challenger' ? round.challengerScore : round.opponentScore);
    const myRoundWins = match.rounds.map((round) => round.winnerId === userId);
    const lostFirst = myRoundWins[0] === false;
    const finalRound = match.rounds[match.rounds.length - 1];
    const finalMyScore = myRounds[myRounds.length - 1] || 0;
    const finalRivalScore = rivalRounds[rivalRounds.length - 1] || 0;
    const finalGap = Math.abs(finalMyScore - finalRivalScore);
    const hasPerfect = myRounds.some((score, index) => !match.rounds[index].authoritative && score >= 950 && score - (rivalRounds[index] || 0) >= 300);
    const reachedDecider = match.rounds.length >= 3 || (finalRound?.round || 0) >= 3;
    if (finalRound?.moment && !finalRound.moment.summary.includes('forfeit')) {
        const moment = finalRound.moment;
        const gap = Math.abs((moment.scores[match.challengerId] || 0) - (moment.scores[match.opponentId] || 0));
        return { kind: won ? 'clutch' : 'revenge', labelFr: won ? 'BIEN JOUE' : 'REVANCHE', labelEn: won ? 'WELL PLAYED' : 'REMATCH',
            headlineFr: moment.gameId === 'contrepied' ? `${gap} points d ecart. Chaque carte comptait.` : moment.gameId === 'chroma' ? `${(gap/1000).toFixed(1)} de distance RVB vous separent.` : moment.gameId === 'onesecond' ? `${gap} ms d'ecart sur trois essais.` : moment.gameId === 'onemore' ? 'Il fallait savoir s arreter.' : 'Le sang-froid a fait la difference.',
            headlineEn: moment.gameId === 'contrepied' ? `${gap} points apart. Every card mattered.` : moment.gameId === 'chroma' ? `${(gap/1000).toFixed(1)} RGB distance apart.` : moment.gameId === 'onesecond' ? `${gap} ms apart over three attempts.` : moment.gameId === 'onemore' ? 'Knowing when to stop makes the difference.' : 'Composure made the difference.' };
    }

    if (won && lostFirst) {
        return {
            kind: 'comeback',
            labelFr: 'COMEBACK',
            labelEn: 'COMEBACK',
            headlineFr: 'J ai pris la premiere claque. Puis j ai taxe la serie.',
            headlineEn: 'Lost the first hit. Taxed the whole series.',
        };
    }
    if (won && hasPerfect) {
        return {
            kind: 'perfect',
            labelFr: 'PERFECT HIT',
            labelEn: 'PERFECT HIT',
            headlineFr: 'Manche parfaite. Respect obligatoire.',
            headlineEn: 'Perfect round. Respect is mandatory.',
        };
    }
    if (reachedDecider && finalGap <= 80) {
        return {
            kind: 'sudden',
            labelFr: 'SUDDEN DEATH',
            labelEn: 'SUDDEN DEATH',
            headlineFr: won ? 'Gagne au bord du KO.' : 'Perdu d un souffle.',
            headlineEn: won ? 'Won on the edge.' : 'Lost by one breath.',
        };
    }
    if (won && match.score[myRole] > match.score[rivalRole]) {
        return {
            kind: 'clutch',
            labelFr: 'CLUTCH',
            labelEn: 'CLUTCH',
            headlineFr: 'Deux manches. Zero excuse.',
            headlineEn: 'Two rounds. Zero excuses.',
        };
    }
    if (!won) {
        return {
            kind: 'revenge',
            labelFr: 'REVANCHE',
            labelEn: 'REVENGE',
            headlineFr: 'La claque est prise. La revanche est ouverte.',
            headlineEn: 'The hit landed. The rematch is open.',
        };
    }
    return {
        kind: 'clean',
        labelFr: 'CLEAN WIN',
        labelEn: 'CLEAN WIN',
        headlineFr: 'Victoire propre dans l arene.',
        headlineEn: 'Clean win in the arena.',
    };
}

export function FriendDuelPanel() {
    const playerName = useGameStore((state) => state.playerName);
    const userId = useGameStore((state) => state.userId);
    const clientId = useGameStore((state) => state.clientId);
    const wallet = useGameStore((state) => state.wallet);
    const language = useGameStore((state) => state.language);
    const difficulty = useGameStore((state) => state.difficultyMode);
    const favoriteRivalId = useGameStore((state) => state.favoriteRivalId);
    const refreshLiveState = useGameStore((state) => state.refreshLiveState);
    const isFr = language === 'fr';
    const stakeCap = getRiskStakeCap(difficulty);

    const [users, setUsers] = useState<UserListEntry[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [opponentId, setOpponentId] = useState('');
    const [stake, setStake] = useState(5);
    const [message, setMessage] = useState('');
    const [preferredGame, setPreferredGame] = useState<CompetitiveGameId>(() => {
        try {
            const stored = localStorage.getItem('slaptax_duel_game');
            return COMPETITIVE_GAMES.some((game) => game.id === stored) ? stored as CompetitiveGameId : 'bounce';
        } catch { return 'bounce'; }
    });
    const [bestOf, setBestOf] = useState(3);
    const [duelId, setDuelId] = useState<string | null>(null);
    const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [shareCopied, setShareCopied] = useState(false);
    const [linkInvite, setLinkInvite] = useState<OpenInvite | null>(null);
    const [room, setRoom] = useState<DuelRoomState | null>(null);
    const [match, setMatch] = useState<LiveDuelMatch | null>(null);
    const [rivalry, setRivalry] = useState<RivalryResponse | null>(null);
    const [rematchStake, setRematchStake] = useState(2);
    const [rematchGame, setRematchGame] = useState<CompetitiveGameId | ''>('');
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

    useEffect(() => {
        if (!userId) return;
        const fallback = window.setInterval(() => { if (!document.hidden) setRealtimeTick((value) => value + 1); }, 5000);
        return () => clearInterval(fallback);
    }, [userId]);

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
    }, [userId, duelId, realtimeTick]);

    useEffect(() => {
        if (!userId || duelId) return;
        void api.getMatchmakingStatus(userId)
            .then((data) => {
                if (data.status === 'matched' && data.duel) {
                    setDuelId(data.duel.id);
                    setMatchmaking(false);
                    return;
                }
                setMatchmaking(data.status === 'waiting');
            })
            .catch(() => {
                // Matchmaking state will recover on the next realtime event.
            });
    }, [userId, duelId, realtimeTick]);

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
                if (data.match.status === 'cancelled') {
                    setDuelId(null); setMatch(null); setRoom(null); setPendingChallengeId(null); seenRoundsRef.current = null;
                    setError(isFr ? 'Le salon a ete ferme.' : 'The room was closed.'); return;
                }
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
                try {
                    const roomData = await api.getDuelRoom(duelId as string, userId as string);
                    if (!cancelled) setRoom(roomData.room);
                } catch (cause) {
                    if (!cancelled) setError(cause instanceof Error ? cause.message : 'Room unavailable');
                }
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

    useEffect(() => {
        if (!userId || match?.status !== 'done') return;
        const rivalId = match.challengerId === userId ? match.opponentId : match.challengerId;
        void api.getRivalry(userId, rivalId)
            .then(setRivalry)
            .catch(() => setRivalry(null));
    }, [userId, match?.status, match?.challengerId, match?.opponentId, realtimeTick]);

    useEffect(() => {
        if (match?.status !== 'done') return;
        setRematchStake(match.stake);
        setRematchGame('');
        setShareLink('');
        setShareCopied(false);
    }, [match?.duelId, match?.status, match?.stake]);

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
                void api.trackProductEvent('invite_link_copied', userId, { source: 'invite_created' }).catch(() => undefined);
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
            if (userId) void api.trackProductEvent('invite_link_copied', userId, { source: 'invite_panel' }).catch(() => undefined);
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
        return <RoundRecap match={match} round={intermission} userId={userId || ''} isFr={isFr} onContinue={() => setIntermission(null)} />;
    }

    async function handleRematch(action: 'request' | 'accept' | 'decline') {
        if (!duelId || !userId) return;
        setBusy(true);
        setError('');
        try {
            const data = await api.respondToRematch(
                duelId,
                userId,
                action,
                action === 'request'
                    ? { stake: rematchStake, preferredGame: rematchGame || null }
                    : undefined
            );
            if (data.status === 'accepted' && data.duel) {
                setDuelId(data.duel.id);
                setMatch(null);
                setRoom(null);
                setRivalry(null);
            } else if (data.match) {
                setMatch(data.match);
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Rematch unavailable');
        } finally {
            setBusy(false);
        }
    }

    async function react(reaction: string) {
        if (!duelId || !userId) return;
        try {
            const data = await api.reactToDuel(duelId, userId, reaction);
            setMatch((current) => current ? { ...current, reactions: data.reactions } : current);
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Reaction unavailable'); }
    }

    async function ensureShareLink(moment: ShareMoment) {
        if (shareLink) return shareLink;
        if (!match || !userId) return window.location.origin;

        const replayGame = match.games[match.currentRound - 1] || match.rounds[match.rounds.length - 1]?.gameId || 'bounce';
        const shareStake = affordableStakes.includes(match.stake) ? match.stake : affordableStakes[0] || 2;
        const created = await api.createOpenInvite(
            userId,
            shareStake,
            createDraft(replayGame),
            `${moment.labelEn}: ${match.score[myRole]}-${match.score[rivalRole]}`,
            bestOf
        );
        const link = `${window.location.origin}${window.location.pathname}?tab=defy&invite=${encodeURIComponent(created.challenge.id)}`;
        setShareLink(link);
        void api.trackProductEvent('share_card_created', userId, {
            duelId: match.duelId,
            moment: moment.kind,
            inviteId: created.challenge.id,
        }).catch(() => undefined);
        return link;
    }

    async function copyShareLink(moment: ShareMoment) {
        try {
            const link = await ensureShareLink(moment);
            await navigator.clipboard.writeText(link);
            setShareCopied(true);
            if (userId && match) {
                void api.trackProductEvent('share_link_copied', userId, {
                    duelId: match.duelId,
                    moment: moment.kind,
                }).catch(() => undefined);
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Share link unavailable');
        }
    }

    async function shareResult(moment: ShareMoment) {
        if (!match) return;
        try {
            const link = await ensureShareLink(moment);
            const label = isFr ? moment.labelFr : moment.labelEn;
            const headline = isFr ? moment.headlineFr : moment.headlineEn;
            const text = `${label} - SLAP$TAX ${match.score[myRole]}-${match.score[rivalRole]} vs ${match.opponentName}. ${headline}`;
            if (navigator.share) {
                await navigator.share({ title: 'SLAP$TAX', text, url: link });
            } else {
                await navigator.clipboard.writeText(`${text} ${link}`);
                setShareCopied(true);
            }
            if (userId) {
                void api.trackProductEvent('result_shared', userId, {
                    duelId: match.duelId,
                    moment: moment.kind,
                    hasInviteLink: link !== window.location.origin,
                }).catch(() => undefined);
            }
        } catch (cause) {
            // Native share can be cancelled by the player.
            if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
                setError(cause instanceof Error ? cause.message : 'Share unavailable');
            }
        }
    }

    async function toggleFavoriteRival(rivalId: string) {
        if (!userId) return;
        setBusy(true);
        try {
            await api.setFavoriteRival(userId, favoriteRivalId === rivalId ? null : rivalId);
            await refreshLiveState();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Favorite rival unavailable');
        } finally {
            setBusy(false);
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
        const rivalId = match.challengerId === userId ? match.opponentId : match.challengerId;
        const myRivalryWins = rivalry?.wins?.[userId || ''] || 0;
        const rivalWins = rivalry?.wins?.[rivalId] || 0;
        const requestedByMe = match.rematch?.status === 'pending' && match.rematch.requestedBy === userId;
        const requestedByRival = match.rematch?.status === 'pending' && match.rematch.requestedBy === rivalId;
        const streakIsMine = rivalry?.currentStreak.userId === userId;
        const bestGame = rivalry?.bestGame[userId || ''];
        const doubledStake = STAKES.find((value) => value === match.stake * 2);
        const shareMoment = getShareMoment(match, userId, myRole, rivalRole);
        const shareHeadline = isFr ? shareMoment.headlineFr : shareMoment.headlineEn;
        const shareLabel = isFr ? shareMoment.labelFr : shareMoment.labelEn;
        const decisiveRound = match.rounds[match.rounds.length - 1];
        const decisiveGame = decisiveRound ? gameLabel(decisiveRound.gameId, isFr) : gameLabel(match.games[0], isFr);
        return (
            <section className={`${styles.final} ${won ? styles.finalWin : styles.finalLoss}`}>
                <span>{won ? (isFr ? 'VICTOIRE' : 'VICTORY') : (isFr ? 'DEFAITE' : 'DEFEAT')}</span>
                <h2>{match.score[myRole]} - {match.score[rivalRole]}</h2>
                {decisiveRound?.moment && userId && <MomentReplay moment={decisiveRound.moment} userId={userId} playerName={playerName} rivalName={match.opponentName} isFr={isFr} />}
                <div className={`${styles.shareMoment} ${styles[`moment_${shareMoment.kind}`]}`}>
                    <div className={styles.shareMomentHeader}>
                        <span>{shareLabel}</span>
                        <strong>SLAP$TAX</strong>
                    </div>
                    <h3>{shareHeadline}</h3>
                    <div className={styles.shareMomentScore}>
                        <div>
                            <small>{isFr ? 'TOI' : 'YOU'}</small>
                            <b>{match.score[myRole]}</b>
                        </div>
                        <i>VS</i>
                        <div>
                            <small>{match.opponentName}</small>
                            <b>{match.score[rivalRole]}</b>
                        </div>
                    </div>
                    <p>
                        {decisiveGame}
                        {' · '}
                        {isFr ? 'Lien de revanche pret a partager' : 'Rematch link ready to share'}
                    </p>
                    <div className={styles.shareMomentActions}>
                        <button type="button" onClick={() => void shareResult(shareMoment)}>
                            {isFr ? 'Partager le moment' : 'Share moment'}
                        </button>
                        <button type="button" onClick={() => void copyShareLink(shareMoment)}>
                            {shareCopied ? (isFr ? 'Lien copie' : 'Link copied') : (isFr ? 'Copier le lien' : 'Copy link')}
                        </button>
                    </div>
                    {shareLink && <input readOnly value={shareLink} aria-label={isFr ? 'Lien de revanche' : 'Rematch link'} />}
                </div>
                <div className={styles.rivalryCard}>
                    <div>
                        <small>{isFr ? 'FACE-A-FACE' : 'HEAD TO HEAD'}</small>
                        <strong>{myRivalryWins} <span>–</span> {rivalWins}</strong>
                        <p>{isFr ? `Toi contre ${match.opponentName}` : `You against ${match.opponentName}`}</p>
                        <em>
                            {rivalry?.currentStreak.count
                                ? `${streakIsMine ? (isFr ? 'Ta série' : 'Your streak') : (isFr ? 'Série adverse' : 'Rival streak')} ${rivalry.currentStreak.count}×`
                                : (isFr ? 'Série à construire' : 'Build the streak')}
                            {bestGame ? ` · ${gameLabel(bestGame, isFr)}` : ''}
                        </em>
                    </div>
                    <div className={styles.rivalryAside}>
                        <button
                            type="button"
                            className={favoriteRivalId === rivalId ? styles.favoriteActive : styles.favoriteButton}
                            onClick={() => void toggleFavoriteRival(rivalId)}
                            aria-label={favoriteRivalId === rivalId
                                ? (isFr ? 'Retirer des rivaux favoris' : 'Remove favorite rival')
                                : (isFr ? 'Ajouter aux rivaux favoris' : 'Add favorite rival')}
                            title={favoriteRivalId === rivalId
                                ? (isFr ? 'Rival favori' : 'Favorite rival')
                                : (isFr ? 'Marquer comme favori' : 'Mark as favorite')}
                        >
                            ★
                        </button>
                        <div className={styles.rivalryForm} aria-label={isFr ? 'Cinq derniers duels' : 'Last five duels'}>
                            {(rivalry?.last5 || []).map((entry) => (
                                <i
                                    key={`${entry.date}-${entry.winnerId}`}
                                    className={entry.winnerId === userId ? styles.rivalryWin : styles.rivalryLoss}
                                    title={entry.winnerId === userId ? (isFr ? 'Victoire' : 'Win') : (isFr ? 'Défaite' : 'Loss')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.roundRecap}>
                    {match.rounds.map((round) => (
                        <div key={round.round}>
                            <span>R{round.round}</span>
                            <strong>{round.challengerScore} - {round.opponentScore}</strong>
                        </div>
                    ))}
                </div>
                {rivalry?.season && <div className={styles.seasonRail}>
                    <span>{isFr ? 'VOTRE SAISON' : 'YOUR SEASON'} · {rivalry.season.month}</span>
                    <strong>{rivalry.season.wins[userId || ''] || 0} - {rivalry.season.wins[rivalId] || 0}</strong>
                    <span>{rivalry.season.matches} {isFr ? 'duels' : 'duels'}</span>
                </div>}
                <div className={styles.reactions}>
                    {['GG', 'LUCK', 'CLOSE'].map((reaction) => <button type="button" key={reaction} onClick={() => void react(reaction)}>{({ GG: isFr ? 'Bien joue.' : 'Well played.', LUCK: isFr ? 'Chance.' : 'Lucky.', CLOSE: isFr ? 'A un rien.' : 'So close.' })[reaction]}</button>)}
                    <button type="button" onClick={() => void shareResult(shareMoment)}>{isFr ? 'Partager' : 'Share'}</button>
                </div>
                <div className={styles.reactionFeed}>
                    {match.reactions?.slice(-4).map((entry, index) => <span key={`${entry.at}-${index}`}>{entry.reaction}</span>)}
                </div>
                {requestedByRival ? (
                    <div className={styles.rematchPrompt}>
                        <strong>{isFr ? `${match.opponentName} veut une revanche` : `${match.opponentName} wants a rematch`}</strong>
                        <p>
                            SLAP$ {match.rematch?.stake}
                            {' · '}
                            {match.rematch?.preferredGame
                                ? gameLabel(match.rematch.preferredGame, isFr)
                                : (isFr ? 'Même rotation' : 'Same rotation')}
                        </p>
                        <div>
                            <button type="button" onClick={() => void handleRematch('accept')} disabled={busy}>
                                {isFr ? 'Accepter' : 'Accept'}
                            </button>
                            <button type="button" onClick={() => void handleRematch('decline')} disabled={busy}>
                                {isFr ? 'Refuser' : 'Decline'}
                            </button>
                        </div>
                    </div>
                ) : requestedByMe ? (
                    <div className={styles.rematchWaiting}>
                        <span className={styles.liveDot} />
                        <div>
                            <strong>{isFr ? `En attente de ${match.opponentName}` : `Waiting for ${match.opponentName}`}</strong>
                            <small>
                                SLAP$ {match.rematch?.stake} · {match.rematch?.preferredGame
                                    ? gameLabel(match.rematch.preferredGame, isFr)
                                    : (isFr ? 'Même rotation' : 'Same rotation')}
                            </small>
                        </div>
                    </div>
                ) : (
                    <div className={styles.rematchBuilder}>
                        <div className={styles.rematchOptions}>
                            <label>
                                <span>{isFr ? 'Mise' : 'Stake'}</span>
                                <select value={rematchStake} onChange={(event) => setRematchStake(Number(event.target.value))}>
                                    <option value={match.stake}>{isFr ? 'Même mise' : 'Same stake'} · SLAP$ {match.stake}</option>
                                    {doubledStake && doubledStake <= Number(wallet) && (
                                        <option value={doubledStake}>{isFr ? 'Doubler' : 'Double'} · SLAP$ {doubledStake}</option>
                                    )}
                                </select>
                            </label>
                            <label>
                                <span>{isFr ? 'Rotation' : 'Rotation'}</span>
                                <select value={rematchGame} onChange={(event) => setRematchGame(event.target.value as CompetitiveGameId | '')}>
                                    <option value="">{isFr ? 'Même rotation' : 'Same rotation'}</option>
                                    {COMPETITIVE_GAMES.map((game) => (
                                        <option key={game.id} value={game.id}>{isFr ? game.labelFr : game.labelEn}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <button type="button" onClick={() => void handleRematch('request')} disabled={busy}>
                            {match.rematch?.status === 'declined'
                                ? (isFr ? 'Redemander une revanche' : 'Ask again')
                                : (isFr ? 'Proposer la revanche' : 'Propose rematch')}
                        </button>
                    </div>
                )}
                {error && <p className={styles.error}>{error}</p>}
            </section>
        );
    }

    const ready = !!(room && userId && room.readyBy[userId]);
    const rivalId = room?.challengerId === userId ? room?.opponentId : room?.challengerId;
    const rivalReady = !!(room && rivalId && room.readyBy[rivalId]);

    return (
        <section className={styles.panel}>
            {!duelId && <header className={styles.hero}>
                <div>
                    <span>LIVE 1V1</span>
                    <h2>{isFr ? 'Duel entre amis' : 'Friend Duel'}</h2>
                    <p>{isFr ? 'Choisis ton terrain. Bannis le sien. Affrontez-vous en direct.' : 'Pick your ground. Ban theirs. Face off live.'}</p>
                </div>
                <strong>SLAP$ {Number(wallet).toFixed(2)}</strong>
            </header>}

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
                        <span>{isFr ? 'SALON RIVALITE' : 'RIVALRY ROOM'}</span>
                        <strong>{(room?.seriesId || duelId).slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className={styles.players}>
                        <div className={ready ? styles.isReady : ''}><strong>{isFr ? 'TOI' : 'YOU'}</strong><span>{ready ? 'READY' : 'WAITING'}</span></div>
                        <b>VS</b>
                        <div className={rivalReady ? styles.isReady : ''}><strong>{opponents.find((entry) => entry.id === rivalId)?.playerName || 'RIVAL'}</strong><span>{rivalReady ? 'READY' : 'WAITING'}</span></div>
                    </div>
                    {room?.veto && userId && <GameVeto veto={room.veto} userId={userId} isFr={isFr} busy={busy} games={room.games} onBan={(gameId) => {
                        setBusy(true); setError('');
                        void api.banDuelGame(duelId, userId, gameId).then((data) => setRoom(data.room)).catch((cause) => setError(cause.message)).finally(() => setBusy(false));
                    }} />}
                    <button className={styles.primary} type="button" onClick={toggleReady} disabled={busy || Boolean(room?.veto && !room.veto.complete)}>
                        {ready ? (isFr ? 'Annuler READY' : 'Cancel READY') : (isFr ? 'Je suis READY' : 'I am READY')}
                    </button>
                    <button className={styles.secondary} type="button" disabled={busy} onClick={() => {
                        if (!userId) return;
                        setBusy(true);
                        void api.leaveDuelRoom(duelId,userId).then(() => { setDuelId(null); setMatch(null); setRoom(null); setPendingChallengeId(null); seenRoundsRef.current = null; }).catch((cause) => setError(cause.message)).finally(() => setBusy(false));
                    }}>{isFr ? 'Quitter le salon' : 'Leave room'}</button>
                </div>
            ) : matchmaking ? (
                <div className={styles.queueRoom}>
                    <span className={styles.queuePulse} aria-hidden />
                    <div>
                        <small>{isFr ? 'MATCHMAKING LIVE' : 'LIVE MATCHMAKING'}</small>
                        <strong>{isFr ? 'Recherche d’un rival humain' : 'Finding a human rival'}</strong>
                        <p>{isFr ? 'File active tant que l’application reste ouverte.' : 'Your queue stays active while the app is open.'}</p>
                    </div>
                    <button className={styles.secondary} type="button" onClick={toggleMatchmaking} disabled={busy}>
                        {busy ? (isFr ? 'Annulation...' : 'Cancelling...') : (isFr ? 'Quitter la file' : 'Leave queue')}
                    </button>
                </div>
            ) : (
                <div className={styles.setup}>
                    <div className={styles.setupIntro}>
                        <strong>{isFr ? '1. Configure la partie' : '1. Set up the match'}</strong>
                        <span>{isFr ? 'Ton épreuve favorite entre dans la rotation, sauf si elle est bannie.' : 'Your preferred event joins the rotation unless it is banned.'}</span>
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
