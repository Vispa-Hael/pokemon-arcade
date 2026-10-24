# Pokémon Arena — trainer teams (0.8.0)

Build a squad of up to six Pokémon from the twelve playable fighters, choose a Gym Leader or trainer, and start the automatic battle. Edit each member’s four-move loadout before starting. Duplicate selections swap slots instead of duplicating Pokémon.

Eight Kanto Gym Leaders and seven other trainers have themed exhibition squads made from our existing 32 local models. **These are adapted squads, not exact historical game teams.** The full opponent lineup is visible before the match.

After a knockout, the next Pokémon enters following a brief intermission. The survivor keeps health, statuses, and cooldowns. Incoming Pokémon start fresh. Both sides switch after a double knockout; simultaneous final knockouts are a draw. Trainer Pokémon have normal HP rather than the single-boss mode’s triple HP. Pause also freezes the substitution timer. Model loading pauses simulation until the next pair is ready.

Gym wins award one of eight badges for the current app session; badges reset on reload. Single boss exhibitions remain available through the format selector. No keyboard battle controls are needed.

Windows: `dist/Pokemon-Arena-0.8.0-Windows.exe`.

## Earlier development notes

# Pokémon Arena — auto-battle simulator (0.7.0)

Choose a fighter, four equipped moves, and one of 32 bosses. Press **Start auto battle** and watch. Both Pokémon move, dodge, and attack automatically; no keyboard or click-to-attack controls. The AI manages range, cooldowns, marks, healing, and incoming danger. Pause, camera, and Model View remain spectator tools. The four move cards show cooldowns and casting status.

Attacks now feature charge halos, curved travel trails, layered energy shells, beam cores, impact domes, shards, ground shockwaves, and short-lived light on nearby characters. Effects pause with the simulation.

Windows: `dist/Pokemon-Arena-0.7.0-Windows.exe`. Browser: `index.html` after `npm run build:renderer`.

## Earlier development notes

The notes below describe previous versions. Keyboard play has been replaced by automatic battles.

# Pokémon Arena 3D — local desktop game

Double-click index.html to play in a current desktop browser. No server, download, account, or internet connection is required. Keep index.html, style.css, game.js, and the assets directory together.

## Sample run
Click **Watch sample run** for an autonomous Pikachu vs. boss demonstration. Pikachu moves, uses its four cooldown abilities, builds and detonates Static marks, and dodges telegraphed attacks. Press a movement key to take control. Choose Enter arena for manual play.

- WASD or arrow keys: move and set your firing direction.
- J / K / L / semicolon: cast one of your four equipped moves in the last movement direction. Each press casts once.
- 1 / 2 / 3 / 4: alternative move keys. The on-screen cards can also be clicked.
- Space or Shift: directional dodge with brief invulnerability, 2.4-second cooldown.
- P: pause/resume. Switching away also pauses the game.

Twelve playable Pokémon and 32 bosses are available. All four moves in each fighter’s kit are equipped simultaneously. Rearrange their keys in the sidebar between fights; assigning an already equipped move swaps the two slots. Changing a fighter or boss resets the match.

## Battle model
The displayed base stats are modern standard-form base stats, in HP / Attack / Defense / Special Attack / Special Defense / Speed order. No EVs, IVs, natures, items, abilities, or critical hits are simulated.

- Player arena HP = base HP + 75. Boss arena HP = (base HP + 75) × 3.
- Movement speed = 160 + base Speed × 1.25 pixels/second; boss movement profiles scale from this speed.
- Damage uses a level-50-style expression: ((22 × power × (attack + 20) / (defense + 20)) / 50 + 2), then STAB × type multiplier × arena scaling (0.7 player / 0.48 boss).
- Physical moves use Attack / Defense. Other moves use Special Attack / Special Defense.
- Same-type attacks receive 1.5× damage. All 18 attack-type relations are bundled. Dual types multiply together.
- Electro Ball uses a custom bounded Speed ratio multiplier, rather than the turn-based move's power bands.
- Knockback depends on attacker/target weight ratio and whether the move is charged. Charged hits briefly stun; rapid hits briefly interrupt. Dodge invulnerability avoids damage.
- Four player moves use independent cooldowns; energy is no longer a player resource. Bosses escalate at half and quarter health.

These arena formulas, cooldowns, move timings, and boss health multipliers are custom prototype tuning; canonical base stats are preserved as inputs. Move styles are arena adaptations rather than full main-series move implementations. This is a desktop keyboard prototype, without touch controls, audio, saving, or multiplayer.

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

