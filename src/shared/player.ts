export interface StorageAdapter {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export interface Progress {results:number;best:number;total:number;positive:number}
export interface Activity {launches:number;seconds:number}
interface Envelope {version:1;value:unknown}
export interface Score {roundId:string;value:number;at:string}
export class PlayerServices {
 warning='';private memory=new Map<string,string>();
 constructor(private storage:StorageAdapter){}
 read<T>(key:string,valid:(x:unknown)=>x is T,fallback:T):T {
  try{const raw=this.memory.get(key)??this.storage.getItem('pokemon-arcade:v1:'+key);if(!raw)return fallback;const e=JSON.parse(raw) as Envelope;return e.version===1&&valid(e.value)?e.value:fallback;}catch{this.warning='Local storage is unavailable or damaged. This session can still be played.';return fallback;}
 }
 write(key:string,value:unknown){const raw=JSON.stringify({version:1,value});this.memory.set(key,raw);try{this.storage.setItem('pokemon-arcade:v1:'+key,raw);}catch{this.warning='Progress is held for this session only; browser storage is unavailable.';}}
 save<T>(game:string,state:T){this.write(`save:${game}`,state)}
 load<T>(game:string,valid:(x:unknown)=>x is T){return this.read(`save:${game}`,valid,null as T|null)}
 scores(game:string){return this.read(`scores:${game}`,(x):x is Score[]=>Array.isArray(x)&&x.every(s=>typeof s.roundId==='string'&&Number.isFinite(s.value)&&typeof s.at==='string'),[]);}
 record(game:string,roundId:string,value:number){if(!Number.isFinite(value))throw Error('Invalid score');const all=this.scores(game);if(!all.some(s=>s.roundId===roundId)){const progress=this.progress(game);this.write(`scores:${game}`,[{roundId,value,at:new Date().toISOString()},...all].slice(0,game==='guess-daily'?3660:100));this.write(`progress:${game}`,{results:progress.results+1,best:Math.max(progress.best,value),total:progress.total+value,positive:progress.positive+Number(value>0)});}}
 progress(game:string):Progress {const scores=this.scores(game);return this.read(`progress:${game}`,(x):x is Progress=>!!x&&typeof x==='object'&&['results','best','total','positive'].every(k=>Number.isFinite((x as unknown as Record<string,number>)[k])&&(x as unknown as Record<string,number>)[k]>=0),{results:scores.length,best:Math.max(0,...scores.map(s=>s.value)),total:scores.reduce((n,s)=>n+s.value,0),positive:scores.filter(s=>s.value>0).length});}
 activity(){return this.read('activity',(x):x is Record<string,Activity>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(v=>!!v&&Number.isInteger(v.launches)&&v.launches>=0&&Number.isFinite(v.seconds)&&v.seconds>=0),{});}
 startSession(game:string){const activity=this.activity();const old=activity[game]??{launches:0,seconds:0};this.write('activity',{...activity,[game]:{...old,launches:old.launches+1}});const start=Date.now();let finished=false;return ()=>{if(finished)return;finished=true;const all=this.activity();const current=all[game]??{launches:1,seconds:0};this.write('activity',{...all,[game]:{...current,seconds:current.seconds+Math.max(0,Math.floor((Date.now()-start)/1000))}});};}
 recent(){return this.read('recent',(x):x is string[]=>Array.isArray(x)&&x.every(v=>typeof v==='string'),[]);}
 visit(game:string){this.write('recent',[game,...this.recent().filter(x=>x!==game)].slice(0,8));}
 settings(game:string){return this.read(`settings:${game}`,(x):x is Record<string,boolean>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(v=>typeof v==='boolean'),{});}
 setSettings(game:string,settings:Record<string,boolean>){this.write(`settings:${game}`,settings)}
}
