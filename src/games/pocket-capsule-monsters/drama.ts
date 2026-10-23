import {fighter,capsule,type Match} from './rules';
export interface BattleDrama {kind:'attack'|'signature'|'charge'|'victory';source:number;target:number;side:number;type:string;name:string;damage:number;knockout:boolean;winner:number|null}
export const attackNames:Record<string,string>={fire:'Inferno Burst',water:'Tidal Cannon',electric:'Thunder Surge',grass:'Verdant Strike',ghost:'Phantom Blade',steel:'Royal Slash',normal:'Wild Rush',poison:'Venom Pulse',flying:'Sky Breaker'};
export function intensity(s:Match):number{if(s.winner!==null)return 0;const health=Math.min(...s.capsules)/160;const survivors=Math.min(...[0,1].map(side=>s.units.filter(u=>u.side===side&&u.hp>0).length));return Math.max(1-health,survivors<=2?.75:0,Math.min(.6,s.turn/35),s.charges?.length?.85:0);}
export function describeDrama(before:Match,after:Match):BattleDrama|undefined{
 const charged=after.charges?.find(c=>!before.charges?.some(b=>b.key===c.key));
 const released=before.charges?.find(c=>!after.charges?.some(b=>b.key===c.key)&&before.units.some(u=>u.key===c.key&&u.hp>0)&&after.turn>=c.due);
 const victim=after.units.find(v=>v.hp<before.units.find(u=>u.key===v.key)!.hp);
 const capSide=after.capsules.findIndex((hp,i)=>hp<before.capsules[i]);
 const attacker=before.units.find(u=>!u.acted&&after.units.find(v=>v.key===u.key)?.acted);
 const caster=before.units.find(u=>u.key===(charged??released)?.key)??attacker;
 if(caster&&(charged||released||victim||capSide>=0)){const f=fighter(before,caster),type=f.types[0];const target=charged?.tile??released?.tile??(victim?victim.y*8+victim.x:capsule(capSide).y*8+capsule(capSide).x);return {kind:charged?'charge':released?'signature':'attack',source:caster.y*8+caster.x,target,side:caster.side,type,name:attackNames[type]??'Capsule Strike',damage:before.units.reduce((n,u)=>n+u.hp-after.units.find(v=>v.key===u.key)!.hp,0)+before.capsules.reduce((n,hp,i)=>n+hp-after.capsules[i],0),knockout:after.units.some(u=>u.hp===0&&before.units.find(v=>v.key===u.key)!.hp>0),winner:after.winner};}
}
export function victoryDrama(s:Match):BattleDrama{const side=s.winner===1?1:0,u=s.units.find(u=>u.side===side&&u.hp>0),target=capsule(1-side);return {kind:'victory',source:u?u.y*8+u.x:59,target:target.y*8+target.x,side,type:'normal',name:s.winner===-1?'An honorable draw':`${side===0?'Azure':'Amber'} victory`,damage:0,knockout:false,winner:s.winner};}

/** Presentation only: state is already committed; skipping never applies combat twice. */
export function playDrama(getRoot:()=>HTMLElement,event:BattleDrama,reduced:boolean,onFrame:(progress:number)=>void,onImpact:()=>void,onDone:()=>void):()=>void{
 const overlay=document.createElement('div');overlay.className='pcm-drama';overlay.setAttribute('role','region');overlay.setAttribute('aria-label','Battle action');
 const title=document.createElement('h2'),detail=document.createElement('p'),skip=document.createElement('button');skip.textContent='Skip action →';skip.className='pcm-drama-skip';title.textContent=event.kind==='victory'?event.name:event.kind==='charge'?'Signature charging':event.name+(event.kind==='signature'?' · SIGNATURE':'');detail.textContent=event.kind==='charge'?'The marked tiles erupt after the opponent’s reply.':event.kind==='victory'?(event.winner===-1?'Both squads held their ground.':'The coliseum belongs to your squad.'):`${event.damage} damage${event.knockout?' · KNOCKOUT':''}`;overlay.append(title,detail,skip);
 let timer:ReturnType<typeof setTimeout>|undefined,closed=false,impacted=false;const start=performance.now(),duration=reduced?500:event.kind==='victory'?4200:event.kind==='charge'?1400:event.knockout?2900:2200;const focus=document.activeElement as HTMLElement|null;
 function impact(){if(!impacted){impacted=true;onImpact();}}
 function finish(){if(closed)return;closed=true;clearTimeout(timer);document.removeEventListener('keydown',escape);impact();onFrame(1);overlay.remove();onDone();if(focus?.isConnected)focus.focus({preventScroll:true});}
 function tick(){if(closed)return;const p=Math.min(1,(performance.now()-start)/duration);if(p>=.52)impact();const root=getRoot(),board=root.querySelector<HTMLElement>('.pcm-board');root.append(overlay);if(board){const b=board.getBoundingClientRect(),r=root.getBoundingClientRect();Object.assign(overlay.style,{left:(b.left-r.left)+'px',top:(b.top-r.top)+'px',width:b.width+'px',height:b.height+'px'});}overlay.dataset.phase=p<.52?'windup':'impact';onFrame(p);if(p>=1)finish();else timer=setTimeout(tick,16);}
 const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();finish();}};document.addEventListener('keydown',escape);skip.onclick=finish;tick();skip.focus({preventScroll:true});
 return ()=>{if(closed)return;closed=true;clearTimeout(timer);document.removeEventListener('keydown',escape);overlay.remove();};
}
