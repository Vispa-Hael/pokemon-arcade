import type {Crew, Input, Run} from './rules';

export type Mount = 'front' | 'side';
export interface Weapon {power:number; rate:number; dps:number; color:string}
export function weaponStats(crew:Crew, mount:Mount):Weapon {
 const bounded=(n:number)=>Math.max(30,Math.min(130,n))/100;
 const power=8+bounded(mount==='front'?crew.stats.specialAttack:crew.stats.attack)*16;
 const rate=.8+bounded(crew.stats.speed)*1.2;
 const colors:Record<string,string>={fire:'#ffac55',water:'#76d9ff',grass:'#b1f279',electric:'#fff084',ghost:'#cea5ff',steel:'#c4e1ec',poison:'#e6a0ff'};
 return {power,rate,dps:power*rate,color:colors[crew.types[0]]??'#f4efca'};
}
export interface Enemy {id:number; at:number; lane:number; aim:number; height:'high'|'low'; mount:Mount; hp:number; maxHp:number; timer:number; roll:number; fired:number}
export interface Shot {id:number; owner:'crew'|'robber'; mount:Mount; fromLane:number; fromAt:number; toLane:number; toAt:number; height:'high'|'low'; remaining:number; duration:number; target:number|null; damage:number; roll:number; color:string}
export interface Impact {lane:number; at:number; remaining:number; color:string; text:string}
export interface CombatState {enemies:Enemy[]; shots:Shot[]; impacts:Impact[]; spawned:number[]; fireTimers:Record<Mount,number>; shotSerial:number; defeated:number; outgoing:number; incoming:number;fireCount:Record<Mount,number>;lastFire:Record<Mount,number>}
export function newCombat():CombatState {return {enemies:[],shots:[],impacts:[],spawned:[],fireTimers:{front:0,side:.2},shotSerial:0,defeated:0,outgoing:0,incoming:0,fireCount:{front:0,side:0},lastFire:{front:-100,side:-100}};}

// Combat uses the same simulation ticks as driving. Projectiles resolve only on arrival.
export function stepCombat(s:Run,input:Input,damageHull:(amount:number)=>void){
 const dt=1/60;
 s.impacts=s.impacts.filter(i=>(i.remaining-=dt)>0);
 s.events.forEach((e,id)=>{
  if((e.kind!=='high'&&e.kind!=='low')||s.spawned.includes(id)||e.at-s.distance>195||e.at<s.distance-35)return;
  s.spawned.push(id);
  const mount=e.kind==='high'?'front':'side';
  s.enemies.push({id,at:e.at,lane:mount==='front'?e.lane:(e.roll<.5?-1.7:1.7),aim:e.lane,height:e.kind,mount,hp:60,maxHp:60,timer:1.1,roll:e.roll,fired:0});
 });
 const addShot=(shot:Omit<Shot,'id'>)=>s.shots.push({...shot,id:++s.shotSerial});
 for(const enemy of s.enemies){
  if(enemy.hp<=0||enemy.at-s.distance < -25)continue;
  const ahead=enemy.at-s.distance;
  if(ahead>(enemy.mount==='front'?180:130))continue;
  // Aim is visible and locks for the final 0.75 seconds before firing.
  if(enemy.timer>.75)enemy.aim=Math.round(s.target);
  const oldTimer=enemy.timer;enemy.timer-=dt;
  if(oldTimer>.75&&enemy.timer<=.75)s.message=`${enemy.height==='high'?'HIGH':'LOW'} shot locking ${enemy.aim===0?'middle':enemy.aim<0?'left':'right'} lane — ${enemy.height==='high'?'Q':'E'} cover or steer!`;
  if(enemy.timer<=0){
   const duration=.85;enemy.timer=2.1;enemy.fired++;s.incoming++;
   addShot({owner:'robber',mount:enemy.mount,fromLane:enemy.lane,fromAt:enemy.at,toLane:enemy.aim,toAt:s.distance+s.speed*duration,height:enemy.height,remaining:duration,duration,target:null,damage:18,roll:(enemy.roll+(enemy.fired-1)*.381966)%1,color:'#ff786d'});
  }
 }
 for(const mount of ['front','side'] as const){
  s.fireTimers[mount]-=dt;if(s.fireTimers[mount]>0)continue;
  const weapon=s.m[mount];s.fireTimers[mount]+=1/weapon.rate;
  const target=s.enemies.filter(e=>e.hp>0&&e.mount===mount&&e.at-s.distance>=(mount==='front'?18:-20)&&e.at-s.distance<=(mount==='front'?190:100)&&(mount==='side'||Math.abs(e.lane-s.lane)<.7)).sort((a,b)=>a.at-b.at)[0];
  const duration=target?Math.max(.22,Math.min(.55,Math.abs(target.at-s.distance)/320)):.5;
  const roll=target?(target.roll+s.shotSerial*.618034)%1:1;
  const critical=roll<s.m.luck;
  s.fireCount[mount]++;s.lastFire[mount]=s.ticks;
  const toLane=target?.lane??(mount==='front'?s.lane:(s.fireCount.side%2?-1.8:1.8));
  addShot({owner:'crew',mount,fromLane:s.lane+(mount==='side'?Math.sign(toLane-s.lane)*.32:0),fromAt:s.distance+(mount==='front'?20:3),toLane,toAt:target?.at??s.distance+(mount==='front'?195:8),height:mount==='front'?'high':'low',remaining:duration,duration,target:target?.id??null,damage:weapon.power*(critical?1.2:1),roll,color:weapon.color});
  s.outgoing++;
 }
 const active:Shot[]=[];
 for(const shot of s.shots){
  shot.remaining-=dt;if(shot.remaining>0){active.push(shot);continue;}
  if(shot.owner==='crew'){
   const enemy=s.enemies.find(e=>e.id===shot.target&&e.hp>0);
   if(!enemy)continue;
   enemy.hp=Math.max(0,enemy.hp-shot.damage);
   s.impacts.push({lane:enemy.lane,at:enemy.at,remaining:.45,color:shot.color,text:`−${Math.round(shot.damage)}`});
   if(enemy.hp===0){s.defeated++;s.message=`${shot.mount==='front'?'Front':'Side'} gunner stopped a robber!`;}
  }else{
   if(Math.abs(s.lane-shot.toLane)>.46||Math.abs(s.distance-shot.toAt)>32){s.message='Dodged incoming fire.';continue;}
   const intercept=s.m[shot.height]+s.m.luck+(s.burst>0&&s.team[2].ability==='static'?.08:0);
   if(input.cover===shot.height||shot.roll<Math.min(.82,intercept)){
    s.intercepts++;s.message=input.cover===shot.height?`${shot.height==='high'?'High':'Low'} cover blocked a shot.`:'Gunner intercepted a shot.';
    s.impacts.push({lane:s.lane,at:s.distance,remaining:.4,color:'#a5f1ee',text:'BLOCK'});
   }else{
    damageHull(shot.damage);s.message='Robber shot hit! Steer away or hold matching cover.';
    s.impacts.push({lane:s.lane,at:s.distance,remaining:.4,color:'#ff8d79',text:'HIT'});
   }
  }
 }
 s.shots=active;
 s.enemies=s.enemies.filter(e=>e.at-s.distance>=-35);
}
