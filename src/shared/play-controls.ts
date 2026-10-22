/** Focus mode and fullscreen keep the return navigation inside the play surface. */
export function mountPlayControls(shell:HTMLElement):()=>void {
 const focus=shell.querySelector<HTMLButtonElement>('[data-focus]')!,fullscreen=shell.querySelector<HTMLButtonElement>('[data-fullscreen]')!;
 const message=shell.querySelector<HTMLElement>('[data-play-status]')!;
 const outside=[...shell.parentElement!.children,...document.querySelectorAll('.site-header, #app > footer')].filter(el=>el!==shell) as HTMLElement[];
 let focused=false;const originalInert=outside.map(el=>el.inert);
 const setFocus=(on:boolean)=>{focused=on;shell.classList.toggle('is-focused',on);focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'Exit focus':'Focus view';outside.forEach((el,i)=>el.inert=on?true:originalInert[i]);};
 focus.onclick=()=>setFocus(!focused);
 fullscreen.onclick=()=>{
  if(!shell.requestFullscreen){message.textContent='Fullscreen is unavailable here. Use Focus view for a larger play area.';return;}
  const operation=document.fullscreenElement?document.exitFullscreen():shell.requestFullscreen();
  void operation.catch(()=>{message.textContent='Fullscreen was blocked. Use Focus view instead.';});
 };
 const onFull=()=>{fullscreen.textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';};
 const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&focused){e.preventDefault();e.stopPropagation();setFocus(false);focus.focus();}};
 document.addEventListener('fullscreenchange',onFull);document.addEventListener('keydown',onKey,true);
 return ()=>{setFocus(false);document.removeEventListener('fullscreenchange',onFull);document.removeEventListener('keydown',onKey,true);if(document.fullscreenElement===shell)void document.exitFullscreen().catch(()=>{});};
}
