# Pokémon Arena 3D — local desktop game

Double-click index.html to play in a current desktop browser. No server, download, account, or internet connection is required. Keep index.html, style.css, and game.js together.

## Sample run
Click **Watch sample run** for an autonomous Pikachu vs. boss demonstration. Pikachu moves, shoots electric balls, builds energy, uses its charged move, and dodges telegraphed attacks. Press a movement key to take control. Choose Enter arena for manual play.

- WASD or arrow keys: move and set your firing direction.
- Hold Space: rapid attack in the last movement direction.
- E: charged attack, when enough energy is available.
- Shift: directional dodge with brief invulnerability, 2.4-second cooldown.
- P: pause/resume. Switching away also pauses the game.

Playable: Pikachu, Charmander, Squirtle. Bosses: Blastoise, Charizard, Venusaur. Change the fighter, rapid move, charged move, and boss in the sidebar. Changing a fighter or boss resets the match.

## Battle model
The displayed base stats are modern standard-form base stats, in HP / Attack / Defense / Special Attack / Special Defense / Speed order. No EVs, IVs, natures, items, abilities, or critical hits are simulated.

- Player arena HP = base HP + 75. Boss arena HP = (base HP + 75) × 3.
- Movement speed = 160 + base Speed × 1.25 pixels/second; bosses approach at 27% of this speed.
- Damage uses a level-50-style expression: ((22 × power × (attack + 20) / (defense + 20)) / 50 + 2), then STAB × type multiplier × arena scaling (0.7 player / 0.48 boss).
- Physical moves use Attack / Defense. Other moves use Special Attack / Special Defense.
- Same-type attacks receive 1.5× damage. The implemented Electric, Fire, Water, Grass, and Normal interactions cover this roster. Dual types multiply together.
- Electro Ball uses a custom bounded Speed ratio multiplier, rather than the turn-based move's power bands.
- Knockback depends on attacker/target weight ratio and whether the move is charged. Charged hits briefly stun; rapid hits briefly interrupt. Dodge invulnerability avoids damage.
- Rapid hits grant 9 energy; charged moves have individual costs. Bosses become more aggressive below half health.

These arena formulas, energy mechanics, move timings, and boss health multipliers are custom prototype tuning; canonical base stats are preserved as inputs. Move styles are arena adaptations rather than full main-series move implementations. This is a desktop keyboard prototype, without touch controls, audio, saving, or multiplayer.

## Data references
Standard form base stats and weights:
- https://pokemondb.net/pokedex/pikachu
- https://pokemondb.net/pokedex/charmander
- https://pokemondb.net/pokedex/squirtle
- https://pokemondb.net/pokedex/blastoise
- https://pokemondb.net/pokedex/charizard
- https://pokemondb.net/pokedex/venusaur

Characters now use textured, skinned GLB assets with authored skeletal animations, rendered locally with Three.js and WebGL 2. See assets/MODEL-CREDITS.md for provenance. Unofficial fan prototype; Pokémon belongs to its respective owners.

## Validation
Run `node smoke-test.cjs` to check movement, projectile direction, damage, energy costs, type multipliers, dodge, pause, all fighters, sample simulation, and victory/defeat handling. These are game logic checks with a mocked renderer. The desktop test also loads the real WebGL renderer and draws all six Pokémon.

## Windows desktop app

The desktop edition opens in its own window and bundles its browser engine, so it works offline without a separate browser or Node.js installation.

- Run `dist/Pokemon-Arena-0.4.1-Windows.exe` for the portable app; no installation or administrator access is needed.
- F11 toggles fullscreen. Alt shows the native menu; Ctrl+R reloads the app.
- Existing keyboard controls and the sample run work the same way.
- The app is an unsigned local build, not a signed commercial release.

### Desktop development

With Node.js installed:

1. `npm ci` installs the locked development dependencies (internet required for this step).
2. `npm start` opens the desktop app.
3. `npm test` runs the game logic checks.
4. `npm run test:desktop` runs the game inside the real Electron renderer and checks movement, attacks, energy, pause, and a sample battle.
5. `npm run build` creates the portable Windows x64 executable in `dist/`.

`npm run build:folder` creates an unpacked desktop distribution. Keep its whole `win-unpacked` folder together.

The desktop renderer uses sandboxing, context isolation, and no Node access. External navigation is blocked; the explicit stat-reference link opens in your default browser. There is no background web server, updater, or required network service.

Desktop implementation references: https://www.electronjs.org/docs/latest/api/browser-window and https://www.electron.build/docs/win/ .

## 3D upgrade (0.2.0)

- All six Pokémon now have solid 3D models with animated bodies, articulated limbs, faces, and species-specific details: Pikachu ears and lightning tail, turtle shell plates and cannons, Charizard wings and flame tail, and Venusaur leaves and flower.
- The forest arena includes textured terrain, stone borders, trees, rocks, grass, flowers, spectator ruins, banners, lanterns, mountains, ambient floating particles, directional light, and real cast shadows.
- Electric attacks have orbiting lightning arcs; fire attacks have flame tongues; water attacks have curling rings and droplets. Projectiles have cores, trails, impact rings, and 3D warning zones. Damage numbers project from world space into the HUD.
- The CAMERA button switches between angled and tactical views. Movement and aiming remain on the arena floor; this is a 3D-rendered arena with the existing ground-based combat, without jumping or flight controls.
- WebGL 2 and a compatible graphics driver are required. Three.js is bundled locally, so runtime does not require an internet connection.
- Renderer source: src/arena3d.js. Build its browser bundle with npm run build:renderer. Keep assets/arena3d.bundle.js with the game when opening index.html directly.

