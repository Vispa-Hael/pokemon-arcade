import {describe,it,expect} from 'vitest';
import {newRound,hint,visualClue,cluePatterns,revealMore,guess,score,validRound} from '../src/games/guess/rules';
import trivia from '../src/games/guess/trivia.json';
import catalog from '../src/data/catalog.json';
describe('structured silhouette masks and trivia',()=>{
 it('leaves the 50% mask unchanged when using trivia and fully reveals it only on request',()=>{let s=newRound([25]);const clue=visualClue(s);for(let i=0;i<4;i++){s=hint(s);expect(visualClue(s)).toEqual(clue);}expect(visualClue(revealMore(s))).toMatchObject({percent:100,maskImage:'none'});});
 it('keeps pattern stable on restore and after a miss',()=>{const s=newRound([25]);expect(visualClue(JSON.parse(JSON.stringify(s)))).toEqual(visualClue(s));expect(visualClue({...s,attempts:1})).toEqual(visualClue(s));});
 it('selects all five mask styles',()=>{const s=newRound([25]);const seen=new Set<string>();for(let i=0;i<100;i++)seen.add(visualClue({...s,roundId:`round-${i}`}).pattern);expect([...seen].sort()).toEqual([...cluePatterns].sort());});
 it('renders each style using matching geometry',()=>{const s=newRound([25]);for(let i=0;i<50;i++){const clue=visualClue({...s,roundId:`round-${i}`});const svg=decodeURIComponent(clue.maskImage);expect(svg).toContain(clue.pattern==='Polka dots'?'<circle':clue.pattern==='Diagonal'?'<polygon':'<rect');}});
 it('removes the mask at round end',()=>{const s=newRound([25]);for(const status of ['won','lost'] as const)expect(visualClue({...s,status})).toMatchObject({percent:100,maskImage:'none'});});
 it('halves earned points once, after existing miss and trivia penalties',()=>{let s=revealMore(newRound([25]));expect(revealMore(s)).toBe(s);expect(score(guess(s,'Pikachu',['Pikachu']))).toBe(50);s=hint(guess(s,'wrong',['Pikachu']));const won=guess(s,'Pikachu',['Pikachu']);expect(score(won)).toBe(37);expect(revealMore(won)).toBe(won);expect(score({...won,status:'lost'})).toBe(0);});
 it('accepts old saves and persists the reveal choice with validation',()=>{const s=newRound([25]);expect(validRound(s)).toBe(true);expect(validRound(JSON.parse(JSON.stringify(revealMore(s))))).toBe(true);expect(validRound({...s,revealedMore:'yes'})).toBe(false);});
 it('supplies available sourced non-spoiler fun facts for each playable species',()=>{for(const form of catalog.forms.filter(f=>f.isDefault)){const facts=(trivia as Record<string,{text:string;version:string}[]>)[form.speciesId];const species=catalog.species.find(s=>s.id===form.speciesId)!;expect(facts.length).toBeGreaterThanOrEqual(1);expect(facts.length).toBeLessThanOrEqual(4);for(const fact of facts){expect(fact.version).toBeTruthy();expect(fact.text.length).toBeGreaterThan(10);expect(fact.text.toLowerCase()).not.toContain(species.name.toLowerCase());}}});
});
