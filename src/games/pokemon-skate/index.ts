import type {GameModule} from '../../shared/game';
import {legacyMount} from '../../shared/legacy';
export default {id:'pokemon-skate',name:'Pokémon Skate',description:'A fully 3D Pokémon skate park. Carve your own route through the bowl, street plaza and vert section.',instructions:'Launch the standalone game. W/S or Up/Down pushes and brakes; A/D or Left/Right steers freely. Space charges an ollie, J/K/L tricks, hold C for manual/rail catch, E pump, Shift signature, V camera, drag to rotate, R restart, Escape pause. Choose Rail practice for a lined-up approach; queue tricks while charging and hold C through the descent. WebGL 2 required. Source and build live in the sibling Pokemon Skate folder.',version:'0.3.0',route:'/games/pokemon-skate',category:'Action',thumbnail:'/previews/pokemon-skate.jpg',scoreKeys:[],status:'Prototype',controls:['Keyboard','Gamepad','WebGL 2'],icon:'🛹',mount:legacyMount('pokemon-skate')} satisfies GameModule;


