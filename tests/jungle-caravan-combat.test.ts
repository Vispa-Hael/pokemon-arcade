import {describe,it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {roster,newRun,tick,swap,type Input} from '../src/games/jungle-caravan/rules';
import {weaponStats} from '../src/games/jungle-caravan/combat';
const pool=roster(new CharacterDatabase(raw as Catalog));
const team=[25,133,6,9,1,4].map(id=>pool.find(c=>c.id===id)!);
const drive:Input={throttle:true,brake:false,steer:0,cover:null};
function advance(s:ReturnType<typeof newRun>,n:number,input=drive){for(let i=0;i<n;i++)tick(s,input);}
describe('Caravan front and side combat',()=>{
 it('derives separate power, rate and DPS from the selected Pokémon',()=>{
  const c=team[4],front=weaponStats(c,'front'),side=weaponStats(c,'side');
  expect(front.power).toBeCloseTo(8+c.stats.specialAttack/100*16);expect(side.power).toBeCloseTo(8+c.stats.attack/100*16);expect(front.dps).toBeCloseTo(front.power*front.rate);
  const stronger={...c,stats:{...c.stats,specialAttack:130,speed:130}};expect(weaponStats(stronger,'front').dps).toBeGreaterThan(front.dps);expect(weaponStats(stronger,'side').power).toBe(side.power);
 });
 it('caps extreme stats and changes gun DPS when stations swap',()=>{
  const s=newRun('guns',team),front=s.m.front.dps;swap(s);expect(s.m.front.dps).not.toBe(front);
  const huge={...team[4],stats:{...team[4].stats,speed:999,specialAttack:999}};const capped={...huge,stats:{...huge.stats,speed:130,specialAttack:130}};expect(weaponStats(huge,'front')).toEqual(weaponStats(capped,'front'));
 });
 it('fires visible outgoing projectiles even between attackers',()=>{
  const s=newRun('empty',team);s.events=[];advance(s,20);expect(s.shots.some(p=>p.owner==='crew'&&p.mount==='front')).toBe(true);expect(s.shots.some(p=>p.owner==='crew'&&p.mount==='side')).toBe(true);expect(s.outgoing).toBe(2);
 });
 it('spawns visible robbers and traveling incoming shots before impact',()=>{
  const s=newRun('incoming',team);s.events=[{at:150,lane:0,kind:'high',roll:.999}];advance(s,80);expect(s.enemies).toHaveLength(1);expect(s.incoming).toBe(1);expect(s.shots.some(p=>p.owner==='robber')).toBe(true);expect(s.hull).toBe(s.m.hull);advance(s,55);expect(s.hits).toBe(1);expect(s.hull).toBeLessThan(s.m.hull);
 });
 it('outgoing shots take time to hit, drain enemy HP, and stop defeated robbers firing',()=>{
  const strong=[...team];strong[4]=pool.find(c=>c.id===10026)!;
  const s=newRun('defeat',strong);s.events=[{at:190,lane:0,kind:'high',roll:.9}];advance(s,10);expect(s.enemies[0].hp).toBe(60);advance(s,160);expect(s.enemies[0].hp).toBeLessThan(60);advance(s,60);expect(s.defeated).toBe(1);const fired=s.incoming;advance(s,60);expect(s.incoming).toBe(fired);
 });
 it('front follows its lane while side targets roadside shooters across lanes',()=>{
  const s=newRun('aim',team);s.events=[{at:180,lane:1,kind:'high',roll:.9},{at:80,lane:-1,kind:'low',roll:.2}];advance(s,1);expect(s.shots.find(p=>p.mount==='front')?.target).toBeNull();advance(s,15);expect(s.shots.find(p=>p.owner==='crew'&&p.mount==='side')?.target).toBe(1);expect(s.enemies.find(e=>e.mount==='side')!.lane).toBe(-1.7);
 });
 it('matching cover blocks shots on arrival and steering can dodge them',()=>{
  const covered=newRun('cover-fire',team);covered.events=[{at:150,lane:0,kind:'low',roll:.999}];advance(covered,180,{...drive,cover:'low'});expect(covered.hits).toBe(0);expect(covered.intercepts).toBe(1);
  const dodge=newRun('dodge-fire',team);dodge.events=[{at:150,lane:0,kind:'high',roll:.999}];advance(dodge,45);advance(dodge,90,{...drive,steer:1});expect(dodge.hits).toBe(0);expect(dodge.incoming).toBeGreaterThan(0);
 });
});
