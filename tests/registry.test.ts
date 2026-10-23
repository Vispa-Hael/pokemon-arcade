// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {createRegistry as registerMetadata,validateRegistration,routeGame,type GameRegistration} from '../src/shared/registry';
import {createRegistry,type GameModule} from '../src/shared/game';
const modules=import.meta.glob<{default:GameModule}>('../src/games/*/index.ts',{eager:true});
const games=Object.values(modules).map(m=>m.default);
const registration:GameRegistration={id:'test-game',name:'Test game',version:'1.2.3',route:'/games/test-game',capabilities:{launch:'inline',pokemonData:'shared-catalog',saves:'none'}};
afterEach(()=>vi.restoreAllMocks());
it('supports minimal metadata without gameplay, player services or hub presentation',()=>{const registry=registerMetadata([registration]);expect(registry.get('test-game')).toBe(registration);expect([...registry.keys()]).toEqual(['test-game']);expect(registerMetadata([]).size).toBe(0);});
it('keeps all six stable IDs and routes and declares their existing integration boundaries',()=>{
 const expected={arena:['iframe','independent','none'],chess:['iframe','independent','game'],guess:['inline','shared-catalog','hub'],'jungle-caravan':['inline','shared-catalog','hub'],'pocket-capsule-monsters':['inline','shared-catalog','hub'],'pokemon-skate':['iframe','independent','game']};
 const registry=createRegistry(games);expect([...registry.keys()].sort()).toEqual(Object.keys(expected).sort());
 for(const [id,[launch,pokemonData,saves]] of Object.entries(expected)){const game=registry.get(id)!;expect(game.route).toBe('/games/'+id);expect(routeGame('#'+game.route)).toBe(id);expect(game.capabilities).toEqual({launch,pokemonData,saves});expect(()=>validateRegistration(game)).not.toThrow();}
});
it.each([null,[],{}, {...registration,id:'Test game'},{...registration,id:'test--game'},{...registration,name:' '},{...registration,version:'latest'},{...registration,version:'01.2.3'},{...registration,route:'/games/other'},{...registration,capabilities:null},{...registration,capabilities:{...registration.capabilities,launch:'popup'}},{...registration,capabilities:{...registration.capabilities,pokemonData:'remote'}},{...registration,capabilities:{...registration.capabilities,saves:'cloud'}}])('rejects malformed registration %#',value=>{expect(()=>validateRegistration(value)).toThrow(/Invalid game registration/);});
it('rejects duplicates with the offending ID and invalid mount adapters',()=>{expect(()=>registerMetadata([registration,registration])).toThrow('Duplicate game registration: test-game');expect(()=>createRegistry([{...games[0],mount:null} as unknown as GameModule])).toThrow(': mount');});
it('accepts release labels and rejects route suffixes or URLs',()=>{expect(()=>validateRegistration({...registration,version:'2.0.0-beta.1+build.7'})).not.toThrow();for(const route of ['#/games/test-game/extra','#/games/test-game?x=1','#/games/test-game/','#/games/test--game','https://host/#/games/test-game','#/daily'])expect(routeGame(route)).toBeNull();});
it('registration does not mount games, read or rewrite saves, scores or settings',()=>{
 localStorage.clear();const saved={'pokemon-arcade:v1:save:guess':'{"version":1,"value":{"existing":"untouched"}}','pokemon-chess-puzzles':'{"solved":[1]}','pokemon-skate:v1:scores:pokemon-skate-3d-free':'{"version":1,"value":[]}',tracker:'unrelated'};
 for(const [key,value] of Object.entries(saved))localStorage.setItem(key,value);
 const read=vi.spyOn(Storage.prototype,'getItem'),write=vi.spyOn(Storage.prototype,'setItem'),remove=vi.spyOn(Storage.prototype,'removeItem');
 const mount=vi.fn();const entries=games.map(game=>({...game,mount}));const before=entries.map(game=>JSON.stringify(game));
 createRegistry(entries);expect(mount).not.toHaveBeenCalled();expect(read).not.toHaveBeenCalled();expect(write).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();expect(entries.map(game=>JSON.stringify(game))).toEqual(before);
 for(const [key,value] of Object.entries(saved))expect(localStorage.getItem(key)).toBe(value);
});
