import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {root,renderHTML,escapeHTML} from '../scripts/render-html.mjs';
import {validateSite,validateCompany} from '../scripts/validate.mjs';
import {matchLocale,nativeLanguageNames} from '../i18n.js';
const locales=Object.keys(nativeLanguageNames);
const company=JSON.parse(await readFile(resolve(root,'data/company.json'),'utf8'));
test('same 29 locales as FKNGYM, all keys present and nonempty',async()=>{
 const result=await validateSite();assert.equal(result.locales,29);assert.equal(result.keys,59);
});
test('locale matching preserves Chinese script and regional variants',()=>{
 for(const [input,expected] of [['zh-TW','zh-Hant'],['zh-HK','zh-Hant'],['zh-CN','zh-Hans'],['zh-Hant-CN','zh-Hant'],['pt-PT','pt-BR'],['en-GB','en'],['ru_RU','ru'],['ka-GE','ka'],['nonsense!','null']])assert.equal(matchLocale(input,locales),expected==='null'?null:expected);
});
test('a release cannot omit registration, contact or operator confirmation',()=>{
 const valid={...structuredClone(company),legalName:'Example LLC',legalForm:'LLC',identificationNumber:'123456789',legalAddress:'Example address',email:'contact@example.com',siteUrl:'https://example.com/',detailsConfirmed:true,privacyConfirmed:true};
 assert.doesNotThrow(()=>validateCompany(valid,{release:true}));
 for(const field of ['legalName','legalForm','identificationNumber','legalAddress','email','siteUrl','detailsConfirmed','privacyConfirmed'])assert.throws(()=>validateCompany({...valid,[field]:null},{release:true}));
});
test('available products need a real App Store destination',()=>{
 const c=structuredClone(company);c.products.fkncoin.status='available';c.products.fkncoin.appStoreUrl=null;
 assert.throws(()=>validateCompany(c),/App Store/);
 c.products.fkncoin.appStoreUrl='https://example.com/app';assert.throws(()=>validateCompany(c),/official/);
 c.products.fkncoin.appStoreUrl='https://apps.apple.com/app/id123456789';assert.doesNotThrow(()=>validateCompany(c));
});
test('HTML escapes user-supplied company fields',()=>{
 assert.equal(escapeHTML('<script>"x" & \'y\'</script>'),'&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
});
test('English fallback is up to date and all internal links and assets resolve',async()=>{
 const pages=await renderHTML({check:true});
 for(const page of pages) {
  const html=await readFile(resolve(root,page),'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,page);
  assert.doesNotMatch(html,/undefined|href="#"|javascript:/);
  assert.match(html,/<html lang="en" dir="ltr">/);
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
   if(/^(https:|mailto:)/.test(url))continue;
   const [path,hash]=url.split('#');let file=resolve(dirname(resolve(root,page)),path||page.split('/').at(-1));
   if((await stat(file)).isDirectory())file=resolve(file,'index.html');
   assert.ok((await stat(file)).isFile(),`${page}: ${url}`);
   if(hash)assert.match(await readFile(file,'utf8'),new RegExp(`id="${hash}"`),`${page}: ${url}`);
  }
 }
});
test('portfolio shows the two announced products without teaser or Android badges',async()=>{
 const html=await readFile(resolve(root,'index.html'),'utf8');
 assert.equal((html.match(/<article class="product /g)||[]).length,2);
 assert.doesNotMatch(html,/class="upcoming|data-i18n="(?:unannounced|futureBody|android)"|iOS → ANDROID/);
});
test('development server only resolves public files after path normalization',async()=>{
 const {publicPath}=await import('../scripts/server-path.mjs');
 for(const path of ['/.git/config','/assets/../../.env','/assets/../.git/config','/assets/../scripts/build.mjs','/data/company.json','/package.json','/assets/.env','/assets/nested/.key','/assets/.git/config'])assert.equal(publicPath(root,path),null,path);
 for(const path of ['/','/company/','/privacy/index.html','/locales/zh-Hant.json','/assets/fkngym.webp'])assert.ok(publicPath(root,path),path);
});

test('release flags must be booleans and URL credentials are rejected',()=>{
 const c={...structuredClone(company),privacyConfirmed:true,detailsConfirmed:true};
 for(const flag of ['privacyConfirmed','detailsConfirmed'])assert.throws(()=>validateCompany({...c,[flag]:'false'},{release:true}));
 assert.throws(()=>validateCompany({...c,siteUrl:'https://user:secret@example.com/'}));
 c.products.fkngym.url='https://user:secret@example.com/';
 assert.throws(()=>validateCompany(c));
});
test('both legal documents have one complete translatable version in every locale',async()=>{
 const english=JSON.parse(await readFile(resolve(root,'locales/en.json'),'utf8'));
 for(const name of ['privacy','terms']) {
  const html=await readFile(resolve(root,name,'index.html'),'utf8');
  const count=name==='privacy'?6:4;
  assert.equal((html.match(/class="legal-copy"/g)||[]).length,1);
  assert.equal((html.match(/class="legal-section"/g)||[]).length,count);
  assert.doesNotMatch(html,/id="legal-(?:ka|en)"|document-languages|კომპანიის მონაცემები/);
  for(const locale of locales) {
   const dictionary=JSON.parse(await readFile(resolve(root,`locales/${locale}.json`),'utf8'));
   for(let i=1;i<=count;i++)for(const suffix of ['Title','Body']) {
    const key=`${name}Section${i}${suffix}`;
    assert.ok(dictionary[key]?.trim(),`${locale}: ${key}`);
    assert.ok(html.includes(`data-i18n="${key}"`));
    if(locale!=='en')assert.notEqual(dictionary[key],english[key],`${locale}: untranslated ${key}`);
   }
  }
 }
});
test('public asset validation rejects hidden files and symlinks',async()=>{
 const {mkdtemp,writeFile,symlink,rm}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {validatePublicTree}=await import('../scripts/validate.mjs');
 const dir=await mkdtemp(resolve(tmpdir(),'fkn-assets-'));
 try {
  await writeFile(resolve(dir,'.env'),'test');
  await assert.rejects(validatePublicTree(dir),/Unsafe public asset/);
  await rm(resolve(dir,'.env'));
  await symlink(resolve(root,'package.json'),resolve(dir,'image.png'));
  await assert.rejects(validatePublicTree(dir),/Unsafe public asset/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
