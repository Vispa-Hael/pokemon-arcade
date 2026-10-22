import {describe,it,expect,vi} from 'vitest';
import {dayKey,previousDay,dailyStreak,dailySeed,validDay} from '../src/shared/daily';
import {dailyRound} from '../src/games/guess/daily';
import {filterGames,trainerSummary} from '../src/shared/hub';
import {PlayerServices,type StorageAdapter} from '../src/shared/player';
import guess from '../src/games/guess';
import chess from '../src/games/chess';
import arena from '../src/games/arena';
class Memory implements StorageAdapter{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
describe('daily challenge calendar and identity',()=>{
 it('changes on Mountain Time midnight, including daylight-saving dates',()=>{expect(dayKey(new Date('2026-10-22T05:59:59Z'))).toBe('2026-10-21');expect(dayKey(new Date('2026-10-22T06:00:00Z'))).toBe('2026-10-22');expect(dayKey(new Date('2026-12-01T06:59:59Z'))).toBe('2026-11-30');expect(dayKey(new Date('2026-12-01T07:00:00Z'))).toBe('2026-12-01');expect(previousDay('2028-03-01')).toBe('2028-02-29');});
 it('selects the same answer and round identity regardless of local roster order',()=>{expect(dailyRound('2026-10-22',[1,4,7,25])).toEqual(dailyRound('2026-10-22',[25,7,4,1]));expect(dailyRound('2026-10-22',[1,4,7,25,11000])).toEqual(dailyRound('2026-10-22',[1,4,7,25]));expect(dailyRound('2026-10-22',[1]).roundId).toBe('daily:2026-10-22');expect(dailySeed('2026-10-22')).not.toBe(dailySeed('2026-10-23'));expect(validDay('2026-02-31')).toBe(false);expect(()=>dailySeed('bad')).toThrow();});
 it('counts consecutive wins and breaks on a missed or lost day without losing the best',()=>{const wins=['19','20','21'].map(d=>({roundId:'daily:2026-10-'+d,value:100}));expect(dailyStreak(wins,'2026-10-22')).toEqual({current:3,best:3,completed:false});expect(dailyStreak([...wins,{roundId:'daily:2026-10-22',value:0}],'2026-10-22')).toEqual({current:0,best:3,completed:true});expect(dailyStreak(wins,'2026-10-23').current).toBe(0);expect(()=>dailyStreak([{roundId:'daily:2026-99-99',value:1}],'2026-10-22')).not.toThrow();});
});
describe('local trainer services',()=>{
 it('keeps bests and totals beyond the bounded result list and does not double-count a result',()=>{const p=new PlayerServices(new Memory());for(let i=0;i<105;i++)p.record('guess',String(i),100-i%100);expect(p.scores('guess')).toHaveLength(100);const before=p.progress('guess');p.record('guess','104',96);expect(p.progress('guess')).toEqual(before);expect(before.results).toBe(105);expect(before.best).toBe(100);});
 it('seeds progress from existing scores without changing those saves',()=>{const m=new Memory();m.setItem('pokemon-arcade:v1:scores:guess',JSON.stringify({version:1,value:[{roundId:'old',value:85,at:'2026-10-21'}]}));const p=new PlayerServices(m);expect(p.progress('guess')).toEqual({results:1,best:85,total:85,positive:1});p.record('guess','new',100);expect(p.progress('guess').total).toBe(185);});
 it('tracks session launch/time once and unlocks achievements from real local evidence',()=>{const p=new PlayerServices(new Memory());vi.spyOn(Date,'now').mockReturnValue(1000);const finish=p.startSession('guess');vi.mocked(Date.now).mockReturnValue(62000);finish();finish();expect(p.activity().guess).toEqual({launches:1,seconds:61});p.startSession('chess')();p.startSession('arena')();p.record('guess','win',100);const stats=trainerSummary(p,[guess,chess,arena]);expect(stats.launches).toBe(3);expect(stats.minutes).toBe(1);expect(stats.achievements.find(a=>a.id==='explorer')!.earned).toBe(true);expect(stats.achievements.find(a=>a.id==='first-mystery')!.earned).toBe(true);vi.restoreAllMocks();});
 it('combines search, category and input filters',()=>{expect(filterGames([guess,chess,arena],'','Strategy','Touch')).toEqual([chess]);expect(filterGames([guess,chess,arena],'mystery','Puzzle','Keyboard')).toEqual([guess]);expect(filterGames([guess,chess,arena],'missing','All','All')).toEqual([]);});
});

it('recognizes an existing scored game for Press start without inventing past launch counts',()=>{const p=new PlayerServices(new Memory());p.record('guess','historic',90);const stats=trainerSummary(p,[guess,chess,arena]);expect(stats.launches).toBe(0);expect(stats.achievements.find(a=>a.id==='first-play')!.earned).toBe(true);});
