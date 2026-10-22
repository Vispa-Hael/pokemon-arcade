import {assetUrl} from '../../shared/urls';
import type {Fighter} from './rules';

export interface SequenceBeat {title:string;subtitle:string;form?:Fighter}
/** A cancellable presentation sequence. Battle state never advances inside a cutscene. */
export function playSequence(root:HTMLElement,beats:SequenceBeat[],reduced:boolean,sync:()=>void,done:()=>void,showScenery=true):()=>void{
 let timer:ReturnType<typeof setTimeout>|undefined,index=0,closed=false;
 const focus=document.activeElement as HTMLElement|null;
 const overlay=document.createElement('div');overlay.className='pcm-cinema';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Battle cinematic');
 const scenery=document.createElement('div');scenery.className='pcm-flyover';scenery.setAttribute('aria-hidden','true');
 const board=showScenery?root.querySelector('.pcm-board')?.cloneNode(true) as HTMLElement|undefined:undefined;
 if(board){board.querySelectorAll<HTMLElement>('[data-model]').forEach(el=>{for(const key of Object.keys(el.dataset))delete el.dataset[key];el.classList.remove('model-ready');});board.querySelectorAll('button').forEach(b=>{b.tabIndex=-1;b.disabled=true;});scenery.append(board);}
 overlay.append(scenery);const stage=document.createElement('div');stage.className='pcm-cinema-stage';overlay.append(stage);
 const skip=document.createElement('button');skip.textContent='Skip sequence →';skip.className='pcm-skip';overlay.append(skip);
 const locked=Array.from(root.children).filter((el):el is HTMLElement=>el instanceof HTMLElement&& !el.classList.contains('pcm-model-layer'));
 locked.forEach(el=>el.inert=true);root.append(overlay);
 const finish=()=>{if(closed)return;closed=true;clearTimeout(timer);overlay.remove();locked.forEach(el=>el.inert=false);sync();if(focus?.isConnected)focus.focus({preventScroll:true});done();};
 const show=()=>{const beat=beats[index];stage.replaceChildren();const kicker=document.createElement('span');kicker.className='pcm-kicker';kicker.textContent=`CAPSULE THEATER · ${index+1} / ${beats.length}`;stage.append(kicker);
 if(beat.form){const figure=document.createElement('span');figure.className='pcm-figure pcm-summon-figure';figure.dataset.model=String(beat.form.id);figure.dataset.modelKey='cinema-'+index;const img=document.createElement('img');img.className='pcm-fallback-art';img.src=assetUrl(`capsule/portraits/${beat.form.id}.png`);img.alt=beat.form.name;figure.append(img);stage.append(figure);}
 const title=document.createElement('h2');title.textContent=beat.title;const subtitle=document.createElement('p');subtitle.textContent=beat.subtitle;stage.append(title,subtitle);sync();timer=setTimeout(()=>{index++;if(index<beats.length)show();else finish();},reduced?1200:beat.form?2200:2600);};
 skip.onclick=finish;overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish();}if(e.key==='Tab'){e.preventDefault();skip.focus({preventScroll:true});}};root.scrollIntoView?.({block:'start'});show();skip.focus({preventScroll:true});
 return ()=>{if(closed)return;closed=true;clearTimeout(timer);overlay.remove();locked.forEach(el=>el.inert=false);};
}
