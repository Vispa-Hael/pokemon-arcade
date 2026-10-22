# Implementation report — 2026-10-21

## Outcome

Implemented a working local arcade in `F:\Pokemon Arcade`. Start with `npm run dev` and open http://127.0.0.1:4173/. The library launches the independent mystery game, existing Chess, and existing Arena. Nothing was deployed, pushed, or committed. This directory was initially empty and has no Git repository. Existing game folders were read only. Tracker is explicitly outside the arcade and has no dependency or integration.

## Architecture and discovery

Chess is a plain-browser JavaScript application with offline worker/Three.js bundles, computer play, puzzles, and engine/animation/mode tests. Arena is a plain-browser game with a bundled Three.js renderer and an optional Electron shell; it remains a prototype. Both have working browser entry points. Their existing npm test suites passed before final delivery.

Decision: a separate application with TypeScript and Vite, using the browser-native DOM rather than adding a React dependency for this small hub. This keeps the vanilla browser games intact, provides typed contracts and Vite tooling, and avoids coupling independent games to each other. Hash routes work without a history-fallback backend. There is no application backend or account system. A small Vite dev/preview middleware serves an allowlist of existing sibling game files, read only. Node modules, desktop code, package files and paths outside the game roots are not exposed. This adapter is intended for loopback-only local use.

The host discovers `src/games/*/index.ts` using a Vite glob. Each module declares ID, route, name, version, status, description, instructions, controls, optional thumbnail/save version and mount/cleanup entry point. Shared context supplies character and player services. Games do not import other games. Scores/results and saved state use the injected player service; no mandatory game lifecycle/plugin bus was added.

## Directory structure

```text
F:\Pokemon Arcade\
  index.html                 browser shell
  package.json / package-lock.json
  tsconfig.json / eslint.config.js
  vite.config.ts             local read-only game adapter, dev/preview
  src/
    main.ts                  hub, routing, game pages and credits
    style.css                responsive visual system
    data/
      model.ts               typed species/form/individual models, validation, queries
      catalog.json           bundled imported snapshot
    shared/
      game.ts                module/context contract, registry and route parser
      player.ts              versioned local services, score deduplication
      legacy.ts              shared iframe launch adapter and cleanup
    games/
      guess/index.ts         playable mystery-game view
      guess/rules.ts         deterministic rules and save validation
      chess/index.ts         Chess metadata/adapter
      arena/index.ts         Arena metadata/adapter
  scripts/import-data.ts     bounded, resumable cached data ingestion
  tests/core.test.ts         data, identity, rules, registry, persistence
  tests/ui.test.ts           mount/play/restore/restart, routes and legacy launch
  tests/server.test.ts       HTTP serving, availability, denied-file checks
  docs/POKEAPI-LICENSE.md     upstream notice and terms
  docs/IMPLEMENTATION_REPORT.md
  README.md                  local operation and extension guide
  .cache/pokeapi/             ignored raw API cache
  dist/                      generated production output
```

## Character database: implemented with limited coverage

Actual snapshot: **8 species and 8 Pokémon resource forms**. Bulbasaur (1), Charmander (4), Charizard (6), Squirtle (7), Blastoise (9), Pikachu (25), Eevee (133), Aegislash (species 681) represented by Aegislash Blade (form 10026). The playable demo selects from **7 imported default forms**.

Species and form primary keys are numeric source resource IDs, independent of names. Individual Pokémon have their own string instance ID and form reference. Species records include National Dex, generation, display name, genus, description, habitat, evolution parent/chain references and varieties. Forms include height in meters, weight in kilograms, types, abilities, six base stats, derived total, move IDs/names and sprite/artwork URL references. Missing metadata is null. Queries project explicitly selected fields, use ID maps, and return copies to protect the catalog. Type/default/species filters are available.

PokéAPI is the data source: https://pokeapi.co/docs/v2/. Its documentation requests local caching. The importer uses persistent response caching, sequential requests spaced at least 600 ms apart, 20-second timeouts, a maximum 30 IDs per explicit invocation, validation and atomic per-record checkpoints. Rerunning the seed import was verified to skip all eight completed records. An interrupted network-failure recovery was not forcibly tested. No API key, paid API, runtime character network request, or broad bulk ingestion is required.

Partial/proposed: evolution chains are references rather than expanded rules; varieties can reference unimported forms; regional forms can be represented through species/variety identity but none are bundled; cosmetic Pokémon-form resources are not imported. Detailed move power/type/accuracy/PP/damage-class fields are nullable and currently unpopulated. No image binaries were acquired. Sprite/artwork references are retained without displaying or downloading them. Catalog refresh/reconciliation is a future task; completed imports are skipped.

## Hub: implemented

