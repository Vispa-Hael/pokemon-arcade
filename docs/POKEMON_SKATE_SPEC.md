# Pokémon Skate — Implementation Design Specification
**Version:** 1.0  
**Status:** Gameplay architecture approved for prototype  
**Platform:** Existing Pokémon Arcade ecosystem  
**Target:** Browser-based, keyboard-first, gamepad-compatible  
**Game type:** 2D side-profile arcade skateboarding with 2.5D visual presentation

---

## 1. Product Definition

Pokémon Skate is a skill-based skateboarding game in which players directly control Pokémon riding skateboards.

Gameplay combines momentum-driven skateboarding, terrain-based tricks, score multipliers, and Pokémon-specific skating attributes.

### Game Modes

**Free Skate**
- Manual movement and direction control.
- Unrestricted exploration within connected 2D skateable areas.
- No timer or mandatory objectives.
- Players can practice ramps, half-pipes, grinds, and combos.

**Skate Run**
- Assisted forward momentum on suitable ground.
- Timed obstacle courses, initially 60–90 seconds.
- Players control acceleration overrides, braking, jumping, tricks, and landings.
- Score and completion objectives.

**Skate League — Future**
- Competitive scoring challenges using the same physics.
- Rival Pokémon, score targets, and eventual ghost replays.
- Excluded from initial MVP.

All modes must share the same physics engine, terrain representation, trick system, and scoring rules.

## 2. Coordinate and Physics Model

### 2.1 Coordinate System

Use a two-dimensional world-space coordinate system independent of screen pixels:

- X: horizontal distance.
- Y: vertical position, increasing upward.
- Positive X: default Skate Run direction.
- Surface tangent: local direction along skateable geometry.
- Surface normal: perpendicular to the terrain surface.

Rendering converts world coordinates into screen coordinates.

Do not store physics positions exclusively in pixels.

### 2.2 Simulation

Use a fixed simulation timestep, provisionally 1/120 second, with an accumulator and capped catch-up steps.

Rendering may interpolate between simulation states.

The game must behave consistently at 30, 60, and 144 FPS. Input events must be timestamped or assigned to simulation ticks.

### 2.3 Required Physics State

Track at least:

- Position and velocity.
- Board orientation and angular motion.
- Current terrain or rail reference.
- Surface tangent and normal.
- Ground contact status.
- Movement direction and stance.
- Jump charge.
- Pump availability and cooldown.
- Active trick state and recovery.
- Combo state.
- Pokémon skating attributes.

### 2.4 Movement States

Use an explicit finite-state machine:

| State | Behavior |
|---|---|
| Grounded | Rolling, pushing, braking, and following terrain |
| Manual | Grounded trick-extension state with limited stability |
| Airborne | Gravity, limited directional control, and aerial tricks |
| Grinding | Motion constrained to a rail path |
| Bail | Failed landing or collision; temporary loss of control |
| Recovery | Restores normal movement after a crash |

Manual is mechanically grounded but should be represented as a distinct state or substate.

Trick animations and Pokémon special effects must not independently overwrite physics position or velocity.

### 2.5 Physics Invariants

- Grounded motion follows the tangent of skateable terrain.
- Gravity affects motion in all applicable states.
- Horizontal speed cannot reverse instantaneously under ordinary input.
- Valid collisions must not inject unexplained kinetic energy.
- Airborne movement cannot receive ground acceleration assistance.
- Rails and ramp surfaces must use explicit collision geometry.
- Rendering animations cannot determine whether a landing succeeds.
- Every failure state must have a reliable recovery path.

## 3. Movement Control

### 3.1 Free Skate

Directional inputs apply acceleration toward the requested direction.

If the player presses the direction opposite current travel, the Pokémon brakes until stopped before accelerating backward.

Momentum is preserved when no direction is pressed, subject to rolling resistance, slope, and other applicable forces.

### 3.2 Skate Run

Implement an assistance controller that applies limited forward acceleration toward a configurable cruising velocity.

Assistance is active only when:

- The rider is grounded on an eligible low-slope surface.
- The player is not actively braking.
- The rider is not performing a manual.
- The rider is not in a special movement state.
- Current forward velocity is below the assistance target.

