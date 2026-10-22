import {readFile,writeFile,open,stat} from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('work/capsule-reference');
const manifest=JSON.parse(await readFile(path.join(output,'inventory.json'),'utf8'));
const headers=[];
for(const entry of manifest.files){const file=path.join(manifest.source,entry.path),info=await stat(file);if(info.size!==entry.bytes||info.mtimeMs!==entry.modified)throw Error('Source metadata changed: '+entry.path);if(!/^(d_.*\.bin|SLUS_209\.40)$/i.test(entry.path))continue;const handle=await open(file,'r');try{const buffer=Buffer.alloc(64);await handle.read(buffer,0,64,0);headers.push({file:entry.path,hex:buffer.toString('hex'),littleEndianWords:Array.from({length:16},(_,i)=>buffer.readUInt32LE(i*4))});}finally{await handle.close();}}
const binary=await readFile(path.join(manifest.source,'SLUS_209.40'));
const programs=[];for(let i=0;i<binary.readUInt16LE(44);i++){const at=binary.readUInt32LE(28)+i*binary.readUInt16LE(42);programs.push({type:binary.readUInt32LE(at),offset:binary.readUInt32LE(at+4),virtualAddress:binary.readUInt32LE(at+8),fileBytes:binary.readUInt32LE(at+16),memoryBytes:binary.readUInt32LE(at+20),flags:binary.readUInt32LE(at+24)});}
const executable=await readFile(path.join(output,'SLUS_209.40.strings.txt'),'utf8');
const resources=executable.split('\n').filter(line=>/\t(?:D_[A-Z0-9~]+\.BIN|VOICE\.BIN|MOV\d+\.PSS|Intrinsic Alchemy|.*\.cpp\b)/.test(line));
await writeFile(path.join(output,'executable-structure.json'),JSON.stringify({machine:'MIPS (ELF machine 8)',entry:manifest.elf.entry,sections:manifest.elf.sections,programs,resourceReferences:resources,archiveHeaders:headers,interpretation:'Zero-length .symtab and .strtab: no function names recovered from symbol tables. Runtime Alchemy metadata is present. Archive prefix words are evidence only, not validated schemas.'},null,2));
const messages=await readFile(path.join(manifest.source,'d_mess.bin'));
const text=messages.toString('latin1');const matches=[...text.matchAll(/fusion|evolution|summon|movement|terrain|action points|attribute|symbol/gi)];
const evidence=matches.map(m=>{const start=Math.max(0,m.index-100),end=Math.min(text.length,m.index+150);return {term:m[0],offset:m.index,hex:'0x'+m.index.toString(16),context:text.slice(start,end).replace(/[^\x20-\x7e\r\n]/g,' ')};});
await writeFile(path.join(output,'mechanic-text-evidence.json'),JSON.stringify({warning:'Partial message decoding. Context includes control bytes replaced by spaces; these mentions do not establish numeric rules or valid fusion recipes.',matches:evidence},null,2));
console.log(JSON.stringify({archiveHeaders:headers.length,executableResourceReferences:resources.length,mechanicMentions:evidence.length,allSourceMetadataUnchanged:true}));
