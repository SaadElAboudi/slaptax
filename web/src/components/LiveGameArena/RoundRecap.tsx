import { ArrowRight } from 'lucide-react';
import type { LiveDuelMatch, LiveDuelRound } from '../../api/client';
import { gameLabel } from '../../gameplay/catalog';
import styles from './RoundRecap.module.css';
import { RoundEvidence } from './RoundEvidence';
import { ClubAvatar } from '../ClubAvatar/ClubAvatar';
import { useGameStore } from '../../hooks/useGameStore';

export function RoundRecap({ match, round, userId, isFr, onContinue }: { match: LiveDuelMatch; round: LiveDuelRound; userId: string; isFr: boolean; onContinue: () => void }) {
    const avatar=useGameStore(state=>state.progression?.cosmetics.avatar);
    const own = match.challengerId === userId ? 'challenger' : 'opponent';
    const rival = own === 'challenger' ? 'opponent' : 'challenger';
    const won = round.winnerId === userId;
    const final = match.status === 'done';
    const ids=[userId,match.challengerId===userId?match.opponentId:match.challengerId];
    const totals=ids.map(id=>Math.abs(round.moment?.scores[id]||0)/1000);
    return <section className={styles.clubRecap} data-focus="true" data-testid="round-recap" data-won={won}>
        <div className={styles.meta}><span>{gameLabel(round.gameId, isFr)}</span><span>{isFr?'MANCHE':'ROUND'} {round.round} / BO{match.bestOf}</span></div>
        <div className={styles.clubPlayers}><div><ClubAvatar variant={avatar}/><span>{isFr?'TOI':'YOU'}</span><strong>{match.score[own]}</strong></div><b>VS</b><div><ClubAvatar rival/><span>{match.opponentName}</span><strong>{match.score[rival]}</strong></div></div>
        <h2>{round.gameId==='chroma'&&!round.moment?.summary.includes('forfeit') ? (won?(isFr?'Tu avais l oeil.':'You had the eye.'):(isFr?'Pas la meme nuance.':'A shade off.')) : (won?(isFr?'Un point pour toi.':'Your point.'):(isFr?'Le rival marque.':'Your rival scores.'))}</h2>
        {round.gameId==='chroma'&&round.moment&&!round.moment.summary.includes('forfeit')&&<p>{totals[0].toFixed(1)} / {totals[1].toFixed(1)} · {isFr?'ecart RVB cumule':'total RGB error'}</p>}
        {round.moment&&<RoundEvidence moment={round.moment} userId={userId} isFr={isFr}/>}
        {!final&&<div className={styles.next}><span>{isFr?'A SUIVRE':'UP NEXT'}</span><strong>{gameLabel(match.games[match.currentRound-1],isFr)}</strong></div>}
        <button type="button" onClick={onContinue}>{final?(isFr?'Voir le resultat':'See result'):(isFr?'Manche suivante':'Next round')}<ArrowRight size={20}/></button>
    </section>;
}
