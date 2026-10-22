// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import game from '../src/games/guess';
import chess from '../src/games/chess';
import arena from '../src/games/arena';
import type {GameContext} from '../src/shared/game';
const context=():GameContext=>({characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{chess:true,arena:true},reducedMotion:false});
it('plays, resumes, completes, and restarts a round through the UI',()=>{
 localStorage.clear();const ctx=context();const host=document.createElement('section');document.body.append(host);game.mount(host,ctx);
 host.querySelector<HTMLButtonElement>('#hint')!.click();expect(host.querySelector('#hints')!.textContent).toMatch(/1\. /);
 game.mount(host,ctx);expect(host.querySelector('#hints')!.textContent).toMatch(/1\. /);
 const rawSave=JSON.parse(localStorage.getItem('pokemon-arcade:v1:save:guess')!);const f=raw.forms.find(f=>f.id===rawSave.value.formId)!;const name=raw.species.find(s=>s.id===f.speciesId)!.name;
 host.querySelector<HTMLInputElement>('input')!.value=name;host.querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));expect(host.textContent).toContain('You found it!');expect(ctx.player.scores('guess')).toHaveLength(1);
 game.mount(host,ctx);expect(ctx.player.scores('guess')).toHaveLength(1);host.querySelector<HTMLButtonElement>('#new')!.click();expect(host.textContent).toContain('5 guesses left');host.remove();
});
it.each([chess,arena])('launches $id only on request and cleans up',module=>{const host=document.createElement('div');const ctx=context();const cleanup=module.mount(host,ctx);expect(host.querySelector('iframe')).toBeNull();host.querySelector('button')!.click();expect(host.querySelector('iframe')!.src).toContain(`/legacy/${module.id}/index.html`);if(cleanup)cleanup();expect(host.querySelector('iframe')).toBeNull();});
it('shows a recoverable message for unavailable legacy files',()=>{const host=document.createElement('div');chess.mount(host,{...context(),legacyAvailable:{}});expect(host.textContent).toContain('Local game unavailable');expect(host.querySelector('iframe')).toBeNull();});
it('loads hub, game, and missing routes',async()=>{localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({chess:true,arena:true})}));document.body.innerHTML='<div id="app"></div>';location.hash='#/';await import('../src/main');await vi.waitFor(()=>expect(document.body.textContent).toContain('The game library'));location.hash='#/games/guess';window.dispatchEvent(new Event('hashchange'));await vi.waitFor(()=>expect(document.body.textContent).toContain('Name that Pokémon'));location.hash='#/games/missing';window.dispatchEvent(new Event('hashchange'));await vi.waitFor(()=>expect(document.body.textContent).toContain('Uncharted territory'));vi.unstubAllGlobals();});
