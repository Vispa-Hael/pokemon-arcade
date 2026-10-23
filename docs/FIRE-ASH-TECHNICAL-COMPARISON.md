# Fire Ash reference inspection and PC foundation recommendation

Date: 2026-10-22. Read-only inspection; no Fire Ash files or Emerald files changed. No game code executed or assets imported.

## Evidence and limits
Local reference: `C:\Users\swami\Downloads\Pokemon Fire Ash 3.7.1\Pokemon Fire Ash 3.7`.

- 996 numbered `MapNNN.rxdata` files. This is a file count, not a claim that every map is reachable or unique.
- `Game.ini` points to `Data\Scripts.rxdata` and RGSS104E.dll.
- Changelog.txt records an upgrade to Essentials v19 in version 3.0. Later entries mention selected v20.1 features; the precise current engine baseline remains unverified.
- MapInfos.rxdata, Tilesets.rxdata, map_connections.dat, map_metadata.dat, encounters.dat and separate graphics/audio directories are present.
- No Game.rxproj or PBS directory was found at the project root. The download is not a complete development template.
- Serialized event/script internals have not been decoded. Transition observations below come from the bundled walkthrough, not verified switch IDs or event command inspection. The walkthrough labels itself accurate through 3.6 Part 2.2 and warns of inaccuracies.

## Two documented region transitions
Walkthrough: Helpful Notes/Pokemon Fire Ash Walkthrough.txt.

### Kanto to Orange Islands (approximately lines 1789–1831)
After the Indigo tournament, Oak directs the player toward the blimp. A Fearow encounter gates access. The journey includes a battle and crash before arrival at Valencia Island. Acquiring the GS Ball then enables several return-travel options: home/lab warps, blimp, ship and Lapras transport.

Pattern: first arrival is a story scene; subsequent travel uses convenient repeatable connections. A single milestone updates several travel options.

### Orange Islands to Johto (approximately lines 2197–2240)
The player returns to Oak, encounters Gary, and speaks to Oak. The western Indigo Plateau gate becomes accessible. Reaching Elm's lab adds another destination to the interregional teleport network. The walkthrough explicitly notes that early Johto wild levels are low despite the player's stronger existing party.

Pattern: region entry unlock and fast-travel discovery are separate milestones. This demonstrates connectivity, not a complete solution to multi-region difficulty balance.

## Proposed structure for our game
Use one PC project, one player record and one versioned save. Organize map groups by region. Keep region unlocks, discovered travel destinations and regional story progress separate. Put repeatable travel destinations in a shared registry rather than duplicating destination lists across NPCs. First visits can invoke story scenes; later visits can use direct transport. Keep time-era variants distinct from region identity.

These are proposed design choices, not claims about Fire Ash internals. Prototype two small areas representing different regions, a travel NPC, one unlock event, and save/reload across both. Decide level progression independently.

## Foundation comparison
| Foundation | Advantage | Main cost |
| --- | --- | --- |
| Clean Pokémon Essentials + RPG Maker XP | Closest family to Fire Ash; existing Pokémon systems; maintainable Ruby script workflow | Need complete starter project and editor setup; older Fire Ash resources require individual compatibility checks |
| Pokémon Studio / PSDK | Pokémon-specific PC ecosystem, documented Studio/Tiled mapping workflow | Different data/API conventions; Fire Ash maps and scripts are not drop-in resources |
| General engine such as Godot | Broad freedom over presentation, saves and tools | Pokémon mechanics need a separately validated framework or substantial implementation |
| Current Emerald Expansion | Already built and tested; extensive existing Pokémon mechanics | GBA storage/RAM/save constraints remain; PC files cannot be imported directly |

Recommendation: evaluate a clean Essentials project first if the goal is Fire Ash-like development with custom narrative. Do not adopt Fire Ash's packaged game as our base or upgrade it in place. This recommendation is not a platform switch authorization.

## Reuse
README.md requests contact before contributions to Fire Ash. That contribution workflow is not blanket reuse permission. Credits.txt identifies multiple sprite/audio/script contributors. Track each candidate resource's original source, terms, credits, version, and modifications before importing. No resources have been copied in this pass.

## Next input / setup
Establish whether RPG Maker XP and a complete Essentials starter project are available. The maintainer's Git repository explicitly is not a full project; cloning it alone does not supply the missing graphics, audio and project data. Then create an independent PC prototype, preserving Emerald and the Fire Ash reference.

## Primary documentation checked
- https://github.com/Maruno17/pokemon-essentials — based on v21.1; setup requires a full v21.1 project; scripts are separate Ruby files under Data/Scripts, and the repository omits assets and most serialized project data.
- https://docs.pokemonworkshop.com/ — Studio/PSDK ecosystem with Tiled, RPG Maker XP and Ruby workflows.

No time estimate or automatic conversion promise is made: source completeness, assets, event dependencies and battle-form coverage must be checked in the prototype.
