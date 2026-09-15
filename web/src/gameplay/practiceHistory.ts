export interface PracticeEntry {id:string;gameId:string;score:number;completedAt:number}
export function readPracticeHistory(userId:string):PracticeEntry[] {
    try {
        const entries=JSON.parse(localStorage.getItem(`slaptax_practice_history_${userId}`)||'[]');
        return Array.isArray(entries)?entries.filter(e=>e&&typeof e.id==='string'&&typeof e.gameId==='string'&&Number.isFinite(e.score)&&Number.isFinite(e.completedAt)).slice(0,100):[];
    }catch{return [];}
}
export function recordPractice(userId:string,gameId:string,score:number) {
    if(!userId||!Number.isFinite(score))return;
    try {localStorage.setItem(`slaptax_practice_history_${userId}`,JSON.stringify([{id:crypto.randomUUID(),gameId,score,completedAt:Date.now()},...readPracticeHistory(userId)].slice(0,100)));}catch{/* Practice remains playable without storage. */}
}
