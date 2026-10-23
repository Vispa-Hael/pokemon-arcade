'use strict';
const {app, BrowserWindow, Menu, shell} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const smoke = process.argv.includes('--arena-smoke-test');
const localPage = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const reference = 'https://pokemondb.net/pokedex/pikachu';
let mainWindow;

function openReference(url) {
  if (url === reference) shell.openExternal(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 1060, minWidth: 1000, minHeight: 760,
    title: 'Pokémon Arena', backgroundColor: '#0e1615', show: false,
    autoHideMenuBar: true,
    webPreferences: {nodeIntegration: false, contextIsolation: true, sandbox: true}
  });
  const window = mainWindow;
  window.webContents.setWindowOpenHandler(({url}) => {
    openReference(url);
    return {action: 'deny'};
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== localPage) { event.preventDefault(); openReference(url); }
  });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.webContents.on('page-title-updated', event => event.preventDefault());
  window.once('ready-to-show', () => { if (!smoke) window.show(); });
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.loadFile(path.join(__dirname, '..', 'index.html'));
  if (smoke) window.webContents.once('did-finish-load', () => runSmoke(window));
}

async function runSmoke(window) {
  try {
    const report = await window.webContents.executeJavaScript(`(async () => {
      const check=(value,message)=>{if(!value)throw new Error(message)};
      await view.ready;
      check(typeof require==='undefined','Renderer must be sandboxed');
      check(Object.keys(species).length===32,'32 bosses required');
      check(Object.values(species).filter(s=>!s.bossOnly).length===12,'Playable roster must remain twelve');
      check(view.assets.size<=2,'Startup must load only initial fighters');
      start();bossCD=100;keys.KeyD=true;for(let i=0;i<30;i++)update(1/60);keys.KeyD=false;
      check(p.x>390,'Movement failed');castAbility(0);check(shots.length>0&&shots[0].dx===1,'Directional attack failed');
      check(p.cooldowns[0]>0&&p.cooldowns[2]===0,'Independent cooldowns failed');update(.12);castAbility(2);check(p.cooldowns[2]>0,'Third move must work without energy');pause();const frozen=time;update(.1);check(time===frozen,'Pause failed');pause();
      start(true);for(let i=0;i<3600&&running;i++){update(1/60);if(i%60===0)draw(1);}check(b.hp<b.max,'Sample failed to deal damage');
      const sample=arenaSnapshot(),validated=[];
      for(const name of Object.keys(species)){
        await view.prepare(['Pikachu',name]);const rig=view.assets.get(name);
        check(rig.bones>0&&rig.skinCount>0&&rig.textureCount>0,name+' missing textured skeleton');
        check(Number.isFinite(rig.scale)&&rig.scale>0,name+' invalid scale');
        for(const clip of ['idle','walk','run','attack'])check(rig.actions[clip],name+' missing '+clip);
        rig.mixer.stopAllAction();const action=rig.actions.run.reset().play(),duration=action.getClip().duration;
        rig.mixer.update(duration*.13);const bones=[];rig.root.traverse(o=>{if(o.isBone)bones.push({bone:o,q:o.quaternion.clone(),p:o.position.clone()})});
        rig.mixer.update(duration*.31);check(bones.some(o=>o.q.angleTo(o.bone.quaternion)>.0001||o.p.distanceTo(o.bone.position)>.0001),name+' skeletal run animation is static');rig.entity=null;
        selected='Pikachu';$('boss').value=name;loadout();start();bossAttack();update(1/60);draw(1/60);
        check(view.models.get('boss').name===name,name+' did not render');check(view.diagnostics().triangles>1000,'No geometry');
        validated.push(name);
      }
      check(view.assets.size<=8,'Model cache must stay bounded');
      for(const name of Object.keys(species).filter(n=>!species[n].bossOnly)){
        await view.prepare([name,'Blastoise']);selected=name;$('boss').value='Blastoise';loadout();start();bossCD=100;
        for(let slot=0;slot<4;slot++){
          setup();running=true;bossCD=100;p.x=400;p.y=370;p.dx=1;p.dy=0;b.x=505;b.y=370;
          check(castAbility(slot),name+' slot '+slot+' must be castable');
          for(let i=0;i<60;i++){update(1/60);if(i%10===0)draw(1/60);}
          check(Number.isFinite(p.hp)&&Number.isFinite(b.hp),name+' invalid combat values');
          check(p.cooldowns.length===4,name+' must have four cooldowns');
        }
      }
      await view.prepare(['Pikachu','Blastoise']);selected='Pikachu';$('boss').value='Blastoise';loadout();start();bossCD=100;
      for(const code of ['KeyJ','KeyK','KeyL','Semicolon'])window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code==='Semicolon'?';':code.slice(-1).toLowerCase(),bubbles:true}));
      for(let i=0;i<25;i++)update(1/60);
      check(p.cooldowns.every(c=>c>0),'Right-hand four-key input failed');
      for(const code of ['KeyJ','KeyK','KeyL','Semicolon'])window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
      await view.prepare(['Gengar']);selected='Gengar';$('boss').value='Gengar';loadout();start();draw(1/60);
      check(view.models.get('player').mesh!==view.models.get('boss').mesh,'Mirror models must be independent');
      await view.prepare(['Pikachu','Blastoise']);selected='Pikachu';$('boss').value='Blastoise';loadout();start();bossCD=100;keys.KeyD=true;
      for(let i=0;i<24;i++){update(1/60);draw(1/60);}check(view.models.get('player').rig.current==='run','Run transition failed');
      p.cooldowns[0]=0;castLock=0;castAbility(0);update(1/60);draw(1/60);check(view.models.get('player').rig.actions.strike.getEffectiveWeight()>0,'Attack animation failed');
      keys.KeyD=false;for(let i=0;i<90;i++){update(1/60);draw(1/60);}check(view.models.get('player').rig.current==='idle','Idle transition failed');
      pause();const mixerTime=view.models.get('player').rig.mixer.time;draw(.1);check(view.models.get('player').rig.mixer.time===mixerTime,'Animation pause failed');pause();
      $('inspect').onclick();check(paused&&view.inspection,'Studio must pause');await view.inspect('Mewtwo','idle');view.renderInspection(.04);$('closeInspect').onclick();check(!paused&&!view.inspection,'Studio exit failed');
      await view.prepare(['Pikachu','Mewtwo']);$('boss').value='Mewtwo';loadout();start();p.x=350;p.y=430;b.x=780;b.y=350;bossAttack();draw(1/60);
      return {ok:true,sample,validatedBosses:validated,rendering:view.diagnostics(),finalState:arenaSnapshot()};
    })()`);
    if (process.env.ARENA_CAPTURE) {
      window.showInactive();
      await window.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      await new Promise(resolve => setTimeout(resolve, 1200));
      const rect = await window.webContents.executeJavaScript("(() => { const r=document.querySelector('.field').getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}; })()");
      const image = await window.webContents.capturePage(rect);
      fs.writeFileSync(process.env.ARENA_CAPTURE, image.toPNG());
      if(process.env.ARENA_GALLERY){
        fs.mkdirSync(process.env.ARENA_GALLERY,{recursive:true});
        await window.webContents.executeJavaScript("$('inspect').onclick()");
        for(const name of ['Arcanine','Gyarados','Scyther','Mewtwo','Articuno','Dragonite']){
          await window.webContents.executeJavaScript('(async()=>{await view.inspect('+JSON.stringify(name)+',"idle");$("inspectSpecies").value='+JSON.stringify(name)+';view.renderInspection(.04)})()');
          await new Promise(resolve=>setTimeout(resolve,400));
          const closeup=await window.webContents.capturePage(rect);
          fs.writeFileSync(path.join(process.env.ARENA_GALLERY,name+'.png'),closeup.toPNG());
        }
      }
    }
    if (process.env.ARENA_SMOKE_REPORT) fs.writeFileSync(process.env.ARENA_SMOKE_REPORT, JSON.stringify(report,null,2));
    console.log('ARENA_DESKTOP_SMOKE ' + JSON.stringify(report));
    app.exit(0);
  } catch (error) {
    console.error('ARENA_DESKTOP_SMOKE_FAILED', error);
    app.exit(1);
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label: 'Game', submenu: [
      {label: 'Restart arena', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload()},
      {type: 'separator'}, {role: 'quit'}
    ]},
    {label: 'View', submenu: [{role: 'togglefullscreen', accelerator: 'F11'}, {role: 'resetZoom'}, {role: 'zoomIn'}, {role: 'zoomOut'}]},
    {label: 'Help', submenu: [{label: 'Base stat reference', click: () => openReference(reference)}]}
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
if (smoke) setTimeout(() => { console.error('Desktop smoke test timed out'); app.exit(1); }, 150000).unref();
