import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SpeedSortPanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { getSpeedSortTuning } from '../../gameplay/difficulty';
import type { RoundResult } from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'memorize' | 'sort' | 'result' | 'matchEnd';
type MatchKind = 'stake' | 'practice';
type SortMode = 'asc' | 'desc' | 'color' | 'parity';

interface Item {
    id: number;
    value: number;
    color: string;
    label: string;
}

const COLORS = ['#f43f5e', '#f97316', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'];
const COLOR_NAMES_FR = ['Rouge', 'Orange', 'Jaune', 'Vert', 'Bleu', 'Violet'];
const COLOR_NAMES_EN = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];

// ─── Strings ─────────────────────────────────────────────────────────────────

const WIN_FR = [
    'Classement eclair. La foule valide.',
    'Ordre parfait. Adversaire bloque.',
    'Execution rapide. Magistral.',
];
const WIN_EN = [
    'Lightning sort. Crowd approves.',
    'Perfect order. Opponent locked.',
    'Fast execution. Masterclass.',
];
const LOSS_FR = [
    'Mauvais ordre. Recommence.',
    'Trop lent ou mal trie. Reset.',
    'L adversaire a trie plus vite.',
];
const LOSS_EN = [
    'Wrong order. Try again.',
    'Too slow or misordered. Reset.',
    'Opponent sorted faster.',
];

function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateItems(count: number): Item[] {
    const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, count));
    return values.map((v, i) => ({
        id: i,
        value: v,
        color: COLORS[(v - 1) % COLORS.length],
        label: String(v),
    }));
}

function getSortedOrder(items: Item[], mode: SortMode): Item[] {
    const copy = [...items];
    if (mode === 'asc') return copy.sort((a, b) => a.value - b.value);
    if (mode === 'desc') return copy.sort((a, b) => b.value - a.value);
    if (mode === 'color') return copy.sort((a, b) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color));
    // parity: evens first, then odds, each in ascending order
    return copy.sort((a, b) => {
        const aEven = a.value % 2 === 0 ? 0 : 1;
        const bEven = b.value % 2 === 0 ? 0 : 1;
        if (aEven !== bEven) return aEven - bEven;
        return a.value - b.value;
    });
}

function getModeLabel(mode: SortMode, isFr: boolean): string {
    if (mode === 'asc') return isFr ? 'Croissant ↑' : 'Ascending ↑';
    if (mode === 'desc') return isFr ? 'Décroissant ↓' : 'Descending ↓';
    if (mode === 'color') return isFr ? 'Par couleur →' : 'By color →';
    return isFr ? 'Pairs en premier' : 'Evens first';
}

