'use strict';

const $=id=>document.getElementById(id),canvas=$('game');

let view;

try{view=new Arena3D.View(canvas);}catch(error){$('overlay').querySelector('h2').textContent='3D graphics could not start';$('overlay').querySelector('p').textContent='This game needs WebGL 2. Update your graphics driver and restart.';throw error;}

const {species,moves,typeChart}=Arena3D.battleCatalog;for(const [name,m]of Object.entries(moves))m.name=name;

const colors={Electric:'#ffe76f',Fire:'#ff9761',Water:'#8de5ff',Grass:'#bcf28d',Normal:'#f0eee1',Ghost:'#b78bff',Poison:'#de86ee',Psychic:'#ff8fd2',Fighting:'#ffad77',Steel:'#b7e5ef',Flying:'#c2e1ff',Dark:'#b6a0d5',Ice:'#a6efff',Rock:'#c8af86',Ground:'#dbb47c',Bug:'#c9eb8d',Dragon:'#b5a0fa'};

let selected='Pikachu',p,b,shots=[],sparks=[],zones=[],texts=[],running=false,paused=false,demo=false,time=0,dodgeCD=0,bossCD=2.2,toastTime=0,last=0,phase=1,demoClock=0,shotId=0,inspectResume=false;

// Exhibition squads use the locally modeled roster, not historical game lineups.
const trainerCatalog=[
 {id:'brock',name:'Brock',title:'Pewter Gym Leader',badge:'Boulder',style:'Rock-solid pressure',team:['Golem','Rhydon','Aerodactyl']},
 {id:'misty',name:'Misty',title:'Cerulean Gym Leader',badge:'Cascade',style:'Water control',team:['Vaporeon','Lapras','Blastoise']},
 {id:'surge',name:'Lt. Surge',title:'Vermilion Gym Leader',badge:'Thunder',style:'Fast electric offense',team:['Pikachu','Electabuzz','Raichu']},
 {id:'erika',name:'Erika',title:'Celadon Gym Leader',badge:'Rainbow',style:'Grass sustain',team:['Bulbasaur','Venusaur']},
 {id:'koga',name:'Koga',title:'Fuchsia Gym Leader',badge:'Soul',style:'Poison and ambushes',team:['Gengar','Nidoqueen','Nidoking']},
 {id:'sabrina',name:'Sabrina',title:'Saffron Gym Leader',badge:'Marsh',style:'Psychic precision',team:['Alakazam','Gengar']},
 {id:'blaine',name:'Blaine',title:'Cinnabar Gym Leader',badge:'Volcano',style:'Relentless fire',team:['Ninetales','Rapidash','Arcanine']},
 {id:'giovanni',name:'Giovanni',title:'Viridian Gym Leader',badge:'Earth',style:'Heavy ground attacks',team:['Nidoqueen','Nidoking','Rhydon']},
 {id:'bug',name:'Bug Catcher',title:'Forest Trainer',style:'Fast close-range attacks',team:['Scyther','Pinsir']},
 {id:'hiker',name:'Hiker',title:'Mountain Trainer',style:'Bulky rock defenses',team:['Golem','Rhydon']},
 {id:'lass',name:'Lass',title:'Route Trainer',style:'Agile skirmishers',team:['Eevee','Ninetales']},
 {id:'swimmer',name:'Swimmer',title:'Coastal Trainer',style:'Water volleys',team:['Squirtle','Vaporeon','Gyarados']},
 {id:'blackbelt',name:'Black Belt',title:'Dojo Trainer',style:'Physical pressure',team:['Machamp','Pinsir','Snorlax']},
 {id:'ace',name:'Ace Trainer',title:'Elite Exhibition',style:'Mixed-type coverage',team:['Jolteon','Lapras','Dragonite']},
 {id:'rival',name:'Rival',title:'Starter Showdown',style:'Three fully evolved starters',team:['Venusaur','Charizard','Blastoise']}
];
let arenaMode='teams',squad=['Pikachu','Charizard','Blastoise'],editMember=0,trainerId='brock',teamMatch=null,teamTransition=null,teamLoading=false,matchSerial=0;
const earnedBadges=new Set();
function chosenTrainer(){return trainerCatalog.find(t=>t.id===trainerId)||trainerCatalog[0];}
function teamInterface(){
 $('battleMode').value=arenaMode;$('editMemberPanel').hidden=arenaMode!=='teams';$('editPokemon').innerHTML=squad.map((n,i)=>`<option value="${i}">${i+1}. ${n}</option>`).join('');$('editPokemon').value=String(editMember);$('editPokemon').disabled=running||teamLoading;$('teamPanel').hidden=arenaMode!=='teams';$('trainerPanel').hidden=arenaMode!=='teams';$('bossPanel').hidden=arenaMode==='teams';
 for(let i=0;i<6;i++){$('teamSlot'+i).innerHTML=(i?'<option value="">Empty slot</option>':'')+Object.keys(species).filter(n=>!species[n].bossOnly).map(n=>`<option value="${n}">${n}</option>`).join('');$('teamSlot'+i).value=squad[i]||'';$('teamSlot'+i).disabled=running||teamLoading;}
 const trainer=chosenTrainer();$('trainer').value=trainer.id;$('trainer').disabled=running||teamLoading;$('battleMode').disabled=running||teamLoading;
 $('trainerInfo').textContent=trainer.title+' - '+trainer.style;
 $('trainerTeam').textContent=trainer.team.join(' → ');
 $('badgeCase').textContent='Gym badges this session: '+(earnedBadges.size?Array.from(earnedBadges).join(' · '):'0 / 8');
 $('teamSummary').textContent=arenaMode==='teams'?(teamMatch?teamMatch.party.map((n,i)=>n+(i<teamMatch.playerIndex||(i===teamMatch.playerIndex&&p?.hp<=0)?' ✕':i===teamMatch.playerIndex?' ●':' ○')).join('  '):squad.join(' → ')):'Single boss exhibition';
 $('opponentSummary').textContent=arenaMode==='teams'?(teamMatch?teamMatch.opponents.map((n,i)=>n+(i<teamMatch.bossIndex||(i===teamMatch.bossIndex&&b?.hp<=0)?' ✕':i===teamMatch.bossIndex?' ●':' ○')).join('  '):trainer.name+': '+trainer.team.join(' → ')):'One Pokémon on each side';
}
function changeTeamSlot(index,name){if(running||teamLoading)return;const previous=squad[index];const other=squad.indexOf(name);if(other>=0&&other!==index)squad[other]=previous||'';squad[index]=name;squad=squad.filter(Boolean);editMember=Math.min(index,squad.length-1);selected=squad[editMember];loadout();}
function updateTeamSummary(){if(arenaMode!=='teams')return;
 $('teamSummary').textContent=teamMatch.party.map((n,i)=>n+(i<teamMatch.playerIndex||(i===teamMatch.playerIndex&&p?.hp<=0)?' ✕':i===teamMatch.playerIndex?' ●':' ○')).join('  ');
 $('opponentSummary').textContent=chosenTrainer().name+': '+teamMatch.opponents.map((n,i)=>n+(i<teamMatch.bossIndex||(i===teamMatch.bossIndex&&b?.hp<=0)?' ✕':i===teamMatch.bossIndex?' ●':' ○')).join('  ');
}
function resetExchange(){shots=[];zones=[];sparks=[];texts=[];playerFields=[];playerPulses=[];playerCast=null;castLock=0;dodgeCD=Math.max(0,dodgeCD);bossCD=2.2;phase=b.hp<b.max*.25?3:b.hp<b.max*.5?2:1;p.vx=p.vy=p.moveX=p.moveY=b.vx=b.vy=b.moveX=b.moveY=0;p.x=310;p.y=390;b.x=815;b.y=370;b.dash=null;b.windup=0;b.recovery=0;view.reset?.();}
function completeTeamSwitch(){
 const t=teamTransition;if(!t)return;const serial=matchSerial;
 if(t.playerDown)teamMatch.playerIndex++;if(t.bossDown)teamMatch.bossIndex++;
 const playerName=teamMatch.party[teamMatch.playerIndex],bossName=teamMatch.opponents[teamMatch.bossIndex];
 function apply(){if(serial!==matchSerial)return;teamLoading=false;
  if(t.playerDown){selected=playerName;editMember=teamMatch.playerIndex;equipped=[...(savedKits[selected]||species[selected].kit)];p=entity(selected,310,390);dodgeCD=0;}
  if(t.bossDown){$('boss').value=bossName;b=entity(bossName,815,370,true);}
  teamTransition=null;resetExchange();refreshFighter();$('editPokemon').value=String(editMember);matchup();hud();updateTeamSummary();$('overlay').style.display='none';$('state').textContent=paused?'SIMULATION PAUSED':'TEAM BATTLE IN PROGRESS';notify((t.playerDown?playerName:chosenTrainer().name+' sends out '+bossName)+' enters the arena');
 }
 if(view.prepare){teamLoading=true;$('state').textContent='PREPARING NEXT POKÉMON';view.prepare([playerName,bossName]).then(apply).catch(error=>{if(serial!==matchSerial)return;teamLoading=false;running=false;teamTransition=null;teamInterface();showOverlay('Could not prepare the next Pokémon',error.message+'<br>Start again to retry.');});}else apply();
}

