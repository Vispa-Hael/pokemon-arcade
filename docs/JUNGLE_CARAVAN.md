# Jungle Caravan

Playable offline module: `src/games/jungle-caravan/`. Run `npm run dev` from `F:\Pokemon Arcade`, then open http://127.0.0.1:4173/#/games/jungle-caravan. The hub discovers its GameModule automatically. Static builds include it. No changes to Tracker, providers, data importers, Chess, or Arena.

## Crew and controls

Six unique species occupy Driver, Scout, Engine, Defender, Front Gunner and Side Gunner. Selecting a Pokémon already assigned swaps its station with the current occupant. All eight existing adapter forms are offered, including Aegislash Blade with its distinct form and species IDs. No runtime API calls, new canonical facts, or evolution synergies. The default crew is Pikachu / Eevee / Charizard / Blastoise / Bulbasaur / Charmander.

W / Up: throttle. S / Down: brake. A,D / Left,Right: steer continuously across three lanes. Q: hold high cover. E: hold low cover. Space: Engine crew burst, 22-second cooldown. X: swap gunners, 8-second cooldown. P: pause. Touch buttons support simultaneous pointers; Cruise latches throttle. Blur or hidden tab pauses automatically. Unmount cancels the animation and removes global listeners. Returning to manifest keeps crew and seed for this mount; leaving the module does not save an active run.

## Stat and type rules

This slice uses one equal arcade level (30), not full Pokémon battle-stat, experience, or leveling formulas. Each base-stat contribution clamps to 30–130, then divides by 100. This preserves species differences with diminishing extremes. Higher-stat forms remain stronger in some roles; no salary budget or progression gates are implemented.

- Driver Speed and Scout Special Defense improve steering response. Normal Driver gains 8% handling.
- Engine Speed and Attack determine top speed. Fire or Electric Engine adds 2 m/s. Fire also reduces log damage 20%.
- Defender HP supplies hull; all six HP values supply a smaller shared contribution. Defender Defense and Special Defense determine armor, capped at 40%. Steel/Rock Defender reduces physical damage 15%; Water Defender reduces mud drag 20%.
- Front Gunner uses Special Attack for shot power; Side Gunner uses Attack. Both use Speed for firing rate and retain high/low cover assistance respectively. Ghost/Poison adds 6 percentage points in either station.
- Grass/Flying Scout reduces mud drag 35%. These terrain bonuses multiply with Water Defender.
- Type diversity gives synergy: 40 + 5 per unique type (first eight), +8 for Fire Engine/Water Defender, +8 for Grass Scout/Electric Engine, capped at 100. Luck is 4% + synergy × 0.08 percentage points, so it never exceeds 12 percentage points. It adds to automatic interception (final chance caps at 82%) and gives each outgoing shot a bounded chance of +20% damage.

All species ability names come from the existing offline catalog's first non-hidden ability. Only the Engine station activates a species-ability adaptation in this slice. The UI explicitly identifies these as **original Caravan effects**, not canonical ability descriptions:

- Blaze → Trail surge: +6 top speed for 6 seconds, +2 more below half hull.
- Overgrow → Trail surge: +6 top speed for 6 seconds, +2 more while in mud.
- Static → Trail surge: +6 top speed and +8 percentage points of interception for 6 seconds.
- Torrent → River reserve: repair 12 hull, capped at maximum hull.
- Run Away → Trail feint: gain 14 m of beast gap, capped at 160 m.
- Stance Change → Iron escort: halve incoming damage for 6 seconds.
- Unknown/unavailable future ability names receive the documented generic Trail surge, without a claim about their canonical behavior. No hidden-ability selection in this slice.

Aegislash Blade can specialize in either gunnery or sacrifice speed for a defensive Engine burst. Blastoise can protect hull as Defender or provide repairs as Engine. Moving Charizard away from Engine trades speed and log resistance for stronger front shots. Moving Bulbasaur to Scout trades interception for mud resistance. No real-world combat or Pokédex lore is inferred from these arcade mappings.

## Course and simulation

