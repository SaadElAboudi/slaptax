import characters from '../../../../shared/characters.json' with {type:'json'};
import {ClubAvatar} from '../ClubAvatar/ClubAvatar';
import {useAccessibilityPreferences} from '../../hooks/useAccessibilityPreferences';
import {TokenWallet} from '../TokenWallet/TokenWallet';
import {AccountControls} from '../AccountControls/AccountControls';
import styles from './TopBar.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { useMusicPreference } from '../../hooks/useAdaptiveAudio';
import { Music2, Volume2, Vibrate, X, Settings2 } from 'lucide-react';
import { useFeedbackPreferences } from '../../hooks/useFeedbackPreferences';

export function TopBar({onHome}: {onHome: () => void}) {
    const { wallet, apiOnline, language, toggleLanguage, playerName, setProfile, progression, setCosmetics } = useGameStore();
    const accessibility=useAccessibilityPreferences();
    const safeWallet = Number(wallet ?? 0);
    const isFr = language === 'fr';
    const [draftName, setDraftName] = useState(playerName);
    const profileButton=useRef<HTMLButtonElement>(null);
    const [cosmeticError,setCosmeticError]=useState('');
    function chooseCosmetic(choice:{avatar?:string;arena?:string;trail?:string}){setCosmeticError('');void setCosmetics(choice).catch(()=>setCosmeticError(isFr?'Choix non enregistré. Réessaie en ligne.':'Choice not saved. Try again online.'));}
    const [lockerOpen, setLockerOpen] = useState(false);
    const [tokensOpen,setTokensOpen]=useState(false);
    const { musicOn, toggleMusic } = useMusicPreference();
    const {soundOn,toggleSound,hapticsOn,toggleHaptics}=useFeedbackPreferences();

    useEffect(() => {
        setDraftName(playerName);
    }, [playerName]);

    useEffect(() => {
        const close = (event: KeyboardEvent) => { if (event.key === 'Escape') {setLockerOpen(false);profileButton.current?.focus();} };
        if (lockerOpen) window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [lockerOpen]);

    const commitName = () => {
        const next = draftName.trim();
        if (!next || next === playerName) return;
        setProfile(next);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraftName(e.target.value);
    };

    return (
        <header className={styles.topbar}>
            <button type="button" className={styles.brand} onClick={onHome} aria-label={isFr?'Accueil Slap Tax':'Slap Tax home'}>
                SLAP<span className={styles.dollar}>$</span>TAX
            </button>
            <div className={styles.right}>
                <span className={`${styles.liveDot} ${apiOnline ? styles.live : styles.offline}`}>
                    {apiOnline ? (isFr ? 'Connecté' : 'Online') : (isFr?'Hors ligne':'Offline')}
                </span>
                <button type="button" disabled={!apiOnline} aria-label={isFr?'Ouvrir mes jetons':'Open my tokens'} onClick={()=>{setLockerOpen(false);setTokensOpen(true);}} data-testid="player-wallet" data-balance={safeWallet} className={`${styles.walletChip} ${apiOnline ? styles.online : ''}`}>
                    <span aria-hidden="true">✦</span> {safeWallet.toLocaleString(isFr?'fr-FR':'en-US',{maximumFractionDigits:2})} <small title={isFr?'Jetons gratuits, sans valeur monétaire':'Free tokens with no monetary value'}>{isFr?'jetons':'tokens'}</small>
                </button>
                <button
                    ref={profileButton}
                    className={styles.avatarButton}
                    type="button"
                    onClick={() => setLockerOpen((value) => !value)}
                    aria-label={isFr ? 'Profil et réglages' : 'Profile and settings'}
                    aria-expanded={lockerOpen}
                >
                    <Settings2 size={21}/>
                </button>
            </div>
            {tokensOpen&&<TokenWallet onClose={()=>setTokensOpen(false)}/>}
            {lockerOpen && (
                <div className={styles.locker} role="dialog" aria-label={isFr?'Profil et réglages':'Profile and settings'}>
                    <header>
                        <div>
                            <span>{isFr ? 'TON PROFIL' : 'YOUR PROFILE'}</span>
                            <strong>{playerName} {progression ? `· LVL ${progression.level}` : ''}</strong>
                        </div>
                        <button type="button" onClick={() => {setLockerOpen(false);profileButton.current?.focus();}} aria-label={isFr ? 'Fermer' : 'Close'}><X size={17}/></button>
                    </header>
                    <label className={styles.nameLabel}>{isFr?'Ton pseudo':'Your nickname'}                <input
                    className={styles.playerNameInput}
                    type="text"
                    value={draftName}
                    onChange={handleNameChange}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitName();
                        }
                    }}
                    maxLength={20}
                    title={isFr ? 'Modifier le pseudo' : 'Edit nickname'}
                    aria-label={isFr ? 'Nom du joueur' : 'Player name'}
                />
</label>
                    <button type="button" className={styles.langBtn} onClick={toggleLanguage}>{isFr?'Langue : français':'Language: English'}</button>
                    <div className={styles.feedbackSettings}>
                        <label><Music2 size={17}/>{isFr?'Musique':'Music'}<input type="checkbox" checked={musicOn} onChange={toggleMusic}/></label>
                        <label><Volume2 size={17}/>{isFr?'Effets sonores':'Sound effects'}<input type="checkbox" checked={soundOn} onChange={toggleSound}/></label>
                        <label><Vibrate size={17}/>{isFr?'Vibrations':'Haptics'}<input type="checkbox" checked={hapticsOn} onChange={toggleHaptics}/></label>
                    </div>
                    <section className={styles.accessibility} aria-label={isFr?'Accessibilité':'Accessibility'}><strong>{isFr?'Confort et lisibilité':'Comfort and readability'}</strong>{[
                        [isFr?'Contraste renforcé':'High contrast',accessibility.highContrast,accessibility.setHighContrast],
                        [isFr?'Réduire les animations':'Reduce motion',accessibility.reduceMotion,accessibility.setReduceMotion],
                        [isFr?'Textes agrandis':'Larger text',accessibility.largeText,accessibility.setLargeText],
                    ].map(([label,value,set])=><label key={String(label)}>{String(label)}<input type="checkbox" checked={Boolean(value)} onChange={e=>(set as (next:boolean)=>void)(e.target.checked)}/></label>)}</section>
                    {progression && <><section className={styles.fighters} aria-label={isFr?'Ton personnage':'Your character'}><strong>{isFr?'Ton personnage':'Your character'}</strong><small>{isFr?'Apparence uniquement. Mêmes règles pour tous.':'Appearance only. The same rules for everyone.'}</small><div>{characters.map(({id,labelFr,labelEn})=>{const unlocked=progression.cosmetics.unlocked.avatars.includes(id),name=isFr?labelFr:labelEn;return <button key={id} type="button" disabled={!unlocked} aria-label={`${name} · ${unlocked?(isFr?'disponible':'available'):(isFr?'verrouillé':'locked')}`} aria-pressed={progression.cosmetics.avatar===id} onClick={()=>chooseCosmetic({avatar:id})}><ClubAvatar variant={id}/><b>{name}</b><small>{!unlocked?(isFr?'À débloquer':'Locked'):progression.cosmetics.avatar===id?(isFr?'Sélectionné':'Selected'):(isFr?'Choisir':'Choose')}</small></button>;})}</div></section>
                    <CosmeticRow
                        label={isFr ? 'Arène' : 'Arena'}
                        values={['foundry', 'neon', 'storm']}
                        unlocked={progression.cosmetics.unlocked.arenas}
                        selected={progression.cosmetics.arena}
                        onSelect={(arena) => chooseCosmetic({ arena })}
                    />
                    <CosmeticRow
                        label={isFr ? 'Traînée' : 'Trail'}
                        values={['pulse', 'ember', 'glitch']}
                        unlocked={progression.cosmetics.unlocked.trails}
                        selected={progression.cosmetics.trail}
                        onSelect={(trail) => chooseCosmetic({ trail })}
                    /></>}
                    {cosmeticError&&<p role="alert">{cosmeticError}</p>}
                    <AccountControls/>
                </div>
            )}
        </header>
    );
}

function CosmeticRow({
    label,
    values,
    unlocked,
    selected,
    onSelect,
}: {
    label: string;
    values: string[];
    unlocked: string[];
    selected: string;
    onSelect: (value: string) => void;
}) {
    return (
        <section className={styles.cosmeticRow}>
            <span>{label}</span>
            <div>
                {values.map((value) => (
                    <button
                        type="button"
                        key={value}
                        className={selected === value ? styles.selectedCosmetic : ''}
                        disabled={!unlocked.includes(value)}
                        onClick={() => onSelect(value)}
                        title={value}
                    >
                        {value}
                    </button>
                ))}
            </div>
        </section>
    );
}
