import styles from './MobileAdvancedBtn.module.css';
import { useGameStore } from '../../hooks/useGameStore';

export function MobileAdvancedBtn() {
    const { mobileAdvancedOpen, toggleMobileAdvanced, language } = useGameStore();
    const isFr = language === 'fr';

    return (
        <button
            className={styles.btn}
            onClick={toggleMobileAdvanced}
            aria-label={mobileAdvancedOpen ? (isFr ? 'Retour au jeu' : 'Back to game') : (isFr ? 'Ouvrir les panneaux avances' : 'Open advanced panels')}
            aria-expanded={mobileAdvancedOpen}
            aria-pressed={mobileAdvancedOpen}
        >
            {mobileAdvancedOpen ? (isFr ? 'Retour Jeu' : 'Back To Game') : (isFr ? 'Avance' : 'Advanced')}
        </button>
    );
}
