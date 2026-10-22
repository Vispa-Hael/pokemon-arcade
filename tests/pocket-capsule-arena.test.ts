import {it,expect} from 'vitest';
import * as THREE from 'three';
import {tilePosition,pickArenaTile} from '../src/games/pocket-capsule-monsters/arena';

it('selects the correct tile through perspective, overhead and reverse cameras',()=>{
 const tiles=Array.from({length:64},(_,tile)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.24,.19,1.24),new THREE.MeshBasicMaterial());mesh.position.copy(tilePosition(tile));mesh.position.y=0;mesh.userData.tile=tile;mesh.updateMatrixWorld(true);return mesh;});
 const bounds={left:30,top:80,width:900,height:680};
 for(const position of [[10,13,15],[0,22,.1],[-10,13,-15]]){const camera=new THREE.PerspectiveCamera(40,bounds.width/bounds.height,.1,80);camera.position.set(...position as [number,number,number]);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
  for(const tile of [0,7,18,27,36,45,56,63]){const p=tilePosition(tile);p.y=.095;p.project(camera);expect(pickArenaTile(camera,tiles,bounds.left+(p.x+1)*bounds.width/2,bounds.top+(1-p.y)*bounds.height/2,bounds)).toBe(tile);}
  expect(pickArenaTile(camera,tiles,0,0,bounds)).toBeUndefined();
 }
 tiles.forEach(t=>{t.geometry.dispose();t.material.dispose();});
});

it('clicking a raised Pokémon selects its own tile rather than the ground behind it',()=>{
 const group=new THREE.Group();group.userData.tile=50;group.position.copy(tilePosition(50));const body=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.5),new THREE.MeshBasicMaterial());body.position.y=.7;group.add(body);group.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(10,13,15);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);const p=body.getWorldPosition(new THREE.Vector3()).project(camera);
 expect(pickArenaTile(camera,[group],(p.x+1)*400,(1-p.y)*400,{left:0,top:0,width:800,height:800})).toBe(50);body.geometry.dispose();body.material.dispose();
});

it('ignores invisible hit particles when selecting a ground tile',()=>{
 const tile=new THREE.Mesh(new THREE.BoxGeometry(1.24,.19,1.24),new THREE.MeshBasicMaterial());tile.userData.tile=38;tile.position.copy(tilePosition(38));tile.updateMatrixWorld(true);
 const particles=new THREE.Points(new THREE.BufferGeometry().setFromPoints([tile.position.clone().add(new THREE.Vector3(0,1,0))]),new THREE.PointsMaterial({opacity:0,transparent:true}));particles.userData.tile=54;particles.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(tile.position.x,20,tile.position.z+.001);camera.lookAt(tile.position);camera.updateMatrixWorld(true);
 expect(pickArenaTile(camera,[particles,tile],400,400,{left:0,top:0,width:800,height:800})).toBe(38);
 tile.geometry.dispose();tile.material.dispose();particles.geometry.dispose();particles.material.dispose();
});
