export {default as battleCatalog} from './roster.json';
import * as T from 'three';
import {loadCharacters,updateCharacter,rigDiagnostics,cloneCharacter} from './characters.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const ARENA_SCALE=Math.sqrt(3);
const mats=new Map();
const material=(color,opts={})=>{const key=color+JSON.stringify(opts);if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:.74,...opts}));return mats.get(key)};
const sphere=new T.SphereGeometry(1,24,16), box=new T.BoxGeometry(1,1,1);
function mesh(parent,geo,color,pos=[0,0,0],scale=[1,1,1],opts={}){const m=new T.Mesh(geo,material(color,opts));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const ball=(p,c,x,y,z,sx,sy,sz,opts={})=>mesh(p,sphere,c,[x,y,z],[sx,sy,sz],opts);
const block=(p,c,x,y,z,sx,sy,sz)=>mesh(p,box,c,[x,y,z],[sx,sy,sz]);
function rod(p,a,b,r,c,r2=r){let d=new T.Vector3(...b).sub(new T.Vector3(...a));let m=mesh(p,new T.CylinderGeometry(r2,r,d.length(),12),c);m.position.copy(new T.Vector3(...a).addScaledVector(d,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m}
function line(p,points,c,r=.025){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),24,r,6,false),c)}
function ring(p,r,t,c,y=0,opts={}){let m=mesh(p,new T.TorusGeometry(r,t,8,72),c,[0,y,0],[1,1,1],opts);m.rotation.x=-Math.PI/2;return m}
const group=p=>{let g=new T.Group();p.add(g);return g};
function seeded(){let s=87942;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function groundTexture(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),r=seeded();x.fillStyle='#9a9b68';x.fillRect(0,0,512,512);for(let i=0;i<18000;i++){x.fillStyle=['#787f50','#b8b47d','#8a925b','#c3ba89'][i%4];x.globalAlpha=.1+r()*.22;let s=1+r()*5;x.fillRect(r()*512,r()*512,s,s)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6*ARENA_SCALE,4*ARENA_SCALE);return t}
export class View{
constructor(canvas){this.canvas=canvas;this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.scene=new T.Scene();this.scene.background=new T.Color('#9abcb5');this.scene.fog=new T.Fog('#9abcb5',95,190);this.camera=new T.PerspectiveCamera(40,1,.1,280);this.camera.position.set(0,32,31);this.camera.lookAt(0,0,0);this.scene.add(new T.HemisphereLight('#e7f7ff','#536342',1.5));const sun=new T.DirectionalLight('#ffe5b5',2.3);sun.position.set(-14,24,12).multiplyScalar(ARENA_SCALE);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-44,right:44,top:40,bottom:-40,near:1,far:135});sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;this.scene.add(sun);const rim=new T.DirectionalLight('#a0d9ec',1.4);rim.position.set(15,9,-12);this.scene.add(rim);this.assets=new Map();this.pendingModels=new Map();this.ready=this.prepare(['Pikachu','Blastoise']);this.instances=new Map();this.models=new Map();this.projectiles=new Map();this.playerFieldViews=new Map();this.castRing=ring(this.scene,1.05,.04,'#ffffff',.1,{emissive:'#ffffff',emissiveIntensity:1.2});this.castRing.material=this.castRing.material.clone();this.castRing.visible=false;this.warnings=new Map();this.damage=new Map();this.clock=0;this.impacts=[];this.environment();this.mergeScenery();this.effects=new T.Group();this.scene.add(this.effects);this.target=ring(this.scene,.9,.024,'#d6fc8b',.08,{emissive:'#9adf52',emissiveIntensity:1.3});this.arrow=mesh(this.scene,new T.ConeGeometry(.11,.35,3),'#ecffb5');this.arrow.rotation.x=Math.PI/2;const pg=new T.BufferGeometry();this.particlePositions=new Float32Array(1800);this.particleColors=new Float32Array(1800);pg.setAttribute('position',new T.BufferAttribute(this.particlePositions,3));pg.setAttribute('color',new T.BufferAttribute(this.particleColors,3));this.particles=new T.Points(pg,new T.PointsMaterial({vertexColors:true,size:.12,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));this.scene.add(this.particles);this.temp=new T.Vector3();this.resize();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('toast').textContent='3D graphics paused — reload the app to restore the renderer.'});}
ensureCharacter(name){
 if(this.assets.has(name))return Promise.resolve(this.assets.get(name));
 if(!this.pendingModels.has(name))this.pendingModels.set(name,loadCharacters([name]).then(loaded=>{const rig=loaded.get(name);this.assets.set(name,rig);this.pendingModels.delete(name);return rig;}).catch(error=>{this.pendingModels.delete(name);throw error;}));
 return this.pendingModels.get(name);
}
prepare(names){this.requestedModels=names;return Promise.all([...new Set(names)].map(name=>this.ensureCharacter(name))).then(()=>{this.trimModels(names);return this.assets})}
trimModels(keep=[]){
 const protectedNames=new Set([...keep,...(this.requestedModels||[]),...[...this.models?.values()||[]].map(m=>m.name),this.inspection?.name]);
 for(const name of this.assets.keys()){if(this.assets.size<=8)break;if(protectedNames.has(name))continue;this.releaseModel(name);}
}
releaseModel(name){
 const rig=this.assets.get(name);if(!rig)return;
 rig.root.removeFromParent();const geometries=new Set(),materials=new Set(),textures=new Set();
 for(const [key,instance]of this.instances||[]){if(instance.name===name){instance.root.removeFromParent();instance.mixer.stopAllAction();this.instances.delete(key);}}
 rig.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}
 for(const texture of textures){texture.dispose();texture.source?.data?.close?.();}for(const geometry of geometries)geometry.dispose();rig.mixer.stopAllAction();this.assets.delete(name);
}
resize(){let w=this.canvas.clientWidth||1100,h=this.canvas.clientHeight||690;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.setCamera(this.tactical||false);this.camera.updateProjectionMatrix()}
environment(){const s=new T.Group(),r=seeded();s.scale.set(ARENA_SCALE,1,ARENA_SCALE);this.scene.add(s);mesh(s,new T.CylinderGeometry(24,26,2.5,80),'#647153',[0,-1.6,0],[1,1,.69]);const floor=mesh(s,new T.BoxGeometry(33.4,.35,18.4),'#aba778',[0,-.23,.25],[1,1,1],{map:groundTexture()});floor.receiveShadow=true;floor.castShadow=false;
for(let k=0;k<2;k++){let hw=16.8+k*.28,hz=9.25+k*.28;for(let side of [-1,1]){block(s,'#c8c49b',0,.005,side*hz+.25,hw*2,.055,.07);block(s,'#c8c49b',side*hw,.005,.25,.07,.055,hz*2)}}
ring(s,4.5,.045,'#d6d1a5',.015);ring(s,1.25,.055,'#ddd5ac',.02);block(s,'#d6d1a5',0,.013,.25,33.5,.035,.065);mesh(s,new T.CircleGeometry(1.2,48),'#919b69',[0,.016,0]).rotation.x=-Math.PI/2;
for(let side of [-1,1])for(let i=0;i<30;i++){let x=-17.4+i*1.2;let stone=block(s,i%3?'#7c8774':'#939c83',x,.26,side*10.1,1.12,.62,.75);stone.rotation.z=(r()-.5)*.07;ball(s,'#6c8555',x,.61,side*10.1,.45,.05,.3)}
for(let side of [-1,1])for(let i=0;i<17;i++)block(s,'#7c8774',side*17.8,.23,-9.4+i*1.17,.75,.6,1.1);
for(let i=0;i<44;i++){let a=r()*Math.PI*2,rad=21+r()*9,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.65;if(z>10&&Math.abs(x)<15)continue;let tree=group(s);tree.position.set(x,0,z);let h=2.7+r()*3.8;rod(tree,[0,-.3,0],[0,h*.75,0],.2,'#69523c',.13);for(let j=0;j<3;j++){let a=j*2.1;rod(tree,[0,h*.45,0],[Math.sin(a)*.8,h*.75,Math.cos(a)*.8],.08,'#69523c',.035)}if(i%3===0){for(let j=0;j<3;j++)mesh(tree,new T.ConeGeometry(1.5-j*.28,2.4,9),'#3e6e50',[0,h-1+j*.8,0])}else{for(let j=0;j<5;j++){let a=j*2.4;ball(tree,['#4d8057','#648d59','#73965d'][j%3],Math.sin(a)*.65,h+Math.cos(a)*.45,Math.cos(a)*.65,1.15,1.1,1.15)}}}
for(let i=0;i<130;i++){let x=(r()-.5)*47,z=(r()-.5)*32;if(Math.abs(x)<17.9&&Math.abs(z)<10.7)continue;let rad=.18+r()*.7;let rock=mesh(s,new T.DodecahedronGeometry(rad,0),i%3?'#808e7e':'#a2ab92',[x,rad*.4,z],[1,.7+r(),.8]);rock.rotation.set(r(),r(),r());if(i%4===0)ball(s,'#7f995b',x,.2,z,.8,.3,.7)}
// Ancient spectator terraces, stone pylons, and cloth banners.
for(let side of [-1,1]){for(let j=0;j<3;j++)block(s,'#7e8e7f',side*13.5,.35+j*.38,-13.3-j*.75,6.5,.7,1.2);for(let x of [side*8.6,side*18.7]){let pillar=group(s);pillar.position.set(x,0,-11.2);block(pillar,'#aab09a',0,.2,0,1.2,.4,1.2);mesh(pillar,new T.CylinderGeometry(.34,.46,3.5,8),'#a5ac96',[0,2,0]);block(pillar,'#bdc0a8',0,3.8,0,1,.28,1);ball(pillar,'#b8e4a4',0,4.13,0,.2,.23,.2,{emissive:'#77bc7a',emissiveIntensity:1})}let pole=side*11.4;rod(s,[pole,0,-11.2],[pole,5,-11.2],.055,'#6b604b');let banner=block(s,side<0?'#397b6f':'#c48555',pole+.58,3.9,-11.2,1.15,1.65,.035);block(s,'#e4cc8e',pole+.58,4.65,-11.17,1.15,.07,.04);ring(banner,.27,.035,'#f6dda4',0).rotation.x=0;}
for(let side of [-1,1])for(let z of [-7,6]){let x=side*18.5;block(s,'#8c957c',x,.6,z,.7,1.2,.7);mesh(s,new T.ConeGeometry(.42,.45,6),'#bac5a1',[x,1.4,z]);ball(s,'#ffda7d',x,1.75,z,.2,.32,.2,{emissive:'#ffb64a',emissiveIntensity:2.5})}
// Grass tufts and wildflowers use one instanced draw each.
const grass=new T.InstancedMesh(new T.ConeGeometry(.045,.32,3),material('#6f8c4f'),900),dummy=new T.Object3D();let gi=0;for(let i=0;i<900;i++){let x=(r()-.5)*42,z=(r()-.5)*27;if(Math.abs(x)<16.9&&Math.abs(z)<9.5){x=Math.sign(x||1)*(16.9+r()*.6)}dummy.position.set(x,.15,z);dummy.rotation.set((r()-.5)*.5,r()*6,.2);dummy.scale.setScalar(.6+r());dummy.updateMatrix();grass.setMatrixAt(gi++,dummy.matrix)}s.add(grass);
const flowers=new T.InstancedMesh(sphere,material('#eac6db'),100);for(let i=0;i<100;i++){let side=i%2?1:-1;dummy.position.set(side*(18.5+r()*3),.2,-10+r()*22);dummy.scale.set(.065,.05,.065);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix)}s.add(flowers);
for(let i=0;i<9;i++){let m=mesh(s,new T.ConeGeometry(8+r()*5,10+r()*10,6),'#7e9c8d',[-45+i*11,-1,-38-r()*14]);m.rotation.y=r()*5}
this.fireflies=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:'#e8f4aa',size:.07,transparent:true,opacity:.65,depthWrite:false}));this.fireflyBase=Array.from({length:65},()=>[(r()-.5)*44,1+r()*5,(r()-.5)*28]);this.fireflies.geometry.setAttribute('position',new T.Float32BufferAttribute(this.fireflyBase.flat(),3));s.add(this.fireflies);
}
mergeScenery(){
 this.scene.updateMatrixWorld(true);
 const batches=new Map(),remove=[];
 this.scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const key=o.material; if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o.geometry.clone().applyMatrix4(o.matrixWorld));remove.push(o)}});
 for(const o of remove)o.removeFromParent();
 for(const [mat,list]of batches){const geometry=mergeGeometries(list,false);for(const g of list)g.dispose();if(!geometry)throw new Error('Scenery geometry could not be merged');const m=new T.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;this.scene.add(m)}
}
makeProjectile(shot){let g=group(this.effects),color={Electric:'#ffde52',Fire:'#ff782c',Water:'#5edbff',Grass:'#a0ef72',Normal:'#e8e7d2',Ghost:'#aa75f5',Poison:'#de77e5',Psychic:'#ff80cf',Fighting:'#ff9c5e',Steel:'#bce7ee',Flying:'#c6dfff',Dark:'#9974b5',Ice:'#a3e9fb',Rock:'#c5b08c',Ground:'#d3ad73',Bug:'#b3d875',Dragon:'#ad9bea'}[shot.m.type]||'#ecedd0',r=shot.r/32;
if(shot.m.kind==='melee'||shot.m.kind==='radial'){
 const reach=shot.m.reach/32;
 const arc=mesh(g,new T.TorusGeometry(reach*.72,.055,7,40,shot.m.kind==='radial'?Math.PI*2:Math.PI*.85),color,[0,0,0],[1,1,1],{emissive:color,emissiveIntensity:2,transparent:true,opacity:.8,depthWrite:false});arc.rotation.x=-Math.PI/2;arc.rotation.z=shot.m.kind==='radial'?0:.25;g.userData.melee=true;g.userData.arc=arc;return g;
}
ball(g,'#fff8dd',0,0,0,r*.64,r*.64,r*.64,{emissive:color,emissiveIntensity:3,roughness:.1});ball(g,color,0,0,0,r,r,r,{emissive:color,emissiveIntensity:1.8,transparent:true,opacity:.3,depthWrite:false});g.userData.r=r;g.userData.arcs=[];
for(let i=0;i<2;i++){let hoop=ring(g,r*(1.3+i*.3),.018,color,0,{emissive:color,emissiveIntensity:2.5});hoop.rotation.set(i*.7,.7+i,0);g.userData['hoop'+i]=hoop}
for(let i=0;i<7;i++){let trail=ball(g,color,0,0,-i*r*.65,r*(1-i*.09),r*(1-i*.09),r*.75,{emissive:color,emissiveIntensity:1.6,transparent:true,opacity:.35*(1-i/8),depthWrite:false});g.userData['trail'+i]=trail}
if(shot.m.type==='Electric'){for(let i=0;i<3;i++){let geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(42),3));let arc=new T.Line(geo,new T.LineBasicMaterial({color:'#fffbd6',transparent:true,opacity:.85}));g.add(arc);g.userData.arcs.push(arc)}}
if(shot.m.type==='Water'){let curl=ring(g,r*1.9,.035,'#a2ecff',0,{emissive:'#51b8e8',emissiveIntensity:2,transparent:true,opacity:.7});g.userData.curl=curl}
g.userData.elementParts=[];
if(shot.m.visual==='leaf'||shot.m.visual==='slash'){for(let i=0;i<2;i++){let blade=ball(g,color,0,0,0,r*(i?2.5:.5),r*.16,r*(i?.5:2.5),{emissive:color,emissiveIntensity:.6});blade.rotation.z=.25;}}
if(shot.m.visual==='star'){let sh=new T.Shape();for(let i=0;i<10;i++){let a=i*Math.PI/5,rad=i%2?r*.65:r*1.8;const x=Math.sin(a)*rad,y=Math.cos(a)*rad;i?sh.lineTo(x,y):sh.moveTo(x,y);}sh.closePath();let star=mesh(g,new T.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false}),color,[0,0,0],[1,1,1],{emissive:color,emissiveIntensity:1.2});g.userData.star=star;}
if(shot.m.visual==='beam')g.scale.set(.7,.7,2.4);
if(shot.m.type==='Fire'){for(let i=0;i<5;i++){let a=i*Math.PI*2/5;let f=ball(g,i%2?'#ffde5e':'#ff7c25',Math.sin(a)*r,.05,Math.cos(a)*r,r*.4,r*.85,r*.35,{emissive:'#ff7524',emissiveIntensity:2});f.rotation.x=-.5;f.userData.baseY=f.scale.y;g.userData.elementParts.push(f)}}
if(shot.m.type==='Water'){for(let i=0;i<5;i++){let a=i*Math.PI*2/5;let drop=ball(g,'#c1f3ff',Math.sin(a)*r*1.7,Math.cos(a)*r*1.7,0,r*.22,r*.38,r*.2,{emissive:'#59c5ea',emissiveIntensity:1.1,roughness:.1});drop.userData.baseY=drop.scale.y;g.userData.elementParts.push(drop)}}
return g}
impact(x,y,color,n){if(n<12)return;let g=group(this.effects);g.position.set((x-550)/32,.08,(y-377)/32);ring(g,.35,.035,color,.02,{emissive:color,emissiveIntensity:1.7,transparent:true,opacity:.85,depthWrite:false});ring(g,.6,.018,color,.04,{emissive:color,emissiveIntensity:1.7,transparent:true,opacity:.55,depthWrite:false});g.children.forEach(m=>{m.material=m.material.clone();m.userData.ownedMaterial=true});this.impacts.push({g,life:.45,max:.45,large:n>30})}
disposeEffect(g){g.traverse(o=>{if(o.geometry&&o.geometry!==sphere&&o.geometry!==box)o.geometry.dispose();if(o.material?.isLineBasicMaterial||o.userData.ownedMaterial)o.material.dispose()});this.effects.remove(g)}
render(state,dt){if(this.inspection){this.renderInspection(dt);return;}const {p,b,shots,zones,sparks,texts,playerFields=[],playerCast=null,time,running,paused}=state;if(!paused)this.clock+=dt;let clock=this.clock;this.updateCamera(p,b,dt);for(const [role,e]of [['player',p],['boss',b]]){
 if(!e||!this.assets.has(e.name))continue;
 let current=this.models.get(role);
 if(!current||current.name!==e.name){if(current)this.scene.remove(current.mesh);const key=role+':'+e.name;let rig=this.instances.get(key);if(!rig){rig=cloneCharacter(this.assets.get(e.name));this.instances.set(key,rig);}this.scene.add(rig.root);rig.lastX=null;rig.lastY=null;rig.speed=0;current={name:e.name,mesh:rig.root,rig};this.models.set(role,current)}
 updateCharacter(current.rig,e,dt,clock,running||time>0,paused);
}

if(p){this.target.position.set((p.x-550)/32,.06,(p.y-377)/32);this.target.scale.setScalar(1+Math.sin(clock*3)*.025);this.arrow.position.set((p.x-550)/32+p.dx*1.3,.13,(p.y-377)/32+p.dy*1.3);this.arrow.rotation.set(Math.PI/2,0,-Math.atan2(p.dx,p.dy));this.arrow.visible=running}
for(let [shot,g]of this.projectiles)if(!shots.includes(shot)){this.disposeEffect(g);this.projectiles.delete(shot)}for(let shot of shots){let g=this.projectiles.get(shot);if(!g){g=this.makeProjectile(shot);this.projectiles.set(shot,g)}g.visible=!(shot.delay>0);g.position.set((shot.x-550)/32,(shot.m.kind==='radial'?.08:shot.m.kind==='melee'?.7:shot.charged?1.1:.9)+(shot.m.visual==='lob'?Math.sin(Math.min(1,(shot.age||0)/shot.maxLife)*Math.PI)*2:0),(shot.y-377)/32);g.rotation.y=Math.atan2(shot.dx,shot.dy);if(g.userData.melee){g.userData.arc.rotation.z+=(paused?0:dt*8);continue;}if(g.userData.star)g.userData.star.rotation.z=clock*8;for(let i=0;i<2;i++){let h=g.userData['hoop'+i];h.rotation.z=clock*(i?4:-6)}for(let i=0;i<7;i++){let trail=g.userData['trail'+i];trail.position.x=Math.sin(clock*18+i)*.04;trail.position.y=Math.cos(clock*20+i)*.03}if(g.userData.curl)g.userData.curl.rotation.z=clock*8;for(const part of g.userData.elementParts)part.scale.y=part.userData.baseY*(1+Math.sin(clock*20)*.12);for(let [j,arc]of g.userData.arcs.entries()){let attr=arc.geometry.attributes.position,r=g.userData.r*1.5;for(let i=0;i<14;i++){let a=i/13*Math.PI*2+clock*4+j*2;let jag=1+Math.sin(i*19+Math.floor(clock*15))* .25;attr.setXYZ(i,Math.cos(a)*r*jag,Math.sin(a)*r*jag,Math.sin(a*3+j)*r*.5)}attr.needsUpdate=true}}
for(let [z,g]of this.warnings)if(!zones.includes(z)){this.disposeEffect(g);this.warnings.delete(z)}for(let z of zones){let g=this.warnings.get(z);if(!g){g=group(this.effects);if(z.kind==='blast'){let disc=mesh(g,new T.CircleGeometry(z.r/32,64),'#ef654c',[0,0,0],[1,1,1],{transparent:true,opacity:.22,depthWrite:false,emissive:'#f33c28',emissiveIntensity:.5});disc.rotation.x=-Math.PI/2;ring(g,z.r/32,.04,'#ffb077',.02,{emissive:'#fb5438',emissiveIntensity:2});g.userData.fill=ring(g,z.r/32,.025,'#fff0a0',.03,{emissive:'#ff9f59',emissiveIntensity:2})}else if(z.lane){let lane=mesh(g,new T.PlaneGeometry((z.length||600)/32,(z.width||80)/32),'#ff7955',[(z.length||600)/64,0,0],[1,1,1],{transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide,emissive:'#f86a35',emissiveIntensity:.5});lane.rotation.x=-Math.PI/2;}else{let shape=new T.Shape();shape.moveTo(0,0);shape.absarc(0,0,18,-.36,.36,false);shape.lineTo(0,0);let cone=mesh(g,new T.ShapeGeometry(shape),'#ff7955',[0,0,0],[1,1,1],{transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide,emissive:'#f86a35',emissiveIntensity:.4});cone.rotation.x=-Math.PI/2}this.warnings.set(z,g)}g.visible=!(z.delay>0);g.position.set((z.x-550)/32,.045,(z.y-377)/32);if(z.kind==='blast')g.userData.fill.scale.setScalar(Math.max(.015,1-z.t/z.total));else g.rotation.y=-z.a;}
let count=Math.min(sparks.length,500),color=new T.Color();for(let i=0;i<count;i++){let sp=sparks[i];this.particlePositions[i*3]=(sp.x-550)/32;this.particlePositions[i*3+1]=.5+Math.sin(sp.life*5)*.6;this.particlePositions[i*3+2]=(sp.y-377)/32;color.set(sp.c);this.particleColors[i*3]=color.r;this.particleColors[i*3+1]=color.g;this.particleColors[i*3+2]=color.b}this.particles.geometry.setDrawRange(0,count);this.particles.geometry.attributes.position.needsUpdate=true;this.particles.geometry.attributes.color.needsUpdate=true;
for(const [f,g]of this.playerFieldViews)if(!playerFields.includes(f)){this.disposeEffect(g);this.playerFieldViews.delete(f);}
for(const f of playerFields){let g=this.playerFieldViews.get(f);if(!g){g=group(this.effects);const c={Fire:'#ffa15f',Grass:'#a3e582',Poison:'#ce8ce9'}[f.m.type]||'#bbebd1';const disc=mesh(g,new T.CircleGeometry(f.r/32,48),c,[0,.025,0],[1,1,1],{transparent:true,opacity:.2,depthWrite:false,emissive:c,emissiveIntensity:.6});disc.rotation.x=-Math.PI/2;disc.castShadow=false;ring(g,f.r/32,.025,c,.035,{emissive:c,emissiveIntensity:1});this.playerFieldViews.set(f,g);}g.position.set((f.x-550)/32,.04,(f.y-377)/32);}
this.castRing.visible=!!playerCast;if(playerCast&&p){this.castRing.position.set((p.x-550)/32,.1,(p.y-377)/32);this.castRing.scale.setScalar(1+(1-playerCast.t/playerCast.total)*.4);this.castRing.material.color.set({Electric:'#ffe16d',Fire:'#ff9d60',Water:'#8be0f7',Psychic:'#f7a2e4',Grass:'#bbef8f'}[playerCast.move.type]||'#ffffff');this.castRing.material.emissive.copy(this.castRing.material.color);}
let fp=this.fireflies.geometry.attributes.position;for(let i=0;i<this.fireflyBase.length;i++){let [x,y,z]=this.fireflyBase[i];fp.setXYZ(i,x+Math.sin(clock*.3+i),y+Math.sin(clock*.6+i)*.3,z+Math.cos(clock*.25+i)*.5)}fp.needsUpdate=true;
const layer=document.getElementById('combatText');for(let [t,node]of this.damage)if(!texts.includes(t)){node.remove();this.damage.delete(t)}for(let t of texts){let node=this.damage.get(t);if(!node){node=document.createElement('span');node.textContent=t.text;node.style.color=t.c;layer.append(node);this.damage.set(t,node)}this.temp.set((t.x-550)/32,2.2+(1-t.life), (t.y+38-377)/32).project(this.camera);node.style.left=(this.temp.x*.5+.5)*100+'%';node.style.top=(-this.temp.y*.5+.5)*100+'%';node.style.opacity=Math.max(0,t.life)}
for(const impact of this.impacts){if(!paused)impact.life-=dt;let progress=1-impact.life/impact.max;impact.g.scale.setScalar(1+progress*(impact.large?9:4));impact.g.children.forEach(m=>m.material.opacity=Math.max(0,impact.life/impact.max)*.7);if(impact.life<=0)this.disposeEffect(impact.g)}this.impacts=this.impacts.filter(i=>i.life>0);
this.renderer.render(this.scene,this.camera);}
inspect(name,clip='idle'){
 const rig=this.assets.get(name);if(!rig)return this.prepare([name]).then(()=>this.inspect(name,clip));
 if(!this.inspector){
 const scene=new T.Scene();scene.background=new T.Color('#142329');scene.fog=new T.Fog('#142329',18,40);
 scene.add(new T.HemisphereLight('#d7e8ff','#343a31',2));
 const key=new T.DirectionalLight('#ffdfb3',2.7);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:8,bottom:-5,near:.1,far:30});key.shadow.normalBias=.015;scene.add(key);
 const rim=new T.DirectionalLight('#7bb9e8',2.5);rim.position.set(5,4,-5);scene.add(rim);
 mesh(scene,new T.CylinderGeometry(3.2,3.4,.25,96),'#36454b',[0,-.17,0]);ring(scene,3.05,.018,'#a9d6d1',-.025,{emissive:'#5b9996',emissiveIntensity:.5});
 const camera=new T.PerspectiveCamera(34,this.camera.aspect,.1,80);this.inspector={scene,camera};
 }
 if(this.inspection)this.inspection.rig.root.removeFromParent();
 rig.mixer.stopAllAction();rig.actions[clip].reset().setEffectiveTimeScale(1).setEffectiveWeight(1).setLoop(T.LoopRepeat,Infinity).play();
 rig.entity=null;rig.pose.rotation.set(0,0,0);rig.root.position.set(0,0,0);rig.root.scale.setScalar(1);rig.root.visible=true;
 this.inspector.scene.add(rig.root);this.inspection={name,clip,rig,angle:.4,zoom:1};
 for(const m of this.models.values())if(m.mesh.parent===this.scene)this.scene.remove(m.mesh);this.models.clear();
}
renderInspection(dt){const i=this.inspection,{scene,camera}=this.inspector;camera.aspect=this.camera.aspect;const dist=Math.max(7.5,i.rig.height*2.9,(i.rig.width||0)*1.25)*i.zoom;camera.position.set(0,2.75,dist);camera.lookAt(0,i.rig.height*.47,0);camera.updateProjectionMatrix();i.rig.root.rotation.set(0,i.angle,0);i.rig.mixer.update(Math.min(dt,.04));this.renderer.render(scene,camera)}
closeInspection(){if(this.inspection){this.inspection.rig.root.removeFromParent();this.inspection.rig.entity=null;}this.inspection=null;this.models.clear()}
setCamera(tactical){this.tactical=tactical;this.camera.fov=tactical?40:36;this.cameraCenter??=new T.Vector3();this.cameraZoom=tactical?ARENA_SCALE:1;this.updateCamera(null,null,0,true);this.camera.updateProjectionMatrix()}
updateCamera(p,b,dt,instant=false){
 const center=new T.Vector3();let zoom=this.tactical?ARENA_SCALE:1;
 if(!this.tactical&&p&&b){center.set(((p.x+b.x)/2-550)/32,0,((p.y+b.y)/2-377)/32);zoom=Math.max(1,Math.abs(p.x-b.x)/32/23,Math.abs(p.y-b.y)/32/12);zoom=Math.min(ARENA_SCALE*1.15,zoom);}
 const alpha=instant?1:1-Math.exp(-dt*4);this.cameraCenter.lerp(center,alpha);this.cameraZoom+=(zoom-this.cameraZoom)*alpha;
 const narrow=this.camera.aspect<1.4?1.25:1;
 this.camera.position.copy(this.cameraCenter).add(new T.Vector3(0,this.tactical?40:27,this.tactical?24:34).multiplyScalar(this.cameraZoom*narrow));this.camera.lookAt(this.cameraCenter);
}

reset(){for(const [,g]of this.playerFieldViews)this.disposeEffect(g);this.playerFieldViews.clear();this.castRing.visible=false;for(const [,g]of this.projectiles)this.disposeEffect(g);this.projectiles.clear();for(const [,g]of this.warnings)this.disposeEffect(g);this.warnings.clear();for(const i of this.impacts)this.disposeEffect(i.g);this.impacts=[];for(const [,n]of this.damage)n.remove();this.damage.clear()}
diagnostics(){return{engine:'Three.js / WebGL2',models:[...this.models.values()].map(m=>m.name),rigs:[...this.models.values()].map(m=>rigDiagnostics(m.rig)),loadedModels:this.assets.size,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,webgl:!!this.renderer.getContext(),width:this.canvas.width,height:this.canvas.height}}
}
