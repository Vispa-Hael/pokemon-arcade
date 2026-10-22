import {normalize} from './rules';
import './suggestions.css';
/** Name matching is independent of the answer, types, hints and current round. */
export function suggestNames(names:readonly string[],input:string):string[]{
 const query=normalize(input);if(!query)return [];
 const entries=names.map(name=>({name,key:normalize(name)}));
 const ranked=entries.filter(n=>n.key.includes(query)).sort((a,b)=>Number(!a.key.startsWith(query))-Number(!b.key.startsWith(query))||a.name.localeCompare(b.name));
 return ranked.slice(0,5).map(n=>n.name);
}
export function mountSuggestions(input:HTMLInputElement,names:readonly string[]):void{
 const list=document.createElement('div');list.id='pokemon-name-options';list.className='pokemon-name-options';list.role='listbox';list.setAttribute('aria-label','Pokémon name suggestions');list.hidden=true;
 input.parentElement!.append(list);
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');input.spellcheck=false;
 let matches:string[]=[],active=-1;
 const close=()=>{list.hidden=true;active=-1;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');};
 const highlight=()=>{Array.from(list.children).forEach((option,i)=>option.setAttribute('aria-selected',String(i===active)));if(active>=0)input.setAttribute('aria-activedescendant','pokemon-name-option-'+active);else input.removeAttribute('aria-activedescendant');};
 const select=(index:number)=>{input.value=matches[index];close();input.focus();};
 const show=()=>{
  matches=suggestNames(names,input.value);active=-1;list.replaceChildren();
  matches.forEach((name,i)=>{const option=document.createElement('button');option.type='button';option.role='option';option.tabIndex=-1;option.id='pokemon-name-option-'+i;option.textContent=name;option.setAttribute('aria-selected','false');option.onpointerdown=e=>e.preventDefault();option.onclick=()=>select(i);list.append(option);});
  list.hidden=matches.length===0;input.setAttribute('aria-expanded',String(matches.length>0));input.removeAttribute('aria-activedescendant');
 };
 input.oninput=show;input.onblur=close;
 input.onkeydown=e=>{
  if(e.key==='Escape'){close();return;}
  if(e.key==='Tab'){close();return;}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   e.preventDefault();if(list.hidden)show();if(!matches.length)return;
   active=e.key==='ArrowDown'?(active+1)%matches.length:(active<=0?matches.length-1:active-1);highlight();
  }else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();select(active);}
 };
}
