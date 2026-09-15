import styles from './ClubAvatar.module.css';

export function ClubAvatar({variant='spark',rival=false}:{variant?:string;rival?:boolean}) {
    return <svg className={styles.avatar} viewBox="0 0 100 100" data-rival={rival} aria-hidden="true">
        <path d="M10 31 30 11 70 11 90 31 90 75 74 90 26 90 10 75Z" fill="currentColor"/>
        <path d="M10 65 26 80H74L90 65V75L74 90H26L10 75Z" fill="#151519" opacity=".25"/>
        {variant==='crown'?<path d="m25 28 2-19 14 10 9-16 10 16 14-10 1 19Z" fill="#f8fcf2" stroke="#202128" strokeWidth="3"/>:<path d="M27 19h24l-9 12H22Z" fill="#fff" opacity=".5"/>}
        <rect x="22" y="37" width="56" height="31" rx={variant==='visor'?12:8} fill="#252630"/>
        {variant==='phantom'?<path d="m32 47 9 9m-9 0 9-9m18 0 9 9m-9 0 9-9" stroke="#fff" strokeWidth="4"/>:<><path d={rival?'m32 48 9 3m18 0 9-3':'M33 49v6m31-6v6'} stroke="#fff" strokeWidth="5" strokeLinecap="round"/><path d="M46 58q4 4 8 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></>}
        <path d="M41 75h18" stroke="#202128" strokeWidth="4" strokeLinecap="round"/>
    </svg>;
}
