# Pokémon model asset credits

The six textured, skinned GLB character assets and their authored skeletal animation clips were obtained from the public 06wj/pokemon model collection on 2026-10-22:

https://github.com/06wj/pokemon
https://github.com/06wj/pokemon/tree/master/public/models

Source IDs: Pikachu 025, Charmander 004, Squirtle 007, Blastoise 009, Charizard 006, Venusaur 003.

This is an unofficial local fan prototype. Pokémon characters, models, textures, and associated assets belong to their respective rights holders. The source repository explicitly states that its code license does not grant rights to Pokémon assets. These assets are not original artwork created for this project. No commercial or redistribution rights are claimed.

Local integration includes normalization, material lighting, AnimationMixer playback, movement-dependent cadence, animation blending, and an additive upper-body attack layer. Original model files are preserved in assets/models; the desktop build embeds them in assets/arena3d.bundle.js for fully offline loading.

Three.js and GLTFLoader are provided under the Three.js MIT license in THIRD-PARTY-LICENSE.txt.

Roster expansion 0.4.0 adds the same-source assets: Bulbasaur 001, Gengar 094, Alakazam 065, Machamp 068, Eevee 133, Snorlax 143. Downloaded 2026-10-22.

Boss expansion 0.5.0 adds the same-source models, downloaded 2026-10-22: Arcanine 059, Ninetales 038, Rapidash 078, Jolteon 135, Raichu 026, Electabuzz 125, Vaporeon 134, Gyarados 130, Lapras 131, Cloyster 091, Scyther 123, Pinsir 127, Golem 076, Rhydon 112, Nidoking 034, Nidoqueen 031, Dragonite 149, Aerodactyl 142, Mewtwo 150, Articuno 144. Base stats and types retain the local PokéAPI source values.
