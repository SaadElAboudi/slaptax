const { Chess } = require('chess.js');
const { createHash } = require('node:crypto');
const moveObject = uci => ({ from:uci.slice(0,2), to:uci.slice(2,4), ...(uci[4]?{promotion:uci[4]}:{}) });
const positionKey = fen => createHash('sha256').update(fen.split(' ').slice(0,4).join(' ')).digest('hex').slice(0,24);

function fromLichess(row) {
    if(!/^[a-zA-Z0-9]+$/.test(row.PuzzleId || '') || !['Rating','Popularity','NbPlays','RatingDeviation'].every(k=>row[k]!==''&&Number.isFinite(Number(row[k]))))return null;
    if (!String(row.Themes).split(' ').includes('mateIn1') || Number(row.Rating)<600 || Number(row.Rating)>1500
        || Number(row.Popularity)<80 || Number(row.NbPlays)<100 || Number(row.RatingDeviation)>100) return null;
    try {
        const moves=row.Moves.split(' ');
        if(moves.length!==2||!moves.every(m=>/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m)))return null;
        const chess=new Chess(row.FEN);chess.move(moveObject(moves[0]));const fen=chess.fen();
        chess.move(moveObject(moves[1]));if(!chess.isCheckmate())return null;
        return {id:row.PuzzleId,key:positionKey(fen),fen,solution:moves[1],rating:Number(row.Rating),source:'lichess'};
    }catch{return null;}
}
function validPuzzle(p) {
    try {
        if(!p||typeof p.id!=='string'||p.key!==positionKey(p.fen)||!Number.isFinite(p.rating))return false;
        const c=new Chess(p.fen);c.move(moveObject(p.solution));return c.isCheckmate();
    }catch{return false;}
}
module.exports={moveObject,positionKey,fromLichess,validPuzzle};
