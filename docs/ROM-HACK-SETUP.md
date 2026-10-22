# Emerald ROM hack setup

## First milestone
Compile an unchanged source foundation and verify that the output boots in a GBA emulator. Story development is separate.

## Reference ROM
- Location: `F:\ROMs\Pokemon - Emerald Version (USA, Europe).gba`
- Header: BPEE, revision 0; 16,777,216 bytes.
- SHA-1: `f3ae088181bf583e55daf962a92bb46f4f1d07b7b7`.
- Preserve the original. Do not add it to version control.

## Recommended candidate
Evaluate RH Hideout's pokeemerald-expansion as the editable foundation. It builds on Emerald's decompilation and is intended as a ROM hack base. Confirm the chosen release's roster, Necrozma forms, build requirements, and resource limits before committing to content work.

Sources:
- https://github.com/rh-hideout/pokeemerald-expansion
- https://github.com/rh-hideout/pokeemerald-expansion/blob/master/INSTALL.md
- https://github.com/pret/pokeemerald

## Machine inspection
Git is available. WSL reports that it is not installed. make and arm-none-eabi-gcc were not found on the current PowerShell PATH.

## Steps
1. Set up the upstream-documented Windows build environment, preferably WSL2. This can require administrator interaction and a restart.
2. Obtain a stable release of the foundation in a separate repository, independent of the existing Arcade web app. Record its tag and commit.
3. Follow that release's installation instructions and compile without gameplay changes.
4. Verify boot, new game, a battle, and saving/loading in an emulator.
5. Add one test map and scripted NPC; rebuild and verify.
6. Establish patch generation against the verified reference ROM.

Do not assume every region will fit: measure ROM, RAM, map and save constraints during technical prototyping. The reference ROM is a verification/patch input; source project documentation determines any additional build requirement.