const arenaScale=Math.sqrt(3);

const bounds={x:550-492*arenaScale,y:377-255*arenaScale,w:984*arenaScale,h:510*arenaScale};

function effectiveness(type,types){return types.reduce((n,t)=>n*(typeChart[type]?.[t]??1),1);}

function entity(name,x,y,boss=false){const s=species[name],st=s.stats;return{name,...s,x,y,dx:1,dy:0,vx:0,vy:0,moveX:0,moveY:0,hp:(st[0]+75)*(boss&&arenaMode==='boss'?3:1),max:(st[0]+75)*(boss&&arenaMode==='boss'?3:1),cooldowns:[0,0,0,0],guard:0,guardMax:1,haste:0,root:0,burn:0,burnTick:1,marks:{},combo:0,comboUntil:0,stun:0,inv:0,slow:0,poison:0,poisonTick:1,attackSerial:0,r:boss?34:22,boss,speed:160+st[5]*1.25,attackCount:0};}

function setup(){view.reset?.();p=entity(selected,310,390);b=entity($('boss').value,815,370,true);shots=[];sparks=[];zones=[];texts=[];time=0;castLock=0;playerCast=null;playerPulses=[];playerFields=[];dodgeCD=0;bossCD=2.2;phase=1;demoClock=0;$('pause').textContent='Ⅱ';hud();}

function roster(){

 $('roster').innerHTML='';

 for(const [name,s]of Object.entries(species).filter(([,s])=>!s.bossOnly)){const el=document.createElement('button');el.textContent=name;el.style.setProperty?.('--fighter',s.color);el.title=name+' · '+s.role;el.setAttribute('aria-label',name);el.setAttribute('aria-pressed',String(name===selected));el.className=name===selected?'active':'';el.onclick=()=>{if(running||teamLoading)return;if(arenaMode==='teams')changeTeamSlot(editMember,name);else{selected=name;loadout();}};$('roster').append(el);}

}

let modelRequest=0;

function prepareBattleModels(){if(!view.prepare)return;const request=++modelRequest;const needed=[...new Set([selected,arenaMode==='teams'?squad[0]:selected,$('boss').value])];if(needed.every(n=>view.assets.has(n))){for(const id of ['start','demo','overlayStart'])$(id).disabled=false;return;}for(const id of ['start','demo','overlayStart'])$(id).disabled=true;showOverlay('Preparing your opponent…','Loading its local model and animation rig.');view.ready=view.prepare(needed).then(()=>{if(request!==modelRequest)return;for(const id of ['start','demo','overlayStart'])$(id).disabled=false;showOverlay(arenaMode==='teams'?'Challenge '+chosenTrainer().name+'?':'Ready for '+$('boss').value+'?',arenaMode==='teams'?'Elimination match. The next teammate enters after a knockout.':species[$('boss').value].description);}).catch(error=>{if(request===modelRequest)showOverlay('Model could not load',error.message);});}

const moveKeys=['1','2','3','4'];

const savedKits={};

let equipped=[],castLock=0,playerCast=null,playerPulses=[],playerFields=[];

function refreshFighter(){roster();const s=species[selected];equipped=[...(savedKits[selected]||s.kit)];$('fighterName').textContent=selected;$('type').textContent=s.type.join(' / ').toUpperCase();$('fighterStyle').textContent=s.role+' · '+s.description;$('stats').innerHTML=s.stats.map((v,i)=>`<div>${['HP','ATTACK','DEFENSE','SP. ATK','SP. DEF','SPEED'][i]}<b>${v}</b></div>`).join('');

 for(let slot=0;slot<4;slot++){$('move'+slot).innerHTML=s.kit.map(n=>`<option>${n}</option>`).join('');$('move'+slot).value=equipped[slot];}

}
function loadout(){if(view.inspection)closeModelView();matchSerial++;running=false;paused=false;demo=false;teamLoading=false;teamTransition=null;teamMatch=null;if(arenaMode==='teams')$('boss').value=chosenTrainer().team[0];refreshFighter();teamInterface();
 setup();matchup();showOverlay('Choose the matchup. Watch it unfold.',species[selected].role+'<br>Movement, dodging, and all four moves are automatic.');$('state').textContent='READY WHEN YOU ARE';$('bossStyle').textContent=species[$('boss').value].description+' Patterns: '+species[$('boss').value].bossProfile.patterns.join(' · ');prepareBattleModels();}

function matchup(){

 const types=species[$('boss').value].type;

 $('matchup').textContent=equipped.map((n,i)=>moveKeys[i]+': '+n+' '+(moves[n].kind==='heal'?'HEAL':effectiveness(moves[n].type,types)+'×')).join(' · ');

 for(let i=0;i<4;i++){const m=moves[equipped[i]];$('moveHint'+i).textContent=m.description+' · '+m.cooldown+'s cooldown';$('abilityName'+i).textContent=equipped[i];$('ability'+i).style.setProperty?.('--ability-color',colors[m.type]||'#eee');}

}

