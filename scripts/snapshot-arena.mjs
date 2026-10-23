// Keep the complete Arena project and an offline browser snapshot in Git.
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const live=path.resolve('../Pokemon Arena');
const target=path.resolve('vendor/legacy/arena');
await mkdir(path.join(target,'source'),{recursive:true});
for(const name of ['src','desktop','assets','index.html','game.js','style.css','README.md','package.json','package-lock.json','smoke-test.cjs','.gitignore']) {
  await cp(path.join(live,name),path.join(target,'source',name),{recursive:true,filter:p=>!p.endsWith('arena3d.bundle.js')&&!p.endsWith('last-smoke.json')});
}
await writeFile(path.join(target,'source','.gitignore'),(await readFile(path.join(live,'.gitignore'),'utf8'))+'\nassets/arena3d.bundle.js\ndesktop/last-smoke.json\n');
for(const name of ['game.js','style.css']) await cp(path.join(live,name),path.join(target,name));
await cp(path.join(live,'README.md'),path.join(target,'SOURCE-README.md'));
await mkdir(path.join(target,'assets'),{recursive:true});
for(const name of ['MODEL-CREDITS.md','THIRD-PARTY-LICENSE.txt','model-source-readme.md','roster-source.json','type-chart.json','boss-source.json','boss-manifest.json']) await cp(path.join(live,'assets',name),path.join(target,'assets',name));
// Separate script strings preserve file:// support and synchronous script order.
// Indirect eval runs the original unmodified bundle in the global scope.
const bundle=await readFile(path.join(live,'assets/arena3d.bundle.js'),'utf8');
const size=48*1024*1024;
const files=[];
for(let start=0;start<bundle.length;start+=size){
  const filename=`assets/arena3d.part-${files.length+1}.js`;
  let code=(start===0?'globalThis.__arenaBundleParts=[];':'')+'globalThis.__arenaBundleParts.push('+JSON.stringify(bundle.slice(start,start+size))+');\n';
  if(start+size>=bundle.length)code+="(0,eval)(globalThis.__arenaBundleParts.join(''));delete globalThis.__arenaBundleParts;\n";
  await writeFile(path.join(target,filename),code);files.push(filename);
}
const html=await readFile(path.join(live,'index.html'),'utf8');
await writeFile(path.join(target,'index.html'),html.replace('<script src="assets/arena3d.bundle.js"></script>',files.map(p=>`<script src="${p}"></script>`).join('')));
await writeFile(path.join(target,'assets/arena3d.bundle.js'),'// Renderer is loaded by arena3d.part-*.js; regenerate with node scripts/snapshot-arena.mjs.\n');
await writeFile(path.join(target,'DEVELOPMENT.md'),'# Arena source and snapshot\n\n`source/` contains the complete editable Arena 0.6.0 project, all 32 local models, desktop packaging, tests, and locked dependencies. In that folder run `npm ci`, then `npm test` and `npm run build` to create the Windows desktop app. `npm run build:renderer` prepares direct browser play. Generated dependencies and desktop executables are excluded from Git.\n\nThe browser snapshot uses ordered script parts to stay below GitHub’s 100 MiB per-file limit while preserving offline file access. From the Arcade root run `node scripts/snapshot-arena.mjs` to refresh it from the sibling Arena folder.\n');
console.log(`Snapshotted complete Arena source and ${files.length} renderer parts.`);
