import styles from './Ticker.module.css';
import { useGameStore } from '../../hooks/useGameStore';

const TICKER_TEXT_EN =
    'KENZO clapped RICO for SLAP$ 10 • DARIA keeps a 4-win streak • POT LIVE: SLAP$ 87 • API BATTLE MODE ACTIVE • ';

const TICKER_TEXT_FR =
    'KENZO a gifle RICO pour SLAP$ 10 • DARIA garde une serie de 4 victoires • POT LIVE : SLAP$ 87 • MODE BATTLE API ACTIF • ';

export function Ticker() {
    const language = useGameStore((s) => s.language);
    // Double the text so the scroll loop is seamless
    const content = (language === 'fr' ? TICKER_TEXT_FR : TICKER_TEXT_EN).repeat(4);
    return (
        <div className={styles.ticker}>
            <div className={styles.inner}>{content}</div>
        </div>
    );
}