function rearrangeMove(slot,name){if(running){$('move'+slot).value=equipped[slot];return;}const previous=equipped[slot],other=equipped.indexOf(name);equipped[slot]=name;if(other>=0&&other!==slot){equipped[other]=previous;$('move'+other).value=previous;}savedKits[selected]=[...equipped];matchup();hud();}

function start(auto=true){
 if(teamLoading)return;if(view.inspection)closeModelView();
 const lead=arenaMode==='teams'?squad[0]:selected,opponent=arenaMode==='teams'?chosenTrainer().team[0]:$('boss').value;
 if(view.assets&&(!view.assets.has(lead)||!view.assets.has(opponent))){
  const serial=++matchSerial;running=false;teamLoading=true;teamTransition=null;teamInterface();$('state').textContent='PREPARING MATCH';
  view.prepare([lead,opponent]).then(()=>{if(serial!==matchSerial)return;teamLoading=false;start(auto);}).catch(error=>{if(serial!==matchSerial)return;teamLoading=false;teamInterface();showOverlay('Could not prepare this matchup',error.message);});return;
 }
 matchSerial++;teamTransition=null;teamLoading=false;
 if(arenaMode==='teams'){selected=lead;editMember=0;$('boss').value=opponent;teamMatch={party:[...squad],opponents:[...chosenTrainer().team],playerIndex:0,bossIndex:0};refreshFighter();}
 demo=auto;setup();running=true;paused=false;teamInterface();$('overlay').style.display='none';$('state').textContent=arenaMode==='teams'?'TEAM BATTLE IN PROGRESS':'AUTO BATTLE IN PROGRESS';notify(selected+' is choosing its moves - enjoy the battle');
}


function showOverlay(title,desc){$('overlay').style.display='flex';$('overlay').querySelector('h2').textContent=title;$('overlay').querySelector('p').innerHTML=desc;$('overlayStart').textContent='Start auto battle';}

function notify(text){$('toast').textContent=text;toastTime=3;}

function hud(){if(!p)return;$('playerLabel').textContent=p.name.toUpperCase();$('bossLabel').innerHTML=b.name.toUpperCase()+' <b>'+(arenaMode==='teams'?chosenTrainer().name.toUpperCase():'BOSS')+'</b>';$('playerHP').textContent=`${Math.ceil(p.hp)} / ${p.max} HP`;$('bossHP').textContent=`${Math.ceil(b.hp)} / ${b.max} HP`;$('playerBar').style.width=p.hp/p.max*100+'%';$('bossBar').style.width=b.hp/b.max*100+'%';$('guardBar').style.width=(p.guard>0?p.guard/p.guardMax*100:0)+'%';

 $('statusText').textContent=(playerCast?'CASTING '+playerCast.name+' · ':'')+'DODGE '+(dodgeCD>0?dodgeCD.toFixed(1)+'s':'READY')+(p.guard>0?' · GUARDED':'')+(p.haste>0?' · HASTE':'')+(p.slow>0?' · SLOWED':'')+(p.root>0?' · ROOTED':'')+(p.poison>0?' · POISONED':'')+(p.burn>0?' · BURNING':'')+(p.combo>0&&p.comboUntil>=time?' · COMBO '+p.combo:'');

 $('phase').textContent='PHASE '+phase+' · '+(b.dash?'DASHING':b.moveState||b.role.toUpperCase())+(b.slow>0?' · SLOWED':'')+(b.poison>0?' · POISONED':'')+(b.burn>0?' · BURNING':'')+(b.root>0?' · ROOTED':'')+Object.entries(b.marks).filter(([,m])=>m.expires>=time).map(([name,m])=>' · '+name.toUpperCase()+' '+m.stacks).join('');

 for(let i=0;i<4;i++){const m=moves[equipped[i]],cd=p.cooldowns[i]||0,casting=playerCast?.slot===i;$('abilityState'+i).textContent=casting?'CASTING':cd>0?cd.toFixed(1)+'s':!running?'READY':p.stun>0?'STAGGERED':'READY';$('ability'+i).style.setProperty?.('--cooldown',Math.max(0,Math.min(100,cd/m.cooldown*100))+'%');$('ability'+i).setAttribute('aria-label',moveKeys[i]+': '+equipped[i]+(cd>0?', cooldown '+cd.toFixed(1)+' seconds':', ready'));$('ability'+i).setAttribute('role','status');$('move'+i).disabled=running;}

}

// Keyboard movement offers eight directions; assist only within the facing cone.

function playerAim(m){

 const facing=Math.atan2(p.dy,p.dx),distance=Math.hypot(b.x-p.x,b.y-p.y);

 if(m.kind==='melee'||m.kind==='radial'||m.kind==='heal'||!m.speed||distance>Math.min(850,m.speed*(m.life||1.25)))return {dx:p.dx,dy:p.dy};

 const direct=Math.atan2(b.y-p.y,b.x-p.x),difference=Math.atan2(Math.sin(direct-facing),Math.cos(direct-facing));

 if(Math.abs(difference)>Math.PI/6)return {dx:p.dx,dy:p.dy};

 const travel=Math.min(.65,distance/m.speed),leadX=(b.moveX||0)*travel,leadY=(b.moveY||0)*travel;

 const predicted=Math.atan2(b.y+leadY-p.y,b.x+leadX-p.x),delta=Math.atan2(Math.sin(predicted-facing),Math.cos(predicted-facing));

 const angle=facing+Math.max(-Math.PI/6,Math.min(Math.PI/6,delta));

 return {dx:Math.cos(angle),dy:Math.sin(angle)};

}

function castAbility(slot){

 if(!running||paused||view.inspection||p.stun>0||slot<0||slot>3||p.cooldowns[slot]>0||castLock>0||playerCast)return false;

 const name=equipped[slot],m=moves[name],aim=playerAim(m);p.cooldowns[slot]=m.cooldown;castLock=.1;

 if(m.windup){playerCast={name,slot,move:m,t:m.windup,total:m.windup,dx:aim.dx,dy:aim.dy};p.attackSerial++;p.attackCharged=true;}

 else releaseAbility(name,slot,m,aim.dx,aim.dy);

 return true;

}

function releaseAbility(name,slot,m,dx,dy){

 const oldDx=p.dx,oldDy=p.dy;p.dx=dx;p.dy=dy;emitMove(p,m,slot>=2||m.power>=75);p.dx=oldDx;p.dy=oldDy;

 if(m.pulses)for(let i=1;i<m.pulses;i++)playerPulses.push({name,slot,m,dx,dy,t:i*m.pulseInterval});

}

