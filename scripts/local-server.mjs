import {createServer} from 'vite';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
const port=Number(process.env.ARCADE_LAUNCHER_PORT??4173),token=process.env.ARCADE_LAUNCHER_TOKEN;
if(!Number.isInteger(port)||port<1024||port>65535||!token)throw Error('Invalid launcher configuration');
const state=new URL(`../.cache/arcade-server-${port}.json`,import.meta.url);
const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'arcade-launcher-control',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!=='/api/arcade-launcher-stop'){next();return;}if(req.method!=='POST'||req.headers['x-arcade-token']!==token){res.statusCode=403;res.end('Forbidden');return;}res.end('Stopping arcade');setTimeout(()=>void stop(),100);});}}]});
let stopping=false;async function stop(){if(stopping)return;stopping=true;await server.close();try{await unlink(state);}catch{/* already removed */}process.exit(0);}
await server.listen();await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});await writeFile(state,JSON.stringify({pid:process.pid,port,token,root:new URL('../',import.meta.url).pathname}));
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
console.log(`Pokémon Arcade launcher server: http://127.0.0.1:${port}/`);
