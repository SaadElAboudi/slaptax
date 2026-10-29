import cast from '../../../shared/snack-characters.json';
export type SnackCharacterId='flan'|'pickle'|'toast';
export const SNACK_CHARACTERS=cast;
export const snackCharacter=(id?:string)=>cast.find(c=>c.id===id)||cast[0];
export function chosenSnackCharacter():SnackCharacterId{
 try{const id=localStorage.getItem('slaptax_snack_character');return cast.some(c=>c.id===id)?id as SnackCharacterId:'flan';}catch{return 'flan';}
}
