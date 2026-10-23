# Minimal shared game registry — audit and implementation

## Scope and audit baseline

Audited the working repository on 2026-10-22 before implementation: src/main.ts, src/shared/game.ts, player.ts, legacy.ts, the six src/games/*/index.ts entries, native game rules/assets, src/data/model.ts and catalog.json, trivia/portrait manifests, Vite middleware, release packager, and bundled legacy browser files. Read standalone Skate's sibling data/player interfaces for comparison only. Baseline: all 135 tests passed.

The hub already discovered modules eagerly with import.meta.glob and validated IDs/routes through a small createRegistry helper. It mounted native games with GameContext or delegated iframe launch to legacyMount. It also hard-coded the three iframe game IDs. This change extends that existing system; it does not introduce a second registry or a new launcher.

The untracked docs/FIRE-ASH-TECHNICAL-COMPARISON.md existed before this work and is unrelated; it was left untouched.

## Inventory: stable identities and boundaries

Routes below are hash routes in the browser, e.g. #/games/guess. The registered route omits the #. Existing names, versions, controls, score keys and saveVersion declarations are retained.

| Stable ID | Registered route | Launch | Pokémon data | Existing save ownership |
| --- | --- | --- | --- | --- |
| guess | /games/guess | inline | shared-catalog | hub: current round, separately keyed existing daily round |
| jungle-caravan | /games/jungle-caravan | inline | shared-catalog | hub: version 2 crew/seed manifest, not an active run |
| pocket-capsule-monsters | /games/pocket-capsule-monsters | inline | shared-catalog | hub: version 1 match with derived fighter roster |
| chess | /games/chess | iframe | independent | game: puzzle completion/current selection and camera settings |
| arena | /games/arena | iframe | independent | none: battle state is in memory |
| pokemon-skate | /games/pokemon-skate | iframe | independent | game: standalone score/settings records, not active-run resume |

Each entry remains in its current src/games/<id>/index.ts. No central duplicate list of registrations was added. The independent registry test deliberately pins the current IDs/routes to catch accidental renames.

Hub routes #/, #/trainer, #/about and the pre-existing #/daily remain outside game registration. Parsing a syntactically valid game hash does not guarantee membership; the hub still resolves the ID through the registry and handles unknown games as before.

Development gets availability from /api/legacy-status. Vite serves allowlisted Chess/Arena sibling browser files and ../Pokemon Skate/dist under /legacy/<id>/. Production gets availability from legacy/status.json and launches packaged browser snapshots at the same relative path. assetUrl retains support for GitHub Pages repository subpaths. The registry does not replace middleware, release packaging, or iframe lifecycle cleanup.

## Minimal contract and incremental adoption

src/shared/registry.ts defines metadata independently of gameplay and player services:

```ts
interface GameRegistration {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly route: `/games/${string}`;
  readonly capabilities: {
    readonly launch: 'inline' | 'iframe';
    readonly pokemonData: 'shared-catalog' | 'independent';
    readonly saves: 'hub' | 'game' | 'none';
  };
}
```

1. Extracted metadata validation and registry construction into registry.ts. IDs are lower-case alphanumeric segments separated by single hyphens; names must be nonblank; versions use a numeric MAJOR.MINOR.PATCH shape with optional pre-release/build labels; routes must exactly match the stable ID. Missing/invalid capability values and duplicate IDs fail with contextual errors. Duplicate routes cannot pass because every route must match its unique ID.
2. GameModule extends GameRegistration while retaining all existing presentation, mount/cleanup, resume and context fields. shared/game.ts keeps the existing createRegistry import path, validates mount functions, and re-exports routeGame and metadata types. No callback is invoked by registration.
3. Added explicit capability declarations to all six existing entries. The hub now uses capabilities.launch to distinguish iframe launches, preserving availability and existing session-lifecycle behavior. No new activity collection was added.

The standalone metadata createRegistry also works without mount functions or hub presentation. Registries are exposed as ReadonlyMap at the TypeScript boundary. This does not deep-freeze game objects or provide a runtime security boundary. Capabilities describe current integration ownership, not permissions, implementation guarantees, full-roster coverage, or a resume promise. Existing resume adapters continue to decide whether a continuation exists.

IDs must remain stable even if names or presentation change. Game version, data schemaVersion and per-game saveVersion are separate concepts; registration neither upgrades nor interprets stored state. Adding another game requires an entry implementing GameModule and these declarations; automatic discovery and validation handle it. No additional progression, analytics, score, or challenge APIs were added.

## Pokémon data audit and incompatible interfaces

The hub's bundled src/data/catalog.json has schemaVersion 1, 1,025 species and 1,351 forms. Species IDs and form IDs are distinct namespaces: form 10026 is a non-default Aegislash form under species 681. CharacterDatabase projects requested fields via getSpecies/getForm/queryForms and clones results. Stats use named hp/attack/defense/specialAttack/specialDefense/speed fields, types use lower-case names, dimensions use metres/kilograms, missing information remains null, and unknown IDs return undefined. See CHARACTER-COVERAGE.json for source hashes and coverage.

| Consumer | Interface and incompatibility |
| --- | --- |
| Mystery | Default forms from CharacterDatabase plus a separate species-keyed trivia.json and form-keyed portrait manifest. These resources are not methods of the database. Eligibility also requires art/trivia. It cannot treat every catalog form as a puzzle. |
| Caravan | Curated eight-form projection to Crew, including speciesId, named base stats and one selected ability string. Six crew slots require distinct species. Derived vehicle/combat metrics are game rules, not canonical Pokémon facts. |
| Capsule Monsters | Curated eight forms limited by local models. Projection converts canonical stats into game-specific hp/attack/defense/cost/range/move. Match.roster stores the derived Fighter snapshot. These values are not interchangeable with base stats or Caravan Crew. |
| Chess | Piece-symbol map (K/Q/R/B/N/P and lower-case) to [numeric ID, display name], plus game-local art/models. Piece identity and chess rules are separate from canonical species/form identity. No CharacterDatabase is passed into its iframe. |
| Arena | Arena3D.battleCatalog supplies species keyed by display name; six stats are positional arrays, types use title-case names, and move/type-chart data is game-local. It cannot directly consume the hub's projected Form/Species objects. |
| Standalone Skate | Own four-species snapshot and a smaller CharacterDatabase interface exposing only getForm(id, fields) over id/displayName/stats. It lacks species queries, the full form contract and the hub service context. Rider Profile stats are derived normalized attributes; models available for a subset have procedural fallbacks. No data is bridged through its iframe. |

Catalog completeness is not equivalent to model/game-roster completeness. Moves are nullable, only eight original forms retain seeded move lists, and detailed move metadata/learnsets are incomplete. Nine forms have unavailable abilities. Full evolution conditions and cosmetic-form coverage are not imported. Raw artwork/sprite fields and bundled portrait/model manifests are distinct asset sources. No casts or adapters were added to hide these differences.

## Save audit and preservation

src/shared/player.ts retains its pokemon-arcade:v1: namespace and version-1 storage envelope. Game-specific validators and payload versions still own compatibility. Existing guess, guess-daily:<date>, jungle-caravan and pocket-capsule-monsters save keys remain untouched. Scores, settings, recent games and existing activity summaries are unchanged.

Chess retains pokemon-chess-puzzles ({solved,current}) and pokemon-chess-camera settings outside the arcade namespace; the current board/history remain in memory. Arena has no persistent battle save in the audited browser code. Standalone Skate uses its own pokemon-skate:v1: namespace with version-1 score/settings envelopes, including pokemon-skate-3d-free/run score categories. The arcade's older Skate scores, if present in its namespace, are not moved or merged.

Same-origin iframe storage may share the browser origin but does not share an API contract. Different origins (desktop localhost versus GitHub Pages) have distinct stores. Registry metadata does not change either behavior. No save migration, key renaming, data import or runtime write was introduced.

## Future read-only Pokémon data service — recommendation only

Start with a versioned local read-only interface around the existing catalog rather than requiring an online server. Keep getSpecies, getForm and queryForms projections, explicit speciesId/formId types, lower-case canonical type IDs, named base stats, declared units, nullable coverage and unknown-ID behavior. Return isolated snapshots/read-only values; expose schema version, source revision and provenance independently of game/save versions. Include optional read-only trivia and asset resolution interfaces rather than mixing battle rules with canonical facts.

Give each game a narrow adapter producing its current Crew, Fighter, piece map, Arena catalog or rider Profile. Keep derived stats, balance, move loadouts and curated asset-compatible rosters in game-owned adapters. Validate mappings, alternate forms, missing fields and enum conversions with fixture comparisons before switching any consumer. Saved match roster snapshots must remain authoritative for an existing match.

A later iframe consumer could receive a pinned JSON snapshot or an explicitly designed request/response bridge, versioned separately from registration. If a network service becomes necessary, expose versioned read-only resources with revision-aware caching and an offline bundled fallback. Do not add write endpoints, player state, progression, telemetry or challenge scheduling to that service. No service or iframe bridge is implemented in this phase.

## Verification, risks and next steps

- Baseline: 135 passing tests. After implementation: 153 passing tests across 24 files, including 18 registry cases. Existing gameplay, UI, save/restore, iframe cleanup, routes, catalog and server tests remain green.
- Registry tests cover malformed metadata/capabilities, duplicate IDs, exact route parsing, version labels, all six migrated entries, invalid mount callbacks, unchanged input metadata and zero registration-time mount/storage access.
- Typecheck, lint, production build and release verification pass. The release contains 1,115 files (~297.9 MiB). Existing large-chunk warnings remain; eager discovery/loading was intentionally preserved.
- Validation fails fast during hub startup, as the previous registry did. A malformed future entry will block startup with a more specific error. Capabilities are declarations and can drift unless reviews/tests remain current.
- Standalone development/snapshot skew remains possible: local sibling builds can differ from tracked production snapshots. Build packaging behavior was not changed. The release check verifies packaging, not complete gameplay equivalence of sibling source/build versions.
- Next steps: review this contract; add/update declarations when games change ownership; separately design read-only data adapters and compatibility fixtures before migrating a data consumer. Keep any future save migration, roster expansion or gameplay work in its own phase.
