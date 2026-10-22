export interface Stats { hp:number; attack:number; defense:number; specialAttack:number; specialDefense:number; speed:number }
export interface Move { id:number; name:string; type:string|null; power:number|null; accuracy:number|null; pp:number|null; damageClass:string|null }
export interface Species {
 id:number; nationalDex:number; name:string; displayName:string; generation:number|null;
 genus:string|null; description:string|null; habitat:string|null;
 evolvesFrom:number|null; evolutionChainId:number|null;
 varieties:{formId:number; isDefault:boolean}[];
}
export interface Form {
 id:number; speciesId:number; name:string; displayName:string; isDefault:boolean;
 heightM:number|null; weightKg:number|null; types:string[]|null;
 abilities:{id:number; name:string; hidden:boolean}[]|null;
 stats:Stats|null; baseStatTotal:number|null; moves:Move[]|null;
 artwork:string|null; sprite:string|null;
}
export interface Individual { id:string; formId:number; nickname:string|null; level:number|null }
export interface Catalog { schemaVersion:1; source:string; importedAt:string; species:Species[]; forms:Form[] }
const positive = (n:unknown) => Number.isInteger(n) && Number(n)>0;
export function validateCatalog(data:Catalog):void {
 if(data.schemaVersion!==1 || !Array.isArray(data.species) || !Array.isArray(data.forms)) throw Error('Unsupported character catalog');
 const species=new Set<number>(), forms=new Set<number>();
 for(const s of data.species){
  if(!positive(s.id)||s.id!==s.nationalDex||species.has(s.id)||!s.name||!s.displayName||!Array.isArray(s.varieties)|| (s.generation!==null&&!positive(s.generation))) throw Error('Invalid species identity');
  species.add(s.id);
 }
 for(const f of data.forms){
  if(!positive(f.id)||forms.has(f.id)||!species.has(f.speciesId)||!f.name||!f.displayName||typeof f.isDefault!=='boolean') throw Error('Invalid form identity');
  for(const n of [f.heightM,f.weightKg]) if(n!==null && (!Number.isFinite(n)||n<0)) throw Error('Invalid measurement');
  if(f.types!==null && (!Array.isArray(f.types)||!f.types.length||f.types.some(t=>!t))) throw Error('Invalid types');
  if(f.stats){const values=['hp','attack','defense','specialAttack','specialDefense','speed'].map(k=>f.stats![k as keyof Stats]); if(values.some(n=>!positive(n))||values.reduce((a,b)=>a+b,0)!==f.baseStatTotal) throw Error('Invalid base stats');}
  else if(f.baseStatTotal!==null) throw Error('Total without stats');
  if(!data.species.find(s=>s.id===f.speciesId)!.varieties.some(v=>v.formId===f.id&&v.isDefault===f.isDefault)) throw Error('Unlinked form');
  forms.add(f.id);
 }
}
export class CharacterDatabase {
 private species:Map<number,Species>; private forms:Map<number,Form>;
 constructor(data:Catalog){validateCatalog(data);this.species=new Map(data.species.map(s=>[s.id,s]));this.forms=new Map(data.forms.map(f=>[f.id,f]));}
 getSpecies<K extends keyof Species>(id:number, fields:readonly K[]):Pick<Species,K>|undefined {const s=this.species.get(id);return s?structuredClone(Object.fromEntries(fields.map(k=>[k,s[k]]))) as Pick<Species,K>:undefined;}
 getForm<K extends keyof Form>(id:number,fields:readonly K[]):Pick<Form,K>|undefined {const f=this.forms.get(id);return f?structuredClone(Object.fromEntries(fields.map(k=>[k,f[k]]))) as Pick<Form,K>:undefined;}
 queryForms<K extends keyof Form>(fields:readonly K[],filter:{speciesId?:number;type?:string;defaultOnly?:boolean}={}):Pick<Form,K>[] {return [...this.forms.values()].filter(f=>(filter.speciesId===undefined||f.speciesId===filter.speciesId)&&(!filter.type||f.types?.includes(filter.type))&&(!filter.defaultOnly||f.isDefault)).map(f=>this.getForm(f.id,fields)!);}
}
