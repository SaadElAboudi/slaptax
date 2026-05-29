import { useEffect, useMemo, useState } from 'react';
import styles from './FriendDuelPanel.module.css';
import { api, type Challenge, type PlayP2PResponse, type UserListEntry } from '../../api/client';
import { useGameStore } from '../../hooks/useGameStore';
import { getDifficultyLabel, getRiskStakeCap } from '../../gameplay/difficulty';

const STAKES = [2, 5, 10, 20];
const DRAFT_GAMES = [
    { id: 'precision', labelEn: 'Precision Rush', labelFr: 'Precision Rush' },
    { id: 'quickdraw', labelEn: 'Quickdraw', labelFr: 'Quickdraw' },
    { id: 'mindgame', labelEn: 'Mind Game', labelFr: 'Mental' },
    { id: 'speedsort', labelEn: 'Speed Sort', labelFr: 'Speed Sort' },
    { id: 'duelnumeric', labelEn: 'Duel Numeric', labelFr: 'Duel Numeric' },
] as const;

type DraftGameId = typeof DRAFT_GAMES[number]['id'];

interface DraftSide {
    ban: DraftGameId;
    pick: DraftGameId;
}

interface DraftPlan {
    challenger: DraftSide;
    opponent: DraftSide;
}

function formatNet(result: PlayP2PResponse | null, activeUserId: string | null): string {
    if (!result || !activeUserId) return '--';
    const didWin = result.winnerId === activeUserId;
    const net = didWin ? result.duel.stake * 0.7 : -result.duel.stake;
    return `${net >= 0 ? '+' : ''}SLAP$ ${net.toFixed(2)}`;
}

function labelGame(gameId: string, isFr: boolean): string {
    const labels: Record<string, string> = Object.fromEntries(
        DRAFT_GAMES.map((game) => [game.id, isFr ? game.labelFr : game.labelEn])
    );
    return labels[gameId] || gameId;
}

export function FriendDuelPanel() {
    const refreshLiveState = useGameStore((s) => s.refreshLiveState);
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
        challenger: { ban: 'mindgame', pick: 'precision' },
        opponent: { ban: 'speedsort', pick: 'quickdraw' },
    });
    const [rivalryWins, setRivalryWins] = useState<string>(isFr ? 'Pas encore de rivalite' : 'No rivalry data yet');
    const [lastResult, setLastResult] = useState<PlayP2PResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const opponents = useMemo(
        () => users.filter((u) => u.id !== activeUserId),
        [users, activeUserId]
    );

    async function loadChallenges(uid: string) {
        const data = await api.listChallenges(uid, 'pending');
        setPending(data.challenges ?? []);
    }

    async function loadUsersAndChallenges() {
        setError('');
        const data = await api.listUsers();
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
    }, [isFr]);

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

    async function handleAccept(challengeId: string) {
        if (!activeUserId) return;
        setLoading(true);
        setError('');
        try {
            const accepted = await api.acceptChallenge(challengeId, activeUserId);
            const played = await api.playP2PDuel(accepted.duel.id);
            setLastResult(played);
            await refreshLiveState();
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
                        <span>{isFr ? '5 jeux distincts, aucun doublon par ligne.' : '5 distinct games, no duplicate ban/pick on each side.'}</span>
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
                            ? 'Le draft sert de meta simple: tu coupes un point fort et tu pousses un jeu plus confortable.'
                            : 'Draft is the meta layer: cut a strength and push a comfortable game.'}
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
                        {isFr ? 'Duel Instantane' : 'Instant Duel'}
                    </button>
                </div>
            </div>

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
                                </span>
                            ))}
                        </div>
                    )}
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
                            </div>
                            <div className={styles.inlineActions}>
                                <button onClick={() => handleAccept(c.id)} disabled={loading}>{isFr ? 'Accepter et Jouer' : 'Accept and Play'}</button>
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
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