function updatePlayerAbilities(dt){

 castLock=Math.max(0,castLock-dt);p.cooldowns=p.cooldowns.map(c=>Math.max(0,c-dt));

 if(playerCast){if(p.stun>.08){p.cooldowns[playerCast.slot]=Math.min(p.cooldowns[playerCast.slot],Math.max(1.5,moves[playerCast.name].cooldown*.35));notify(playerCast.name+' interrupted!');playerCast=null;}else{playerCast.t-=dt;if(playerCast.t<=0){const cast=playerCast;playerCast=null;releaseAbility(cast.name,cast.slot,cast.move,cast.dx,cast.dy);}}}

 for(const pulse of playerPulses){pulse.t-=dt;if(pulse.t<=0&&p.stun<=0){const dx=p.dx,dy=p.dy;p.dx=pulse.dx;p.dy=pulse.dy;emitMove(p,pulse.m,true);p.dx=dx;p.dy=dy;}}

 playerPulses=playerPulses.filter(pulse=>pulse.t>0);

}

function addPlayerField(shot){if(shot.owner!==p||!shot.m.field||shot.fieldSpawned)return;shot.fieldSpawned=true;const f=shot.m.field;playerFields.push({x:shot.x,y:shot.y,r:f.r,remaining:f.duration,total:f.duration,tick:.4,m:{...f,field:undefined,kind:undefined},owner:p});burst(shot.x,shot.y,colors[f.type]||'#fff',18);}

function updatePlayerFields(dt){for(const f of playerFields){f.remaining-=dt;f.tick-=dt;if(f.tick<=0&&f.remaining>0){f.tick=.65;if(Math.hypot(b.x-f.x,b.y-f.y)<=f.r+b.r){const a=Math.atan2(b.y-f.y,b.x-f.x);hit(b,{owner:p,m:f.m,charged:false,damageScale:1,dx:Math.cos(a),dy:Math.sin(a)});}}}playerFields=playerFields.filter(f=>f.remaining>0);}

function emitMove(owner,m,charged){

 owner.attackSerial++;owner.attackCharged=charged;

 if(m.cleanse){owner.poison=0;owner.burn=0;owner.slow=0;owner.root=0;}

 if(m.guard){owner.guard=m.guard;owner.guardMax=m.guard;}

 if(m.haste)owner.haste=m.haste;

 if(m.blink){burst(owner.x,owner.y,colors[m.type]||'#fff',16);owner.x=Math.max(bounds.x+owner.r,Math.min(bounds.x+bounds.w-owner.r,owner.x+owner.dx*m.blink));owner.y=Math.max(bounds.y+owner.r,Math.min(bounds.y+bounds.h-owner.r,owner.y+owner.dy*m.blink));burst(owner.x,owner.y,colors[m.type]||'#fff',16);}

 if(m.evade)owner.inv=Math.max(owner.inv,m.evade);

 if(m.backstep){owner.vx-=owner.dx*m.backstep;owner.vy-=owner.dy*m.backstep;}

 const target=owner===p?b:p;

 if(m.kind==='heal'){

  const restored=Math.min(owner.max-owner.hp,owner.max*m.heal);owner.hp+=restored;owner.stun=Math.max(owner.stun,m.recovery||.25);texts.push({x:owner.x,y:owner.y-38,text:'+'+Math.round(restored)+' HP',c:'#b9ffb5',life:1});burst(owner.x,owner.y,'#aaf0aa',24);return;

 }

 if(m.dash){owner.vx+=owner.dx*m.dash;owner.vy+=owner.dy*m.dash;}

 const count=m.count||1;

 for(let i=0;i<count;i++){

  const angle=Math.atan2(owner.dy,owner.dx)+(m.radialBurst?i*Math.PI*2/count:m.spread?(i-(count-1)/2)*m.spread:0);

  const melee=m.kind==='melee'||m.kind==='radial';

  shots.push({id:++shotId,x:owner.x+(melee?0:owner.dx*30),y:owner.y+(melee?0:owner.dy*30),dx:Math.cos(angle),dy:Math.sin(angle),speed:melee?0:m.speed||500,r:m.size||(charged?14:7),life:melee?.17:(m.life||(charged?1.8:1.25)),maxLife:m.life||(charged?1.8:1.25),m,owner,charged,delay:(m.interval||0)*i,age:0,damageScale:(m.perProjectile?1:1/count)/(m.pulses||1),hits:new Set(),target});

 }

 burst(owner.x+owner.dx*30,owner.y+owner.dy*30,colors[m.type]||'#fff',7);

}

function dodge(){if(dodgeCD>0||p.stun>0)return;p.inv=.3;p.vx=p.dx*740;p.vy=p.dy*740;dodgeCD=2.4;burst(p.x,p.y,'#efffbc',12);}

function burst(x,y,c,n){view.impact?.(x,y,c,n);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*130;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c,life:.25+Math.random()*.35});}}

function hit(target,shot){

 if(target.inv>0||target.hp<=0)return 0;

 const a=shot.owner,m=shot.m,mult=effectiveness(m.type,target.type),stab=a.type.includes(m.type)?1.5:1,atk=a.stats[m.physical?1:3]+20,def=target.stats[m.physical?2:4]+20;

 let damage=((22*m.power*atk/def)/50+2)*stab*mult*(a.boss&&arenaMode==='boss'?.48:.7)*(shot.damageScale??1);

 if(shot.charged&&m.name==='Electro Ball')damage*=Math.min(1.5,Math.max(.65,a.stats[5]/target.stats[5]));

 if(mult===0){texts.push({x:target.x,y:target.y-38,text:'IMMUNE',c:'#d3c5e7',life:1});return 0;}

 if(target.guard>0)damage*=.55;

 const status=target.poison>0||target.burn>0||target.slow>0||target.root>0;

 const exploit=(m.exploit==='status'&&status)||(m.exploit==='burn'&&target.burn>0)||(m.exploit==='slow'&&(target.slow>0||target.root>0))||(m.exploit==='recovery'&&target.recovery>0)||(m.exploit==='haste'&&a.haste>0);

 if(exploit)damage*=m.exploit==='burn'||m.exploit==='recovery'?1.35:m.exploit==='status'?1.3:m.exploit==='haste'?1.2:1.25;

 if(m.detonate){const mark=target.marks[m.detonate];if(mark&&mark.expires>=time){damage*=1+mark.stacks*(m.detonate==='static'?.22:.18);delete target.marks[m.detonate];texts.push({x:target.x,y:target.y-64,text:'MARK BURST',c:colors[m.type],life:1});}}

 if(a===p){if(a.comboUntil<time)a.combo=0;if(m.combo)damage*=1+a.combo*.1;if(m.consumeCombo){damage*=1+a.combo*.15;a.combo=0;}}

 damage=Math.min(target.hp,Math.max(0,damage));target.hp-=damage;

 if(m.mark){const previous=target.marks[m.mark];target.marks[m.mark]={stacks:Math.min(3,(previous&&previous.expires>=time?previous.stacks:0)+1),expires:time+4.5};}

 if(a===p&&m.combo){a.combo++;a.comboUntil=time+2;if(a.combo>=3){a.combo=0;target.stun=Math.max(target.stun,.3);texts.push({x:target.x,y:target.y-64,text:'3-HIT COMBO',c:'#ffd49e',life:1});}}

 if(m.interrupt&&target===b&&(b.windup>0||b.dash)&&!(b.interruptCD>0)){zones=zones.filter(z=>z.owner!==b||z.event==='mine');b.dash=null;b.windup=0;b.recovery=1;b.interruptCD=7;bossCD=Math.max(bossCD,1.5);texts.push({x:b.x,y:b.y-64,text:'INTERRUPTED',c:'#ffe9b0',life:1});}



 let dx=shot.dx,dy=shot.dy;if(m.kind==='radial'){const d=Math.hypot(target.x-a.x,target.y-a.y)||1;dx=(target.x-a.x)/d;dy=(target.y-a.y)/d;}

 const impulse=Math.min(420,Math.max(35,(shot.charged?360:100)*Math.sqrt(a.weight/target.weight)*(m.knockback||1)));

 target.vx+=dx*impulse;target.vy+=dy*impulse;target.stun=Math.max(target.stun,m.stun??(shot.charged?.22:.045));

 if(target===p)target.inv=.3;

 if(m.slow)target.slow=Math.max(target.slow,m.slow);

 if(m.poison&&!target.type.includes('Poison')&&!target.type.includes('Steel')){if(target.poison<=0)target.poisonTick=1;target.poison=Math.max(target.poison,m.poison);}

 if(m.burn&&!target.type.includes('Fire')){if(target.burn<=0)target.burnTick=1;target.burn=Math.max(target.burn,m.burn);}

 if(m.root)target.root=Math.max(target.root,m.root);

 if(m.drain){const heal=Math.min(a.max-a.hp,damage*m.drain);a.hp+=heal;}

 if(m.recoil)a.hp=Math.max(0,a.hp-damage*m.recoil);

 burst(target.x,target.y,colors[m.type]||'#fff',16);texts.push({x:target.x,y:target.y-38,text:`−${Math.round(damage)}${mult>1?' SUPER!':mult<1?' RESIST':''}`,c:mult>1?'#fff2a0':'#ffffff',life:1});

 if(b.hp<=0||p.hp<=0)finish(b.hp<=0);return damage;

}

