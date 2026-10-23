const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements={},listeners={};
function el(id){return elements[id]??=({style:{setProperty(){}},value:id==='boss'?'Blastoise':'',textContent:'',tagName:'DIV',append(){},setAttribute(){},blur(){},querySelector(s){return el(id+s)},set innerHTML(v){this.html=v;const m=v.match(/<option>(.*?)<\/option>/);if(m)this.value=m[1]},get innerHTML(){return this.html||''}})}
const sandbox={Arena3D:{battleCatalog:JSON.parse(fs.readFileSync('src/roster.json','utf8')),View:class{render(){}setCamera(){}}},console,Math,document:{getElementById:el,createElement:()=>el(Math.random()),activeElement:{tagName:'BODY'}},window:{addEventListener:(n,cb)=>listeners[n]=cb},requestAnimationFrame(){}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('game.js','utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);
function begin(name='Pikachu',boss='Blastoise'){run(`selected=${JSON.stringify(name)};$('boss').value=${JSON.stringify(boss)};loadout();start();bossCD=999;b.bossProfile={...b.bossProfile,speed:0,evade:0};p.x=400;p.y=370;p.dx=1;p.dy=0;b.x=620;b.y=370;`)}
const step=(n=1)=>run(`for(let i=0;i<${n}&&running;i++)update(1/60)`);
begin();run('keys.KeyD=true');step(30);assert(run('p.x>500'),'WASD movement');run('keys.KeyD=false');
begin();assert(run('castAbility(0)'),'Cast quick move');assert.strictEqual(run('shots[0].dx'),1,'Directional projectile');assert(!run('castAbility(0)'),'Cooldown prevents repeat');assert(run('p.cooldowns[0]>0&&p.cooldowns.slice(1).every(c=>c===0)'),'Cooldowns are independent');step(8);assert(run('castAbility(1)'),'Different slot works while first cools down');
begin();for(const code of ['KeyJ','KeyK','KeyL','Semicolon'])listeners.keydown({code,repeat:false,preventDefault(){}});step(25);assert(run('p.cooldowns.every(c=>c>0)'),'Four right-hand keys activate four distinct slots');assert(run('playerCast?.name')==='Thunderbolt','Fourth move has a visible windup');
begin();listeners.keydown({code:'KeyJ',repeat:false,preventDefault(){}});listeners.keydown({code:'KeyJ',repeat:true,preventDefault(){}});step(180);assert(run('p.attackSerial')===1,'Holding a key does not auto-repeat');
begin();run('castAbility(2)');assert(run('shots.length>0'),'Heavy move works immediately with no energy requirement');assert(!run("'energy' in p"),'Energy gate removed');
begin();run('castAbility(3)');assert(run('shots.length===0&&playerCast'),'Windup delays the shot');run('p.dx=0;p.dy=1');step(25);assert(run('shots.length>0&&shots[0].dx===1&&shots[0].dy===0'),'Heavy shot locks aim at key press');
begin();run('castAbility(3);p.stun=.3');step();assert(run('!playerCast&&p.cooldowns[3]<=3'),'Stagger interrupts windup with partial cooldown refund');
begin();run('castAbility(0);pause()');const frozen=run('[time,p.cooldowns[0]]');step(60);assert.deepStrictEqual(run('[time,p.cooldowns[0]]'),frozen,'Pause freezes cooldowns');run('pause()');step(50);assert(run('p.cooldowns[0]===0'),'Cooldown becomes ready');
begin();run('castAbility(1)');assert(run('p.inv>0&&p.haste>0&&p.vx>0'),'Quick Attack gives movement, evade and haste');
begin('Squirtle');run('castAbility(1)');const guardHp=run('p.hp');run("hit(p,{owner:b,m:{type:'Normal',power:60},dx:1,dy:0})");const guarded=guardHp-run('p.hp');run('p.guard=0;p.inv=0;p.hp=p.max');const rawHp=run('p.hp');run("hit(p,{owner:b,m:{type:'Normal',power:60},dx:1,dy:0})");assert(Math.abs(guarded/(rawHp-run('p.hp'))-.55)<1e-9,'Guard reduces actual incoming damage by 45%');
begin();const base=run("hit(b,{owner:p,m:moves['Electro Ball'],charged:true,dx:1,dy:0})");begin();run("for(let i=0;i<3;i++)hit(b,{owner:p,m:moves['Thunder Shock'],dx:1,dy:0})");const burst=run("hit(b,{owner:p,m:moves['Electro Ball'],charged:true,dx:1,dy:0})");assert(burst>base*1.5,'Static builds and boosts detonation');assert(run('!b.marks.static'),'Detonation consumes marks');
begin('Gengar');const hex=run("hit(b,{owner:p,m:moves.Hex,dx:1,dy:0})");begin('Gengar');run('b.poison=3');assert(run("hit(b,{owner:p,m:moves.Hex,dx:1,dy:0})")>hex*1.25,'Hex rewards status setup');
begin('Alakazam');run("p.hp=30;p.poison=3;p.burn=3;p.slow=2;p.root=1;castAbility(3)");assert(run('p.hp>30&&p.poison===0&&p.burn===0&&p.slow===0&&p.root===0&&p.guard>0'),'Recover heals, cleanses and guards');
begin('Machamp');run("for(let i=0;i<3;i++)hit(b,{owner:p,m:moves['Bullet Punch'],dx:1,dy:0})");assert(run('p.combo===0&&b.stun>=.3'),'Third combo hit staggers');
begin();run('bossCD=0;bossAttack()');assert(run('zones.length>0'),'Boss attack telegraphs');run("hit(b,{owner:p,m:moves.Thunderbolt,charged:true,dx:1,dy:0})");assert(run('b.windup===0&&b.recovery>0&&b.interruptCD>0'),'Timed attack interrupts a boss windup');
begin('Bulbasaur');run('castAbility(1);b.x=500');step();assert(run('b.root>0'),'Vines root targets');
begin('Gengar');run('b.x=510;castAbility(2)');step(45);assert(run('playerFields.length>0&&b.poison>0'),'Sludge leaves a damaging poison field');
begin('Charmander');run('castAbility(2)');step(35);assert(run('p.attackSerial')===3,'Flamethrower emits three timed waves');
begin('Eevee');run('castAbility(0)');assert(run('shots.length===3&&shots[2].delay>0'),'Swift is a staggered burst');
begin('Snorlax');run('p.hp=50;castAbility(3)');assert(run('p.hp>50&&p.stun>.8&&p.cooldowns[3]===20'),'Rest trades recovery time for a heal');
begin();run('running=false;rearrangeMove(0,equipped[1])');assert(run('new Set(equipped).size')===4,'Reassigning swaps slots instead of duplicating moves');assert(run('equipped[0]')==='Quick Attack','Slot layout can be changed');run('start()');assert(run('p.cooldowns.every(c=>c===0)'),'New battle resets all cooldowns');
for(const name of run('Object.keys(species).filter(n=>!species[n].bossOnly)')){
 for(let slot=0;slot<4;slot++){
  begin(name);run('b.x=490;p.hp=p.max*.5;castAbility('+slot+')');step(90);run('draw(1/60)');
  assert(run('Number.isFinite(p.hp)&&Number.isFinite(b.hp)'),`${name} slot ${slot}: valid combat math`);
  assert(run('equipped.length===4&&new Set(equipped).size===4'),`${name}: four unique moves`);
 }
}
assert(run("effectiveness('Normal',['Ghost'])")===0,'Ghost immunity');assert(run("effectiveness('Electric',['Ground'])")===0,'Ground immunity');
for(const name of run('Object.keys(species)')){
 begin('Pikachu',name);run('p.hp=p.max=999999;bossCD=0;b.bossProfile=species[b.name].bossProfile;');
 for(const health of [1,.4,.2]){run(`b.hp=b.max*${health};`);step(1200);}
 assert(run('phase===3&&b.patternHistory.length>=10'),name+': all boss phases still work');
 assert(run('new Set(b.patternHistory).size>=3'),name+': varied attacks');
 assert(run('b.x>=bounds.x+b.r&&b.x<=bounds.x+bounds.w-b.r'),name+': movement stays inside arena');
}
assert(Math.abs(run('bounds.w*bounds.h')/(984*510)-3)<1e-9,'Triple-area field preserved');
console.log('PASS: four right-hand move keys, one press per cast, independent cooldowns, windups, locked aim, interruptions, guard, cleanse, marks, combos, zones, all 48 equipped moves, and all 32 three-phase bosses');
begin();listeners.keydown({code:'KeyL',ctrlKey:true,repeat:false,preventDefault(){throw Error('Browser shortcut must not be prevented')}});step();assert(run('p.cooldowns.every(c=>c===0)&&attackRequests.length===0'),'Control/Command/Alt shortcuts do not cast moves');
console.log('PASS: browser modifier shortcuts stay available');

run('delete savedKits.Pikachu');
// Keyboard-only players must be able to punish Mewtwo without exact-angle aiming.
begin('Pikachu','Mewtwo');run('b.x=700;b.y=470;p.dx=1;p.dy=0;');
assert(run("playerAim(moves['Thunder Shock']).dy>0"),'Assist corrects a nearby forward angle');
run('p.dx=-1;p.dy=0');assert.strictEqual(run("playerAim(moves['Thunder Shock']).dx"),-1,'Assist never turns shots toward a boss behind the player');
run('p.dx=1');assert.strictEqual(run("playerAim(moves['Quick Attack']).dy"),0,'Melee keeps movement direction');
begin('Pikachu','Mewtwo');run('b.bossProfile=species.Mewtwo.bossProfile;p.hp=p.max=999999;bossCD=0;');
for(let i=0;i<1200&&run('running');i++){
 run('{const aim=Math.round(Math.atan2(b.y-p.y,b.x-p.x)/(Math.PI/4))*Math.PI/4;p.dx=Math.cos(aim);p.dy=Math.sin(aim);castAbility(0);}');step();
}
assert(run('b.hp<b.max-40'),'Eight-direction rapid attacks land repeatedly against active Mewtwo');
console.log('PASS: keyboard-only Pikachu hit Mewtwo for '+Math.round(run('b.max-b.hp'))+' damage');
begin('Pikachu','Mewtwo');run('b.bossProfile=species.Mewtwo.bossProfile;resolveBossZone({owner:b,event:"blink",x:650,y:430,type:"Psychic"});');
const landing=run('[b.x,b.y]');step(45);assert(run('b.x')===landing[0]&&run('b.y')===landing[1],'Mewtwo holds still during its post-teleport opening');
assert(run('b.inv===0'),'Teleport recovery never makes Mewtwo invulnerable');
