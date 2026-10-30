import world from '../../../shared/slaptax-world.json';
export const CENTRAL_GAME=world.centralGame as 'snack';
export const worldName=(fr:boolean)=>fr?world.nameFr:world.nameEn;
export const worldPremise=(fr:boolean)=>fr?world.premiseFr:world.premiseEn;
export function gameChapter(id:string,fr:boolean){const c=(world.chapters as Record<string,{placeFr:string;placeEn:string;chapterFr:string;chapterEn:string;storyFr:string;storyEn:string}>)[id];return c?{place:fr?c.placeFr:c.placeEn,title:fr?c.chapterFr:c.chapterEn,story:fr?c.storyFr:c.storyEn}:null;}
