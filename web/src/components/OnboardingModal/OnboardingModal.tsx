import { useState } from 'react';
import styles from './OnboardingModal.module.css';
import { useGameStore } from '../../hooks/useGameStore';

export function OnboardingModal({ onClose }: { onClose: () => void }) {
    const { playerName, setProfile, setActiveTab, language } = useGameStore();
    const [name, setName] = useState(playerName || '');
    const [step, setStep] = useState(0);
    const isFr = language === 'fr';

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
            setProfile(name.trim());
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
            setActiveTab('duel');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>{steps[step].title}</h2>
                <p>{steps[step].desc}</p>
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
