import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
const root=new URL('..',import.meta.url),svg=await readFile(new URL('assets/icon.svg',root));
async function png(path,size,source=svg){const target=new URL(path,root);await mkdir(new URL('.',target),{recursive:true});let output=sharp(source).resize(size,size);if(source===svg)output=output.flatten({background:'#263f79'}).removeAlpha();await output.png().toFile(fileURLToPath(target));}
await png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',1024);
await png('../mobile/store/icon-1024.png',1024);await png('../mobile/store/icon-google-play-512.png',512);
const foreground=Buffer.from(svg.toString().replace(/<rect id="background"[^>]+\/>/,''));
for(const [density,size,fg]of [['mdpi',48,108],['hdpi',72,162],['xhdpi',96,216],['xxhdpi',144,324],['xxxhdpi',192,432]]){
 for(const file of ['ic_launcher.png','ic_launcher_round.png'])await png(`android/app/src/main/res/mipmap-${density}/${file}`,size);
 await png(`android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,fg,foreground);
}
const splash=await sharp(svg).resize(780,780).png().toBuffer();
const backdrop=await sharp({create:{width:2732,height:2732,channels:3,background:'#263f79'}}).composite([{input:splash,left:976,top:976}]).png().toBuffer();
for(const file of ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png'])await writeFile(new URL(`ios/App/App/Assets.xcassets/Splash.imageset/${file}`,root),backdrop);
const res=new URL('android/app/src/main/res/',root);
for(const dir of await readdir(res)){if(!dir.startsWith('drawable'))continue;try{
 const path=new URL(`${dir}/splash.png`,res),meta=await sharp(await readFile(path)).metadata(),width=meta.width,height=meta.height,size=Math.round(Math.min(width,height)*.5);
 const image=await sharp(svg).resize(size,size).png().toBuffer();await sharp({create:{width,height,channels:3,background:'#263f79'}}).composite([{input:image,left:Math.floor((width-size)/2),top:Math.floor((height-size)/2)}]).png().toFile(fileURLToPath(path)+'.new');await writeFile(path,await readFile(fileURLToPath(path)+'.new'));const {unlink}=await import('node:fs/promises');await unlink(fileURLToPath(path)+'.new');
 }catch(error){if(error.code!=='ENOENT')throw error;}}
const graphic=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500"><rect width="1024" height="500" fill="#263f79"/><g transform="translate(-8,-2) scale(.49)">${svg.toString().replace(/<svg[^>]+>/,'').replace('</svg>','')}</g><text x="510" y="110" fill="#99e0c8" font-family="sans-serif" font-size="19" font-weight="900">GIGNOSKI GAMES</text><text x="505" y="220" fill="#ffda68" font-family="sans-serif" font-size="91" font-weight="900">SlapTax</text><text x="510" y="285" fill="#fff7db" font-family="sans-serif" font-size="31" font-weight="900">Tes amis. Tes rivaux.</text><path d="M514 321h430" stroke="#14213f" stroke-width="5"/><text x="510" y="373" fill="#fff7db" font-family="sans-serif" font-size="21" font-weight="700">DÉFIS · MINI-JEUX · REVANCHES</text></svg>`;
await writeFile(new URL('../mobile/store/feature-graphic.svg',root),graphic);
await sharp(Buffer.from(graphic)).flatten({background:'#263f79'}).removeAlpha().png().toFile(fileURLToPath(new URL('../mobile/store/feature-graphic-1024x500.png',root)));
console.log('Original SlapTax icons and iOS launch assets generated.');