function finish(win){
 if(arenaMode==='teams'&&teamMatch){
  if(teamTransition||teamLoading)return;
  const playerDown=p.hp<=0,bossDown=b.hp<=0;
  const playerOut=playerDown&&teamMatch.playerIndex+1>=teamMatch.party.length,bossOut=bossDown&&teamMatch.bossIndex+1>=teamMatch.opponents.length;
  if(!playerOut&&!bossOut){teamTransition={remaining:1.8,playerDown,bossDown};shots=[];zones=[];playerFields=[];playerPulses=[];playerCast=null;$('state').textContent='KNOCKOUT - NEXT POKÉMON';notify((bossDown?b.name:p.name)+' fainted. A teammate is entering.');hud();return;}
  running=false;const draw=playerOut&&bossOut;win=bossOut&&!playerOut;
  if(win&&chosenTrainer().badge)earnedBadges.add(chosenTrainer().badge);
  $('state').textContent=draw?'TEAM MATCH DRAW':win?'TRAINER DEFEATED':'YOUR TEAM FAINTED';
  showOverlay(draw?'Both teams are out.':win?'You defeated '+chosenTrainer().name+'!':chosenTrainer().name+' wins.',(win&&chosenTrainer().badge?chosenTrainer().badge+' Badge earned!<br>':'')+'Team match finished in '+time.toFixed(1)+' seconds.');
  teamInterface();hud();$('overlayStart').textContent='Rematch';return;
 }
 running=false;teamInterface();$('state').textContent=win?'FIELD TRIAL COMPLETE':'FIELD TRIAL ENDED';showOverlay(win?'Victory in the Verdant Ring.':'Down, but not out.',`${win?'Boss defeated':'Your Pokémon fainted'} in ${time.toFixed(1)} seconds.`);$('overlayStart').textContent='Battle again';
}
// Boss movement and attack scheduling. All decisions use simulation time, so pause

// freezes movement, queued attacks, telegraphs, and recovery together.

function bossPoint(x,y){return{x:Math.max(bounds.x+75,Math.min(bounds.x+bounds.w-75,x)),y:Math.max(bounds.y+75,Math.min(bounds.y+bounds.h-75,y))};}

function bossZone(kind,options={}){

 const z={kind,owner:b,type:b.bossProfile.type||b.type[0],x:b.x,y:b.y,a:Math.atan2(p.y-b.y,p.x-b.x),r:110,t:.8,total:.8,delay:0,...options};

 z.total=z.t;zones.push(z);return z;

}

function bossShot(extra={}){

 const type=b.bossProfile.type||b.type[0];

 return{type,power:phase===3?52:phase===2?48:44,speed:phase>=2?510:430,size:11,life:3,perProjectile:true,...extra};

}

