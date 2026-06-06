import { useEffect, useMemo, useState } from 'react';
import styles from './FriendDuelPanel.module.css';
import { api, type Challenge, type DuelRoomState, type PlayP2PResponse, type UserListEntry } from '../../api/client';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel, getRiskStakeCap } from '../../gameplay/difficulty';
import { COMPETITIVE_GAMES, gameLabel, type CompetitiveGameId } from '../../gameplay/catalog';

const STAKES = [2, 5, 10, 20];
const PENDING_INVITE_KEY = 'slaptax_pending_invite';
const DRAFT_GAMES = COMPETITIVE_GAMES;
type DraftGameId = CompetitiveGameId;

interface DraftSide {
    ban: DraftGameId;
    pick: DraftGameId;
}

interface DraftPlan {
    challenger: DraftSide;
    opponent: DraftSide;
}

interface PendingInvitePayload {
    opponentId: string;
    stake?: number;
    message?: string;
    fromName?: string;
}

function formatNet(result: PlayP2PResponse | null, activeUserId: string | null): string {
    if (!result || !activeUserId) return '--';
    const didWin = result.winnerId === activeUserId;
    const net = didWin ? result.duel.stake * 0.7 : -result.duel.stake;
    return `${net >= 0 ? '+' : ''}SLAP$ ${net.toFixed(2)}`;
}

function labelGame(gameId: string, isFr: boolean): string {
    return gameLabel(gameId, isFr);
}

