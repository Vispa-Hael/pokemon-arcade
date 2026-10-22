import {assetUrl} from '../../shared/urls';
import * as THREE from 'three';
import {GLTFLoader, type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createArena,tilePosition} from './arena';

interface Joint {bone:THREE.Bone;rest:THREE.Quaternion;kind:string;side:number}
interface Figure {
 key:string; id:number; scene:THREE.Scene; tile?:number; fromTile?:number; label?:THREE.Sprite; labelText?:string; body:THREE.Group; pivot:THREE.Group;
 mixer:THREE.AnimationMixer; idle?:THREE.AnimationAction; walk?:THREE.AnimationAction;
 joints:Joint[]; base:THREE.Mesh; ring:THREE.Mesh; element:HTMLElement;
 rect:{x:number;y:number;w:number;h:number}; from?:{x:number;y:number;w:number;h:number};
 travel:number; hit:number; attack:number; side:number; dead:boolean; loaded:boolean; exiting?:number; summon?:number; burst:THREE.Points;
}
export interface ModelLayer {sync:(root:HTMLElement)=>void;dispose:()=>void}
const cache=new Map<number,Promise<GLTF>>();
const loader=new GLTFLoader();
const axis=new THREE.Vector3(1,0,0),offset=new THREE.Quaternion();
function load(id:number){let task=cache.get(id);if(!task){task=loader.loadAsync(assetUrl(`capsule/models/${id}.glb`));cache.set(id,task);task.catch(()=>cache.delete(id));}return task;}
function joints(body:THREE.Object3D,id:number):Joint[]{const result:Joint[]=[];body.traverse(node=>{if(!(node instanceof THREE.Bone))return;const n=node.name;let kind='';if(id===6&&/^[LR]Feeler1_/.test(n))kind='wing';else if(id===10026&&/^[LR]Feeler1$/.test(n))kind='arm';else if(/^[LR]Ear1?(?:_\d+)?$/.test(n))kind='ear';else if(/^Tail1(?:_\d+)?$/.test(n))kind='tail';else if(/^Head(?:_\d+)?$/i.test(n))kind='head';else if(/^[LR]Arm(?:_\d+)?$/.test(n))kind='arm';else if(/^[LR]Thigh(?:_\d+)?$/.test(n))kind='leg';if(kind)result.push({bone:node,rest:node.quaternion.clone(),kind,side:/^R/.test(n)?-1:1});});return result;}

