import {Share} from '@capacitor/share';
import {Clipboard} from '@capacitor/clipboard';
import {isNative} from './environment';
export const canShareLink=()=>isNative()||typeof navigator.share==='function';
export async function shareLink(data:{title:string;text?:string;url:string}){
 if(isNative()){await Share.share({...data,dialogTitle:data.title});return;}
 if(navigator.share)await navigator.share(data);else await copyText(`${data.text||''} ${data.url}`.trim());
}
export async function copyText(text:string){
 if(isNative()){await Clipboard.write({string:text});return;}
 await navigator.clipboard.writeText(text);
}
