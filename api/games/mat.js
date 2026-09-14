const {Chess}=require('chess.js');
const {moveObject}=require('./matValidation');
const {defaultPuzzle}=require('../infrastructure/matPool');

function prepareMat(g,now) {
    const puzzle=g.pickMatPuzzle?g.pickMatPuzzle():defaultPuzzle(g.players);
    const chess=new Chess(puzzle.fen);
    g.mat={puzzle,turn:chess.turn(),board:chess.board().flat().filter(Boolean),
        legal:chess.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion||'')),startAt:now,results:{}};
    g.phase='solve';g.deadline=now+20000;
}
function settleMat(g,now) {
    for(const id of g.players){
        const r=g.responses[id]||{move:null,ms:null,mate:false,expired:true};g.mat.results[id]=r;
        g.scores[id]=r.mate?20000-r.ms:0;
    }
    const [a,b]=g.players;
    if(b&&g.mat.results[a].mate&&g.mat.results[b].mate&&Math.abs(g.mat.results[a].ms-g.mat.results[b].ms)<=250){
        const tied=Math.min(g.scores[a],g.scores[b]);g.scores[a]=tied;g.scores[b]=tied;
    }
    g.phase='reveal';g.deadline=now+3000;
}
function actMat(g,id,action,now) {
    if(g.phase!=='solve'||action.action!=='move'||g.responses[id]!==undefined||typeof action.move!=='string'||!g.mat.legal.includes(action.move))return false;
    const chess=new Chess(g.mat.puzzle.fen);chess.move(moveObject(action.move));
    g.responses[id]={move:action.move,ms:Math.max(0,now-g.mat.startAt),mate:chess.isCheckmate(),expired:false};
    if(g.players.every(p=>g.responses[p]!==undefined))settleMat(g,now);
    return true;
}
function tickMat(g,now,conclude){if(now<g.deadline)return;if(g.phase==='solve')settleMat(g,now);else if(g.phase==='reveal')conclude(g,'mat-one-position');}
function publicMat(g,viewer){
    if(!g.mat)return undefined;const c=g.mat,reveal=['reveal','draw','done'].includes(g.phase);
    return JSON.parse(JSON.stringify({fen:c.puzzle.fen,board:c.board,turn:c.turn,legal:c.legal,
        selected:g.players.includes(viewer)?g.responses[viewer]?.move:undefined,
        ...(reveal?{results:c.results,solution:c.puzzle.solution,puzzleId:c.puzzle.id,rating:c.puzzle.rating}:{}),tieWindowMs:250}));
}
module.exports={prepareMat,actMat,tickMat,publicMat};
