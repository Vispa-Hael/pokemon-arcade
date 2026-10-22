# GitHub hosting

The arcade now builds to a self-contained static dist/ folder, including snapshots of Chess and Arena. No desktop server or sibling folders are needed by visitors. The Tracker is excluded. Saves remain in each visitor's browser; desktop saves do not transfer to the website.

## First publish

1. Create an empty public repository named pokemon-arcade under your GitHub account. Do not initialize it with a README or license.
2. Supply its URL so this prepared local repository can be pushed. GitHub connection currently identifies Vispa-Hael. Repository creation is unavailable through the connected tools; local Git push authentication may need Git Credential Manager sign-in. Never send passwords or tokens in chat.
3. In repository Settings > Pages, select GitHub Actions as the source.
4. Push main (or run the Deploy arcade to GitHub Pages workflow). It installs dependencies, builds, verifies the release and deploys dist/.
5. Share the URL returned by the Pages deployment.

## Build and verify locally

Run npm ci, then npm run build and npm run test:release. Set ARCADE_BASE_PATH=/pokemon-arcade/ before building to test a repository subpath. The workflow obtains the base path from GitHub Pages automatically, supporting root/custom domains too. Hash routes need no server rewrite.

## Updating bundled games

The tracked vendor/legacy/ directory is a browser-only snapshot of the sibling Chess and Arena games. Run npm run snapshot:legacy on this desktop to refresh it intentionally, then build and verify. Original sibling files are never edited. Keep retained source READMEs and asset notices. Desktop development still reads sibling files live; production uses the snapshot. Model data embedded in the original bundles is retained. Individual tracked files must stay below GitHub's 100 MiB limit; the release check enforces that limit and the 1 GiB Pages site limit.

## Desktop launch

Double-click Pokemon Arcade on the desktop, or Play Pokemon Arcade.cmd in F:\Pokemon Arcade. The shortcut starts/reuses the local server and opens the browser. Stop Pokemon Arcade.cmd stops launcher-owned servers.

## Current verification limits

The existing Caravan combat/cover/pacing test failures are unrelated to hosting. Deployment checks build/type correctness and release completeness; it does not represent the full suite as passing. No accounts, shared leaderboard, multiplayer service, or cloud saves are added.
