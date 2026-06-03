import { useEffect, useId, useState } from 'react';
import styles from './OnboardingModal.module.css';
import { useGameStore } from '../../hooks/useGameStore';

export function OnboardingModal({ onClose }: { onClose: () => void }) {
    const { playerName, joinSession, setActiveTab, language } = useGameStore();
    const [name, setName] = useState(playerName || '');
    const [step, setStep] = useState(0);
    const isFr = language === 'fr';
    const titleId = useId();
    const descId = useId();

    const steps = [
        {
            title: isFr ? 'Bienvenue sur SLAP$TAX !' : 'Welcome to SLAP$TAX!',
            desc: isFr
                ? 'Ici, tu vas défier tes amis sur des mini-jeux rapides et miser pour gagner.'
                : 'Here, you challenge friends in quick mini-games and bet to win.',
            action: isFr ? 'Continuer' : 'Continue',
        },
        {
            title: isFr ? 'Choisis ton pseudo' : 'Pick your nickname',
            desc: isFr
                ? 'Entre un nom de joueur. Il sera visible dans l’arène.'
                : 'Enter a player name. It will be visible in the arena.',
            input: true,
            action: isFr ? 'Valider' : 'Confirm',
        },
        {
            title: isFr ? 'Prêt à jouer ?' : 'Ready to play?',
            desc: isFr
                ? 'Commence ton premier duel ou invite un ami !'
                : 'Start your first duel or invite a friend!',
            action: isFr ? 'C’est parti !' : 'Let’s go!',
        },
    ];

    const handleNext = () => {
        if (step === 1 && name.trim()) {
            void joinSession(name.trim());
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            setActiveTab('quickdraw');
        }
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            if (event.key === 'Enter' && !(step === 1 && !name.trim())) {
                event.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [step, name, onClose]);

    return (
        <div className={styles.overlay}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
            >
                <h2 id={titleId}>{steps[step].title}</h2>
                <p id={descId}>{steps[step].desc}</p>
                <div className={styles.dots}>
                    {steps.map((_, i) => (
                        <span key={i} className={`${styles.dot} ${i === step ? styles.active : ''}`} />
                    ))}
                </div>
                {steps[step].input && (
                    <input
                        className={styles.input}
                        type="text"
                        maxLength={20}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={isFr ? 'Ton pseudo...' : 'Your nickname...'}
                        autoFocus
                    />
                )}
                <button
                    className={styles.btnMain}
                    onClick={handleNext}
                    disabled={steps[step].input && !name.trim()}
                >
                    {steps[step].action}
                </button>
            </div>
        </div>
    );
}
