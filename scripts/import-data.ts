import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {validateCatalog, type Catalog, type Species, type Form, type Stats} from '../src/data/model.ts';
const root=new URL('../',import.meta.url),cache=new URL('.cache/pokeapi/',root);
await mkdir(cache,{recursive:true});
// Sequential requests, persistent cache, timeout, and per-record atomic checkpoints.
let lastRequest=0;
async function get(path:string):Promise<any>{ // eslint-disable-line @typescript-eslint/no-explicit-any
 const file=new URL(path.replaceAll('/','_')+'.json',cache);
 try{return JSON.parse(await readFile(file,'utf8'));}catch{/* uncached */}
 await new Promise(r=>setTimeout(r,Math.max(0,600-(Date.now()-lastRequest))));lastRequest=Date.now();
 const response=await fetch('https://pokeapi.co/api/v2/'+path,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`${path}: HTTP ${response.status}; rerun to resume`);
 const result=await response.json();await writeFile(file,JSON.stringify(result));return result;
}
const id=(url:string)=>Number(url.match(/\/(\d+)\/?$/)?.[1]);
const output=new URL('src/data/catalog.json',root);
let catalog:Catalog={schemaVersion:1,source:'https://pokeapi.co/api/v2/',importedAt:new Date().toISOString(),species:[],forms:[]};
try{catalog=JSON.parse(await readFile(output,'utf8'));validateCatalog(catalog);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
const ids=(process.argv.slice(2).length?process.argv.slice(2):['1','4','6','7','9','25','133','10026']).map(Number);
if(ids.length>30||ids.some(n=>!Number.isInteger(n)||n<1))throw Error('Provide 1–30 positive Pokémon resource IDs per run');
for(const [index,pokemonId]of ids.entries()){
 if(catalog.forms.some(f=>f.id===pokemonId)){console.log(`${index+1}/${ids.length}: ${pokemonId} already imported`);continue;}
 const p=await get(`pokemon/${pokemonId}`),s=await get(`pokemon-species/${id(p.species.url)}`);
 const english=(items:any[],key:string)=>items.find(x=>x.language.name==='en')?.[key]??null; // eslint-disable-line @typescript-eslint/no-explicit-any
 const species:Species={id:s.id,nationalDex:s.id,name:s.name,displayName:english(s.names,'name')??s.name,generation:id(s.generation.url),genus:english(s.genera,'genus'),description:english(s.flavor_text_entries,'flavor_text')?.replace(/\s+/g,' ')??null,habitat:s.habitat?.name??null,evolvesFrom:s.evolves_from_species?id(s.evolves_from_species.url):null,evolutionChainId:s.evolution_chain?id(s.evolution_chain.url):null,varieties:s.varieties.map((v:any)=>({formId:id(v.pokemon.url),isDefault:v.is_default}))}; // eslint-disable-line @typescript-eslint/no-explicit-any
 const keys: (keyof Stats)[]=['hp','attack','defense','specialAttack','specialDefense','speed'];
 const stats=Object.fromEntries(keys.map((k,i)=>[k,p.stats[i].base_stat])) as unknown as Stats;
 const form:Form={id:p.id,speciesId:s.id,name:p.name,displayName:p.is_default?species.displayName:p.name.split('-').map((x:string)=>x[0].toUpperCase()+x.slice(1)).join(' '),isDefault:p.is_default,heightM:p.height/10,weightKg:p.weight/10,types:p.types.map((t:any)=>t.type.name),abilities:p.abilities.map((a:any)=>({id:id(a.ability.url),name:a.ability.name,hidden:a.is_hidden})),stats,baseStatTotal:Object.values(stats).reduce((a,b)=>a+b,0),moves:p.moves.map((m:any)=>({id:id(m.move.url),name:m.move.name,type:null,power:null,accuracy:null,pp:null,damageClass:null})),artwork:p.sprites.other?.['official-artwork']?.front_default??null,sprite:p.sprites.front_default??null}; // eslint-disable-line @typescript-eslint/no-explicit-any
 catalog.species=catalog.species.filter(x=>x.id!==species.id).concat(species);catalog.forms.push(form);catalog.importedAt=new Date().toISOString();validateCatalog(catalog);
 await writeFile(new URL('src/data/catalog.json.tmp',root),JSON.stringify(catalog,null,2)+'\n');await rename(new URL('src/data/catalog.json.tmp',root),output);
 console.log(`${index+1}/${ids.length}: imported ${form.displayName} (${form.id})`);
}
