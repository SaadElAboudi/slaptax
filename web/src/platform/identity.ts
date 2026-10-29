/** iOS 15 supports getRandomValues even when randomUUID is unavailable. */
export function newRandomId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 return Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
}
