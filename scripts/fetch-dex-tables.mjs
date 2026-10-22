import {mkdir,writeFile,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const cache=new URL('../.cache/national-dex/',import.meta.url);await mkdir(cache,{recursive:true});
const files=['pokemon','pokemon_species','pokemon_species_names','pokemon_species_flavor_text','pokemon_stats','pokemon_types','pokemon_abilities','types','abilities','pokemon_habitats','versions'];
for(const file of files){const output=new URL(file+'.csv',cache);try{await access(output);continue;}catch{/* fetch missing cache only */}const response=await fetch(`https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${file}.csv`,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error(`${file}: ${response.status}`);await writeFile(output,await response.text());console.log('Cached',file);await delay(350);}

