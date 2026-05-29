import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../TacticalGamePanel/TacticalGamePanel.module.css';
import { useGameStore } from '../../hooks/useGameStore';
import { useSfx } from '../../hooks/useSfx';
import { clamp, getStreak, getTacticalHeat, getTacticalPacing, gradeReactionMs, pickRandom, rangePick } from '../../gameplay/tactical';
import type { RoundResult } from '../../api/client';

type Phase = 'idle' | 'briefing' | 'contest' | 'result' | 'matchEnd';
type MatchKind = 'stake' | 'practice';

type Tile = {
    id: number;
    labelEn: string;
    labelFr: string;
    color: string;
};

const TILES: Tile[] = [
    { id: 0, labelEn: 'Outer Left', labelFr: 'Exterieur Gauche', color: '#60a5fa' },
    { id: 1, labelEn: 'Left Hold', labelFr: 'Gauche', color: '#38bdf8' },
    { id: 2, labelEn: 'Core', labelFr: 'Centre', color: '#ffd400' },
    { id: 3, labelEn: 'Right Hold', labelFr: 'Droite', color: '#fb7185' },
    { id: 4, labelEn: 'Outer Right', labelFr: 'Exterieur Droite', color: '#f97316' },
];

const ZONE_WIN_EN = [
    'Center pressure is yours. Crowd leans in.',
    'You locked the map. Opponent is chasing.',
    'Territory taken. Stay in control.',
];

const ZONE_WIN_FR = [
    'La pression centrale est a toi. La foule se penche.',
    'Tu verrouilles la map. L adversaire poursuit.',
    'Territoire pris. Garde le controle.',
];

const ZONE_LOSS_EN = [
    'You overextended. Reset and rotate.',
    'Lost the lane. Rebuild pressure.',
    'Opponent stole the zone. Answer back.',
];

const ZONE_LOSS_FR = [
    'Tu t es trop expose. Reset et rotate.',
    'Ligne perdue. Reprends la pression.',
    'L adversaire vole la zone. Reponds.',
];

function formatRound(round: RoundResult, isFr: boolean) {
    if (round.playerMetricMs == null) return round.gameId.toUpperCase();
    return `${isFr ? 'tempo' : 'tempo'} ${round.playerMetricMs}ms`;
}