Reach the river gate at 2,400 m. Lose when hull or beast gap reaches zero; loss takes priority on a simultaneous final collision. Seed strings generate lane, hazard spacing, hazard kind and each interception roll before the run. Fixed 60 Hz ticks separate the simulation from rendering. Same seed, crew and control stream reproduce results; this is a seeded restart, not a recorded-input replay system. Pauses freeze ticks. Long rendering stalls discard excess wall time rather than causing hidden collisions.

Logs and rocks reduce speed and hull. Mud causes three seconds of drag. Robbers stand on raised road platforms ahead or beside the road and fire visible projectiles into a seeded target lane. Leave their lane, rely on probabilistic gunners, or use matching cover for guaranteed interception. Holding cover slows the caravan 15%. Beast pace rises from 31 to 33 m/s over the course; braking continuously loses the chase. A normal default run takes roughly a minute. Procedural Canvas road, trees, elevated wagon faces and pack silhouettes require no new third-party assets. Reduced-motion mode freezes decorative scenery; moving hazards remain necessary gameplay.

## Verification and limits

Core tests cover deterministic courses and control streams, adapter projection, six unique species, role effects, bounded stats and luck, cover, terrain, cooldowns, repair/shield adaptations, terminal states and terminal-state freeze. UI tests cover crew swaps, start/pause/resume/manifest and cleanup. The balance regression checks 30 fixed seeds: at least 27 anticipatory lane-pilot wins and at most 15 unattended center-lane throttle wins. Combat changes can alter the exact totals. These scripted checks establish an accessible starting balance; they do not replace human difficulty testing.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Existing hub, server adapter, guessing game and legacy-game UI tests remain included.

Future decisions: desired difficulty curve; whether to expand the eight-form offline roster; whether to add a roster budget/progression; and whether to add persistent best runs or recorded-input ghosts. Keyboard and pointer handling are covered in code/tests and the desktop chase is browser-checked; physical multi-touch device testing remains. There is no full 3D, audio, imported Pokémon artwork, gamepad mapping, active-run persistence, or Tracker integration.

The referenced conversation exposed assistant messages as content-reference placeholders. The implementation therefore uses the detailed functional specification supplied in the continuation request, rather than claiming exact parity with inaccessible prototype code.

## Version 1.1 — visible front and side combat

The former instant shot encounter has been replaced by actual robber/projectile simulation in `combat.ts`. Each robber has 68 HP and fires every 1.6 seconds after a 0.6-second warning. Incoming red shots take 0.85 seconds to reach their target lane; matching high/low cover is checked on arrival, so steering can dodge a traveling shot. Incoming hits deal 18 raw damage before armor/shield reductions. Defeating a robber stops future shots; bullets already fired remain dangerous.

Both crew stations automatically fire throughout the run, including visible untargeted fire between robbers. Front Gunner aims at road-platform robbers ahead within 0.7 lane of the caravan. Steer to line up front shots. Side Gunner targets roadside robbers on either side independently of the driving lane. Outgoing targeted shots take 0.45 seconds to hit and visibly reduce enemy HP. Power, firing rate and base DPS are displayed in the manifest and live HUD. X swaps stations and updates the numbers immediately; it does not reset fire cooldowns.

For each selected gunner, clamp the relevant base stat to 30–130 and divide by 100:

- Front power = 8 + 16 × normalized Special Attack.
- Side power = 8 + 16 × normalized Attack.
- Either station firing rate = 0.8 + 1.2 × normalized Speed, shots per second.
- Base DPS = power × firing rate, before bounded critical-shot bonuses.

For example, default Bulbasaur front shots have 18.4 power, 1.34 shots/second and 24.7 base DPS. Default Charmander side shots have 16.3 power, 1.58 shots/second and 25.8 base DPS. These are original Caravan mechanics rather than canonical Pokémon damage formulas. Projectile colors use the gunner's first type. Existing species ability adaptations and the offline roster are unchanged.

The first two encounters guarantee one front robber and one side robber, so both systems appear early on every seed. Remaining course generation remains seeded. New combat regression tests verify power/rate formulas and caps, real travel time, incoming hits, outgoing damage, enemy defeat, front/side targeting, cover and steering dodges. Existing deterministic replay and balance regressions still apply.
