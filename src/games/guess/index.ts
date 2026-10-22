import {mountSuggestions} from './suggestions';
import type {GameModule} from '../../shared/game';
import {newRound,guess,hint,score,validRound,visualClue,revealMore} from './rules';
import triviaData from './trivia.json';
import {dailyRound} from './daily';
import {portraitUrl} from '../../shared/portraits';
const game:GameModule={id:'guess',name:"Who’s That Pokémon?",description:'A mystery from the Pokédex. Five guesses, Pokédex trivia, and one chance to trust your trainer instincts.',instructions:'Guess the Pokémon in five attempts. Type part of a name to see up to five suggestions. Select a name, then press Guess. Types are free. Each trivia hint costs 10 points. Reveal more uncovers the full silhouette and halves your final earned points (rounded down). Misses cost 15 points. A win earns at least 10 points before the reveal penalty. Your current round saves automatically. Start with 50% of the silhouette visible through a randomly selected vertical, horizontal, diagonal, striped, or polka-dot mask. The full-color Pokémon is revealed when you win or run out of guesses.',version:'1.7.0',route:'/games/guess',category:'Puzzle',thumbnail:'/previews/guess.jpg',status:'Playable',controls:['Keyboard','Touch'],icon:'?',saveVersion:1,resume(player,characters){const saved=player.load('guess',validRound);return saved?.status==='playing'&&characters.getForm(saved.formId,['isDefault'])?.isDefault?{label:'Continue mystery',detail:`${5-saved.attempts} guesses left · ${saved.hints} trivia hints used`}:null;},mount(host,{characters,player,challenge}){
 const pool=characters.queryForms(['id','speciesId'],{defaultOnly:true}).filter(f=>portraitUrl(f.id)!==null&&((triviaData as Record<string,unknown[]>)[f.speciesId]?.length??0)>0).map(f=>f.id);
 const names=[...new Set(pool.map(id=>characters.getForm(id,['speciesId'])!.speciesId))].map(id=>characters.getSpecies(id,['displayName'])!.displayName);
 const saveKey=challenge?'guess-daily:'+challenge.day:'guess';
 const fresh=()=>challenge?dailyRound(challenge.day,pool):newRound(pool);
 let state=player.load(saveKey,validRound)??fresh();
 if(!pool.includes(state.formId)||(challenge&&(state.roundId!=='daily:'+challenge.day||state.formId!==fresh().formId)))state=fresh();
 let feedback='';
 function render(){
 const f=characters.getForm(state.formId,['speciesId','types','heightM','stats'])!,s=characters.getSpecies(f.speciesId,['name','displayName','generation'])!;
 const facts=(triviaData as Record<string,{text:string;version:string}[]>)[String(f.speciesId)]??[];
 player.save(saveKey,state);if(state.status!=='playing')player.record(challenge?'guess-daily':'guess',state.roundId,score(state));
 host.innerHTML=`<div class="mystery-layout"><section class="mystery-card"><span class="eyebrow">${challenge?'DAILY MYSTERY / '+challenge.day:'FIELD RESEARCH / '+pool.length+' POSSIBILITIES'}</span><div class="mystery-portrait ${state.status==='playing'?'is-hidden':'is-revealed'}"><div class="portrait-aura" aria-hidden="true"></div><img class="pokemon-portrait" width="280" height="280" draggable="false"><p class="portrait-status" role="status">Loading visual clue…</p></div><h2>${state.status==='playing'?'A wild mystery appears.':s.displayName}</h2><p>${state.status==='playing'?'Only part of the silhouette is visible. Use free types and trivia, or reveal more for half points.':state.status==='won'?`You found it! +${score(state)} points`:'Out of guesses. A new discovery awaits.'}</p><span class="pill">${5-state.attempts} guesses left</span></section><section class="guess-panel"><span class="eyebrow">TRAINER’S NOTEBOOK</span><h2>Name that Pokémon</h2><form><label for="answer">Your guess</label><div class="input-row"><div class="name-entry"><input id="answer" name="answer" autocomplete="off" aria-describedby="name-help" maxlength="80" placeholder="Enter a Pokémon name" ${state.status!=='playing'?'disabled':''} required></div><button class="primary" ${state.status!=='playing'?'disabled':''}>Guess ↗</button></div><p class="name-help" id="name-help">Type a name for suggestions. Tap one, or use ↑ ↓ and Enter to select, then Guess.</p></form><p role="status" id="feedback"></p><p class="free-types" id="free-types"></p><div class="hint-list" id="hints"></div><div class="button-row"><button id="hint" ${state.hints>=facts.length||state.status!=='playing'?'disabled':''}>Trivia hint (${state.hints}/${facts.length})</button><button id="reveal-more" ${state.revealedMore||state.status!=='playing'?'disabled':''}>${state.revealedMore?'Revealed · ½ points':'Reveal more · ½ points'}</button>${challenge?'<a class="button" href="#/games/guess">Play free mode ↗</a>':'<button id="new">New mystery ↻</button>'}</div><p class="muted">100 starting points · −15 per miss · −10 per trivia hint${state.revealedMore?' · final score × ½':''}</p><p id="storage-warning" role="status"></p></section></div>`;
 if(state.status==='playing')mountSuggestions(host.querySelector<HTMLInputElement>('#answer')!,names);
 const portrait=host.querySelector<HTMLImageElement>('.pokemon-portrait')!;
 const portraitStatus=host.querySelector<HTMLElement>('.portrait-status')!;
 const playing=state.status==='playing';
 const visual=visualClue(state);
 portrait.style.maskImage=visual.maskImage;
 portrait.style.webkitMaskImage=visual.maskImage;
 const windowLabel=document.createElement('span');
 windowLabel.className='clue-window-label';
 windowLabel.textContent=playing?`${visual.pattern.toUpperCase()} · ${visual.percent}% REVEALED`:'FULL REVEAL';
 host.querySelector('.mystery-portrait')!.prepend(windowLabel);
 portrait.alt=playing?'Mystery Pokémon silhouette':s.displayName;
 portrait.onload=()=>{portraitStatus.textContent=playing?'WHO’S THAT POKÉMON?':'POKÉMON REVEALED';};
 portrait.onerror=()=>{
  portrait.hidden=true;
  portraitStatus.textContent=playing
   ?`Image unavailable. Free clue: ${s.displayName.length} letters · height ${f.heightM===null?'unknown':f.heightM+' m'}. Use hints for more clues.`
   :`Image unavailable. The Pokémon was ${s.displayName}.`;
 };
 portrait.src=portraitUrl(state.formId)!;
 host.querySelector('#feedback')!.textContent=feedback;
 host.querySelector('#free-types')!.textContent=`Type: ${f.types?.join(' / ')??'unavailable'} · FREE CLUE`;
 for(const [i,fact] of facts.slice(0,state.hints).entries()){const p=document.createElement('p');p.textContent=`${i+1}. ${fact.text}`;host.querySelector('#hints')!.append(p);}
 if(!state.hints)host.querySelector('#hints')!.textContent='Need a nudge? Discover a Pokédex fun fact for 10 points.';
 host.querySelector('form')!.onsubmit=e=>{e.preventDefault();const input=host.querySelector<HTMLInputElement>('input')!;const next=guess(state,input.value,[s.name,s.displayName]);if(next===state){feedback='Enter a Pokémon name.';}else{state=next;feedback=state.status==='won'?'Correct!':state.status==='lost'?`The answer was ${s.displayName}.`:'Not this time. Try another guess.';}render();host.querySelector<HTMLInputElement>('input')!.focus();};
 host.querySelector<HTMLButtonElement>('#hint')!.onclick=()=>{state=hint(state);render()};
 host.querySelector<HTMLButtonElement>('#reveal-more')!.onclick=()=>{state=revealMore(state);render()};
 const nextButton=host.querySelector<HTMLButtonElement>('#new');if(nextButton)nextButton.onclick=()=>{state=newRound(pool.length>1?pool.filter(id=>id!==state.formId):pool);feedback='';render()};
 host.querySelector('#storage-warning')!.textContent=player.warning;
 }
 render();
}};
export default game;
