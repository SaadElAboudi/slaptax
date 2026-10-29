import {Capacitor} from '@capacitor/core';
export const isNative=()=>Capacitor.isNativePlatform();
export function apiBase(){
 const configured=import.meta.env.VITE_API_BASE_URL?.replace(/\/$/,'')||'';
 if(isNative())return configured;
 try{return localStorage.getItem('slaptax_api_base')||configured;}catch{return configured;}
}
export const apiUrl=(path:string)=>`${apiBase()}${path}`;
export function sessionHeaders():Record<string,string>{
 try{return {'X-SlapTax-Client':localStorage.getItem('slaptax_client_id')||'','X-SlapTax-User':localStorage.getItem('slaptax_user_id')||''};}catch{return {};}
}
export function publicUrl(path='/',query=''){
 const base=import.meta.env.VITE_PUBLIC_SITE_URL||(!isNative()?location.origin:'');
 if(!base)throw new Error('Missing public site URL');
 const url=new URL(path,base);url.search=query;return url.toString();
}

export function appInvitationUrl(){const url=new URL(location.href);if(!url.searchParams.get('invite')&&!url.searchParams.get('room')&&(!url.searchParams.get('link')||url.searchParams.get('link')==='new'))return null;const link=new URL('slaptax://play/');for(const key of ['tab','game','invite','link','room','token','mode']){const v=url.searchParams.get(key);if(v&&v.length<=200)link.searchParams.set(key,v);}return link.searchParams.toString()?link.toString():null;}
