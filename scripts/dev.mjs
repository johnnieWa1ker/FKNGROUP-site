import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {watch} from 'node:fs';
import {resolve,extname} from 'node:path';
import {publicPath} from './server-path.mjs';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=await realpath(fileURLToPath(new URL('..',import.meta.url)));
const runFile=promisify(execFile);
// Each render loads the current generator and its dependencies from disk.
const renderHTML=()=>runFile(process.execPath,[resolve(root,'scripts/render-html.mjs')]);
await renderHTML();let revision=0,queue=Promise.resolve();
const watcher=watch(root,{recursive:true},(_,filename)=>{
 if(!filename||/^(\.git|dist|node_modules)/.test(filename))return;
 if(filename==='data/company.json'||filename.startsWith('locales/')||filename.startsWith('scripts/render-html')||filename==='i18n.js')queue=queue.then(()=>renderHTML()).then(()=>revision++).catch(console.error);
 else revision++;
});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const reload=`let current;setInterval(async()=>{try{const next=await(await fetch('/__revision')).text();if(current!==undefined&&current!==next)location.reload();current=next}catch{}},1000);`;
const server=createServer(async(req,res)=>{
 try {
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);res.setHeader('Cache-Control','no-store');
  if(path==='/__revision')return res.end(String(revision));
  if(path==='/__reload.js'){res.setHeader('Content-Type',types['.js']);return res.end(reload);}
  let target=publicPath(root,path);if(!target){res.writeHead(404);return res.end('Not found');}
  if((await stat(target)).isDirectory()) {
   if(!path.endsWith('/')){res.writeHead(302,{Location:`${path}/${new URL(req.url,'http://localhost').search}`});return res.end();}
   target=resolve(target,'index.html');
  }
  // A public path must not become a read of a private file through a symlink.
  if(await realpath(target)!==target){res.writeHead(404);return res.end('Not found');}
  let body=await readFile(target);if(extname(target)==='.html')body=body.toString().replace('</body>','<script type="module" src="/__reload.js"></script></body>');
  res.setHeader('Content-Type',types[extname(target)]||'application/octet-stream');res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT||8766),'127.0.0.1',()=>console.log(`FKNGROUP: http://127.0.0.1:${server.address().port}/`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{watcher.close();server.close(()=>process.exit());});
