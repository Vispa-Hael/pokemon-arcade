import type {GameModule} from '../../shared/game';
import {legacyMount} from '../../shared/legacy';
export default {id:'pokemon-skate',name:'Pokémon Skate',description:'A fully 3D Pokémon skate park. Carve your own route through the bowl, street plaza and vert section.',instructions:'Easy Flow is on. Hold W to ride and J/K/L to repeat flips, spins or grabs. A/Left steers left; D/Right steers right from the chase camera. Hops, edge pops, landings and nearby rail catches are assisted automatically. No catch button is required. Space optionally charges an ollie, C holds a manual, E pumps, Shift uses a signature, V changes the camera, R restarts, Escape pauses. Release trick buttons and ride grounded briefly to bank. WebGL 2 required. Source lives in the sibling Pokemon Skate folder.',version:'0.4.0',route:'/games/pokemon-skate',category:'Action',thumbnail:'/previews/pokemon-skate.jpg',scoreKeys:[],status:'Prototype',controls:['Keyboard','Gamepad','WebGL 2'],icon:'🛹',mount:legacyMount('pokemon-skate')} satisfies GameModule;



