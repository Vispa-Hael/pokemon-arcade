import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {validateCatalog,type Catalog} from '../src/data/model.ts';
const root=new URL('../',import.meta.url),cache=new URL('.cache/national-dex/',root);
const catalog:Catalog=JSON.parse(await readFile(new URL('staged-catalog.json',cache),'utf8'));validateCatalog(catalog);
const trivia=JSON.parse(await readFile(new URL('staged-trivia.json',cache),'utf8')),portraits=JSON.parse(await readFile(new URL('staged-portraits.json',cache),'utf8'));
for(const form of catalog.forms.filter(f=>f.isDefault))if(!portraits[form.id]||!trivia[form.speciesId]?.length)throw Error(`Incomplete quiz record ${form.id}`);
const backup=new URL('before-national-dex/',cache);await mkdir(backup,{recursive:true});
for(const file of ['src/data/catalog.json','src/games/guess/trivia.json','src/shared/portraits.ts']){
 const name=file.replaceAll('/','_');try{await writeFile(new URL(name,backup),await readFile(new URL(file,root)),{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
}
for(const [file,data]of [['src/data/catalog.json',catalog],['src/games/guess/trivia.json',trivia],['src/data/portraits.json',portraits]]){const dest=new URL(file as string,root);await writeFile(new URL((file as string)+'.tmp',root),JSON.stringify(data)+'\n');await rename(new URL((file as string)+'.tmp',root),dest);}
await writeFile(new URL('src/shared/portraits.ts',root),"/** Offline character-art manifest, generated only after validating downloaded PNG files. */\nimport portraits from '../data/portraits.json';\nexport function portraitUrl(formId:number):string|null {\n return (portraits as Record<string,string>)[String(formId)]??null;\n}\r\n");
await writeFile(new URL('docs/CHARACTER-COVERAGE.json',root),await readFile(new URL('coverage.json',cache)));
console.log(`Published ${catalog.species.length} species / ${catalog.forms.length} forms locally; originals backed up in .cache/national-dex/before-national-dex`);