export function FriendDuelPanel() {
    const refreshLiveState = useGameStore((s) => s.refreshLiveState);
    const currentUserId = useGameStore((s) => s.userId);
    const clientId = useGameStore((s) => s.clientId);
    const language = useGameStore((s) => s.language);
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const isFr = language === 'fr';
    const wallet = useGameStore((s) => s.wallet);
    const safeWallet = Number(wallet ?? 0);
    const stakeCap = getRiskStakeCap(difficultyMode);
    const cappedStakes = STAKES.filter((s) => s <= stakeCap);

    const [users, setUsers] = useState<UserListEntry[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [opponentId, setOpponentId] = useState<string>('');
    const [stake, setStake] = useState<number>(5);
    const [message, setMessage] = useState<string>('');
    const [pending, setPending] = useState<Challenge[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [draft, setDraft] = useState<DraftPlan>({
        challenger: { ban: 'duelnumeric', pick: 'symbolrush' },
        opponent: { ban: 'duelnumeric', pick: 'bounce' },
    });
    const [rivalryWins, setRivalryWins] = useState<string>(isFr ? 'Pas encore de rivalite' : 'No rivalry data yet');
    const [lastResult, setLastResult] = useState<PlayP2PResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [inviteNotice, setInviteNotice] = useState<string>('');
    const [roomReady, setRoomReady] = useState(false);
    const [armedDuelId, setArmedDuelId] = useState<string | null>(null);
    const [roomState, setRoomState] = useState<DuelRoomState | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [roomEvents, setRoomEvents] = useState<Array<{ time: string; event: string }>>([]);

    const opponents = useMemo(
        () => users.filter((u) => u.id !== activeUserId),
        [users, activeUserId]
    );

    async function loadChallenges(uid: string) {
        const data = await api.listChallenges(uid, 'pending');
        setPending(data.challenges ?? []);
    }

    function addRoomEvent(event: string) {
        const now = new Date();
        const time = now.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setRoomEvents((prev) => [...prev.slice(-4), { time, event }]); // Keep last 5 events
    }

    async function loadUsersAndChallenges() {
        setError('');
        const data = await api.listUsers(currentUserId, clientId);
        const list = data.users ?? [];
        setUsers(list);
        setActiveUserId(data.activeUserId || null);

        const initialOpponent = list.find((u) => u.id !== data.activeUserId)?.id || '';
        setOpponentId((current) => current || initialOpponent);

        if (data.activeUserId) {
            await loadChallenges(data.activeUserId);
        }
    }

    useEffect(() => {
        loadUsersAndChallenges().catch((e: unknown) => {
            setError(e instanceof Error ? e.message : (isFr ? 'Chargement des joueurs impossible' : 'Failed to load users'));
        });
    }, [isFr, currentUserId, clientId]);

    useEffect(() => {
        if (!activeUserId) return;
        const iv = window.setInterval(() => {
            void loadChallenges(activeUserId);
            if (armedDuelId) {
                void api.getDuelRoom(armedDuelId, activeUserId)
                    .then((room) => setRoomState(room.room))
                    .catch(() => { /* room may be cleared */ });
            }
        }, 7000);
        return () => window.clearInterval(iv);
    }, [activeUserId, armedDuelId]);

    useEffect(() => {
        setDraft((current) => {
            const allowed = new Set(DRAFT_GAMES.map((game) => game.id));
            const sanitize = (side: DraftSide): DraftSide => {
                const fallback = DRAFT_GAMES[0].id;
                const ban = allowed.has(side.ban) ? side.ban : fallback;
                const pick = allowed.has(side.pick) && side.pick !== ban ? side.pick : (DRAFT_GAMES[1]?.id ?? fallback);
                return { ban, pick: pick === ban ? (DRAFT_GAMES[2]?.id ?? fallback) : pick };
            };
            return { challenger: sanitize(current.challenger), opponent: sanitize(current.opponent) };
        });
    }, []);

    useEffect(() => {
        if (!activeUserId || !opponentId) {
            setRivalryWins(isFr ? 'Pas encore de rivalite' : 'No rivalry data yet');
            return;
        }
        api.getRivalry(activeUserId, opponentId)
            .then((r) => {
                if (!r.exists || !r.wins) {
                    setRivalryWins(isFr ? 'Pas encore de rivalite' : 'No rivalry data yet');
                    return;
                }
                const a = r.wins[activeUserId] ?? 0;
                const b = r.wins[opponentId] ?? 0;
                setRivalryWins(isFr ? `Victoires face-a-face : ${a} - ${b}` : `Head-to-head wins: ${a} - ${b}`);
            })
            .catch(() => setRivalryWins(isFr ? 'Pas encore de rivalite' : 'No rivalry data yet'));
    }, [activeUserId, opponentId, isFr]);

    useEffect(() => {
        setArmedDuelId(null);
        setRoomState(null);
        setRoomReady(false);
        setCountdown(null);
        setRoomEvents([]);
    }, [opponentId]);

    useEffect(() => {
        if (!armedDuelId || !activeUserId) {
            setRoomState(null);
            setCountdown(null);
            return;
        }

        let cancelled = false;
        void api.getDuelRoom(armedDuelId, activeUserId)
            .then((room) => {
                if (cancelled) return;
                setRoomState(room.room);
            })
            .catch(() => {
                if (cancelled) return;
                setRoomState(null);
            });

        return () => {
            cancelled = true;
        };
    }, [armedDuelId, activeUserId]);

    useEffect(() => {
        if (!roomState || !activeUserId) {
            setRoomReady(false);
            return;
        }
        setRoomReady(!!roomState.readyBy?.[activeUserId]);
    }, [roomState, activeUserId]);

    useEffect(() => {
        if (!roomState?.readyCountdownAt) {
            setCountdown(null);
            return;
        }

        addRoomEvent(isFr ? '▸ Les deux READY! Lancement auto...' : '▸ Both READY! Auto-launch...');

        const countFrom = () => {
            const started = new Date(roomState.readyCountdownAt as string).getTime();
            const elapsed = Math.floor((Date.now() - started) / 1000);
            const remaining = Math.max(0, 3 - elapsed);
            return Number.isFinite(remaining) ? remaining : 0;
        };

        setCountdown(countFrom());
        const interval = window.setInterval(() => {
            setCountdown(countFrom());
        }, 1000);

        return () => window.clearInterval(interval);
    }, [roomState?.readyCountdownAt, isFr]);

    useEffect(() => {
        if (countdown !== 0 || !armedDuelId || !activeUserId) return;

        setCountdown(null);
        setLoading(true);
        setError('');

        void (async () => {
            try {
                const played = await api.playP2PDuel(armedDuelId);
                setLastResult(played);
                setArmedDuelId(null);
                setRoomState(null);
                setRoomReady(false);
                await refreshLiveState();
                await loadChallenges(activeUserId);
            } catch (e) {
                setError(e instanceof Error ? e.message : (isFr ? 'Le duel verrouille a echoue' : 'Locked duel failed'));
            } finally {
                setLoading(false);
            }
        })();
    }, [countdown, armedDuelId, activeUserId, isFr, refreshLiveState]);

    useEffect(() => {
        if (!activeUserId || users.length === 0) return;

        let payload: PendingInvitePayload | null = null;
        try {
            const raw = localStorage.getItem(PENDING_INVITE_KEY);
            if (!raw) return;
            payload = JSON.parse(raw) as PendingInvitePayload;
            localStorage.removeItem(PENDING_INVITE_KEY);
        } catch {
            return;
        }

        if (!payload?.opponentId || payload.opponentId === activeUserId) return;

        const invitedOpponent = users.find((user) => user.id === payload?.opponentId && user.id !== activeUserId);
        if (!invitedOpponent) return;

        setOpponentId(invitedOpponent.id);

        if (typeof payload.stake === 'number' && Number.isFinite(payload.stake)) {
            const affordable = STAKES.filter((value) => value <= Math.min(stakeCap, safeWallet));
            const target = affordable.includes(payload.stake)
                ? payload.stake
                : (affordable[affordable.length - 1] ?? STAKES[0]);
            setStake(target);
        }

        if (payload.message) {
            setMessage(payload.message);
        }

        setInviteNotice(
            payload.fromName
                ? (isFr ? `Invitation chargee depuis ${payload.fromName}.` : `Invite loaded from ${payload.fromName}.`)
                : (isFr ? 'Invitation chargee. Duel preconfigure.' : 'Invite loaded. Duel preconfigured.')
        );
    }, [activeUserId, users, safeWallet, stakeCap, isFr]);

    useEffect(() => {
        const effectiveCap = Math.min(stakeCap, safeWallet);
        if (stake <= effectiveCap) return;
        const affordable = STAKES.filter((s) => s <= effectiveCap);
        if (affordable.length > 0) {
            setStake(affordable[affordable.length - 1]);
        }
    }, [safeWallet, stake, stakeCap]);

    async function handleSendChallenge() {
        if (!activeUserId || !opponentId) return;
        setLoading(true);
        setError('');
        try {
            await api.createChallenge(activeUserId, opponentId, stake, draft, message.trim() || undefined);
            await loadChallenges(activeUserId);
            setMessage('');
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Echec de l envoi du defi' : 'Challenge failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateRival() {
        if (!activeUserId) return;
        const name = newPlayerName.trim();
        if (!name) return;

        setLoading(true);
        setError('');
        try {
            await api.createUser(name);
            await api.selectUser(activeUserId);
            await loadUsersAndChallenges();
            setNewPlayerName('');
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Creation du joueur impossible' : 'Create player failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handleInstantDuel() {
        if (!activeUserId || !opponentId) return;
        setLoading(true);
        setError('');
        try {
            const created = await api.createDuel(activeUserId, opponentId, stake, draft);
            const played = await api.playP2PDuel(created.duel.id);
            setLastResult(played);
            await refreshLiveState();
            await loadChallenges(activeUserId);
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Le duel a echoue' : 'Duel failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handlePlayArmedDuel() {
        if (!armedDuelId || !activeUserId) return;
        setLoading(true);
        setError('');
        try {
            const played = await api.playP2PDuel(armedDuelId);
            setLastResult(played);
            setArmedDuelId(null);
            setRoomState(null);
            setRoomReady(false);
            await refreshLiveState();
            await loadChallenges(activeUserId);
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Le duel verrouille a echoue' : 'Locked duel failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handleRematch() {
        if (!lastResult?.duel.id || !activeUserId) return;
        setLoading(true);
        setError('');
        try {
            const created = await api.rematchP2P(lastResult.duel.id);
            const played = await api.playP2PDuel(created.duel.id);
            setLastResult(played);
            await refreshLiveState();
            await loadChallenges(activeUserId);
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Revanche impossible' : 'Rematch failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept(challengeId: string) {
        if (!activeUserId) return;
        setLoading(true);
        setError('');
        try {
            const accepted = await api.acceptChallenge(challengeId, activeUserId);
            setArmedDuelId(accepted.duel.id);
            const room = await api.getDuelRoom(accepted.duel.id, activeUserId);
            setRoomState(room.room);
            setRoomReady(false);
            addRoomEvent(isFr ? '✓ Duel verrouillé, salon ouvert.' : '✓ Duel locked, room open.');
            await loadChallenges(activeUserId);
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Acceptation impossible' : 'Accept failed'));
        } finally {
            setLoading(false);
        }
    }

    async function handleDecline(challengeId: string) {
        if (!activeUserId) return;
        setLoading(true);
        setError('');
        try {
            await api.declineChallenge(challengeId, activeUserId);
            await loadChallenges(activeUserId);
        } catch (e) {
            setError(e instanceof Error ? e.message : (isFr ? 'Refus impossible' : 'Decline failed'));
        } finally {
            setLoading(false);
        }
    }

    const incoming = pending.filter((c) => c.direction === 'incoming');
    const outgoing = pending.filter((c) => c.direction === 'outgoing');
    const opponentReady = !!(roomState && opponentId && roomState.readyBy?.[opponentId]);
    const incomingFromActiveOpponent = incoming.find((challenge) => challenge.challengerId === opponentId);
    const outgoingToActiveOpponent = outgoing.find((challenge) => challenge.opponentId === opponentId);
    const opponentSignal = armedDuelId
        ? (opponentReady ? (isFr ? 'READY confirme' : 'READY confirmed') : (isFr ? 'Connexion salon...' : 'Joining room...'))
        : incomingFromActiveOpponent
            ? (isFr ? 'Adversaire pret (defi entrant)' : 'Opponent ready (incoming challenge)')
            : outgoingToActiveOpponent
                ? (isFr ? 'En attente de sa reponse' : 'Waiting for opponent response')
                : (isFr ? 'Aucun signal de duel' : 'No duel signal yet');
    const roomHint = !opponentId
        ? (isFr ? 'Selectionne d abord un adversaire pour activer le salon READY.' : 'Select an opponent first to enable the READY room.')
        : countdown != null
            ? (isFr ? `Lancement auto dans ${countdown}...` : `Auto-launch in ${countdown}...`)
            : armedDuelId && roomReady && !opponentReady
                ? (isFr ? 'Ton rival rejoint le salon, reste READY.' : 'Your rival is joining the room, stay READY.')
                : incomingFromActiveOpponent
                    ? (isFr ? 'Defi entrant detecte: verrouille puis lance quand tu es READY.' : 'Incoming challenge detected: lock it, then launch when READY.')
                    : outgoingToActiveOpponent
                        ? (isFr ? 'Defi envoye: attends sa reponse ou lance un duel instantane.' : 'Challenge sent: wait for response or launch instant duel.')
                        : (isFr ? 'Envoie un defi ou colle une invitation pour amorcer le salon.' : 'Send a challenge or paste an invite to start the room.');

    const draftFields: Array<{ key: keyof DraftPlan; title: string }> = [
        { key: 'challenger', title: isFr ? 'Toi' : 'You' },
        { key: 'opponent', title: isFr ? 'Adversaire' : 'Opponent' },
    ];

    function updateDraftSide(side: keyof DraftPlan, field: keyof DraftSide, value: DraftGameId) {
        setDraft((current) => {
            const next = {
                ...current,
                [side]: {
                    ...current[side],
                    [field]: value,
                },
            } as DraftPlan;
            if (next[side].ban === next[side].pick) {
                const alt = DRAFT_GAMES.find((game) => game.id !== value)?.id ?? value;
                next[side].pick = alt;
            }
            return next;
        });
    }

    // Status ribbon computation
    const computeRoomStatus = (): { label: string; className: string } => {
        if (!armedDuelId) {
            return { label: isFr ? 'AUCUN DUEL' : 'NO DUEL', className: '' };
        }
        if (countdown !== null) {
            return { label: isFr ? `COUNTDOWN: ${countdown}` : `COUNTDOWN: ${countdown}`, className: styles.countdown };
        }
        if (roomReady && opponentReady) {
            return { label: isFr ? 'LES DEUX READY !' : 'BOTH READY!', className: styles.ready };
        }
        if (roomReady) {
            return { label: isFr ? 'TU ES READY' : 'YOU READY', className: styles.ready };
        }
        if (opponentReady) {
            return { label: isFr ? 'ADVERSAIRE READY' : 'OPPONENT READY', className: styles.ready };
        }
        return { label: isFr ? 'VERROUILLE, ATTENTE' : 'LOCKED, WAITING', className: styles.locked };
    };

    return (
        <section className={styles.panel}>
            <div className={styles.head}>
                <div>
                    <h2 className={styles.title}>Friend Duel</h2>
                    <p className={styles.sub}>{isFr ? 'Mode partage stable pour jouer vite avec tes potes en duel 1v1.' : 'Stable shareable mode to run fast 1v1 duels with friends.'}</p>
                    <p className={styles.meta}>{isFr ? 'Difficulte globale' : 'Global difficulty'}: {getDifficultyLabel(difficultyMode, isFr)} · {isFr ? 'Mise max ici' : 'Max stake here'}: SLAP$ {stakeCap}</p>
                </div>
                <span className={styles.kpi}>{rivalryWins}</span>
            </div>

            <div className={styles.form}>
                <div className={styles.messageField}>
                    <div className={styles.roomCard}>
                        <div className={styles.roomHead}>
                            <strong>{isFr ? 'Salon 1v1' : '1v1 Ready Room'}</strong>
                            <span>{armedDuelId ? `${isFr ? 'Verrou' : 'Lock'}: ${armedDuelId.slice(0, 8)}` : (isFr ? 'Aucun duel verrouille' : 'No duel locked')}</span>
                        </div>
                        <div className={styles.roomSignals}>
                            <span className={styles.signal}>{isFr ? 'Toi' : 'You'}: {roomReady ? (isFr ? 'Pret' : 'Ready') : (isFr ? 'Pas pret' : 'Not ready')}</span>
                            <span className={styles.signal}>{isFr ? 'Adversaire' : 'Opponent'}: {opponentSignal}</span>
                            {countdown != null && <span className={`${styles.signal} ${styles.signalHot}`}>{isFr ? 'Countdown' : 'Countdown'}: {countdown}</span>}
                        </div>
                        {(() => {
                            const status = computeRoomStatus();
                            return (
                                <>
                                    <div className={styles.roomStatusRibbon}>
                                        <span className={`${styles.roomStatus} ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    {roomEvents.length > 0 && (
                                        <div className={styles.roomEventLog}>
                                            {roomEvents.map((evt, idx) => (
                                                <div key={idx} className={styles.roomEventItem}>
                                                    <span className={styles.roomEventTime}>{evt.time}</span>
                                                    <span>{evt.event}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        <p className={styles.roomHint}>{roomHint}</p>
                        <div className={styles.roomActions}>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!armedDuelId || !activeUserId) {
                                        setRoomReady((v) => !v);
                                        return;
                                    }
                                    const next = !roomReady;
                                    setLoading(true);
                                    setError('');
                                    try {
                                        const response = await api.setDuelReady(armedDuelId, activeUserId, next);
                                        setRoomState(response.room);
                                        setRoomReady(next);
                                        addRoomEvent(next ? (isFr ? '✓ Tu es READY!' : '✓ You are READY!') : (isFr ? '✗ Tu as retire READY.' : '✗ You unset READY.'));
                                    } catch (e) {
                                        setError(e instanceof Error ? e.message : (isFr ? 'READY impossible' : 'READY failed'));
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading || !opponentId}
                            >
                                {roomReady ? (isFr ? 'Retirer mon READY' : 'Unset READY') : (isFr ? 'Je suis READY' : 'I am READY')}
                            </button>
                            {incomingFromActiveOpponent && !armedDuelId && (
                                <button type="button" className={styles.mainAction} onClick={() => handleAccept(incomingFromActiveOpponent.id)} disabled={loading}>
                                    {isFr ? 'Verrouiller le duel' : 'Lock this duel'}
                                </button>
                            )}
                            {armedDuelId && (
                                <button type="button" className={styles.mainAction} onClick={handlePlayArmedDuel} disabled={loading || !roomReady || !opponentReady}>
                                    {countdown != null
                                        ? (isFr ? `Auto start (${countdown})` : `Auto start (${countdown})`)
                                        : (isFr ? 'Lancer maintenant' : 'Launch now')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <label className={styles.messageField}>
                    {isFr ? 'Creer un joueur rival' : 'Create rival player'}
                    <div className={styles.inlineCreate}>
                        <input
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            maxLength={20}
                            placeholder={isFr ? 'Nom du nouveau joueur' : 'Enter new player name'}
                        />
                        <button onClick={handleCreateRival} disabled={loading || !activeUserId || !newPlayerName.trim()}>
                            {isFr ? 'Ajouter' : 'Add'}
                        </button>
                    </div>
                </label>

                <div className={styles.messageField}>
                    <div className={styles.draftHeader}>
                        <strong>{isFr ? 'Draft ban / pick' : 'Ban / pick draft'}</strong>
                        <span>
                            {isFr
                                ? '6 jeux distincts. Premier a 2 manches, avec une belle uniquement si necessaire.'
                                : '6 distinct games. First to 2 rounds, with a decider only when needed.'}
                        </span>
                    </div>
                    <div className={styles.gameRoster}>
                        {DRAFT_GAMES.map((game) => (
                            <article key={game.id} className={styles.gameRosterCard}>
                                <strong>{isFr ? game.labelFr : game.labelEn}</strong>
                                <span className={styles.gameSkill}>{isFr ? game.skillFr : game.skillEn}</span>
                                <p>{isFr ? game.ruleFr : game.ruleEn}</p>
                            </article>
                        ))}
                    </div>
                    <div className={styles.draftGrid}>
                        {draftFields.map((entry) => (
                            <div key={entry.key} className={styles.draftCard}>
                                <h4>{entry.title}</h4>
                                <label>
                                    {isFr ? 'Ban' : 'Ban'}
                                    <select
                                        value={draft[entry.key].ban}
                                        onChange={(e) => updateDraftSide(entry.key, 'ban', e.target.value as DraftGameId)}
                                    >
                                        {DRAFT_GAMES.map((game) => (
                                            <option key={game.id} value={game.id}>
                                                {isFr ? game.labelFr : game.labelEn}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    {isFr ? 'Pick' : 'Pick'}
                                    <select
                                        value={draft[entry.key].pick}
                                        onChange={(e) => updateDraftSide(entry.key, 'pick', e.target.value as DraftGameId)}
                                    >
                                        {DRAFT_GAMES.map((game) => (
                                            <option key={game.id} value={game.id} disabled={game.id === draft[entry.key].ban}>
                                                {isFr ? game.labelFr : game.labelEn}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        ))}
                    </div>
                    <p className={styles.draftHint}>
                        {isFr
                            ? 'Chaque joueur bannit un jeu et en favorise un. Les jeux restants composent une serie sans doublon.'
                            : 'Each player bans one game and favors one. The remaining games form a duplicate-free series.'}
                    </p>
                </div>

                <label>
                    {isFr ? 'Adversaire' : 'Opponent'}
                    <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
                        {opponents.length === 0 && <option value="">{isFr ? 'Aucun autre joueur' : 'No other players'}</option>}
                        {opponents.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.playerName} (SLAP$ {Number(u.wallet ?? 0).toFixed(2)})
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    {isFr ? 'Mise' : 'Stake'}
                    <select value={stake} onChange={(e) => setStake(Number(e.target.value))}>
                        {cappedStakes.map((s) => (
                            <option key={s} value={s} disabled={s > safeWallet}>
                                {isFr ? 'SLAP$' : 'SLAP$'} {s}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.messageField}>
                    {isFr ? 'Message (optionnel)' : 'Message (optional)'}
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={140}
                        placeholder={isFr ? 'Pret pour un duel ?' : 'Ready for a duel?'}
                    />
                </label>

                <div className={styles.actions}>
                    <button onClick={handleSendChallenge} disabled={loading || !activeUserId || !opponentId || stake > safeWallet || stake > stakeCap}>
                        {isFr ? 'Envoyer Defi' : 'Send Challenge'}
                    </button>
                    <button className={styles.main} onClick={handleInstantDuel} disabled={loading || !activeUserId || !opponentId || stake > safeWallet || stake > stakeCap}>
                        {isFr ? 'Duel Instantane (sans salon)' : 'Instant Duel (skip room)'}
                    </button>
                </div>
            </div>

            {inviteNotice && <div className={styles.inviteNotice}>{inviteNotice}</div>}

            {error && <p className={styles.error}>{error}</p>}

            {lastResult && (
                <div className={styles.result}>
                    <strong>{lastResult.winnerId === activeUserId ? (isFr ? 'Tu as gagne' : 'You won') : (isFr ? 'Tu as perdu' : 'You lost')}</strong>
                    <span>{formatNet(lastResult, activeUserId)}</span>
                    <span>{isFr ? 'ID Duel' : 'Duel ID'}: {lastResult.duel.id.slice(0, 8)}</span>
                    {Array.isArray(lastResult.games) && lastResult.games.length > 0 && (
                        <span>{isFr ? 'Pool joue' : 'Games played'}: {lastResult.games.map((gameId) => labelGame(gameId, isFr)).join(' · ')}</span>
                    )}
                    {lastResult.draftSummary && <span>{lastResult.draftSummary}</span>}
                    {Array.isArray(lastResult.rounds) && lastResult.rounds.length > 0 && (
                        <div className={styles.roundsPlayed}>
                            {lastResult.rounds.map((round) => (
                                <span key={`${round.round}-${round.gameId}`} className={styles.roundPill}>
                                    {isFr ? 'M' : 'R'}{round.round} · {labelGame(round.gameId, isFr)}
                                    {typeof round.challengerMetric === 'number' && typeof round.opponentMetric === 'number'
                                        ? ` · ${round.challengerMetric}-${round.opponentMetric}`
                                        : ''}
                                    {round.winner
                                        ? ` · ${
                                            (round.winner === 'CHALLENGER') === (lastResult.duel.challengerId === activeUserId)
                                                ? (isFr ? 'Gagnee' : 'Won')
                                                : (isFr ? 'Perdue' : 'Lost')
                                        }`
                                        : ''}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className={styles.resultActions}>
                        <button type="button" className={styles.rematchBtn} onClick={handleRematch} disabled={loading}>
                            {isFr ? 'Revanche Immediate' : 'Instant Rematch'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.columns}>
                <div>
                    <h3>{isFr ? 'Entrants' : 'Incoming'}</h3>
                    {incoming.length === 0 && <p className={styles.empty}>{isFr ? 'Aucun defi entrant.' : 'No incoming challenges.'}</p>}
                    {incoming.map((c) => (
                        <article key={c.id} className={styles.challenge}>
                            <div>
                                <strong>{c.challengerName || c.challengerId}</strong>
                                <span>{isFr ? 'Mise' : 'Stake'} SLAP$ {c.stake}</span>
                                {c.message && <p className={styles.challengeMessage}>{c.message}</p>}
                            </div>
                            <div className={styles.inlineActions}>
                                <button onClick={() => handleAccept(c.id)} disabled={loading}>{isFr ? 'Accepter (verrouiller)' : 'Accept (lock duel)'}</button>
                                <button onClick={() => handleDecline(c.id)} disabled={loading}>{isFr ? 'Refuser' : 'Decline'}</button>
                            </div>
                        </article>
                    ))}
                </div>

                <div>
                    <h3>{isFr ? 'Sortants' : 'Outgoing'}</h3>
                    {outgoing.length === 0 && <p className={styles.empty}>{isFr ? 'Aucun defi sortant.' : 'No outgoing challenges.'}</p>}
                    {outgoing.map((c) => (
                        <article key={c.id} className={styles.challenge}>
                            <div>
                                <strong>{isFr ? 'Vers' : 'To'} {c.opponentName || c.opponentId}</strong>
                                <span>{isFr ? 'Mise' : 'Stake'} SLAP$ {c.stake}</span>
                                {c.message && <p className={styles.challengeMessage}>{c.message}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
