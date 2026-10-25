import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

const root=fileURLToPath(new URL('..',import.meta.url));
async function waitFor(check) {
 const deadline=Date.now()+8000;
 while(Date.now()<deadline) {
  if(await check())return;
  await delay(50);
 }
 assert.fail('Timed out waiting for development server output');
}

test('dev server uses the updated generator for subsequent data changes', {timeout:20000}, async t=>{
 const directory=await mkdtemp(resolve(tmpdir(),'fkngroup-dev-test-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 for(const file of ['package.json','scripts','data','locales','i18n.js']) {
  await cp(resolve(root,file),resolve(directory,file),{recursive:true});
 }
 const server=spawn(process.execPath,['scripts/dev.mjs'],{
  cwd:directory,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']
 });
 const stopped=once(server,'close');
 t.after(async()=>{server.kill('SIGTERM');await stopped;});
 let output='';
 server.stdout.on('data',data=>{output+=data;});
 server.stderr.on('data',data=>{output+=data;});
 await waitFor(()=>{
  assert.equal(server.exitCode,null,output);
  return /FKNGROUP: http:/.test(output);
 });
 const url=output.match(/http:\/\/127\.0\.0\.1:\d+\//)[0];
 const generator=resolve(directory,'scripts/render-html.mjs');
 const source=await readFile(generator,'utf8');
 assert.ok(source.includes('INDEPENDENT IDEAS. SHARED DNA.'));
 await writeFile(generator,source.replace('INDEPENDENT IDEAS. SHARED DNA.','UPDATED GENERATOR'));
 await waitFor(async()=> (await (await fetch(url)).text()).includes('UPDATED GENERATOR'));
 const companyPath=resolve(directory,'data/company.json');
 const company=JSON.parse(await readFile(companyPath,'utf8'));
 company.legalName='Generator reload test LLC';
 await writeFile(companyPath,JSON.stringify(company));
 await waitFor(async()=> (await (await fetch(url)).text()).includes(company.legalName));
 const html=await (await fetch(url)).text();
 assert.ok(html.includes('UPDATED GENERATOR'),'Data updates must not restore a cached template');
 assert.ok(!html.includes('INDEPENDENT IDEAS. SHARED DNA.'));
});
