import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {root,loadVideos} from './prepare.mjs';
const v=(await loadVideos()).find(v=>v.id===process.argv[2]);
if(!v) throw Error('Usage: npm run voice -- 01-decoupe-37 [--generate]');
console.log(`Voice script (${v.id}): ${v.voiceText}`);
if(!process.argv.includes('--generate')) console.log('Preview only. No API call. --generate consumes ElevenLabs credits.');
else {
  const key=process.env.ELEVENLABS_API_KEY, voice=process.env.ELEVENLABS_VOICE_ID;
  if(!key||!voice||!/^[a-zA-Z0-9_-]+$/.test(voice)) throw Error('Configure a valid API key and voice ID in .env.');
  const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text:v.voiceText,model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.75}}),signal:AbortSignal.timeout(60000)});
  if(!response.ok) throw Error(`ElevenLabs returned HTTP ${response.status}; no retry sent.`);
  if(!response.headers.get('content-type')?.startsWith('audio/')) throw Error('Unexpected audio response');
  await mkdir(path.join(root,'public/voice'),{recursive:true});
  await writeFile(path.join(root,'public/voice',`${v.id}.mp3`),Buffer.from(await response.arrayBuffer()));
  console.log(`Saved public/voice/${v.id}.mp3. Review timing, then set voice in video.json.`);
}
