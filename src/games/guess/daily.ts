import {newRound,type Round} from './rules';
import {dailySeed} from '../../shared/daily';
/** Fixed v1 species pool means future catalog expansion won't change today's answer. */
export function dailyRound(day:string,pool:number[]):Round {
 const ids=[...pool].filter(id=>id<=1025).sort((a,b)=>a-b);
 if(!ids.length)throw Error('Daily roster unavailable');
 return {...newRound(ids,()=>dailySeed(day)/4294967296),roundId:'daily:'+day};
}
