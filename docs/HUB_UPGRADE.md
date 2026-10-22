# Arcade hub upgrade — 2026-10-22

## Implemented

- A featured-game panel backed by an actual local gameplay screenshot, with a direct launch action.
- Six screenshot-based game cards, explicit playable/prototype/availability badges, supported-input labels, category buttons, search, input filters, live result counts and an empty-results reset.
- Continue playing adapters owned by each game: unfinished mystery rounds, valid active Capsule matches, and Caravan crew manifests. Caravan explicitly restores its setup, not an active expedition. Recent games remain separate.
- A local trainer dashboard with per-game best scores, launch counts, games explored, recorded session minutes, solved mysteries, and five achievements (first launch, three games explored, first mystery, ten mysteries, first daily win). Daily mode counts as the guessing game for exploration.
- A separate Daily Pokémon Mystery: a deterministic date-seeded answer and mask, one saved attempt per Mountain Time date, separate free-play saves/scores, consecutive-win streaks and a personal best. Dates are shared across clients by using America/Denver, including daylight-saving transitions. The v1 daily roster is pinned to species/default resource IDs through 1025. Home/daily views refresh when the date changes (checked every 30 seconds).
- A play toolbar that stays inside Focus view and browser fullscreen, with a persistent return link. Focus mode supports Escape, hides off-surface controls from keyboard interaction, and cleans up on navigation. Unsupported fullscreen falls back to a useful message. Legacy launch notices collapse after launch.
- A double-click Windows launcher (`Play Pokemon Arcade.cmd`) and matching stop launcher (`Stop Pokemon Arcade.cmd`). They use the project's installed Node/Vite runtime without requiring copied terminal commands. Launching again reuses the existing local server. The launcher opens the default browser, starts a detached loopback-only process when needed, and logs startup errors in `.cache/launcher.log`. Shutdown requires the ownership token written by that launcher; it does not kill a manually started dev server.
- Responsive layouts, clearer search/status labels, keyboard focus styling, reduced-motion support and restrained preview hover effects.

## Shared interfaces and files

`GameModule` now supports category, thumbnail, score-storage keys and an optional validated resume summary. Game state remains in the game; the hub only renders that summary. `GameContext.challenge` supplies the optional daily date to the guessing module. No game-to-game imports or new service dependencies were introduced.

Core files:

- `src/main.ts`: hub, filters, daily/trainer routes and play host.
- `src/shared/hub.ts`: library filtering, trainer summaries and achievement rules.
- `src/shared/daily.ts`: Mountain Time calendar, daily seed and streak rules.
- `src/shared/player.ts`: existing versioned storage plus incremental score summaries and local session tracking.
- `src/shared/play-controls.ts`: focus/fullscreen behavior and cleanup.
- `src/games/guess/daily.ts`: deterministic daily round identity/selection.
- `public/previews/*.jpg`: actual screenshot assets from all six locally running games.
- `scripts/launch-arcade.mjs`, `scripts/local-server.mjs`, `scripts/test-launcher.mjs`: launcher, owned server and integration verification.

## Persistence and limits

Existing namespaces and saves remain compatible. Existing retained scores seed the new best/total summaries. Launch/time history starts with the upgrade; no historical play time is invented. Results stay on the current browser and origin. Regular score history retains the last 100 results; daily history retains up to 3660 results. Incremental score summaries continue after regular history rolls over. Streak calculations use retained daily history. The daily clock is the local machine's clock: this is an offline challenge, not a cheat-resistant online leaderboard.

Chess, Arena, Capsule and Caravan do not currently report scores through the shared score service; the dashboard does not invent best scores for them. Mystery/free daily and Skate bests are supported. The existing games retain their rosters and mechanics. No authentication, online rankings, deployment, background automation or roster expansion was added.

## Verification

- Lint and TypeScript: passed.
- Focused hub/player/mystery regression suite: 53 tests passed across 7 files.
- Production build: passed; the existing large JavaScript chunk advisory remains non-blocking.
- `npm run test:launcher`: passed real start, server reuse, invalid-stop-token rejection, and owned-server shutdown on an isolated test port. The working manually launched server was left running.
- Browser: verified the regular 4173 address, all six preview scenes, actual Strategy filtering (two games), existing Continue cards, focus view, daily trivia and a completed daily result on an isolated test origin. Daily completion awarded the score once and generated its streak/achievement. Physical phone and gamepad hardware were not exercised.
- Last full-suite run: 124 passed, 7 failed (131 total); one additional historical-achievement regression test was subsequently added and passed in the focused suite. The seven failures are confined to Caravan's combat/cover/pacing checks in `tests/jungle-caravan-combat.test.ts`, `tests/jungle-caravan.test.ts`, and `tests/jungle-caravan-ui.test.ts`. This hub change does not modify Caravan's combat simulation or retune its tests. The failure output includes mismatched robber timing/health, cover interception and cruise-speed expectations.

## Start

Double-click `Play Pokemon Arcade.cmd` from the arcade folder. Node.js and installed project dependencies are required (already present on this machine). If dependencies need reinstalling, run `npm ci` once in the project directory.

Double-click `Stop Pokemon Arcade.cmd` to stop a server created by the launcher. For a server started manually with `npm run dev`, use Ctrl+C in its existing terminal. Keep host and port at http://127.0.0.1:4173/ to use the same browser saves.

Alternative commands: `npm run start:arcade`, `npm run stop:arcade`, `npm run test:launcher`.
