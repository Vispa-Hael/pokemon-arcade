'use strict';
const $=id=>document.getElementById(id),canvas=$('game');
let view;
try{view=new Arena3D.View(canvas);}catch(error){$('overlay').querySelector('h2').textContent='3D graphics could not start';$('overlay').querySelector('p').textContent='This game needs WebGL 2. Update your graphics driver and restart.';throw error;}
const {species,moves,typeChart}=Arena3D.battleCatalog;
const colors={Electric:'#ffe76f',Fire:'#ff9761',Water:'#8de5ff',Grass:'#bcf28d',Normal:'#f0eee1',Ghost:'#b78bff',Poison:'#de86ee',Psychic:'#ff8fd2',Fighting:'#ffad77',Steel:'#b7e5ef',Flying:'#c2e1ff',Dark:'#b6a0d5'};
let selected='Pikachu',p,b,shots=[],sparks=[],zones=[],texts=[],running=false,paused=false,demo=false,time=0,rapidCD=0,chargeCD=0,dodgeCD=0,bossCD=2.2,toastTime=0,last=0,phase=1,keys={},demoClock=0,shotId=0,inspectResume=false;
const arenaScale=Math.sqrt(3);
const bounds={x:550-492*arenaScale,y:377-255*arenaScale,w:984*arenaScale,h:510*arenaScale};
function effectiveness(type,types){return types.reduce((n,t)=>n*(typeChart[type]?.[t]??1),1);}
function entity(name,x,y,boss=false){const s=species[name],st=s.stats;return{name,...s,x,y,dx:1,dy:0,vx:0,vy:0,moveX:0,moveY:0,hp:(st[0]+75)*(boss?3:1),max:(st[0]+75)*(boss?3:1),energy:0,stun:0,inv:0,slow:0,poison:0,poisonTick:1,attackSerial:0,r:boss?34:22,boss,speed:160+st[5]*1.25,attackCount:0};}
function setup(){view.reset?.();p=entity(selected,310,390);b=entity($('boss').value,815,370,true);shots=[];sparks=[];zones=[];texts=[];time=0;rapidCD=0;chargeCD=0;dodgeCD=0;bossCD=2.2;phase=1;demoClock=0;$('pause').textContent='Ⅱ';hud();}
function roster(){
 $('roster').innerHTML='';
 for(const [name,s]of Object.entries(species)){const el=document.createElement('button');el.textContent=name;el.style.setProperty?.('--fighter',s.color);el.title=name+' · '+s.role;el.setAttribute('aria-label',name);el.setAttribute('aria-pressed',String(name===selected));el.className=name===selected?'active':'';el.onclick=()=>{selected=name;loadout();};$('roster').append(el);}
}
function loadout(){if(view.inspection)closeModelView();running=false;paused=false;demo=false;roster();const s=species[selected];$('fighterName').textContent=selected;$('type').textContent=s.type.join(' / ').toUpperCase();$('fighterStyle').textContent=s.role+' · '+s.description;$('stats').innerHTML=s.stats.map((v,i)=>`<div>${['HP','ATTACK','DEFENSE','SP. ATK','SP. DEF','SPEED'][i]}<b>${v}</b></div>`).join('');for(const kind of ['rapid','charged'])$(kind).innerHTML=s[kind].map(m=>`<option>${m}</option>`).join('');setup();matchup();showOverlay('Choose your approach.',s.role+'<br>'+s.description);$('state').textContent='READY WHEN YOU ARE';}
function matchup(){const m=moves[$('rapid').value],e=effectiveness(m.type,species[$('boss').value].type);$('matchup').textContent=`${m.type} → ${species[$('boss').value].type.join(' / ')} · ${e}× damage${e===0?' — immune! Change your rapid move.':e>1?' — super effective!':e<1?' — resisted.':' — neutral matchup.'}`;$('rapidHint').textContent=m.description;$('chargedHint').textContent=moves[$('charged').value].description+' · '+moves[$('charged').value].cost+' energy';}
function start(auto=false){if(view.inspection)closeModelView();if(view.ready&&!view.assets.size)return;demo=auto;setup();running=true;paused=false;keys={};$('overlay').style.display='none';$('state').textContent=auto?'SAMPLE RUN • AUTOPILOT':'BATTLE IN PROGRESS';notify(auto?'Pikachu sample run — press a movement key to take control':'Battle started — hold SPACE for '+$('rapid').value);}
function showOverlay(title,desc){$('overlay').style.display='flex';$('overlay').querySelector('h2').textContent=title;$('overlay').querySelector('p').innerHTML=desc;$('overlayStart').textContent='Enter arena ↗';}
function notify(text){$('toast').textContent=text;toastTime=3;}
function hud(){if(!p)return;$('playerLabel').textContent=p.name.toUpperCase();$('bossLabel').innerHTML=b.name.toUpperCase()+' <b>BOSS</b>';$('playerHP').textContent=`${Math.ceil(p.hp)} / ${p.max} HP`;$('bossHP').textContent=`${Math.ceil(b.hp)} / ${b.max} HP`;$('playerBar').style.width=p.hp/p.max*100+'%';$('bossBar').style.width=b.hp/b.max*100+'%';$('energyBar').style.width=p.energy+'%';$('energyText').textContent=`ENERGY ${Math.floor(p.energy)} / 100 · DODGE ${dodgeCD>0?dodgeCD.toFixed(1)+'s':'READY'}${p.slow>0?' · SLOWED':''}${p.poison>0?' · POISONED':''}`;$('phase').textContent=(phase===2?'ENRAGED · ':'')+b.role.toUpperCase()+(b.slow>0?' · SLOWED':'')+(b.poison>0?' · POISONED':'');}
function emitMove(owner,m,charged){
 owner.attackSerial++;owner.attackCharged=charged;
 const target=owner===p?b:p;
 if(m.kind==='heal'){
  const restored=Math.min(owner.max-owner.hp,owner.max*m.heal);owner.hp+=restored;owner.stun=Math.max(owner.stun,m.recovery||.25);texts.push({x:owner.x,y:owner.y-38,text:'+'+Math.round(restored)+' HP',c:'#b9ffb5',life:1});burst(owner.x,owner.y,'#aaf0aa',24);return;
 }
 if(m.dash){owner.vx+=owner.dx*m.dash;owner.vy+=owner.dy*m.dash;}
 const count=m.count||1;
 for(let i=0;i<count;i++){
  const angle=Math.atan2(owner.dy,owner.dx)+(m.spread?(i-(count-1)/2)*m.spread:0);
  const melee=m.kind==='melee'||m.kind==='radial';
  shots.push({id:++shotId,x:owner.x+(melee?0:owner.dx*30),y:owner.y+(melee?0:owner.dy*30),dx:Math.cos(angle),dy:Math.sin(angle),speed:melee?0:m.speed||500,r:m.size||(charged?14:7),life:melee?.17:(m.life||(charged?1.8:1.25)),maxLife:m.life||(charged?1.8:1.25),m,owner,charged,delay:(m.interval||0)*i,age:0,damageScale:1/count,energyGain:9/count,hits:new Set(),target});
 }
 burst(owner.x+owner.dx*30,owner.y+owner.dy*30,colors[m.type]||'#fff',7);
}
function shoot(charged=false){if(!running||paused||p.stun>0)return;const m=moves[$(charged?'charged':'rapid').value];if(charged){if(chargeCD>0)return;if(p.energy<m.cost){notify(`Need ${m.cost} energy — land rapid attacks to charge`);chargeCD=.35;return;}p.energy-=m.cost;chargeCD=m.kind==='heal'?1.4:.7;}else{if(rapidCD>0)return;rapidCD=m.rate;}emitMove(p,m,charged);}
function dodge(){if(dodgeCD>0||p.stun>0)return;p.inv=.3;p.vx=p.dx*740;p.vy=p.dy*740;dodgeCD=2.4;burst(p.x,p.y,'#efffbc',12);}
function burst(x,y,c,n){view.impact?.(x,y,c,n);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*130;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,life:.25+Math.random()*.35});}}
function hit(target,shot){
 if(target.inv>0||target.hp<=0)return 0;
 const a=shot.owner,m=shot.m,mult=effectiveness(m.type,target.type),stab=a.type.includes(m.type)?1.5:1,atk=a.stats[m.physical?1:3]+20,def=target.stats[m.physical?2:4]+20;
 let damage=((22*m.power*atk/def)/50+2)*stab*mult*(a.boss?.48:.7)*(shot.damageScale??1);
 if(shot.charged&&m===moves['Electro Ball'])damage*=Math.min(1.5,Math.max(.65,a.stats[5]/target.stats[5]));
 if(mult===0){texts.push({x:target.x,y:target.y-38,text:'IMMUNE',c:'#d3c5e7',life:1});return 0;}
 damage=Math.min(target.hp,Math.max(0,damage));target.hp-=damage;
 if(target===b&&!shot.charged)p.energy=Math.min(100,p.energy+(shot.energyGain??9));
 let dx=shot.dx,dy=shot.dy;if(m.kind==='radial'){const d=Math.hypot(target.x-a.x,target.y-a.y)||1;dx=(target.x-a.x)/d;dy=(target.y-a.y)/d;}
 const impulse=Math.min(420,Math.max(35,(shot.charged?360:100)*Math.sqrt(a.weight/target.weight)));
 target.vx+=dx*impulse;target.vy+=dy*impulse;target.stun=Math.max(target.stun,m.stun??(shot.charged?.22:.045));
 if(target===p)target.inv=.3;
 if(m.slow)target.slow=Math.max(target.slow,m.slow);
 if(m.poison&&!target.type.includes('Poison')&&!target.type.includes('Steel')){target.poison=Math.max(target.poison,m.poison);target.poisonTick=1;}
 if(m.drain){const heal=Math.min(a.max-a.hp,damage*m.drain);a.hp+=heal;}
 if(m.recoil)a.hp=Math.max(0,a.hp-damage*m.recoil);
 burst(target.x,target.y,colors[m.type]||'#fff',16);texts.push({x:target.x,y:target.y-38,text:`−${Math.round(damage)}${mult>1?' SUPER!':mult<1?' RESIST':''}`,c:mult>1?'#fff2a0':'#ffffff',life:1});
 if(b.hp<=0)finish(true);else if(p.hp<=0)finish(false);return damage;
}
function finish(win){running=false;$('state').textContent=win?'FIELD TRIAL COMPLETE':'FIELD TRIAL ENDED';showOverlay(win?'Victory in the Verdant Ring.':'Down, but not out.',`${win?'Boss defeated':'Your Pokémon fainted'} in ${time.toFixed(1)} seconds.<br>Try a new fighter, loadout, or boss.`);$('overlayStart').textContent='Battle again ↗';}
function bossAttack(){
 b.attackCount++;bossCD=phase===2?1.45:2.2;
 let name=b.attackCount%3===0?b.charged[0]:b.rapid[b.attackCount%b.rapid.length];
 if(b.ai==='tank'&&b.hp<b.max*.55&&b.attackCount%4===0)name='Rest';
 const m=moves[name];
 if(m.kind==='heal'){emitMove(b,m,true);notify(b.name+' is recovering!');return;}
 if(b.ai==='ghost'||b.ai==='sniper'){
  if(Math.hypot(p.x-b.x,p.y-b.y)<180){const angle=Math.atan2(b.y-p.y,b.x-p.x);b.vx+=Math.cos(angle)*480;b.vy+=Math.sin(angle)*480;burst(b.x,b.y,colors[b.type[0]],20);}
 }
 b.attackSerial++;b.attackCharged=true;
 if(m.kind==='radial')zones.push({x:b.x,y:b.y,r:m.reach,t:.85,total:.85,kind:'blast',type:m.type,m,owner:b});
 else zones.push({x:b.x,y:b.y,a:Math.atan2(p.y-b.y,p.x-b.x),r:0,t:m.kind==='melee'?.45:.65,total:.65,kind:'volley',type:m.type,m,owner:b,charged:b.attackCount%3===0});
 notify(`${b.name}: ${name} — ${m.kind==='radial'?'leave the circle':'dodge the warning lane'}!`);
}
function update(dt){
 if(!running||paused)return;time+=dt;rapidCD-=dt;chargeCD-=dt;dodgeCD-=dt;bossCD-=dt;toastTime-=dt;if(toastTime<=0)$('toast').textContent='';
 if(b.hp<b.max*.5&&phase===1){phase=2;notify(b.name+' is enraged! Watch for faster attacks.');}
 for(const e of [p,b]){
  e.slow=Math.max(0,e.slow-dt);
  if(e.poison>0){e.poisonTick-=dt;if(e.poisonTick<=0){e.poison--;e.poisonTick=1;const dmg=Math.min(e.hp,Math.min(12,e.max*.018));e.hp-=dmg;texts.push({x:e.x,y:e.y-38,text:'−'+Math.round(dmg)+' POISON',c:'#df9cef',life:1});if(e.hp<=0){finish(e===b);return;}}}
 }
 let mx=0,my=0;
 if(demo){demoClock+=dt;const d=Math.hypot(b.x-p.x,b.y-p.y),a=Math.atan2(b.y-p.y,b.x-p.x);if(Math.floor(demoClock*2)%3===0){p.dx=Math.cos(a);p.dy=Math.sin(a);}else{mx=Math.cos(a+Math.PI/2)*.65;my=Math.sin(a+Math.PI/2)*.65;if(d<260){mx-=Math.cos(a);my-=Math.sin(a);}if(d>420){mx+=Math.cos(a);my+=Math.sin(a);}}
  if(rapidCD<=0&&Math.floor(demoClock*2)%3===0)shoot();if(p.energy>=moves[$('charged').value].cost){p.dx=Math.cos(a);p.dy=Math.sin(a);shoot(true);}const danger=zones.find(z=>z.kind==='blast'&&Math.hypot(z.x-p.x,z.y-p.y)<z.r+25);if(danger){mx=p.x-danger.x||1;my=p.y-danger.y||1;const l=Math.hypot(mx,my);p.dx=mx/l;p.dy=my/l;dodge();}
 }else{
  mx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);my=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  // Face the current movement input before firing this frame.
  const l=Math.hypot(mx,my);if(l){p.dx=mx/l;p.dy=my/l;}
  if(keys.Space)shoot();if(keys.KeyE)shoot(true);if(keys.ShiftLeft||keys.ShiftRight)dodge();
 }
 const length=Math.hypot(mx,my);if(length){mx/=length;my/=length;if(!demo||Math.floor(demoClock*2)%3!==0){p.dx=mx;p.dy=my;}}
 const speed=p.speed*(p.slow>0?.58:1),accel=1-Math.exp(-14*dt);p.moveX+=(mx*speed-p.moveX)*accel;p.moveY+=(my*speed-p.moveY)*accel;if(p.stun<=0){p.x+=p.moveX*dt;p.y+=p.moveY*dt;}
 const angle=Math.atan2(p.y-b.y,p.x-b.x),dist=Math.hypot(p.x-b.x,p.y-b.y);b.dx=Math.cos(angle);b.dy=Math.sin(angle);
 const desired=b.ai==='brawler'?95:b.ai==='tank'?115:b.ai==='sniper'?370:b.ai==='ghost'?285:245;
 let approach=dist>desired?1:dist<desired-70&&(b.ai==='sniper'||b.ai==='ghost')?-.75:0;
 if(b.stun<=0){const speed=b.speed*(b.ai==='brawler'?.65:b.ai==='tank'?.22:.3)*(b.slow>0?.58:1);b.x+=b.dx*speed*approach*dt;b.y+=b.dy*speed*approach*dt;}
 if(bossCD<=0)bossAttack();
 for(const e of [p,b]){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-9*dt);e.vy*=Math.exp(-9*dt);e.stun=Math.max(0,e.stun-dt);e.inv=Math.max(0,e.inv-dt);e.x=Math.max(bounds.x+e.r,Math.min(bounds.x+bounds.w-e.r,e.x));e.y=Math.max(bounds.y+e.r,Math.min(bounds.y+bounds.h-e.r,e.y));}
 const overlap=p.r+b.r-Math.hypot(p.x-b.x,p.y-b.y);if(overlap>0){p.x-=b.dx*overlap;p.y-=b.dy*overlap;hit(p,{owner:b,m:{type:'Normal',power:25,physical:true},dx:b.dx,dy:b.dy});}
 for(const z of zones){z.t-=dt;if(z.t>0)continue;const owner=z.owner||b;if(z.kind==='blast'){const m=z.m||{type:z.type,power:75};burst(z.x,z.y,colors[z.type]||'#fff',42);if(Math.hypot(p.x-z.x,p.y-z.y)<z.r+p.r)hit(p,{owner,m,dx:owner.dx,dy:owner.dy,charged:true});}else{owner.dx=Math.cos(z.a);owner.dy=Math.sin(z.a);emitMove(owner,z.m||{type:z.type,power:45,speed:350,count:5,spread:.15},z.charged??true);}}
 zones=zones.filter(z=>z.t>0);
 for(const s of shots){
  if(s.delay>0){s.delay-=dt;continue;}
  s.age=(s.age||0)+dt;const target=s.owner===p?b:p,m=s.m;
  const alreadyHit=s.hits?.has(target);
  if(m.homing){const a=Math.atan2(target.y-s.y,target.x-s.x),current=Math.atan2(s.dy,s.dx),delta=Math.atan2(Math.sin(a-current),Math.cos(a-current)),next=current+Math.max(-m.homing*dt,Math.min(m.homing*dt,delta));s.dx=Math.cos(next);s.dy=Math.sin(next);}
  if(m.kind==='melee'||m.kind==='radial'){
   s.x=s.owner.x;s.y=s.owner.y;const d=Math.hypot(target.x-s.x,target.y-s.y),dot=d?((target.x-s.x)*s.dx+(target.y-s.y)*s.dy)/d:1;
   if(!alreadyHit&&d<=m.reach+target.r&&(m.kind==='radial'||dot>.25)){hit(target,s);s.hits.add(target);s.life=0;}
  }else{
   s.x+=s.dx*s.speed*dt;s.y+=s.dy*s.speed*dt;
   if(!alreadyHit&&Math.hypot(s.x-target.x,s.y-target.y)<s.r+target.r){hit(target,s);s.hits?.add(target);if(!m.pierce)s.life=0;}
  }
  s.life-=dt;
 }
 shots=shots.filter(s=>s.life>0&&s.x>bounds.x-24&&s.x<bounds.x+bounds.w+24&&s.y>bounds.y-24&&s.y<bounds.y+bounds.h+24);hud();
}
function draw(dt){if(!paused){for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;}for(const t of texts){t.life-=dt;t.y-=25*dt;}}sparks=sparks.filter(s=>s.life>0);texts=texts.filter(t=>t.life>0);view.render({p,b,shots,zones,sparks,texts,time,running,paused},dt);}
let tacticalCamera=false;$('camera').onclick=()=>{tacticalCamera=!tacticalCamera;view.setCamera(tacticalCamera);document.activeElement.blur();};
function frame(t){const dt=Math.min((t-last)/1000,.035);last=t;update(dt);draw(dt);requestAnimationFrame(frame);}
function pause(){if(!running||view.inspection)return;paused=!paused;$('state').textContent=paused?'PAUSED • PRESS P TO RESUME':demo?'SAMPLE RUN • AUTOPILOT':'BATTLE IN PROGRESS';$('pause').textContent=paused?'▶':'Ⅱ';if(paused)notify('Paused — press P to resume');}
function closeModelView(){view.closeInspection?.();$('modelControls').hidden=true;canvas.parentElement.classList.remove('inspecting');if(inspectResume&&running&&paused)pause();inspectResume=false;}
window.addEventListener('keydown',e=>{if(['SELECT','BUTTON','INPUT'].includes(document.activeElement.tagName)&&e.code!=='Escape')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyP'&&!e.repeat)pause();if(demo&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){demo=false;$('state').textContent='BATTLE IN PROGRESS';notify('You have control!');}});
window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{keys={};if(running&&!paused)pause();});
$('start').onclick=()=>{start();document.activeElement.blur();};$('overlayStart').onclick=()=>{start();document.activeElement.blur();};$('demo').onclick=()=>{selected='Pikachu';loadout();start(true);document.activeElement.blur();};$('pause').onclick=()=>{pause();document.activeElement.blur();};$('boss').onchange=loadout;$('rapid').onchange=matchup;$('charged').onchange=matchup;
$('inspect').onclick=()=>{if(!view.assets?.size)return;if(view.inspection){closeModelView();return;}inspectResume=running&&!paused;if(inspectResume)pause();$('inspectSpecies').value=selected;view.inspect(selected,$('inspectAnimation').value);$('modelControls').hidden=false;canvas.parentElement.classList.add('inspecting');document.activeElement.blur();};$('closeInspect').onclick=closeModelView;for(const id of ['inspectSpecies','inspectAnimation'])$(id).onchange=()=>view.inspect($('inspectSpecies').value,$('inspectAnimation').value);
let dragX=null;canvas.addEventListener?.('pointerdown',e=>{if(view.inspection){dragX=e.clientX;canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener?.('pointermove',e=>{if(dragX!==null&&view.inspection){view.inspection.angle+=(e.clientX-dragX)*.012;dragX=e.clientX;}});canvas.addEventListener?.('pointerup',()=>dragX=null);canvas.addEventListener?.('pointercancel',()=>dragX=null);canvas.addEventListener?.('wheel',e=>{if(view.inspection){e.preventDefault();view.inspection.zoom=Math.max(.7,Math.min(1.7,view.inspection.zoom+e.deltaY*.001));}},{passive:false});
$('boss').innerHTML=Object.keys(species).map(name=>`<option value="${name}">${name} · ${species[name].type.join(' / ')}</option>`).join('');$('boss').value='Blastoise';$('inspectSpecies').innerHTML=Object.keys(species).map(name=>`<option>${name}</option>`).join('');loadout();requestAnimationFrame(frame);
window.arenaSnapshot=()=>({running,paused,demo,time,player:{name:p.name,x:p.x,y:p.y,hp:p.hp,energy:p.energy,dx:p.dx,dy:p.dy},boss:{name:b.name,hp:b.hp},projectiles:shots.length,roster:Object.keys(species).length});
if(view.ready){for(const id of ['start','demo','overlayStart'])$(id).disabled=true;$('overlay').querySelector('h2').textContent='Preparing Pokémon…';$('overlay').querySelector('p').textContent='Loading local models and animation rigs.';view.ready.then(()=>{for(const id of ['start','demo','overlayStart'])$(id).disabled=false;showOverlay('Twelve fighters. Your style.','Choose a Pokémon and build your move loadout.');}).catch(error=>{$('overlay').querySelector('h2').textContent='Pokémon models could not load';$('overlay').querySelector('p').textContent=error.message;console.error(error);});}
