import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {modelFormIds} from '../src/games/pocket-capsule-monsters/assets';

it.each(modelFormIds)('ships a self-contained textured and skinned model and fallback portrait for form %i',id=>{
 const bytes=readFileSync(new URL(`../public/capsule/models/${id}.glb`,import.meta.url));
 expect(bytes.toString('ascii',0,4)).toBe('glTF');expect(bytes.readUInt32LE(4)).toBe(2);expect(bytes.readUInt32LE(8)).toBe(bytes.length);
 const data=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 expect(data.meshes.length).toBeGreaterThan(0);expect(data.skins.length).toBeGreaterThan(0);expect(data.images.length).toBeGreaterThan(0);expect(data.extensionsRequired??[]).not.toContain('KHR_draco_mesh_compression');
 for(const image of data.images)expect(image.bufferView).toBeTypeOf('number');
 for(const buffer of data.buffers)expect(buffer.uri).toBeUndefined();
 const portrait=readFileSync(new URL(`../public/capsule/portraits/${id}.png`,import.meta.url));expect(portrait.subarray(1,4).toString()).toBe('PNG');
});