Assistance must not activate during flight, grinding, or steep half-pipe transitions.

The player may push above cruising speed manually.

Assistance must not directly set the rider's velocity or guarantee obstacle clearance.

### 3.3 Speed and Resistance

Support configurable parameters for:

- Acceleration force.
- Braking force.
- Rolling resistance.
- Airborne steering influence.
- Maximum practical speed.
- Ground-to-air transition behavior.

Use soft speed limits or diminishing acceleration rather than abrupt velocity clamping wherever practical.

## 4. Terrain and Half-Pipe Physics

### 4.1 Terrain Representation

Use a shared world representation for flat ground, curved ramps, quarter pipes, half-pipes, and platforms.

Curved surfaces must have continuous or sufficiently smooth tangents and normals. Prefer spline or analytic curve geometry, or a proven equivalent supported by the chosen physics engine.

Render geometry and collision geometry should originate from compatible level data.

### 4.2 Ramp Behavior

While grounded, velocity follows the local surface tangent.

A kicker ramp converts approaching horizontal movement into upward movement according to its profile.

At the end of the ramp, the rider separates naturally from the surface with the appropriate outgoing velocity.

An ollie can add a separate normal-direction launch impulse.

Avoid scripted launch velocities tied exclusively to entering a trigger region.

### 4.3 Half-Pipe Behavior

Half-pipes must support:

- Entry from either direction.
- Acceleration while descending.
- Deceleration while ascending.
- Natural reversal when insufficient momentum remains.
- Pumping to gain energy.
- Lip launches when momentum permits.
- Airborne tricks.
- Re-entry onto curved surfaces.
- Controlled bails on invalid landing conditions.

A player should be able to descend, ascend the opposite wall, lose speed, reverse, and return without scripted direction changes.

### 4.4 Pumping

Assign **Up Arrow** to pumping.

Pumping is a timed input that increases useful travel momentum when performed within an eligible curved-transition region.

Eligibility is determined by surface geometry, direction of movement, and the rider's progression through the transition.

Design requirements:

- No pumping on flat terrain.
- No pumping during flight.
- No continuous speed gain from holding the key.
- One effective pump per relevant transition traversal, subject to reset conditions.
- Bounded energy gain.
- Timing feedback: early, good, perfect, late.
- An imperfect pump gives a smaller benefit or none.

Implement pump eligibility and cooldown explicitly. Do not use arbitrary animation triggers to add speed.

## 5. Input Specification

| Input | Function |
|---|---|
| Left Arrow | Reverse acceleration / brake when traveling right |
| Right Arrow | Forward acceleration / brake when traveling left |
| Up Arrow | Pump on eligible transitions |
| Down Arrow | Manual on ground; contextual rail catch in air |
| Space (hold/release) | Charge and execute ollie |
| J | Flip trick |
| K | Spin trick |
| L (hold) | Grab trick |
| Shift | Pokémon signature ability |
| R | Restart run |
| Escape | Pause/menu |

### 5.1 Contextual Input Priority

Down Arrow is contextual:

1. In the air, a fresh press requests a grind catch within the configured timing window.
2. On grounded terrain, holding Down initiates a manual.
3. While already grinding, Down does not create another grind.
4. When no appropriate surface is available, an invalid catch request expires without teleporting the rider.

The controls must expose equivalent logical actions so gamepad mapping can be added without changing gameplay rules.

### 5.2 Jump Behavior

- Hold Space while grounded to charge.
- Release to apply an ollie impulse.
- Charge duration influences impulse within a configurable range.
- Charge must not continue accumulating during flight.
- A new ollie cannot occur in midair unless a future special ability explicitly permits it.
- Support a short jump input buffer where appropriate.

Initial charge target: approximately 0.15–0.65 seconds, adjustable through playtesting.

## 6. Trick System

### 6.1 Categories

**Flip**
- Kickflip.
- Heelflip.
- Additional variations later.

**Spin**
- 180°.
- 360°.
- Additional rotations when sufficient airtime exists.

**Grab**
- Held aerial poses.
- Duration affects score within bounded limits.

