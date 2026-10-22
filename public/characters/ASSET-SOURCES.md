# Offline National Pokédex assets

Data tables: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv

Local portraits were downloaded from the PokeAPI sprites repository, using `sprites/pokemon/other/official-artwork/<pokemon-resource-id>.png`, with HOME portraits and standard front sprites as fallback sources when necessary. Existing portraits for the original eight Capsule figures remain in `public/capsule/portraits`, with their original source notes. A shared manifest (`src/data/portraits.json`) records only PNGs actually present locally.

Pokémon characters and artwork belong to The Pokémon Company and their respective owners. The source repository notice is retained as `SPRITES-LICENSE.txt`; it explicitly reserves ownership of image contents. This is an unofficial local fan project and does not claim ownership or permission for commercial distribution of character artwork. No disc assets were extracted and no new 3D models were downloaded for this expansion.

Importer: `npm run import:all`. Source CSVs and PNGs are cached, downloads are sequential and throttled, and the completed catalog is staged and validated before local publication. Completed portrait files are reused on resume. The importer does not delete cached or user files. No external deployment is performed.
