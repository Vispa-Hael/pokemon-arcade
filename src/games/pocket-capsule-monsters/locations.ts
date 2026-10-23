export type LocationId='verdant-ruins'|'volcano-summit'|'tidal-grotto';
export interface BattleLocation {
 id:LocationId;name:string;subtitle:string;description:string;coverName:string;wallName:string;
 walls:number[];cover:number[];background:number;fog:number;sun:number;rim:number;stone:number;trim:number;tile:number[];
}
export const locations:BattleLocation[]=[
 {id:'verdant-ruins',name:'Verdant Ruins',subtitle:'The forgotten garden coliseum',description:'Terraced gardens, broken arches and a misty forest basin. Central ruins split the approach; mossy groves shelter the flanks.',coverName:'Moss grove',wallName:'Broken arch',walls:[27,28,35,36],cover:[18,21,42,45],background:0x12272b,fog:0x244443,sun:0xffe4bc,rim:0x8ed7c7,stone:0x445d57,trim:0xb2a273,tile:[0x6b8980,0x54766a]},
 {id:'volcano-summit',name:'Ember Crown',subtitle:'Battle above a living volcano',description:'A basalt platform suspended over flowing lava, with glowing vents, drifting embers and a jagged crater rim. Basalt walls divide the approaches; cooled outcrops offer cover.',coverName:'Basalt outcrop',wallName:'Lava spire',walls:[19,20,43,44],cover:[25,30,33,38],background:0x26131d,fog:0x55202c,sun:0xffb073,rim:0xff5031,stone:0x342e37,trim:0xd17c39,tile:[0x66616a,0x4c4854]},
 {id:'tidal-grotto',name:'Moonwell Grotto',subtitle:'The luminous water cavern',description:'A limestone arena over a glowing underground pool. Waterfalls, crystal gardens and hanging stalactites surround three tactical lanes.',coverName:'Crystal garden',wallName:'Crystal spire',walls:[26,29,34,37],cover:[17,22,41,46],background:0x071d2e,fog:0x0c3a51,sun:0xaee6ff,rim:0x60ecd4,stone:0x46636c,trim:0x93cccb,tile:[0x729794,0x547d87]}
];
export function isLocation(value:unknown):value is LocationId{return locations.some(l=>l.id===value);}
export function locationFor(id:unknown):BattleLocation{return locations.find(l=>l.id===id)??locations[0];}
