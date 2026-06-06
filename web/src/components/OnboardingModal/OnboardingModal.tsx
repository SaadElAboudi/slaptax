import { useEffect, useId, useState } from 'react';
import styles from './OnboardingModal.module.css';
import { useGameStore, type Tab } from '../../hooks/useGameStore';

export function OnboardingModal({ onComplete }: { onComplete: (tab: Tab) => void }) {
    const { playerName, joinSession, language } = useGameStore();
    const [name, setName] = useState(playerName || '');
    const [step, setStep] = useState(0);
    const [joining, setJoining] = useState(false);
    const isFr = language === 'fr';
    const titleId = useId();
    const descId = useId();

    const steps = [
        {
            title: isFr ? 'Bienvenue sur SLAP$TAX !' : 'Welcome to SLAP$TAX!',
            desc: isFr
                ? 'Entraîne-toi en solo, défie un ami en trois manches ou tente un run de tournoi.'
                : 'Train solo, challenge a friend over three rounds, or attempt a tournament run.',
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
            title: isFr ? 'Choisis ton point de départ' : 'Choose where to start',
            desc: isFr
                ? 'Chaque mode est indépendant. Tu pourras changer à tout moment.'
                : 'Each mode is independent. You can switch at any time.',
            action: '',
        },
    ];

    const handleNext = async () => {
        if (step === 1 && name.trim()) {
            setJoining(true);
            await joinSession(name.trim());
            setJoining(false);
        }
        if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && step < steps.length - 1 && !(step === 1 && !name.trim())) {
                event.preventDefault();
                void handleNext();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [step, name]);

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
                {step === steps.length - 1 ? (
                    <div className={styles.modeChoices}>
                        <button type="button" onClick={() => onComplete('training')}>
                            <strong>{isFr ? 'Entrainement' : 'Training'}</strong>
                            <span>{isFr ? 'Solo · sans mise' : 'Solo · no stakes'}</span>
                        </button>
                        <button type="button" onClick={() => onComplete('defy')}>
                            <strong>{isFr ? 'Duel ami' : 'Friend duel'}</strong>
                            <span>1V1 · BO3</span>
                        </button>
                        <button type="button" onClick={() => onComplete('tournament')}>
                            <strong>{isFr ? 'Tournoi' : 'Tournament'}</strong>
                            <span>{isFr ? 'Run à élimination' : 'Elimination run'}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        className={styles.btnMain}
                        onClick={() => void handleNext()}
                        disabled={joining || (steps[step].input && !name.trim())}
                    >
                        {joining ? (isFr ? 'Connexion...' : 'Joining...') : steps[step].action}
                    </button>
                )}
            </div>
        </div>
    );
}
