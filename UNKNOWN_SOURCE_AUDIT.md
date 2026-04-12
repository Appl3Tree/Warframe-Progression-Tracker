# Unknown Source Audit

Generated: 2026-04-11T02:19:23.143Z

## Summary

- Catalog records: 21823
- Catalog records with acquisition: 9985
- Catalog records without acquisition: 11838
- Displayable records: 19660
- Displayable records without acquisition: 11001
- Placeholder blueprint records (`data:blueprint/unclassified`): 246
- Displayable recipe/component records with zero acquisition: 12
- Manual coarse activity/vendor mappings still in place: 23

## Placeholder Blueprint Buckets

| Bucket | Count |
| --- | --- |
| /Lotus/Types/Recipes/Helmets | 129 |
| /Lotus/Types/Recipes/Weapons | 32 |
| /Lotus/Types/Recipes/WarframeRecipes | 21 |
| /Lotus/Types/Recipes/WeaponSkins | 12 |
| /Lotus/Types/Recipes/Lens | 10 |
| /Lotus/Types/Items/ShipFeatureItems | 8 |
| /Lotus/Types/Recipes/SolarisRecipes | 7 |
| /Lotus/Types/Recipes/RailjackResourceRecipes | 6 |
| /Lotus/Types/Recipes/OperatorArmour | 5 |
| /Lotus/Types/Recipes/LandingCraftRecipes | 3 |
| /Lotus/Types/Recipes/Components | 2 |
| /Lotus/Types/Recipes/Drones | 2 |
| /Lotus/Types/StoreItems/Consumables | 2 |
| /Lotus/Types/Items/RelayRebuild | 1 |
| /Lotus/Types/Items/Titles | 1 |
| /Lotus/Types/Keys/LimboQuestKeyBlueprint | 1 |
| /Lotus/Types/Keys/MirageQuestKeyBlueprint | 1 |
| /Lotus/Types/Keys/MummyQuestKeyBlueprint | 1 |
| /Lotus/Types/Keys/PatientZeroKeyBlueprint | 1 |
| /Lotus/Types/Recipes/EidolonRecipes | 1 |

## Placeholder Blueprint Likely Fix Paths

| Likely Fix Path | Count |
| --- | --- |
| manual-or-new-source | 246 |

Interpretation:
- `warframe-items-drop-type-join`: the blueprint name already appears in `warframe-items` drop `type` fields, so the derivation layer should be able to assign a real source from those locations.
- `drop-data-blueprint-tables`: the blueprint already exists in `blueprintLocations.json` or `enemyBlueprintTables.json`, so the join is probably failing or incomplete.
- `syndicates-name-join`: the blueprint name exists in `syndicates.json` but is not currently mapped to the catalog record.
- `manual-or-new-source`: current raw datasets do not expose an obvious matching source string for the catalog record, so this likely needs a manual mapping or a new importer/source family.

## Placeholder Blueprint Examples

