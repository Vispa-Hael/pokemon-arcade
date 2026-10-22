import type {CharacterDatabase} from '../data/model';
import type {PlayerServices} from './player';
export interface GameContext {characters:CharacterDatabase;player:PlayerServices; legacyAvailable:Record<string,boolean>; reducedMotion:boolean;challenge?:{day:string}}
export interface GameModule {id:string;name:string;description:string;instructions:string;version:string;route:string;status:'Playable'|'Prototype';controls:string[];icon:string;thumbnail?:string;category?:'Puzzle'|'Strategy'|'Action';scoreKeys?:string[];resume?:(player:PlayerServices,characters:CharacterDatabase)=>{label:string;detail:string}|null;saveVersion?:number; mount:(host:HTMLElement,context:GameContext)=>void|(()=>void)}
export function createRegistry(modules:GameModule[]){const map=new Map<string,GameModule>();for(const m of modules){if(!/^[a-z][a-z0-9-]*$/.test(m.id)||m.route!==`/games/${m.id}`||map.has(m.id)||!m.name||!m.version||typeof m.mount!=='function')throw Error('Invalid or duplicate game registration');map.set(m.id,m);}return map;}
export function routeGame(hash:string){return /^#\/games\/([a-z][a-z0-9-]*)$/.exec(hash)?.[1]??null;}