Library cards, individual hash routes, descriptions, instructions, control labels, versions, playable/prototype/availability badges, launch controls, consistent return navigation, missing-route handling, loading and startup-error messages, recent games, mystery score totals and credits/settings page. Responsive layouts cover the hub and demo, with reduced-motion CSS and a persisted preference. Browser preview at a roughly 800-pixel viewport was inspected; phone/touch hardware was not exercised.

## Existing games: integrated without gameplay changes

- **Chess — playable:** embedded from its sibling folder after Launch. Computer, local two-player and puzzle modes remain original. Browser inspection confirmed board/roster and mode controls loading. The existing rules, skeletal animation, AI/puzzle and mode suites pass. Existing assets are served from the original folder; no rights claim or redistribution was added. Its README retains asset provenance.
- **Arena — prototype:** embedded from its sibling folder after Launch. Browser inspection confirmed roster, stats, WebGL canvas UI and sample battle entering autopilot. Existing smoke tests pass. Desktop keyboard/WebGL 2 required; touch controls, audio, multiplayer and save support remain unfinished.
- Both retain their own data and game behavior. They have not been migrated to the new character service or shared score/save services. The demo proves the new shared-data path. Legacy game persistence remains scoped to its original implementation and browser origin; old file-origin preferences are not migrated.
- Missing sibling folders yield unavailable launch messages. This is a local adapter, not a portable redistribution of the existing games. Hosting only `dist/` provides the hub/demo; use Vite dev/preview to launch sibling games.

## Demonstration game: implemented and playable

Who’s That Pokémon? randomly selects a default form through the shared database. Five attempts, four progressive hints (type, generation, height/HP, name prefix/length), normalized guesses, win/loss, new rounds, automatic resume and score tracking are implemented. Rules accept an injected random source for deterministic tests. A win starts at 100 points, minus 15 for each prior miss and 10 for each hint, with a minimum winning score of 10. Losses earn zero. Completed results deduplicate by round UUID. The view uses an original CSS mystery graphic rather than third-party character art. Browser play verified a correct Squirtle guess after one hint earning 90 points.

## Player services: implemented

Versioned localStorage envelopes under `pokemon-arcade:v1:` provide game settings, saved state, recent games and up to 100 result records per game. The demo validates and resumes state; future versions or malformed data fall back safely. Storage failures retain writes in session memory and display a warning in the demo/settings view. Services accept a storage adapter to permit future replacement; cloud sync/authentication are not implemented. Each saved game owns its schema version. Recent games are limited to eight; results to 100, so displayed totals are bounded-history totals, not lifetime aggregates. Opening a new round replaces the prior demo round; no round archive is maintained.

## Verification results

All final checks passed:

| Command / check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed; also executed as part of production build |
| `npm test` | 33 tests, 3 files, all passed |
| `npm run build` | Passed; Vite production output generated |
| `npm run import:data` after initial ingestion | All 8 records skipped; resume/cache path verified |
| `npm test` in `F:\Pokemon Chess` | Rules, animation, AI/puzzles and modes passed |
| `npm test` in `F:\Pokemon Arena` | Movement, attacks, types, energy, dodge, pause, sample, victory/defeat passed |
| Production preview HTTP smoke on port 4180 | Hub, availability API, Chess and Arena entry points returned 200 |
| Browser checks | Library, progressive hint and winning demo guess, Chess board/controls, Arena sample launch |
| HTTP adapter restriction tests | Non-game paths and traversal attempts returned 404 |

No desktop installers were rebuilt. The Electron desktop-specific test and separate model-validation command were not run because this integration uses the browser entry points. Real phone input, long play sessions, and every graphics-driver/WebGL combination remain unverified. No pre-existing source files were modified to satisfy tests.

## Remaining tasks and recommended next game

1. Grow the explicitly curated catalog with the importer and add richer move/evolution information only when a game needs it.
2. Add a known regional form fixture and cosmetic-form resource support when needed; retain stable species/variety identity.
3. Make an explicit asset-rights and packaging decision before attempting portable distribution of existing Chess assets.
4. Add optional score/save adapters to legacy games only if those games expose a stable contract; keep their mechanics intact.
5. Test the hub/demo on real phones and check legacy WebGL play on target desktop hardware.

Recommended next game: **Type Matchup Quiz**. It can request only form IDs and types, reuse the module and player interfaces, and add a separately sourced/tested type-effectiveness table without needing new artwork or a much larger catalog. This recommendation is proposed work, not implemented functionality.

## Visual refresh — 2026-10-21

The hub now uses a midnight-blue launcher theme with electric-yellow actions, heavier typography, a dimensional CSS Poké Ball scene, and distinct purple mystery / amber arena / blue chess illustrations. Game pages, controls, status badges, recent games and score panels share the new theme. Visual assets remain code-native and offline. Verified in the local browser; all 33 tests, ESLint and the TypeScript/production build pass after the refresh. Preview: `docs/arcade-redesign.png`.

