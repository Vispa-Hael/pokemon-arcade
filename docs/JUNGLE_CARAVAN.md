# Jungle Caravan — current playable slice (v1.2)

Launch `npm run dev` from `F:\Pokemon Arcade`, then open http://127.0.0.1:4173/#/games/jungle-caravan. The library card also launches it. Character reads and the existing shared portrait assets are offline. Tracker providers and other games are not imported by this module.

## Driving and fighting

Select six unique species for Driver, Scout, Engine, Defender, Front Gunner and Side Gunner. Eight curated forms are available from the shared adapter. Selecting an already assigned Pokémon swaps its position; a status message explains the swap. Balanced, Firepower and Mud runner presets provide starting points. The manifest shows power per shot, firing rate and base DPS separately, with speed, hull, armor and synergy. Crew and route seed save locally using a validated version-2 manifest. Active runs do not persist.

The run opens in a focused play view, with a three-second countdown. Cruise starts on at 88% of the crew's top speed. W/Up accelerates to full throttle, S/Down brakes, A/D or Left/Right selects an adjacent lane. Hold to repeat across two lanes. The caravan completes a lane change after a short tap: there is no stable half-lane position that bypasses every obstacle. Driver and Scout stats determine how quickly the caravan responds.

Both gunners auto-fire. Front Gunner targets raised road shooters ahead, in the caravan's lane; steer to line up shots. Side Gunner engages roadside shooters as they come alongside. Its empty shots alternate left/right and travel outward, rather than forward. Colored projectiles, muzzle flashes, enemy health bars, damage numbers and visible gunner portraits connect the selected Pokémon to the caravan.

Robbers track your selected lane before a warning period, then lock their aim for the final 0.75 seconds before firing. A dashed box marks that lane. Incoming red projectiles travel before dealing damage; they do not retarget in mid-flight. Change lanes after the aim locks, or hold Q for high cover / E for low cover. Cover stops matching-height shots on arrival and slows the caravan 15%. A visible arc and active control states show which cover is held. Gunner interception remains probabilistic if cover is not held. Robbers stop firing when defeated; bullets already in flight remain dangerous.

Space activates the Engine's adapted ability (22-second cooldown); X swaps gunners (8-second cooldown). Clicked controls release focus so Space still works after pointer interactions. P or Escape pauses; hiding the tab or losing focus also pauses and clears held input. Resume has an explicit button. Restart repeats the same route and crew. Returning to the manifest preserves in-run gunner swaps. Keyboard releases are processed even after focus changes. Touch controls support multiple pointers, cancellation and lost capture. A short touch on steering registers a complete lane command.

Logs and rocks damage hull and reduce speed. Mud slows the caravan for three seconds. Green supply crates at three seeded lane positions repair up to 14 hull and reduce the Engine ability cooldown by four seconds; neither benefit exceeds its bounds. Supply pickups have explicit feedback and a run counter. Their lane is selected to avoid an overlapping log, rock or mud obstacle within 35 m.

Reach the visible river gate at 2,400 m. Hull or beast gap reaching zero loses the run. Loss takes priority on a simultaneous final impact. The pack grows and rises toward the rear of the caravan as the gap shrinks. It remains visible rather than dropping below the screen at the moment of danger.

## Shared stats and original arcade effects

All crew use equal arcade level 30. This is a bounded arcade mapping, not the Pokémon battle-level or move-damage formula. Each contributing base stat clamps to 30–130, then divides by 100.

- Front power = 8 + 16 × normalized Special Attack.
- Side power = 8 + 16 × normalized Attack.
- Firing rate = 0.8 + 1.2 × normalized Speed, shots per second.
- Base DPS = power × firing rate, before critical bonuses.
- Driver Speed and Scout Special Defense improve lane response. Normal Driver adds 8% handling.
- Engine Speed and Attack set top speed; Fire/Electric adds 2 m/s. Fire reduces log damage 20%.
- Defender HP and a smaller shared HP contribution set hull. Defender Defense and Special Defense set armor, capped at 40%. Steel/Rock Defender reduces physical damage 15%; Water reduces mud drag 20%.
- Grass/Flying Scout reduces mud drag 35%. This multiplies with Water Defender's bonus.
- Front Gunner's Special Attack assists high interception; Side Gunner's Attack assists low interception. Ghost/Poison adds six percentage points.

Synergy = 40 + 5 per unique type (first eight) + 8 for Fire Engine/Water Defender + 8 for Grass Scout/Electric Engine, capped at 100. Luck = 4% + synergy × 0.08 percentage points, capped at 12%. It adds to automatic interception (final cap 82%) and gives outgoing shots a chance of +20% damage. Evolution families do not grant bonuses.

The canonical species ability name is read from the catalog's first non-hidden ability. Only Engine activates an ability adaptation in this slice. The UI distinguishes the species name from these original Caravan effects:

- Blaze: Trail surge, +6 top speed for six seconds, +2 extra below half hull.
- Overgrow: Trail surge, +6 top speed for six seconds, +2 extra while in mud.
- Static: Trail surge, +6 top speed and eight extra interception percentage points for six seconds.
- Torrent: River reserve, repair up to 12 hull.
- Run Away: Trail feint, gain up to 14 m of beast gap.
- Stance Change: Iron escort, halve damage for six seconds.
- Unrecognized future names use generic Trail surge without a canonical claim.

Robbers have 60 HP. Front robbers begin their aim timer within 180 m; roadside robbers within 130 m. They fire after 1.1 seconds, repeat every 2.1 seconds, and each incoming shot travels for 0.85 seconds. Hits deal 18 raw damage before armor and shields. Front targets must be 18–190 m ahead and within 0.7 lane; side targets must be between 20 m behind and 100 m ahead. Outgoing travel time scales with target distance, bounded to 0.22–0.55 seconds.

## Presentation and lifecycle

A consistent elevated orthographic camera projects the caravan, obstacles, enemies and projectile world positions. Moving shots are projected from their interpolated world position, not interpolated between screen endpoints that drift independently. Objects continue behind the caravan instead of clamping to its collision plane. Roadside scenery moves toward the viewer. The river gate is an actual course feature. The Canvas backing height adapts to its available width/height, avoiding the previous miniature letterboxed road on desktop or stretched sprites on tall screens. Reduced-motion mode freezes decorative scenery; gameplay movement remains.

The play view fits HUD, road, weapon/crew console and controls together. Small screens use a compact weapon row. Scoped focus styling is removed on return to crew or unmount and cooperates with the arcade's play shell. Animation frames and window/document listeners are cleaned up. Crew portrait DOM is refreshed only when assignments change. Existing bundled portrait files are reused; no new media is downloaded.

## Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

Tests cover adapter identities, six unique species, role and weapon formulas, bounded stats/luck, deterministic courses/control streams, projectile travel and damage, target geometry, aim locking, cover, repair/shield adaptations, cooldowns, supply caps, terminal states, lane commitment, camera collision alignment, scenery direction, visible beast approach, tall-screen projection, countdown safety, focus/pause/resume, touch inputs, replay, saved manifests, corrupted-save fallback and cleanup.

The balance regression checks 30 seeds with active and unattended control streams. Browser checks are performed separately from those scripts; passing arithmetic or DOM tests alone does not establish a good play experience. Physical multi-touch hardware testing remains outside the automated checks. Audio, gamepads, recorded-input ghosts and persistent active runs remain future work.
