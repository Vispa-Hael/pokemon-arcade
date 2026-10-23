import {createRegistry as registerMetadata,type GameRegistration} from './registry';
export {routeGame} from './registry';
export type {GameRegistration,GameCapabilities} from './registry';
import type {CharacterDatabase} from '../data/model';
import type {PlayerServices} from './player';
export interface GameContext {characters:CharacterDatabase;player:PlayerServices; legacyAvailable:Record<string,boolean>; reducedMotion:boolean;challenge?:{day:string}}
export interface GameModule extends GameRegistration {description:string;instructions:string;status:'Playable'|'Prototype';controls:string[];icon:string;thumbnail?:string;category?:'Puzzle'|'Strategy'|'Action';scoreKeys?:string[];resume?:(player:PlayerServices,characters:CharacterDatabase)=>{label:string;detail:string}|null;saveVersion?:number; mount:(host:HTMLElement,context:GameContext)=>void|(()=>void)}
/** Compatibility entry point for existing mount-based game modules. */
export function createRegistry(modules:readonly GameModule[]):ReadonlyMap<string,GameModule> {
 const registry=registerMetadata(modules);
 for(const game of registry.values())if(typeof game.mount!=='function')throw Error('Invalid game registration '+game.id+': mount');
 return registry;
}
