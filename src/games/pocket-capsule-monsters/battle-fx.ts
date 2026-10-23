import * as THREE from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {BattleDrama} from './drama';
const colors:Record<string,number>={fire:0xff812d,water:0x54d9ff,electric:0xffe65b,grass:0x9bf171,ghost:0xc289ff,steel:0xb1d6ee,normal:0xffd5a0};
const world=(tile:number)=>new THREE.Vector3((tile%8-3.5)*1.3,.8,(Math.floor(tile/8)-3.5)*1.3);
export function createBattleFX(scene:THREE.Scene,camera:THREE.PerspectiveCamera,getControls:()=>OrbitControls|undefined){
 const group=new THREE.Group();scene.add(group);const material=new THREE.MeshBasicMaterial({color:0xffd275,transparent:true,opacity:1});
 const sphereGeometry=new THREE.IcosahedronGeometry(.12,1),cubeGeometry=new THREE.BoxGeometry(.14,.18,.13),beamGeometry=new THREE.CylinderGeometry(.055,.055,1,8),ringGeometry=new THREE.TorusGeometry(1,.035,8,48);
 const projectile=new THREE.Mesh(sphereGeometry,material),beam=new THREE.Mesh(beamGeometry,material),ring=new THREE.Mesh(ringGeometry,material);ring.rotation.x=Math.PI/2;group.add(projectile,beam,ring);
 const lightningGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(27),3));const lightningMaterial=new THREE.LineBasicMaterial({color:0xffffa0});const lightning=new THREE.Line(lightningGeometry,lightningMaterial);group.add(lightning);const slashGeometry=new THREE.TorusGeometry(.65,.055,8,32,Math.PI*1.4),slash=new THREE.Mesh(slashGeometry,material);group.add(slash);
 const debris=Array.from({length:36},(_,i)=>{const mesh=new THREE.Mesh(i<20?sphereGeometry:cubeGeometry,material);group.add(mesh);return mesh;});const light=new THREE.PointLight(0xffc16d,0,6);group.add(light);
 let current:BattleDrama|null=null,progress=0,savedPosition:THREE.Vector3|undefined,savedTarget:THREE.Vector3|undefined;
 group.visible=false;
 function sample(event:BattleDrama|null,p:number){if(event&&!current){savedPosition=camera.position.clone();savedTarget=getControls()?.target.clone()??new THREE.Vector3();}current=event;progress=p;group.visible=!!event;
  if(!event&&savedPosition){camera.position.copy(savedPosition);const controls=getControls();if(controls){controls.target.copy(savedTarget!);controls.enabled=true;controls.update();}camera.lookAt(savedTarget!);savedPosition=undefined;}
 }
 function update(now:number){if(!current)return;const e=current,p=progress,source=world(e.source),target=world(e.target),direction=target.clone().sub(source).normalize(),side=new THREE.Vector3(-direction.z,0,direction.x);if(direction.lengthSq()<.01){direction.set(0,0,1);side.set(1,0,0);}side.multiplyScalar((e.source+e.target)%2?-1:1);const shot=(e.source+e.target)%3;const controls=getControls();if(controls)controls.enabled=false;
  material.color.setHex(colors[e.type]??0xeac6ff);light.color.copy(material.color);material.opacity=1;
  let focus:THREE.Vector3,position:THREE.Vector3;
  if(e.kind==='victory'){if(p<.52){focus=target;position=target.clone().add(new THREE.Vector3(3,2.5,3));}else{focus=source.clone().add(new THREE.Vector3(0,.5,0));const angle=(p-.52)*2;position=source.clone().add(new THREE.Vector3(Math.sin(angle)*6,4.5,Math.cos(angle)*6));}}
  else if(e.kind==='charge'){focus=source;position=source.clone().add(side.clone().multiplyScalar(3)).add(new THREE.Vector3(0,2,3));}
  else if(p<.32){focus=source;position=source.clone().addScaledVector(direction,-3.5).addScaledVector(side,shot===1?1.8:0).add(new THREE.Vector3(0,shot===2?3.2:2.1,0));if(savedPosition)position.lerpVectors(savedPosition,position,Math.min(1,p/.2));}
  else if(p<.52){const t=(p-.32)/.2;focus=source.clone().lerp(target,t);position=focus.clone().addScaledVector(side,shot===2?4.3:3).add(new THREE.Vector3(0,shot===2?3.4:2.4,0));}
  else{focus=target;position=target.clone().addScaledVector(direction,2.6).addScaledVector(side,2).add(new THREE.Vector3(0,1.9,0));}
  if(p>.52&&p<.68&&e.kind!=='charge'){const shake=(e.knockout?.14:.065)*(1-(p-.52)/.16);position.x+=Math.sin(now*.09)*shake;position.y+=Math.cos(now*.11)*shake;}
  camera.position.copy(position);camera.lookAt(focus);camera.updateMatrixWorld(true);
  const flight=THREE.MathUtils.clamp((p-.3)/.22,0,1);projectile.visible=beam.visible=e.kind!=='victory'&&e.kind!=='charge'&&p>=.3&&p<.54;
  projectile.position.copy(source).lerp(target,flight);projectile.scale.setScalar(e.kind==='signature'?3:1.5);
  lightning.visible=projectile.visible&&e.type==='electric';if(lightning.visible){beam.visible=false;const points=lightningGeometry.getAttribute('position') as THREE.BufferAttribute;for(let i=0;i<9;i++){const v=source.clone().lerp(projectile.position,i/8);if(i>0&&i<8){v.x+=Math.sin(now*.04+i*4)*.18;v.y+=Math.cos(now*.03+i*3)*.13;}points.setXYZ(i,v.x,v.y,v.z);}points.needsUpdate=true;lightningGeometry.computeBoundingSphere();}
  slash.visible=p>.52&&p<.8&&['ghost','steel'].includes(e.type);slash.position.copy(target);slash.rotation.z=p*8;slash.rotation.y=p*3;
  const end=projectile.position,mid=source.clone().lerp(end,.5),length=source.distanceTo(end);beam.position.copy(mid);beam.scale.set(1,Math.max(.001,length),1);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(source).normalize());
  const burst=THREE.MathUtils.clamp((p-.52)/.38,0,1),charging=e.kind==='charge';ring.visible=p>.48||charging;ring.position.copy(charging?source:target);ring.position.y=.22;ring.scale.setScalar(charging?.5+Math.sin(p*Math.PI)*.9:.1+burst*2.8);
  debris.forEach((mesh,i)=>{mesh.visible=charging||p>=.52;const angle=i*2.399,radius=charging?.5+Math.sin(now*.003+i)*.12:burst*(e.kind==='victory'?3:2.1);mesh.position.copy(charging?source:target);mesh.position.x+=Math.cos(angle)*radius;mesh.position.z+=Math.sin(angle)*radius;mesh.position.y+=charging?Math.sin(now*.004+i)*.6:Math.sin(burst*Math.PI)*(i%4+.5)*.45-burst*.5;mesh.scale.setScalar(Math.max(.01,(1-burst)*(e.knockout||e.kind==='victory'?1.8:1)));mesh.rotation.set(now*.002+i,now*.003,angle);});
  light.position.copy(charging?source:target);light.intensity=charging?2+Math.sin(now*.01):p>.5&&p<.8?(1-burst)*12:0;
 }
 return {sample,update,get event(){return current;},get progress(){return progress;},dispose(){sample(null,1);group.removeFromParent();material.dispose();sphereGeometry.dispose();cubeGeometry.dispose();beamGeometry.dispose();ringGeometry.dispose();lightningGeometry.dispose();lightningMaterial.dispose();slashGeometry.dispose();}};
}
