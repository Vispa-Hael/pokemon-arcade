import {weaponStats,newCombat,stepCombat,type CombatState} from './combat';
import type {CharacterDatabase, Stats} from '../../data/model';
export const roles = ['Driver','Scout','Engine','Defender','Front Gunner','Side Gunner'] as const;
export type Role = typeof roles[number];
export interface Crew {id:number; speciesId:number; name:string; types:string[]; stats:Stats; ability:string}
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function roster(db:CharacterDatabase):Crew[]{return db.queryForms(['id','speciesId','displayName','types','stats','abilities']).filter(f=>[1,4,6,7,9,25,133,10026].includes(f.id)&&f.stats&&f.types).map(f=>({id:f.id,speciesId:f.speciesId,name:f.displayName,types:f.types!,stats:f.stats!,ability:f.abilities?.find(a=>!a.hidden)?.name??'unavailable'}));}
const stat=(c:Crew,key:keyof Stats)=>clamp(c.stats[key],30,130)/100;
export function validTeam(team:Crew[]){return team.length===6&&new Set(team.map(c=>c.speciesId)).size===6;}
export const affinity:Record<string,string>={grass:'Scout: 35% less mud drag',flying:'Scout: 35% less mud drag',fire:'Engine: +2 top speed; logs deal 20% less damage',electric:'Engine: +2 top speed',water:'Defender: mud drag −20%',steel:'Defender: physical damage −15%',rock:'Defender: physical damage −15%',ghost:'Gunner: interception +6%',poison:'Gunner: interception +6%',normal:'Driver: handling +8%'};
export function metrics(team:Crew[]){
 if(!validTeam(team))throw Error('Assign six different species');
 const [driver,scout,engine,defender,high,low]=team;
 const types=new Set(team.flatMap(c=>c.types));
 const coverage=Math.min(types.size,8), complements=Number(engine.types.includes('fire')&&defender.types.includes('water'))+Number(scout.types.includes('grass')&&engine.types.includes('electric'));
 const synergy=Math.min(100,40+coverage*5+complements*8);
 return {front:weaponStats(high,'front'),side:weaponStats(low,'side'),maxSpeed:31+stat(engine,'speed')*7+stat(engine,'attack')*4+(engine.types.some(t=>['fire','electric'].includes(t))?2:0),handling:(2+stat(driver,'speed')*2+stat(scout,'specialDefense')*.7)*(driver.types.includes('normal')?1.08:1),hull:85+stat(defender,'hp')*30+team.reduce((n,c)=>n+stat(c,'hp'),0)*3,armor:clamp(.08+stat(defender,'defense')*.17+stat(defender,'specialDefense')*.05,0,.4),high:clamp(.25+stat(high,'specialAttack')*.25+(high.types.some(t=>['ghost','poison'].includes(t))?.06:0),0,.7),low:clamp(.25+stat(low,'attack')*.25+(low.types.some(t=>['ghost','poison'].includes(t))?.06:0),0,.7),mud:(scout.types.some(t=>['grass','flying'].includes(t))?.65:1)*(defender.types.includes('water')?.8:1),physical:defender.types.some(t=>['steel','rock'].includes(t))?.85:1,log:engine.types.includes('fire')?.8:1,synergy,luck:.04+synergy*.0008};
}
export type Metrics=ReturnType<typeof metrics>;
export type Kind='log'|'rock'|'mud'|'high'|'low'|'supply';
export interface Encounter {at:number;lane:number;kind:Kind;roll:number}
export function random(seed:string){let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);return ()=>{n+=0x6D2B79F5;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
export const finish=2400;
export function course(seed:string):Encounter[]{const rng=random(seed);const result:Encounter[]=[];for(let at=180;at<finish-60;at+=65+rng()*35){result.push({at,lane:Math.floor(rng()*3)-1,kind:(['log','rock','mud','high','low'] as const)[Math.floor(rng()*5)],roll:rng()});}result[0].kind='high';result[1].kind='low';for(const at of [560,1280,2040]){const start=Math.floor(rng()*3);const lanes=[-1,0,1];const lane=[0,1,2].map(n=>lanes[(start+n)%3]).find(l=>result.every(e=>e.kind==='high'||e.kind==='low'||Math.abs(e.at-at)>35||e.lane!==l))??0;result.push({at,lane,kind:'supply',roll:rng()});}return result.sort((a,b)=>a.at-b.at);}
export interface Input {throttle:boolean;brake:boolean;steer:number;cover:'high'|'low'|null;cruise?:boolean}
export interface Run extends CombatState {seed:string;team:Crew[];m:Metrics;steerDirection:number;steerRepeat:number;cover:'high'|'low'|null;hitFlash:number;supplies:number;events:Encounter[];next:number;ticks:number;distance:number;lane:number;target:number;speed:number;hull:number;gap:number;mud:number;cooldown:number;burst:number;swapCooldown:number;status:'running'|'won'|'lost';message:string;intercepts:number;hits:number}
export function newRun(seed:string,team:Crew[]):Run {const m=metrics(team);return {...newCombat(),steerDirection:0,steerRepeat:0,cover:null,hitFlash:0,supplies:0,seed,team:[...team],m,events:course(seed),next:0,ticks:0,distance:0,lane:0,target:0,speed:26,hull:m.hull,gap:95,mud:0,cooldown:0,burst:0,swapCooldown:0,status:'running',message:'Reach the river gate. Keep your speed above the pack.',intercepts:0,hits:0};}
export function burstInfo(c:Crew){
 if(c.ability==='run-away')return {name:'Trail feint',effect:'Gain 14 m of beast gap',kind:'gap'};
 if(['torrent','rain-dish','water-absorb'].includes(c.ability))return {name:'River reserve',effect:'Repair 12 hull',kind:'repair'};
 if(['stance-change','battle-armor','shell-armor'].includes(c.ability))return {name:'Iron escort',effect:'6 seconds of half damage',kind:'shield'};
 return {name:'Trail surge',effect:`6 seconds of +6 speed${c.ability==='blaze'?' (+2 below half hull)':c.ability==='overgrow'?' (+2 on mud)':c.ability==='static'?' and +8% interception':''}`,kind:'speed'};
}
export function trigger(s:Run){if(s.status!=='running'||s.cooldown>0)return false;const b=burstInfo(s.team[2]);s.cooldown=22;s.burst=6;if(b.kind==='gap')s.gap=Math.min(160,s.gap+14);if(b.kind==='repair')s.hull=Math.min(s.m.hull,s.hull+12);s.message=`${s.team[2].name}: ${b.name}!`;return true;}
export function swap(s:Run){if(s.status!=='running'||s.swapCooldown>0)return false;[s.team[4],s.team[5]]=[s.team[5],s.team[4]];s.m=metrics(s.team);s.swapCooldown=8;s.message='Gunners swapped. Front uses Sp. Atk; side uses Attack.';return true;}
// Fixed 60 Hz simulation; render frame rate cannot alter encounters or luck.
export function tick(s:Run,input:Input){
 if(s.status!=='running')return;
 const dt=1/60;s.ticks++;s.cooldown=Math.max(0,s.cooldown-dt);s.swapCooldown=Math.max(0,s.swapCooldown-dt);s.burst=Math.max(0,s.burst-dt);s.mud=Math.max(0,s.mud-dt);
 // One press selects the adjacent lane; holding repeats, never parks between lanes.
 const direction=Math.sign(input.steer);
 s.steerRepeat-=dt;
 if(direction&&(direction!==s.steerDirection||s.steerRepeat<=0)){s.target=clamp(s.target+direction,-1,1);s.steerRepeat=direction!==s.steerDirection?.32:.24;}
 s.steerDirection=direction;s.cover=input.cover;s.hitFlash=Math.max(0,s.hitFlash-dt);
 s.lane+=clamp(s.target-s.lane,-s.m.handling*dt,s.m.handling*dt);
 const b=burstInfo(s.team[2]);const surge=s.burst>0&&b.kind==='speed'?6+(s.team[2].ability==='blaze'&&s.hull<s.m.hull/2?2:0)+(s.team[2].ability==='overgrow'&&s.mud>0?2:0):0;
 const desired=input.brake?16:input.throttle?s.m.maxSpeed+surge:input.cruise?s.m.maxSpeed*.88+surge:28;
 const target=desired*(input.cover ? .85 : 1)*(s.mud>0?1-.32*s.m.mud:1);
 s.speed+=clamp(target-s.speed,-18*dt,7*dt);s.distance+=s.speed*dt;
 s.gap=clamp(s.gap+(s.speed-(31+s.distance/finish*2))*dt*.85,0,160);
 const damageHull=(damage:number)=>{s.hitFlash=.45;s.hits++;s.hull=Math.max(0,s.hull-damage*(1-s.m.armor)*s.m.physical*(s.burst>0&&b.kind==='shield'?.5:1));};
 stepCombat(s,input,damageHull);
 while(s.next<s.events.length&&s.events[s.next].at<=s.distance){
 const e=s.events[s.next++];if(e.kind==='high'||e.kind==='low')continue;
 if(Math.abs(s.lane-e.lane)>.46){s.message=`Evaded ${e.kind}.`;continue;}
 let damage=0;
 if(e.kind==='supply'){const healed=Math.min(14,s.m.hull-s.hull);s.hull=Math.min(s.m.hull,s.hull+14);s.cooldown=Math.max(0,s.cooldown-4);s.supplies++;s.impacts.push({lane:s.lane,at:s.distance,remaining:.45,color:'#bdeca2',text:`+${Math.round(healed)} HULL`});s.message='Supply cache! Hull repaired and ability cooldown reduced.';}
 else if(e.kind==='mud'){s.mud=3;s.message='Mud! Scout and Defender type bonuses reduce drag.';}
 else{damage=e.kind==='rock'?50:40*s.m.log;s.speed=Math.max(10,s.speed-(e.kind==='rock'?10:7));s.message=`${e.kind==='rock'?'Rock impact':'Log impact'}! Steer into a clear lane.`;}
 if(damage)damageHull(damage);
 }
 if(s.hull<=0||s.gap<=0){s.status='lost';s.message=s.hull<=0?'Caravan disabled. Reassign your crew and try again.':'The beast pack caught the caravan. More throttle next time!';}
 else if(s.distance>=finish){s.status='won';s.message='River gate reached. Your whole crew made it!';}
}



