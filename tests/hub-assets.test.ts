import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import type {GameModule} from '../src/shared/game';
const modules=import.meta.glob<{default:GameModule}>('../src/games/*/index.ts',{eager:true});
it('ships a real local gameplay image and discovery metadata for every registered game',()=>{for(const {default:game} of Object.values(modules)){expect(game.category).toBeTruthy();expect(game.thumbnail).toMatch(/^\/previews\/[a-z-]+\.jpg$/);const bytes=readFileSync(new URL('../public'+game.thumbnail,import.meta.url));expect(bytes.subarray(0,3).toString('hex')).toBe('ffd8ff');expect(bytes.length).toBeGreaterThan(10000);}});
