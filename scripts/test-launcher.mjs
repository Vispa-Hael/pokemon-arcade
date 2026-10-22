import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const command=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url)),entry=fileURLToPath(new URL('launch-arcade.mjs',import.meta.url));
const env={...process.env,ARCADE_LAUNCHER_PORT:String(port)},base=`http://127.0.0.1:${port}`;
const run=(...args)=>command(process.execPath,[entry,...args],{cwd:root,env,timeout:30000,windowsHide:true});
let started=false;
try{
 await run('--no-browser');started=true;
 assert.equal((await (await fetch(base+'/api/arcade-health')).json()).app,'pokemon-arcade');
 const state=JSON.parse(await readFile(new URL(`../.cache/arcade-server-${port}.json`,import.meta.url),'utf8'));
 await run('--no-browser');const reused=JSON.parse(await readFile(new URL(`../.cache/arcade-server-${port}.json`,import.meta.url),'utf8'));assert.equal(reused.pid,state.pid);
 const blocked=await fetch(base+'/api/arcade-launcher-stop',{method:'POST',headers:{'x-arcade-token':'not-the-owner'}});assert.equal(blocked.status,403);
 await run('--stop');started=false;await delay(400);
 let stopped=false;try{await fetch(base+'/api/arcade-health',{signal:AbortSignal.timeout(1000)});}catch{stopped=true;}assert.equal(stopped,true);
 console.log('PASS: launcher starts a loopback server, reuses it, rejects unauthorized stop, and stops only its owned server.');
}finally{if(started)await run('--stop').catch(()=>{});}
