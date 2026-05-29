import styles from './Lobby.module.css';
import { useGameStore } from '../../hooks/useGameStore';

export function Lobby() {
    const { setActiveTab, language } = useGameStore();
    const isFr = language === 'fr';
    return (
        <section className={styles.lobby}>
            <div className={styles.card}>
                <span className={styles.label}>{isFr ? 'Heberger Une Session' : 'Host A Session'}</span>
                <h3>{isFr ? 'Joue avec tes amis sur ton serveur' : 'Play with friends on your server'}</h3>
                <p>{isFr ? 'Connecte-toi une fois, cree ton profil, puis invite tes amis avec un lien.' : 'Connect once, create your player profile, then invite friends with one link.'}</p>
                <div className={styles.row}>
                    <button className={styles.btnMain}>{isFr ? 'Heberger' : 'Host Now'}</button>
                    <button>{isFr ? 'Copier Mon Lien' : 'Copy My Invite'}</button>
                </div>
            </div>
            <div className={styles.card}>
                <span className={styles.label}>{isFr ? 'Rejoindre Un Ami' : 'Join A Friend'}</span>
                <h3>{isFr ? 'Colle le lien et entre direct' : 'Paste invite link and jump in'}</h3>
                <p>{isFr ? 'Utilise un lien complet envoye par un ami puis commence a te battre instantanement.' : 'Use a full invite URL copied by a friend, then start battling instantly.'}</p>
                <div className={styles.row}>
                    <input type="text" placeholder={isFr ? 'Colle le lien ici' : 'Paste invite link here'} style={{ flex: 1, minWidth: 160 }} />
                    <button className={styles.btnMain} onClick={() => setActiveTab('defy')}>{isFr ? 'Rejoindre' : 'Join'}</button>
                </div>
            </div>
        </section>
    );
}
