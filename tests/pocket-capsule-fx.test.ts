import {it,expect} from 'vitest';
import * as THREE from 'three';
import {createBattleFX} from '../src/games/pocket-capsule-monsters/battle-fx';
import type {BattleDrama} from '../src/games/pocket-capsule-monsters/drama';
const event:BattleDrama={kind:'attack',source:34,target:10,side:0,type:'fire',name:'Inferno Burst',damage:42,knockout:true,winner:null};
it('cuts behind the attacker, follows the projectile and restores the player camera',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(10,13,15);const original=camera.position.clone(),fx=createBattleFX(scene,camera,()=>undefined);
 fx.sample(event,.25);fx.update(1000);expect(camera.position.distanceTo(original)).toBeGreaterThan(1);const behind=camera.position.clone();fx.sample(event,.45);fx.update(1500);expect(camera.position.distanceTo(behind)).toBeGreaterThan(1);fx.sample(event,.6);fx.update(1700);expect(camera.position.toArray().every(Number.isFinite)).toBe(true);fx.sample(null,1);expect(camera.position.toArray()).toEqual(original.toArray());fx.dispose();expect(scene.children).toHaveLength(0);
});
it('keeps signature and victory effects finite, including a zero-length trajectory',()=>{const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),fx=createBattleFX(scene,camera,()=>undefined);for(const kind of ['charge','signature','victory'] as const)for(const p of [0,.4,.53,.8,1]){fx.sample({...event,kind,target:34,winner:kind==='victory'?0:null},p);fx.update(2000);expect(camera.position.toArray().every(Number.isFinite)).toBe(true);}fx.dispose();});