function bossAttack(){

 const profile=b.bossProfile;b.attackCount++;

 const pattern=profile.patterns[(b.attackCount-1)%profile.patterns.length];

 b.patternHistory??=[];b.patternHistory.push(pattern);b.pattern=pattern;b.windup=.75;b.recovery=0;

 b.attackSerial++;b.attackCharged=true;

 const a=Math.atan2(p.y-b.y,p.x-b.x),windup=phase>=2?.64:.85;

 bossCD=phase===3?2.65:phase===2?3.05:3.7;

 const color=colors[profile.type]||'#fff';

 if(b.ai==='tank'&&b.hp<b.max*.45&&b.attackCount%5===0&&(b.heals||0)<2&&b.charged.includes('Rest')){

  b.heals=(b.heals||0)+1;emitMove(b,moves.Rest,true);notify(b.name+' is recovering — close in!');return;

 }

 switch(pattern){

 case 'charge':{

  const length=Math.min(680,Math.max(280,Math.hypot(p.x-b.x,p.y-b.y)+70));

  bossZone('volley',{event:'dash',lane:true,width:100,length,a,t:windup,follow:true,duration:.55,dashSpeed:length/.55,m:bossShot({power:75,physical:true})});break;}

 case 'strafe':{

  b.strafeBoost=2;const sides=phase>=2?5:3;

  for(let i=0;i<sides;i++)bossZone('volley',{event:'shot',follow:true,a:a+(i-(sides-1)/2)*.22,t:windup,delay:i*.15,m:bossShot({speed:550})});break;}

 case 'fan':bossZone('volley',{event:'shot',follow:true,a,t:windup,m:bossShot({count:phase>=2?7:5,spread:.19})});break;

 case 'tracking':{

  // Aim at a predicted point once. The warning is locked before the shot fires.

  const lead=.35,aim=Math.atan2(p.y+p.moveY*lead-b.y,p.x+p.moveX*lead-b.x);

  for(let i=0;i<(phase>=2?4:3);i++)bossZone('volley',{event:'shot',follow:true,a:aim+(i%2?.12:-.12),lane:true,width:70,length:1050,t:windup,delay:i*.22,m:bossShot({speed:820,power:60,pierce:true,visual:'beam',life:2})});break;}

 case 'sweep':{

  const count=phase>=2?7:5;

  for(let i=0;i<count;i++)bossZone('volley',{event:'shot',follow:true,a:a-.65+i*1.3/(count-1),t:windup,delay:i*.16,m:bossShot({speed:650,visual:'beam'})});break;}

 case 'crossfire':{

  for(let i=0;i<4;i++){

   const side=i%2?1:-1,point=bossPoint(p.x+side*(260+(i>1?100:0)),p.y+(i>1?200:-200));

   bossZone('volley',{event:'crossfire',x:point.x,y:point.y,a:Math.atan2(p.y-point.y,p.x-point.x),lane:true,width:80,length:850,t:windup+.15,delay:i*.2,m:bossShot({speed:620,power:55})});

  }break;}

 case 'ring':{

  for(let i=0;i<(phase>=2?3:2);i++)bossZone('blast',{event:'ring',r:115,t:windup,delay:i*.38,a:a+i*.22,m:bossShot({count:phase>=2?14:10,radialBurst:true,speed:phase>=2?380:320})});break;}

 case 'spiral':{

  const count=phase>=2?10:7;for(let i=0;i<count;i++)bossZone('volley',{event:'shot',a:a+(i-count/2)*.34,follow:true,t:windup,delay:i*.12,m:bossShot({speed:400,size:13})});break;}

 case 'rain':{

  const count=phase>=2?6:4;for(let i=0;i<count;i++){

   const offset=(i-(count-1)/2)*90,point=bossPoint(p.x+p.moveX*.3+Math.cos(a+Math.PI/2)*offset,p.y+p.moveY*.3+Math.sin(a+Math.PI/2)*offset);

   bossZone('blast',{event:'blast',x:point.x,y:point.y,r:80,t:windup+.2,delay:i*.22,m:bossShot({power:65,slow:b.bossProfile.type==='Ice'?2:0})});

  }break;}

 case 'mines':{

  for(let i=0;i<(phase>=2?5:3);i++){

   const angle=a+i*Math.PI*2/(phase>=2?5:3),point=bossPoint(p.x+Math.cos(angle)*135,p.y+Math.sin(angle)*135);

   bossZone('blast',{event:'mine',x:point.x,y:point.y,r:78,t:1.2,delay:i*.12,m:bossShot({power:45,slow:2})});

  }break;}

 case 'blink':{

  const angle=a+(b.attackCount%2?1:-1)*Math.PI*.75,point=bossPoint(p.x+Math.cos(angle)*280,p.y+Math.sin(angle)*280);

  bossZone('blast',{event:'blink',x:point.x,y:point.y,r:80,t:.8,m:bossShot({power:35})});break;}

 case 'combo':{

  const reach=150;

  for(let i=0;i<3;i++)bossZone('volley',{event:'combo',a,follow:true,lane:true,width:140,length:reach,t:windup,delay:i*.25,m:bossShot({kind:'melee',reach,power:55,physical:true,dash:i===0?400:0})});break;}

 case 'stomp':{

  for(let i=0;i<(phase>=2?3:2);i++)bossZone('blast',{event:'blast',r:130+i*75,t:windup,delay:i*.4,follow:true,m:bossShot({power:60,physical:true,stun:.3})});break;}

 }

 b.windup=windup;

 notify(b.name+' · '+pattern.toUpperCase()+' — watch the warning shapes!');

}

function moveBoss(dt){

 const profile=b.bossProfile;

 b.evadeCD=Math.max(0,(b.evadeCD||0)-dt);b.windup=Math.max(0,(b.windup||0)-dt);b.recovery=Math.max(0,(b.recovery||0)-dt);b.strafeBoost=Math.max(0,(b.strafeBoost||0)-dt);

 if(b.dash){

  b.dash.t-=dt;

  if(b.stun<=0&&b.root<=0){b.x+=b.dash.dx*b.dash.speed*dt;b.y+=b.dash.dy*b.dash.speed*dt;}

  if(b.dash.t<=0){b.dash=null;b.recovery=.65;}

  return;

 }

 const a=Math.atan2(p.y-b.y,p.x-b.x),distance=Math.hypot(p.x-b.x,p.y-b.y);b.dx=Math.cos(a);b.dy=Math.sin(a);

 if(b.stun>0||b.root>0){b.moveX=b.moveY=0;return;}

 if(b.evadeCD<=0&&b.windup<=0&&b.recovery<=0&&profile.evade>0){

  const incoming=shots.find(s=>s.owner===p&&s.delay<=0&&s.m.kind!=='melee'&&Math.hypot(s.x-b.x,s.y-b.y)<170&&((b.x-s.x)*s.dx+(b.y-s.y)*s.dy)>0);

  if(incoming){

   const sign=b.attackCount%2?1:-1;b.vx+=-Math.sin(a)*sign*460*profile.evade;b.vy+=Math.cos(a)*sign*460*profile.evade;

   b.evadeCD=3.4+(1-profile.evade)*3;burst(b.x,b.y,colors[b.type[0]]||'#fff',12);

  }

 }

 const interval=1.6,mode=Math.floor(time/interval+b.id*.1)%4,dir=(Math.floor(time/5+b.id)%2?1:-1);

 const radial=Math.max(-1,Math.min(1,(distance-profile.range)/120));

 const orbit=(b.ai==='brawler'?.22:mode===1?1:mode===3?-.8:.58)*dir;

 let mx=Math.cos(a)*radial-Math.sin(a)*orbit,my=Math.sin(a)*radial+Math.cos(a)*orbit;

 // Push off arena edges so circling cannot get stuck against a wall.

 const margin=110;if(b.x<bounds.x+margin)mx+=1.7;if(b.x>bounds.x+bounds.w-margin)mx-=1.7;if(b.y<bounds.y+margin)my+=1.7;if(b.y>bounds.y+bounds.h-margin)my-=1.7;

 const norm=Math.max(1,Math.hypot(mx,my)),speed=b.speed*profile.speed*(phase>=2?1.12:1)*(b.slow>0?.58:1)*(b.windup>0?.22:b.recovery>0?.35:b.strafeBoost>0?1.25:1);

 const movingSpeed=profile.recoveryStop&&b.recovery>0?0:speed;b.moveX=mx/norm*movingSpeed;b.moveY=my/norm*movingSpeed;b.x+=b.moveX*dt;b.y+=b.moveY*dt;b.moveState=b.windup>0?'WINDUP':b.recovery>0?'RECOVERING':radial>.7?'PURSUING':radial<-.7?'RETREATING':'CIRCLING';

}

