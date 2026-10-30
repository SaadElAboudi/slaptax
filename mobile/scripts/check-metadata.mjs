import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../store/metadata.json',import.meta.url),'utf8'));
const limits={name:30,subtitle:30,shortDescription:80,promotionalText:170,keywords:100};
for(const locale of ['fr','en'])for(const [field,limit]of Object.entries(limits)){
 const value=data.locales[locale]?.[field];
 if(typeof value!=='string'||!value.trim()||[...value].length>limit)throw Error(`${locale}.${field}: required, maximum ${limit} characters`);
}
if(!/^\S+@\S+\.\S+$/.test(data.supportEmail)||data.appId!=='com.gignoski.slaptax')throw Error('Invalid support or application ID');
console.log('PASS store metadata FR/EN: all required fields and length limits');
