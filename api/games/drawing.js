const { Vertices } = require('matter-js');

const validPoints = (points, min = 2, max = 128) => Array.isArray(points) && points.length >= min && points.length <= max
    && points.every((p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const length = (points) => points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);

function sample(points, count = 64) {
    const total = length(points);
    if (total < .001) return Array.from({ length: count }, () => [...points[0]]);
    let segment = 1, passed = 0;
    return Array.from({ length: count }, (_, i) => {
        const at = total * i / (count - 1);
        while (segment < points.length - 1 && passed + distance(points[segment - 1], points[segment]) < at) {
            passed += distance(points[segment - 1], points[segment++]);
        }
        const a = points[segment - 1], b = points[segment];
        const t = Math.min(1, (at - passed) / (distance(a, b) || 1));
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    });
}

function traceScore(target, points) {
    if (!validPoints(points) || length(points) < .03) return 0;
    const a = sample(target), b = sample(points);
    const error = Math.min(...[b, [...b].reverse()].map((path) => a.reduce((sum, p, i) => sum + distance(p, path[i]), 0) / a.length));
    // Arc-length sampling removes pointer event density and drawing speed from scoring.
    const excess = Math.max(0, Math.abs(length(points) - length(target)) / length(target) - .1);
    return Math.round(1000 * Math.max(0, 1 - Math.max(0, error - .008) / .28 - excess * .15));
}

const sideOf = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
const area = (points) => points.length < 3 ? 0 : Vertices.area(points.map(([x, y]) => ({ x, y })));
function clip(polygon, line, side) {
    const [a, b] = line, result = [];
    for (let i = 0; i < polygon.length; i++) {
        const p = polygon[i], q = polygon[(i + 1) % polygon.length];
        const dp = sideOf(a, b, p) * side, dq = sideOf(a, b, q) * side;
        if (dp >= 0) result.push(p);
        if ((dp > 0 && dq < 0) || (dp < 0 && dq > 0)) {
            const t = dp / (dp - dq);
            result.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        }
    }
    return result;
}
function cutResult(polygon, target, line, side) {
    if (!validPoints(line, 2, 2) || ![1, -1].includes(side) || distance(...line) < .05) return null;
    const piece = clip(polygon, line, side);
    const fraction = area(piece) / area(polygon);
    if (fraction <= 0 || fraction >= 1) return null;
    const percent = Math.round(fraction * 1000) / 10;
    const error = Math.round(Math.abs(percent - target) * 10) / 10;
    return { piece, percent, error, score: Math.max(0, 1000 - Math.round(error * 10)) };
}

function drawingTarget(gameId, attempt, random) {
    if (gameId === 'decoupe') {
        const count = 4 + attempt;
        const angle = random(0, 360) * Math.PI / 180;
        const polygon = Array.from({ length: count }, (_, i) => {
            const t = angle + i * Math.PI * 2 / count;
            return [.5 + Math.cos(t) * .37, .5 + Math.sin(t) * .32];
        });
        return { polygon, percent: random(25, 76) };
    }
    const shapes = [
        [[[.2,.7],[.5,.25],[.8,.7]], [[.2,.3],[.2,.7],[.8,.7]]],
        [[[.2,.7],[.35,.3],[.65,.3],[.8,.7]], [[.2,.3],[.4,.65],[.6,.35],[.8,.7]]],
        [[[.2,.7],[.2,.4],[.5,.2],[.8,.4],[.8,.7]], [[.2,.25],[.8,.25],[.8,.5],[.2,.5],[.2,.75],[.8,.75]]],
    ];
    const shape = shapes[Math.min(2, attempt - 1)][random(0, 2)];
    const angle = random(-3, 4) * Math.PI / 12;
    return { path: shape.map(([x,y]) => [.5 + (x-.5)*Math.cos(angle)-(y-.5)*Math.sin(angle), .5+(x-.5)*Math.sin(angle)+(y-.5)*Math.cos(angle)]) };
}

function prepareDrawing(g, now) {
    g.drawing ||= { history: [] };
    g.drawing.target = g.drawingTargets?.[g.attempt - 1] || drawingTarget(g.id, g.attempt, g.random);
    g.phase = 'prepare'; g.deadline = now + 2000;
}
function settleDrawing(g, now) {
    const results = {};
    for (const id of g.players) {
        const response = g.responses[id];
        const score = response?.score || 0;
        g.scores[id] += score;
        results[id] = response || { score: 0, expired: true };
    }
    g.drawing.history.push({ attempt: g.attempt, target: g.drawing.target, results });
    g.phase = 'reveal'; g.deadline = now + 2800;
}
function actDrawing(g, id, action, now) {
    if (g.phase !== 'drawpath' || action.action !== 'lock' || g.responses[id] !== undefined) return false;
    if (g.id === 'trace') {
        if (!validPoints(action.points)) return false;
        const points = action.points.map((p) => [...p]);
        g.responses[id] = { points, score: traceScore(g.drawing.target.path, points) };
    } else {
        const result = cutResult(g.drawing.target.polygon, g.drawing.target.percent, action.points, action.side);
        if (!result) return false;
        g.responses[id] = { ...result, points: action.points.map((p) => [...p]), side: action.side };
    }
    if (g.players.every((p) => g.responses[p] !== undefined)) settleDrawing(g, now);
    return true;
}
function tickDrawing(g, now, conclude, next) {
    if (now < g.deadline) return;
    if (g.phase === 'prepare') {
        g.phase = g.id === 'trace' ? 'observe' : 'drawpath'; g.deadline = now + (g.id === 'trace' ? 2000 : 8000);
    } else if (g.phase === 'observe') { g.phase = 'drawpath'; g.deadline = now + 6000; }
    else if (g.phase === 'drawpath') settleDrawing(g, now);
    else if (g.phase === 'reveal') {
        if (g.attempt >= 3) conclude(g, 'drawing-three-attempts');
        else next(g, now);
    }
}
function publicDrawing(g) {
    if (!g.drawing) return undefined;
    const visible = g.id === 'trace' ? g.phase === 'observe' : g.phase === 'drawpath';
    return JSON.parse(JSON.stringify({ target: visible ? g.drawing.target : undefined, history: g.drawing.history }));
}
module.exports = { validPoints, sample, traceScore, cutResult, drawingTarget, prepareDrawing, actDrawing, tickDrawing, publicDrawing };
