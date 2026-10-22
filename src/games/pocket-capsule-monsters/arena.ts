import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export const tilePosition=(tile:number)=>new THREE.Vector3((tile%8-3.5)*1.3,.12,(Math.floor(tile/8)-3.5)*1.3);
export function pickArenaTile(camera:THREE.Camera,objects:THREE.Object3D[],x:number,y:number,bounds:{left:number;top:number;width:number;height:number}):number|undefined {
 if(x<bounds.left||y<bounds.top||x>bounds.left+bounds.width||y>bounds.top+bounds.height||bounds.width<=0||bounds.height<=0)return;
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1),camera);
 for(const hit of ray.intersectObjects(objects,true)){if(hit.object instanceof THREE.Points||hit.object instanceof THREE.Sprite)continue;let object:THREE.Object3D|null=hit.object;while(object){if(Number.isInteger(object.userData.tile))return object.userData.tile;object=object.parent;}}
}
export function createArena(renderer:THREE.WebGLRenderer){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x101d2b);scene.fog=new THREE.Fog(0x101d2b,20,48);
 const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(10,13,15);
 let preset='orbit';let root:HTMLElement|undefined,board:HTMLElement|undefined,controls:OrbitControls|undefined,signature='',enabled=true,disposed=false;
 const terrain=new THREE.Group(),pieces=new THREE.Group();scene.add(terrain,pieces);
 const tiles:THREE.Mesh[]=[];const resources=new Set<THREE.BufferGeometry|THREE.Material|THREE.Texture>();
 function material(color:number,metalness=.05,roughness=.85){const m=new THREE.MeshStandardMaterial({color,metalness,roughness});resources.add(m);return m;}
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=terrain){const geometry=new THREE.BoxGeometry(w,h,d);resources.add(geometry);const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cylinder(top:number,bottom:number,height:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=terrain){const g=new THREE.CylinderGeometry(top,bottom,height,16);resources.add(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 scene.add(new THREE.HemisphereLight(0xc9e7ff,0x344235,2.1));const sunlight=new THREE.DirectionalLight(0xffe2b5,3.3);sunlight.position.set(-7,14,7);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);Object.assign(sunlight.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:35});sunlight.shadow.bias=-.0007;sunlight.shadow.normalBias=.03;scene.add(sunlight);const rim=new THREE.DirectionalLight(0x76c6ff,1.9);rim.position.set(6,7,-8);scene.add(rim);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 let down={x:0,y:0},dragged=false;
 function onDown(e:PointerEvent){down={x:e.clientX,y:e.clientY};dragged=false;}
 function onMove(e:PointerEvent){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)dragged=true;}
 function onClick(e:MouseEvent){if(!enabled||!board||!e.isTrusted||e.detail===0)return;e.preventDefault();e.stopImmediatePropagation();if(dragged)return;const tile=pickArenaTile(camera,[...tiles,...pieces.children],e.clientX,e.clientY,board.getBoundingClientRect());if(tile!==undefined)board.querySelector<HTMLButtonElement>(`[data-tile="${tile}"]`)?.click();}
 function unbind(){board?.removeEventListener('pointerdown',onDown,true);board?.removeEventListener('pointermove',onMove,true);board?.removeEventListener('click',onClick,true);controls?.dispose();}
 function clearTerrain(){terrain.clear();tiles.length=0;for(const r of resources)r.dispose();resources.clear();}
 function build(){clearTerrain();const stone=material(0x354a52),gold=material(0xb5a16a,.7,.35),dark=material(0x162a35),leaf=material(0x456e53),trunk=material(0x65523e),ruin=material(0x84908a);
  box(11.6,.8,11.6,stone,0,-.65,0);box(11.1,.12,11.1,gold,0,-.2,0);box(10.8,.18,10.8,dark,0,-.1,0);
  for(let n=0;n<64;n++){const p=tilePosition(n),button=board!.querySelector<HTMLElement>(`[data-tile="${n}"]`)!,forest=button.classList.contains('forest'),wall=button.classList.contains('ruins');const top=material(forest?0x385b47:(n+Math.floor(n/8))%2?0x547471:0x65837b);const mesh=box(1.24,.19,1.24,top,p.x,0,p.z);mesh.userData.tile=n;tiles.push(mesh);
   if(forest)for(let i=0;i<3;i++){const x=p.x+(i-1)*.28,z=p.z+(i%2)*.27-.12; cylinder(.04,.065,.32,trunk,x,.28,z);cylinder(0,.29,.62,leaf,x,.65,z);cylinder(0,.22,.48,leaf,x,.95,z);}
   if(wall){box(.25,1.1,.28,ruin,p.x-.38,.64,p.z);box(.27,.87,.3,ruin,p.x+.35,.52,p.z+.1);const lintel=box(1.08,.24,.4,ruin,p.x,1.15,p.z);lintel.rotation.z=.08;box(.38,.16,.3,ruin,p.x+.15,.2,p.z+.4);}
  }
  for(const side of [0,1]){const p=tilePosition(side===0?59:4),base=material(side===0?0x458ac0:0xb67d45,.5,.35);cylinder(.52,.68,.35,base,p.x,.3,p.z);const sphereG=new THREE.SphereGeometry(.34,24,16);resources.add(sphereG);const ball=new THREE.Mesh(sphereG,material(side===0?0x9addff:0xffc583,.55,.22));ball.position.set(p.x,.81,p.z);ball.castShadow=true;terrain.add(ball);const ringG=new THREE.TorusGeometry(.45,.035,8,40);resources.add(ringG);const ring=new THREE.Mesh(ringG,gold);ring.rotation.x=Math.PI/2;ring.position.set(p.x,.65,p.z);terrain.add(ring);}
  // The sunken coliseum surrounds the playable plinth; scenery does not alter rules.
  box(60,.3,60,material(0x152f3b,.5,.25),0,-1.6,0);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*9,z=Math.sin(a)*9;const h=1.8+(i%3)*.5;cylinder(.38,.53,h,stone,x,-1+h/2,z);cylinder(.62,.62,.18,gold,x,h-.9,z);}
 }
 function sync(next:HTMLElement){root=next;const target=next.querySelector<HTMLElement>('.pcm-board');if(target!==board){unbind();board=target??undefined;if(board){controls=new OrbitControls(camera,board);controls.target.set(0,0,0);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=12;controls.maxDistance=28;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.44;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};board.addEventListener('pointerdown',onDown,true);board.addEventListener('pointermove',onMove,true);board.addEventListener('click',onClick,true);}}
  if(!board)return;const key=Array.from(board.querySelectorAll('[data-tile]')).map(el=>el.classList.contains('ruins')?'r':el.classList.contains('forest')?'f':'.').join('');if(key!==signature){signature=key;build();}
  board.classList.toggle('pcm-perspective-ready',enabled);board.style.touchAction=enabled?'none':'';
  for(let n=0;n<64;n++){const el=board.querySelector<HTMLElement>(`[data-tile="${n}"]`)!,m=tiles[n].material as THREE.MeshStandardMaterial;const selected=el.classList.contains('selected')||document.activeElement===el,hit=el.classList.contains('can-hit'),move=el.classList.contains('can-move');m.emissive.setHex(selected?0xffd56c:hit?0xdf5445:move?0x39b8e8:el.classList.contains('attack-zone')?0x9b5e44:0x000000);m.emissiveIntensity=selected ? .55 : (hit||move) ? .32 : el.classList.contains('attack-zone') ? .18 : 0;}
  next.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(button=>{button.disabled=false;button.setAttribute('aria-pressed',String(button.dataset.camera===preset));button.onclick=()=>{const view=button.dataset.camera;preset=view??'orbit';enabled=view!=='flat';if(view==='top')camera.position.set(0,22,.1);else if(view==='orbit')camera.position.set(10,13,15);else if(view==='reverse')camera.position.set(-10,13,-15);if(controls){controls.enabled=enabled;controls.target.set(0,0,0);controls.update();}sync(root!);};});
 }
 function attach(key:string,objects:THREE.Object3D[]){let group=pieces.getObjectByName(key) as THREE.Group|undefined;if(!group){group=new THREE.Group();group.name=key;pieces.add(group);}objects.forEach(o=>group!.add(o));return group;}
 function remove(key:string){pieces.getObjectByName(key)?.removeFromParent();}
 function render(rootBounds:DOMRect,_width:number,height:number){if(!enabled||!board||!root||root.querySelector('.pcm-cinema'))return false;controls?.update();const b=board.getBoundingClientRect(),x=b.left-rootBounds.left,y=b.top-rootBounds.top;camera.aspect=b.width/b.height;camera.updateProjectionMatrix();renderer.setViewport(x,height-y-b.height,b.width,b.height);renderer.setScissor(x,height-y-b.height,b.width,b.height);renderer.render(scene,camera);return true;}
 return {sync,attach,remove,active:()=>enabled&&!!board&&!root?.querySelector('.pcm-cinema'),render,dispose(){if(disposed)return;disposed=true;unbind();clearTerrain();sunlight.shadow.map?.dispose();scene.clear();}};
}

