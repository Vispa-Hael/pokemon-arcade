import {cp,mkdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const files={chess:['index.html','game.js','style.css','scene.css','scene.js','ai-worker-source.js','play-modes.js','puzzle-bank.js','tabletop3d.bundle.js'],arena:['index.html','game.js','style.css']};
const target=process.argv.includes('--snapshot')?'vendor/legacy':'dist/legacy';
for(const [id,list] of Object.entries(files)){
 const source=process.argv.includes('--snapshot')?path.resolve('..',id==='chess'?'Pokemon Chess':'Pokemon Arena'):path.resolve('vendor/legacy',id);
 for(const file of list)await stat(path.join(source,file));
 const destination=path.join(target,id);await mkdir(destination,{recursive:true});
 for(const file of list)await cp(path.join(source,file),path.join(destination,file));
 if(id==='chess')await cp(path.join(source,'assets'),path.join(destination,'assets'),{recursive:true});
 else {await mkdir(path.join(destination,'assets'),{recursive:true});for(const file of ['arena3d.bundle.js','THIRD-PARTY-LICENSE.txt','MODEL-CREDITS.md','model-source-readme.md','roster-source.json','type-chart.json'])await cp(path.join(source,'assets',file),path.join(destination,'assets',file));}
 if(process.argv.includes('--snapshot'))await cp(path.join(source,'README.md'),path.join(destination,'SOURCE-README.md'));
 else await cp(path.join(source,'SOURCE-README.md'),path.join(destination,'SOURCE-README.md'));
 console.log('Packaged '+id+' from '+source);
}
if(!process.argv.includes('--snapshot')){await writeFile(path.join(target,'status.json'),JSON.stringify({chess:true,arena:true}));await writeFile('dist/.nojekyll','');}
