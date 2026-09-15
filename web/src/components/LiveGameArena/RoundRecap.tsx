import { ArrowRight, Swords, Trophy } from 'lucide-react';
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
    const target = Math.ceil(match.bestOf / 2);
    if(round.gameId==='chroma') {
        const ids=[userId,match.challengerId===userId?match.opponentId:match.challengerId];
        const totals=ids.map(id=>Math.abs(round.moment?.scores[id]||0)/1000);
        return <section className={styles.clubRecap} data-focus="true" data-testid="round-recap" data-won={won}>
            <div className={styles.meta}><span>CHROMA</span><span>{isFr?'MANCHE':'ROUND'} {round.round} / BO{match.bestOf}</span></div>
            <div className={styles.clubPlayers}><div><ClubAvatar variant={avatar}/><span>{isFr?'TOI':'YOU'}</span><strong>{match.score[own]}</strong></div><b>VS</b><div><ClubAvatar rival/><span>{match.opponentName}</span><strong>{match.score[rival]}</strong></div></div>
            <h2>{won?(isFr?'Tu avais l oeil.':'You had the eye.'):(isFr?'Pas la meme nuance.':'A shade off.')}</h2>
            {round.moment&&!round.moment.summary.includes('forfeit')&&<p>{totals[0].toFixed(1)} / {totals[1].toFixed(1)} · {isFr?'ecart RVB cumule':'total RGB error'}</p>}
            {round.moment&&<RoundEvidence moment={round.moment} userId={userId} isFr={isFr}/>}
            {!final&&<div className={styles.next}><span>{isFr?'A SUIVRE':'UP NEXT'}</span><strong>{gameLabel(match.games[match.currentRound-1],isFr)}</strong></div>}
            <button type="button" onClick={onContinue}>{final?(isFr?'Voir le resultat':'See result'):(isFr?'Manche suivante':'Next round')}<ArrowRight size={20}/></button>
        </section>;
    }
    return <section className={styles.recap} data-won={won} data-testid="round-recap" key={`${match.duelId}-${round.round}`}>
        <div className={styles.meta}><span>{gameLabel(round.gameId, isFr)}</span><span>{final ? 'MATCH POINT' : `ROUND ${String(round.round).padStart(2, '0')}`}</span></div>
        <div className={styles.medal}>{won ? <Trophy size={42} strokeWidth={1.5} /> : <Swords size={42} strokeWidth={1.5} />}</div>
        <p>{final ? (isFr ? 'PARTIE TERMINEE' : 'MATCH COMPLETE') : (isFr ? 'MANCHE TERMINEE' : 'ROUND COMPLETE')}</p>
        <h2>{won ? (isFr ? final ? 'Le duel est a toi.' : 'Un point pour toi.' : final ? 'This one is yours.' : 'Your point.') : (isFr ? final ? 'La revanche t’attend.' : 'Rien n’est joue.' : final ? 'Time for a rematch.' : 'Still in the game.')}</h2>
        <div className={styles.score}>
            <div><span>{isFr ? 'TOI' : 'YOU'}</span><strong>{match.score[own]}</strong><div className={styles.marks}>{Array.from({ length: target }, (_, i) => <i key={i} data-filled={i < match.score[own]} />)}</div></div>
            <span>BO{match.bestOf}</span>
            <div><span>{match.opponentName}</span><strong>{match.score[rival]}</strong><div className={styles.marks}>{Array.from({ length: target }, (_, i) => <i key={i} data-filled={i < match.score[rival]} />)}</div></div>
        </div>
        {round.moment && <RoundEvidence moment={round.moment} userId={userId} isFr={isFr}/>}
        {!final && <div className={styles.next}><span>{isFr ? 'A SUIVRE' : 'UP NEXT'}</span><strong>{gameLabel(match.games[match.currentRound - 1], isFr)}</strong></div>}
        <button type="button" onClick={onContinue}>{final ? (isFr ? 'Voir le resultat' : 'See result') : (isFr ? 'Manche suivante' : 'Next round')}<ArrowRight size={20} /></button>
    </section>;
}
