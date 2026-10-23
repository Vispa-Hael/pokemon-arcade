# PSDK evaluation — 2026-10-22

Documentation evaluation only; no PSDK installation or runtime testing performed.

## Finding
PSDK is free, but the documented current visual authoring workflow still combines Pokémon Studio for data, Tiled for maps, and RPG Maker XP for events. Therefore it does not currently remove the paid editor from the standard workflow.

The GitHub latest-release API returned Pokémon Studio v2.11.0, published 2026-09-21. Documentation describes v3.0's removal of RPG Maker as future work; do not base today's decision on that roadmap.

## Suitability
- Pokémon-specific framework, rather than building all systems from a general engine.
- Documented Ruby scripting supports scripted battles, explicit Pokémon forms and branching on encounter outcomes.
- Tiled mapping and Studio databases suit a large PC world, but no regions are automatically supplied by adopting the framework.
- Ruby and text-based collaboration tools are useful for agent-assisted implementation. Serialized event data still requires careful handling.
- Fire Ash is Essentials-based: its scripts and project data are not assumed drop-in compatible. Asset permission checks remain separate.
- Exact Necrozma forms, abilities, later-generation battle rules, save migrations and large-world performance remain prototype gates, not verified capabilities.

## Recommendation
For a paid-editor route closest to Fire Ash, keep clean Essentials as the first candidate. PSDK is credible but does not solve the immediate free-workflow question through its documented stable visual tools. An editor-free Ruby/event pipeline may be technically possible, but would be custom engineering and has not been validated here. For zero spending today, keep the working Emerald project or separately evaluate a genuinely editor-free PC framework before changing foundations.

## Sources
- https://docs.pokemonworkshop.com/getting-started/
- https://pokemonworkshop.com/en/sdk/
- https://docs.pokemonworkshop.com/rpg-maker-xp/start-a-wild-battle/
- https://docs.pokemonworkshop.com/pokemon-studio/collaboration/work-together-on-a-psdk-project/
- https://github.com/PokemonWorkshop/PokemonStudio/releases/tag/v2.11.0