Three.js is distributed under the MIT license; see assets/THIRD-PARTY-LICENSE.txt.

## Character overhaul (0.3.0)

All six primitive character models have been replaced with detailed textured and skinned GLB models. Their native idle, walk, run, and attack clips drive the skeleton, including facial features, toes, ears, tails, wings, and foliage where present. Locomotion blends between idle, walk, and run according to actual travelled speed. Player movement now accelerates and decelerates smoothly; characters turn at bounded rates and bank slightly into turns. Rapid attacks use a separate additive upper-body layer so the feet can continue their locomotion cycle. Animation cadence scales with movement speed. The models are bundled locally, including their textures.

Use MODEL VIEW above the arena to examine any of the six Pokémon in the studio. Drag to rotate, scroll to zoom, and select Idle, Walk, Run, or Attack. Opening the studio pauses an active battle; returning resumes it. Switching fighters, bosses, or restarting closes the studio.

The desktop test verifies all six textured skeletons, actual foot articulation in run clips, run-to-idle transitions, firing while running, paused animation, and studio/battle transitions. This is authored game animation with speed-matched playback, not physical simulation or terrain-aware inverse kinematics.

## Expanded roster (0.4.0)

Twelve fighters are playable and can be selected as bosses: Pikachu, Charmander, Squirtle, Bulbasaur, Gengar, Alakazam, Machamp, Eevee, Snorlax, Charizard, Blastoise, and Venusaur. Each has two rapid and two charged choices. The sidebar explains each role, attack behavior, and charged energy cost. All have detailed local animated models and are available in Model View. Mirror matches use independent skeletons.

| Fighter | Style | Rapid choices | Charged choices |
|---|---|---|---|
| Pikachu | Mobile artillery | Thunder Shock / Quick Attack | Electro Ball / Thunderbolt |
| Charmander | Flame skirmisher | Ember / Scratch | Flamethrower / Flame Burst |
| Squirtle | Water duelist | Water Gun / Tackle | Water Pulse / Hydro Pump |
| Bulbasaur | Drain controller | Vine Whip / Razor Leaf | Seed Bomb / Giga Drain |
| Gengar | Ghost ambusher | Hex / Sucker Punch | Shadow Ball / Sludge Bomb |
| Alakazam | Psychic sniper | Confusion / Psycho Cut | Psychic / Recover |
| Machamp | Combo brawler | Mach Punch / Bullet Punch | Dynamic Punch / Close Combat |
| Eevee | Agile skirmisher | Quick Attack / Swift | Double-Edge / Shadow Ball |
| Snorlax | Heavy tank | Lick / Tackle | Body Slam / Rest |
| Charizard | Flame bruiser | Ember / Wing Attack | Flamethrower / Fire Blast |
| Blastoise | Cannon battery | Water Gun / Bite | Hydro Pump / Water Pulse |
| Venusaur | Siege controller | Vine Whip / Razor Leaf | Solar Beam / Giga Drain |

Attack patterns, recovery timings, reach, statuses, and energy costs are custom arena adaptations. Moves are not a complete main-series learnset or rules simulation. Base stats, weights, and type relations retain sourced values. All 18 type attack relationships are bundled from PokéAPI; immunities apply before damage, energy gain, and secondary statuses. The stats for the new roster were read from the locally validated PokéAPI catalog, then bundled in src/roster.json. assets/type-chart.json retains the source chart and assets/roster-source.json records the new species snapshot. No character-data requests are made during play.

Melee attacks must reach the opponent in front of you; Body Slam covers a circle. Burst total damage and energy gain are divided across its projectiles. Piercing shots hit each target once. Giga Drain returns 45% of damage actually dealt. Poison ticks three times (once per second) and cannot poison Poison or Steel types. Slows reduce movement to 58% for the move-specific duration. Rest heals 30% with a brief vulnerable recovery; Recover heals 25%. Double-Edge inflicts recoil equal to 20% of damage actually dealt. Bosses use their own selected species move pools and melee, ranged, tank, or kiting movement profiles; their move budget and attack telegraphs are AI tuning, rather than player energy rules.

Refresh the Arena page in the running local Arcade to load this version. The portable Windows build is updated independently under dist/.

## Larger arena (0.4.1)

The playable field now has three times the original area: both horizontal dimensions are multiplied by √3. Movement speed, Pokémon size, attack reach, and projectile lifetime are unchanged. Borders, scenery, lighting coverage, and projectile cleanup bounds match the expanded field. The default camera follows the combat midpoint and pulls back with fighter separation. The CAMERA button switches to a full-field tactical overview. Opening separation stays familiar.