- Run `dist/Pokemon-Arena-0.6.0-Windows.exe` for the portable app; no installation or administrator access is needed.
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


## Boss expansion and mobility (0.5.0)

The opponent selector now contains **32 bosses**, including **20 new boss-only Pokémon**. The playable roster remains twelve. New bosses are marked ★ and can also be inspected in Model View. Base stats, weights, and types come from the existing locally validated PokéAPI catalog; see assets/boss-source.json. All models retain authored skeletal animations and local textures.

| New boss | Signature | Pattern cycle |
|---|---|---|
| Arcanine | Flame pursuit | charge / fan / strafe / rain |
| Ninetales | Foxfire dancer | blink / fan / spiral / mines |
| Rapidash | Blazing racer | charge / strafe / crossfire / charge |
| Jolteon | Lightning duelist | strafe / sweep / ring / charge |
| Raichu | Voltage surfer | ring / tracking / sweep / strafe |
| Electabuzz | Thunder bruiser | fan / charge / stomp / combo |
| Vaporeon | Tidal trickster | rain / fan / blink / sweep |
| Gyarados | Tempest serpent | sweep / charge / ring / rain |
| Lapras | Glacial siege | rain / crossfire / ring / tracking |
| Cloyster | Shard fortress | fan / ring / sweep / mines |
| Scyther | Blade hunter | charge / combo / strafe / crossfire |
| Pinsir | Pincer grappler | charge / combo / stomp / fan |
| Golem | Rolling bastion | charge / rain / stomp / ring |
| Rhydon | Drill juggernaut | charge / stomp / crossfire / combo |
| Nidoking | Toxic aggressor | fan / charge / rain / mines |
| Nidoqueen | Earth guardian | stomp / rain / charge / crossfire |
| Dragonite | Sky brawler | strafe / charge / sweep / ring |
| Aerodactyl | Aerial ambusher | strafe / charge / rain / crossfire |
| Mewtwo | Psychic conductor | blink / tracking / crossfire / spiral / rain |
| Articuno | Frost sovereign | rain / sweep / mines / ring |

All 32 bosses now use distance control, circling, strafing, boundary avoidance, and recovery windows. Profiles vary chase speed, preferred range, orbiting, and projectile-triggered sidesteps. Chargers commit to a warned straight lane; their direction locks before the lunge and they recover afterward. Ranged bosses can retreat, strafe, or fire from marked crossfire points. Teleport destinations are marked and clamped to the field; a separate warning precedes the follow-up attack.

There are thirteen named pattern families: charge, strafe, fan, tracking, sweep, crossfire, ring, spiral, rain, mines, blink, combo, and stomp. Tracking predicts the player position once before firing; it does not continually re-aim a locked warning. Rain and mines are delayed marked circular blasts. Mines are not permanent terrain hazards. Crossfire projectiles emerge from marked virtual emitters and still belong to the boss. Radial rings leave gaps between projectiles. Boss fans use per-projectile damage rather than dividing the whole attack across the fan. Player attacks retain their previous energy and damage rules.

Bosses escalate at 50% and 25% HP, increasing movement, shot density, and cadence. Tank recovery is limited to two Rest uses. Pausing freezes all movement, warnings, delays, attacks, and phase progression.

The game loads the initial two animated models first, then decodes opponents and studio selections on demand. The model cache holds at most eight loaded templates and releases unused textures, geometry, and skeleton instances. Embedded binary assets remain bundled for offline play; switching to an uncached opponent may briefly display a preparation screen. The renderer bundle is larger because it includes all 32 local models.

Verification covers every textured rig and skeletal animation, all 32 opponents in the real desktop renderer, all three phases, pattern diversity, mobility bounds, locked charge direction, recovery, safe teleport destinations, follow-up warnings, pause timing, mirror matches, and the bounded cache.

## Four-move combat (0.6.0)

Movement is controlled with the left hand (WASD) and attacks with the right (J, K, L, semicolon). Space or Shift dodges. Keys 1–4 and the clickable ability cards are alternatives. Key repeat is ignored: one press requests one cast. Each slot has an independent cooldown that starts immediately; no hit-building or energy gate is required. A short 0.4-second input buffer accommodates quick sequences. A 0.1-second action lock separates simultaneous button presses. Cooldowns, casts, timed pulses, and ground effects freeze while paused.

