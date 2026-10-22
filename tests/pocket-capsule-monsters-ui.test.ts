// @vitest-environment jsdom
import {validMatch} from '../src/games/pocket-capsule-monsters/rules';
import {it,expect,vi} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import game from '../src/games/pocket-capsule-monsters';
it('deploys, moves, restores a match and cancels computer work on unmount',()=>{
 vi.useFakeTimers();localStorage.clear();const host=document.createElement('div');document.body.append(host);const context={characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:true};
 let cleanup=game.mount(host,context);expect(host.querySelectorAll('[data-form]')).toHaveLength(8);expect(host.querySelectorAll('[data-model]')).toHaveLength(8);host.querySelector<HTMLButtonElement>('#pcm-start')!.click();expect(host.querySelectorAll('[data-tile]')).toHaveLength(64);expect(host.querySelectorAll('[data-model-key^="unit-"]')).toHaveLength(8);expect(host.querySelector('.pcm-inspect-model [data-model]')).not.toBeNull();const tile=host.querySelector<HTMLButtonElement>('.can-move')!;const destination=tile.dataset.tile;tile.click();expect(host.querySelector('.pcm-ap')!.textContent).toContain('5');if(cleanup)cleanup();
 cleanup=game.mount(host,context);expect(host.querySelector(`[data-tile="${destination}"]`)!.textContent).toContain('Bulbasaur');expect(host.querySelector('.pcm-ap')!.textContent).toContain('5');host.querySelector<HTMLButtonElement>('#pcm-end')!.click();expect(host.querySelector('h2')!.textContent).toContain('Amber');const before=host.innerHTML;if(cleanup)cleanup();vi.runAllTimers();expect(host.innerHTML).toBe(before);host.remove();vi.useRealTimers();
});
it('plays the opening and elite summons, blocks battle input, and resumes after skip',()=>{
 vi.useFakeTimers();localStorage.clear();const host=document.createElement('div');document.body.append(host);const context={characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:false};
 const cleanup=game.mount(host,context);host.querySelector<HTMLButtonElement>('#pcm-start')!.click();expect(host.querySelector('.pcm-cinema')).not.toBeNull();expect(host.querySelector('.pcm-cinema-stage')!.textContent).toContain('Verdant Ruins');const before=context.player.load(game.id,validMatch);host.querySelector<HTMLButtonElement>('.can-move')!.click();expect(context.player.load(game.id,validMatch)).toEqual(before);vi.advanceTimersByTime(2600);expect(host.querySelector('.pcm-cinema-stage')!.textContent).toContain('arise');host.querySelector<HTMLButtonElement>('.pcm-skip')!.click();expect(host.querySelector('.pcm-cinema')).toBeNull();expect(host.querySelectorAll('[data-tile]')).toHaveLength(64);if(cleanup)cleanup();vi.runAllTimers();host.remove();vi.useRealTimers();
});
it('lets a player disable introductions and summons while retaining the match settings',()=>{
 localStorage.clear();const host=document.createElement('div');document.body.append(host);const context={characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:false};const cleanup=game.mount(host,context);
 for(const key of ['cinematics','eliteSummons'])host.querySelector<HTMLInputElement>(`[data-feature="${key}"]`)!.click();host.querySelector<HTMLButtonElement>('#pcm-start')!.click();expect(host.querySelector('.pcm-cinema')).toBeNull();expect(context.player.load(game.id,validMatch)?.features).toMatchObject({cinematics:false,eliteSummons:false});expect(host.querySelector<HTMLButtonElement>('#pcm-replay')!.disabled).toBe(true);if(cleanup)cleanup();host.remove();
});