**Grind**
- Rail or ledge contact.
- Momentum-dependent traversal.

**Manual**
- Grounded balance state used to extend combinations.

**Pokémon Signature**
- Character-specific special move.
- Charged or activated through a defined ability system.

### 6.2 Trick State

Every trick must define:

- Identifier and category.
- Entry conditions.
- Start time.
- Minimum completion duration.
- Logical orientation or pose changes.
- Recovery duration.
- Base score.
- Landing compatibility.
- Cancellation and bail behavior.

Tricks can be combined when their timing and compatibility rules permit.

The engine must distinguish logical trick completion from visual animation completion.

### 6.3 Spins and 2D Presentation

Because gameplay operates in a side-profile plane, spins and board flips require separate logical and visual representations.

Yaw-like 180° and 360° skating spins are scored through trick state and illustrated with an animation or 2.5D effect.

Do not rotate the physics collision body as though every visual spin represents a physical somersault.

A completed 180° changes skating stance, not world velocity.

This must be explicitly implemented to avoid coupling trick animations to collision orientation.

## 7. Assisted Technical Landing System

This is the approved landing model.

Landing success depends on:

1. Valid contact with a skateable surface.
2. Completion or safe recovery of the current trick.
3. Board orientation compatibility with the local landing tangent.
4. Incoming velocity and impact severity.
5. Configurable assisted-alignment tolerance.

The landing controller may provide limited alignment assistance but cannot rescue grossly incompatible poses, incomplete board flips, or dangerous collisions.

### 7.1 Landing Outcomes

| Outcome | Behavior |
|---|---|
| Perfect | Trick completed, strong alignment, controlled impact; bonus score |
| Clean | Safe landing with minor imperfections; standard score |
| Scraped | Marginal but recoverable landing; loses momentum or score quality |
| Bail | Invalid landing; unbanked combo lost |

Perfect and Clean landings bank the current combo when no manual, grind, or immediate linked action keeps it open.

A Scraped landing may retain the combo with a penalty if contact remains controlled.

An impact beyond the safe collision envelope results in a Bail.

### 7.2 Banking Timing

A completed grounded landing should bank an open combo after a short stable-ground interval, initially approximately 0.35 seconds.

Starting a valid manual or another connected trick before the interval ends keeps the combo active.

The stable-ground timer must not continue during an airborne or grinding state.

## 8. Grinds and Manuals

### 8.1 Grinds

A grind catch requires:

- A valid rail contact candidate.
- An active or recently buffered catch input.
- An acceptable approach direction.
- Appropriate board and rider state.

On a successful catch, motion becomes constrained to the rail path.

Rail traversal must account for:

- Current momentum.
- Rail slope.
- Friction.
- Entering and exiting the rail.
- Jumping off.
- Rail endpoints.
- Failed contacts.

Do not implement grinding by teleporting the rider onto the nearest rail from arbitrary distances.

### 8.2 Manuals

A manual extends a grounded combo while consuming speed or stability.

Manuals must have a bounded duration or increasing difficulty.

Holding Down indefinitely cannot preserve a combo without meaningful cost.

Releasing the manual returns to normal grounded movement.

A manual may lead directly into another ollie when valid.

## 9. Obstacle Types

The first level must include:

- Flat terrain.
- Shallow kicker ramp.
- Quarter-pipe transition.
- Full half-pipe.
- Flat rail.
- Raised platform or ledge.
- Short gap.
- Static collision obstacle.

Each object must use the shared collision and terrain system wherever applicable.

No obstacle should require a unique player-controller implementation.

Static obstacles can cause stumbles or bails based on impact speed and contact geometry.

No moving hazards, elemental terrain hazards, enemies, or destructible objects are required in MVP.

## 10. Combo and Scoring Engine

Score calculation is separate from physics and rendering.

Illustrative scoring model:

**Final Combo Score = Base Trick Sum × Combo Multiplier × Landing Quality**

Support:

- Base trick values.
- Trick chaining.
- Multipliers for distinct actions.
- Diminishing returns for repeated identical tricks.
- Manual and grind combo extensions.
- Landing-quality modifiers.
- Unbanked score tracking.
- Banking after stable contact.
- Loss of unbanked points on a full bail.

