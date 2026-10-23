# Arena source and snapshot

`source/` contains the complete editable Arena 0.6.0 project, all 32 local models, desktop packaging, tests, and locked dependencies. In that folder run `npm ci`, then `npm test` and `npm run build` to create the Windows desktop app. `npm run build:renderer` prepares direct browser play. Generated dependencies and desktop executables are excluded from Git.

The browser snapshot uses ordered script parts to stay below GitHub’s 100 MiB per-file limit while preserving offline file access. From the Arcade root run `node scripts/snapshot-arena.mjs` to refresh it from the sibling Arena folder.