/** One transparent GPU canvas serves every figure; no per-piece WebGL contexts. */
export function createModelLayer(host:HTMLElement,reduced:boolean):ModelLayer {
 if(typeof WebGLRenderingContext==='undefined')return {sync(){},dispose(){}};
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return {sync(root){root.classList.add('pcm-model-fallback');},dispose(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement;canvas.className='pcm-model-layer';canvas.setAttribute('aria-hidden','true');
 const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,1.5,3.85);camera.lookAt(0,.75,0);
 const arena=createArena(renderer);
 const figures=new Map<string,Figure>();let disposed=false,frame=0,last=performance.now(),root:HTMLElement|undefined,needsLayout=true;
 let width=0,height=0;const observer=new ResizeObserver(()=>{needsLayout=true;});observer.observe(host);
 const contextLost=(e:Event)=>{e.preventDefault();root?.classList.add('pcm-model-fallback');};canvas.addEventListener('webglcontextlost',contextLost);
 function rect(el:HTMLElement){const a=el.getBoundingClientRect(),b=root!.getBoundingClientRect();return {x:a.left-b.left,y:a.top-b.top,w:a.width,h:a.height};}
 function make(key:string,id:number,el:HTMLElement,side:number):Figure{
  const scene=new THREE.Scene(),body=new THREE.Group(),pivot=new THREE.Group();scene.add(pivot);pivot.add(body);
  scene.add(new THREE.HemisphereLight(0xd7eeff,0x45504a,2.5));const sun=new THREE.DirectionalLight(0xffedce,3.5);sun.position.set(-3,6,5);scene.add(sun);const rim=new THREE.DirectionalLight(0x7fd8ff,2);rim.position.set(3,2,-3);scene.add(rim);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.73,.80,.12,48),new THREE.MeshStandardMaterial({color:side===1?0x67482d:0x264d67,metalness:.65,roughness:.3}));base.position.y=-.04;scene.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.74,.025,8,48),new THREE.MeshBasicMaterial({color:side===1?0xffb76c:0x7cdcff}));ring.rotation.x=Math.PI/2;ring.position.y=.025;scene.add(ring);
  const points=new Float32Array(Array.from({length:36},(_,i)=>{const angle=Math.floor(i/3)*2.399;return i%3===0?Math.cos(angle):i%3===1?.4+Math.floor(i/3)/9:Math.sin(angle);}));
  const burst=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(points,3)),new THREE.PointsMaterial({color:0xffdc8b,size:.12,transparent:true,opacity:0,depthWrite:false}));scene.add(burst);
  const f:Figure={burst,key,id,scene,body,pivot,mixer:new THREE.AnimationMixer(body),joints:[],base,ring,element:el,rect:rect(el),travel:0,hit:0,attack:0,side,dead:false,loaded:false};figures.set(key,f);
  void load(id).then(gltf=>{
   if(disposed||figures.get(key)!==f)return;const model=clone(gltf.scene);
   // Pikachu's export adds a quarter-turn around X to both its skin and skeleton.
   // Correct the cloned scene before measuring so it stands upright on every base.
   if(id===25)model.rotation.x=-Math.PI/2;
   body.add(model);model.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   const scale=1.65/Math.max(size.y,size.x*.78,size.z*.7,.01);model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
   // The Aegislash asset includes both shield and blade meshes; open its guard for the battle stance.
   if(id===10026)model.traverse(n=>{if(n.name==='AegislashShieldGuard'){n.position.x+=size.x*.3; n.rotation.z-=.35;}});
   f.mixer=new THREE.AnimationMixer(model);
   const idle=gltf.animations.find(a=>/idle/i.test(a.name));const walk=gltf.animations.find(a=>/walk|run/i.test(a.name));
   if(idle){f.idle=f.mixer.clipAction(idle);if(!reduced)f.idle.play();}if(walk)f.walk=f.mixer.clipAction(walk);
   f.joints=joints(model,id);f.loaded=true;if(key.startsWith('cinema-')&&!reduced)f.summon=performance.now();f.element.classList.add('model-ready');
  }).catch(()=>{if(!disposed)f.element.classList.add('model-failed');});return f;
 }
 function sync(next:HTMLElement){root=next;root.append(canvas);needsLayout=true;
  arena.sync(next);const active=new Set<string>();next.querySelectorAll<HTMLElement>('[data-model]').forEach(el=>{
   const key=el.dataset.modelKey!,id=Number(el.dataset.model),side=Number(el.dataset.modelSide??0);active.add(key);
   let f=figures.get(key);if(f&&f.id!==id){release(f);figures.delete(key);f=undefined;}if(!f)f=make(key,id,el,side);
   const previousTile=f.element.dataset.modelTile,newTile=el.dataset.modelTile;
   if(previousTile!==undefined&&newTile!==undefined&&previousTile!==newTile&&!reduced){f.from={...f.rect};f.fromTile=Number(previousTile);f.travel=performance.now();}
   const previousHp=Number(f.element.dataset.modelHp),hp=Number(el.dataset.modelHp);
   if(hp<previousHp&&!reduced)f.hit=performance.now();
   if(f.element.dataset.modelActed==='false'&&el.dataset.modelActed==='true'&&!reduced)f.attack=performance.now();
   f.tile=newTile===undefined?undefined:Number(newTile);f.exiting=undefined;f.element=el;f.side=side;f.dead=el.dataset.modelDead==='true';if(f.loaded)el.classList.add('model-ready');
  });
  for(const [key,f]of figures)if(!active.has(key)){if(key.startsWith('unit-')&&!reduced&&!!next.querySelector('.pcm-board')){f.exiting??=performance.now();}else{release(f);figures.delete(key);}}
 }
 function release(f:Figure){arena.remove(f.key);if(f.label){f.label.material.map?.dispose();f.label.material.dispose();}f.mixer.stopAllAction();f.mixer.uncacheRoot(f.mixer.getRoot());f.burst.geometry.dispose();(f.burst.material as THREE.Material).dispose();f.base.geometry.dispose();(f.base.material as THREE.Material).dispose();f.ring.geometry.dispose();(f.ring.material as THREE.Material).dispose();}
 function layout(){if(!root)return;const bounds=root.getBoundingClientRect();if(width!==Math.ceil(bounds.width)||height!==Math.ceil(bounds.height)){width=Math.ceil(bounds.width);height=Math.ceil(bounds.height);renderer.setSize(width,height,false);}for(const f of figures.values())if(!f.exiting)f.rect=rect(f.element);needsLayout=false;}
 function draw(now:number){if(disposed)return;frame=requestAnimationFrame(draw);const dt=Math.min((now-last)/1000,.05);last=now;if(!root||!root.isConnected||document.hidden)return;if(needsLayout)layout();
  renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();renderer.setScissorTest(true);const bounds=root.getBoundingClientRect();
  for(const f of figures.values()){
   if(root.querySelector('.pcm-cinema')&&!f.key.startsWith('cinema-'))continue;
   if(f.exiting&&now-f.exiting>600){release(f);figures.delete(f.key);continue;}if(!f.loaded)continue;let r=f.rect;const moving=!!f.from&&now-f.travel<650;
   if(moving&&f.from){const t=Math.min(1,(now-f.travel)/650),e=t*t*(3-2*t);r={x:THREE.MathUtils.lerp(f.from.x,r.x,e),y:THREE.MathUtils.lerp(f.from.y,r.y,e),w:r.w,h:r.h};}else f.from=undefined;
   if(!(arena.active()&&f.key.startsWith('unit-'))&&(r.y+bounds.top+r.h<0||r.y+bounds.top>innerHeight||r.w<1||r.h<1))continue;
   const arenaPiece=arena.active()&&f.key.startsWith('unit-');
   const time=now/1000+f.id,hit=Math.max(0,1-(now-f.hit)/550),attack=Math.max(0,1-(now-f.attack)/600);
   const summon=f.summon===undefined?0:Math.max(0,1-(now-f.summon)/1100);
   f.pivot.scale.setScalar((arenaPiece?.65:1)*(f.exiting?Math.max(.01,1-(now-f.exiting)/600):Math.max(.01,1-summon*summon)));f.base.scale.setScalar(arenaPiece?.65:1);
   const particles=f.burst.material as THREE.PointsMaterial;particles.opacity=Math.max(hit,summon);f.burst.scale.setScalar(1+(1-Math.max(hit,summon))*.8);f.burst.rotation.y=now*.002;
   const selected=f.element.dataset.modelSelected==='true';f.ring.scale.setScalar((arenaPiece?.65:1)*(selected?1.1:1));(f.ring.material as THREE.MeshBasicMaterial).color.setHex(selected?0xffec9c:f.side===1?0xffb76c:0x7cdcff);
   f.pivot.rotation.y=(arenaPiece?(f.side===0?Math.PI:0):(f.side===1?-.35:.30))+(reduced?0:Math.sin(time*.7)*.07);f.pivot.rotation.z=hit*Math.sin(now*.04)*.12;
   f.pivot.position.y=reduced?0:Math.sin(time*2)*.035+(moving?Math.abs(Math.sin((now-f.travel)*.012))*.16:0);f.body.position.z=attack*Math.sin(attack*Math.PI)*.4;
   if(f.walk&&moving){if(!f.walk.isRunning()){f.idle?.stop();f.walk.reset().play();}}else if(f.walk?.isRunning()){f.walk.stop();f.idle?.reset().play();}
   if(!reduced)f.mixer.update(dt);
   if(!f.idle&&!f.walk?.isRunning())for(const j of f.joints){j.bone.quaternion.copy(j.rest);if(reduced)continue;const rate=moving?10:2.4;let a=Math.sin(time*rate+j.side)*.045;axis.set(1,0,0);if(j.kind==='wing'){a=Math.sin(time*5)*.25*j.side;axis.set(0,1,0);}else if(j.kind==='tail'){a=Math.sin(time*3)*.18;axis.set(0,1,0);}else if(j.kind==='ear')a*=1.8;else if(j.kind==='leg')a*=moving?5:.3;else if(j.kind==='arm')a+=attack*.4;else if(j.kind==='head')a*=.4;j.bone.quaternion.multiply(offset.setFromAxisAngle(axis,a));}
   if(arenaPiece&&f.tile!==undefined){
    const group=arena.attach(f.key,[f.pivot,f.base,f.ring,f.burst]);group.userData.tile=f.tile;const pos=tilePosition(f.tile);
    if(moving&&f.fromTile!==undefined){const t=Math.min(1,(now-f.travel)/650),ease=t*t*(3-2*t);pos.lerpVectors(tilePosition(f.fromTile),pos,ease);}group.position.copy(pos);
    f.body.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    const name=f.element.parentElement?.querySelector('.pcm-unit-name')?.textContent??'';const text=name+' · '+(f.element.dataset.modelHp??'');
    if(!f.label||f.labelText!==text){if(f.label){f.label.material.map?.dispose();f.label.material.dispose();f.label.removeFromParent();}const c=document.createElement('canvas');c.width=512;c.height=112;const ctx=c.getContext('2d')!;ctx.fillStyle='#102332df';ctx.roundRect(4,4,504,104,20);ctx.fill();ctx.textAlign='center';ctx.fillStyle=f.side===0?'#a5e3ff':'#ffcf9f';ctx.font='bold 35px Segoe UI';ctx.fillText(name,256,47);ctx.fillStyle='#ffffff';ctx.font='28px Segoe UI';ctx.fillText((f.element.dataset.modelHp??'')+' HP',256,88);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;f.label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));f.label.scale.set(1.4,.31,1);f.label.position.y=1.55;f.label.renderOrder=10;f.labelText=text;}f.label.visible=true;group.add(f.label);continue;
   }else{f.scene.add(f.pivot,f.base,f.ring,f.burst);if(f.label)f.label.visible=false;}
   camera.aspect=r.w/r.h;camera.updateProjectionMatrix();renderer.setViewport(r.x,height-r.y-r.h,r.w,r.h);renderer.setScissor(r.x,height-r.y-r.h,r.w,r.h);renderer.render(f.scene,camera);
  }
  arena.render(bounds,width,height);
 }
 frame=requestAnimationFrame(draw);
 return {sync,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();arena.dispose();canvas.removeEventListener('webglcontextlost',contextLost);for(const f of figures.values())release(f);figures.clear();renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}

