import styles from './Placeholder.module.css';

interface Props {
    title: string;
    emoji?: string;
}

export function Placeholder({ title, emoji = '🔧' }: Props) {
    return (
        <div className={styles.wrap}>
            <span className={styles.emoji}>{emoji}</span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.sub}>This panel is coming in the next sprint.</p>
        </div>
    );
}