function resolveBossZone(z){

 const owner=z.owner||b,m=z.m||bossShot();

 owner.recovery=Math.max(owner.recovery||0,.38);

 switch(z.event){

 case 'dash':owner.dash={dx:Math.cos(z.a),dy:Math.sin(z.a),speed:z.dashSpeed,t:z.duration,m,hits:new Set()};owner.dx=owner.dash.dx;owner.dy=owner.dash.dy;break;

 case 'blink':{

  burst(owner.x,owner.y,colors[z.type]||'#fff',24);owner.x=z.x;owner.y=z.y;owner.vx=owner.vy=owner.moveX=owner.moveY=0;owner.recovery=Math.max(owner.recovery,owner.bossProfile.blinkRecovery||.38);if(owner.bossProfile.blinkRecovery)notify(owner.name+' reappeared - recovery opening');burst(owner.x,owner.y,colors[z.type]||'#fff',24);

  const angle=Math.atan2(p.y-owner.y,p.x-owner.x);owner.dx=Math.cos(angle);owner.dy=Math.sin(angle);

  // A fresh telegraph after appearing makes the follow-up dodgeable.

  bossZone('volley',{event:'shot',follow:true,a:angle,t:.55,m:bossShot({count:3,spread:.2,homing:.6})});break;}

 case 'crossfire':{

  // Fire from the marked point, but keep the real boss as the damage owner.

  const first=shots.length;const oldX=owner.x,oldY=owner.y,oldDx=owner.dx,oldDy=owner.dy;owner.x=z.x;owner.y=z.y;owner.dx=Math.cos(z.a);owner.dy=Math.sin(z.a);emitMove(owner,m,true);owner.x=oldX;owner.y=oldY;owner.dx=oldDx;owner.dy=oldDy;

  for(let i=first;i<shots.length;i++)shots[i].originEffect=true;break;}

 case 'ring':case 'shot':case 'combo':owner.dx=Math.cos(z.a);owner.dy=Math.sin(z.a);emitMove(owner,m,true);break;

 case 'blast':case 'mine':default:

  burst(z.x,z.y,colors[z.type]||'#fff',42);

  if(Math.hypot(p.x-z.x,p.y-z.y)<=z.r+p.r){const a=Math.atan2(p.y-z.y,p.x-z.x);hit(p,{owner,m,dx:Math.cos(a),dy:Math.sin(a),charged:true});}

 }

}



function autoPilot(dt){

 demoClock+=dt;

 const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||1,ax=dx/d,ay=dy/d;

 p.dx=ax;p.dy=ay;

 const viable=equipped.map(n=>moves[n]).filter(m=>m.kind!=='heal'&&effectiveness(m.type,b.type)>0);const meleeCount=viable.filter(m=>m.kind==='melee'||m.kind==='radial').length;const closeRange=meleeCount>=2||!viable.some(m=>m.kind!=='melee'&&m.kind!=='radial');

 const desired=closeRange?80:310,radial=Math.max(-1,Math.min(1,(d-desired)/100));

 const orbit=(closeRange?.18:.55)*(Math.floor(time/5)%2?1:-1);

 let mx=ax*radial-ay*orbit,my=ay*radial+ax*orbit;

 const threat=zones.find(z=>z.delay<=0&&z.t<.5&&(z.kind==='blast'?Math.hypot(z.x-p.x,z.y-p.y)<z.r+p.r+35:z.lane&&((p.x-z.x)*Math.cos(z.a)+(p.y-z.y)*Math.sin(z.a))>0&&((p.x-z.x)*Math.cos(z.a)+(p.y-z.y)*Math.sin(z.a))<(z.length||600)+p.r&&Math.abs(-(p.x-z.x)*Math.sin(z.a)+(p.y-z.y)*Math.cos(z.a))<(z.width||80)/2+p.r));

 const incoming=shots.find(s=>s.owner===b&&s.delay<=0&&!s.m.kind&&Math.hypot(s.x-p.x,s.y-p.y)<130&&((p.x-s.x)*s.dx+(p.y-s.y)*s.dy)>0);

 if(threat||incoming){

  if(threat?.kind==='blast'){mx=p.x-threat.x||1;my=p.y-threat.y||1;}else{const a=threat?.a??Math.atan2(incoming.dy,incoming.dx);mx=-Math.sin(a);my=Math.cos(a);}

  const n=Math.hypot(mx,my)||1;p.dx=mx/n;p.dy=my/n;dodge();p.dx=ax;p.dy=ay;

 }

 const margin=90;if(p.x<bounds.x+margin)mx+=1.5;if(p.x>bounds.x+bounds.w-margin)mx-=1.5;if(p.y<bounds.y+margin)my+=1.5;if(p.y>bounds.y+bounds.h-margin)my-=1.5;

 const choices=equipped.map((name,slot)=>{const m=moves[name];let score=0;

  if(p.cooldowns[slot]>0)return {slot,score:-1};

  if(m.kind==='heal')score=p.hp/p.max<.55?100:-1;

  else if(m.kind==='melee'||m.kind==='radial')score=d<=(m.reach||100)+b.r+(m.dash?75:0)+(m.blink||0)?40+(m.power||0)*.2:-1;

  else if(d<Math.min(850,(m.speed||500)*(m.life||1.25)))score=20+(m.power||0)*.12;

  else score=-1;

  if(m.kind!=='heal'){const multiplier=effectiveness(m.type,b.type);if(multiplier===0)score=-1;else if(score>0)score+=(Math.min(2,multiplier)-1)*15;}
  if(score>0&&m.detonate){const mark=b.marks[m.detonate];score+=mark&&mark.expires>=time?mark.stacks*20:-15;}

  if(score>0&&m.mark)score+=15;

  if(score>0&&b.recovery>0&&m.windup)score+=15;

  return {slot,score};

 }).sort((a,b)=>b.score-a.score);

 if(choices[0]?.score>0)castAbility(choices[0].slot);

 return {mx,my};

}



