/** Sharp art on Retina phones, bounded at 2x to limit memory and fill cost. */
export function gameCanvasContext(canvas:HTMLCanvasElement|null,width:number,height:number){
 if(!canvas)return null;
 const ratio=Math.max(1,Math.min(2,window.devicePixelRatio||1));
 const w=Math.round(width*ratio),h=Math.round(height*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const context=canvas.getContext('2d');
 context?.setTransform(w/width,0,0,h/height,0,0);
 return context;
}
