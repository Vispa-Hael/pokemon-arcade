import type {Run} from './rules';
import {clamp,finish} from './rules';

// One shared world-to-screen mapping for vehicles, obstacles, shooters and bullets.
export function project(lane:number,ahead:number,height=600,width=960){return {x:width/2+lane*150+ahead*.16,y:height*.8-ahead*(height*.68/220),scale:1};}
export const sceneryAhead=(offset:number,distance:number)=>((offset-distance)%260+260)%260;
export const beastY=(gap:number,height=600)=>height*.8+30+clamp(gap,0,160)*height*.0008;

export const beastScale=(gap:number)=>.45+(1-clamp(gap,0,160)/160)*.55;

export function draw(ctx:CanvasRenderingContext2D,s:Run,reducedMotion:boolean,portraits?:Map<number,HTMLImageElement>){
 const height=ctx.canvas.height,width=ctx.canvas.width;
 const camera=(lane:number,ahead:number)=>project(lane,ahead,height,width);
 ctx.clearRect(0,0,width,height);
 const poly=(points:number[][],fill:string)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 const text=(value:string,x:number,y:number,color='#edf6d8',size=14)=>{ctx.fillStyle=color;ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.fillText(value,x,y);};
 const circle=(x:number,y:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
 const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#153f37');gradient.addColorStop(1,'#071f25');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 const far=camera(0,270),near=camera(0,-70);
 poly([[far.x-248,far.y],[far.x+248,far.y],[near.x+248,near.y],[near.x-248,near.y]],'#75634a');
 poly([[far.x-225,far.y],[far.x+225,far.y],[near.x+225,near.y],[near.x-225,near.y]],'#b6a16d');
 for(const lane of [-1,0,1]){const a=camera(lane,270),b=camera(lane,-70);poly([[a.x-72,a.y],[a.x+72,a.y],[b.x+72,b.y],[b.x-72,b.y]],lane===s.target?'#d1b97e':'#bea774');}
 for(let i=0;i<13;i++){
  const ahead=sceneryAhead(i*22,reducedMotion?0:s.distance),p=camera(0,ahead);
  for(const lane of [-.5,.5]){const q=camera(lane,ahead);ctx.fillStyle='#f1dca280';ctx.fillRect(q.x-2,q.y-11,4,22);}
  for(const side of [-1,1]){
   const x=p.x+side*(310+(i%3)*48),y=p.y;
   ctx.fillStyle='#09281f';ctx.fillRect(x-9,y-75,18,85);
   poly([[x-62,y-20],[x-20,y-91],[x,y-116],[x+62,y-20]],i%2?'#205744':'#2e6950');
   poly([[x-42,y-65],[x,y-140],[x+40,y-65]],'#367b56');
   ctx.strokeStyle='#639168';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-15,y-65);ctx.lineTo(x,y-110);ctx.stroke();
  }
 }
 const gateAhead=finish-s.distance;
 if(gateAhead<240){const g=camera(0,gateAhead);ctx.fillStyle='#63766a';ctx.fillRect(g.x-238,g.y-95,24,125);ctx.fillRect(g.x+214,g.y-95,24,125);ctx.fillStyle='#224e43';ctx.fillRect(g.x-235,g.y-115,470,43);text('RIVER GATE',g.x,g.y-86,'#e7ecb5',23);ctx.strokeStyle='#d8ddbd';ctx.lineWidth=3;ctx.setLineDash([12,12]);ctx.beginPath();ctx.moveTo(g.x-218,g.y);ctx.lineTo(g.x+218,g.y);ctx.stroke();ctx.setLineDash([]);}
 for(const e of s.events.slice(s.next).filter(e=>e.at-s.distance<245).reverse()){
  if(e.kind==='high'||e.kind==='low')continue;
  const p=camera(e.lane,e.at-s.distance);
  ctx.fillStyle='#1c262a44';ctx.beginPath();ctx.ellipse(p.x,p.y+10,52,18,0,0,Math.PI*2);ctx.fill();
  if(e.kind==='supply'){poly([[p.x-28,p.y-30],[p.x+22,p.y-37],[p.x+32,p.y+12],[p.x-24,p.y+20]],'#4f8a52');ctx.strokeStyle='#c6eba6';ctx.lineWidth=4;ctx.strokeRect(p.x-22,p.y-26,42,37);ctx.fillStyle='#ecf4c5';ctx.fillRect(p.x-6,p.y-23,11,30);ctx.fillRect(p.x-16,p.y-13,31,10);text('SUPPLY',p.x,p.y+40,'#f0efc2',13);}
  if(e.kind==='rock'){poly([[p.x-40,p.y+10],[p.x-34,p.y-25],[p.x-4,p.y-45],[p.x+34,p.y-25],[p.x+43,p.y+11]],'#55666a');poly([[p.x-34,p.y-25],[p.x-4,p.y-45],[p.x+4,p.y]],'#94a5a0');text('ROCK',p.x,p.y+32,'#2c3c38',12);}
  if(e.kind==='log'){ctx.fillStyle='#6e412d';ctx.fillRect(p.x-56,p.y-14,112,30);ctx.strokeStyle='#a2744d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-48,p.y-5);ctx.lineTo(p.x+48,p.y-5);ctx.stroke();ctx.fillStyle='#e6bb7c';ctx.beginPath();ctx.ellipse(p.x+51,p.y,9,15,0,0,Math.PI*2);ctx.fill();text('LOG',p.x,p.y+35,'#2c3c38',12);}
  if(e.kind==='mud'){ctx.fillStyle='#72512e';ctx.beginPath();ctx.ellipse(p.x,p.y,64,30,-.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a1844c';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x+8,p.y-3,31,11,-.1,0,Math.PI*2);ctx.stroke();text('MUD',p.x,p.y+7,'#ead59b',12);}
 }
 for(const enemy of s.enemies){
  const ahead=enemy.at-s.distance;if(enemy.hp<=0||ahead < -30||ahead>240)continue;
  const p=camera(enemy.lane,ahead),base=enemy.height==='high'?-42:0;
  if(enemy.height==='high'){ctx.fillStyle='#725339';ctx.fillRect(p.x-23,p.y-43,46,9);for(const dx of [-17,12])ctx.fillRect(p.x+dx,p.y-34,6,40);}
  ctx.strokeStyle='#172c30';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.x-7,p.y+base-14);ctx.lineTo(p.x-13,p.y+base+4);ctx.moveTo(p.x+7,p.y+base-14);ctx.lineTo(p.x+12,p.y+base+4);ctx.stroke();
  ctx.fillStyle='#b9544c';ctx.fillRect(p.x-16,p.y+base-42,32,30);circle(p.x,p.y+base-54,13,'#dfbc94');ctx.fillStyle='#292b31';ctx.fillRect(p.x-15,p.y+base-59,30,8);
  const aim=camera(enemy.aim,0),dx=aim.x-p.x,dy=aim.y-(p.y+base-25),len=Math.hypot(dx,dy);ctx.strokeStyle='#253238';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.x,p.y+base-25);ctx.lineTo(p.x+dx/len*35,p.y+base-25+dy/len*35);ctx.stroke();
  ctx.fillStyle='#251f26';ctx.fillRect(p.x-34,p.y+base-80,68,7);ctx.fillStyle='#fa8f74';ctx.fillRect(p.x-34,p.y+base-80,68*enemy.hp/enemy.maxHp,7);text(enemy.mount==='front'?'FRONT':'SIDE',p.x,p.y+base-90,'#f5e9c6',12);
  if(enemy.timer<.75){circle(p.x+24,p.y+base-55,7,'#ffcd72');const q=camera(enemy.aim,30);ctx.strokeStyle=enemy.height==='high'?'#ffe399':'#ff9f8d';ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.strokeRect(q.x-56,q.y-32,112,55);ctx.setLineDash([]);text(enemy.height==='high'?'HIGH · Q':'LOW · E',q.x,q.y-42,ctx.strokeStyle as string,13);}
 }
 // Pack rises into the caravan's rear as the gap closes; it no longer disappears.
 for(let i=0;i<5;i++){const x=width/2+(i-2)*85+s.lane*25,y=beastY(s.gap,height)+(i%2)*10;ctx.save();ctx.translate(x,y);ctx.scale(beastScale(s.gap),beastScale(s.gap));poly([[-25,0],[-23,-25],[-15,-43],[-5,-30],[13,-43],[25,-22],[28,0]],'#172a32');circle(-9,-24,3,'#f5a95b');circle(7,-24,3,'#f5a95b');ctx.restore();}
 const p=camera(s.lane,0),x=p.x,y=p.y;
 ctx.fillStyle='#15282a77';ctx.beginPath();ctx.ellipse(x,y+31,68,30,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#243737';for(const dx of [-56,43])for(const dy of [-32,20])ctx.fillRect(x+dx,y+dy,15,28);
 poly([[x-50,y-57],[x+39,y-68],[x+56,y+32],[x-43,y+43]],'#d8b45e');poly([[x-43,y+43],[x+56,y+32],[x+56,y+49],[x-43,y+60]],'#79543a');poly([[x+39,y-68],[x+56,y+32],[x+56,y+49],[x+40,y-48]],'#9e703b');
 poly([[x-41,y-48],[x+32,y-57],[x+39,y-19],[x-34,y-10]],'#3d8a7b');ctx.fillStyle='#153b40';ctx.fillRect(x-23,y-45,43,24);text('CARAVAN',x+1,y+20,'#fff3c9',11);
 const gunner=(slot:number,gx:number,gy:number,color:string)=>{circle(gx,gy,21,'#224b40');ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(gx,gy,21,0,Math.PI*2);ctx.stroke();const img=portraits?.get(s.team[slot].id);if(img?.complete&&img.naturalWidth>0)ctx.drawImage(img,gx-22,gy-22,44,44);else text(s.team[slot].name[0],gx,gy+6,color,20);};
 gunner(4,x+4,y-61,s.m.front.color);gunner(5,x-32,y-2,s.m.side.color);
 ctx.strokeStyle=s.m.front.color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+4,y-78);ctx.lineTo(x+4,y-96);ctx.stroke();ctx.strokeStyle=s.m.side.color;ctx.beginPath();ctx.moveTo(x-49,y);ctx.lineTo(x-77,y-4);ctx.moveTo(x+45,y-7);ctx.lineTo(x+72,y-12);ctx.stroke();
 for(const mount of ['front','side'] as const)if(s.ticks-s.lastFire[mount]<6){const mx=mount==='front'?x+4:x+(s.fireCount.side%2?-79:76),my=mount==='front'?y-99:y-6;circle(mx,my,9,s.m[mount].color);circle(mx,my,4,'#fffae0');}
 if(s.cover){ctx.strokeStyle=s.cover==='high'?'#ffe399':'#8aebef';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,y-15,80,87,0,Math.PI,Math.PI*2);ctx.stroke();text(s.cover==='high'?'HIGH COVER':'LOW COVER',x,y-116,ctx.strokeStyle as string,14);}
 if(s.mud>0)text('MUD DRAG',x,y+80,'#f5db9e',14);
 for(const shot of s.shots){
  const progress=1-shot.remaining/shot.duration,tail=Math.max(0,progress-.15);
  const position=(t:number)=>{const q=camera(shot.fromLane+(shot.toLane-shot.fromLane)*t,shot.fromAt+(shot.toAt-shot.fromAt)*t-s.distance);const startHeight=shot.owner==='crew'?(shot.mount==='front'?55:15):(shot.height==='high'?70:28);const endHeight=shot.owner==='crew'?(shot.height==='high'?70:28):20;return {x:q.x,y:q.y-(startHeight+(endHeight-startHeight)*t)};};
  const head=position(progress),back=position(tail);ctx.lineCap='round';ctx.strokeStyle=shot.owner==='robber'?'#3e1523':'#183a38';ctx.lineWidth=shot.owner==='robber'?13:10;ctx.beginPath();ctx.moveTo(back.x,back.y);ctx.lineTo(head.x,head.y);ctx.stroke();ctx.strokeStyle=shot.color;ctx.lineWidth=shot.owner==='robber'?7:5;ctx.stroke();circle(head.x,head.y,shot.owner==='robber'?5:3,'#fff5c9');ctx.lineCap='butt';
 }
 for(const impact of s.impacts){const p=camera(impact.lane,impact.at-s.distance);ctx.strokeStyle=impact.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-35,12+(1-impact.remaining/.45)*23,0,Math.PI*2);ctx.stroke();text(impact.text,p.x,p.y-66,impact.color,20);}
 if(s.burst>0){ctx.strokeStyle='#e9ef9d';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-10,85,91,0,0,Math.PI*2);ctx.stroke();}
 if(s.hitFlash>0){ctx.strokeStyle='#ff826e';ctx.lineWidth=8;ctx.strokeRect(4,4,width-8,height-8);}
}
