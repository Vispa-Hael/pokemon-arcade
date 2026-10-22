import {defineConfig, type Plugin} from 'vite';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import type {IncomingMessage,ServerResponse} from 'node:http';
const roots={chess:path.resolve('../Pokemon Chess'),arena:path.resolve('../Pokemon Arena'),'pokemon-skate':path.resolve('../Pokemon Skate/dist')};
const allowed:Record<string,Set<string>>={chess:new Set(['index.html','game.js','style.css','scene.css','scene.js','ai-worker-source.js','play-modes.js','puzzle-bank.js','tabletop3d.bundle.js']),'pokemon-skate':new Set(['index.html','models/25.glb','models/7.glb']),arena:new Set(['index.html','style.css','game.js','assets/arena3d.bundle.js','assets/THIRD-PARTY-LICENSE.txt'])};
function legacy():Plugin {
 const middleware = async(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
 const url=new URL(req.url??'/','http://localhost');
 if(url.pathname==='/api/arcade-health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({app:'pokemon-arcade',version:1}));return;}
 if(url.pathname==='/api/legacy-status'){
 const status=Object.fromEntries(await Promise.all(Object.entries(roots).map(async([id,root])=>{try{await Promise.all([...allowed[id]].map(f=>stat(path.join(root,f))));return [id,true];}catch{return [id,false];}})));
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify(status));return;
 }
 if(!url.pathname.startsWith('/legacy/')){next();return;}
 try{
 const [, ,game,...parts]=decodeURIComponent(url.pathname).split('/'),file=parts.join('/')||'index.html';
 if(!(game in roots)||(!allowed[game].has(file)&&!(game==='pokemon-skate'&&/^assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(file))&&!(game==='chess'&&/^assets\/[a-zA-Z0-9_./-]+\.(png|webp|jpg|glb|gltf|bin)$/.test(file))))throw Error('Not allowed');
 const root=await realpath(roots[game as keyof typeof roots]),target=await realpath(path.resolve(root,file));
 if(!target.startsWith(root+path.sep))throw Error('Outside root');
 const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gltf':'model/gltf+json'};
 res.setHeader('Content-Type',mime[path.extname(target)]??'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(target));
 }catch{res.statusCode=404;res.end('Local game file unavailable');}
 };
 return {name:'read-only-local-games',configureServer(s){s.middlewares.use(middleware)},configurePreviewServer(s){s.middlewares.use(middleware)}};
}
export default defineConfig({base:process.env.ARCADE_BASE_PATH??'/',cacheDir:'.cache/vite',optimizeDeps:{noDiscovery:true,include:[]},plugins:[legacy()],server:{port:4173,strictPort:true},preview:{port:4173,strictPort:true}});


