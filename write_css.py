import os

BASE = '/Users/saadelaboudi/Downloads/slaptax/web/src/components'

tactical = r""".panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid rgba(255, 212, 0, 0.18);
    border-radius: 20px;
    background:
        radial-gradient(ellipse at 15% 0%, rgba(255, 212, 0, 0.10) 0%, transparent 40%),
        radial-gradient(ellipse at 85% 0%, rgba(96, 165, 250, 0.10) 0%, transparent 40%),
        linear-gradient(180deg, #0f151e 0%, #0a0e16 100%);
    padding: 20px;
    box-shadow: 0 20px 64px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}
.title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 2px;
    color: var(--text);
}
.sub {
    color: var(--muted);
    font-size: 0.78rem;
    margin: 0;
    line-height: 1.4;
}
.walletPill {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid var(--accent);
    color: var(--accent);
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    background: rgba(255, 212, 0, 0.08);
    white-space: nowrap;
    flex-shrink: 0;
}
.chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
.chip {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
}
.chipButton {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    transition: transform 0.12s ease;
}
.chipButton:hover { transform: translateY(-1px); }
.chipButton:active { transform: translateY(1px); }
.soundOn {
    color: #86efac;
    border-color: rgba(74, 222, 128, 0.45);
    background: rgba(22, 101, 52, 0.18);
}
.soundOff {
    color: #fca5a5;
    border-color: rgba(248, 113, 113, 0.45);
    background: rgba(127, 29, 29, 0.20);
}
.arena {
    position: relative;
    min-height: 300px;
    height: clamp(300px, 42vh, 500px);
    border: 1px solid rgba(255, 212, 0, 0.20);
    border-radius: 16px;
    overflow: hidden;
    background:
        radial-gradient(ellipse at 50% 0%, rgba(255, 212, 0, 0.10) 0%, transparent 50%),
        rgba(8, 12, 22, 0.60);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}
.missionCard {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 6;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 212, 0, 0.22);
    background: rgba(9, 14, 26, 0.75);
    color: #ffe680;
    font-size: 0.73rem;
    max-width: min(75%, 400px);
    font-family: 'Space Mono', monospace;
    line-height: 1.4;
}
.crowdLine {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 6;
    text-align: center;
    color: rgba(255, 212, 0, 0.55);
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
}
.resultOverlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(8, 12, 20, 0.86);
    backdrop-filter: blur(8px);
    z-index: 10;
    padding: 24px;
    text-align: center;
}
.resultTitle {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.5rem, 5vw, 2.6rem);
    letter-spacing: 0.04em;
    margin: 0;
}
.ok {
    color: var(--ok);
    text-shadow: 0 0 20px rgba(75, 212, 123, 0.30);
}
.bad {
    color: var(--bad);
    text-shadow: 0 0 20px rgba(255, 90, 104, 0.30);
}
.resultNet {
    color: var(--accent);
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
}
.resultRounds {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}
.resultRoundDot {
    font-size: 0.70rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid;
    font-family: 'Space Mono', monospace;
}
.win {
    color: #86efac;
    border-color: rgba(74, 222, 128, 0.45);
    background: rgba(22, 101, 52, 0.14);
}
.loss {
    color: #fca5a5;
    border-color: rgba(248, 113, 113, 0.45);
    background: rgba(127, 29, 29, 0.14);
}
.controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}
.btnMain {
    background: linear-gradient(90deg, var(--accent), #f59e0b);
    color: #111;
    font-weight: 700;
    border: none;
    font-family: 'Black Ops One', cursive;
    letter-spacing: 1px;
    font-size: 0.95rem;
    padding: 11px 24px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    box-shadow: 0 4px 14px rgba(255, 212, 0, 0.20);
}
.btnMain:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 212, 0, 0.28);
}
.btnMain:disabled {
    opacity: 0.40;
    cursor: not-allowed;
    transform: none;
}
.btn {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    padding: 11px 18px;
    border-radius: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 0.82rem;
    cursor: pointer;
    transition: transform 0.12s ease, border-color 0.12s ease;
}
.btn:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.22);
}
.btn:disabled {
    opacity: 0.40;
    cursor: not-allowed;
    transform: none;
}
.log {
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    max-height: 160px;
    overflow-y: auto;
}
.logEntry {
    padding: 7px 12px;
    font-size: 0.72rem;
    border-bottom: 1px solid rgba(38, 50, 65, 0.40);
    color: var(--muted);
    font-family: 'Space Mono', monospace;
}
.logEntry:last-child { border-bottom: none; }
.logWin {
    color: #86efac;
    background: rgba(22, 101, 52, 0.10);
}
.logLoss {
    color: #fca5a5;
    background: rgba(127, 29, 29, 0.10);
}
@media (max-width: 767px) {
    .panel { border-radius: 16px; padding: 14px; gap: 10px; }
    .arena { min-height: 260px; height: clamp(260px, 38vh, 440px); }
    .btnMain, .btn { flex: 1; min-width: 0; text-align: center; }
}
"""

