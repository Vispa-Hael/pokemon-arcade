/** Metadata only: registration never launches a game or accesses player storage. */
export interface GameCapabilities {
 readonly launch: 'inline' | 'iframe';
 readonly pokemonData: 'shared-catalog' | 'independent';
 /** Ownership of existing persistence, not a promise of resumable gameplay. */
 readonly saves: 'hub' | 'game' | 'none';
}
export interface GameRegistration {
 /** Persistent identity used by routes and existing storage; never derive from the name. */
 readonly id: string;
 readonly name: string;
 readonly version: string;
 readonly route: `/games/${string}`;
 readonly capabilities: GameCapabilities;
}
const idPattern=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const versionPattern=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
export function validateRegistration(value:unknown):asserts value is GameRegistration {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid game registration: expected an object');
 const game=value as Record<string,unknown>;
 const invalid=(field:string):never=>{throw Error('Invalid game registration '+String(game.id??'(unknown)')+': '+field);};
 if(typeof game.id!=='string'||!idPattern.test(game.id))invalid('id');
 if(typeof game.name!=='string'||!game.name.trim())invalid('name');
 if(typeof game.version!=='string'||!versionPattern.test(game.version))invalid('version');
 if(game.route!==`/games/${game.id}`)invalid('route must match the stable id');
 const capabilities=game.capabilities;
 if(!capabilities||typeof capabilities!=='object'||Array.isArray(capabilities))invalid('capabilities');
 const caps=capabilities as Record<string,unknown>;
 for(const [key,allowed] of Object.entries({launch:['inline','iframe'],pokemonData:['shared-catalog','independent'],saves:['hub','game','none']})){
  if(!allowed.includes(caps[key] as string))invalid('capabilities.'+key);
 }
}
export function createRegistry<T extends GameRegistration>(games:readonly T[]):ReadonlyMap<string,T> {
 const registry=new Map<string,T>();
 for(const game of games){
  validateRegistration(game);
  if(registry.has(game.id))throw Error('Duplicate game registration: '+game.id);
  registry.set(game.id,game);
 }
 return registry;
}
export function routeGame(hash:string):string|null {
 const id=/^#\/games\/([^/]+)$/.exec(hash)?.[1];
 return id&&idPattern.test(id)?id:null;
}
