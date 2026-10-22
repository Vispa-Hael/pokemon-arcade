import {assetUrl} from './urls';
import type {GameModule} from './game';
export function legacyMount(id:string):GameModule['mount'] {return (host,context)=>{
 if(!context.legacyAvailable[id]){host.innerHTML='<div class="notice"><h2>Local game unavailable</h2><p>Restore the sibling game folder and its browser files, then reload the arcade. See README for the expected paths.</p></div>';return;}
 host.innerHTML=`<div class="notice">${id==='pokemon-skate'?'Standalone 3D skate park · WebGL 2 required.':id==='arena'?'Desktop keyboard prototype · WebGL 2 required.':'Local chess · WebGL preferred; artwork fallback available.'} Existing game saves and settings remain managed by the original game.</div><button class="primary" id="launch-legacy">Launch game ↗</button><div id="legacy-frame"></div>`;
 let finishSession:(()=>void)|undefined;
 host.querySelector('button')!.onclick=()=>{
 finishSession?.();finishSession=context.player.startSession(id);
 context.player.visit(id);
 (host.querySelector('.notice') as HTMLElement).hidden=true;host.querySelector('button')!.hidden=true;
 const frame=document.createElement('iframe');frame.title=id==='pokemon-skate'?'Pokémon Skate':id==='chess'?'Pokémon Chess':'Pokémon Arena';frame.src=assetUrl(`legacy/${id}/index.html`);frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');frame.allow='fullscreen';
 const loading=document.createElement('p');loading.textContent='Loading local game…';loading.role='status';host.querySelector('#legacy-frame')!.replaceChildren(loading,frame);frame.onload=()=>{loading.textContent='Game loaded. If graphics cannot start, check the message inside the game.';loading.className='sr-only';};frame.focus();
 };
 return ()=>{finishSession?.();host.querySelector('iframe')?.remove();};
};}

