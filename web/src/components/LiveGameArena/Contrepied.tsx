import { useState } from 'react';
import { Check, Diamond, LockKeyhole, Send, Trophy } from 'lucide-react';
import type { PartyState } from '../../gameplay/party';
import styles from './Contrepied.module.css';

export function Contrepied({ party, identity, active, isFr, send }: {
    party: PartyState; identity: string; active: boolean; isFr: boolean;
    send: (action: string, data?: { card: number }) => void;
}) {
    const [choice, setChoice] = useState<number | null>(null);
    const game = party.contrepied;
    if (!game) return null;
    const participant = Boolean(game.hands[identity]);
    const self = participant ? identity : Object.keys(game.hands)[0];
    const rival = Object.keys(game.hands).find((id) => id !== self) || '';
    const rivalLabel = game.botId === rival ? (isFr ? 'BOT D ENTRAINEMENT' : 'PRACTICE BOT') : 'RIVAL';
    const locked = party.answered.includes(identity);
    const revealing = ['reveal', 'done'].includes(party.phase);
    const enabled = active && participant && party.phase === 'choose' && !locked;
    const selected = game.selected ?? choice;
    const result = revealing ? game.history[game.history.length - 1] : undefined;
    const ownScore = party.scores[self] || 0;
    const rivalScore = rival === game.botId ? game.botScore : party.scores[rival] || 0;
    const ownLabel = participant ? (isFr ? 'TOI' : 'YOU') : (isFr ? 'JOUEUR 1' : 'PLAYER 1');
    return <section className={styles.game} data-testid="contrepied" data-phase={party.phase}>
        <header><span>{game.botId ? (isFr ? 'ENTRAINEMENT CONTRE UN BOT' : 'PRACTICE AGAINST A BOT') : (isFr ? 'CHOIX SIMULTANES' : 'SIMULTANEOUS PICKS')}</span><b>{Math.ceil(party.remaining / 1000)}<small> s</small></b></header>
        <ol className={styles.rewards} aria-label={isFr ? 'Ordre des recompenses' : 'Reward order'}>
            {game.rewards.map((reward, index) => <li key={index} data-current={index === party.attempt - 1} data-past={index < party.attempt - 1}><small>0{index + 1}</small><span><Diamond size={12} />{reward}</span></li>)}
        </ol>
        <div className={styles.scores}><span>{ownLabel}<b>{ownScore}</b></span><span>{rivalLabel}<b>{rivalScore}</b></span></div>
        <div className={styles.table} data-reveal={revealing}>
            <div className={styles.played} data-side="self" data-expired={result?.expired.includes(self)}><PlayingCard value={result?.cards[self] ?? (participant ? selected : null)} hidden={!revealing && !participant} /><span>{ownLabel}{result?.expired.includes(self) ? (isFr ? ' · EXPIRE' : ' · EXPIRED') : ''}</span></div>
            <div className={styles.prize}><Trophy size={20} /><strong>{game.rewards[party.attempt - 1] || '-'}</strong><span>{isFr ? 'POINTS' : 'POINTS'}</span></div>
            <div className={styles.played} data-side="rival" data-expired={result?.expired.includes(rival)}><PlayingCard value={result?.cards[rival]} hidden={!revealing} /><span>{rivalLabel}{result?.expired.includes(rival) ? (isFr ? ' · EXPIRE' : ' · EXPIRED') : ''}</span></div>
        </div>
        <p className={styles.outcome} role="status">{result ? result.winnerId === null ? (isFr ? 'Egalite. Recompense defaussee.' : 'Tie. Reward discarded.') : result.winnerId === self ? (isFr ? `+${result.reward} pour toi.` : `+${result.reward} for you.`) : (isFr ? `+${result.reward} pour l adversaire.` : `+${result.reward} for your opponent.`) : locked ? (isFr ? 'Carte verrouillee. Au rival de jouer.' : 'Card locked. Waiting for your opponent.') : (isFr ? 'Quelle carte sacrifies-tu ?' : 'Which card will you spend?')}{result?.expired.length ? (isFr ? ' Carte expiree consommee.' : ' Timed-out card consumed.') : ''}</p>
        {participant && <>
            <div className={styles.hand} role="group" aria-label={isFr ? 'Tes cartes' : 'Your cards'}>
                {[1, 2, 3, 4, 5].map((card) => <button key={card} type="button" data-selected={selected === card} data-used={!game.hands[self].includes(card)} disabled={!enabled || !game.hands[self].includes(card)} aria-pressed={selected === card} aria-label={`${isFr ? 'Carte' : 'Card'} ${card}`} onClick={() => setChoice(card)}><small>{card}</small><Diamond size={16} /><strong>{card}</strong></button>)}
            </div>
            <button type="button" className={styles.commit} disabled={!enabled || selected == null || !game.hands[self].includes(selected)} onClick={() => { if (selected != null) send('commit', { card: selected }); }}>{locked ? <Check size={18} /> : <Send size={18} />}{locked ? (isFr ? 'Carte verrouillee' : 'Card locked') : (isFr ? 'Engager la carte' : 'Commit card')}</button>
        </>}
        <div className={styles.opponentHand} aria-label={isFr ? 'Cartes restantes adverses' : 'Opponent remaining cards'}><span>{rivalLabel}</span>{[1, 2, 3, 4, 5].map((card) => <b key={card} data-used={!game.hands[rival]?.includes(card)}>{card}</b>)}</div>
        {game.history.length > 0 && <ol className={styles.history} aria-label={isFr ? 'Echanges termines' : 'Completed exchanges'}>{game.history.map((entry) => <li key={entry.exchange}><small>0{entry.exchange}</small><b>{entry.cards[self]} : {entry.cards[rival]}</b><span>{entry.winnerId === self ? '+' : entry.winnerId === null ? '' : '-'}{entry.winnerId === null ? '0' : entry.reward}</span></li>)}</ol>}
    </section>;
}

function PlayingCard({ value, hidden = false }: { value?: number | null; hidden?: boolean }) {
    return <div className={styles.card} data-hidden={hidden || value == null}>{hidden || value == null ? <LockKeyhole size={24} /> : <><small>{value}</small><Diamond size={19} /><strong>{value}</strong></>}</div>;
}
