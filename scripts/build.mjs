import {cp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,renderHTML,escapeHTML} from './render-html.mjs';
import {validateSite} from './validate.mjs';
const release=process.argv.includes('--release');
const result=await validateSite({release});
const pages=await renderHTML();
const destination=resolve(root,'dist');
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
// Only reviewed public files enter the deployment artifact.
for(const file of ['index.html','company','privacy','terms','styles.css','script.js','theme-init.js','i18n.js','assets','locales','CNAME','.nojekyll'])await cp(resolve(root,file),resolve(destination,file),{recursive:true});
const c=JSON.parse(await readFile(resolve(root,'data/company.json'),'utf8'));
if(release) {
 const base=c.siteUrl.endsWith('/')?c.siteUrl:`${c.siteUrl}/`;
 await writeFile(resolve(destination,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(path=>`<url><loc>${escapeHTML(new URL(path.replace(/index\.html$/,''),base).href)}</loc></url>`).join('')}</urlset>`);
 await writeFile(resolve(destination,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',base).href}\n`);
}else await writeFile(resolve(destination,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Built ${pages.length} pages, ${result.locales} locales, ${result.keys} strings each. Mode: ${release?'release':'preview (not ready for bank review)'}.`);
