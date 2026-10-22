import type {PlayerServices} from './player';
import type {GameModule} from './game';
export function trainerSummary(player:PlayerServices,games:GameModule[]){
 const activity=player.activity();const keys=[...new Set(games.flatMap(g=>g.scoreKeys??[g.id]).concat('guess-daily'))];
 const progress=keys.map(k=>({key:k,...player.progress(k)}));
 const launches=Object.values(activity).reduce((n,a)=>n+a.launches,0),minutes=Math.floor(Object.values(activity).reduce((n,a)=>n+a.seconds,0)/60);
 const played=[...new Set(Object.keys(activity).filter(id=>activity[id].launches>0).map(id=>id==='guess-daily'?'guess':id))];
 const mysteries=player.progress('guess').positive+player.progress('guess-daily').positive;
 const achievements=[{id:'first-play',name:'Press start',description:'Launch your first game.',earned:launches>0||progress.some(p=>p.results>0)},{id:'explorer',name:'Arcade explorer',description:'Launch three different games.',earned:played.length>=3},{id:'first-mystery',name:'Sharp eyes',description:'Solve a Pokémon mystery.',earned:mysteries>=1},{id:'ten-mysteries',name:'Pokédex detective',description:'Solve ten Pokémon mysteries.',earned:mysteries>=10},{id:'daily-win',name:'Daily discovery',description:'Solve a daily mystery.',earned:player.progress('guess-daily').positive>0}];
 return {launches,minutes,played,mysteries,achievements,progress};
}
export function filterGames(games:GameModule[],search:string,category:string,control:string){const query=search.trim().toLowerCase();return games.filter(g=>(!query||(g.name+' '+g.description).toLowerCase().includes(query))&&(category==='All'||g.category===category)&&(control==='All'||g.controls.some(c=>c.toLowerCase().includes(control.toLowerCase()))));}
