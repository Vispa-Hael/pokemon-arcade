// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import game from '../src/games/pokemon-skate';
it('selects a rider and mode, plays, pauses on blur, restarts and cleans up',()=>{
 let next:FrameRequestCallback=()=>{};vi.stubGlobal('requestAnimationFrame',vi.fn(cb=>{next=cb;return 42;}));vi.stubGlobal('cancelAnimationFrame',vi.fn());vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 const host=document.createElement('div');document.body.append(host);const cleanup=game.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:true});
 const select=(id:string,value:string)=>{host.querySelector<HTMLSelectElement>('#sk-'+id)!.value=value;};select('rider','94');select('mode','run');select('spawn','49');host.querySelector<HTMLButtonElement>('#sk-start')!.click();expect(host.textContent).toContain('Gengar / Phantom flair');expect(host.querySelector('#sk-time')!.textContent).toBe('75s');
 let now=100;const advance=(n:number)=>{for(let i=0;i<n;i++){now+=100;next(now);}};advance(20);expect(host.querySelector('#sk-speed')!.textContent).not.toBe('0.0 m/s');window.dispatchEvent(new Event('blur'));const speed=host.querySelector('#sk-speed')!.textContent;advance(30);expect(host.querySelector('#sk-speed')!.textContent).toBe(speed);expect(host.querySelector('#sk-overlay')!.textContent).toContain('paused');window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}));advance(1);expect(host.querySelector<HTMLElement>('#sk-overlay')!.hidden).toBe(true);
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'}));expect(host.querySelector('#sk-time')!.textContent).toBe('75s');advance(751);expect(host.querySelector('#sk-overlay')!.textContent).toContain('SESSION COMPLETE');if(cleanup)cleanup();expect(cancelAnimationFrame).toHaveBeenCalledWith(42);host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();
});
