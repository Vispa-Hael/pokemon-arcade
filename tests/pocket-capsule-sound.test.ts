// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {createBattleSound} from '../src/games/pocket-capsule-monsters/sound';
it('starts only after enabling, then stops all audio and timers when muted or unmounted',async()=>{
 vi.useFakeTimers();const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(false);const param=()=>({value:0,setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()});const sources:{stop:ReturnType<typeof vi.fn>}[]=[];
 class FakeAudio {state='suspended';currentTime=0;destination={};resume=vi.fn(async()=>{this.state='running';});suspend=vi.fn(async()=>{this.state='suspended';});close=vi.fn(async()=>{this.state='closed';});createGain(){return {gain:param(),connect:vi.fn(),disconnect:vi.fn()};}createOscillator(){const source={type:'sine',frequency:param(),connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};sources.push(source);return source;}}
 vi.stubGlobal('AudioContext',FakeAudio);const sound=createBattleSound();await sound.unlock();expect(sources).toHaveLength(0);expect(sound.toggle()).toBe(true);await Promise.resolve();await Promise.resolve();expect(sources.length).toBeGreaterThan(0);vi.advanceTimersByTime(800);sound.toggle();expect(sources.every(s=>s.stop.mock.calls.length>0)).toBe(true);expect(vi.getTimerCount()).toBe(0);sound.dispose();hidden.mockRestore();vi.unstubAllGlobals();vi.useRealTimers();
});
