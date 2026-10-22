# Capsule reference research and adaptation

## Inspection

The source at `C:\Users\swami\Downloads\PS2\Yu-Gi-Oh! Capsule Monster Coliseum (USA) - Copy` was accessible. Read-only inspection covered all 53 files (4,158,229,321 bytes). The inventory includes a 2,079,490,048-byte ISO, extracted binary archives, the executable, support modules, and 17 movie files. The ISO itself was hashed, not mounted or unpacked again. Source contents were never written.

Run `node scripts/inspect-capsule-reference.mjs` to regenerate the inventory, SHA-256 checksums, offset-indexed printable strings, and ELF section report in `work/capsule-reference/`. Then run `node scripts/summarize-capsule-reference.mjs` for resource references, executable load segments, archive header words, and contextual mechanic mentions. An optional source folder can be passed to the first script. These scripts use read-only source handles; all output stays in the project. Size and modification time are checked against the inventory. The hashes establish a baseline; they are not proof of a pre-existing disc's authenticity.

The initial string scan produced 4,340,427 printable runs and approximately 106 MB of research output. Much of that is coincidental binary noise, not meaningful decoded text. The focused evidence files are the useful starting point. Nothing from these reference files is imported by the playable module or copied into `public/`.

## Verified structure

- `system.cnf` selects `SLUS_209.40`, version 1.00, NTSC.
- The executable is ELF32, little endian, machine 8 (MIPS), with entry address 0x2790b8. Its symbol and string table sections have zero length: no editable source or useful function symbol table was recovered.
- The executable contains `Intrinsic Alchemy v3.0` runtime identification, engine reflection names, archive filenames and movie references. These establish resource loading and engine infrastructure, not the architecture or formulas of the tactical rules.
- `d_mess.bin` has readable English UI, monster/attack names, ability descriptions, Symbol/Attribute terminology, and fusion/evolution mentions. Offset-bearing excerpts are in `mechanic-text-evidence.json`. Text is only partially decoded; special spacing and control bytes are present.

## Archive priorities and confidence

| Files | Potential research use | Confidence |
| --- | --- | --- |
| d_mess.bin | UI vocabulary, ability concepts, tutorial/dialogue references | Readable content confirmed; record schema unverified |
| d_bttfield.bin | Board and battlefield records | Filename inference; not decoded |
| d_bttuni.bin, d_bttdat.bin | Battle unit resources and battle data | Filename inference; stats and animation ownership unknown |
| d_map.bin, d_mapuni.bin | Arena scenery and associated resources | Filename inference |
| d_cam.bin, d_sce.bin | Camera and scene sequencing | Filename inference; timeline format unknown |
| d_anm.bin, d_model.bin, d_eff.bin | Animation, models, effects | Filename inference; no usable mesh or clip export recovered |
| d_sys.bin, d_face.bin, d_char.bin, d_moji.bin | UI, portraits, character resources, font glyphs | Filename inference |
| d_audio.bin, d_se.bin, VOICE.BIN, movie/*.pss | Music/sound/voice/cinematic study | Containers inventoried; no media decoded |

There is no validated archive index parser, decompressor, decompiler output, monster stat table, board export, fusion recipe table, or recovered camera track yet. Header words are retained to support that later work. “Extracted” here means inventory, binary headers, executable structure and text, not recovery of all game assets or source code.

## Playable adaptation

The independent TypeScript module remains the implementation base: `rules.ts` contains deterministic rules and AI, `index.ts` controls interaction and saves, `models.ts` renders existing local GLB figures, and `cinematics.ts` sequences presentation. No PS2 executable is run.

Version 1.2 adds new-match directional attacks: cross for most partners, diagonal for Ghost, and a Manhattan area for Normal. Ghost/Flying partners also have diagonal movement, with no passage through blocked corners. Other partners use orthogonal movement. Range and movement allowance still come from the arcade's base-stat conversions. Dashed tiles show attack geometry; coral tiles are actual targets. Ranged attacks still ignore intervening scenery and units. These are prototype choices, not recovered original rules.

New battles begin with a skippable animated board flyover, then elite partner reveals (cost four, used as a power-tier proxy), and a command handoff. This is an animated board presentation rather than a fully modeled environment camera. Elite reveals use existing figures, scale/materialization and particles; they are not frame-for-frame original summons. Reduced motion skips the automatic introduction and removes animated transitions. Escape and the skip button release controls; leaving the module cancels presentation timers. Normal actions have time to finish before the next player command; AI actions are spaced to allow movement playback.

Capsule Resonance is an invented, fusion-inspired trainer technology: adjacent, living allies can link for three AP, spending both attacks. Each gains eight attack while both survive. Each team gets one link per battle; the computer can use it too. The partners keep separate bodies and health. This is not yet a combined fusion species or new fused model, and it is not claimed as official Pokémon lore. Saves validate links and preserve older games' original area targeting.

## Design direction

Keep positional combat, readable movement/attack geometry, protected capsule objectives, a deployment budget, terrain, and dramatic introductions. Add optional fast/skip presentation, compact pattern diagrams, distinct arena themes, an arcade ladder, and evolution earned during a run. Give elite summons a short first reveal and faster repeat treatment.

Defer unrestricted species fusion and a giant starting roster. A small set of authored pairings with narrative prerequisites and a clear cost would be more believable and easier to balance. Resonance tests the appeal before custom fused models are made. Avoid mandatory long animations on ordinary attacks, obscure movement exceptions, or a large simultaneous resource economy.

Exact recreation needs evidence of original turn/AP allocation, deployment/summoning, terrain/attribute effects, attack direction/blocking, counterattacks, Symbol rules and fusion/evolution conditions. Gameplay recordings or the user's recollections would let us resolve those gaps. Current six-AP turns and damage formulas are adaptation choices.

## Verification result

All 83 tests across 13 test files passed, including directional combat, diagonal corner blocking, Resonance lifecycle, legacy save compatibility, AI match completion, cinematic skip/cancel and blocked input during introductions. Lint, TypeScript checking and the production build passed. Browser checks verified Resonance activation, return to play, squad deployment, arena introduction and elite summons. The build retains the existing large Three.js chunk warning. No original archive meshes, camera tracks, audio or numeric rules have been decoded.

## Modular review controls

Battle options on the squad screen independently enable directional attacks, diagonal movement, terrain, Resonance, arena introductions and elite summons. The config.ts feature registry defines the options and defaults; rules.ts enforces mechanics and validates saved options; cinematics.ts owns cancellable presentation; models.ts owns figures; index.ts connects the modules. Disabled terrain removes both collisions and forest mitigation. Disabled Resonance removes its action and bonus. Elite reveals can run without the arena flyover, or the flyover without elite reveals. Each new match receives a copied configuration, so later setting changes cannot alter an existing save. Older saves retain legacy behavior. New rules should extend this explicit feature registry and pure rule functions rather than add dependencies between arcade games.

