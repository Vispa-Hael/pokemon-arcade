export const DAILY_TIME_ZONE='America/Denver';
export function dayKey(date=new Date()):string {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:DAILY_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');
}
export function validDay(day:string):boolean{return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;}
export function previousDay(day:string):string{return new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);}
export function dailySeed(day:string):number {if(!validDay(day))throw Error('Invalid challenge date');let hash=2166136261;for(const c of 'arcade-daily-v1:'+day)hash=Math.imul(hash^c.charCodeAt(0),16777619);return hash>>>0;}
export function dailyStreak(results:{roundId:string;value:number}[],today=dayKey()):{current:number;best:number;completed:boolean} {
 const wins=new Set(results.filter(r=>r.value>0&&r.roundId.startsWith('daily:')&&validDay(r.roundId.slice(6))).map(r=>r.roundId.slice(6)));
 const completed=results.some(r=>r.roundId==='daily:'+today);
 let date=wins.has(today)?today:previousDay(today),current=0;
 if(completed&&!wins.has(today))date='';
 while(wins.has(date)){current++;date=previousDay(date);}
 let best=0;for(const start of wins){let count=0,d=start;while(wins.has(d)){count++;d=previousDay(d);}best=Math.max(best,count);}
 return {current,best,completed};
}
