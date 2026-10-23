import * as THREE from 'three';
export function scenicPose(progress:number,reverse=false):{position:THREE.Vector3;target:THREE.Vector3}{
 const p=THREE.MathUtils.clamp(progress,0,1),sign=reverse?-1:1;
 // A crane reveal, an opposite-side low pass, then a settle into tactical perspective.
 const path=new THREE.CatmullRomCurve3([new THREE.Vector3(19,16,19),new THREE.Vector3(15,7,-3),new THREE.Vector3(-12,6,-14),new THREE.Vector3(-14,12,8),new THREE.Vector3(10,13,15)]);
 const position=path.getPoint(p);position.x*=sign;position.z*=sign;
 return {position,target:new THREE.Vector3(0,p>.7?0:.6,0)};
}
export function directorPose(seconds:number){const angle=seconds*.085+.6;return {position:new THREE.Vector3(Math.sin(angle)*18,10.5+Math.sin(seconds*.05)*2.3,Math.cos(angle)*18),target:new THREE.Vector3(0,.25,0)};}