## Who’s That Pokémon? visual clues — 2026-10-22

Version 1.1.0 now starts each round with a black silhouette of the selected Pokémon, using the existing offline portraits under `public/capsule/portraits`. Full color is revealed after either a win or five missed guesses. The initial visual clue costs no hints or points. Image loading has a status message; an image failure supplies a free type/name-prefix/name-length clue. Existing rounds, scoring, progressive hints and saves remain compatible. Local portrait lookup lives in `src/shared/portraits.ts` and references the retained `public/capsule/ASSET-SOURCES.md` attribution. New tests cover initial silhouette, win/loss reveal, restart, failed images and coverage for every default form. Final checks: 65 tests passed; lint and TypeScript/production build passed. The production build retains its existing large 3D chunk advisory. Screenshot: `docs/guess-silhouette.png`.

## National Pokédex expansion — 2026-10-22

The earlier seven-species guessing roster has been replaced by all **1,025 default species forms** from the imported PokéAPI bulk snapshot. The shared character database contains **1,025 species and 1,351 Pokémon-resource forms**, with all base stats, types and measurements. Alternative and regional battle varieties are represented; cosmetic pokemon-form resources are not imported. Nine newly added forms have null abilities because those rows are absent from the upstream ability table. All species have descriptions. Full move metadata, comprehensive learnsets and full evolution conditions remain incomplete; the original eight move-reference lists are preserved and new lists are null.

Each playable species has a verified offline portrait; 1,018 new PNGs were downloaded (~132 MB), while seven existing default portraits were reused. The existing Aegislash Blade portrait remains in the shared manifest for its original users. No new 3D models were acquired. There are **3,347 sourced trivia facts**. Fact counts vary honestly with available source text: 649 species have four, 100 have three, 175 have two and 101 have one. Species with no safe non-spoiler English flavor text receive only their sourced Pokédex classification. The quiz UI caps hints at the real available count. Free types, randomized structured masks and the half-points reveal option continue to work. Nidoran gender symbols and spelled-out genders now resolve to distinct identities.

Import workflow: `scripts/fetch-dex-tables.mjs`, `scripts/import-national-dex.ts`, `scripts/publish-national-dex.ts`, run via `npm run import:all`. Source CSV downloads and PNGs are cached, portrait requests are sequential and throttled, output is staged and validated before publication, and existing seed files are backed up before the first publish. Failed runs can be resumed without repeating completed PNG downloads. The output includes an actual coverage manifest and source-file SHA-256 hashes (`docs/CHARACTER-COVERAGE.json`). See `public/characters/ASSET-SOURCES.md` and the retained source license for attribution.

Capsule and Jungle Caravan explicitly retain their existing eight-character rosters. Their prior implicit “all database rows” selection would otherwise expose over a thousand unsupported models or alter tuned teams. The Capsule asset test now checks its declared model roster rather than assuming every database form has a 3D model. Existing seeded character values remain intact. Tracker and sibling game folders were not modified.

Final expansion verification: `npm run lint` passed; `npm test` passed **88 tests in 14 files**; `npm run build` passed TypeScript and Vite production bundling. Existing model and JavaScript chunk size advisories remain non-blocking. A second `npm run import:all` reused all 1,025 species portraits with **zero downloads and zero issues**, demonstrating the cached resume path. Browser preview showed “1025 POSSIBILITIES” and a working new masked puzzle with free types/trivia controls; screenshot `docs/guess-national-dex.png`. PNG signatures were checked for all 1,026 manifest entries (1,025 defaults plus the retained Aegislash Blade portrait). Tests verify National Dex numbers 1–1025 without gaps, one default form per species, regional-form inclusion, at least one fact per quiz entry, Nidoran identity handling, and preserved game rosters.

## Game-launcher hub upgrade — 2026-10-22

Implemented the full accepted hub upgrade: six actual gameplay preview cards, a featured-game panel, search/category/input filters, validated resume summaries, local trainer records and five achievements, a separate Mountain Time daily mystery with win streaks, focus/fullscreen play controls, and double-click Play/Stop Windows launchers. Game rosters and mechanics were not expanded. Existing saves and retained scores are preserved. See `docs/HUB_UPGRADE.md` for the complete behavior, startup commands, screenshot provenance and test limits. The focused hub/player/mystery suite passes 53 tests, lint/typecheck/production build pass, and the isolated launcher integration check passes start/reuse/owned-stop behavior. The broader suite reports seven Caravan combat/pacing failures outside the hub logic; these remain documented instead of changing its gameplay tests. Screenshots: `docs/hub-upgrade.jpg` and `docs/hub-library.jpg`.
