import { Ban, Check, ShieldCheck } from 'lucide-react';
import type { GameVeto as VetoState } from '../../api/client';
import { COMPETITIVE_GAMES, gameLabel } from '../../gameplay/catalog';
import styles from './GameVeto.module.css';
import { GamePoster } from '../LiveGameArena/GamePoster';

interface Props {
    veto: VetoState;
    userId: string;
    isFr: boolean;
    busy: boolean;
    games: string[];
    tournament?: boolean;
    onBan: (id: string) => void;
}

export function GameVeto({ veto, userId, isFr, busy, games, tournament, onBan }: Props) {
    const selected = veto.votes[userId];
    return <section className={styles.draft} aria-label={isFr ? 'Bannissement des jeux' : 'Game veto'} data-testid="game-veto">
        <header><div><span>01 / DRAFT</span><h3>{isFr ? 'Pas sur mon terrain.' : 'Not on my turf.'}</h3></div><Ban size={24} /></header>
        <p>{tournament ? (isFr ? 'Un vote chacun. Le jeu le plus vote est exclu. Egalite : ordre du catalogue.' : 'One vote each. The most voted game is excluded. Ties use catalogue order.') : (isFr ? 'Un bannissement chacun. Les deux jeux sont exclus de la rotation.' : 'One ban each. Both games are removed from the rotation.')}</p>
        <div className={styles.games}>
            {COMPETITIVE_GAMES.map((game) => <button type="button" key={game.id} data-selected={selected === game.id} data-banned={veto.banned.includes(game.id)} disabled={busy} aria-pressed={selected === game.id} onClick={() => onBan(game.id)} aria-label={`${isFr ? 'Bannir' : 'Ban'} ${gameLabel(game.id, isFr)}`}>
                <span className={styles.tile}><GamePoster gameId={game.id}/>{veto.banned.includes(game.id)&&<Ban size={26}/>}</span><span>{gameLabel(game.id, isFr)}</span>{selected === game.id && <Check size={15}/>}
                {tournament && <small>{Object.values(veto.votes).filter((id) => id === game.id).length || ''}</small>}
            </button>)}
        </div>
        <footer role="status"><ShieldCheck size={18} /><span>{veto.complete ? (isFr ? 'Rotation verrouillable' : 'Rotation ready') : selected ? (isFr ? 'Choix enregistre. En attente des autres joueurs.' : 'Choice saved. Waiting for the other players.') : (isFr ? 'Choisis le jeu a exclure.' : 'Choose the game to exclude.')}</span></footer>
        {veto.complete && <ol className={styles.rotation}>{games.map((id, index) => <li key={`${id}-${index}`}><small>0{index + 1}</small>{gameLabel(id, isFr)}</li>)}</ol>}
    </section>;
}
