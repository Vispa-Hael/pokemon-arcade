// @vitest-environment jsdom
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {PlayerServices} from '../src/shared/player';
import game from '../src/games/jungle-caravan';
import {roster,newRun,tick,type Input} from '../src/games/jungle-caravan/rules';
let cleanups:(()=>void)[]=[];
beforeEach(()=>{localStorage.clear();});
afterEach(()=>{cleanups.forEach(fn=>fn());cleanups=[];document.body.innerHTML='';vi.restoreAllMocks();vi.unstubAllGlobals();});
function mounted(){
 let next:FrameRequestCallback=()=>{},now=100;
 vi.stubGlobal('requestAnimationFrame',vi.fn((cb:FrameRequestCallback)=>{next=cb;return 42;}));vi.stubGlobal('cancelAnimationFrame',vi.fn());
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 const host=document.createElement('div');document.body.append(host);
 const cleanup=game.mount(host,{characters:new CharacterDatabase(raw as Catalog),player:new PlayerServices(localStorage),legacyAvailable:{},reducedMotion:true});if(cleanup)cleanups.push(cleanup);
 const q=(id:string)=>host.querySelector<HTMLElement>('#'+id)!;
 const click=(id:string)=>(q(id) as HTMLButtonElement).click();
 const advance=(count:number)=>{for(let i=0;i<count;i++){now+=100;next(now);}};
 const start=()=>{click('jc-start');advance(33);};
 return {host,q,click,advance,start,cleanup};
}
it('assigns unique crew, counts down safely, pauses, resumes and removes focus mode',()=>{
 const {host,q,click,advance,cleanup}=mounted();expect(host.querySelectorAll('.jc-weapons article')).toHaveLength(2);expect(host.textContent).toContain('base DPS');
 const select=host.querySelector<HTMLSelectElement>('#jc-role-0')!;select.value='6';select.dispatchEvent(new Event('change'));expect(new Set(Array.from(host.querySelectorAll('select')).map(s=>s.value)).size).toBe(6);expect(q('jc-selection').textContent).toContain('moved');
 click('jc-start');expect(document.documentElement.classList.contains('jc-focus')).toBe(true);expect(q('jc-distance').textContent).toContain('0 / 2400');advance(20);expect(q('jc-distance').textContent).toContain('0 / 2400');advance(15);expect(q('jc-overlay').hidden).toBe(true);
 click('jc-pause');expect(q('jc-overlay').textContent).toContain('paused');expect((q('jc-cruise') as HTMLButtonElement).disabled).toBe(true);click('jc-resume');expect(q('jc-overlay').hidden).toBe(true);
 click('jc-manifest');expect(host.querySelectorAll('select')).toHaveLength(6);expect(document.documentElement.classList.contains('jc-focus')).toBe(false);if(cleanup)cleanup();expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
});
it('supports keyboard driving, blur pause, loss and replay without stale input',()=>{
 const {q,click,advance,start}=mounted();start();window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',cancelable:true}));advance(20);expect(Number.parseInt(q('jc-speed').textContent!)).toBeGreaterThan(30);
 window.dispatchEvent(new Event('blur'));const distance=q('jc-distance').textContent;advance(20);expect(q('jc-distance').textContent).toBe(distance);click('jc-resume');click('jc-cruise');window.dispatchEvent(new KeyboardEvent('keydown',{key:'s'}));advance(300);expect(q('jc-overlay').textContent).toContain('Expedition over');expect(q('jc-overlay').textContent).toContain('beast pack caught');click('jc-replay');expect(q('jc-distance').textContent).toContain('0 / 2400');expect(q('jc-runbar')?.textContent??document.body.textContent).toContain('river-30');
});
it('saves crew/seed, keeps gunner swaps when returning to crew and restores a later mount',()=>{
 const a=mounted();(a.q('jc-seed') as HTMLInputElement).value='remember-me';a.start();window.dispatchEvent(new KeyboardEvent('keydown',{key:'x'}));a.advance(2);a.click('jc-manifest');expect((a.q('jc-role-4') as HTMLSelectElement).value).toBe('4');expect((a.q('jc-role-5') as HTMLSelectElement).value).toBe('1');if(a.cleanup)a.cleanup();a.host.remove();
 const b=mounted();expect((b.q('jc-seed') as HTMLInputElement).value).toBe('remember-me');expect((b.q('jc-role-4') as HTMLSelectElement).value).toBe('4');
});
it('supports simultaneous touch controls and gives a short tap a full lane change',()=>{
 const {host,q,start,advance}=mounted();start();
 function pointer(key:string,id:number,type='pointerdown'){const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'pointerId',{value:id});host.querySelector<HTMLButtonElement>(`[data-hold="${key}"]`)!.dispatchEvent(e);}
 pointer('w',1);pointer('q',2);advance(2);expect(q('jc-pace').textContent).toContain('high cover');expect(host.querySelector('[data-hold="w"]')!.getAttribute('aria-pressed')).toBe('true');pointer('q',2,'pointerup');advance(2);expect(host.querySelector('[data-hold="q"]')!.getAttribute('aria-pressed')).toBe('false');expect(host.querySelector('[data-hold="w"]')!.getAttribute('aria-pressed')).toBe('true');
 pointer('d',3);pointer('d',3,'pointerup');advance(4);expect(document.activeElement?.tagName).not.toBe('INPUT');expect(q('jc-distance').textContent).not.toContain('0 / 2400');
});
it('allows Space ability after clicking Cruise and rejects malformed saved crews',()=>{
 localStorage.setItem('pokemon-arcade:v1:save:jungle-caravan',JSON.stringify({version:1,value:{version:2,crew:[1,1,1,1,1,1],seed:'bad'}}));const {q,start,click,advance}=mounted();expect((q('jc-role-0') as HTMLSelectElement).value).toBe('25');start();click('jc-cruise');window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',cancelable:true}));advance(1);expect(q('jc-burst').textContent).toContain('22s');
});

it('finishes a complete seeded course through keyboard controls and shows the river-gate result',()=>{
 const {q,start,advance}=mounted();start();const pool=roster(new CharacterDatabase(raw as Catalog));const model=newRun('river-30',[25,133,6,9,1,4].map(id=>pool.find(c=>c.id===id)!));let held=new Set<string>();
 for(let frame=0;frame<1000&&!(q('jc-overlay').textContent??'').includes('River gate reached!');frame++){
  const hazard=model.events[model.next];const target=hazard&&hazard.at-model.distance<160?(hazard.lane===0?1:0):model.target;
  const steer=Math.abs(model.target-target)>.02?Math.sign(target-model.target):0;
  const incoming=model.shots.find(s=>s.owner==='robber'&&s.remaining<.55&&Math.abs(s.toLane-model.lane)<.5);
  const input:Input={throttle:true,brake:false,steer,cover:incoming?.height??null};const want=new Set(['w',...(steer?[steer<0?'a':'d']:[]),...(input.cover?[input.cover==='high'?'q':'e']:[])]);
  for(const k of held)if(!want.has(k))window.dispatchEvent(new KeyboardEvent('keyup',{key:k}));for(const k of want)if(!held.has(k))window.dispatchEvent(new KeyboardEvent('keydown',{key:k}));held=want;
  advance(1);for(let i=0;i<6;i++)tick(model,input);
 }
 expect(q('jc-overlay').textContent).toContain('River gate reached!');expect(q('jc-distance').textContent).toContain('2400 / 2400');
});
