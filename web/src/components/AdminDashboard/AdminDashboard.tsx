import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, LockKeyhole, LogOut, RefreshCw, Users } from 'lucide-react';
import styles from './AdminDashboard.module.css';

type Day = { date: string; unique: number; returning: number; peak: number; requests: number; errors4xx: number; errors5xx: number };
type Snapshot = { generatedAt: number; since: number; online: number; activeDuels: number; days: Day[];
    links: { created: number; published: number; accepted: number; completed: number }; uptimeSeconds: number; memoryMb: number };
const number = (value: number) => value.toLocaleString('fr-FR');

export default function AdminDashboard() {
    const [input, setInput] = useState('');
    const [token, setToken] = useState('');
    const [data, setData] = useState<Snapshot | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        document.title = 'SLAPTAX | Observatoire';
        if (!token) return;
        const controller = new AbortController();
        let timer = 0;
        async function refresh() {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/monitoring', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
                    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
                if (response.status === 401) {
                    setData(null); setToken(''); throw new Error('Acces refuse. Verifie la cle administrateur.');
                }
                if (!response.ok) throw new Error('Mesures indisponibles. Nouvelle tentative dans 15 secondes.');
                const snapshot: Snapshot = await response.json();
                if (!controller.signal.aborted) { setData(snapshot); setError(''); }
            } catch (e) {
                if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Connexion indisponible.');
            } finally {
                if (!controller.signal.aborted) { setLoading(false); timer = window.setTimeout(refresh, 15000); }
            }
        }
        void refresh();
        return () => { controller.abort(); window.clearTimeout(timer); };
    }, [token, revision]);
    const today = data?.days.find(day => day.date === new Date(data.generatedAt).toISOString().slice(0, 10));
    return <main className={styles.page}>
        <header className={styles.header}>
            <a href="/" aria-label="Retour au jeu"><ArrowLeft size={18}/> SLAP$TAX</a>
            <span><LockKeyhole size={14}/> ESPACE PRIVE</span>
        </header>
        <div className={styles.heading}><div><p className={styles.eyebrow}>OPERATIONS</p><h1>Observatoire</h1></div>
            {token && <div className={styles.actions}>
                <button type="button" disabled={loading} title="Actualiser" aria-label="Actualiser" onClick={() => setRevision(n => n + 1)}><RefreshCw size={18}/></button>
                <button type="button" title="Se deconnecter" aria-label="Se deconnecter" onClick={() => { setToken(''); setData(null); setError(''); }}><LogOut size={18}/></button>
            </div>}
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {!token ? <form className={styles.login} onSubmit={event => { event.preventDefault(); setError(''); setToken(input); setInput(''); }}>
            <LockKeyhole size={28}/><h2>Connexion administrateur</h2>
            <label htmlFor="admin-key">Cle d'acces</label>
            <input id="admin-key" type="password" required minLength={32} value={input} autoComplete="off" onChange={event => setInput(event.target.value)}/>
            <button type="submit">Ouvrir l'observatoire</button>
        </form> : !data ? <p role="status">Chargement des mesures...</p> : <>
            <div className={styles.status}><span><Activity size={15}/> {loading ? 'Actualisation...' : 'Dernier releve'} {new Date(data.generatedAt).toLocaleTimeString('fr-FR')}</span><span>Serveur unique · Jours UTC</span></div>
            <section className={styles.metrics} aria-label="Activite">
                {[['Connectes maintenant', data.online, 'Sessions joueurs, onglets dedupliques'], ['Joueurs du jour', today?.unique ?? 0, 'Identites connectees distinctes'],
                    ['Pic du jour', today?.peak ?? 0, 'Connexions simultanees observees'], ['Duels en cours', data.activeDuels, 'Etat serveur, y compris joueurs deconnectes']].map(([label, value, hint]) =>
                    <article key={String(label)} className={styles.metric}><h2>{label}</h2><strong>{number(Number(value))}</strong><p>{hint}</p></article>)}
            </section>
            <section className={styles.section}>
                <h2><Users size={20}/> Audience quotidienne</h2>
                <p className={styles.note}>Collecte depuis le {new Date(data.since).toLocaleDateString('fr-FR')}. Historique glissant de 30 jours. Une identite n'est pas une personne unique garantie.</p>
                <div className={styles.tableWrap}><table><caption>Connexions et erreurs API par jour UTC</caption><thead><tr><th>Jour</th><th>Joueurs</th><th>De retour*</th><th>Pic</th><th>Requetes</th><th>4xx</th><th>5xx</th></tr></thead>
                    <tbody>{[...data.days].reverse().map(day => <tr key={day.date}><th>{day.date}</th>{[day.unique, day.returning, day.peak, day.requests, day.errors4xx, day.errors5xx].map((value, index) => <td key={index}>{number(value)}</td>)}</tr>)}</tbody></table></div>
                {!data.days.length && <p className={styles.note}>Aucune activite mesuree pour le moment.</p>}
                <p className={styles.note}>* Deja connectes un jour precedent dans la fenetre conservee. Les 4xx incluent les refus attendus ; les 5xx signalent des erreurs serveur HTTP. Hors sondes de sante, presence et administration.</p>
            </section>
            <section className={styles.section}><h2>Defis par lien</h2><p className={styles.note}>Etat des defis encore conserves en base, pas un cumul historique. Les participations excluent le createur.</p>
                <div className={styles.funnel}>{[['Crees', data.links.created], ['Publies', data.links.published], ['Participations', data.links.accepted], ['Terminees', data.links.completed]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{number(Number(value))}</strong></div>)}</div>
            </section>
            <footer className={styles.footer}><span>Memoire serveur : {data.memoryMb} Mo</span><span>Processus actif : {Math.floor(data.uptimeSeconds / 60)} min</span><span>Les parties solo locales ne sont pas comptabilisees.</span></footer>
        </>}
    </main>;
}
