import {it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {defaultFeatures,validFeatures} from '../src/games/pocket-capsule-monsters/config';
import {roster,createMatch,targets,reachable,resonate,resonanceBonus,endTurn,validMatch,aiStep} from '../src/games/pocket-capsule-monsters/rules';
const pool=roster(new CharacterDatabase(raw as Catalog));
const fresh=()=>{const s=createMatch(pool,[1,4,7,25],'ai');s.directional=true;return s;};
it('distinguishes straight and diagonal attacks and retains old save behavior',()=>{
 const s=fresh(),u=s.units[0],v=s.units[4];u.x=0;u.y=3;v.x=1;v.y=2;
 u.form=6;expect(targets(s,u)).not.toContain(17);s.directional=false;expect(targets(s,u)).toContain(17);
 s.directional=true;u.form=10026;expect(targets(s,u)).toContain(17);v.x=0;expect(targets(s,u)).not.toContain(16);
});
it('charges resonance, spends both attacks, persists and loses its bonus when a partner falls',()=>{
 const s=fresh(),[u,v]=s.units;expect(resonate(s,u.key,v.key)).toBe(true);expect(s.ap).toBe(3);expect(u.acted&&v.acted).toBe(true);expect(resonanceBonus(s,u)).toBe(8);expect(validMatch(JSON.parse(JSON.stringify(s)))).toBe(true);
 endTurn(s);endTurn(s);expect(resonate(s,u.key,v.key)).toBe(false);v.hp=0;expect(resonanceBonus(s,u)).toBe(0);
});
it('rejects nonadjacent and enemy links and malformed saved links',()=>{
 const s=fresh();expect(resonate(s,0,3)).toBe(false);expect(resonate(s,0,4)).toBe(false);s.resonances=[[0,4]];expect(validMatch(s)).toBe(false);s.resonances=[[0,1],[2,3]];expect(validMatch(s)).toBe(false);
});
it('finishes directional AI matches within the bounded turn count',()=>{
 const s=fresh();for(let i=0;i<2000&&s.winner===null;i++){aiStep(s);expect(validMatch(s)).toBe(true);}expect(s.winner).not.toBeNull();
});
it('allows diagonal Ghost movement but prevents crossing a blocked corner',()=>{
 const s=fresh(),u=s.units[0];u.form=10026;u.x=1;u.y=3;s.roster.find(f=>f.id===10026)!.move=1;
 expect(reachable(s,u)).toContain(34);const blocker=s.units[1];blocker.x=2;blocker.y=3;expect(reachable(s,u)).not.toContain(34);
});
it('independently switches terrain, resonance, movement and targeting and saves the choices',()=>{
 const features={...defaultFeatures,terrain:false,resonance:false,directional:false,diagonalMovement:true};const s=createMatch(pool,[1,4,7,25],'ai',features),u=s.units[0],v=s.units[4];u.form=10026;u.x=2;u.y=3;
 expect(reachable(s,u)).toContain(27);expect(resonate(s,0,1)).toBe(false);v.x=2;v.y=2;expect(targets(s,u)).toContain(18);expect(validMatch(s)).toBe(true);features.terrain=true;expect(s.features!.terrain).toBe(false);expect(validFeatures({...defaultFeatures,unknown:true})).toBe(false);s.features!.terrain='yes' as unknown as boolean;expect(validMatch(s)).toBe(false);
});