Prevent exploits such as indefinite manuals, repeated stationary trick activation, or accidental multiple scoring events from the same action.

The scoring engine must consume validated gameplay events rather than infer tricks from visual animations.

## 11. Pokémon Attribute Adapter

Use the shared Pokémon catalog as a source of species information.

The skate game owns the translation of canonical Pokémon stats into gameplay attributes.

| Canonical stat | Skate attribute |
|---|---|
| HP | Endurance |
| Attack | Pop |
| Defense | Stability |
| Special Attack | Flair |
| Special Defense | Focus |
| Speed | Pace |

Normalize these into bounded skating attributes.

Initial ordinary performance differences should generally stay within approximately ±10% of baseline values until balancing establishes a better range.

Do not directly use raw Pokédex Speed as world velocity.

### Initial Pokémon

- Pikachu — acceleration and quick-combo specialist.
- Squirtle — stability and technical skating specialist.
- Machop — jump and vert specialist.
- Gengar — aerial style and special ability specialist.

Each Pokémon has:

- Species identifier.
- Skating profile.
- One signature ability.
- Character presentation metadata.
- Animation configuration.
- Skateboard attachment settings.

Pokémon-specific attributes may affect timing windows and physical parameters, but should not cause inconsistent simulation rules.

The initial physics test must work with a placeholder rider before adding Pokémon-specific behavior.

## 12. Visual and Camera System

### Presentation

- 2D side-profile physics.
- Stylized 2.5D characters and environments.
- Layered background parallax.
- Readable terrain silhouettes.
- Particle feedback for special tricks.
- Minimal visual obstruction during high-speed play.

### Camera

- Horizontal follow with velocity-dependent look-ahead.
- Vertical framing during jumps.
- Slight zoom-out at high speeds.
- Wider framing around half-pipes.
- Smooth transitions between camera targets.
- Optional camera smoothing reduction during precision sections.

The camera cannot alter gameplay collisions.

### Character Rendering

Use a shared skateboard transform with species-specific rider offsets and poses.

The initial animation vocabulary should cover:

- Idle.
- Pushing.
- Crouching.
- Jumping.
- Flipping.
- Spinning.
- Grinding.
- Manual.
- Landing.
- Bail.

Avoid assuming that all Pokémon share the same body proportions or posture.

## 13. Game Module Architecture

Recommended logical components:

| Module | Responsibility |
|---|---|
| `SkateGame` | Lifecycle, orchestration, loading, pause |
| `SkatePhysics` | Integration, terrain contact, velocity, collision |
| `MovementController` | Free Skate and assisted Skate Run policies |
| `TerrainSystem` | Ground, ramps, curves, surface queries |
| `PlayerStateMachine` | Locomotion states and transitions |
| `InputMapper` | Keyboard/gamepad action mapping |
| `TrickSystem` | Trick validation, timing, recovery |
| `LandingEvaluator` | Surface, impact, orientation, quality |
| `GrindSystem` | Rail contact and constrained motion |
| `PumpSystem` | Timing eligibility, impulses, cooldown |
| `ComboSystem` | Validated trick events, multipliers, banking |
| `PokemonSkateAdapter` | Canonical Pokémon data to skating attributes |
| `SkateRenderer` | Scene and animation presentation |
| `SkateCamera` | Tracking, zoom, framing |
| `SkateHUD` | Speed, scores, combos, abilities, time |
| `SkateLevelLoader` | Level data and geometry construction |
| `SkatePersistence` | Local best scores and settings |

These are logical responsibility boundaries, not mandatory one-file-per-module requirements.

Actual names, file paths, libraries, and component structure must be reconciled with the existing repository before implementation.

### Ownership Rules

- Physics owns movement and collision state.
- State machine owns valid movement transitions.
- Trick system owns trick timing and completion.
- Landing evaluator determines landing outcomes.
- Combo system owns scoring and banking.
- Rendering reads simulation state but cannot rewrite it.
- Pokémon adapter supplies bounded gameplay parameters.
- Arcade hub owns game discovery and launching, not internal skate mechanics.

