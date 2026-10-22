import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseCsv} from '../scripts/csv';
import {normalize} from '../src/games/guess/rules';
describe('bulk data parsing and expanded identities',()=>{
 it('reads quoted commas, doubled quotes, CRLF, UTF-8 and embedded newlines',()=>{expect(parseCsv('id,name,description\r\n1,"Mr. Mime","A comma, and ""quote""\nnext line"\r\n2,Flabébé,Flower\r\n')).toEqual([{id:'1',name:'Mr. Mime',description:'A comma, and "quote"\nnext line'},{id:'2',name:'Flabébé',description:'Flower'}]);});
 it('rejects malformed bulk input',()=>{expect(()=>parseCsv('id,name\n1')).toThrow();expect(()=>parseCsv('id,name\n1,"open')).toThrow();});
 it('keeps male and female Nidoran guesses distinct while accepting spelled-out genders',()=>{expect(normalize('Nidoran♀')).toBe(normalize('nidoran-f'));expect(normalize('Nidoran female')).toBe(normalize('nidoran-f'));expect(normalize('Nidoran♂')).toBe(normalize('Nidoran male'));expect(normalize('Nidoran♀')).not.toBe(normalize('Nidoran♂'));});
 it('checks PNG signatures for the published portrait manifest',()=>{let manifest:Record<string,string>;try{manifest=JSON.parse(readFileSync(new URL('../src/data/portraits.json',import.meta.url),'utf8'));}catch{throw Error('Publish the completed National Dex import before running coverage checks');}for(const [id,url]of Object.entries(manifest)){const image=readFileSync(new URL('../public'+url,import.meta.url));expect(image.subarray(0,8).toString('hex'),`portrait ${id}`).toBe('89504e470d0a1a0a');}});
});

it('covers the complete imported National Dex with stable species and default-form relationships',async()=>{
 const {default:catalog}=await import('../src/data/catalog.json');
 const {default:portraits}=await import('../src/data/portraits.json');
 const {default:trivia}=await import('../src/games/guess/trivia.json');
 expect(catalog.species.map(s=>s.nationalDex).sort((a,b)=>a-b)).toEqual(Array.from({length:1025},(_,i)=>i+1));
 expect(catalog.forms.length).toBeGreaterThan(catalog.species.length);
 for(const species of catalog.species){const defaults=catalog.forms.filter(f=>f.speciesId===species.id&&f.isDefault);expect(defaults).toHaveLength(1);const form=defaults[0];expect((portraits as Record<string,string>)[form.id]).toBeTruthy();expect((trivia as Record<string,unknown[]>)[species.id].length).toBeGreaterThan(0);expect(form.stats).not.toBeNull();}
 expect(catalog.forms.some(f=>f.name.includes('alola'))).toBe(true);
 expect(catalog.forms.some(f=>f.name.includes('galar'))).toBe(true);
 expect(catalog.forms.some(f=>f.name.includes('hisui'))).toBe(true);
 expect(catalog.forms.some(f=>f.name.includes('paldea'))).toBe(true);
});