quickdraw = r"""/* QuickdrawPanel */
.panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid rgba(244, 63, 94, 0.20);
    border-radius: 20px;
    background:
        radial-gradient(ellipse at 12% 0%, rgba(244, 63, 94, 0.12) 0%, transparent 38%),
        radial-gradient(ellipse at 88% 0%, rgba(255, 212, 0, 0.10) 0%, transparent 36%),
        linear-gradient(180deg, #0f151e 0%, #0a0e16 100%);
    padding: 20px;
    box-shadow: 0 20px 64px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}
.title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 2px;
    color: var(--text);
}
.sub {
    color: var(--muted);
    font-size: 0.78rem;
    margin: 0;
    line-height: 1.4;
}
.walletPill {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid var(--accent);
    color: var(--accent);
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    background: rgba(255, 212, 0, 0.08);
    white-space: nowrap;
    flex-shrink: 0;
}
/* Round dots + combo bar */
.roundRow {
    display: flex;
    align-items: center;
    gap: 8px;
}
.roundDot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--muted);
    font-size: 0.72rem;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    flex-shrink: 0;
    transition: all 0.15s ease;
}
.roundDot.live {
    border-color: rgba(255, 212, 0, 0.70);
    color: var(--accent);
    box-shadow: 0 0 0 3px rgba(255, 212, 0, 0.15);
}
.roundDot.win {
    border-color: rgba(74, 222, 128, 0.55);
    color: #86efac;
    background: rgba(22, 101, 52, 0.22);
}
.roundDot.loss {
    border-color: rgba(248, 113, 113, 0.55);
    color: #fca5a5;
    background: rgba(127, 29, 29, 0.22);
}
.comboBar {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
}
.comboFill {
    height: 100%;
    border-radius: 999px;
    transition: width 250ms ease;
    background: linear-gradient(90deg, #f59e0b, #f97316, #ef4444);
}
.comboFill_cold { background: linear-gradient(90deg, #64748b, #475569); }
.comboFill_warm { background: linear-gradient(90deg, #f59e0b, #f97316); }
.comboFill_hot  { background: linear-gradient(90deg, #fb923c, #ef4444); }
.comboFill_fire { background: linear-gradient(90deg, #ef4444, #ec4899); box-shadow: 0 0 14px rgba(236, 72, 153, 0.35); }
/* Chips */
.chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
.chip {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
}
.chip.hot {
    color: var(--accent);
    border-color: rgba(255, 212, 0, 0.40);
    background: rgba(255, 212, 0, 0.10);
}
.chip.heatChip_cold {
    color: #cbd5e1;
    border-color: rgba(148, 163, 184, 0.40);
    background: rgba(71, 85, 105, 0.18);
}
.chip.heatChip_warm {
    color: #fdba74;
    border-color: rgba(249, 115, 22, 0.40);
    background: rgba(249, 115, 22, 0.12);
}
.chip.heatChip_hot {
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.50);
    background: rgba(239, 68, 68, 0.14);
}
.chip.heatChip_fire {
    color: #f9a8d4;
    border-color: rgba(236, 72, 153, 0.50);
    background: rgba(236, 72, 153, 0.14);
    box-shadow: 0 0 10px rgba(236, 72, 153, 0.18);
}
.chipButton {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    transition: transform 0.12s ease;
}
.chipButton:hover { transform: translateY(-1px); }
.chipButton:active { transform: translateY(1px); }
.soundOn {
    color: #86efac;
    border-color: rgba(74, 222, 128, 0.45);
    background: rgba(22, 101, 52, 0.18);
}
.soundOff {
    color: #fca5a5;
    border-color: rgba(248, 113, 113, 0.45);
    background: rgba(127, 29, 29, 0.20);
}
/* Arena */
.arena {
    position: relative;
    min-height: 300px;
    height: clamp(300px, 42vh, 500px);
    border: 2px solid rgba(244, 63, 94, 0.28);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
        radial-gradient(ellipse at 50% 20%, rgba(244, 63, 94, 0.10) 0%, transparent 50%),
        rgba(8, 12, 22, 0.60);
    transition: border-color 0.20s ease, background 0.20s ease;
    cursor: pointer;
}
.arena.phase_ready {
    border-color: rgba(244, 63, 94, 0.60);
    background: radial-gradient(ellipse at 50% 20%, rgba(244, 63, 94, 0.14) 0%, transparent 50%), rgba(8,12,22,0.60);
}
.arena.phase_delay {
    border-color: rgba(244, 63, 94, 0.70);
    background: radial-gradient(ellipse at 50% 20%, rgba(244, 63, 94, 0.18) 0%, transparent 50%), rgba(8,12,22,0.60);
}
.arena.phase_draw {
    border-color: #f43f5e;
    background: radial-gradient(ellipse at 50% 20%, rgba(244, 63, 94, 0.26) 0%, transparent 50%), rgba(8,12,22,0.60);
}
.missionCard {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 6;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(244, 63, 94, 0.28);
    background: rgba(9, 14, 26, 0.75);
    color: #ffc9d5;
    font-size: 0.73rem;
    max-width: min(75%, 400px);
    font-family: 'Space Mono', monospace;
    line-height: 1.4;
}
.crowdLine {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 6;
    text-align: center;
    color: rgba(244, 63, 94, 0.55);
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
}
/* Ready state */
.readyDisplay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    z-index: 5;
    padding: 20px;
}
.pulseCircle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(244, 63, 94, 0.80);
    animation: heartbeat 0.85s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    box-shadow: 0 0 24px rgba(244, 63, 94, 0.30);
}
@keyframes heartbeat {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.08); }
    100% { transform: scale(1); }
}
.readyText {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.8rem, 6vw, 3rem);
    color: #fca5a5;
    letter-spacing: 0.06em;
}
.hint {
    color: var(--muted);
    font-size: 0.84rem;
    text-align: center;
    max-width: 280px;
    line-height: 1.4;
}
/* Draw state */
.drawDisplay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    z-index: 5;
    padding: 16px 20px;
    width: 100%;
}
.drawText {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(2rem, 7vw, 3.6rem);
    color: #f43f5e;
    letter-spacing: 0.08em;
    text-shadow: 0 0 24px rgba(244, 63, 94, 0.50);
}
.drawText.shake {
    animation: shake 0.18s ease infinite alternate;
}
@keyframes shake {
    from { transform: translateX(-3px) rotate(-1deg); }
    to   { transform: translateX(3px) rotate(1deg); }
}
/* Lane grid */
.laneGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 520px;
}
.laneCard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.10);
    background: rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: transform 0.10s ease, border-color 0.10s ease;
    font-family: 'Space Mono', monospace;
    font-size: 0.78rem;
    color: var(--muted);
    text-align: center;
}
.laneCard:hover { transform: translateY(-2px); }
.laneHot {
    border-color: #f43f5e !important;
    background: rgba(244, 63, 94, 0.14) !important;
    color: #ffc9d5 !important;
    box-shadow: 0 0 18px rgba(244, 63, 94, 0.25);
}
.laneCold { opacity: 0.60; }
.laneLabel {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
}
/* Result */
.resultOverlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(8, 12, 20, 0.86);
    backdrop-filter: blur(8px);
    z-index: 10;
    padding: 24px;
    text-align: center;
}
.resultTitle {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.5rem, 5vw, 2.6rem);
    letter-spacing: 0.04em;
    margin: 0;
}
.ok  { color: var(--ok);  text-shadow: 0 0 20px rgba(75, 212, 123, 0.30); }
.bad { color: var(--bad); text-shadow: 0 0 20px rgba(255, 90, 104, 0.30); }
.resultDetail {
    color: var(--muted);
    font-size: 0.88rem;
    margin: 0;
}
.resultNet {
    color: var(--accent);
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
}
.resultRounds {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}
.resultRoundDot {
    font-size: 0.70rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid;
    font-family: 'Space Mono', monospace;
}
.win  { color: #86efac; border-color: rgba(74, 222, 128, 0.45); background: rgba(22, 101, 52, 0.14); }
.loss { color: #fca5a5; border-color: rgba(248, 113, 113, 0.45); background: rgba(127, 29, 29, 0.14); }
.nextRound {
    color: var(--muted);
    font-size: 0.78rem;
    margin: 0;
}
.prompt {
    color: var(--muted);
    font-size: 0.88rem;
    text-align: center;
    padding: 20px;
    z-index: 5;
}
/* Controls */
.controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}
.btnMain {
    background: linear-gradient(90deg, #f43f5e, #ef4444);
    color: #fff;
    font-weight: 700;
    border: none;
    font-family: 'Black Ops One', cursive;
    letter-spacing: 1px;
    font-size: 0.95rem;
    padding: 11px 24px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    box-shadow: 0 4px 14px rgba(244, 63, 94, 0.28);
}
.btnMain:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244, 63, 94, 0.38); }
.btnMain:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
.btn {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    padding: 11px 18px;
    border-radius: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 0.82rem;
    cursor: pointer;
    transition: transform 0.12s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
/* Log */
.log {
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    max-height: 160px;
    overflow-y: auto;
}
.logEntry {
    padding: 7px 12px;
    font-size: 0.72rem;
    border-bottom: 1px solid rgba(38, 50, 65, 0.40);
    color: var(--muted);
    font-family: 'Space Mono', monospace;
}
.logEntry:last-child { border-bottom: none; }
.logWin  { color: #86efac; background: rgba(22, 101, 52, 0.10); }
.logLoss { color: #fca5a5; background: rgba(127, 29, 29, 0.10); }
@media (max-width: 767px) {
    .panel { border-radius: 16px; padding: 14px; gap: 10px; }
    .arena { min-height: 260px; height: clamp(260px, 38vh, 440px); cursor: pointer; }
    .laneGrid { gap: 8px; }
    .laneCard { padding: 10px 6px; }
    .btnMain, .btn { flex: 1; min-width: 0; text-align: center; }
}
"""

