import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root} from './render-html.mjs';
import {nativeLanguageNames} from '../i18n.js';
export function validateCompany(c,{release=false}={}) {
 for(const product of Object.values(c.products)) {
  if(!['development','available'].includes(product.status))throw new Error('Unknown product status');
  if(product.status==='available'&&!product.appStoreUrl)throw new Error('Available products require an App Store URL');
  for(const value of [product.url,product.appStoreUrl].filter(Boolean)) {
   const url=new URL(value);if(url.protocol!=='https:')throw new Error('Product URLs must use HTTPS');
  }
  if(product.appStoreUrl&&new URL(product.appStoreUrl).hostname!=='apps.apple.com')throw new Error('Use an official App Store URL');
 }
 if(c.email&&!/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(c.email))throw new Error('Invalid company email');
 if(c.siteUrl) {const url=new URL(c.siteUrl);if(url.protocol!=='https:'||url.search||url.hash)throw new Error('siteUrl must be an HTTPS base URL');}
 if(release) {
  const fields=['legalName','legalForm','identificationNumber','legalAddress','email','siteUrl'];
  const missing=fields.filter(key=>typeof c[key]!=='string'||!c[key].trim());
  if(missing.length)throw new Error(`Release blocked: confirm company fields: ${missing.join(', ')}`);
  if(!c.detailsConfirmed||!c.privacyConfirmed)throw new Error('Release blocked: company details, product statuses and privacy handling must be confirmed');
 }
}
export async function validateSite(options={}) {
 const en=JSON.parse(await readFile(resolve(root,'locales/en.json'),'utf8'));
 const keys=Object.keys(en).sort();
 const files=(await readdir(resolve(root,'locales'))).filter(file=>file.endsWith('.json')).sort();
 const expected=Object.keys(nativeLanguageNames).map(code=>`${code}.json`).sort();
 if(JSON.stringify(files)!==JSON.stringify(expected))throw new Error(`Expected all ${expected.length} FKNGYM locales`);
 for(const file of files) {
  const dictionary=JSON.parse(await readFile(resolve(root,'locales',file),'utf8'));
  if(JSON.stringify(Object.keys(dictionary).sort())!==JSON.stringify(keys))throw new Error(`Translation key mismatch: ${file}`);
  for(const [key,value] of Object.entries(dictionary))if(typeof value!=='string'||!value.trim()||/<\/?[a-z]/i.test(value))throw new Error(`Invalid plain-text translation: ${file}:${key}`);
 }
 const company=JSON.parse(await readFile(resolve(root,'data/company.json'),'utf8'));validateCompany(company,options);
 return {locales:files.length,keys:keys.length};
}
