# Pokémon Chess

Open index.html in a modern browser. Team Pikachu plays white; Team Eevee plays black. Hover a Pokémon to see its chess role, or use the team reference beside the board. Small K/Q/R/B/N/P badges identify each piece.

Includes the original chess rules, promotion selection, move history, undo, and board flipping. All twelve Pokémon sprites are stored locally in assets/ and sourced from https://github.com/PokeAPI/sprites. This is an unofficial fan-made game.

Run node test.cjs to check the chess engine.

## Windows app window

Double-click Pokemon Chess.lnk or Play Pokemon Chess.vbs. The launcher opens the game in its own Edge/Chrome app window with no browser tabs or address bar. It uses a dedicated browser profile under your local app data folder. Keep the launcher, index.html, game.js, style.css, and assets folder together. You can copy the shortcut to your desktop; keep the game folder at its current location when using that shortcut.

This is a lightweight local app powered by your installed browser, rather than a standalone executable installer. No server or internet connection is needed to play. Optional Google Fonts fall back to system fonts offline.

Pieces now use locally stored Pokemon HOME 3D-rendered artwork from PokeAPI (assets/3d). These are transparent images, not interactive 3D models. The board, roster, and promotion picker all use the new artwork.

The tabletop view uses a perspective camera, a tilted board with a raised edge, and upright Pokemon artwork perpendicular to the squares. Pieces cast contact shadows and rise slightly when selected. The artwork remains image-based rather than fully modeled 3D geometry.

Refined tabletop: stone inlays, layered brass frame, ivory/obsidian collectible bases, studio/warm lighting and camera controls. Camera preferences persist locally. The Pokemon are still upright image-based figures, not rotatable model meshes.

## Fully modeled 3D figures

The tabletop now renders through Three.js/WebGL with actual Pokémon geometry, textured surfaces, lighting and cast shadows. Rotate the table using the camera slider, or flip the board to view the opposing side. All twelve models and the rendering code are embedded in tabletop3d.bundle.js for offline file-based playback. The first load can take longer than the original sprite view. An initial model-load failure falls back to the image-based board. A modern browser with WebGL support is required for the 3D scene.

Model sources: https://github.com/06wj/pokemon (ten models) and https://github.com/pokemon-party/3d-pokemon (Charizard and Eevee, models/opt/regular). These are unofficial fan-game assets; Pokémon characters belong to their respective owners. Models were processed locally to remove animation data and decode geometry compression. Figures now use procedural skeletal animation for wings, limbs, ears, tails, and head movement.

Developer checks: npm test; node test-models.mjs. Rebuild the offline rendering bundle with npm run build after changing tabletop3d.js. Do not remove tabletop3d.bundle.js from the game folder.

Animation: figures have subtle procedural idle swaying and breathing, moves follow a short hop, and captured pieces shrink away. Castling animates both pieces, while undo and new games reset immediately. System reduced-motion preferences disable these effects. Joint animation is provided by figure-animation.mjs, using each model’s skeleton and original joint orientations.

Captures play a roughly 1.1-second battle: the attacker approaches and gestures toward the defender, followed by a colored impact burst and defender recoil/shrink. Board clicks pause during the battle; undo and new game cancel it immediately. Reduced-motion preferences bypass the battle effects. Run npm test to check chess rules, all twelve rigs, wing pairs, quaternion stability, reduced-motion reset, and battle timing.

## Single player and puzzles

Use Choose your challenge above Battle status:
- Play computer: choose White/Pikachu or Black/Eevee and Easy, Medium, or Hard. This is a built-in alpha-beta chess computer, not Stockfish; strengths are relative rather than rated. Search runs in a background worker so the 3D board keeps animating. The computer promotes pawns to queens. Undo returns to your previous decision where possible.
- Chess puzzles: 5,506 validated mate-in-one positions. Any legal checkmating move solves a puzzle. Wrong moves leave the position in place. Use Hint, Retry, or Next puzzle; one puzzle asks you to play black.
- Two players: original shared-screen mode.

All modes work offline. Switching modes or sides starts a fresh position. Undo, restart and mode changes cancel pending computer work. Build the offline worker using node build-ai.cjs after changing the rules or ai-search.js. The ai-worker-source.js file must stay beside index.html. npm test now includes AI legality, all puzzle solutions, and play-mode transitions.

Puzzle expansion: 5,500 locally composed positions plus the original six starters. Each new position has exactly one legal checkmating move, verified against the chess rules. Half of the new positions ask you to play black. Filter by the finishing piece, select any puzzle directly, browse forward/back, or shuffle (favoring unsolved challenges). Solved puzzles and the last puzzle index are saved locally in this browser profile. Keep puzzle-bank.js beside index.html for offline access. The deterministic generator is generate-puzzles.cjs; generation is not required to play.

The library now contains 5,506 puzzles (5,000 added in the latest expansion). The original 500 generated IDs and positions are preserved so existing solved history still applies. Filter by estimated Easy/Medium/Hard difficulty, not-yet-solved/already-solved, theme, or side to play. Sort by puzzle number, easiest/hardest first, or unsolved first; search by title or number. Results are paginated in groups of 100, and Previous/Next and Shuffle respect all active filters. Clear filters restores the full collection. Empty search results leave the current board in place.

Difficulty is an unrated estimate within mate-in-one challenges, computed from legal move count, alternative checks, piece count, finishing piece, and whether the solution captures. It is not an Elo rating or a mate-depth category. All puzzles remain mate in one. New generated positions are checked for a unique mating move; mirror equivalents are excluded.
