import * as THREE from 'three';
import type {LocationId} from './locations';

/** Original procedural scenery; all terrain outside the grid is decorative. */
export function createLandscape(id:LocationId){
 const group=new THREE.Group();group.name='landscape-'+id;
 const resources=new Set<THREE.BufferGeometry|THREE.Material>();const cutaways:THREE.Mesh[]=[];
 const animated:((time:number)=>void)[]=[];let seed=571;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function mat(color:number,glow=0,opacity=1){const m=new THREE.MeshStandardMaterial({color,roughness:.9,emissive:glow,emissiveIntensity:glow?.9:0,transparent:opacity<1,opacity});resources.add(m);return m;}
 function mesh(geo:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,cutaway=false){resources.add(geo);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);if(cutaway)cutaways.push(o);return o;}
 const rockGeo=new THREE.IcosahedronGeometry(1,1);resources.add(rockGeo);
 function rock(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,cutaway=false){const o=mesh(rockGeo,mat(color),x,y,z,cutaway);o.scale.set(sx,sy,sz);o.rotation.set(random(),random()*6,random()*.3);return o;}
 function cone(x:number,y:number,z:number,r:number,h:number,color:number,glow=0,cutaway=false){return mesh(new THREE.ConeGeometry(r,h,6),mat(color,glow),x,y,z,cutaway);}
 function fluid(lava:boolean){const geometry=new THREE.RingGeometry(5.8,36,128,20);geometry.rotateX(-Math.PI/2);const material=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec3 p; uniform float time; void main(){p=position;vec3 v=position;v.y+=sin(v.x*.7+time)*cos(v.z*.6+time*.7)*${lava?'.025':'.065'};gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,fragmentShader:lava?`varying vec3 p;uniform float time;void main(){float a=sin(p.x*1.1+sin(p.z*.8+time*.35)*2.);float b=cos(p.z*1.5+sin(p.x*.6-time*.25));float seam=smoothstep(.15,.8,a*b);vec3 c=mix(vec3(.16,.035,.025),vec3(1.,.27,.015),seam);float hot=smoothstep(.85,1.,a*b);gl_FragColor=vec4(c+hot*vec3(.6,.4,.1),1.);}`:`varying vec3 p;uniform float time;void main(){float a=sin(p.x*2.+sin(p.z*1.3+time*.7));float b=sin(p.z*2.1+sin(p.x*.9-time*.5));float glow=pow(abs(a*b),10.);vec3 c=mix(vec3(.015,.12,.19),vec3(.03,.36,.43),.5+.3*sin(p.z*.15+time*.2));gl_FragColor=vec4(c+glow*vec3(.10,.36,.31),1.);}`,side:THREE.DoubleSide});resources.add(geometry);resources.add(material);const surface=mesh(geometry,material,0,-1.45,0);surface.receiveShadow=false;surface.castShadow=false;animated.push(t=>material.uniforms.time.value=t);return surface;}
 function particles(color:number,up:boolean){const data=new Float32Array(180*3),starts:number[]=[];for(let i=0;i<180;i++){const a=random()*Math.PI*2,r=7+random()*19;data[i*3]=Math.cos(a)*r;data[i*3+1]=random()*13;data[i*3+2]=Math.sin(a)*r;starts.push(data[i*3+1]);}const geo=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(data,3));const m=new THREE.PointsMaterial({color,size:up?.065:.08,transparent:true,opacity:.65,depthWrite:false});resources.add(geo);resources.add(m);const points=new THREE.Points(geo,m);group.add(points);animated.push(t=>{for(let i=0;i<180;i++)data[i*3+1]=up?(starts[i]+t*.38)%13:starts[i]+Math.sin(t*.6+i)*.18;geo.attributes.position.needsUpdate=true;});}
 function arch(angle:number,radius:number,color:number){const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-angle;group.add(g);const m=mat(color);for(const dx of [-1.3,1.3]){const geo=new THREE.BoxGeometry(.65,4.5,.8);resources.add(geo);const leg=new THREE.Mesh(geo,m);leg.position.set(dx,1.1,0);leg.castShadow=true;g.add(leg);}const geo=new THREE.TorusGeometry(1.3,.34,8,24,Math.PI);resources.add(geo);const top=new THREE.Mesh(geo,m);top.position.y=3.3;g.add(top);}

 if(id==='volcano-summit'){
  fluid(true);
  for(let i=0;i<50;i++){const a=i/50*Math.PI*2,r=14+random()*4;rock(Math.cos(a)*r,-.2,Math.sin(a)*r,2+random()*2,1.3+random()*3.5,2+random()*2,0x302731,true);}
  // Interlocking hexagonal basalt supports make the arena feel rooted in the crater.
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=6.6+random()*.8,h=1.2+random()*2;const o=mesh(new THREE.CylinderGeometry(.52,.65,h,6),mat(0x3b343d),Math.cos(a)*r,-h/2-.8,Math.sin(a)*r);o.rotation.y=a;}
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=10.5,x=Math.cos(a)*r,z=Math.sin(a)*r;cone(x,-.7,z,.65,1.5,0x56313a);const vent=mesh(new THREE.TorusGeometry(.4,.055,7,24),mat(0xffb34b,0xff4713),x,-.08,z);vent.rotation.x=Math.PI/2;
   for(let j=0;j<4;j++){const smoke=mesh(new THREE.SphereGeometry(.7+j*.25,8,6),mat(0x6f525b,0,.11),x,1+j*.8,z);smoke.castShadow=false;animated.push(t=>{smoke.position.y=1+j*.8+Math.sin(t*.3+j)*.2;smoke.position.x=x+Math.sin(t*.2+j)*.3;});}}
  for(const x of [-8,8]){const light=new THREE.PointLight(0xff5520,12,20,2);light.position.set(x,-.1,1);group.add(light);animated.push(t=>light.intensity=10+Math.sin(t*1.7+x)*1.5);}
  particles(0xffa351,true);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=32;cone(Math.cos(a)*r,2,Math.sin(a)*r,5,8+random()*9,0x382632);}
 }else if(id==='tidal-grotto'){
  fluid(false);
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2,r=14.5+random()*2,h=3+random()*4;rock(Math.cos(a)*r,h/2-1.5,Math.sin(a)*r,2.2,h,2.5,0x334956,true);}
  for(let i=0;i<26;i++){const a=i/26*Math.PI*2,r=11.8+random()*4;const spike=cone(Math.cos(a)*r,7+random()*2,Math.sin(a)*r,.35+random()*.5,2+random()*2,0x4f6970,0,true);spike.rotation.z=Math.PI;}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=8.2+random()*2,x=Math.cos(a)*r,z=Math.sin(a)*r;for(let j=0;j<3;j++){const crystal=cone(x+(j-1)*.35,.3+j*.2,z,.25,.9+random()*.7,j%2?0x9575bd:0x52b7c3,0x245b71);crystal.rotation.z=(j-1)*.22;}}
  for(const a of [-2.6,-1.4,-.2]){const x=Math.cos(a)*12.5,z=Math.sin(a)*12.5;const geometry=new THREE.PlaneGeometry(1.25,7,4,20);const material=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 v;uniform float time;void main(){v=uv;vec3 p=position;p.z+=sin(uv.y*18.+time*3.)*.05;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying vec2 v;uniform float time;void main(){float s=.5+.5*sin(v.x*55.+sin(v.y*10.-time*6.));float a=sin(v.x*3.14159)*(.35+s*.4);gl_FragColor=vec4(.22+s*.4,.7+s*.2,.9,a);}',transparent:true,side:THREE.DoubleSide,depthWrite:false});resources.add(material);const waterfall=mesh(geometry,material,x,1.9,z);waterfall.lookAt(0,1.9,0);waterfall.castShadow=false;animated.push(t=>material.uniforms.time.value=t);for(let j=0;j<3;j++){const ripple=mesh(new THREE.TorusGeometry(.5+j*.32,.025,6,40),mat(0x83dcd9,0x1e544c,.45),x,-1.25,z);ripple.rotation.x=Math.PI/2;animated.push(t=>ripple.scale.setScalar(1+Math.sin(t*1.4+j)*.12));}}
  for(const x of [-8,8]){const light=new THREE.PointLight(x<0?0x45bfee:0x69ffcf,9,22,2);light.position.set(x,2,0);group.add(light);}
  particles(0x9cefe2,false);
 }else{
  fluid(false);
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=14+random()*3;rock(Math.cos(a)*r,-.5,Math.sin(a)*r,2.5,1+random()*2,2,0x3b5b4e);for(let j=0;j<2;j++)cone(Math.cos(a)*r+j*.7,1.5,Math.sin(a)*r,.9,3,0x315b43);}
  for(const a of [-2.4,-1,.5,2])arch(a,10,0x7e9181);
  for(let i=0;i<34;i++){const a=i/34*Math.PI*2,r=7.8+random()*1.8;const o=rock(Math.cos(a)*r,-.7,Math.sin(a)*r,.6,.25,.45,0x647b66);o.rotation.y=a;}
  for(let i=0;i<26;i++){const a=random()*Math.PI*2,r=7+random()*3;cone(Math.cos(a)*r,-.3,Math.sin(a)*r,.25,.65,0x66916b);const flower=mesh(new THREE.IcosahedronGeometry(.075,0),mat(i%2?0xdca6bf:0xf3df9a),Math.cos(a)*r,.08,Math.sin(a)*r);flower.castShadow=false;}
  particles(0xc0dfaa,false);
 }
 return {group,update(time:number,camera:THREE.Camera,reduced:boolean){for(const f of animated)f(reduced?0:time);for(const o of cutaways){const m=o.material as THREE.MeshStandardMaterial;const p=o.getWorldPosition(new THREE.Vector3()),c=camera.position;const aligned=(p.x*c.x+p.z*c.z)/(Math.hypot(p.x,p.z)*Math.hypot(c.x,c.z)||1);const fade=aligned>.4&&Math.hypot(c.x,c.z)>Math.hypot(p.x,p.z)-2;m.transparent=fade;m.opacity=fade?.13:1;m.depthWrite=!fade;}},dispose(){group.removeFromParent();for(const r of resources)r.dispose();group.clear();}};
}