function update(dt){

 if(!running||paused||teamLoading)return;if(teamTransition){time+=dt;teamTransition.remaining-=dt;if(teamTransition.remaining<=0)completeTeamSwitch();return;}time+=dt;updatePlayerAbilities(dt);if(teamTransition||!running)return;dodgeCD-=dt;bossCD-=dt;toastTime-=dt;if(toastTime<=0)$('toast').textContent='';

 const nextPhase=b.hp<b.max*.25?3:b.hp<b.max*.5?2:1;if(nextPhase>phase){phase=nextPhase;notify(b.name+' · PHASE '+phase+' — faster, denser patterns!');}

 for(const e of [p,b]){

  e.slow=Math.max(0,e.slow-dt);e.root=Math.max(0,e.root-dt);e.guard=Math.max(0,e.guard-dt);e.haste=Math.max(0,e.haste-dt);e.interruptCD=Math.max(0,(e.interruptCD||0)-dt);

  if(e.burn>0){e.burnTick-=dt;if(e.burnTick<=0){e.burn--;e.burnTick=1;const damage=Math.min(e.hp,Math.min(8,e.max*.012));e.hp-=damage;texts.push({x:e.x,y:e.y-38,text:'−'+Math.round(damage)+' BURN',c:'#ffb086',life:1});if(e.hp<=0){finish(e===b);return;}}}

  if(e.poison>0){e.poisonTick-=dt;if(e.poisonTick<=0){e.poison--;e.poisonTick=1;const dmg=Math.min(e.hp,Math.min(12,e.max*.018));e.hp-=dmg;texts.push({x:e.x,y:e.y-38,text:'−'+Math.round(dmg)+' POISON',c:'#df9cef',life:1});if(e.hp<=0){finish(e===b);return;}}}

 }

 let mx=0,my=0;

 if(demo){const decision=autoPilot(dt);mx=decision.mx;my=decision.my;}

 const length=Math.hypot(mx,my);if(length){mx/=length;my/=length;if(!demo){p.dx=mx;p.dy=my;}}

 const speed=p.speed*(p.root>0?0:p.slow>0?.58:1)*(p.haste>0?1.25:1)*(playerCast?.7:1),accel=1-Math.exp(-14*dt);p.moveX+=(mx*speed-p.moveX)*accel;p.moveY+=(my*speed-p.moveY)*accel;if(p.root>0){p.moveX=0;p.moveY=0;}if(p.stun<=0){p.x+=p.moveX*dt;p.y+=p.moveY*dt;}

 moveBoss(dt);

 if(bossCD<=0&&b.stun<=0)bossAttack();

 for(const e of [p,b]){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-9*dt);e.vy*=Math.exp(-9*dt);e.stun=Math.max(0,e.stun-dt);e.inv=Math.max(0,e.inv-dt);e.x=Math.max(bounds.x+e.r,Math.min(bounds.x+bounds.w-e.r,e.x));e.y=Math.max(bounds.y+e.r,Math.min(bounds.y+bounds.h-e.r,e.y));}

 const overlap=p.r+b.r-Math.hypot(p.x-b.x,p.y-b.y);if(overlap>0){p.x-=b.dx*overlap;p.y-=b.dy*overlap;if(!b.dash?.hits.has(p)){hit(p,{owner:b,m:b.dash?.m||{type:'Normal',power:25,physical:true},dx:b.dx,dy:b.dy});b.dash?.hits.add(p);}}

 for(const z of [...zones]){if(z.delay>0){z.delay-=dt;continue;}if(z.follow){z.x=z.owner.x;z.y=z.owner.y;}z.t-=dt;if(z.t<=0)resolveBossZone(z);}

 zones=zones.filter(z=>z.t>0);

 for(const s of shots){
  if(teamTransition||!running)break;

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

 for(const shot of shots)if(shot.life<=0&&!(shot.delay>0))addPlayerField(shot);updatePlayerFields(dt);

 shots=shots.filter(s=>s.life>0&&s.x>bounds.x-24&&s.x<bounds.x+bounds.w+24&&s.y>bounds.y-24&&s.y<bounds.y+bounds.h+24);hud();

}

function draw(dt){if(!paused){for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;}for(const t of texts){t.life-=dt;t.y-=25*dt;}}sparks=sparks.filter(s=>s.life>0);texts=texts.filter(t=>t.life>0);view.render({p,b,shots,zones,sparks,texts,playerFields,playerCast,time,running,paused},dt);}

let tacticalCamera=false;$('camera').onclick=()=>{tacticalCamera=!tacticalCamera;view.setCamera(tacticalCamera);document.activeElement.blur();};

function frame(t){const dt=Math.min((t-last)/1000,.035);last=t;update(dt);draw(dt);requestAnimationFrame(frame);}

function pause(){if(!running||view.inspection)return;paused=!paused;$('state').textContent=paused?'SIMULATION PAUSED':'AUTO BATTLE IN PROGRESS';$('pause').textContent=paused?'▶':'Ⅱ';if(paused)notify('Simulation paused');}

function closeModelView(){view.closeInspection?.();$('modelControls').hidden=true;canvas.parentElement.classList.remove('inspecting');if(inspectResume&&running&&paused)pause();inspectResume=false;}

window.addEventListener('blur',()=>{if(running&&!paused)pause();});

$('start').onclick=()=>{start();document.activeElement.blur();};$('overlayStart').onclick=()=>{start();document.activeElement.blur();};$('demo').onclick=()=>{if(arenaMode==='teams'){squad=['Pikachu','Charizard','Blastoise'];editMember=0;}selected='Pikachu';loadout();start(true);document.activeElement.blur();};$('pause').onclick=()=>{pause();document.activeElement.blur();};$('boss').onchange=loadout;for(let i=0;i<4;i++){$('move'+i).onchange=()=>rearrangeMove(i,$('move'+i).value);}

$('inspect').onclick=()=>{if(!view.assets?.size)return;if(view.inspection){closeModelView();return;}inspectResume=running&&!paused;if(inspectResume)pause();$('inspectSpecies').value=selected;view.inspect(selected,$('inspectAnimation').value);$('modelControls').hidden=false;canvas.parentElement.classList.add('inspecting');document.activeElement.blur();};$('closeInspect').onclick=closeModelView;for(const id of ['inspectSpecies','inspectAnimation'])$(id).onchange=()=>{const result=view.inspect($('inspectSpecies').value,$('inspectAnimation').value);if(result?.then){notify('Loading local model…');result.then(()=>notify('Model ready'));}};

let dragX=null;canvas.addEventListener?.('pointerdown',e=>{if(view.inspection){dragX=e.clientX;canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener?.('pointermove',e=>{if(dragX!==null&&view.inspection){view.inspection.angle+=(e.clientX-dragX)*.012;dragX=e.clientX;}});canvas.addEventListener?.('pointerup',()=>dragX=null);canvas.addEventListener?.('pointercancel',()=>dragX=null);canvas.addEventListener?.('wheel',e=>{if(view.inspection){e.preventDefault();view.inspection.zoom=Math.max(.7,Math.min(1.7,view.inspection.zoom+e.deltaY*.001));}},{passive:false});

$('editPokemon').onchange=()=>{if(running||teamLoading)return;editMember=Number($('editPokemon').value);selected=squad[editMember];loadout();};
$('trainer').innerHTML=trainerCatalog.map(t=>`<option value="${t.id}">${t.name} - ${t.title}</option>`).join('');$('trainer').onchange=()=>{trainerId=$('trainer').value;loadout();};$('battleMode').onchange=()=>{arenaMode=$('battleMode').value;loadout();};for(let i=0;i<6;i++)$('teamSlot'+i).onchange=()=>changeTeamSlot(i,$('teamSlot'+i).value);
$('boss').innerHTML=Object.keys(species).map(name=>`<option value="${name}">${name}${species[name].bossOnly?' ★':''} · ${species[name].type.join(' / ')}</option>`).join('');$('boss').value='Blastoise';$('inspectSpecies').innerHTML=Object.keys(species).map(name=>`<option>${name}</option>`).join('');loadout();requestAnimationFrame(frame);

window.arenaSnapshot=()=>({running,paused,demo,time,player:{name:p.name,x:p.x,y:p.y,hp:p.hp,cooldowns:[...p.cooldowns],moves:[...equipped],dx:p.dx,dy:p.dy},boss:{name:b.name,hp:b.hp},projectiles:shots.length,roster:Object.values(species).filter(s=>!s.bossOnly).length,bosses:Object.keys(species).length,pattern:b.pattern||null,mode:arenaMode,team:teamMatch?{...teamMatch,transition:!!teamTransition,loading:teamLoading,trainer:chosenTrainer().name}:null});