function getStreak(results: RoundResult[]): number {
    let s = 0;
    for (let i = results.length - 1; i >= 0; i--) {
        if (!results[i].won) break;
        s++;
    }
    return s;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpeedSortPanel() {
    const { stake, wallet, isDueling, startDuel, resolveDuel, lastNet, language } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { activateAudio, soundOn, toggleSound, playReady, playDraw, playWin, playLoss } = useSfx();
    const tuning = getSpeedSortTuning(difficultyMode);

    const isFr = language === 'fr';
    const tx = (en: string, fr: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNum, setRoundNum] = useState(0);
    const [items, setItems] = useState<Item[]>([]);
    const [sortMode, setSortMode] = useState<SortMode>('asc');
    const [selected, setSelected] = useState<Item[]>([]);
    const [correctOrder, setCorrectOrder] = useState<Item[]>([]);
    const [feedback, setFeedback] = useState(tx('Scan the grid. Sort it fast.', 'Scanne la grille. Trie vite.'));
    const [crowdLine, setCrowdLine] = useState(tx('Speed and precision. Both.', 'Vitesse et precision. Les deux.'));
    const [reactionMs, setReactionMs] = useState(0);
    const [opponentMs, setOpponentMs] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerRefs = useRef<number[]>([]);
    const sortStartRef = useRef(0);
    const handledRef = useRef(false);
    const intervalRef = useRef<number | null>(null);

    const streak = getStreak(rounds);
    const wins = rounds.filter((r) => r.won).length;
    const totalRounds = 3;

    const clearTimers = useCallback(() => {
        timerRefs.current.forEach((id) => window.clearTimeout(id));
        timerRefs.current = [];
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timerRefs.current = timerRefs.current.filter((v) => v !== id);
            fn();
        }, delay);
        timerRefs.current.push(id);
    }, []);

    const finishRound = useCallback((orderedCorrectly: boolean, msUsed: number, prevRounds: RoundResult[], kind: MatchKind, rivalMs: number) => {
        clearTimers();
        handledRef.current = true;
        setPhase('result');
        setReactionMs(msUsed);
        const won = orderedCorrectly && msUsed < rivalMs;
        setFeedback(won
            ? pickRandom(isFr ? WIN_FR : WIN_EN)
            : !orderedCorrectly
                ? tx('Wrong order. The rival did not need speed.', 'Mauvais ordre. Le rival n a meme pas eu besoin de vitesse.')
                : tx(`Clean order, but slower: ${msUsed}ms vs ${rivalMs}ms.`, `Ordre propre, mais trop lent : ${msUsed}ms contre ${rivalMs}ms.`));
        setCrowdLine(won
            ? tx('The grid bows to you.', 'La grille s incline.')
            : pickRandom(isFr ? LOSS_FR : LOSS_EN));

        if (won) playWin(streak >= 2 ? 1 : 0.7);
        else playLoss(0.45);

        const newRound: RoundResult = {
            gameId: 'speedsort',
            won,
            playerMetricMs: msUsed,
            difficulty: msUsed < tuning.eliteMs ? 'elite' : msUsed < tuning.hardMs ? 'hard' : 'standard',
        };
        const updated = [...prevRounds, newRound];
        setRounds(updated);

        schedule(() => {
            if (updated.length < totalRounds) {
                beginRound(updated.length + 1, updated, kind);
            } else {
                const finalWins = updated.filter((x) => x.won).length;
                setPhase('matchEnd');
                setFeedback(finalWins > totalRounds / 2
                    ? tx('Match won. Clean sweep.', 'Match gagne. Net.')
                    : tx('Opponent sorts faster. Come back.', 'Adversaire plus rapide. Reviens.'));
                setCrowdLine(finalWins > totalRounds / 2
                    ? tx('LEGEND PACE.', 'RYTHME LEGENDE.')
                    : tx('Next challenger, step up.', 'Prochain challenger, avance.'));
                if (kind === 'stake') resolveDuel(finalWins > totalRounds / 2, updated);
            }
        }, 1400);
    }, [clearTimers, isFr, tx, playWin, playLoss, streak, schedule, resolveDuel, tuning]);

    const beginRound = useCallback((r: number, prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        handledRef.current = false;

        const modes: SortMode[] = ['asc', 'desc', 'color', 'parity'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        const newItems = generateItems(tuning.itemCount);
        const correct = getSortedOrder(newItems, mode);
        const pressure = r === totalRounds ? 0.82 : streak >= 2 ? 0.88 : 1;
        const rivalMs = Math.max(900, Math.round((tuning.hardMs + tuning.timeoutMs * 0.34 + Math.random() * 700) * pressure));

        setRoundNum(r);
        setItems(newItems);
        setSortMode(mode);
        setCorrectOrder(correct);
        setSelected([]);
        setOpponentMs(rivalMs);
        setPhase('memorize');
        setFeedback(tx(`Mode: ${getModeLabel(mode, false)}`, `Mode: ${getModeLabel(mode, true)}`));
        setCrowdLine(r === totalRounds
            ? tx(`Clutch grid. Beat ${rivalMs}ms.`, `Grille clutch. Bats ${rivalMs}ms.`)
            : tx(`Memorize, then beat ${rivalMs}ms.`, `Memorise, puis bats ${rivalMs}ms.`));
        playReady(streak >= 2 ? 0.9 : 0.4);

        schedule(() => {
            setPhase('sort');
            sortStartRef.current = performance.now();
            setTimeLeft(tuning.timeoutMs);
            setFeedback(tx(`Sort now! Mode: ${getModeLabel(mode, false)}`, `Trie maintenant ! Mode: ${getModeLabel(mode, true)}`));
            setCrowdLine(tx('Go go go!', 'Vas-y vas-y !'));
            playDraw(0.8);

            let remaining = tuning.timeoutMs;
            intervalRef.current = window.setInterval(() => {
                remaining -= 100;
                setTimeLeft(Math.max(0, remaining));
                if (remaining <= 0 && intervalRef.current !== null) {
                    window.clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }, 100);

            schedule(() => {
                if (handledRef.current) return;
                finishRound(false, tuning.timeoutMs, prevRounds, kind, rivalMs);
            }, tuning.timeoutMs);
        }, tuning.memorizeMs);
    }, [clearTimers, schedule, playReady, playDraw, isFr, tx, streak, tuning, finishRound]);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        clearTimers();
        if (!practice && safeWallet < safeStake) return;
        const kind: MatchKind = practice ? 'practice' : 'stake';
        setMatchType(kind);
        if (!practice) startDuel();
        setRounds([]);
        setSelected([]);
        setPhase('idle');
        setFeedback(practice
            ? tx('Training. No stake. Build your speed.', 'Entrainement. Sans mise. Builds ta vitesse.')
            : tx('Speed Sort. Think fast, click right.', 'Speed Sort. Pense vite, clique juste.'));
        setCrowdLine(tx('The grid does not wait.', 'La grille n attend pas.'));
        schedule(() => beginRound(1, [], kind), 0);
    }, [activateAudio, clearTimers, safeWallet, safeStake, startDuel, schedule, beginRound, tx]);

    const handleSelect = useCallback((item: Item) => {
        if (phase !== 'sort' || handledRef.current) return;
        setSelected((prev) => {
            if (prev.find((x) => x.id === item.id)) return prev; // guard double-click
            const next = [...prev, item];

            if (next.length === correctOrder.length) {
                const msUsed = Math.round(performance.now() - sortStartRef.current);
                const isCorrect = next.every((x, i) => x.id === correctOrder[i].id);
                finishRound(isCorrect, msUsed, rounds, matchType, opponentMs);
            }

            return next;
        });
    }, [phase, correctOrder, rounds, matchType, finishRound, opponentMs]);

    const selectedIds = new Set(selected.map((x) => x.id));
    const progressPct = (timeLeft / tuning.timeoutMs) * 100;

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Speed Sort' : 'Speed Sort'}</h2>
                    <p className={styles.sub}>
                        {isFr
                            ? `Trie les cartes dans le bon ordre · BO${totalRounds} · Mise : SLAP$ ${safeStake}`
                            : `Sort cards in the right order · BO${totalRounds} · Stake: SLAP$ ${safeStake}`}
                    </p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </div>

            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Jeu' : 'Game'}: SORT</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {wins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Serie' : 'Streak'}: {streak}</span>
                <span className={styles.chip}>{isFr ? 'Rival' : 'Rival'}: {opponentMs || '-'}ms</span>
                <span className={styles.chip}>{isFr ? 'Difficulte' : 'Difficulty'}: {difficultyMode}</span>
                {lastNet != null && phase === 'matchEnd' && (
                    <span className={`${styles.chip} ${lastNet >= 0 ? styles.chipWin : styles.chipLoss}`}>
                        {lastNet >= 0 ? '+' : ''}SLAP$ {lastNet.toFixed(2)}
                    </span>
                )}
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>
                    {soundOn ? 'SFX ON' : 'SFX OFF'}
                </button>
            </div>

            <div className={styles.arena}>
                {/* Feedback top */}
                <div className={styles.feedbackTop}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>

                {/* Timer bar */}
                {phase === 'sort' && (
                    <div className={styles.timerBar}>
                        <div
                            className={styles.timerFill}
                            style={{
                                width: `${progressPct}%`,
                                background: progressPct > 50 ? '#4ade80' : progressPct > 25 ? '#facc15' : '#f43f5e',
                            }}
                        />
                    </div>
                )}
                {(phase === 'memorize' || phase === 'sort') && (
                    <div className={styles.opponentBadge}>
                        {isFr ? 'Chrono rival' : 'Rival clock'} <strong>{opponentMs}ms</strong>
                    </div>
                )}

                {/* IDLE */}
                {phase === 'idle' && (
                    <div className={styles.centeredOverlay}>
                        <div className={styles.bigLabel}>{isFr ? 'PRET ?' : 'READY?'}</div>
                        <p className={styles.hint}>{isFr ? 'Clique les cartes dans le bon ordre.' : 'Click the cards in the right order.'}</p>
                    </div>
                )}

                {/* MEMORIZE — show values + rule */}
                {phase === 'memorize' && (
                    <div className={styles.sortArea}>
                        <div className={styles.modeLabel}>{isFr ? 'Ordre:' : 'Sort by:'} <strong>{getModeLabel(sortMode, isFr)}</strong></div>
                        <div className={styles.itemGrid}>
                            {items.map((item) => (
                                <div key={item.id} className={styles.card} style={{ borderColor: item.color, boxShadow: `0 0 12px ${item.color}44` }}>
                                    <span className={styles.cardValue} style={{ color: item.color }}>{item.value}</span>
                                    {sortMode === 'color' && (
                                        <span className={styles.cardColorName} style={{ color: item.color }}>
                                            {isFr ? COLOR_NAMES_FR[(item.value - 1) % COLORS.length] : COLOR_NAMES_EN[(item.value - 1) % COLORS.length]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className={styles.hint}>{isFr ? 'Memorise les valeurs...' : 'Memorize the values...'}</p>
                    </div>
                )}

                {/* SORT — click in order */}
                {phase === 'sort' && (
                    <div className={styles.sortArea}>
                        <div className={styles.modeLabel}>{isFr ? 'Trie par:' : 'Sort by:'} <strong>{getModeLabel(sortMode, isFr)}</strong></div>
                        <div className={styles.itemGrid}>
                            {items.map((item) => {
                                const done = selectedIds.has(item.id);
                                const pos = selected.findIndex((x) => x.id === item.id) + 1;
                                // Ajout : style premium sur carte validée
                                let cardClass = `${styles.card} ${styles.cardBtn}`;
                                if (done && selected.length === correctOrder.length) {
                                    cardClass += ' ' + (selected.every((x, i) => x.id === correctOrder[i].id) ? styles.cardWin : styles.cardLoss);
                                } else if (done) {
                                    cardClass += ' ' + styles.cardDone;
                                }
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={cardClass}
                                        style={{
                                            borderColor: done ? '#4ade80' : item.color,
                                            opacity: done ? 0.55 : 1,
                                            boxShadow: done ? '0 0 8px #4ade8077' : `0 0 12px ${item.color}44`,
                                        }}
                                        onClick={() => handleSelect(item)}
                                        disabled={done}
                                    >
                                        {done ? (
                                            <span className={styles.cardPos}>#{pos}</span>
                                        ) : (
                                            <span className={styles.cardValue} style={{ color: item.color }}>{item.value}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className={styles.progressDots}>
                            {items.map((_, i) => (
                                <div key={i} className={`${styles.dot} ${i < selected.length ? styles.dotFilled : ''}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULT */}
                {phase === 'result' && (
                    <>
                        <div className={styles.centeredOverlay}>
                            <div className={`${styles.bigLabel} ${rounds[roundNum - 1]?.won ? styles.labelWin : styles.labelLoss}`}>
                                {rounds[roundNum - 1]?.won ? (isFr ? 'TRIE !' : 'SORTED!') : (isFr ? 'RATÉ' : 'FAILED')}
                            </div>
                            <p className={styles.hint}>{reactionMs}ms vs {opponentMs}ms · {isFr ? 'Manche suivante...' : 'Next round...'}</p>
                        </div>
                        {/* Flash central premium */}
                        <div className={rounds[roundNum - 1]?.won ? styles.flashWin : styles.flashLoss} />
                    </>
                )}

                {/* MATCH END */}
                {phase === 'matchEnd' && (
                    <div className={styles.centeredOverlay}>
                        <div className={`${styles.bigLabel} ${wins > totalRounds / 2 ? styles.labelWin : styles.labelLoss}`}>
                            {wins > totalRounds / 2 ? (isFr ? 'MATCH GAGNÉ' : 'MATCH WON') : (isFr ? 'MATCH PERDU' : 'MATCH LOST')}
                        </div>
                        {matchType === 'stake' && lastNet != null && (
                            <p className={`${styles.hint} ${lastNet >= 0 ? styles.labelWin : styles.labelLoss}`}>
                                {lastNet >= 0 ? '+' : ''}SLAP$ {lastNet.toFixed(2)}
                            </p>
                        )}
                        <div className={styles.roundSummary}>
                            {rounds.map((r, i) => (
                                <span key={i} className={`${styles.dot} ${r.won ? styles.dotWin : styles.dotLoss}`}>
                                    {r.won ? '✓' : '✗'} {r.playerMetricMs}ms
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            {(phase === 'idle' || phase === 'matchEnd') && (
                <div className={styles.actions}>
                    <button type="button" className={styles.btnMain} onClick={() => startMatch(false)} disabled={isDueling || safeWallet < safeStake}>
                        {isFr ? 'Lancer le Sort' : 'Start Sort'}
                    </button>
                    <button type="button" className={styles.btnSec} onClick={() => startMatch(true)}>
                        {isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}
                    </button>
                </div>
            )}
        </section>
    );
}
