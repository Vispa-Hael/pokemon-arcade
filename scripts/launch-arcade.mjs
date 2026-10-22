import {spawn} from 'node:child_process';
import {mkdir,open,readFile,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.ARCADE_LAUNCHER_PORT??4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid arcade port');
const base=`http://127.0.0.1:${port}`,cache=new URL('../.cache/',import.meta.url);
async function ready(){try{const res=await fetch(base+'/api/arcade-health',{signal:AbortSignal.timeout(1000)});return res.ok&&(await res.json()).app==='pokemon-arcade';}catch{return false;}}
if(process.argv.includes('--stop')){
 try{const state=JSON.parse(await readFile(new URL(`arcade-server-${port}.json`,cache),'utf8'));const response=await fetch(base+'/api/arcade-launcher-stop',{method:'POST',headers:{'x-arcade-token':state.token},signal:AbortSignal.timeout(3000)});if(!response.ok)throw Error('Server did not accept launcher ownership token');console.log('Arcade stopped.');}catch(error){console.error('No launcher-owned arcade could be stopped. A manually started server is left running.',String(error));process.exitCode=1;}
}else{
 if(!await ready()){
  try{await access(new URL('../node_modules/vite/package.json',import.meta.url));}catch{throw Error('Dependencies are missing. Run npm ci in the arcade folder once.');}
  try{const response=await fetch(base,{signal:AbortSignal.timeout(500)});if(response)throw Error(`Port ${port} belongs to a different app. Close that app or choose a different arcade port.`);}catch(error){if(error.message?.startsWith('Port '))throw error;}
  await mkdir(cache,{recursive:true});const log=await open(new URL('launcher.log',cache),'a');
  const child=spawn(process.execPath,[fileURLToPath(new URL('local-server.mjs',import.meta.url))],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',log.fd,log.fd],env:{...process.env,ARCADE_LAUNCHER_TOKEN:randomUUID(),ARCADE_LAUNCHER_PORT:String(port)}});child.unref();await log.close();
  let started=false;for(let i=0;i<60;i++){await delay(250);if(await ready()){started=true;break;}}
  if(!started)throw Error('The arcade could not start. Check .cache/launcher.log.');
 }
 if(!process.argv.includes('--no-browser')){
  if(process.platform!=='win32')console.log('Open '+base);
  else{const browser=spawn(process.env.ComSpec??'cmd.exe',['/d','/c','start','',base],{windowsHide:true,stdio:'ignore'});browser.unref();}
 }
 console.log('Pokémon Arcade is ready: '+base);
}
