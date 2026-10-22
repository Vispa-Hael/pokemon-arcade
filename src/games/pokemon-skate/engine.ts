export {profiles,placeholder,attributes} from './profiles';
import {placeholder,type Profile} from './profiles';
export type {Profile} from './profiles';
export const tuning={dt:1/120,gravity:18,push:7,brake:15,resistance:.3,steer:1.8,maxSpeed:17,cruise:7,chargeMax:.65,ollieMin:4,ollieMax:8,pumpCap:15,bankDelay:.35,runTime:75,manualDuration:3,impact:14};
export type Mode='free'|'run';
export type State='Grounded'|'Manual'|'Airborne'|'Grinding'|'Bail'|'Recovery';
export type Action='left'|'right'|'up'|'down'|'pump'|'manual'|'jump'|'flip'|'spin'|'grab'|'special'|'camera';
export interface Input {held:Set<Action>;pressed:Set<Action>;released:Set<Action>}
export const emptyInput=():Input=>({held:new Set(),pressed:new Set(),released:new Set()});
export interface Vec {x:number;y:number;z:number}
export const bounds={minX:-32,maxX:32,minZ:-26,maxZ:28};
export const rails=[{id:'plaza-rail',a:{x:-24,y:1,z:-13},b:{x:-15,y:1,z:-5}},{id:'long-rail',a:{x:-6,y:1,z:-7},b:{x:4,y:1,z:-7}}];
export const obstacles=[{x:18,z:-18,w:2,d:2,h:1},{x:-26,z:0,w:2,d:3,h:.8}];
export const spawns:Record<number,{x:number;z:number;heading:number}>={3:{x:-18,z:-20,heading:.2},49:{x:10,z:-1,heading:0},74:{x:-13,z:11,heading:0}};
/** Shared 2D height field in a genuinely 3D park: the rider can cross every feature along X and Z. */
export function heightAt(x:number,z:number){
 const radius=Math.hypot(x-10,z-7);if(radius<10)return -2.5*(1+Math.cos(Math.PI*radius/10));
 if(x> -22&&x< -4&&z>9&&z<25){const edge=Math.min(1,(x+22)/2,(-4-x)/2);return -3*(.5+.5*Math.cos((z-17)*Math.PI/8))*Math.max(0,edge);}
 if(x>=-18&&x<=-11&&z>=-12&&z<=-5)return .055*(x+18)**2;
 if(x>=22&&x<=29&&z>=-16&&z<=-4)return .07*(x-22)**2;
 if(x>=-2&&x<=6&&z>=-20&&z<=-14)return .85;
 if(x>9&&x<12&&z> -23&&z< -12)return -4;
 return 0;
}
export function surfaceAt(x:number,z:number){const h=heightAt(x,z),e=.015;const derivative=(a:number,b:number)=>Math.abs(a-h)>.15?(h-b)/e:Math.abs(b-h)>.15?(a-h)/e:(a-b)/(2*e);const dx=derivative(heightAt(x+e,z),heightAt(x-e,z)),dz=derivative(heightAt(x,z+e),heightAt(x,z-e)),len=Math.hypot(dx,1,dz);return {height:h,normal:{x:-dx/len,y:1/len,z:-dz/len},dx,dz,id:Math.hypot(x-10,z-7)<10?'bowl':x> -22&&x< -4&&z>9&&z<25?'half-pipe':h>0?'ramp / ledge':h< -3?'gap':'plaza'};}
export interface Trick {id:string;category:string;start:number;duration:number;base:number;awarded:boolean}
export interface Combo {base:number;multiplier:number;quality:number;repeats:Record<string,number>;actions:string[];stable:number}
const newCombo=():Combo=>({base:0,multiplier:1,quality:1.25,repeats:{},actions:[],stable:0});
export interface Run {mode:Mode;profile:Profile;tick:number;time:number;remaining:number;ended:boolean;state:State;x:number;y:number;z:number;vx:number;vy:number;vz:number;heading:number;normal:Vec;grounded:boolean;surface:string;rail:string|null;railT:number;charge:number;catchUntil:number;pumpAvailable:boolean;pumpCooldown:number;pumpDirection:number;pumpSurface:string;manualTime:number;stateTime:number;tricks:Trick[];combo:Combo;score:number;bestCombo:number;stance:number;assisting:boolean;cooldown:number;specialTime:number;landing:string;reason:string;message:string;checkpoint:Vec;lastX:number;lastY:number;lastZ:number;eventLog:{tick:number;pressed:Action[];released:Action[]}[]}
export function newRun(mode:Mode,profile:Profile=placeholder,spawn=3):Run {const p=spawns[spawn]??spawns[3],s=surfaceAt(p.x,p.z);return {mode,profile,tick:0,time:0,remaining:tuning.runTime,ended:false,state:'Grounded',x:p.x,y:s.height,z:p.z,vx:0,vy:0,vz:0,heading:p.heading,normal:s.normal,grounded:true,surface:s.id,rail:null,railT:0,charge:0,catchUntil:-1,pumpAvailable:true,pumpCooldown:0,pumpDirection:0,pumpSurface:'',manualTime:0,stateTime:0,tricks:[],combo:newCombo(),score:0,bestCombo:0,stance:1,assisting:false,cooldown:0,specialTime:0,landing:'—',reason:'',message:'Explore the whole park. W / ↑ pushes; A / D steers.',checkpoint:{x:p.x,y:s.height,z:p.z},lastX:p.x,lastY:s.height,lastZ:p.z,eventLog:[]};}
export const speed=(r:Run)=>Math.hypot(r.vx,r.vy,r.vz);
export function comboValue(r:Run){return Math.round(r.combo.base*r.combo.multiplier*r.combo.quality);}
export function addScore(r:Run,id:string,base:number){const c=r.combo,n=c.repeats[id]??0;c.repeats[id]=n+1;c.base+=base*r.profile.flair/(1+n*.65);if(!c.actions.includes(id)){c.actions.push(id);c.multiplier=Math.min(8,1+(c.actions.length-1)*.5);}c.stable=0;}
export function bank(r:Run){const points=comboValue(r);r.score+=points;r.bestCombo=Math.max(points,r.bestCombo);if(points)r.message=`${points.toLocaleString()} banked`;r.combo=newCombo();}
export function bail(r:Run,reason:string){r.state='Bail';r.grounded=false;r.stateTime=0;r.rail=null;r.charge=0;r.tricks=[];r.combo=newCombo();r.landing='Bail';r.reason=reason;r.message=`Bail · ${reason}`;r.vx=r.vy=r.vz=0;}
export function evaluateLanding(r:Run,normal:Vec){const impact=-(r.vx*normal.x+r.vy*normal.y+r.vz*normal.z),dot=r.normal.x*normal.x+r.normal.y*normal.y+r.normal.z*normal.z;const tolerance=r.profile.id===7&&r.specialTime>0?.45:.55;if(r.tricks.some(t=>r.time<t.start+t.duration+.08))return {quality:'Bail',factor:0,reason:'Trick still recovering'};if(impact>tuning.impact*r.profile.stability||dot<tolerance)return {quality:'Bail',factor:0,reason:dot<tolerance?'Board misaligned':'Heavy impact'};return impact<8&&dot>.94?{quality:'Perfect',factor:1.25,reason:'Aligned contact'}:impact<12&&dot>.75?{quality:'Clean',factor:1,reason:'Controlled impact'}:{quality:'Scraped',factor:.65,reason:'Marginal contact'};}
function launch(r:Run,impulse:number){r.vx+=r.normal.x*impulse;r.vy+=r.normal.y*impulse;r.vz+=r.normal.z*impulse;r.y+=.025;r.state='Airborne';r.grounded=false;r.rail=null;r.charge=0;r.combo.stable=0;}
function trick(r:Run,id:string,category:string,duration:number,base:number){if(r.state==='Airborne'&&!r.tricks.some(t=>t.category===category&&r.time<t.start+t.duration+.08)){r.tricks.push({id,category,start:r.time,duration,base,awarded:false});r.message=id;}}
export function railCandidate(r:Run){for(const rail of rails){const dx=rail.b.x-rail.a.x,dz=rail.b.z-rail.a.z,len2=dx*dx+dz*dz,t=((r.x-rail.a.x)*dx+(r.z-rail.a.z)*dz)/len2;if(t<0||t>1)continue;const x=rail.a.x+t*dx,z=rail.a.z+t*dz;if(Math.hypot(r.x-x,r.z-z)<.3&&r.lastY>=rail.a.y&&r.y<=rail.a.y+.12&&r.vy<=0&&Math.abs((r.vx*dx+r.vz*dz)/Math.sqrt(len2))>1)return {rail,t,x,z};}return null;}
export function step(r:Run,i:Input){if(r.ended)return;const dt=tuning.dt;r.lastX=r.x;r.lastY=r.y;r.lastZ=r.z;r.tick++;r.time=r.tick*dt;r.remaining=Math.max(0,tuning.runTime-r.time);r.stateTime+=dt;r.cooldown=Math.max(0,r.cooldown-dt);r.specialTime=Math.max(0,r.specialTime-dt);r.pumpCooldown=Math.max(0,r.pumpCooldown-dt);r.assisting=false;
 if(i.pressed.size||i.released.size){r.eventLog.push({tick:r.tick,pressed:[...i.pressed],released:[...i.released]});if(r.eventLog.length>12000)r.eventLog.shift();}
 if(r.mode==='run'&&r.remaining===0){if(r.state==='Grounded')bank(r);else r.combo=newCombo();r.ended=true;r.message=`Session complete · ${r.score.toLocaleString()} points`;return;}
 if(r.state==='Bail'){if(r.stateTime>1){r.state='Recovery';r.stateTime=0;r.x=r.checkpoint.x;r.y=r.checkpoint.y;r.z=r.checkpoint.z;r.normal=surfaceAt(r.x,r.z).normal;}return;}
 if(r.state==='Recovery'){if(r.stateTime>.4){r.state='Grounded';r.grounded=true;r.message='Back on the board.';}return;}
 const steering=Number(i.held.has('right'))-Number(i.held.has('left'));r.heading+=steering*tuning.steer*dt*(r.grounded?1:.45);const fx=Math.sin(r.heading),fz=Math.cos(r.heading),throttle=Number(i.held.has('up'))-Number(i.held.has('down'));
 if(i.pressed.has('manual')&&r.state==='Airborne')r.catchUntil=r.time+.2;
 if(i.pressed.has('special')&&r.cooldown===0){r.cooldown=14;r.specialTime=2;r.message=r.profile.ability;if(r.profile.id===25&&r.grounded&&speed(r)>1){r.vx*=1.1;r.vy*=1.1;r.vz*=1.1;}if(r.profile.id===94)trick(r,'Phantom style','signature',.4,300);}
 if(r.grounded){const s=surfaceAt(r.x,r.z),n=s.normal;r.surface=s.id;r.normal=n;let forward=r.vx*fx+r.vz*fz;
  if(i.held.has('manual')&&speed(r)>1&&r.manualTime<tuning.manualDuration*r.profile.endurance){r.state='Manual';r.manualTime+=dt;if(r.manualTime>.25&&!r.combo.repeats.Manual)addScore(r,'Manual',120);}else r.state='Grounded';if(!i.held.has('manual'))r.manualTime=0;
  const curved=s.id==='bowl'||s.id==='half-pipe',direction=Math.sign(r.vx*s.dx+r.vz*s.dz);if(curved&&(s.id!==r.pumpSurface||direction!==r.pumpDirection&&Math.abs(r.vx*s.dx+r.vz*s.dz)>.5)){r.pumpAvailable=true;r.pumpSurface=s.id;r.pumpDirection=direction;}if(!curved){r.pumpAvailable=false;r.pumpSurface='';}
  if(i.pressed.has('pump')){const slope=Math.hypot(s.dx,s.dz),v=speed(r);if(curved&&r.pumpAvailable&&!r.pumpCooldown&&v>1){const good=slope>.2&&slope<1.5,factor=good&&v<tuning.pumpCap?Math.min(tuning.pumpCap,Math.sqrt(v*v+20))/v:1;r.vx*=factor;r.vy*=factor;r.vz*=factor;r.pumpAvailable=false;r.pumpCooldown=.5;r.message=good?'PERFECT pump':'Early / late pump';}else r.message='Tap E while crossing a curved transition.';}
  r.assisting=r.mode==='run'&&r.state==='Grounded'&&!curved&&n.y>.97&&throttle>=0&&forward>=0&&forward<tuning.cruise;
  const force=throttle*(throttle*forward<0?tuning.brake:tuning.push*r.profile.pace/(1+(speed(r)/tuning.maxSpeed)**4))+(r.assisting?Math.min(3,(tuning.cruise-forward)*2):0);
  r.vx+=(fx*force+tuning.gravity*n.y*n.x)*dt;r.vz+=(fz*force+tuning.gravity*n.y*n.z)*dt;
  // Tyre grip turns existing horizontal momentum toward the board; it does not add energy.
  forward=r.vx*fx+r.vz*fz;const lateral=r.vx*fz-r.vz*fx,grip=Math.exp(-7*dt);r.vx=forward*fx+lateral*fz*grip;r.vz=forward*fz-lateral*fx*grip;
  const v=Math.hypot(r.vx,r.vz),drag=Math.max(0,1-(tuning.resistance+(r.state==='Manual'?v*.3:0))*dt/Math.max(v,.01));r.vx*=drag;r.vz*=drag;r.vy=s.dx*r.vx+s.dz*r.vz;
  if(i.held.has('jump'))r.charge=Math.min(tuning.chargeMax,r.charge+dt);
  const nx=r.x+r.vx*dt,nz=r.z+r.vz*dt,ns=surfaceAt(nx,nz),expected=r.y+r.vy*dt;
  if(ns.height>expected+.25){if(speed(r)>2){bail(r,'Ramp / ledge side impact');return;}r.vx=r.vy=r.vz=0;}
  else if(ns.height<expected-.12){r.x=nx;r.z=nz;r.y=expected;r.state='Airborne';r.grounded=false;}
  else{r.x=nx;r.z=nz;r.y=ns.height;const oldSpeed=speed(r),ny=ns.dx*r.vx+ns.dz*r.vz,scale=oldSpeed/Math.max(.00001,Math.hypot(r.vx,ny,r.vz));r.vx*=scale;r.vz*=scale;r.vy=ny*scale;r.normal=ns.normal;if(speed(r)<1&&ns.normal.y>.99)r.checkpoint={x:r.x,y:r.y,z:r.z};}
  if(i.released.has('jump'))launch(r,(tuning.ollieMin+(tuning.ollieMax-tuning.ollieMin)*r.charge/tuning.chargeMax)*r.profile.pop*(r.profile.id===66&&r.specialTime>0?1.1:1));
 }else if(r.state==='Grinding'){
  const rail=rails.find(a=>a.id===r.rail)!,dx=rail.b.x-rail.a.x,dz=rail.b.z-rail.a.z,len=Math.hypot(dx,dz);let v=(r.vx*dx+r.vz*dz)/len;v=Math.sign(v)*Math.max(0,Math.abs(v)-.7*dt);r.railT+=v*dt/len;r.x=rail.a.x+dx*r.railT;r.z=rail.a.z+dz*r.railT;r.y=rail.a.y;r.vx=v*dx/len;r.vz=v*dz/len;r.vy=0;r.normal={x:0,y:1,z:0};
  if(i.held.has('jump'))r.charge=Math.min(tuning.chargeMax,r.charge+dt);if(i.released.has('jump'))launch(r,5);else if(r.railT<0||r.railT>1||Math.abs(v)<.3){r.state='Airborne';r.rail=null;}
 }else if(r.state==='Airborne'){
  r.vy-=tuning.gravity*dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.z+=r.vz*dt;r.charge=0;const smooth=1-Math.exp(-dt*4);r.normal.x*=1-smooth;r.normal.z*=1-smooth;r.normal.y+=(1-r.normal.y)*smooth;
  if(i.pressed.has('flip'))trick(r,'Kickflip','flip',.48,180);if(i.pressed.has('spin'))trick(r,'180°','spin',.42,150);if(i.pressed.has('grab'))trick(r,'Grab','grab',.2,100);
  const candidate=r.time<=r.catchUntil&&!r.tricks.some(t=>r.time<t.start+t.duration+.08)?railCandidate(r):null;if(candidate){r.state='Grinding';r.rail=candidate.rail.id;r.railT=candidate.t;r.x=candidate.x;r.z=candidate.z;r.y=candidate.rail.a.y;r.vy=0;r.catchUntil=-1;addScore(r,'50–50 grind',220);r.message='50–50 grind';}
  else{const s=surfaceAt(r.x,r.z);if(r.y<=s.height&&r.vy-(s.dx*r.vx+s.dz*r.vz)<=0){const outcome=evaluateLanding(r,s.normal);r.landing=outcome.quality;r.reason=outcome.reason;if(outcome.factor===0){bail(r,outcome.reason);return;}const d=r.vx*s.normal.x+r.vy*s.normal.y+r.vz*s.normal.z;r.vx-=d*s.normal.x;r.vy-=d*s.normal.y;r.vz-=d*s.normal.z;if(outcome.quality==='Scraped'){r.vx*=.7;r.vy*=.7;r.vz*=.7;}r.y=s.height;r.normal=s.normal;r.state='Grounded';r.grounded=true;r.surface=s.id;r.combo.quality=Math.min(r.combo.quality,outcome.factor);r.message=`${outcome.quality} landing`;for(const t of r.tricks)if(!t.awarded){addScore(r,t.id,t.base);t.awarded=true;}r.tricks=[];}}
 }
 for(const t of r.tricks){if(!t.awarded&&r.time>=t.start+t.duration&&(t.category!=='grab'||!i.held.has('grab')||r.time>=t.start+1)){t.awarded=true;addScore(r,t.id,t.base+(t.category==='grab'?80*Math.min(1,r.time-t.start):0));if(t.category==='spin')r.stance*=-1;}if(t.category==='grab'&&i.released.has('grab')&&r.time<t.start+t.duration)r.tricks=r.tricks.filter(t2=>t2!==t);}
 if(r.state==='Grounded'){r.combo.stable+=dt;if(r.combo.base&&r.combo.stable>=tuning.bankDelay)bank(r);}else r.combo.stable=0;
 for(const o of obstacles)if(Math.abs(r.x-o.x)<o.w/2+.3&&Math.abs(r.z-o.z)<o.d/2+.3&&r.y<o.h){bail(r,'Obstacle impact');return;}
 if(r.x<bounds.minX+.5||r.x>bounds.maxX-.5||r.z<bounds.minZ+.5||r.z>bounds.maxZ-.5){r.x=Math.max(bounds.minX+.5,Math.min(bounds.maxX-.5,r.x));r.z=Math.max(bounds.minZ+.5,Math.min(bounds.maxZ-.5,r.z));if(speed(r)>4)bail(r,'Park boundary');else r.vx=r.vz=0;}
 if(r.y< -7)bail(r,'Missed the gap');
}
export class SimulationClock {accumulator=0;advance(seconds:number,r:Run,input:(tick:number)=>Input){this.accumulator+=Math.min(.1,Math.max(0,seconds));let steps=0;while(this.accumulator+1e-10>=tuning.dt&&steps<12){step(r,input(r.tick+1));this.accumulator-=tuning.dt;steps++;}return Math.max(0,this.accumulator/tuning.dt);}}
export function replay(mode:Mode,profile:Profile,spawn:number,ticks:number,events:Run['eventLog']){const r=newRun(mode,profile,spawn),held=new Set<Action>(),byTick=new Map(events.map(e=>[e.tick,e]));for(let t=1;t<=Math.min(120000,ticks);t++){const e=byTick.get(t);for(const a of e?.pressed??[])held.add(a);for(const a of e?.released??[])held.delete(a);step(r,{held,pressed:new Set(e?.pressed??[]),released:new Set(e?.released??[])});}return r;}


