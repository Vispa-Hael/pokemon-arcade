# Pokémon Skate — 3D park prototype (v0.2)

The user requested fully 3D gameplay after reviewing the original side-profile prototype. This revision supersedes the 2D presentation and movement requirements in the archived [original specification](POKEMON_SKATE_SPEC.md). There is no side-scrolling gameplay mode.

Launch `http://127.0.0.1:4173/#/games/pokemon-skate` or choose Pokémon Skate in the library. Both Free Skate and the 75-second Skate Run use the same XYZ simulation and fully navigable 64 × 54 metre park. WebGL 2 is required. No new packages, online Pokémon API or sibling game is needed.

## Controls

| Action | Keyboard | Standard gamepad |
|---|---|---|
| Push / brake / reverse | W/S or Up/Down | Left stick / D-pad vertical |
| Steer across the park | A/D or Left/Right | Left stick / D-pad horizontal |
| Charge ollie / release | Space | A |
| Flip / spin / grab | J / K / L | X / B / Y |
| Manual / close rail catch | C | Left bumper |
| Pump a curved transition | E | Left trigger |
| Signature | Shift | Right bumper |
| Cycle chase / overhead / close cameras | V | Right trigger |
| Rotate camera | Drag the scene | — |
| Pause / restart | Escape / R | Start / UI restart |

Steering changes board heading; throttle and braking act along that heading. Braking crosses through zero before reversing. The chase camera follows the rider's heading and can rotate around the rider. Camera changes never alter physics. Focus loss and hidden tabs pause automatically. Configuration takes effect when Drop in is clicked; Restart repeats the active configuration.

## Park, physics and scoring

The park includes a radial bowl, a wide half-pipe, a shallow kicker, a quarter ramp, a platform, a recessed gap, diagonal and straight rails, and static obstacles. Riders can approach and leave features along either horizontal axis. Drawn terrain and collisions share `heightAt(x,z)` and its surface-normal query. The concrete mesh samples that geometry at roughly 0.33 m spacing. Trees, benches, skyline, fences, signs and lights form the surrounding environment. Rider shadow, directional lighting and depth perspective make elevation readable.

`engine.ts` owns world XYZ coordinates, velocities, yaw steering, tangent gravity, tyre grip, charged normal-direction jumping, pumping, rail projection/traversal, locomotion state, landing evaluation, trick timing and validated combo events. Its accumulator runs at 120 Hz; rendering does not modify simulation. This is a custom 3D skateboard contact controller using a 2D ground height field plus vertical motion, not a general-purpose rigid-body solver; overhangs and inverted riding are outside the current park geometry.

`render.ts` uses Three.js for the perspective scene, shared terrain mesh, skateboard and wheels, rider poses, shadows, camera and GPU resource cleanup. Pikachu and Squirtle reuse the arcade's bundled textured GLB models with existing provenance in `public/capsule/ASSET-SOURCES.md`. Machop and Gengar use original procedural volumetric meshes, with distinct silhouettes; no portrait sprites are used. The neutral test rider is also a 3D mesh. Existing idle animation clips are used when available; board flips, yaw spins, crouch, grabs, manuals and bails are separate visual poses. Models do not determine collision reliability.

`profiles.ts` adapts the shared offline six-stat catalog into bounded 0.9–1.1 gameplay attributes. Signatures retain a 14-second cooldown: Pikachu boosts existing grounded momentum by 10%, Squirtle widens landing alignment tolerance for two seconds, Machop increases ollie impulse for two seconds, Gengar begins an aerial style trick. All riders share collision rules.

Pumping requires a fresh E press, a curved surface, motion and a valid traversal; holding gives no repeat energy. The speed benefit is capped. Manuals consume speed and have an endurance-scaled duration. C catches rails only inside a short input window with actual XYZ proximity, descending contact and travel along the rail. A catch never pulls a distant rider onto a rail.

Landing uses the local 3D normal, incoming normal impact and completed trick recovery. Clean and Perfect landings can bank after 0.35 seconds of stable ground; air, manuals and rails reset that timer. Distinct tricks increase the combo multiplier; repeats diminish in value. A full bail loses unbanked points and restores a safe XYZ checkpoint through Recovery. Free Skate has no timer. Skate Run applies limited assistance only on suitable grounded plaza terrain; no assistance is added in air, on rails, in manuals or in bowls/half-pipes.

Local 3D records use `pokemon-skate-3d-free` and `pokemon-skate-3d-run`, so scores from the former side-profile game do not compete with the changed physics. Tick logs export version 2 with `dimensions: 3`, initial mode/profile/spawn and logical action edges. The engine's `replay` function reproduces trusted recordings. Very long sessions beyond the 12,000-edge log cap do not retain complete replay history.

## Verification and limits

Automated 3D tests cover steering across X/Z, braking/reversal, XYZ replay at 30/60/144 FPS, radial terrain normals, natural half-pipe reversal, bounded held-pump rejection, assistance restrictions, outgoing kicker trajectory, surface-normal landing evaluation, diagonal rail proximity and timed catches, rail exits, manuals and banking, XYZ bail recovery, offline profiles, ollies, stance spins, timers, replay logs and spatial obstacle collisions. UI tests cover selection, motion, focus pause, keyboard resume/restart, timed completion and cleanup. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Browser testing verifies WebGL rendering, the textured Pikachu rider, throttle/steering and perspective camera operation. Standard gamepad mappings are implemented; physical controller hardware has not been tested. This remains a prototype requiring hands-on balance/performance tuning and more detailed species animation before a release candidate. League, multiplayer, progression and external services remain deferred.