## 14. MVP Scope and Build Gates

### Gate 1 — Physics Playground

**Deliverables**
- Placeholder skateboard rider.
- Movement physics.
- Braking and reversal.
- Ramp and half-pipe geometry.
- Pumping.
- Basic ollie.
- Free Skate and Skate Run movement policies.
- Debug overlay.

**Pass criteria**
- Half-pipe reversals occur naturally.
- Curved transitions are smooth.
- Pumping cannot generate unlimited momentum.
- Assisted speed never activates in air.
- Both movement modes share the same simulation.

### Gate 2 — Tricks and Obstacles

**Deliverables**
- Flip, spin, grab.
- Grinds and manuals.
- Landing evaluator.
- Bail/recovery.
- Combo scoring.
- Core obstacles.

**Pass criteria**
- Failed tricks are reproducible.
- Landings use actual surface information.
- Tricks bank correctly.
- No infinite scoring loops.
- Rail contact and exit work reliably.

### Gate 3 — Pokémon Integration

**Deliverables**
- Shared catalog adapter.
- Four Pokémon profiles.
- Character selection.
- Signature abilities.
- Basic Pokémon rendering.

**Pass criteria**
- Each Pokémon is distinguishable in play.
- No direct dependency on live external Pokémon APIs.
- All Pokémon use the same simulation.
- Different body shapes do not affect collision reliability.

### Gate 4 — Arcade Release Candidate

**Deliverables**
- One polished level.
- Free Skate.
- Timed Skate Run.
- Camera and HUD.
- Restart and pause.
- Local records.
- Arcade hub integration.

**Pass criteria**
- Complete runs without crashes or broken states.
- Responsive keyboard play.
- Stable frame pacing on target hardware.
- No critical regressions in other arcade games.

Skate League, multiplayer, equipment progression, and additional maps are explicitly deferred.

## 15. Test and Instrumentation Requirements

Include development-only display or logging for:

- Player state.
- Position and velocity.
- Speed and ground-contact state.
- Contact tangent and normal.
- Ramp and rail identifiers.
- Assisted acceleration activation.
- Pump eligibility and cooldown.
- Active trick and recovery progress.
- Landing quality and reason for failure.
- Current unbanked combo score.

Create repeatable tests for:

1. Manual accelerate, brake, stop, reverse.
2. Consistent terrain traversal at different rendering frame rates.
3. Natural half-pipe reversal without input.
4. Pump energy bounded by eligibility and cooldown.
5. Skate Run assistance inactive during noneligible states.
6. Ramp exit trajectory consistency.
7. Safe and unsafe ramp landings.
8. Rail catch acceptance and rejection.
9. Valid combo extension.
10. Loss of unbanked points after a full bail.
11. Reliable recovery from collisions.
12. Pokémon attribute changes affecting intended parameters only.

Where practical, record time-stamped logical inputs and initial game conditions to reproduce physics bugs.

## 16. Configuration and Tuning

Keep gameplay tuning values in configuration rather than scattered literals.

Examples:

- Gravity.
- Push acceleration.
- Braking force.
- Rolling resistance.
- Assistance cruising velocity.
- Ollie charge time and impulse.
- Pump strength and eligibility thresholds.
- Maximum impact tolerance.
- Assisted landing angular tolerance.
- Grind catch window.
- Manual stability duration.
- Combo banking delay.
- Bail recovery time.
- Camera smoothing and look-ahead.

The initial values are hypotheses requiring hands-on tuning, not fixed product requirements.

## 17. Explicit Non-Goals

Do not build the following during the foundational MVP:

- Fully navigable 3D parks.
- Multiplayer.
- Complex story/career mode.
- Equipment marketplaces.
- Procedurally generated courses.
- Large Pokémon roster.
- Evolving Pokémon during runs.
- AI skating opponents.
- Combat systems.
- Live leaderboards.
- External account synchronization.
- A second physics engine exclusively for Skate Run.

The first priority is a consistent, enjoyable skating simulation.

---

**Definition of success:** The placeholder rider must be fun to control in a half-pipe and on a basic obstacle course before additional Pokémon content or progression systems are developed.