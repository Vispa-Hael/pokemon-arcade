/** Independent experiment switches. Saved per match; presentation and mechanics stay separate. */
export interface BattleFeatures {
 directional:boolean;
 diagonalMovement:boolean;
 terrain:boolean;
 resonance:boolean;
 cinematics:boolean;
 eliteSummons:boolean;
}
export const featureDefinitions:{key:keyof BattleFeatures;label:string;description:string}[]=[
 {key:'directional',label:'Directional attacks',description:'Species use cross, diagonal or area targeting.'},
 {key:'diagonalMovement',label:'Diagonal movement',description:'Ghost and Flying partners can move diagonally.'},
 {key:'terrain',label:'Arena terrain',description:'Ruins block movement; forests reduce damage.'},
 {key:'resonance',label:'Capsule Resonance',description:'Nearby partners can link their power.'},
 {key:'cinematics',label:'Arena introductions',description:'Play the opening board flyover.'},
 {key:'eliteSummons',label:'Elite summon sequences',description:'Reveal powerful partners before battle.'}
];
export const defaultFeatures:BattleFeatures={directional:true,diagonalMovement:true,terrain:true,resonance:true,cinematics:true,eliteSummons:true};
export function validFeatures(value:unknown):value is BattleFeatures{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===featureDefinitions.length&&featureDefinitions.every(({key})=>typeof (value as BattleFeatures)[key]==='boolean');}
export function readFeatures(value:Record<string,boolean>):BattleFeatures{return Object.fromEntries(featureDefinitions.map(({key})=>[key,typeof value[key]==='boolean'?value[key]:defaultFeatures[key]])) as unknown as BattleFeatures;}
