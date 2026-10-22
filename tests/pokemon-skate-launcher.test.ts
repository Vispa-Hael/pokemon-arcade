// @vitest-environment jsdom
import {it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import skate from '../src/games/pokemon-skate';
it('launches the separate Skate build only on request and unloads it',()=>{const host=document.createElement('div');document.body.append(host);const cleanup=skate.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{'pokemon-skate':true},reducedMotion:false});expect(host.querySelector('canvas')).toBeNull();expect(host.querySelector('iframe')).toBeNull();host.querySelector<HTMLButtonElement>('button')!.click();expect(host.querySelector('iframe')!.title).toBe('Pokémon Skate');expect(host.querySelector('iframe')!.src).toContain('/legacy/pokemon-skate/index.html');if(cleanup)cleanup();expect(host.querySelector('iframe')).toBeNull();host.remove();});
it('reports a missing separate build without starting game logic',()=>{const host=document.createElement('div');skate.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:false});expect(host.textContent).toContain('Local game unavailable');expect(host.querySelector('canvas,iframe')).toBeNull();});
