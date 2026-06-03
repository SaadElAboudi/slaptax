import { useEffect, useMemo, useState } from 'react';
import styles from './Lobby.module.css';
import { api, type UserListEntry } from '../../api/client';
import { useGameStore } from '../../hooks/useGameStore';

const PENDING_INVITE_KEY = 'slaptax_pending_invite';

interface PendingInvitePayload {
    opponentId: string;
    stake?: number;
    message?: string;
    fromName?: string;
}

export function Lobby() {
    const { setActiveTab, language, userId, clientId } = useGameStore();
    const isFr = language === 'fr';
    const [users, setUsers] = useState<UserListEntry[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [inviteInput, setInviteInput] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        let cancelled = false;

        api.listUsers(userId, clientId)
            .then((data) => {
                if (cancelled) return;
                setUsers(data.users ?? []);
                setActiveUserId(data.activeUserId || null);
            })
            .catch(() => {
                if (cancelled) return;
                setStatus(isFr ? 'Impossible de charger les joueurs pour l invitation.' : 'Failed to load players for invite flow.');
            });

        return () => {
            cancelled = true;
        };
    }, [isFr, userId, clientId]);

    const activeUser = useMemo(
        () => users.find((user) => user.id === activeUserId) ?? null,
        [users, activeUserId]
    );

    function buildInviteUrl() {
        if (!activeUser) return '';
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'defy');
        url.searchParams.set('opponent', activeUser.id);
        url.searchParams.set('stake', String(activeUser.stake || 5));
        url.searchParams.set('from', activeUser.playerName);
        return url.toString();
    }

    async function handleCopyInvite() {
        const inviteUrl = buildInviteUrl();
        if (!inviteUrl) {
            setStatus(isFr ? 'Cree ou selectionne un joueur avant de partager.' : 'Create or select a player before sharing.');
            return;
        }

        try {
            await navigator.clipboard.writeText(inviteUrl);
            setStatus(isFr ? 'Lien d invitation copie. Envoie-le puis lance Duel Ami.' : 'Invite link copied. Share it, then open Friend Duel.');
        } catch {
            setStatus(inviteUrl);
        }
    }

    function parseInvitePayload(raw: string): PendingInvitePayload | null {
        try {
            const parsed = new URL(raw.trim());
            const opponentId = parsed.searchParams.get('opponent');
            if (!opponentId) return null;

            const stakeParam = Number(parsed.searchParams.get('stake') || 0);
            const fromName = parsed.searchParams.get('from') || undefined;
            return {
                opponentId,
                stake: Number.isFinite(stakeParam) && stakeParam > 0 ? stakeParam : undefined,
                fromName,
                message: fromName
                    ? (isFr ? `Invite recue de ${fromName}.` : `Invite received from ${fromName}.`)
                    : undefined,
            };
        } catch {
            return null;
        }
    }

    function handleJoinInvite() {
        const payload = parseInvitePayload(inviteInput);
        if (!payload) {
            setStatus(isFr ? 'Lien invalide. Colle une URL d invitation complete.' : 'Invalid link. Paste a full invite URL.');
            return;
        }

        try {
            localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(payload));
        } catch {
            setStatus(isFr ? 'Impossible de preparer le duel sur cet appareil.' : 'Could not prepare the duel on this device.');
            return;
        }

        setStatus(isFr ? 'Invitation chargee. Direction Duel Ami.' : 'Invite loaded. Heading to Friend Duel.');
        setActiveTab('defy');
    }

    return (
        <section className={styles.lobby}>
            <div className={styles.card}>
                <span className={styles.label}>{isFr ? 'Heberger Une Session' : 'Host A Session'}</span>
                <h3>{isFr ? 'Joue avec tes amis sur ton serveur' : 'Play with friends on your server'}</h3>
                <p>{isFr ? 'Connecte-toi une fois, cree ton profil, puis invite tes amis avec un lien.' : 'Connect once, create your player profile, then invite friends with one link.'}</p>
                {activeUser && (
                    <div className={styles.hostMeta}>
                        <span>{isFr ? 'Hote actif' : 'Live host'}: <strong>{activeUser.playerName}</strong></span>
                        <span>{isFr ? 'ID' : 'ID'}: {activeUser.id.slice(0, 8)}...</span>
                        <span>SLAP$ {Number(activeUser.wallet ?? 0).toFixed(2)}</span>
                    </div>
                )}
                <div className={styles.row}>
                    <button className={styles.btnMain} onClick={() => setActiveTab('defy')} type="button">{isFr ? 'Heberger' : 'Host Now'}</button>
                    <button className={styles.btnGhost} onClick={handleCopyInvite} type="button">{isFr ? 'Copier Mon Lien' : 'Copy My Invite'}</button>
                </div>
            </div>
            <div className={styles.card}>
                <span className={styles.label}>{isFr ? 'Rejoindre Un Ami' : 'Join A Friend'}</span>
                <h3>{isFr ? 'Colle le lien et entre direct' : 'Paste invite link and jump in'}</h3>
                <p>{isFr ? 'Utilise un lien complet envoye par un ami puis commence a te battre instantanement.' : 'Use a full invite URL copied by a friend, then start battling instantly.'}</p>
                <div className={styles.row}>
                    <input
                        type="text"
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder={isFr ? 'Colle le lien ici' : 'Paste invite link here'}
                        className={styles.linkInput}
                    />
                    <button className={styles.btnMain} onClick={handleJoinInvite} type="button">{isFr ? 'Rejoindre' : 'Join'}</button>
                </div>
                {status && <p className={styles.status}>{status}</p>}
            </div>
        </section>
    );
}
