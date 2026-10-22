import {describe,it,expect} from 'vitest';
import raw from '../src/data/catalog.json';
import {CharacterDatabase,type Catalog} from '../src/data/model';
import {roster,createMatch,validMatch,reachable,act,targets,damage,endTurn,aiStep} from '../src/games/pocket-capsule-monsters/rules';
const pool=roster(new CharacterDatabase(raw as Catalog));
const fresh=()=>createMatch(pool,[1,4,7,25],'ai');
describe('Pocket Capsule Monsters',()=>{
 it('enforces squad budget and unique selections',()=>{expect(()=>createMatch(pool,[1,1,7,25],'ai')).toThrow();expect(()=>createMatch(pool,[6,9,10026,25],'ai')).toThrow();expect(validMatch(fresh())).toBe(true);});
 it('uses pathfinding and prevents repeated movement and enemy commands',()=>{const s=fresh(),u=s.units[0],tile=reachable(s,u)[0];expect(act(s,u.key,tile)).toBe(true);expect(s.ap).toBe(5);expect(reachable(s,u)).toEqual([]);expect(reachable(s,s.units[4])).toEqual([]);expect(validMatch(s)).toBe(true);});
 it('spends attack points once and resolves knockouts and capsule victories',()=>{const s=fresh(),u=s.units[0],v=s.units[4];u.x=0;u.y=3;v.x=0;v.y=2;v.hp=1;expect(targets(s,u)).toContain(16);expect(act(s,u.key,16)).toBe(true);expect(v.hp).toBe(0);expect(s.ap).toBe(4);expect(targets(s,u)).toEqual([]);u.acted=false;u.x=4;u.y=1;s.capsules[1]=1;expect(act(s,u.key,4)).toBe(true);expect(s.winner).toBe(0);expect(reachable(s,u)).toEqual([]);});
 it('gives forests defensive value and restores turn actions',()=>{const s=fresh(),u=s.units[0],v=s.units[4];v.x=2;v.y=2;const covered=damage(s,u,v);v.x=1;expect(damage(s,u,v)).toBeGreaterThan(covered);endTurn(s);expect(s.side).toBe(1);expect(s.ap).toBe(6);});
 it('finishes autonomous matches without illegal states or hangs',()=>{const s=fresh();for(let i=0;i<2000&&s.winner===null;i++){aiStep(s);expect(validMatch(s)).toBe(true);}expect(s.winner).not.toBeNull();});
 it('rejects corrupt saves',()=>{expect(validMatch(null)).toBe(false);const s=fresh();s.units[0].hp=Infinity;expect(validMatch(s)).toBe(false);expect(validMatch({...fresh(),ap:99})).toBe(false);const collision=fresh();collision.units[0].x=collision.units[1].x;expect(validMatch(collision)).toBe(false);});
});
