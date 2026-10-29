/** iOS 15.4–16.3 have Canvas 2D but no roundRect. Preserve the existing paths. */
export function installCanvasCompatibility(){
 if(typeof CanvasRenderingContext2D==='undefined'||typeof CanvasRenderingContext2D.prototype.roundRect==='function')return;
 CanvasRenderingContext2D.prototype.roundRect=function(x,y,width,height,radii=0){
  if(![x,y,width,height].every(Number.isFinite))return;
  type Corner={x:number;y:number};
  const list: Array<number|DOMPointInit>=typeof radii==='number'||!(Symbol.iterator in Object(radii))?[radii as number|DOMPointInit]:Array.from(radii as Iterable<number|DOMPointInit>);
  if(list.length<1||list.length>4)throw new RangeError('Expected one to four corner radii');
  const corners=list.map(value=>typeof value==='number'?{x:value,y:value}:{x:value.x||0,y:value.y||0});
  if(corners.some(p=>p.x<0||p.y<0))throw new RangeError('Negative corner radius');
  if(corners.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return;
  let [tl,tr,br,bl]:Corner[]=corners.length===1?[corners[0],corners[0],corners[0],corners[0]]:corners.length===2?[corners[0],corners[1],corners[0],corners[1]]:corners.length===3?[corners[0],corners[1],corners[2],corners[1]]:corners;
  if(width<0){x+=width;width=-width;[tl,tr,br,bl]=[tr,tl,bl,br];}
  if(height<0){y+=height;height=-height;[tl,tr,br,bl]=[bl,br,tr,tl];}
  const factor=Math.min(1,width/(tl.x+tr.x||1),width/(bl.x+br.x||1),height/(tl.y+bl.y||1),height/(tr.y+br.y||1));
  [tl,tr,br,bl]=[tl,tr,br,bl].map(p=>({x:p.x*factor,y:p.y*factor}));
  this.moveTo(x+tl.x,y);this.lineTo(x+width-tr.x,y);this.quadraticCurveTo(x+width,y,x+width,y+tr.y);
  this.lineTo(x+width,y+height-br.y);this.quadraticCurveTo(x+width,y+height,x+width-br.x,y+height);
  this.lineTo(x+bl.x,y+height);this.quadraticCurveTo(x,y+height,x,y+height-bl.y);
  this.lineTo(x,y+tl.y);this.quadraticCurveTo(x,y,x+tl.x,y);this.closePath();
 };
}