All twelve playable kits contain four unique moves. Rearranging is allowed only between fights and swaps occupied slots. Restarting restores ready cooldowns. The ability bar shows the key, move name, readiness/countdown, and progress. Heavy windups lock the attack direction at key press, reduce movement to 70%, and can be interrupted by a stagger; interruption refunds the cooldown down to at most 35% (minimum 1.5 seconds).

| Pokémon | J | K | L | ; |
|---|---|---|---|---|
| Pikachu | Thunder Shock (0.65s) | Quick Attack (3.2s) | Electro Ball (5s) | Thunderbolt (8s) |
| Charmander | Ember (0.7s) | Scratch (2.1s) | Flamethrower (6s) | Flame Burst (7.5s) |
| Squirtle | Water Gun (0.65s) | Tackle (3.5s) | Water Pulse (4.8s) | Hydro Pump (8s) |
| Bulbasaur | Razor Leaf (0.8s) | Vine Whip (3.4s) | Seed Bomb (6s) | Giga Drain (8s) |
| Gengar | Hex (0.9s) | Sucker Punch (4.2s) | Sludge Bomb (7s) | Shadow Ball (6s) |
| Alakazam | Confusion (0.75s) | Psycho Cut (3.2s) | Psychic (7.5s) | Recover (17s) |
| Machamp | Mach Punch (0.85s) | Bullet Punch (1.3s) | Dynamic Punch (6s) | Close Combat (7.5s) |
| Eevee | Swift (0.85s) | Quick Attack (3.2s) | Shadow Ball (6s) | Double-Edge (6s) |
| Snorlax | Lick (0.8s) | Tackle (3.5s) | Body Slam (6.5s) | Rest (20s) |
| Charizard | Ember (0.7s) | Wing Attack (3s) | Flamethrower (6s) | Fire Blast (8s) |
| Blastoise | Water Gun (0.65s) | Bite (2.4s) | Water Pulse (4.8s) | Hydro Pump (8s) |
| Venusaur | Razor Leaf (0.8s) | Vine Whip (3.4s) | Giga Drain (8s) | Solar Beam (9s) |

Player ability depth:

- Pikachu builds up to three 4.5-second Static marks with Thunder Shock. Electro Ball or Thunderbolt consumes them for 22% extra damage per mark. Alakazam builds Focus and consumes it with Psychic for 18% per mark.
- Ember and fire abilities apply burn to non-Fire targets. Scratch rewards a burning target with 35% more damage. Hex gains 30% against poisoned, burning, slowed, or rooted foes.
- Vine Whip briefly stops walking, then slows. Seed Bomb, Giga Drain, Body Slam and Solar Beam gain 25% against slowed or rooted foes. Mobility abilities can still move a rooted player.
- Machamp’s combo moves build a 2-second chain, gaining 10% per existing stack; the third hit staggers and resets the chain. Dynamic Punch consumes stored stacks for 15% bonus damage per stack.
- Tackle and certain utility abilities grant guard, reducing incoming hit damage by 45%. Poison/burn ticks bypass guard. Recover and Rest clear burn, poison, root, and slow; Rest still has a vulnerable recovery.
- Quick Attack grants a short evade and 1.25-second haste buff (25% faster movement). Eevee’s Double-Edge gains 20% damage during haste, retaining recoil. Sucker Punch shadow-steps and gains 35% against a recovering boss. Psycho Cut and Hydro Pump move the caster backward.
- Heavy, interrupt-capable moves cancel an active boss windup or charge, leaving a recovery opening. Already launched shots and placed mines remain. Bosses have a 7-second interruption cooldown to prevent permanent stun-locking.
- Flame Burst, Seed Bomb and Sludge Bomb leave visible 3-second ground effects. Flamethrower releases three timed waves; total power is split across pulses and pellets.

All effects and timing are custom arena adaptations. Base stats and type relationships are retained. The previous version sections below/above document historical mechanics; the controls and four-move system described here supersede their energy-based player rules.

## Keyboard aim and Mewtwo balance

Ranged moves assist within 30 degrees of your facing direction and at most 850 arena units, with limited movement prediction. They do not turn around to hit bosses behind you; melee, radial moves and healing keep their original behavior. Heavy moves still lock their aim at the start of their windup. Mewtwo circles at a lower speed, evades less often, and remains stationary for 1.15 seconds after teleporting. Its follow-up attack still has its own warning.
