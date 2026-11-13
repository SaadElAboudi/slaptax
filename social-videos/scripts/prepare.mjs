import {readdir, readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {prepareDistinct} from './distinct-demos.mjs';
import {prepareCampaign} from './campaign-demos.mjs';
import {prepareSnack} from './snack-demo.mjs';
import {prepareDecoupe} from './decoupe-demo.mjs';
export const root = fileURLToPath(new URL('../', import.meta.url));
export async function loadVideos() {
  const names = (await readdir(path.join(root, 'videos'), {withFileTypes: true}))
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  const videos = await Promise.all(names.map(async name => {
    const v = JSON.parse(await readFile(path.join(root, 'videos', name, 'video.json'), 'utf8'));
    if(v.id !== name || !/^[0-9]{2}-[a-z0-9-]+$/.test(v.id)) throw Error(`Invalid id: ${name}`);
    if(!Number.isFinite(v.duration) || v.duration < 6 || v.duration > 60) throw Error(`Invalid duration: ${name}`);
    if(!v.hook || !v.voiceText || !v.scenes.length) throw Error(`Missing content: ${name}`);
    let end=0;
    for(const s of v.scenes) {
      if(s.from!==end || s.to<=s.from || !s.text) throw Error(`Invalid scene timing: ${name}`);
      end=s.to;
    }
    if(end!==v.duration) throw Error(`Incomplete timeline: ${name}`);
    for(const field of ['footage','voice','music']) if(v[field]) {
      if(path.isAbsolute(v[field]) || v[field].split('/').includes('..') || /[:\\]/.test(v[field])) throw Error(`Unsafe asset path: ${name}`);
      if(field!=='music' || v[field]!=='audio/slaptax-pulse.wav') await access(path.join(root,'public',v[field]));
    }
    return v;
  }));
  if(new Set(videos.map(v=>v.day)).size!==videos.length) throw Error('Video days must be unique');
  const campaign=JSON.parse(await readFile(path.join(root,'campaign.json'),'utf8'));
  const selection=JSON.parse(await readFile(path.join(root,'../shared/game-selection.json'),'utf8'));
  const active=campaign.featured.map(id=>{const video=videos.find(v=>v.id===id);if(!video)throw Error(`Missing campaign video: ${id}`);return video.game;});
  if(active.length!==selection.length||new Set(active).size!==active.length||selection.some(g=>!active.includes(g.id)))throw Error('Campaign must cover each active game exactly once');
  return videos;
}
export async function prepare() {
  const videos=await loadVideos();
  await prepareDecoupe(root);
  await prepareSnack(root);
  await prepareDistinct(root);
  await prepareCampaign(root);
  await writeFile(path.join(root,'src/catalog.json'),JSON.stringify(videos,null,2)+'\n');
  // Original 120 BPM pulse, synthesized without samples. Quiet backing for voice.
  const rate=44100, seconds=32, count=rate*seconds, pcm=Buffer.alloc(count*2);
  for(let i=0;i<count;i++) {
    const t=i/rate, beat=t%0.5, bar=Math.floor(t/2)%4;
    const bass=[110,110,130.81,98][bar];
    const kick=Math.sin(2*Math.PI*(48*beat+4*(1-Math.exp(-25*beat))))*Math.exp(-beat*20)*0.2;
    const note=Math.sin(2*Math.PI*bass*t)*Math.exp(-beat*9)*0.07;
    pcm.writeInt16LE(Math.round((kick+note)*32767),i*2);
  }
  const header=Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36+pcm.length,4); header.write('WAVEfmt ',8); header.writeUInt32LE(16,16); header.writeUInt16LE(1,20); header.writeUInt16LE(1,22); header.writeUInt32LE(rate,24); header.writeUInt32LE(rate*2,28); header.writeUInt16LE(2,32); header.writeUInt16LE(16,34); header.write('data',36); header.writeUInt32LE(pcm.length,40);
  await mkdir(path.join(root,'public/audio'),{recursive:true});
  await writeFile(path.join(root,'public/audio/slaptax-pulse.wav'),Buffer.concat([header,pcm]));
  console.log(`Validated ${videos.length} storyboards; catalog and original music ready.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(process.argv.includes('--check')) console.log(`Validated ${(await loadVideos()).length} storyboards.`);
  else await prepare();
}
