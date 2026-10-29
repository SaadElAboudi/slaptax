import type {Point} from './party';

/** Constrain a completed gesture to the announced direction, never to an area target. */
export function constrainCut(a:Point,b:Point,axis?:string):Point[]{
 if(Math.hypot(b[0]-a[0],b[1]-a[1])<.05||!axis||axis==='free')return [a,b];
 const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
 if(axis==='vertical')return [[x,0],[x,1]];
 const offset=y-x;return offset>=0?[[0,offset],[1-offset,1]]:[[-offset,0],[1,1+offset]];
}

