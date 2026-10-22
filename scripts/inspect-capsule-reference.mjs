import {createReadStream} from 'node:fs';
import {readdir, stat, mkdir, writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Source is opened exclusively for reading. Research output is never served by the game.
const source=process.argv[2] ?? 'C:\\Users\\swami\\Downloads\\PS2\\Yu-Gi-Oh! Capsule Monster Coliseum (USA) - Copy';
const output=path.resolve('work/capsule-reference');
await mkdir(output,{recursive:true});
const inventory=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else if(item.isFile()){const info=await stat(file);inventory.push({path:path.relative(source,file),bytes:info.size,modified:info.mtimeMs});}}}
await walk(source);
const reports=[];
for(const entry of inventory){
 const file=path.join(source,entry.path),hash=createHash('sha256');
 const extract=/^(d_.*\.bin|SLUS_209\.40)$/i.test(entry.path);
 let offset=0,start=0,run='',strings=0;const lines=[];
 const finish=()=>{if(run.length>=6){lines.push(`${start.toString(16).padStart(8,'0')}\t${run}`);strings++;}run='';};
 for await(const chunk of createReadStream(file)){hash.update(chunk);if(extract)for(let i=0;i<chunk.length;i++){const b=chunk[i];if(b>=32&&b<=126){if(!run)start=offset+i;run+=String.fromCharCode(b);if(run.length===4096)finish();}else finish();}offset+=chunk.length;}
 finish();
 if(extract)await writeFile(path.join(output,entry.path+'.strings.txt'),lines.join('\n'));
 const after=await stat(file);if(after.size!==entry.bytes||after.mtimeMs!==entry.modified)throw Error(`Source changed during inspection: ${entry.path}`);
 reports.push({...entry,sha256:hash.digest('hex'),printableRuns:extract?strings:null});
}
const elf=await readFile(path.join(source,'SLUS_209.40'));
const sections=[];
if(elf.readUInt32LE(0)===0x464c457f){const offset=elf.readUInt32LE(32),size=elf.readUInt16LE(46),count=elf.readUInt16LE(48),names=offset+elf.readUInt16LE(50)*size,namesStart=elf.readUInt32LE(names+16);for(let i=0;i<count;i++){const at=offset+i*size,n=namesStart+elf.readUInt32LE(at);sections.push({name:elf.toString('ascii',n,elf.indexOf(0,n)),type:elf.readUInt32LE(at+4),address:elf.readUInt32LE(at+12),offset:elf.readUInt32LE(at+16),bytes:elf.readUInt32LE(at+20),entryBytes:elf.readUInt32LE(at+36)});}}
await writeFile(path.join(output,'inventory.json'),JSON.stringify({source,files:reports,elf:{format:'ELF32 little endian',machine:elf.readUInt16LE(18),entry:elf.readUInt32LE(24),sections},notes:['Printable strings are candidates, not decoded records.','Archive layout, compression, field meanings and gameplay formulas remain unverified.','No extracted content is included in runtime assets.']},null,2));
console.log(JSON.stringify({files:reports.length,bytes:reports.reduce((n,f)=>n+f.bytes,0),strings:reports.reduce((n,f)=>n+(f.printableRuns??0),0),sections,output},null,2));
