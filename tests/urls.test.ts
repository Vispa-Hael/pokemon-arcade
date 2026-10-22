import {afterEach,expect,it,vi} from 'vitest';
import {assetUrl} from '../src/shared/urls';
afterEach(()=>vi.unstubAllEnvs());
it('keeps images and models inside a Pages repository path',()=>{vi.stubEnv('BASE_URL','/pokemon-arcade/');expect(assetUrl('/characters/portraits/25.png')).toBe('/pokemon-arcade/characters/portraits/25.png');expect(assetUrl('capsule/models/25.glb')).toBe('/pokemon-arcade/capsule/models/25.glb');expect(assetUrl('/legacy/chess/index.html')).toBe('/pokemon-arcade/legacy/chess/index.html');});
it('supports root hosting and desktop development',()=>{vi.stubEnv('BASE_URL','/');expect(assetUrl('/previews/guess.jpg')).toBe('/previews/guess.jpg');});
