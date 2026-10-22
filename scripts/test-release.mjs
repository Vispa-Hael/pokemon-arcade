import {readFile,stat,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const read=p=>readFile(path.join('dist',p),'utf8');
assert.deepEqual(JSON.parse(await read('legacy/status.json')),{chess:true,arena:true,'pokemon-skate':true});
const html=await read('index.html');
assert.match(html,/assets\/index-.*\.js/);
for(const id of ['chess','arena','pokemon-skate']){
 const entry=await read('legacy/'+id+'/index.html');
 for(const [,url] of entry.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^(https?:|data:)/.test(url)||url==='./')continue;
  await stat(path.join('dist/legacy',id,url));
 }
}
let bytes=0,count=0;
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else {const info=await stat(p);assert.ok(info.size<100*1024*1024,'Oversize GitHub file: '+p);bytes+=info.size;count++;}}}
await walk('dist');assert.ok(bytes<1024**3,'Pages site exceeds 1 GB');
await stat('dist/characters/portraits/1025.png');
console.log('Release verified: '+count+' files, '+(bytes/1024**2).toFixed(1)+' MiB; all bundled games and entry dependencies present.');

