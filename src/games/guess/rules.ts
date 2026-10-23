export interface Round {version:1;roundId:string;formId:number;attempts:number;hints:number;status:'playing'|'won'|'lost';revealedMore?:boolean;gaveUp?:boolean}
export const normalize=(s:string)=>s.replace(/nidoran\s*female/gi,'nidoran-f').replace(/nidoran\s*male/gi,'nidoran-m').replaceAll('♀','-f').replaceAll('♂','-m').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function newRound(ids:number[],random=Math.random):Round {if(!ids.length)throw Error('No playable characters available');const n=random();if(n<0||n>=1||!Number.isFinite(n))throw Error('Invalid random value');return {version:1,roundId:crypto.randomUUID(),formId:ids[Math.floor(n*ids.length)],attempts:0,hints:0,status:'playing'};}
export function guess(state:Round,input:string,answers:string[]):Round {if(state.status!=='playing'||!normalize(input))return state;const attempts=state.attempts+1;return {...state,attempts,status:answers.some(a=>normalize(a)===normalize(input))?'won':attempts>=5?'lost':'playing'};}
/** Forfeits the remaining attempts using the existing completed-loss state. */
export function giveUp(state:Round):Round {return state.status==='playing'?{...state,status:'lost',attempts:5,gaveUp:true}:state;}
export function hint(state:Round):Round{return state.status==='playing'?{...state,hints:Math.min(4,state.hints+1)}:state;}
export function revealMore(state:Round):Round{return state.status==='playing'&&!state.revealedMore?{...state,revealedMore:true}:state;}
export const score=(s:Round)=>s.status==='won'?Math.floor(Math.max(10,100-(s.attempts-1)*15-s.hints*10)*(s.revealedMore?0.5:1)):0;
export function validRound(x:unknown):x is Round {if(!x||typeof x!=='object')return false;const s=x as Round;return (s.gaveUp===undefined||typeof s.gaveUp==='boolean')&&(!s.gaveUp||(s.status==='lost'&&s.attempts===5))&&(s.revealedMore===undefined||typeof s.revealedMore==='boolean')&&s.version===1&&typeof s.roundId==='string'&&s.roundId.length>0&&Number.isInteger(s.formId)&&s.formId>0&&Number.isInteger(s.attempts)&&s.attempts>=0&&s.attempts<=5&&Number.isInteger(s.hints)&&s.hints>=0&&s.hints<=4&&((s.status==='playing'&&s.attempts<5)||(s.status==='won'&&s.attempts>0)||(s.status==='lost'&&s.attempts===5));}

export const cluePatterns=['Vertical','Horizontal','Diagonal','Stripes','Polka dots'] as const;
/** Round UUID picks a structured mask and orientation; Reveal more removes the mask independently of trivia. */
export function visualClue(state:Round):{percent:number;maskImage:string;pattern:typeof cluePatterns[number]} {
 const percent=state.status==='playing'&&!state.revealedMore?50:100;
 let seed=2166136261;
 for(const char of state.roundId)seed=Math.imul(seed^char.charCodeAt(0),16777619);
 seed>>>=0;
 const pattern=cluePatterns[seed%cluePatterns.length];
 if(percent===100)return {percent,pattern,maskImage:'none'};
 let shape='';
 if(pattern==='Vertical')shape=`<rect x="${(100-percent)/2}" width="${percent}" height="100" fill="white"/>`;
 if(pattern==='Horizontal')shape=`<rect y="${(100-percent)/2}" width="100" height="${percent}" fill="white"/>`;
 if(pattern==='Diagonal'){
  const edge=(1-Math.sqrt(2*(1-percent/100)))*100;
  shape=`<g transform="rotate(${(seed>>>4)%4*90} 50 50)"><polygon points="0,0 100,0 100,${edge} ${edge},100 0,100" fill="white"/></g>`;
 }
 if(pattern==='Stripes'){
  const bands=Array.from({length:5},(_,i)=>`<rect x="${i*20+(20-percent/5)/2}" width="${percent/5}" height="100" fill="white"/>`).join('');
  shape=`<g transform="rotate(${(seed>>>4)%2*90} 50 50)">${bands}</g>`;
 }
 if(pattern==='Polka dots'){
  // Transparent circular holes: radius gives the requested hidden area per tile.
  const radius=Math.sqrt((1-percent/100)/Math.PI)*20;
  const dots=Array.from({length:25},(_,i)=>`<circle cx="${i%5*20+10}" cy="${Math.floor(i/5)*20+10}" r="${radius}" fill="black"/>`).join('');
  shape=`<defs><mask id="holes" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style="mask-type:luminance"><rect width="100" height="100" fill="white"/>${dots}</mask></defs><rect width="100" height="100" fill="white" mask="url(#holes)"/>`;
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${shape}</svg>`;
 return {percent,pattern,maskImage:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`};
}
