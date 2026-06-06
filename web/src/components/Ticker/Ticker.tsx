import styles from './Ticker.module.css';
import { useGameStore } from '../../hooks/useGameStore';

function labelTab(tab: ReturnType<typeof useGameStore.getState>['activeTab'], isFr: boolean): string {
    const labels = {
        bounce: 'Bounce Panic',
        symbolrush: 'Symbol Sprint',
        bomb: 'Bomb Pass',
        cups: 'Cup Shuffle',
        duelnumeric: isFr ? 'Duel Numeric' : 'Duel Numeric',
        defy: isFr ? 'Duel Ami' : 'Friend Duel',
        tournament: isFr ? 'Tournoi' : 'Tournament',
        leaderboard: isFr ? 'Classement' : 'Leaderboard',
        analytics: isFr ? 'Analytics' : 'Analytics',
        stats: isFr ? 'Historique' : 'History',
    };
    return labels[tab];
}

export function Ticker() {
    const { language, activeTab, difficultyMode, lastNet, stake, wallet, apiOnline, playerName } = useGameStore();
    const isFr = language === 'fr';
    const safeStake = Number(stake ?? 0);
    const safeWallet = Number(wallet ?? 0);
    const pressure = safeStake <= 0 ? (isFr ? 'CALME' : 'LOW') : safeWallet / safeStake < 2 ? (isFr ? 'PRESSION MAX' : 'HIGH PRESSURE') : safeWallet / safeStake < 4 ? (isFr ? 'ZONE CHAUDE' : 'HEAT ZONE') : (isFr ? 'SOUS CONTROLE' : 'UNDER CONTROL');
    const messages = [
        isFr ? `${playerName.toUpperCase()} sous les spots` : `${playerName.toUpperCase()} under the lights`,
        isFr ? `FOCUS ARENE : ${labelTab(activeTab, true)}` : `ARENA FOCUS: ${labelTab(activeTab, false)}`,
        isFr ? `PRESSION : ${pressure}` : `PRESSURE: ${pressure}`,
        isFr ? `MISE ACTIVE : SLAP$ ${safeStake.toFixed(2)}` : `LIVE STAKE: SLAP$ ${safeStake.toFixed(2)}`,
        lastNet == null
            ? (isFr ? 'DERNIER NET : AUCUN RESULTAT' : 'LAST NET: NO RESULT')
            : `${isFr ? 'DERNIER NET' : 'LAST NET'}: ${lastNet >= 0 ? '+' : ''}SLAP$ ${lastNet.toFixed(2)}`,
        apiOnline ? (isFr ? 'SERVEUR LIVE VERROUILLE' : 'SERVER LIVE LOCKED') : (isFr ? 'SERVEUR HORS LIGNE' : 'SERVER OFFLINE'),
        isFr ? `REGIME : ${difficultyMode.toUpperCase()}` : `MODE: ${difficultyMode.toUpperCase()}`,
    ];
    const content = `${messages.join(' • ')} • `.repeat(3);

    return (
        <div className={styles.ticker}>
            <div className={styles.inner}>{content}</div>
        </div>
    );
}
