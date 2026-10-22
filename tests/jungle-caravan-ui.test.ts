// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import game from '../src/games/jungle-caravan';
it('assigns unique crew, starts, pauses, resets and removes its frame on unmount',()=>{vi.stubGlobal('requestAnimationFrame',vi.fn(()=>42));const cancel=vi.fn();vi.stubGlobal('cancelAnimationFrame',cancel);const host=document.createElement('div');document.body.append(host);const cleanup=game.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:true});expect(host.querySelectorAll('.jc-weapons article')).toHaveLength(2);expect(host.querySelector('.jc-weapons')!.textContent).toContain('DPS');expect(host.textContent).toContain('Front Gunner');expect(host.textContent).toContain('Side Gunner');expect(host.querySelectorAll('select')).toHaveLength(6);const selects=host.querySelectorAll('select');selects[0].value=selects[2].value;selects[0].dispatchEvent(new Event('change'));expect(new Set(Array.from(host.querySelectorAll('select')).map(s=>s.value)).size).toBe(6);host.querySelector<HTMLButtonElement>('#jc-start')!.click();expect(host.querySelector('canvas')).not.toBeNull();host.querySelector<HTMLButtonElement>('#jc-pause')!.click();expect(host.querySelector('#jc-overlay')!.textContent).toContain('paused');host.querySelector<HTMLButtonElement>('#jc-pause')!.click();expect(host.querySelector<HTMLElement>('#jc-overlay')!.hidden).toBe(true);host.querySelector<HTMLButtonElement>('#jc-manifest')!.click();expect(host.querySelectorAll('select')).toHaveLength(6);if(cleanup)cleanup();expect(cancel).toHaveBeenCalledWith(42);host.remove();vi.unstubAllGlobals();});
it('runs keyboard controls, freezes on blur, reaches a loss and replays the seed',()=>{
 let next:FrameRequestCallback=()=>{};
 vi.stubGlobal('requestAnimationFrame',vi.fn((cb:FrameRequestCallback)=>{next=cb;return 7;}));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const canvas=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 const host=document.createElement('div');document.body.append(host);
 const cleanup=game.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:false});
 host.querySelector<HTMLButtonElement>('#jc-start')!.click();let now=100;const advance=(count:number)=>{for(let i=0;i<count;i++){now+=100;next(now);}};
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',cancelable:true}));advance(20);expect(Number.parseInt(host.querySelector('#jc-speed')!.textContent!)).toBeGreaterThan(30);
 window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));window.dispatchEvent(new Event('blur'));const distance=host.querySelector('#jc-distance')!.textContent;advance(20);expect(host.querySelector('#jc-distance')!.textContent).toBe(distance);
 host.querySelector<HTMLButtonElement>('#jc-pause')!.click();advance(1000);expect(host.textContent).toContain('Expedition over');expect(host.textContent).toContain('beast pack caught');host.querySelector<HTMLButtonElement>('#jc-replay')!.click();expect(host.querySelector('#jc-distance')!.textContent).toContain('0 / 2400');expect(host.querySelector('.jc-runbar')!.textContent).toContain('river-30');if(cleanup)cleanup();canvas.mockRestore();host.remove();vi.unstubAllGlobals();
});
