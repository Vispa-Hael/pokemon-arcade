# Pocket Capsule Monsters

## Version 1.3: perspective coliseum

Battles now default to one shared 3D arena: a raised stone plinth, solid tiles, trees, broken ruins, glowing capsule pedestals, surrounding pillars, directional light, fog and cast shadows. Pokémon occupy world-space tile positions and animate between them. Floating labels show names and HP; the side panel retains the larger figure inspection view. Terrain height is decorative; existing combat, directional patterns, resonance and saved-match rules remain intact.

Drag the battlefield to orbit; scroll or pinch to zoom. Camera presets offer Perspective, Overhead and Other side. Classic grid restores the previous presentation; unavailable WebGL leaves that grid playable. Camera changes do not spend AP or alter saves. Existing keyboard tile controls remain available, with focus highlighted in the arena. Mobile uses touch orbit/pinch; scroll outside the battlefield to scroll the page.

`arena.ts` owns scenery, camera controls and world-space picking. Pointer picking includes the real Pokémon meshes and their bases, while ignoring hit particles and labels; this prevents invisible effects from stealing nearby tile clicks. Picking is tested through perspective, reverse and overhead cameras. Scenery resources and camera listeners are released on unmount. The existing shared renderer continues to serve the squad picker, inspection views, cutscenes and classic grid.

Launch `#/games/pocket-capsule-monsters` in Pokémon Arcade. Runs in the static production build and reads the existing offline CharacterDatabase. No disc files, legacy adapters, external requests, or game-to-game imports are required.

## Version 1.2

New battles use directional targeting and Ghost/Flying diagonal movement. Includes skippable opening/summon sequences, replay, and a once-per-team Capsule Resonance link. Older saves keep their original targeting rules. See [reference research and current adaptation rules](CAPSULE_REFERENCE_RESEARCH.md) for exact additions and limitations. The original baseline formulas below still apply except where this update specifies otherwise.

## Play

Choose four different forms within 12 points. Forms with a base-stat total of 500 or more cost four; others cost two. The computer builds a legal squad with a preference for attack strength; local players use mirrored squads.

Each turn grants six team action points. Each living unit can move once (one AP) and attack once (two AP), in either order. Orthogonal pathfinding respects occupied cells, central ruins, and capsules. Speed of 90 or more grants four movement instead of three. Special Attack of 80 or more grants three attack range instead of one. Attacks use Manhattan distance and pass over terrain and other units.

HP = round(60 + base HP × 0.7). Attack = round(15 + (Attack + Special Attack) / 9). Armor = round((Defense + Special Defense) / 18). Damage = max(8, round((attack − armor) × advantage) − cover). Capsules have 160 HP and three armor. Forest cover reduces damage by five. The module uses a deliberately small tactical advantage table, not the complete Pokémon battle system: Fire → Grass/Steel; Water → Fire; Grass → Water; Electric → Water/Flying; Ghost → Ghost; Poison → Grass; Flying → Grass. Advantage multiplies damage by 1.4, once. There are no immunities or resistances.

Destroy the enemy capsule or defeat its entire squad. After 100 player turns, capsule plus remaining unit HP decides the result; equal totals draw. The computer prioritizes knockouts and capsule attacks, then advances toward enemies using legal movement.

## Implementation

`index.ts` mounts UI, keyboard tile navigation, local saves and paced computer turns. `rules.ts` owns pure roster conversion, legal actions, combat and save validation. `style.css` contains scoped responsive styles. The arcade discovers the module automatically. The module cancels its computer timer on unmount. A saved computer turn resumes on return. Saves use PlayerServices under the game ID and validate schema, numeric bounds, units and occupied positions; browser storage failure falls back to session memory.

Current scope: eight catalog forms, one board, two play modes. Version 1.1 adds textured, skinned 3D figures, animated squad previews and inspection views, procedural joint animation, authored Bulbasaur idle/walk clips, movement hops, attack lunges, hit particles/recoil, and knockout shrink transitions. Forests, ruins and capsules have richer decorative detail. No evolution, campaigns, detailed move simulation or original PS2 content. Reference files remain untouched.

## Figure rendering

The game dynamically loads Three.js only when its module mounts. One transparent WebGL canvas renders all model slots with independent cameras and viewports. Model data is shared; each figure clones its skeleton. Model files and fallback portraits live in public/capsule and are included in static builds. See public/capsule/ASSET-SOURCES.md for provenance and the Aegislash visual limitation. Character statistics still come exclusively from the shared database.

Figure movement interpolates between tiles for 650 ms; hit reactions last 550 ms. Joint animation uses rest quaternions, avoiding cumulative pose drift. Rendering pauses when the document is hidden; offscreen figures are culled. Reduced-motion preferences disable idle and action motion. WebGL failure or context loss uses local still portraits. Unmount cancels animation frames, disconnects the resize observer, releases scene resources and destroys the renderer. Shared source model data remains cached for revisits.

## Verification

Rule tests cover budget, duplicate choices, pathfinding, action limits, forest defense, knockouts, capsule victory, corrupt saves, and autonomous match completion. UI tests cover deployment, moving, restoration and unmount. Run the arcade lint, typecheck, tests and build checks.
