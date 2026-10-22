# Pokémon Arcade

A local, independent arcade. Tracker is outside this project and has no runtime, data, or build dependency here.

## Start locally

**Easiest on Windows:** double-click `Play Pokemon Arcade.cmd` in this folder. It opens the arcade and starts or reuses its local server. Use `Stop Pokemon Arcade.cmd` to stop a server created by that launcher. No terminal commands are needed. Node.js and dependencies must be installed (they are already present on this machine). A manually started dev server is stopped with Ctrl+C in its own terminal.


Node.js 22.18+ (tested on 24.19). From PowerShell:

```powershell
cd 'F:\Pokemon Arcade'
npm ci
npm run dev
```

Open http://127.0.0.1:4173/. On this machine dependencies are already installed. For the production build:

```powershell
npm run build
npm run preview
```

Stop the dev server before preview: both use port 4173. Keep the same host and port to retain browser saves. `dist/` alone supports the hub and demo on a static host, but the original games require the local Vite adapter in dev/preview mode. No external deployment is configured.

## Game folders

The read-only adapter expects sibling folders:

- `F:\Pokemon Chess`: index.html, game.js, styles, play modes, worker and rendering bundles, assets.
- `F:\Pokemon Arena`: index.html, game.js, style.css, assets/arena3d.bundle.js.

Paths resolve relative to this project. No source files are copied or changed. Missing game files show an unavailable state. Arena needs a desktop keyboard and WebGL 2; Chess prefers WebGL and offers its existing artwork fallback. The arcade keeps navigation outside each iframe. Launching a game preserves its original mechanics. Returning to the library unloads it. Legacy games manage their own settings and do not export arcade scores/saves.

## Extend the arcade

Add `src/games/<id>/index.ts`, exporting a default `GameModule` from `src/shared/game.ts`. The Vite glob discovers it automatically; use route `/games/<id>`. Provide metadata and a `mount(host, context)` entry point, returning cleanup for listeners, timers or renderers. Avoid game-to-game imports. The host injects `CharacterDatabase` and `PlayerServices`. Settings, saves and score recording are optional services; `saveVersion` documents the game's state version. Every game validates its own restored state.

Request only the fields needed:

```ts
context.characters.getForm(25, ['types', 'stats']);
context.characters.getSpecies(25, ['displayName']);
context.characters.queryForms(['id'], { defaultOnly: true });
```

Species IDs, Pokémon variety/form IDs and individual instance UUIDs are distinct. A species variety list may reference forms outside the bundled snapshot; missing lookups return undefined. Null attributes mean unavailable, never a made-up zero. The model uses PokéAPI Pokémon-resource IDs for battle forms; cosmetic pokemon-form resources are not yet ingested.

## Character data

Current coverage: **1,025 species / 1,351 forms**, with **1,025 playable guessing entries** and **3,347 sourced trivia facts**. Every species has a local portrait, default form, stats, types and at least one hint. Source: [PokéAPI bulk tables](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv). See the National Dex coverage section below for exact availability, import/resume commands and remaining data gaps.

Species, Pokémon-resource forms and individual Pokémon IDs remain separate. The database exposes typed projected lookups and queries. Missing attributes remain null. Existing seeded data and original eight move-reference lists are preserved; this expansion does not supply new 3D models for the full roster. See [asset sources](public/characters/ASSET-SOURCES.md), [source license](docs/POKEAPI-LICENSE.md), and [coverage manifest](docs/CHARACTER-COVERAGE.json).

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

See [implementation report](docs/IMPLEMENTATION_REPORT.md) for architecture, coverage, integration results, limitations and next steps.

## Jungle Caravan

Open `http://127.0.0.1:4173/#/games/jungle-caravan` after starting the arcade with `npm run dev`. It is also a playable card in the library and works in the static production build. No sibling game or external character API is needed. See [Jungle Caravan design and verification](docs/JUNGLE_CARAVAN.md) for roles, balance, controls, and scope.

## Pocket Capsule Monsters

