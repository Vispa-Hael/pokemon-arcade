import {readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {parseCsv} from './csv.ts';
import {validateCatalog,type Catalog,type Stats} from '../src/data/model.ts';
const root=new URL('../',import.meta.url),cache=new URL('.cache/national-dex/',root);
await mkdir(new URL('public/characters/portraits/',root),{recursive:true});
const read=async(name:string)=>parseCsv(await readFile(new URL(name+'.csv',cache),'utf8'));
const [pokemon,species,names,flavor,stats,types,abilities,typeNames,abilityNames,habitats,versions]=await Promise.all(['pokemon','pokemon_species','pokemon_species_names','pokemon_species_flavor_text','pokemon_stats','pokemon_types','pokemon_abilities','types','abilities','pokemon_habitats','versions'].map(read));
const previous:Catalog=JSON.parse(await readFile(new URL('src/data/catalog.json',root),'utf8'));validateCatalog(previous);
const byId=(rows:Record<string,string>[])=>new Map(rows.map(r=>[Number(r.id),r]));
const group=(rows:Record<string,string>[],key:string)=>{const map=new Map<number,Record<string,string>[]>();for(const row of rows){const id=Number(row[key]);map.set(id,[...(map.get(id)??[]),row]);}return map;};
const englishNames=new Map(names.filter(n=>n.local_language_id==='9').map(n=>[Number(n.pokemon_species_id),n]));
const typeMap=byId(typeNames),abilityMap=byId(abilityNames),habitatMap=byId(habitats),versionMap=byId(versions);
const pBySpecies=group(pokemon,'species_id'),statMap=group(stats,'pokemon_id'),typesMap=group(types,'pokemon_id'),abilitiesMap=group(abilities,'pokemon_id'),flavorMap=group(flavor.filter(f=>f.language_id==='9'),'species_id');
const clean=(s:string)=>s.replace(/\u00ad\s*/g,'').replace(/\s+/g,' ').replace(/POKéMON/g,'Pokémon').trim();
const normal=(s:string)=>s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const trivia:Record<string,{text:string;version:string}[]>={};
const oldTrivia=JSON.parse(await readFile(new URL('src/games/guess/trivia.json',root),'utf8'));
const normalizedNames=new Map(species.map(s=>[Number(s.id),englishNames.get(Number(s.id))]));
const catalog:Catalog={schemaVersion:1,source:'https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv',importedAt:new Date().toISOString(),species:[],forms:[]};
for(const s of species){const id=Number(s.id),name=normalizedNames.get(id),entries=flavorMap.get(id)??[];
 catalog.species.push({id,nationalDex:id,name:s.identifier,displayName:name?.name||s.identifier,generation:Number(s.generation_id)||null,genus:name?.genus||null,description:entries[0]?clean(entries[0].flavor_text):null,habitat:habitatMap.get(Number(s.habitat_id))?.identifier??null,evolvesFrom:Number(s.evolves_from_species_id)||null,evolutionChainId:Number(s.evolution_chain_id)||null,varieties:(pBySpecies.get(id)??[]).map(p=>({formId:Number(p.id),isDefault:p.is_default==='1'}))});
 const candidates=entries.map(e=>({text:clean(e.flavor_text),version:versionMap.get(Number(e.version_id))?.identifier??e.version_id})).filter(e=>!normal(e.text).includes(normal(name?.name??s.identifier)));
 const unique=[...new Map(candidates.map(e=>[normal(e.text),e])).values()];const selected:{text:string;version:string}[]=[];
 const words=(s:string)=>new Set(s.toLowerCase().match(/[a-z]+/g));
 while(selected.length<4&&unique.length){let best=0,novelty=-1;for(let i=0;i<unique.length;i++){const a=words(unique[i].text);const n=selected.length?Math.min(...selected.map(e=>{const b=words(e.text);return 1-[...a].filter(v=>b.has(v)).length/new Set([...a,...b]).size;})):0;if(n>novelty){novelty=n;best=i;}}selected.push(unique.splice(best,1)[0]);}
 // Newer species can have fewer unique English entries: never invent missing trivia.
 if(!selected.length&&name?.genus)selected.push({text:`Its Pokédex classification is “${name.genus}”.`,version:'species-classification'});
 trivia[id]=oldTrivia[id]?.length?oldTrivia[id]:selected;
}
const statsKeys:(keyof Stats)[]=['hp','attack','defense','specialAttack','specialDefense','speed'];
for(const p of pokemon){const id=Number(p.id),speciesId=Number(p.species_id),s=catalog.species.find(s=>s.id===speciesId);if(!s)throw Error(`Orphan Pokémon ${id}`);
 const sourceStats=statMap.get(id)??[];const statValues=statsKeys.map((_,i)=>Number(sourceStats.find(r=>Number(r.stat_id)===i+1)?.base_stat));
 const base=statValues.every(n=>Number.isInteger(n)&&n>0)?Object.fromEntries(statsKeys.map((k,i)=>[k,statValues[i]])) as unknown as Stats:null;
 const old=previous.forms.find(f=>f.id===id);const f={id,speciesId,name:p.identifier,displayName:p.is_default==='1'?s.displayName:p.identifier.split('-').map(n=>n[0].toUpperCase()+n.slice(1)).join(' '),isDefault:p.is_default==='1',heightM:p.height?Number(p.height)/10:null,weightKg:p.weight?Number(p.weight)/10:null,types:(typesMap.get(id)??[]).sort((a,b)=>Number(a.slot)-Number(b.slot)).map(r=>typeMap.get(Number(r.type_id))!.identifier),abilities:(abilitiesMap.get(id)??[]).map(r=>({id:Number(r.ability_id),name:abilityMap.get(Number(r.ability_id))!.identifier,hidden:r.is_hidden==='1'})),stats:base,baseStatTotal:base?statValues.reduce((a,b)=>a+b,0):null,moves:old?.moves??null,artwork:old?.artwork??null,sprite:old?.sprite??null};
 catalog.forms.push(old?{...f,...old}:f);
}
for(const form of catalog.forms)if(form.abilities?.length===0)form.abilities=null;
validateCatalog(catalog);
const portraitManifest:Record<string,string>={};const failures:{id:number;reason:string}[]=[];
const defaults=catalog.forms.filter(f=>f.isDefault);
let lastStart=0;let downloaded=0;
for(const [i,form]of defaults.entries()){
 const id=form.id;const oldUrl=new URL(`public/capsule/portraits/${id}.png`,root),newUrl=new URL(`public/characters/portraits/${id}.png`,root);
 try{await access(oldUrl);portraitManifest[id]=`/capsule/portraits/${id}.png`;continue;}catch{/* not in original eight */}
 let bytes:Buffer|undefined;
 try{bytes=await readFile(newUrl);}catch{/* not cached yet */}
 if(!bytes){
  for(const folder of ['other/official-artwork/','other/home/','']){
   await delay(Math.max(0,180-(Date.now()-lastStart)));lastStart=Date.now();
   try{const response=await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${folder}${id}.png`,{signal:AbortSignal.timeout(20000)});if(response.status===404)continue;if(!response.ok)throw Error(`HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());break;}catch(error){failures.push({id,reason:String(error)});break;}
  }
  if(bytes){if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error(`Invalid PNG ${id}`);await writeFile(new URL(`${id}.png.tmp`,new URL('public/characters/portraits/',root)),bytes);await rename(new URL(`${id}.png.tmp`,new URL('public/characters/portraits/',root)),newUrl);downloaded++;}
 }
 if(bytes){if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error(`Corrupt cached PNG ${id}`);portraitManifest[id]=`/characters/portraits/${id}.png`;form.artwork??=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;}else failures.push({id,reason:'No portrait available'});
 if((i+1)%25===0||i===defaults.length-1)console.log(`${i+1}/${defaults.length} species portraits checked; ${downloaded} downloaded; ${failures.length} issues`);
}
// Preserve alternate-form portrait access for existing games without adding them to the quiz.
for(const f of previous.forms){try{await access(new URL(`public/capsule/portraits/${f.id}.png`,root));portraitManifest[f.id]=`/capsule/portraits/${f.id}.png`;}catch{/* no existing portrait */}}
const playable=defaults.filter(f=>portraitManifest[f.id]&&trivia[f.speciesId]?.length);
if(playable.length!==defaults.length){await writeFile(new URL('coverage-errors.json',cache),JSON.stringify({failures,missing:defaults.filter(f=>!portraitManifest[f.id]||!trivia[f.speciesId]?.length).map(f=>f.id)},null,2));throw Error(`Only ${playable.length}/${defaults.length} ready. Rerun to resume. Catalog has not been published.`);}
const sourceHashes=Object.fromEntries(await Promise.all(['pokemon','pokemon_species','pokemon_species_names','pokemon_species_flavor_text','pokemon_stats','pokemon_types','pokemon_abilities','types','abilities','pokemon_habitats','versions'].map(async name=>[name,createHash('sha256').update(await readFile(new URL(name+'.csv',cache))).digest('hex')])));
const report={sourceHashes,formsWithStats:catalog.forms.filter(f=>f.stats).length,formsWithUnavailableAbilities:catalog.forms.filter(f=>f.abilities===null).map(f=>f.id),formsWithMoveLists:catalog.forms.filter(f=>f.moves!==null).length,importedAt:catalog.importedAt,source:catalog.source,species:catalog.species.length,forms:catalog.forms.length,defaultForms:defaults.length,playable:playable.length,portraits:Object.keys(portraitManifest).length,triviaFacts:Object.values(trivia).reduce((n,f)=>n+f.length,0),generationCounts:Object.fromEntries([...new Set(catalog.species.map(s=>s.generation))].sort().map(g=>[String(g),catalog.species.filter(s=>s.generation===g).length])),fewerThanFourFacts:catalog.species.filter(s=>(trivia[s.id]?.length??0)<4).map(s=>({id:s.id,name:s.displayName,facts:trivia[s.id]?.length??0})),moveMetadata:'New forms have unavailable move lists; original seeded lists retained.',failures};
await writeFile(new URL('staged-catalog.json',cache),JSON.stringify(catalog));
await writeFile(new URL('staged-trivia.json',cache),JSON.stringify(trivia));
await writeFile(new URL('staged-portraits.json',cache),JSON.stringify(portraitManifest));
await writeFile(new URL('coverage.json',cache),JSON.stringify(report,null,2));
console.log('Import complete; staged data ready:',JSON.stringify({...report,fewerThanFourFacts:report.fewerThanFourFacts.length,failures:report.failures.length}));