- `items:/Lotus/Types/Items/RelayRebuild/PhaseOneClanItemBlueprint` (/Lotus/Types/Items/RelayRebuild/PhaseOneClanItemBlueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/InfestedFoundryArchonShardBlueprint` (Helminth Archon Shard Segment Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/InfestedFoundryArchonShardUpgradeFeatureBlueprint` (Helminth Coalescent Segment Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/PersonalQuartersFeatureBlueprint` (Personal Quarters Segment Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/Railjack/RailjackHoodBraceFeatureItemBlueprint` (Propulsion Systems Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/Railjack/RailjackHoodFeatureItemBlueprint` (Engine Cowling Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/Railjack/RailjackNacelleLeftFeatureItemBlueprint` (Port Nacelle Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/Railjack/RailjackNacelleRightFeatureItemBlueprint` (Starboard Nacelle Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/ShipFeatureItems/Railjack/RailjackTailFeatureItemBlueprint` (Tail Section Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Items/Titles/RoatheTitles/TitleHarrowChasisBlueprint` (The Power of Harrow Compels Thee Honoria) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Keys/LimboQuestKeyBlueprint` (The Limbo Theorem Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Keys/MirageQuestKeyBlueprint` (Hidden Messages Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Keys/MummyQuestKeyBlueprint` (Sands of Inaros Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Keys/PatientZeroKeyBlueprint` (Patient Zero Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Components/FormaOmegaBlueprint` (Test Forma Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Components/UmbraEchoesBlueprint` (Echoes of Umbra Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Drones/AdvancedResourceDroneBlueprint` (Titan Extractor Prime Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Drones/AdvancedUcResourceDroneBlueprint` (Distilling Extractor Prime Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/EidolonRecipes/InfestedEventIngredientBlueprint` (Eidolon Phylaxis Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/AnimaAltHelmetBlueprint` (Equinox Solstice Helmet Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/AshAltHelmetBlueprint` (Arcane Scorpion Helmet Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/BansheeAltHelmetBlueprint` (Arcane Reverb Helmet Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/BardAltHelmetBlueprint` (Octavia Cadenza Helmet Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/BrawlerAltHelmetBlueprint` (Atlas Tartarus Helmet Blueprint) -> manual-or-new-source; no current raw evidence
- `items:/Lotus/Types/Recipes/Helmets/BrawlerAltTwoHelmetBlueprint` (Atlas Shikoro Helmet Blueprint) -> manual-or-new-source; no current raw evidence

## Zero-Source Displayable Recipe/Component Records

| CatalogId | Display Name | Sibling Blueprint |
| --- | --- | --- |
| `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingChassisComponent` | Odonata Harness |  |
| `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingSystemsComponent` | Odonata Systems |  |
| `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingWingsComponent` | Odonata Wings |  |
| `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconAComponent` | SCORCHED BEACON |  |
| `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconBComponent` | CHROMA SIGNAL |  |
| `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaBeaconCComponent` | CHROMA MARK |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchHookSwordGuard` | Guard |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchSwordShieldAegis` | Aegis |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/SagekPrimeStock` | Sagek Prime Stock |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronBarrel` | SNIPETRON BARREL |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronReceiver` | SNIPETRON RECEIVER |  |
| `items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronStock` | SNIPETRON STOCK |  |

These are displayable `/Types/Recipes/` records that still return no acquisition at all. They are a separate gap from placeholder blueprints and are good candidates for recipe-output or sibling-blueprint inheritance fixes.

## Displayable No-Acquisition Prefixes

| Displayable No-Acq Prefix | Count |
| --- | --- |
| /Lotus/Types/StoreItems/AvatarImages | 1641 |
| /Lotus/Types/Items/ShipDecos | 1213 |
| /Lotus/Upgrades/Skins/Operator | 722 |
| /Lotus/Upgrades/Skins/Armor | 441 |
| /Lotus/Upgrades/Skins/Scarves | 285 |
| /Lotus/Types/Enemies/Grineer | 219 |
| /Lotus/Types/Challenges/Seasons | 213 |
| /Lotus/Types/Enemies/Corpus | 196 |
| /Lotus/Upgrades/Skins/Sigils | 187 |
| /Lotus/Types/Items/MiscItems | 182 |
| /Lotus/Types/Items/Titles | 150 |
| /Lotus/Upgrades/Skins/Clan | 125 |
| /Lotus/Types/Game/KubrowPet | 118 |
| /Lotus/Types/Items/Emotes | 115 |
| /Lotus/Upgrades/Skins/Sentinels | 115 |
| /Lotus/Types/Game/CatbrowPet | 92 |
| /Lotus/Upgrades/Skins/Effects | 92 |
| /Lotus/Types/Items/Fish | 83 |
| /Lotus/Types/Friendly/Pets | 76 |
| /Lotus/Upgrades/Skins/Liset | 76 |

Most of the remaining displayable no-acquisition population is cosmetics, glyphs, decorations, enemy avatars, and other non-progression records. The `displayableWithoutAcquisition.byPrefix` section in the JSON output keeps the full distribution if we want to carve those down later.

## Manual Coarse Mappings

- `items:/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit` -> data:activity/deimos/conservation, data:vendor/deimos/son
- `items:/Lotus/Types/Items/MushroomJournal/BlastMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Items/MushroomJournal/CorrosiveMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Items/MushroomJournal/GasMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Items/MushroomJournal/MagneticMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Items/MushroomJournal/RadiationMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Items/MushroomJournal/ViralMushroomJournalItem` -> data:activity/souterrains/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Recipes/WarframeRecipes/UrielChassisComponent` -> data:activity/the-descendia/oblivion-on-infernium-21, data:vendor/roathe/la-cathedrale
- `items:/Lotus/Types/Recipes/WarframeRecipes/UrielHelmetComponent` -> data:activity/the-descendia/oblivion-on-infernium-21, data:vendor/roathe/la-cathedrale
- `items:/Lotus/Types/Recipes/WarframeRecipes/UrielSystemsComponent` -> data:activity/the-descendia/oblivion-on-infernium-21, data:vendor/roathe/la-cathedrale
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunBarrelBlueprint` -> data:activity/deepmines/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunReceiverBlueprint` -> data:activity/deepmines/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunStockBlueprint` -> data:activity/deepmines/bounties, data:vendor/fortuna/nightcap
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusBarrelBlueprint` -> data:vendor/roathe/la-cathedrale, data:activity/the-descendia/oblivion-on-infernium-21
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusBladeBlueprint` -> data:vendor/roathe/la-cathedrale, data:activity/the-descendia/oblivion-on-infernium-21
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusReceiverBlueprint` -> data:vendor/roathe/la-cathedrale, data:activity/the-descendia/oblivion-on-infernium-21
- `items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusStockBlueprint` -> data:vendor/roathe/la-cathedrale, data:activity/the-descendia/oblivion-on-infernium-21
- `items:/Lotus/Weapons/Tenno/Bayonet/TnBayonetRifleBlueprint` -> data:vendor/roathe/la-cathedrale, data:activity/the-descendia/oblivion-on-infernium-21

