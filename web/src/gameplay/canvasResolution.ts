/** Sharp art on Retina phones, bounded at 2x to limit memory and fill cost. */
export function gameCanvasContext(canvas:HTMLCanvasElement|null,width:number,height:number,displayWidth=canvas?.clientWidth||width){
 if(!canvas||(document.hidden||document.documentElement.dataset.appActive==='false'))return null;
 const ratio=Math.max(1,Math.min(2,window.devicePixelRatio||1));
 const scale=ratio*Math.min(1,Math.max(1,displayWidth)/width);
 const w=Math.round(width*scale),h=Math.round(height*scale);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const context=canvas.getContext('2d');
 // A visible game must never silently keep running over an empty canvas.
 // The game loop catches this and opens the recovery screen, closing the duel connection.
 if(!context)throw new Error('Game canvas is unavailable');
 context.setTransform(w/width,0,0,h/height,0,0);
 return context;
}
