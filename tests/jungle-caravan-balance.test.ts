import {it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {roster,newRun,tick} from '../src/games/jungle-caravan/rules';
it('balance: default crew can finish varied routes with deliberate lane choices',()=>{const pool=roster(new CharacterDatabase(raw as Catalog));const team=[25,133,6,9,1,4].map(id=>pool.find(c=>c.id===id)!);let wins=0,passive=0;for(let n=0;n<30;n++){const s=newRun('balance-'+n,team),p=newRun('balance-'+n,team);for(let t=0;t<9000&&s.status==='running';t++){const hazard=s.events[s.next];const target=hazard&&hazard.at-s.distance<160?(hazard.lane===0?1:0):Math.round(s.target);tick(s,{throttle:true,brake:false,steer:Math.abs(s.target-target)>.02?Math.sign(target-s.target):0,cover:null});}for(let t=0;t<9000&&p.status==='running';t++)tick(p,{throttle:true,brake:false,steer:0,cover:null});if(s.status==='won')wins++;if(p.status==='won')passive++;}expect(passive).toBeLessThanOrEqual(15);expect(wins).toBeGreaterThanOrEqual(27);});