Open `http://127.0.0.1:4173/#/games/pocket-capsule-monsters`. Four-Pokémon squads battle on an 8×8 tactical board against the computer or a second local player. Version 1.2 adds directional attack patterns, Ghost/Flying diagonal movement, an arena flyover, elite summon reveals, and a fusion-inspired Capsule Resonance link. Includes textured 3D Pokémon figures, joint animation, movement/attack/hit/knockout reactions, and animated squad/inspection previews. Models and fallback portraits are bundled locally; the game works in the static build. WebGL is required for moving models; still Pokémon artwork is used if unavailable. Existing saved matches remain compatible. See [game notes](docs/POCKET_CAPSULE_MONSTERS.md) and [asset provenance](public/capsule/ASSET-SOURCES.md).

Reference research: see [inspection and adaptation report](docs/CAPSULE_REFERENCE_RESEARCH.md). Read-only inspection scripts keep extracted research in `work/capsule-reference`, outside runtime assets.

## National Dex coverage

The offline catalog now includes all 1,025 species in the imported PokéAPI source (Bulbasaur through Pecharunt), and 1,351 Pokémon-resource forms, including default, regional and battle varieties. Who’s That Pokémon? uses the 1,025 default forms: every entry has a verified local PNG and at least one sourced English trivia fact. The original eight Capsule figures and Jungle Caravan roster remain curated and unchanged.

`src/data/catalog.json` contains identity, species/form relationships, generations, classification, descriptions, available habitat/evolution references, types, measurements, abilities and all six base stats. Nine recently added forms have unavailable abilities (null). Detailed move metadata, comprehensive learnsets, cosmetic form resources and full evolution conditions remain future work. The original eight move-reference lists are preserved; other forms have null move lists.

There are 3,347 trivia facts: 649 species have four, 100 have three, 175 have two and 101 have one. Hints stop at the real available count; missing facts are never invented. Original source game-version names are retained per fact. Pokédex lore can differ between game versions.

```powershell
npm run import:all
```

This explicitly downloads the bulk CSV tables if uncached, stages/validates the catalog, downloads missing portraits sequentially with throttling, then publishes locally. It caches data and completed PNGs for resume; existing completed files are reused. The original seed files are backed up once under `.cache/national-dex/before-national-dex`. No saves, sibling game files, user databases or existing model binaries are overwritten. This command does not refresh an already cached upstream snapshot; source refresh/reconciliation remains a separate maintenance step. See `docs/CHARACTER-COVERAGE.json` for actual counts and SHA-256 fingerprints of the imported tables, and `public/characters/ASSET-SOURCES.md` for asset attribution.

The new portraits occupy about 132 MB. Catalog/trivia are bundled locally, with no runtime external character-data or image requests. Full National Dex expansion concerns the database and guessing game; it does not provide 3D models for every Pokémon.

## Pokémon Skate

Open `http://127.0.0.1:4173/#/games/pokemon-skate` or choose Pokémon Skate in the library. Pokémon Skate is a separate project in `F:\Pokemon Skate`, with its own source, assets, tests, npm dependencies and build. The arcade contains only its metadata/iframe launcher, like Chess and Arena. Build it with `npm run build` in that folder; the arcade reads its `dist` folder. Run it independently with `npm run dev` at `http://127.0.0.1:4176/`. Fully 3D Free Skate and timed Skate Run require WebGL 2. See [Skate guide and build gates](docs/POKEMON_SKATE.md) for controls, architecture, verification and current presentation limitations.


## Hub features

The hub now includes six actual gameplay preview cards, a featured game, search/category/input filters, validated Continue cards, a trainer dashboard and achievements, focus/fullscreen controls, and a Daily Pokémon Mystery with separate saves and daily win streaks. Daily challenges reset on the Mountain Time date, independently of free play. All records stay local. See [hub upgrade notes](docs/HUB_UPGRADE.md) for behavior, commands and verification limits.

## Share through GitHub Pages

The build now includes browser-only Chess/Arena snapshots and supports repository subpaths. See [GitHub hosting setup](docs/GITHUB-HOSTING.md). Source attributions remain with the bundled games.

