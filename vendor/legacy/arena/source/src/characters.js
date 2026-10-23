import * as T from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import pikachu from '../assets/models/Pikachu.glb';
import charmander from '../assets/models/Charmander.glb';
import squirtle from '../assets/models/Squirtle.glb';
import blastoise from '../assets/models/Blastoise.glb';
import charizard from '../assets/models/Charizard.glb';
import venusaur from '../assets/models/Venusaur.glb';

import bulbasaur from '../assets/models/Bulbasaur.glb';
import gengar from '../assets/models/Gengar.glb';
import alakazam from '../assets/models/Alakazam.glb';
import machamp from '../assets/models/Machamp.glb';
import eevee from '../assets/models/Eevee.glb';
import snorlax from '../assets/models/Snorlax.glb';
import arcanine from '../assets/models/Arcanine.glb';
import ninetales from '../assets/models/Ninetales.glb';
import rapidash from '../assets/models/Rapidash.glb';
import jolteon from '../assets/models/Jolteon.glb';
import raichu from '../assets/models/Raichu.glb';
import electabuzz from '../assets/models/Electabuzz.glb';
import vaporeon from '../assets/models/Vaporeon.glb';
import gyarados from '../assets/models/Gyarados.glb';
import lapras from '../assets/models/Lapras.glb';
import cloyster from '../assets/models/Cloyster.glb';
import scyther from '../assets/models/Scyther.glb';
import pinsir from '../assets/models/Pinsir.glb';
import golem from '../assets/models/Golem.glb';
import rhydon from '../assets/models/Rhydon.glb';
import nidoking from '../assets/models/Nidoking.glb';
import nidoqueen from '../assets/models/Nidoqueen.glb';
import dragonite from '../assets/models/Dragonite.glb';
import aerodactyl from '../assets/models/Aerodactyl.glb';
import mewtwo from '../assets/models/Mewtwo.glb';
import articuno from '../assets/models/Articuno.glb';
const source={Pikachu:pikachu,Charmander:charmander,Squirtle:squirtle,Blastoise:blastoise,Charizard:charizard,Venusaur:venusaur,Bulbasaur:bulbasaur,Gengar:gengar,Alakazam:alakazam,Machamp:machamp,Eevee:eevee,Snorlax:snorlax,Arcanine:arcanine,Ninetales:ninetales,Rapidash:rapidash,Jolteon:jolteon,Raichu:raichu,Electabuzz:electabuzz,Vaporeon:vaporeon,Gyarados:gyarados,Lapras:lapras,Cloyster:cloyster,Scyther:scyther,Pinsir:pinsir,Golem:golem,Rhydon:rhydon,Nidoking:nidoking,Nidoqueen:nidoqueen,Dragonite:dragonite,Aerodactyl:aerodactyl,Mewtwo:mewtwo,Articuno:articuno};
const heights={Pikachu:2.55,Charmander:2.55,Squirtle:2.15,Blastoise:2.8,Charizard:3.3,Venusaur:2.65,Bulbasaur:2.0,Gengar:2.4,Alakazam:2.8,Machamp:3.1,Eevee:1.9,Snorlax:3.1,Arcanine:3.1,Ninetales:2.8,Rapidash:3.1,Jolteon:2.5,Raichu:2.8,Electabuzz:2.9,Vaporeon:2.8,Gyarados:4.5,Lapras:3.7,Cloyster:3,Scyther:3.2,Pinsir:3,Golem:3,Rhydon:3.6,Nidoking:3.2,Nidoqueen:3.2,Dragonite:3.6,Aerodactyl:3.3,Mewtwo:3.4,Articuno:3.7};
export async function loadCharacters(names=Object.keys(source)){
 const loader=new GLTFLoader(),assets=new Map();
 await Promise.all(names.map(async(name)=>{const bytes=source[name];
  const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const root=new T.Group(),pose=new T.Group();root.add(pose);pose.add(gltf.scene);
  const mixer=new T.AnimationMixer(gltf.scene),actions={};
  for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
  const upper=gltf.animations.find(a=>a.name==='attack').clone();
  upper.name='strike';
  upper.tracks=upper.tracks.filter(t=>/head|neck|spine|jaw|tongue|ear|eyelid|eyebrow|nose|shoulder|arm|hand|finger|wing|canon|cannon|feeler/i.test(t.name)&&t.name.endsWith('.quaternion'));
  T.AnimationUtils.makeClipAdditive(upper,0,gltf.animations.find(a=>a.name==='idle'));
  actions.strike=mixer.clipAction(upper);
  actions.idle.play();mixer.update(0);
  gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3());
  const scale=heights[name]/size.y;
  gltf.scene.position.y-=bounds.min.y;
  gltf.scene.position.x-=(bounds.max.x+bounds.min.x)/2;
  gltf.scene.position.z-=(bounds.max.z+bounds.min.z)/2;
  pose.scale.setScalar(scale);
  let bones=0,skinCount=0,textureCount=0;
  gltf.scene.traverse(o=>{
   if(/^lod[12]$/.test(o.name))o.visible=false;
   if(o.isBone)bones++;
   if(o.isSkinnedMesh){skinCount++;o.frustumCulled=false;}
   if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    for(const m of ms){if(m.map){textureCount++;m.map.anisotropy=8;}m.envMapIntensity=.4;}
   }
  });
  const rig={name,root,pose,mixer,actions,current:'idle',phase:0,speed:0,attackUntil:0,attackSerial:-1,lastX:null,lastY:null,height:heights[name],width:size.x*scale,depth:size.z*scale,bones,skinCount,textureCount,scale};
  assets.set(name,rig);
 }));
 return assets;
}
function transition(rig,name,duration=.14){
 if(rig.current===name)return;
 const next=rig.actions[name]||rig.actions.idle,previous=rig.actions[rig.current];
 next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
 if(previous)previous.crossFadeTo(next,duration,true);
 rig.current=name;
}
export function updateCharacter(rig,entity,dt,clock,active,paused){
 const root=rig.root;
 if(rig.entity!==entity){rig.entity=entity;rig.mixer.stopAllAction();rig.actions.idle.reset().play();rig.current='idle';rig.attackSerial=0;rig.attackUntil=0;rig.lastX=entity.x;rig.lastY=entity.y;rig.speed=0;}
 const dx=rig.lastX===null?0:entity.x-rig.lastX,dy=rig.lastY===null?0:entity.y-rig.lastY;
 const speed=dt>0?Math.hypot(dx,dy)/32/dt:0;
 rig.lastX=entity.x;rig.lastY=entity.y;
 root.position.set((entity.x-550)/32,0,(entity.y-377)/32);
 root.scale.setScalar(entity.boss?1.9:1.45);
 root.visible=true;
 if(paused)return;
 const filter=1-Math.exp(-dt*12);
 rig.speed=T.MathUtils.lerp(rig.speed,Math.min(speed,12),filter);
 let target=active?Math.atan2(entity.dx,entity.dy):(entity.boss?-.35:.3);
 const delta=Math.atan2(Math.sin(target-root.rotation.y),Math.cos(target-root.rotation.y));
 root.rotation.y+=T.MathUtils.clamp(delta,-dt*(entity.boss?5:10),dt*(entity.boss?5:10));
 const attacking=(entity.attackSerial||0)!==rig.attackSerial;
 if(attacking){rig.attackSerial=entity.attackSerial||0;if(entity.attackSerial&&(entity.attackCharged||clock>=rig.attackUntil-.06)){
   const a=rig.actions.strike;
   a.reset().setEffectiveWeight(entity.attackCharged?.85:.65).play();
   a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true;
   // Fit a complete skeletal attack into the rapid/charged animation window.
   const window=entity.attackCharged?.8:.55;
   a.setEffectiveTimeScale(a.getClip().duration/window);
   rig.attackUntil=clock+window;
 }}
 {
  const state=rig.speed>3.1?'run':rig.speed>.18?'walk':'idle';
  transition(rig,state,.16);
  const a=rig.actions[state];
  if(state!=='idle'){
   // Match clip cadence to distance travelled: fast small Pokémon take more steps;
   // heavy bosses keep a slower planted gait rather than sliding in idle pose.
   const stride=(entity.name==='Venusaur'?1.8:entity.name==='Charizard'?2.8:entity.boss?1.7:1.35)*root.scale.x;
   const cyclesPerSecond=Math.max(.4,rig.speed/stride);
   a.setEffectiveTimeScale(T.MathUtils.clamp(cyclesPerSecond*a.getClip().duration,.35,3.5));
  }
 }
 if(clock>rig.attackUntil)rig.actions.strike.setEffectiveWeight(0);
 rig.mixer.update(dt);
 // Banking is driven by turns, separate from the authored skeleton and foot cycle.
 const lean=T.MathUtils.clamp(-delta*rig.speed*.012,-.07,.07);
 rig.pose.rotation.z=T.MathUtils.lerp(rig.pose.rotation.z,lean,filter);
 rig.pose.rotation.x=T.MathUtils.lerp(rig.pose.rotation.x,entity.stun>0?-.1:0,filter);
}
export function rigDiagnostics(rig){return{name:rig.name,bones:rig.bones,skinnedMeshes:rig.skinCount,texturedMeshes:rig.textureCount,clips:Object.keys(rig.actions),state:rig.current,animationTime:rig.mixer.time};}

export function cloneCharacter(template){
 const root=cloneSkeleton(template.root),pose=root.children[0],scene=pose.children[0],mixer=new T.AnimationMixer(scene),actions={};
 for(const [name,action]of Object.entries(template.actions))actions[name]=mixer.clipAction(action.getClip());
 actions.idle.reset().play();mixer.update(0);
 return {...template,root,pose,mixer,actions,entity:null,current:'idle',lastX:null,lastY:null,speed:0,attackSerial:0,attackUntil:0};
}
