# Pokémon Skate integration

The game is a fully independent sibling project at `F:\Pokemon Skate`. Its source, tests, character snapshot, model assets, npm dependencies and build are owned there. See [standalone README](</F:/Pokemon Skate/README.md>) and [3D implementation guide](</F:/Pokemon Skate/docs/POKEMON_SKATE.md>).

The only Skate code in this arcade is `src/games/pokemon-skate/index.ts`, a metadata/iframe launcher using the same adapter as Chess and Arena. It imports no Skate simulation or rendering code. In development/preview, the read-only Vite adapter exposes only `F:\Pokemon Skate\dist` browser assets at `/legacy/pokemon-skate/`. It never serves the sibling source tree.

Build the game after editing it:

```powershell
cd 'F:\Pokemon Skate'
npm run build
```

Then launch Pokémon Skate from the arcade library. The game also runs independently with `npm run dev` in its own folder at `http://127.0.0.1:4176/`.

`npm run build` in the arcade packages the existing sibling browser build into `dist/legacy/pokemon-skate`, falling back to the tracked browser snapshot when the sibling project is absent (such as on CI). Source remains in the sibling folder. After changing Skate, refresh the production snapshot with `npm run snapshot:legacy` in the arcade before publishing. Scores/settings belong to the standalone game; arcade activity tracks the launch session.

The archived side-profile specification and the revised 3D guide are in the standalone project's docs folder. Fully navigable 3D supersedes the old side-scrolling requirements.