parry = r"""/* ParryClashPanel */
.panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid rgba(59, 130, 246, 0.22);
    border-radius: 20px;
    background:
        radial-gradient(ellipse at 18% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 38%),
        radial-gradient(ellipse at 82% 0%, rgba(244, 63, 94, 0.10) 0%, transparent 36%),
        linear-gradient(180deg, #0f151e 0%, #0a0e16 100%);
    padding: 20px;
    box-shadow: 0 20px 64px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}
.title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 2px;
    color: var(--text);
}
.sub {
    color: var(--muted);
    font-size: 0.78rem;
    margin: 0;
    line-height: 1.4;
}
.walletPill {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid rgba(96, 165, 250, 0.80);
    color: #93c5fd;
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    background: rgba(59, 130, 246, 0.10);
    white-space: nowrap;
    flex-shrink: 0;
}
.chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
.chip {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
}
.chip.heat_cold { color: #cbd5e1; border-color: rgba(148, 163, 184, 0.40); background: rgba(71, 85, 105, 0.18); }
.chip.heat_warm { color: #fdba74; border-color: rgba(249, 115, 22, 0.40); background: rgba(249, 115, 22, 0.12); }
.chip.heat_hot  { color: #fca5a5; border-color: rgba(239, 68, 68, 0.50); background: rgba(239, 68, 68, 0.14); }
.chip.heat_fire { color: #f9a8d4; border-color: rgba(236, 72, 153, 0.50); background: rgba(236, 72, 153, 0.14); }
.chipButton {
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.70rem;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    transition: transform 0.12s ease;
}
.chipButton:hover { transform: translateY(-1px); }
.chipButton:active { transform: translateY(1px); }
.soundOn  { color: #86efac; border-color: rgba(74, 222, 128, 0.45); background: rgba(22, 101, 52, 0.18); }
.soundOff { color: #fca5a5; border-color: rgba(248, 113, 113, 0.45); background: rgba(127, 29, 29, 0.20); }
/* Arena */
.arena {
    position: relative;
    min-height: 300px;
    height: clamp(300px, 42vh, 500px);
    border: 2px solid rgba(59, 130, 246, 0.30);
    border-radius: 16px;
    overflow: hidden;
    background:
        radial-gradient(ellipse at 50% 20%, rgba(59, 130, 246, 0.14) 0%, transparent 50%),
        rgba(8, 12, 22, 0.60);
    transition: border-color 0.20s ease;
}
.arena.phase_strike {
    border-color: rgba(239, 68, 68, 0.70);
    background: radial-gradient(ellipse at 50% 20%, rgba(239, 68, 68, 0.16) 0%, transparent 50%), rgba(8,12,22,0.60);
}
.missionCard {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 6;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.28);
    background: rgba(9, 14, 26, 0.75);
    color: #c7dcff;
    font-size: 0.73rem;
    max-width: min(75%, 400px);
    font-family: 'Space Mono', monospace;
    line-height: 1.4;
}
.crowdLine {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 6;
    text-align: center;
    color: rgba(96, 165, 250, 0.55);
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
}
.centerState {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px 50px;
}
.state {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.6rem, 6vw, 3rem);
    color: #93c5fd;
    letter-spacing: 0.04em;
    text-align: center;
}
.stateHot {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.6rem, 6vw, 3rem);
    color: #fca5a5;
    letter-spacing: 0.04em;
    text-align: center;
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.40);
}
.hint {
    color: var(--muted);
    font-size: 0.84rem;
    text-align: center;
    max-width: 280px;
    line-height: 1.4;
}
.resultOverlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(8, 12, 20, 0.86);
    backdrop-filter: blur(8px);
    z-index: 10;
    padding: 24px;
    text-align: center;
}
.resultTitle {
    font-family: 'Black Ops One', cursive;
    font-size: clamp(1.5rem, 5vw, 2.6rem);
    letter-spacing: 0.04em;
    margin: 0;
}
.ok  { color: var(--ok);  text-shadow: 0 0 20px rgba(75, 212, 123, 0.30); }
.bad { color: var(--bad); text-shadow: 0 0 20px rgba(255, 90, 104, 0.30); }
.resultDetail {
    color: var(--muted);
    font-size: 0.88rem;
    margin: 0;
}
/* Controls */
.controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}
.btnLane {
    flex: 1;
    min-width: 0;
    border: 1px solid rgba(59, 130, 246, 0.40);
    color: #dbeafe;
    background: rgba(30, 58, 138, 0.22);
    padding: 12px 10px;
    border-radius: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 0.80rem;
    cursor: pointer;
    transition: transform 0.10s ease, border-color 0.10s ease, background 0.10s ease;
    text-align: center;
}
.btnLane:hover {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.70);
    background: rgba(30, 58, 138, 0.35);
}
.btnMain {
    background: linear-gradient(90deg, #2563eb, #3b82f6);
    color: #fff;
    font-weight: 700;
    border: none;
    font-family: 'Black Ops One', cursive;
    letter-spacing: 1px;
    font-size: 0.95rem;
    padding: 11px 24px;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.28);
}
.btnMain:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.38); }
.btnMain:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
.btn {
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
    padding: 11px 18px;
    border-radius: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 0.82rem;
    cursor: pointer;
    transition: transform 0.12s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
/* Log */
.log {
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    max-height: 160px;
    overflow-y: auto;
}
.logEntry {
    padding: 7px 12px;
    font-size: 0.72rem;
    border-bottom: 1px solid rgba(38, 50, 65, 0.40);
    color: var(--muted);
    font-family: 'Space Mono', monospace;
}
.logEntry:last-child { border-bottom: none; }
.logWin  { color: #86efac; background: rgba(22, 101, 52, 0.10); }
.logLoss { color: #fca5a5; background: rgba(127, 29, 29, 0.10); }
@media (max-width: 767px) {
    .panel { border-radius: 16px; padding: 14px; gap: 10px; }
    .arena { min-height: 260px; height: clamp(260px, 38vh, 440px); }
    .btnLane { padding: 10px 6px; font-size: 0.72rem; }
    .btnMain, .btn { flex: 1; min-width: 0; text-align: center; }
}
"""

files = {
    os.path.join(BASE, 'TacticalGamePanel/TacticalGamePanel.module.css'): tactical,
    os.path.join(BASE, 'QuickdrawPanel/QuickdrawPanel.module.css'): quickdraw,
    os.path.join(BASE, 'ParryClashPanel/ParryClashPanel.module.css'): parry,
}

for path, content in files.items():
    with open(path, 'w') as f:
        f.write(content)
    print(f"Written {path.split('/')[-1]}: {len(content)} chars")

print("All done.")
