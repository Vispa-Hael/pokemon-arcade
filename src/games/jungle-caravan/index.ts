import type {GameModule} from '../../shared/game';
import {portraitUrl} from '../../shared/portraits';
import {roles,roster,metrics,newRun,tick,trigger,swap,burstInfo,affinity,finish,clamp,type Input,type Run} from './rules';
import {draw} from './render';
import './style.css';
const safe=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const notes=['Speed improves lane-change response. Normal adds handling.','Sp. Defense improves steering. Grass/Flying reduce mud drag.','Attack + Speed set pace. Supplies your crew ability.','HP sets hull; Defense + Sp. Defense absorb damage.','Sp. Attack sets shot power. Speed sets firing rate. Steer to aim.','Attack sets shot power. Speed sets firing rate. Targets either roadside.'];
interface Manifest {version:2;crew:number[];seed:string}
const game:GameModule={id:'jungle-caravan',name:'Jungle Caravan',description:'Build a six-Pokémon crew. Drive, return fire, and outrun the jungle.',instructions:'A/D or arrows change lanes; hold to move across two lanes. Cruise starts on. W accelerates, S brakes. Front and side gunners fire automatically. Steer to line up front targets; roadside targets are handled by the Side Gunner. A warning marks where robbers are aiming: hold Q for high cover or E for low, or change lanes. Space uses your Engine ability; X swaps gunners. P/Escape pauses. Green supply crates repair hull and shorten ability cooldown. Reach the river gate before hull or beast gap reaches zero.',version:'1.2.0',route:'/games/jungle-caravan',category:'Action',scoreKeys:[],thumbnail:'/previews/jungle-caravan.jpg',status:'Playable',controls:['Keyboard','Touch'],icon:'⛟',saveVersion:2,resume(player,characters){const pool=roster(characters);const saved=player.load('jungle-caravan',(v):v is Manifest=>{const x=v as Partial<Manifest>|null;return !!x&&x.version===2&&typeof x.seed==='string'&&x.seed.length>0&&x.seed.length<=32&&Array.isArray(x.crew)&&x.crew.length===6&&x.crew.every(id=>pool.some(c=>c.id===id))&&new Set(x.crew).size===6;});return saved?{label:'Restore crew',detail:`Six stations saved · route ${saved.seed}`}:null;},mount(host,{characters,player,reducedMotion}){
 const pool=roster(characters),portraits=new Map<number,HTMLImageElement>();
 if(new Set(pool.map(c=>c.speciesId)).size<6){host.textContent='Six species with complete offline stats are required.';return;}
 const saved=player.load('jungle-caravan',(v):v is Manifest=>{
  if(!v||typeof v!=='object')return false;const x=v as Partial<Manifest>;
  return x.version===2&&typeof x.seed==='string'&&x.seed.length>0&&x.seed.length<=32&&Array.isArray(x.crew)&&x.crew.length===6&&x.crew.every(id=>pool.some(c=>c.id===id))&&new Set(x.crew.map(id=>pool.find(c=>c.id===id)!.speciesId)).size===6;
 });
 let team=(saved?.crew??[25,133,6,9,1,4]).map(id=>pool.find(c=>c.id===id)).filter((c):c is typeof pool[number]=>!!c);
 if(team.length!==6)team=pool.slice(0,6);
 let seed=saved?.seed??'river-30',run:Run|undefined,paused=false,cruise=true,frame=0,last=0,accumulator=0,uiClock=0,disposed=false,countdown=0,overlayState='',notice='',displayedCrew='';
 const keys=new Set<string>(),pointers=new Map<number,string>();
 const el=(id:string)=>host.querySelector<HTMLElement>('#'+id)!;
 const button=(id:string)=>el(id) as HTMLButtonElement;
 function save(){player.save('jungle-caravan',{version:2,crew:team.map(c=>c.id),seed});}
 function art(id:number,name:string){const url=portraitUrl(id);return url?`<img src="${safe(url)}" alt="${safe(name)}" width="68" height="68" draggable="false">`:`<span class="jc-avatar">${safe(name[0])}</span>`;}
 function warmPortraits(){for(const c of team){const url=portraitUrl(c.id);if(url&&!portraits.has(c.id)){const img=new Image();img.src=url;portraits.set(c.id,img);}}}
 function weaponCards(m:ReturnType<typeof metrics>){return `<div class="jc-weapons">${[m.front,m.side].map((w,i)=>`<article>${art(team[i+4].id,team[i+4].name)}<div><b>${i?'SIDE':'FRONT'} · ${safe(team[i+4].name)}</b><strong>${w.dps.toFixed(1)} <small>base DPS</small></strong><span>${w.power.toFixed(1)} power × ${w.rate.toFixed(2)} shots/s</span></div></article>`).join('')}</div>`;}
 function setup(){
  run=undefined;paused=false;keys.clear();pointers.clear();document.documentElement.classList.remove('jc-focus');warmPortraits();
  const m=metrics(team),b=burstInfo(team[2]);
  host.innerHTML=`<div class="jc jc-setup"><div class="jc-setup-heading"><div><span class="eyebrow">CREW MANIFEST · EIGHT OFFLINE SPECIES</span><h2>Build your escape crew.</h2><p>One Pokémon per station. Selecting an assigned Pokémon swaps its position.</p></div><div class="jc-launch"><label for="jc-seed">Route seed</label><input id="jc-seed" maxlength="32" value="${safe(seed)}"><button class="primary" id="jc-start">Start expedition ↗</button></div></div><div class="jc-presets"><span>Try a crew:</span><button data-preset="balanced">Balanced</button><button data-preset="firepower">Firepower</button><button data-preset="mud">Mud runner</button></div><p id="jc-selection" role="status">${safe(notice)}</p><div class="jc-roles">${roles.map((role,i)=>`<article><div class="jc-role-heading">${art(team[i].id,team[i].name)}<label for="jc-role-${i}"><small>STATION ${i+1}</small>${role}</label></div><select id="jc-role-${i}" data-role="${i}">${pool.map(c=>`<option value="${c.id}" ${team[i].id===c.id?'selected':''}>${safe(c.name)} · ${safe(c.types.join('/'))}</option>`).join('')}</select><p>${notes[i]}</p><small>Species ability: ${safe(team[i].ability)}${i===2?`<br>Caravan adaptation: ${b.name} — ${b.effect}`:''}</small></article>`).join('')}</div>${weaponCards(m)}<div class="jc-team-stats"><span>Top speed <b>${m.maxSpeed.toFixed(1)} m/s</b></span><span>Hull <b>${Math.round(m.hull)}</b></span><span>Armor <b>${Math.round(m.armor*100)}%</b></span><span>Synergy <b>${m.synergy}/100</b></span></div><details><summary>Why these numbers? Types, stats & abilities</summary><p>Equal arcade level 30; each base stat is capped to 30–130 before scaling. Front power = 8 + 16 × Sp. Attack/100. Side power uses Attack instead. Firing rate = 0.8 + 1.2 × Speed/100. DPS is damage per shot × shots per second, before critical bonuses. Driver Speed and Scout Sp. Defense set steering. Defender HP sets hull; Defense and Sp. Defense set armor.</p><p>Luck ${(m.luck*100).toFixed(1)}% adds to automatic interception and gives outgoing shots a chance of +20% damage. Synergy rewards unique types and Fire Engine/Water Defender or Grass Scout/Electric Engine pairings. There are no evolution-family bonuses.</p>${Object.entries(affinity).map(([t,n])=>`<p><b>${t}:</b> ${n}</p>`).join('')}<p>Canonical species ability names are from the shared database. The Engine's named Caravan effects are original game adaptations, with a 22-second cooldown. Other stations use base stats and type bonuses. Your crew and seed save locally; active runs do not.</p></details><p class="jc-warning" role="status">${safe(player.warning)}</p></div>`;
  host.querySelectorAll<HTMLSelectElement>('[data-role]').forEach(select=>select.onchange=()=>{
   seed=(el('jc-seed') as HTMLInputElement).value.trim()||'river-30';const i=Number(select.dataset.role),c=pool.find(c=>c.id===Number(select.value))!,j=team.findIndex(p=>p.speciesId===c.speciesId);
   notice=j>=0?`${c.name} moved to ${roles[i]}; ${team[i].name} moved to ${roles[j]}.`:`${c.name} assigned to ${roles[i]}.`;
   if(j>=0)team[j]=team[i];team[i]=c;save();setup();host.querySelector<HTMLSelectElement>(`#jc-role-${i}`)!.focus();
  });
  host.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(p=>p.onclick=()=>{seed=(el('jc-seed') as HTMLInputElement).value.trim()||'river-30';const presets:Record<string,number[]>={balanced:[25,133,6,9,1,4],firepower:[25,1,6,9,10026,133],mud:[133,1,25,9,6,10026]};team=presets[p.dataset.preset!].map(id=>pool.find(c=>c.id===id)!);notice=`${p.textContent} crew selected. Compare the speed, hull and weapon cards below.`;save();setup();});
  button('jc-start').onclick=()=>{seed=(el('jc-seed') as HTMLInputElement).value.trim()||'river-30';save();start();};
 }
 function returnToCrew(){if(run)team=[...run.team];save();setup();}
 const live=()=>!!run&&run.status==='running'&&!paused&&countdown<=0;
 function start(){
  run=newRun(seed,team);paused=false;cruise=true;countdown=3;last=0;accumulator=0;uiClock=0;overlayState='';displayedCrew='';keys.clear();pointers.clear();warmPortraits();document.documentElement.classList.add('jc-focus');
  host.innerHTML=`<div class="jc jc-run"><div class="jc-runbar"><a href="#/" class="jc-exit">← Arcade</a><span class="eyebrow">JUNGLE CARAVAN · ${safe(seed)}</span><button id="jc-pause">Pause · P</button><button id="jc-restart">Restart</button><button id="jc-manifest">Crew manifest</button></div><div class="jc-hud" aria-label="Caravan status"><span>Speed <b id="jc-speed"></b><small id="jc-pace"></small></span><span>Hull <b id="jc-hull"></b><progress id="jc-hull-meter" max="100" value="100" aria-label="Hull remaining"></progress></span><span>Beast gap <b id="jc-gap"></b><progress id="jc-gap-meter" max="160" value="95" aria-label="Distance from beasts"></progress></span><span>River gate <b id="jc-distance"></b><progress id="jc-route-meter" max="2400" value="0" aria-label="Route completed"></progress></span></div><div class="jc-playfield"><div class="jc-stage"><canvas width="960" height="600" tabindex="0" aria-label="Three jungle lanes. Steer left or right, line up front shots, dodge obstacles and incoming fire."></canvas><div class="jc-overlay" id="jc-overlay" hidden></div><p id="jc-message" role="status" aria-live="polite"></p></div><aside class="jc-console"><div id="jc-guns"></div><p id="jc-firepower"></p><div id="jc-stations"></div><p class="jc-legend"><b>Steer to aim front shots.</b><br>Side gunner targets the roadside.<br>Red bullets = incoming fire.<br>Green supply crates repair hull.<br>Dashed box = locked target lane.<br>HIGH → Q · LOW → E</p></aside></div><div class="jc-controls"><div class="jc-driving"><button data-hold="a" aria-label="Steer left">← Left</button><button data-hold="d" aria-label="Steer right">Right →</button><button data-hold="w">Accelerate · W</button><button data-hold="s">Brake · S</button><button data-hold="q">High cover · Q</button><button data-hold="e">Low cover · E</button></div><div class="jc-actions"><button id="jc-cruise" aria-pressed="true">Cruise: on</button><button id="jc-burst"></button><button id="jc-swap"></button></div></div></div>`;
  button('jc-pause').onclick=()=>{togglePause();button('jc-pause').blur();};button('jc-restart').onclick=start;button('jc-manifest').onclick=returnToCrew;
  button('jc-burst').onclick=()=>{if(live())trigger(run!);button('jc-burst').blur();update();};button('jc-swap').onclick=()=>{if(live())swap(run!);button('jc-swap').blur();update();};
  button('jc-cruise').onclick=()=>{if(live())cruise=!cruise;button('jc-cruise').blur();update();};
  host.querySelectorAll<HTMLButtonElement>('[data-hold]').forEach(b=>{
   b.addEventListener('pointerdown',e=>{if(!live())return;e.preventDefault();b.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,b.dataset.hold!);if(b.dataset.hold==='a'||b.dataset.hold==='d')steerNow(b.dataset.hold==='a'?-1:1);});
   for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{pointers.delete((e as PointerEvent).pointerId);b.classList.remove('is-held');});
  });
  update();host.querySelector<HTMLCanvasElement>('canvas')!.focus({preventScroll:true});
 }
 function steerNow(direction:number){if(!run||!live())return;run.target=clamp(run.target+direction,-1,1);run.steerDirection=direction;run.steerRepeat=.32;}
 function togglePause(){if(!run||run.status!=='running')return;paused=!paused;keys.clear();pointers.clear();run.cover=null;last=0;accumulator=0;update();}
 function update(){
  if(!run)return;const s=run,active=new Set([...keys,...pointers.values()]),b=burstInfo(s.team[2]);
  el('jc-speed').textContent=`${Math.round(s.speed)} m/s`;el('jc-pace').textContent=s.mud>0?'Mud drag':s.cover?`${s.cover} cover · −15% pace`:cruise?'Cruise on · W to accelerate':'Coasting · hold W';
  el('jc-hull').textContent=`${Math.ceil(s.hull)} / ${Math.round(s.m.hull)}`;el('jc-gap').textContent=`${Math.ceil(s.gap)} m`;el('jc-distance').textContent=`${Math.min(finish,Math.floor(s.distance))} / ${finish} m`;
  (el('jc-hull-meter') as HTMLProgressElement).value=s.hull/s.m.hull*100;(el('jc-gap-meter') as HTMLProgressElement).value=s.gap;(el('jc-route-meter') as HTMLProgressElement).value=s.distance;
  el('jc-gap').classList.toggle('jc-danger',s.gap<35);el('jc-hull').classList.toggle('jc-danger',s.hull/s.m.hull<.3);
  if(el('jc-message').textContent!==s.message)el('jc-message').textContent=s.message;
  button('jc-pause').textContent=paused?'Resume · P':'Pause · P';button('jc-pause').disabled=s.status!=='running';
  button('jc-cruise').textContent=`Cruise: ${cruise?'on':'off'}`;button('jc-cruise').setAttribute('aria-pressed',String(cruise));button('jc-cruise').disabled=!live();
  button('jc-burst').textContent=`${b.name} · ${s.cooldown>0?Math.ceil(s.cooldown)+'s':'Space'}`;button('jc-burst').disabled=!live()||s.cooldown>0;
  button('jc-swap').textContent=`Swap gunners · ${s.swapCooldown>0?Math.ceil(s.swapCooldown)+'s':'X'}`;button('jc-swap').disabled=!live()||s.swapCooldown>0;
  host.querySelectorAll<HTMLButtonElement>('[data-hold]').forEach(b=>{b.disabled=!live();b.classList.toggle('is-held',active.has(b.dataset.hold!));b.setAttribute('aria-pressed',String(active.has(b.dataset.hold!)));});
  const signature=s.team.map(c=>c.id).join(',');if(signature!==displayedCrew){displayedCrew=signature;el('jc-guns').innerHTML=[s.m.front,s.m.side].map((w,i)=>`<div class="jc-gun">${art(s.team[i+4].id,s.team[i+4].name)}<div><small>${i?'SIDE':'FRONT'} · ${safe(s.team[i+4].name)}</small><strong>${w.dps.toFixed(1)} DPS</strong><span>${w.power.toFixed(1)} power · ${w.rate.toFixed(2)}/s</span></div></div>`).join('');
  el('jc-stations').innerHTML=s.team.slice(0,4).map((c,i)=>`<div>${art(c.id,c.name)}<span><small>${roles[i]}</small>${safe(c.name)}</span></div>`).join('');}
  el('jc-firepower').textContent=`${s.defeated} robbers stopped · ${s.intercepts} blocks · Supplies: ${s.supplies}`;
  const overlay=el('jc-overlay'),mode=s.status!=='running'?s.status:paused?'paused':countdown>0?'count-'+Math.ceil(countdown):'live';
  overlay.hidden=mode==='live';if(mode===overlayState)return;overlayState=mode;
  if(mode==='paused'){overlay.innerHTML='<h2>Expedition paused</h2><p>Take a breath. The jungle can wait.</p><button class="primary" id="jc-resume">Resume expedition</button>';button('jc-resume').onclick=()=>{togglePause();host.querySelector<HTMLCanvasElement>('canvas')!.focus();};}
  else if(countdown>0&&s.status==='running'){overlay.innerHTML=`<span class="eyebrow">READY YOUR CREW</span><h2 class="jc-countdown">${Math.ceil(countdown)}</h2><p>Cruise starts on. A / D steer.<br>Gunners fire automatically.<br>Q high cover · E low cover</p>`;}
  else if(s.status!=='running'){overlay.innerHTML=`<h2>${s.status==='won'?'River gate reached!':'Expedition over'}</h2><p>${safe(s.message)}</p><p>${Math.min(finish,Math.floor(s.distance))} m · ${s.hits} impacts · ${s.defeated} robbers stopped · Supplies: ${s.supplies} · ${(s.ticks/60).toFixed(1)} s</p><button class="primary" id="jc-replay">Replay same route</button><button id="jc-rebuild">Reassign crew</button>`;button('jc-replay').onclick=start;button('jc-rebuild').onclick=returnToCrew;}
 }
 function onKey(e:KeyboardEvent){
  const names:Record<string,string>={arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d',escape:'p'},key=names[e.key.toLowerCase()]??e.key.toLowerCase();
  if(e.type==='keyup'){keys.delete(key);return;}
  if(!run||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)||!['w','a','s','d','q','e',' ','x','p'].includes(key))return;
  if((e.target as HTMLElement)?.tagName==='BUTTON'&&key===' ')return;e.preventDefault();
  if(key==='p'&&!e.repeat){togglePause();return;}if(!live())return;
  if(!e.repeat){if(key===' ')trigger(run);if(key==='x')swap(run);if(key==='a'||key==='d')steerNow(key==='a'?-1:1);}
  keys.add(key);
 }
 function blur(){keys.clear();pointers.clear();if(run?.status==='running'&&!paused)togglePause();}
 function visibility(){if(document.hidden)blur();}
 function animate(now:number){
  if(disposed)return;frame=requestAnimationFrame(animate);if(!run){last=0;return;}
  const elapsed=last?Math.min((now-last)/1000,.1):0;last=now;
  if(!paused&&run.status==='running'){
   if(countdown>0){countdown=Math.max(0,countdown-elapsed);accumulator=0;}
   else{accumulator+=elapsed;const active=new Set([...keys,...pointers.values()]);const input:Input={throttle:active.has('w'),cruise,brake:active.has('s'),steer:Number(active.has('d'))-Number(active.has('a')),cover:active.has('q')?'high':active.has('e')?'low':null};while(accumulator>=1/60){tick(run,input);accumulator-=1/60;}}
  }
  const canvas=host.querySelector('canvas');if(canvas&&canvas.clientWidth>0){const w=canvas.clientWidth<550?640:960,h=Math.round(w*canvas.clientHeight/canvas.clientWidth);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;}const ctx=canvas?.getContext('2d');if(ctx)draw(ctx,run,reducedMotion,portraits);
  uiClock+=elapsed;if(uiClock>=.1||run.status!=='running'){uiClock=0;update();}
 }
 window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);setup();frame=requestAnimationFrame(animate);
 return ()=>{disposed=true;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);document.documentElement.classList.remove('jc-focus');keys.clear();pointers.clear();};
}};
export default game;