export function ZoneControlPanel() {
    const { stake, wallet, isDueling, startDuel, resolveDuel, lastNet, language } = useGameStore();
    const difficultyMode = useGameStore((s) => s.difficultyMode);
    const { activateAudio, soundOn, toggleSound, playReady, playDraw, playWin, playLoss } = useSfx();

    const isFr = language === 'fr';
    const tx = (en: string, fr: string) => (isFr ? fr : en);
    const safeWallet = Number(wallet ?? 0);
    const safeStake = Number(stake ?? 0);
    const pacing = getTacticalPacing(difficultyMode);

    const [phase, setPhase] = useState<Phase>('idle');
    const [matchType, setMatchType] = useState<MatchKind>('stake');
    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [roundNum, setRoundNum] = useState(0);
    const [targetTile, setTargetTile] = useState<Tile>(TILES[2]);
    const [telegraphTile, setTelegraphTile] = useState<Tile>(TILES[2]);
    const [pressure, setPressure] = useState(52);
    const [responseMs, setResponseMs] = useState(0);
    const [controlMeter, setControlMeter] = useState(50);
    const [combo, setCombo] = useState(0);
    const [actionHint, setActionHint] = useState(tx('Lis la lane, puis clique la bonne carte.', 'Lis la lane, puis clique la bonne carte.'));
    const [feedback, setFeedback] = useState(tx('Take the middle. Keep your spacing.', 'Prends le milieu. Garde ton espace.'));
    const [crowdLine, setCrowdLine] = useState(tx('The arena breathes with you.', 'L arene respire avec toi.'));

    const timeoutRefs = useRef<number[]>([]);
    const contestStartRef = useRef(0);
    const handledRef = useRef(false);

    const zoneWins = rounds.filter((r) => r.won).length;
    const streak = getStreak(rounds);
    const heat = getTacticalHeat(streak);
    const totalRounds = 4;

    useEffect(() => {
        if (phase === 'idle') {
            setFeedback(isFr ? 'Prends le centre. Lis la carte.' : 'Take the center. Read the map.');
            setCrowdLine(isFr ? 'L arene reste calme.' : 'The arena stays calm.');
            return;
        }
        if (phase === 'briefing') {
            setFeedback(isFr ? `Pression annoncee: ${telegraphTile.labelFr}` : `Pressure line: ${telegraphTile.labelEn}`);
            setCrowdLine(isFr ? 'Place-toi avant l ouverture.' : 'Position before the gate opens.');
            setActionHint(isFr ? 'Lis la telegraphie puis prends la bonne lane.' : 'Read the telegraph then take the right lane.');
            return;
        }
        if (phase === 'contest') {
            setFeedback(isFr ? `Tiens la zone ${targetTile.labelFr.toUpperCase()}` : `Hold ${targetTile.labelEn.toUpperCase()}`);
            setCrowdLine(isFr ? 'Pas de panique. Exe­cute.' : 'No panic. Execute.');
            setActionHint(isFr ? 'Carte correcte = tu gagnes du terrain.' : 'Right card = you win ground.');
        }
    }, [isFr, phase, targetTile, telegraphTile]);

    const clearTimers = useCallback(() => {
        timeoutRefs.current.forEach((id) => window.clearTimeout(id));
        timeoutRefs.current = [];
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const schedule = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            timeoutRefs.current = timeoutRefs.current.filter((value) => value !== id);
            fn();
        }, delay);
        timeoutRefs.current.push(id);
    }, []);

    const startRound = useCallback((r: number, prevRounds: RoundResult[], kind: MatchKind) => {
        clearTimers();
        const balance = prevRounds.filter((x) => x.won).length - (prevRounds.length - prevRounds.filter((x) => x.won).length);
        const target = TILES[rangePick([0, TILES.length - 1])];
        const telegraph = TILES[clamp(target.id + (Math.random() > 0.5 ? 1 : -1), 0, TILES.length - 1)];
        const telegraphMs = rangePick(pacing.telegraphMs);
        const responseMsWindow = rangePick(pacing.responseMs) + (balance < 0 ? 220 : balance > 1 ? -120 : 0);

        setPhase('briefing');
        setRoundNum(r);
        setTargetTile(target);
        setTelegraphTile(telegraph);
        setPressure(clamp(52 + balance * 9 + Math.floor(Math.random() * 15) - 7, 18, 86));
        setResponseMs(0);
        setActionHint(isFr ? `Pression ${telegraph.labelFr} · vise ${target.labelFr}` : `Pressure ${telegraph.labelEn} · aim ${target.labelEn}`);
        handledRef.current = false;
        playReady(heat === 'hot' ? 1 : heat === 'warm' ? 0.5 : 0.2);

        schedule(() => {
            setPhase('contest');
            contestStartRef.current = performance.now();
            setFeedback(isFr ? `Conteste ${target.labelFr}` : `Contest ${target.labelEn}`);
            playDraw(heat === 'hot' ? 0.9 : 0.4);
            schedule(() => {
                if (handledRef.current) return;
                handledRef.current = true;
                setPhase('result');
                setResponseMs(responseMsWindow);
                setFeedback(tx('Zone lost. Re-center.', 'Zone perdue. Recenter.'));
                setCrowdLine(pickRandom(isFr ? ZONE_LOSS_FR : ZONE_LOSS_EN));
                playLoss(heat === 'hot' ? 0.8 : 0.4);

                setRounds((prev) => {
                    const updated = [...prev, { gameId: 'zonecontrol', won: false, playerMetricMs: responseMsWindow, difficulty: 'standard' }];
                    schedule(() => {
                        if (updated.length < totalRounds) startRound(updated.length + 1, updated, kind);
                        else {
                            setPhase('matchEnd');
                            if (kind === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                        }
                    }, pacing.settleMs[0]);
                    return updated;
                });
            }, responseMsWindow);
        }, telegraphMs);
    }, [clearTimers, pacing, playReady, playDraw, playLoss, heat, isFr, resolveDuel, schedule, tx]);

    const startMatch = useCallback((practice: boolean) => {
        activateAudio();
        clearTimers();
        if (!practice && safeWallet < safeStake) return;
        const kind: MatchKind = practice ? 'practice' : 'stake';
        setMatchType(kind);
        if (!practice) startDuel();
        setRounds([]);
        setRoundNum(0);
        setPhase('idle');
        setFeedback(practice ? tx('Drill the map. No stake.', 'Entrainement tactique. Sans mise.') : tx('Zone battle. Own the middle.', 'Battle de zone. Prends le milieu.'));
        setCrowdLine(tx('Control wins games.', 'Le controle gagne les jeux.'));
        schedule(() => startRound(1, [], kind), 0);
    }, [activateAudio, clearTimers, safeWallet, safeStake, startDuel, schedule, startRound, isFr, tx]);

    const handleTile = useCallback((tile: Tile) => {
        if (phase !== 'contest' || handledRef.current) return;
        handledRef.current = true;
        clearTimers();
        const reaction = Math.max(0, Math.round(performance.now() - contestStartRef.current));
        const exact = tile.id === targetTile.id;
        const forgiving = Math.abs(tile.id - targetTile.id) <= pacing.forgivenessTiles;
        const won = exact || forgiving;
        const pressureDelta = exact ? 18 : forgiving ? 10 : -14;
        const comboBonus = won ? Math.min(8, combo * 2) : 0;

        setResponseMs(reaction);
        setCombo((prev) => (won ? prev + 1 : 0));
        setControlMeter((prev) => clamp(prev + pressureDelta + comboBonus, 0, 100));
        setPhase('result');
        setFeedback(won ? tx('You controlled the zone.', 'Tu controles la zone.') : tx('You drifted off-line.', 'Tu as glisse hors ligne.'));
        setCrowdLine(won ? pickRandom(isFr ? ZONE_WIN_FR : ZONE_WIN_EN) : pickRandom(isFr ? ZONE_LOSS_FR : ZONE_LOSS_EN));

        setRounds((prev) => {
            const updated = [...prev, { gameId: 'zonecontrol', won, playerMetricMs: reaction, difficulty: gradeReactionMs(reaction, pacing) }];
            if (won) playWin(reaction < pacing.eliteMs ? 1 : 0.7);
            else playLoss(0.45);
            schedule(() => {
                if (updated.length < totalRounds) startRound(updated.length + 1, updated, matchType);
                else {
                    setPhase('matchEnd');
                    if (matchType === 'stake') resolveDuel(updated.filter((x) => x.won).length > totalRounds / 2, updated);
                }
            }, pacing.settleMs[1]);
            return updated;
        });
    }, [phase, clearTimers, targetTile.id, pacing, tx, isFr, playWin, playLoss, schedule, startRound, matchType, resolveDuel]);

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>{isFr ? 'Controle de Zone' : 'Zone Control'}</h2>
                    <p className={styles.sub}>{isFr ? `Domine la carte en BO${totalRounds} · lecture + placement + tempo · Mise : SLAP$ ${safeStake}` : `Hold the map in BO${totalRounds} · reading + placement + tempo · Stake: SLAP$ ${safeStake}`}</p>
                </div>
                <div className={styles.walletPill}>SLAP$ {safeWallet.toFixed(2)}</div>
            </div>

            <div className={styles.chips}>
                <span className={styles.chip}>{isFr ? 'Jeu' : 'Game'}: ZONE</span>
                <span className={styles.chip}>{isFr ? 'Objectif' : 'Objective'}: {isFr ? 'Tenir le centre' : 'Hold the center'}</span>
                <span className={styles.chip}>{isFr ? 'Difficulte' : 'Difficulty'}: {difficultyMode}</span>
                <span className={styles.chip}>{isFr ? 'Victoires' : 'Wins'}: {zoneWins}/{totalRounds}</span>
                <span className={styles.chip}>{isFr ? 'Chaleur' : 'Heat'}: {heat.toUpperCase()}</span>
                <span className={styles.chip}>{isFr ? 'Controle' : 'Control'}: {controlMeter}%</span>
                <button type="button" className={`${styles.chipButton} ${soundOn ? styles.soundOn : styles.soundOff}`} onClick={toggleSound}>{soundOn ? 'SFX ON' : 'SFX OFF'}</button>
            </div>

            <div className={styles.arena}>
                <div className={styles.missionCard}>{feedback}</div>
                <div className={styles.crowdLine}>{crowdLine}</div>
                <div style={{ position: 'absolute', left: 12, right: 12, top: 54, zIndex: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <span>{isFr ? 'Carte de territoire' : 'Territory map'}</span>
                        <span>{combo > 0 ? `${combo}x ${isFr ? 'serie' : 'streak'}` : (isFr ? 'Aucune serie' : 'No streak')}</span>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ width: `${controlMeter}%`, height: '100%', background: 'linear-gradient(90deg, #60a5fa, #ffd400, #fb7185)' }} />
                    </div>
                </div>
                {phase === 'idle' && <div className={styles.resultOverlay}><h3 className={styles.resultTitle}>{isFr ? 'PLACE TES PIONS' : 'SET YOUR PIECES'}</h3><p className={styles.resultNet}>{isFr ? 'Lecture calme, réaction claire.' : 'Calm reading, clear reaction.'}</p></div>}
                {(phase === 'briefing' || phase === 'contest') && (
                    <div style={{ position: 'absolute', inset: '72px 12px 52px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', alignItems: 'stretch' }}>
                        {TILES.map((tile) => {
                            const active = tile.id === targetTile.id;
                            const hint = tile.id === telegraphTile.id;
                            return (
                                <button
                                    key={tile.id}
                                    type="button"
                                    onClick={() => handleTile(tile)}
                                    disabled={phase !== 'contest'}
                                    style={{
                                        borderRadius: '16px',
                                        border: active ? `2px solid ${tile.color}` : '1px solid rgba(255,255,255,0.08)',
                                        background: active ? `${tile.color}22` : hint ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                                        color: 'var(--text)',
                                        fontFamily: 'Space Mono, monospace',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: phase === 'contest' ? 'pointer' : 'default',
                                        opacity: active ? 1 : 0.92,
                                    }}
                                >
                                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginBottom: 8 }}>{isFr ? tile.labelFr : tile.labelEn}</div>
                                    <div style={{ fontSize: '1rem' }}>{active ? '◉' : hint ? '△' : '·'}</div>
                                </button>
                            );
                        })}
                    </div>
                )}
                {phase === 'contest' && (
                    <div style={{ position: 'absolute', left: 12, right: 12, top: '52%', transform: 'translateY(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontFamily: 'Black Ops One, cursive', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', color: 'var(--accent)' }}>{isFr ? 'CONTROLE MAINTENANT' : 'CONTROL NOW'}</div>
                        <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.84rem' }}>{isFr ? 'Reste dans l axe. Lis la pression.' : 'Stay on axis. Read the pressure.'}</div>
                        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{actionHint}</div>
                        <div style={{ marginTop: 12, height: 10, borderRadius: 999, border: '1px solid var(--line)', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                            <div style={{ width: `${pressure}%`, height: '100%', background: 'linear-gradient(90deg, #60a5fa, #ffd400, #fb7185)' }} />
                        </div>
                    </div>
                )}
                {phase === 'result' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${rounds[roundNum - 1]?.won ? styles.ok : styles.bad}`}>
                            {rounds[roundNum - 1]?.won ? (isFr ? 'ZONE GAGNEE' : 'ZONE WON') : (isFr ? 'ZONE PERDUE' : 'ZONE LOST')}
                        </h3>
                        <p className={styles.resultNet}>{isFr ? 'Reaction' : 'Reaction'}: {responseMs}ms</p>
                    </div>
                )}
                {phase === 'matchEnd' && (
                    <div className={styles.resultOverlay}>
                        <h3 className={`${styles.resultTitle} ${zoneWins > totalRounds / 2 ? styles.ok : styles.bad}`}>{zoneWins > totalRounds / 2 ? (isFr ? 'MAP DOMINEE' : 'MAP DOMINATED') : (isFr ? 'MAP PERDUE' : 'MAP LOST')}</h3>
                        <p className={styles.resultNet}>{matchType === 'practice' ? (isFr ? 'Sans mise' : 'No stake') : `${(lastNet ?? 0) >= 0 ? '+' : ''}SLAP$ ${(lastNet ?? 0).toFixed(2)}`}</p>
                        <div className={styles.resultRounds}>
                            {rounds.map((r, i) => <span key={i} className={`${styles.resultRoundDot} ${r.won ? styles.win : styles.loss}`}>{r.won ? '✓' : '✗'} {formatRound(r, isFr)}</span>)}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                {phase === 'idle' || phase === 'matchEnd' ? (
                    <>
                        <button className={styles.btnMain} onClick={() => startMatch(false)} disabled={safeWallet < safeStake || isDueling}>{phase === 'matchEnd' ? (isFr ? 'Relancer' : 'Run It Back') : (isFr ? 'Demarrer Zone Control' : 'Start Zone Control')}</button>
                        <button className={styles.btn} onClick={() => startMatch(true)} disabled={isDueling}>{isFr ? 'Entrainement (Sans Mise)' : 'Training (No Stake)'}</button>
                    </>
                ) : (
                    <p className={styles.sub}>{phase === 'briefing' ? (isFr ? 'Observe la telegraphie...' : 'Observe the telegraph...') : (isFr ? 'Conteste la zone.' : 'Contest the zone.')}</p>
                )}
            </div>

            <div className={styles.log}>
                {rounds.map((r, i) => <div key={i} className={`${styles.logEntry} ${r.won ? styles.logWin : styles.logLoss}`}>{isFr ? 'Manche' : 'Round'} {i + 1} · {r.playerMetricMs ?? '--'}ms · {r.won ? (isFr ? 'GAGNE' : 'WON') : (isFr ? 'PERDU' : 'LOST')}</div>)}
            </div>
        </section>
    );
}
