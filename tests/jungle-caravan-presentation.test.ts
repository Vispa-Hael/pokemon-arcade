import {it,expect} from 'vitest';
import {project,beastY,beastScale,sceneryAhead} from '../src/games/jungle-caravan/render';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {roster,newRun,tick,course} from '../src/games/jungle-caravan/rules';
const pool=roster(new CharacterDatabase(raw as Catalog));const team=[25,133,6,9,1,4].map(id=>pool.find(c=>c.id===id)!);
it('keeps hazards, caravan and a zero-distance projectile on the same collision plane',()=>{expect(project(1,0).x).toBe(630);expect(project(1,-10).y).toBeGreaterThan(project(1,0).y);expect(project(1,10).y).toBeLessThan(project(1,0).y);});
it('brings scenery toward the viewer and brings a closing beast pack into view',()=>{expect(project(0,sceneryAhead(150,20)).y).toBeGreaterThan(project(0,sceneryAhead(150,0)).y);expect(beastY(10)).toBeLessThan(beastY(150));expect(beastY(0)).toBeGreaterThan(project(0,0).y);});
it('adapts the camera to tall screens without moving lanes off screen',()=>{expect(project(-1,0,1200).x).toBe(330);expect(project(0,0,1200).y).toBe(960);expect(project(0,220,1200).y).toBeGreaterThan(0);});
it('commits to an integer lane on a short tap and cannot park between hazards',()=>{const s=newRun('tap',team);s.events=[];tick(s,{throttle:true,brake:false,steer:1,cover:null});expect(s.target).toBe(1);for(let i=0;i<40;i++)tick(s,{throttle:true,brake:false,steer:0,cover:null});expect(s.lane).toBe(1);});
it('locks robber aim before firing and does not retarget a projectile mid-flight',()=>{const s=newRun('lock',team);s.events=[{at:150,lane:0,kind:'high',roll:.999}];for(let i=0;i<40;i++)tick(s,{throttle:true,brake:false,steer:0,cover:null});expect(s.enemies[0].timer).toBeLessThan(.75);for(let i=0;i<60;i++)tick(s,{throttle:true,brake:false,steer:1,cover:null});expect(s.shots.filter(p=>p.owner==='robber').every(p=>p.toLane===0)).toBe(true);expect(s.incoming).toBe(1);});
it('supply pickups reward lane choice, cap repairs and reduce ability cooldown',()=>{const s=newRun('cache',team);s.hull-=20;s.cooldown=10;s.events=[{at:0,lane:0,kind:'supply',roll:0}];tick(s,{throttle:true,brake:false,steer:0,cover:null});expect(s.supplies).toBe(1);expect(s.hull).toBeCloseTo(s.m.hull-6);expect(s.cooldown).toBeLessThan(6);expect(s.hits).toBe(0);const full=newRun('cache-full',team);full.events=[{at:0,lane:0,kind:'supply',roll:0}];tick(full,{throttle:true,brake:false,steer:0,cover:null});expect(full.hull).toBe(full.m.hull);});

it('keeps supply caches out of overlapping obstacle lanes',()=>{for(let i=0;i<30;i++){const events=course('supplies-'+i);for(const cache of events.filter(e=>e.kind==='supply'))expect(events.filter(e=>['rock','log','mud'].includes(e.kind)&&e.lane===cache.lane&&Math.abs(e.at-cache.at)<=35)).toHaveLength(0);}});
it('makes the approaching beasts grow without leaving the viewport',()=>{expect(beastScale(0)).toBeGreaterThan(beastScale(160));expect(beastY(0)).toBeLessThan(600);expect(beastY(160)).toBeLessThan(600);});
