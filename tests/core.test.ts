import {describe,it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,validateCatalog,type Catalog} from '../src/data/model';
import {PlayerServices,type StorageAdapter} from '../src/shared/player';
import {createRegistry,routeGame,type GameModule} from '../src/shared/game';
import guessModule from '../src/games/guess';
import chess from '../src/games/chess';
import arena from '../src/games/arena';
import {newRound,guess,hint,score,validRound} from '../src/games/guess/rules';
const data=raw as Catalog;
class Memory implements StorageAdapter {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
describe('character catalog',()=>{
 it('validates the actual imported snapshot',()=>expect(()=>validateCatalog(data)).not.toThrow());
 it('separates species and alternate form IDs',()=>{const db=new CharacterDatabase(data);expect(db.getForm(10026,['speciesId','isDefault'])).toEqual({speciesId:681,isDefault:false});expect(db.getSpecies(681,['nationalDex'])).toEqual({nationalDex:681});expect(db.getSpecies(10026,['id'])).toBeUndefined();});
 it('projects only requested fields and supports filters',()=>{const db=new CharacterDatabase(data);expect(db.getForm(25,['id','weightKg'])).toEqual({id:25,weightKg:6});expect(db.queryForms(['id'],{type:'electric'})).toContainEqual({id:25});expect(db.queryForms(['id'],{speciesId:681})).toEqual(expect.arrayContaining([{id:681},{id:10026}]));});
 it('preserves null metadata and unknown IDs',()=>{const db=new CharacterDatabase(data);expect(db.getForm(25,['moves'])!.moves![0].power).toBeNull();expect(db.getForm(999999,['id'])).toBeUndefined();});
 it('does not leak mutable records',()=>{const db=new CharacterDatabase(data);const f=db.getForm(25,['types'])!;f.types!.push('fake');expect(db.getForm(25,['types'])!.types).toEqual(['electric']);});
 it.each(['duplicate','orphan','stats','negative','link'])('rejects invalid %s',kind=>{const c=structuredClone(data);if(kind==='duplicate')c.species.push(c.species[0]);if(kind==='orphan')c.forms[0].speciesId=999999;if(kind==='stats')c.forms[0].baseStatTotal=0;if(kind==='negative')c.forms[0].heightM=-1;if(kind==='link')c.species[0].varieties=[];expect(()=>validateCatalog(c)).toThrow();});
});
describe('modules and routes',()=>{
 it('registers independent game entries',()=>expect([...createRegistry([guessModule,chess,arena]).keys()]).toEqual(['guess','chess','arena']));
 it('rejects duplicates and mismatched routes',()=>{expect(()=>createRegistry([chess,chess])).toThrow();expect(()=>createRegistry([{...chess,route:'/oops'} as unknown as GameModule])).toThrow();});
 it('parses only exact game routes',()=>{expect(routeGame('#/games/guess')).toBe('guess');expect(routeGame('#/games/guess/extra')).toBeNull();expect(routeGame('#/')).toBeNull();});
});
describe('player services',()=>{
 it('persists across service instances without touching unrelated keys',()=>{const memory=new Memory();memory.setItem('tracker','preserve');const p=new PlayerServices(memory);p.save('guess',{x:1});const next=new PlayerServices(memory);expect(next.load('guess',(x):x is {x:number}=>!!x&&typeof x==='object'&&'x'in x&&x.x===1)).toEqual({x:1});expect(memory.getItem('tracker')).toBe('preserve');});
 it('deduplicates result IDs, keeps recent games and settings',()=>{const p=new PlayerServices(new Memory());p.record('guess','a',100);p.record('guess','a',100);p.visit('guess');p.visit('chess');p.visit('guess');p.setSettings('arcade',{reducedMotion:true});expect(p.scores('guess')).toHaveLength(1);expect(p.recent()).toEqual(['guess','chess']);expect(p.settings('arcade')).toEqual({reducedMotion:true});});
 it('handles corrupt and future saves',()=>{const m=new Memory();m.setItem('pokemon-arcade:v1:save:guess','{');let p=new PlayerServices(m);expect(p.load('guess',validRound)).toBeNull();m.setItem('pokemon-arcade:v1:save:guess',JSON.stringify({version:99,value:newRound([25])}));p=new PlayerServices(m);expect(p.load('guess',validRound)).toBeNull();});
 it('continues in memory when browser storage throws',()=>{const p=new PlayerServices({getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}});p.save('guess',newRound([25]));expect(p.load('guess',validRound)?.formId).toBe(25);expect(p.warning).toContain('session');});
});
describe('mystery rules',()=>{
 it('selects deterministically and rejects empty rosters',()=>{expect(newRound([1,25],()=>0.9).formId).toBe(25);expect(()=>newRound([])).toThrow();});
 it('normalizes guesses, ignores blanks, and freezes completed rounds',()=>{const initial=newRound([25]);expect(guess(initial,' ',['Pikachu'])).toBe(initial);const won=guess(initial,' PIKÁCHU! ',['Pikachu']);expect(won.status).toBe('won');expect(score(won)).toBe(100);expect(guess(won,'wrong',['Pikachu'])).toBe(won);expect(hint(won)).toBe(won);});
 it('loses on fifth miss and caps hints',()=>{let s=newRound([25]);for(let n=0;n<9;n++)s=hint(s);expect(s.hints).toBe(4);for(let n=0;n<5;n++)s=guess(s,'wrong',['Pikachu']);expect(s.status).toBe('lost');expect(score(s)).toBe(0);expect(validRound(s)).toBe(true);});
 it('scores misses and hints; validates saved state bounds',()=>{let s=hint(newRound([25]));s=guess(s,'wrong',['Pikachu']);s=guess(s,'Pikachu',['Pikachu']);expect(score(s)).toBe(75);expect(validRound({...s,attempts:-1})).toBe(false);expect(validRound({...s,version:2})).toBe(false);});
});
