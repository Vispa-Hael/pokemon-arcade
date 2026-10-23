import {readFeatures} from '../src/games/pocket-capsule-monsters/config';
import {it,expect} from 'vitest';
import * as THREE from 'three';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {locations,locationFor} from '../src/games/pocket-capsule-monsters/locations';
import {roster,createMatch,validMatch,aiStep,battleWalls,battleForests} from '../src/games/pocket-capsule-monsters/rules';
import {scenicPose,directorPose} from '../src/games/pocket-capsule-monsters/scenic-camera';
import {createLandscape} from '../src/games/pocket-capsule-monsters/landscape';
const pool=roster(new CharacterDatabase(raw as Catalog));
for(const location of locations){
 it(`${location.name} has fair, connected terrain and finishes a legal battle`,()=>{
  const s=createMatch(pool,[1,4,7,25],'ai',undefined,location.id);expect(validMatch(JSON.parse(JSON.stringify(s)))).toBe(true);const walls=battleWalls(s),cover=battleForests(s);expect(walls).toEqual(location.walls);for(const tiles of [walls,cover])for(const n of tiles){expect(tiles).toContain(63-n);expect([4,59,...s.units.map(u=>u.y*8+u.x)]).not.toContain(n);}expect(walls.some(n=>cover.includes(n))).toBe(false);
  const seen=new Set([0]),queue=[0];while(queue.length){const n=queue.shift()!;for(const m of [n-8,n+8,...(n%8?[n-1]:[]),...(n%8<7?[n+1]:[])])if(m>=0&&m<64&&!walls.includes(m)&&!seen.has(m)){seen.add(m);queue.push(m);}}expect(seen.size).toBe(64-walls.length);
  for(let i=0;i<2000&&s.winner===null;i++){aiStep(s);expect(validMatch(s)).toBe(true);}expect(s.winner).not.toBeNull();expect(battleWalls({...s,features:{...readFeatures({}),terrain:false}})).toEqual([]);
 });
 it(`${location.name} builds finite scenery and disposes its resources`,()=>{
  const scene=new THREE.Scene(),landscape=createLandscape(location.id),camera=new THREE.PerspectiveCamera();camera.position.set(10,13,15);scene.add(landscape.group);for(const reduced of [false,true])landscape.update(5,camera,reduced);let count=0;landscape.group.traverse(o=>{count++;expect(o.position.toArray().every(Number.isFinite)).toBe(true);if(o instanceof THREE.Mesh){o.geometry.computeBoundingSphere();expect(Number.isFinite(o.geometry.boundingSphere!.radius)).toBe(true);}});expect(count).toBeGreaterThan(70);landscape.dispose();expect(scene.children).toHaveLength(0);expect(landscape.group.children).toHaveLength(0);
 });
}
it('keeps old saves in Verdant Ruins and rejects unknown locations',()=>{const s=createMatch(pool,[1,4,7,25],'ai');delete s.location;expect(validMatch(s)).toBe(true);expect(locationFor(s.location).id).toBe('verdant-ruins');expect(validMatch({...s,location:'missing'})).toBe(false);});
it('sweeps opposite sides and stays finite across every camera pose',()=>{for(let i=0;i<=100;i++){const pose=scenicPose(i/100);expect([...pose.position.toArray(),...pose.target.toArray(),...directorPose(i).position.toArray()].every(Number.isFinite)).toBe(true);expect(pose.position.y).toBeGreaterThan(4);}expect(scenicPose(0).position.x).toBeGreaterThan(0);expect(scenicPose(.5).position.x).toBeLessThan(0);expect(scenicPose(-1)).toEqual(scenicPose(0));expect(scenicPose(2)).toEqual(scenicPose(1));});
