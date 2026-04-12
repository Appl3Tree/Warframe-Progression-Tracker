# Unknown Source Research

Evidence log for blueprint records that previously resolved to `data:blueprint/unclassified`.

Only confirmed source findings belong here. If a case is still ambiguous, leave it unresolved in code and add it later once verified.

## Confirmed

### Odonata blueprint set

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingBlueprint`
  - `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingChassisBlueprint`
  - `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingSystemsBlueprint`
  - `items:/Lotus/Types/Recipes/ArchwingRecipes/StandardArchwing/StandardArchwingWingsBlueprint`
- Resolved sources:
  - `data:quest/the-archwing`
  - `data:vendor/simaris`
- Research basis:
  - The WARFRAME Wiki `Odonata` page states the main and component blueprints are obtainable during `The Archwing` quest, and additional blueprints can be bought from Cephalon Simaris.
  - URL: [https://wiki.warframe.com/w/Odonata](https://wiki.warframe.com/w/Odonata)

### Railjack Cephalon Blueprint

- Catalog ID:
  - `items:/Lotus/Types/Recipes/Railjack/RailjackCephalonBlueprint`
- Resolved source:
  - `data:quest/rising-tide`
- Research basis:
  - `Update 35` notes that starting `Rising Tide` now delivers the Railjack Cephalon Blueprint directly via Inbox.
  - URL: [https://wiki.warframe.com/w/Update_35](https://wiki.warframe.com/w/Update_35)

### Chroma blueprint set

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaChassisBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaHelmetBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/ChromaSystemsBlueprint`
- Resolved sources:
  - `data:quest/the-new-strange`
  - `data:vendor/simaris`
  - `data:duviri/circuit`
- Research basis:
  - The WARFRAME Wiki `Chroma` page states the main blueprint is rewarded from `The New Strange`.
  - It also states additional blueprints can be bought from Cephalon Simaris.
  - It also lists `The Circuit` as an alternative source after `The Duviri Paradox`.
  - URL: [https://wiki.warframe.com/w/Chroma](https://wiki.warframe.com/w/Chroma)

### Dagath blueprint set

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/WarframeRecipes/DagathBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/DagathChassisBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/DagathHelmetBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeRecipes/DagathSystemsBlueprint`
- Resolved source:
  - `data:dojo/dagaths-hollow`
- Research basis:
  - The WARFRAME Wiki `Dagath` page states Dagath's main and component blueprints are acquired from Dagath's Hollow within the Clan Dojo.
  - URL: [https://wiki.warframe.com/w/Dagath](https://wiki.warframe.com/w/Dagath)

### Ceti Lacera Blueprint

- Catalog ID:
  - `items:/Lotus/Types/Recipes/Weapons/OperationsLaceraBlueprint`
- Resolved source:
  - `data:events/naberus`
- Research basis:
  - The WARFRAME Wiki `Blueprints` page lists `Ceti Lacera` with blueprint source `Reward from Operation: Scarlet Spear`.
  - The WARFRAME Wiki `Ceti Lacera` page documents later event availability, including `Nights of Naberus`.
  - We use the existing curated recurring event source `data:events/naberus` rather than inventing a new Scarlet Spear source family in this pass.
  - URLs:
    - [https://wiki.warframe.com/w/Blueprints](https://wiki.warframe.com/w/Blueprints)
    - [https://wiki.warframe.com/w/Ceti_Lacera](https://wiki.warframe.com/w/Ceti_Lacera)

### Legacy fishing blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Items/Fish/Eidolon/Boosters/AnglerVisionBlueprint`
  - `items:/Lotus/Types/Items/Fish/Eidolon/Boosters/SoftTouchBlueprint`
- Resolved source:
  - `data:unobtainable/legacy`
- Research basis:
  - The `Luminous Dye` and `Pharoma` pages both note the reusable blueprints were removed in `Update 24.6`, and only players who obtained them before removal can still craft from them.
  - These blueprint catalog records therefore represent legacy-owned unobtainable blueprints rather than current vendor inventory.
  - URLs:
    - [https://wiki.warframe.com/w/Luminous_Dye](https://wiki.warframe.com/w/Luminous_Dye)
    - [https://wiki.warframe.com/w/Pharoma](https://wiki.warframe.com/w/Pharoma)

### Fishing trophy blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Items/Fish/Eidolon/TrophyBlueprints/*`
  - `items:/Lotus/Types/Items/Fish/Solaris/TrophyBlueprints/*`
  - `items:/Lotus/Types/Items/Fish/Deimos/TrophyBlueprints/*`
- Resolved sources:
  - `data:vendor/cetus/hai-luk`
  - `data:vendor/fortuna/business`
  - `data:vendor/deimos/daughter`
- Research basis:
  - Plains of Eidolon fish trophy blueprints are sold through Hai-Luk in Cetus; individual trophy pages such as `Tralok Trophy` and `Glappid Trophy` identify Hai-Luk as the blueprint vendor.
  - Orb Vallis fish trophy blueprints are sold through The Business in Fortuna; individual trophy pages such as `Eye-Eye Trophy` and `Recaster Trophy` identify The Business as the blueprint vendor.
  - Cambion Drift fish trophy blueprints are sold through Daughter in the Necralisk; individual trophy pages such as `Vitreospina Trophy` and `Aquapulmo Trophy` identify Daughter as the blueprint vendor.
  - This pass intentionally excludes the Deimos bait blueprints `Processed Fass Residue Blueprint` and `Processed Vome Residue Blueprint`, which remain unresolved until we have direct source confirmation.
  - URLs:
    - [https://wiki.warframe.com/w/Tralok_Trophy](https://wiki.warframe.com/w/Tralok_Trophy)
    - [https://wiki.warframe.com/w/Glappid_Trophy](https://wiki.warframe.com/w/Glappid_Trophy)
    - [https://wiki.warframe.com/w/Eye-Eye_Trophy](https://wiki.warframe.com/w/Eye-Eye_Trophy)
    - [https://wiki.warframe.com/w/Recaster_Trophy](https://wiki.warframe.com/w/Recaster_Trophy)
    - [https://wiki.warframe.com/w/Vitreospina_Trophy](https://wiki.warframe.com/w/Vitreospina_Trophy)
    - [https://wiki.warframe.com/w/Aquapulmo_Trophy](https://wiki.warframe.com/w/Aquapulmo_Trophy)

### Fishing bait blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Fishing/FishBaits/*`
  - `items:/Lotus/Types/Game/FishBait/Infested/InfestedFishBaitBBlueprint`
  - `items:/Lotus/Types/Game/FishBait/Infested/OrokinFishBaitBBlueprint`
- Resolved sources:
  - `data:vendor/cetus/hai-luk`
  - `data:vendor/deimos/daughter`
- Research basis:
  - The imported `warframe-items` raw `All.json` entries for Plains bait items such as `Twilight Bait` and `Cuthol Bait` explicitly say they are obtained from Fisher Hai-Luk in Cetus, and the bait blueprint records are the recipe artifacts for those items.
  - The imported `warframe-items` raw `All.json` entries for `Processed Fass Residue` and `Processed Vome Residue` explicitly say they are obtained from Daughter in the Necralisk, and their embedded blueprint component rows repeat the same acquisition text.
  - This pass therefore maps the actual blueprint records to the vendor stated in the imported source data rather than inferring from fish behavior or crafting ingredients.
  - Evidence slices:
    - `external/warframe-items/raw/All.json` around `Processed Fass Residue` and `Processed Vome Residue`
    - `external/warframe-items/raw/All.json` entries for `Twilight Bait` and `Cuthol Bait`

### Restorative utility blueprints

- Catalog IDs:
  - Dragon Keys:
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/DamageDebuffKeyBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/HealthDebuffKeyBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/ShieldDebuffKeyBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/SpeedDebuffKeyBlueprint`
  - Small Squad Restores:
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamAmmoTotemBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamEnergyTotemBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamHealTotemBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/HundredTeamShieldTotemBlueprint`
  - Large Squad Restores:
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamAmmoTenPackBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamEnergyTenPackBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamHealTenPackBlueprint`
    - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/SyndicateTeamShieldTenPackBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/MapMarkerBlueprint`
- Resolved sources:
  - Dragon Keys -> `data:dojo/orokin-lab`
  - Small Squad Restores -> `data:market/credits`
  - Large Squad Restores -> rank-3 syndicate vendors:
    - Ammo -> `data:vendor/syndicate/red-veil`
    - Energy -> `data:vendor/syndicate/arbiters-of-hexis`, `data:vendor/syndicate/the-perrin-sequence`
    - Health -> `data:vendor/syndicate/new-loka`, `data:vendor/syndicate/steel-meridian`
    - Shield -> `data:vendor/syndicate/cephalon-suda`
  - Loc-Pin -> `data:clan/tenno-lab`
- Research basis:
  - The imported `warframe-items` raw `All.json` entries for the four Dragon Keys explicitly say the blueprint can be obtained via the Orokin Lab in a Clan Dojo.
  - The WARFRAME Wiki `Squad Health Restore` page states the reusable blueprints for Small restores are purchased from the Market, and the `Syndicate` page lists the Rank 3 syndicate sources for the Large restore 10-pack blueprints by restore type.
  - The WARFRAME Wiki `Loc-Pin` page identifies the blueprint as Tenno Lab research.
  - URLs:
    - [https://wiki.warframe.com/w/Squad_Health_Restore](https://wiki.warframe.com/w/Squad_Health_Restore)
    - [https://wiki.warframe.com/w/Syndicate](https://wiki.warframe.com/w/Syndicate)
    - [https://wiki.warframe.com/w/Loc-Pin](https://wiki.warframe.com/w/Loc-Pin)

### Restorative event and quest blueprints

- Catalog IDs:
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipSmallBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipMediumBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/CreditChipLargeBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/FomorianNegatorBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/RazorbackCipherBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/InfestedSyringeBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/ArmorBuffSpeedDebuffBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/CloakingBuffBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/ReviveBuffBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/NpcBuffs/SpeedBuffArmorDebuffBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonFeyarchOberonBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonKnaveLokiBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/TitaniaQuest/SpecterSummonOrphidSarynBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/DayCommonAntitoxinBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/DayUnCommonAntitoxinBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/NightCommonAntitoxinBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/NightUnCommonAntitoxinBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/RareAntitoxinBlueprint`
  - `items:/Lotus/Types/StoreItems/Consumables/Restoratives/Toxins/SoloRareAntitoxinBlueprint`
- Resolved sources:
  - Humble / Faithful / Passionate Void Offering blueprints -> `data:market/credits`
  - Fomorian Disruptor Blueprint -> `data:events/fomorian-sabotage`
  - Razorback Cipher Blueprint -> `data:events/razorback-armada`
  - Antiserum Injector Blueprint -> `data:dojo/energy-lab`
  - Adrenal / Calcifin / Clotra / Refract Stim blueprints -> `data:clan/tenno-lab`
  - Sunrise / Nightfall / Twilight Apothic blueprints -> `data:quest/the-silver-grove`
  - Antitoxin blueprints -> `data:market/credits`
- Research basis:
  - The WARFRAME Wiki `False Profit` event guide states players may purchase Void Offerings from the Market during the event; the individual Void Offering pages are also categorized as currently unavailable, so this pass records their actual acquisition source as the Market rather than fabricating a separate hybrid source.
  - `Update 15` says the player receives the Fomorian Disruptor blueprint from the Lotus when a Fomorian event appears.
  - The `Cipher` page lists Razorback Cipher under event-restricted gear tied to Razorback Armada.
  - The WARFRAME Wiki `Blueprints` page lists `Antiserum Injector` as Energy Lab research, and the `Synthula` page lists the four Stims as Tenno Lab research prerequisites.
  - The `Sunrise Apothic` page states Apothic blueprints are obtained by progressing through `The Silver Grove` quest.
  - The `Antitoxin` page lists the antitoxin gear family as market-purchased blueprints.
  - URLs:
    - [https://wiki.warframe.com/w/False_Profit](https://wiki.warframe.com/w/False_Profit)
    - [https://wiki.warframe.com/w/Humble_Void_Offering](https://wiki.warframe.com/w/Humble_Void_Offering)
    - [https://wiki.warframe.com/w/Faithful_Void_Offering](https://wiki.warframe.com/w/Faithful_Void_Offering)
    - [https://wiki.warframe.com/w/Passionate_Void_Offering](https://wiki.warframe.com/w/Passionate_Void_Offering)
    - [https://wiki.warframe.com/w/Update_15](https://wiki.warframe.com/w/Update_15)
    - [https://wiki.warframe.com/w/Cipher](https://wiki.warframe.com/w/Cipher)
    - [https://wiki.warframe.com/w/Blueprints](https://wiki.warframe.com/w/Blueprints)
    - [https://wiki.warframe.com/w/Synthula](https://wiki.warframe.com/w/Synthula)
    - [https://wiki.warframe.com/w/Sunrise_Apothic](https://wiki.warframe.com/w/Sunrise_Apothic)
    - [https://wiki.warframe.com/w/Antitoxin](https://wiki.warframe.com/w/Antitoxin)

### Solaris operator armor blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/Apparatist*Blueprint`
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/GreaseWitch*Blueprint`
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/Smelter*Blueprint`
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/Technomancer*Blueprint`
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/SuitN*Blueprint`
  - `items:/Lotus/Types/Recipes/OperatorArmour/Solaris/SuitO*Blueprint`
- Resolved sources:
  - Haztech / Smelter / Outrider / Vent Rat blueprints -> `data:vendor/fortuna/vox-solaris`
  - Vent Pobber Ventkid / Kubrodon Ventkid blueprints -> `data:vendor/fortuna/ventkids`
- Research basis:
  - The WARFRAME Wiki bundle and vendor pages place the Haztech, Smelter, Outrider, and Vent Rat Operator cosmetics with Little Duck / Vox Solaris offerings.
  - The WARFRAME Wiki `Roky` page explicitly links the Vent Pobber Ventkid bundle to the Ventkids vendor, and the Kubrodon Ventkid cosmetics belong to the same Ventkids operator-cosmetic family.
  - URLs:
    - [https://wiki.warframe.com/w/Haztech_Armor_Bundle](https://wiki.warframe.com/w/Haztech_Armor_Bundle)
    - [https://wiki.warframe.com/w/Smelter_Armor_Bundle](https://wiki.warframe.com/w/Smelter_Armor_Bundle)
    - [https://wiki.warframe.com/w/Outrider_Armor_Bundle](https://wiki.warframe.com/w/Outrider_Armor_Bundle)
    - [https://wiki.warframe.com/w/Vent_Rat_Armor_Bundle](https://wiki.warframe.com/w/Vent_Rat_Armor_Bundle)
    - [https://wiki.warframe.com/w/Roky](https://wiki.warframe.com/w/Roky)

### Weapon skin blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Weapons/Skins/*`
- Resolved source:
  - `data:nightwave/cred-offerings`
- Research basis:
  - The WARFRAME Wiki `Nightwave` page explicitly lists the weapon skin blueprint rotation sold for Cred Offerings, including the Solstice, Synoid, Desert-Camo, Shock-Camo, Dagger-Axe, Brokk, and Manticore skin blueprints that make up this entire recipe folder in the catalog.
  - The local catalog contains exactly 31 records under `/Lotus/Types/Recipes/Weapons/Skins/`, and they match the unresolved Nightwave skin set one-for-one.
  - URL:
    - [https://wiki.warframe.com/w/Nightwave](https://wiki.warframe.com/w/Nightwave)

### Weapon part blueprint families

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/InfTransformClawsWeapon*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/InfUziWeapon*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/ThanotechPistol*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/ThanotechRifle*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnDagathBladeWhip*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnYareliPistol*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/LasrianNoxPlayerWeapon*Blueprint`

### Market syandana and armor attachment blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Syandanas/AsaSyandanaBlueprint`
  - `items:/Lotus/Types/Recipes/Syandanas/UruSyandanaBlueprint`
  - `items:/Lotus/Types/Recipes/Syandanas/YomoSyandanaBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/DaedelusChestPlateBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/DaedelusLeftLegBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/DaedelusLeftShoulderBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EdoChestPlateBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EdoLeftLegBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EdoLeftShoulderBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EosChestPlateBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EosLeftLegBlueprint`
  - `items:/Lotus/Types/Recipes/ArmourAttachments/EosLeftShoulderBlueprint`
- Resolved source:
  - `data:market/platinum`
- Research basis:
  - The WARFRAME Wiki `Syandana` page lists `Asa Syandana` in the Market-Available section, and the same page’s media/history covers `Uru Syandana` and `Yomo Syandana` as standard syandanas rather than syndicate-, event-, or pack-exclusive items.
  - The archived WARFRAME `Market/Warframes` page explicitly lists `Asa Syandana`, `Daedalus Chest Plate`, `Daedalus Shoulder Plates`, `Daedalus Spurs`, `Edo Chest Plate`, `Edo Shin Plates`, `Edo Shoulder Plates`, `Eos Chest Plate`, `Eos Shoulder Plates`, and `Eos Spurs` with Market Platinum prices.
  - URLs:
    - [https://wiki.warframe.com/w/Syandana](https://wiki.warframe.com/w/Syandana)
    - [https://warframe-archive.fandom.com/wiki/Market/Warframes](https://warframe-archive.fandom.com/wiki/Market/Warframes)

### Quest and clan key blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Keys/DojoKeyBlueprint`
  - `items:/Lotus/Types/Keys/FairyQuestKeyBlueprint`
  - `items:/Lotus/Types/Keys/GolemQuestKeyBlueprint`
  - `items:/Lotus/Types/Keys/InfestedAladVQuest/InfestedAladKeyBlueprint`
  - `items:/Lotus/Types/Keys/LimboQuest/LimboChassisKeyBlueprint`
  - `items:/Lotus/Types/Keys/LimboQuest/LimboHelmetKeyBlueprint`
  - `items:/Lotus/Types/Keys/LimboQuest/LimboSystemsKeyBlueprint`
- Resolved sources:
  - Clan Key Blueprint -> `data:clan/join`
  - The Silver Grove Blueprint -> `data:quest/the-silver-grove`
  - The Jordas Precept Blueprint -> `data:quest/the-jordas-precept`
  - Mutalist Alad V Assassinate Blueprint -> `data:quest/patient-zero`
  - Limbo theorem blueprints -> `data:quest/the-limbo-theorem`
- Research basis:
  - The WARFRAME Wiki `Clan Key` page states the blueprint is automatically added when a player starts or joins a clan.
  - The `Patient Zero` page lists `Mutalist Alad V Key Blueprint` as the quest reward, and the `Mutalist Alad V Assassinate Key` page repeats that the reusable blueprint is awarded from the quest.
  - The `The Silver Grove` page documents the quest blueprint as the item used to progress the quest.
  - The `The Jordas Precept` page centers the quest around building the quest key blueprint to continue the chain.
  - The `The Limbo Theorem` transcript explicitly references the Limbo theorem blueprints as quest-delivered attachments and progression steps.
  - URLs:
    - [https://wiki.warframe.com/w/Clan_Key](https://wiki.warframe.com/w/Clan_Key)
    - [https://wiki.warframe.com/w/Patient_Zero](https://wiki.warframe.com/w/Patient_Zero)
    - [https://wiki.warframe.com/w/Mutalist_Alad_V_Assassinate_Key](https://wiki.warframe.com/w/Mutalist_Alad_V_Assassinate_Key)
    - [https://wiki.warframe.com/w/The_Silver_Grove](https://wiki.warframe.com/w/The_Silver_Grove)
    - [https://wiki.warframe.com/w/The_Jordas_Precept](https://wiki.warframe.com/w/The_Jordas_Precept)
    - [https://wiki.warframe.com/w/The_Limbo_Theorem/Transcript](https://wiki.warframe.com/w/The_Limbo_Theorem/Transcript)
  - `items:/Lotus/Types/Recipes/Weapons/WeaponParts/EntFistIncarnonGloveBlueprint`
- Resolved sources:
  - Keratinos / Zymos / Sepulcrum / Trumna part blueprints -> `data:vendor/deimos/father`
  - Dorrclave main and part blueprints -> `data:dojo/dagaths-hollow`
  - Kompressa part blueprints -> `data:vendor/fortuna/ventkids`
  - Purgator 1 part blueprints -> `data:vendor/hollvania/the-hex`
  - Ruvox Glove Blueprint -> `data:vendor/sanctum/loid`
- Research basis:
  - The WARFRAME Wiki weapon pages for Keratinos, Zymos, Sepulcrum, and Trumna identify Father as the acquisition source for their blueprints/components.
  - The WARFRAME Wiki `Dorrclave` page places the weapon and its components in Dagath’s Hollow Dojo research.
  - The WARFRAME Wiki `Kompressa` page ties its acquisition to Ventkids.
  - The WARFRAME Wiki `Purgator 1` page places its acquisition with The Hex in Höllvania.
  - The WARFRAME Wiki `Ruvox` / `Necracoil` pages identify Ruvox-related component acquisition through Loid in Sanctum Anatomica.
  - URLs:
    - [https://wiki.warframe.com/w/Keratinos](https://wiki.warframe.com/w/Keratinos)
    - [https://wiki.warframe.com/w/Zymos](https://wiki.warframe.com/w/Zymos)
    - [https://wiki.warframe.com/w/Sepulcrum](https://wiki.warframe.com/w/Sepulcrum)
    - [https://wiki.warframe.com/w/Trumna](https://wiki.warframe.com/w/Trumna)
    - [https://wiki.warframe.com/w/Dorrclave](https://wiki.warframe.com/w/Dorrclave)
    - [https://wiki.warframe.com/w/Kompressa](https://wiki.warframe.com/w/Kompressa)
    - [https://wiki.warframe.com/w/Purgator_1](https://wiki.warframe.com/w/Purgator_1)
    - [https://wiki.warframe.com/w/Ruvox](https://wiki.warframe.com/w/Ruvox)
    - [https://wiki.warframe.com/w/Necracoil](https://wiki.warframe.com/w/Necracoil)

### Deimos pet blueprint families

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Pets/InfestedCritter*Blueprint`
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Pets/InfestedPredator*Blueprint`
- Resolved source:
  - `data:vendor/deimos/son`
- Research basis:
  - The WARFRAME Wiki antigen and mutagen pages for Deimos Vulpaphyla and Predasite components identify Son as the blueprint vendor, for example `Virox Antigen`, `Adra Mutagen`, `Iranon Antigen`, and `Leptosam Mutagen`.
  - The unresolved Deimos pet recipe folder is exactly the modular companion antigen and mutagen blueprint set, so this pass maps the whole folder family to Son rather than inventing per-item special cases.
  - URLs:
    - [https://wiki.warframe.com/w/Virox_Antigen](https://wiki.warframe.com/w/Virox_Antigen)
    - [https://wiki.warframe.com/w/Adra_Mutagen](https://wiki.warframe.com/w/Adra_Mutagen)
    - [https://wiki.warframe.com/w/Iranon_Antigen](https://wiki.warframe.com/w/Iranon_Antigen)
    - [https://wiki.warframe.com/w/Leptosam_Mutagen](https://wiki.warframe.com/w/Leptosam_Mutagen)

### Necraloid mech blueprint families

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Mechs/NecromechPart*Blueprint`
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Mechs/Thanotech*Blueprint`
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Sentinel/ThanotechSentinel*Blueprint`
  - `items:/Lotus/Types/Recipes/Weapons/ThanotechArchGunBlueprint`
  - `items:/Lotus/Types/Recipes/Weapons/ThanotechGrenadeLauncherBlueprint`
- Resolved source:
  - `data:vendor/deimos/necraloid`
- Research basis:
  - The WARFRAME Wiki `Voidrig`, `Bonewidow`, `Cortege`, and `Morgha` pages place these blueprints and component blueprints with Necraloid in the Necralisk.
  - The unresolved mech, Morgha/Cortege part, and Loid sentinel cosmetic blueprint families all sit in the same Deimos Necraloid recipe namespace, so this pass maps only those explicit Necraloid families.
  - URLs:
    - [https://wiki.warframe.com/w/Voidrig](https://wiki.warframe.com/w/Voidrig)
    - [https://wiki.warframe.com/w/Bonewidow](https://wiki.warframe.com/w/Bonewidow)
    - [https://wiki.warframe.com/w/Cortege](https://wiki.warframe.com/w/Cortege)
    - [https://wiki.warframe.com/w/Morgha](https://wiki.warframe.com/w/Morgha)

### Deimos weapon main blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Weapons/ThanotechPistolBlueprint`
  - `items:/Lotus/Types/Recipes/Weapons/ThanotechRifleBlueprint`
- Resolved source:
  - `data:vendor/deimos/father`
- Research basis:
  - The WARFRAME Wiki `Sepulcrum` and `Trumna` pages identify Father as the acquisition source for their blueprints and components.
  - We had already resolved the matching part blueprints to Father in the previous pass, so this step closes the still-unclassified main blueprint records with the same explicit source.
  - URLs:
    - [https://wiki.warframe.com/w/Sepulcrum](https://wiki.warframe.com/w/Sepulcrum)
    - [https://wiki.warframe.com/w/Trumna](https://wiki.warframe.com/w/Trumna)

### Deimos prospecting blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/DeimosRecipes/Prospecting/*`
- Resolved source:
  - `data:vendor/deimos/otak`
- Research basis:
  - The WARFRAME Wiki `Otak` wares list explicitly includes the full set of refined Deimos gem and alloy reusable blueprints sold in the Necralisk.
  - Individual pages such as `Faceted Tiametrite`, `Adramal Alloy`, and `Purified Heciphron` also state their blueprints are purchased from Otak.
  - URLs:
    - [https://wiki.warframe.com/w/Otak](https://wiki.warframe.com/w/Otak)
    - [https://wiki.warframe.com/w/Faceted_Tiametrite](https://wiki.warframe.com/w/Faceted_Tiametrite)
    - [https://wiki.warframe.com/w/Adramal_Alloy](https://wiki.warframe.com/w/Adramal_Alloy)
    - [https://wiki.warframe.com/w/Purified_Heciphron](https://wiki.warframe.com/w/Purified_Heciphron)

### Solaris recipe blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/SolarisRecipes/Arcanes/*`
  - `mods:/Lotus/Types/Recipes/SolarisRecipes/Arcanes/*`
  - `items:/Lotus/Types/Recipes/SolarisRecipes/Prospecting/*`
- Resolved sources:
  - Pax arcane blueprints -> `data:vendor/fortuna/rude-zuud`
  - Sunpoint Plasma Drill and refined Orb Vallis gem/alloy blueprints -> `data:vendor/fortuna/smokefinger`
- Research basis:
  - The WARFRAME Wiki `Pax Bolt`, `Pax Charge`, and `Pax Soar` pages list Rude Zuud as the vendor source.
  - The WARFRAME Wiki `Smokefinger` wares list explicitly includes the Sunpoint Plasma Drill and the full Orb Vallis refined gem/alloy blueprint set.
  - The imported `warframe-items` raw `All.json` descriptions for items like `Smooth Phasmin`, `Travocyte Alloy`, and `Radiant Zodian` also explicitly say their blueprints are sold by Smokefinger in Fortuna on Venus.
  - This pass intentionally leaves the `/SolarisRecipes/Nokko/` cave-art blueprints unresolved because I do not yet have direct blueprint-source evidence for those specific recipe records.
  - URLs:
    - [https://wiki.warframe.com/w/Pax_Bolt](https://wiki.warframe.com/w/Pax_Bolt)
    - [https://wiki.warframe.com/w/Pax_Charge](https://wiki.warframe.com/w/Pax_Charge)
    - [https://wiki.warframe.com/w/Pax_Soar](https://wiki.warframe.com/w/Pax_Soar)
    - [https://wiki.warframe.com/w/Rude_Zuud](https://wiki.warframe.com/w/Rude_Zuud)
    - [https://wiki.warframe.com/w/Smokefinger](https://wiki.warframe.com/w/Smokefinger)

### Eidolon prospecting blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/EidolonRecipes/Prospecting/*`
- Resolved source:
  - `data:vendor/cetus/suumbaat`
- Research basis:
  - The imported `warframe-items` raw `All.json` descriptions for `Radian Sentirum`, `Heart Nyth`, `Star Crimzian`, and the three Nosam Cutter variants explicitly say their blueprints are sold by Old Man Suumbaat in Cetus on Earth.
  - This pass intentionally leaves `Eidolon Phylaxis Blueprint` unresolved because it is not part of the same mining-vendor family.
  - Evidence slices:
    - `external/warframe-items/raw/All.json` entries for `Radian Sentirum`
    - `external/warframe-items/raw/All.json` entries for `Heart Nyth`
    - `external/warframe-items/raw/All.json` entries for `Star Crimzian`
    - `external/warframe-items/raw/All.json` entries for `Nosam Cutter`, `Focused Nosam Cutter`, and `Advanced Nosam Cutter`

### Drone and component blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/Drones/BasicResourceDroneBlueprint`
  - `items:/Lotus/Types/Recipes/Drones/BasicUcResourceDroneBlueprint`
  - `items:/Lotus/Types/Recipes/Components/CorruptedBombardBallBlueprint`
  - `items:/Lotus/Types/Recipes/Components/EliteAlertShipDecoBlueprint`
  - `items:/Lotus/Types/Recipes/Components/FormaStanceBlueprint`
  - `items:/Lotus/Types/Recipes/Components/InfestedIrradiatedBaitBallBlueprint`
  - `items:/Lotus/Types/Recipes/Components/RelayThermicStrutBlueprint`
  - `items:/Lotus/Types/Recipes/Components/StalkerBallBlueprint`
  - `items:/Lotus/Types/Recipes/Components/UmbraFormaBlueprint`
- Resolved sources:
  - Titan Extractor / Distilling Extractor blueprints -> `data:market/credits`
  - Corrupted Bombard Specter Blueprint -> `data:baro/void-trader`
  - Vitus Illumina Blueprint -> `data:vendor/arbitrations/galatea`
  - Stance Forma Blueprint -> `data:vendor/steel-path/teshin`
  - Potent Pherliac Pods Blueprint -> `data:quest/the-jordas-precept`
  - Relay Strut Component Blueprint -> `data:events/pyrus-project`
  - Stalker Specter Blueprint -> `data:nightwave/rank-reward`
  - Umbra Forma Blueprint -> `data:vendor/steel-path/teshin`, `data:nightwave/rank-reward`
- Research basis:
  - The WARFRAME Wiki `Extractor` page states Titan Extractor and Distilling Extractor blueprints are purchased from the Market for credits.
  - The WARFRAME Wiki `Specter` / `Corrupted Bombard` pages state the Corrupted Bombard Specter Blueprint was a Baro Ki'Teer exclusive.
  - The WARFRAME Wiki `Arbitrations` and `Vitus Essence` pages list `Vitus Illumina` in Arbitration Honors.
  - The WARFRAME Wiki `Stance Forma` and `Umbra Forma` pages list current Steel Path Honors acquisition; the Umbra Forma page also lists Nightwave rank rewards, and `Nightwave: Nora's Mix Volume 7` lists recent Stalker Specter, Stance Forma, and Umbra Forma rewards.
  - The WARFRAME Wiki `Pherliac Pod` and `The Jordas Precept/Transcript` pages state the Potent Pherliac Pods Blueprint is obtained during `The Jordas Precept` via inbox attachment.
  - The WARFRAME Wiki `Relay Strut Component` and `The Pyrus Project` pages state the reusable blueprint is attached in an inbox message during the event.
  - This pass intentionally leaves the remaining drone/component blueprints unresolved where I do not yet have direct source proof for the specific blueprint item.
  - URLs:
    - [https://wiki.warframe.com/w/Extractor](https://wiki.warframe.com/w/Extractor)
    - [https://wiki.warframe.com/w/Specter](https://wiki.warframe.com/w/Specter)
    - [https://wiki.warframe.com/w/Corrupted_Bombard](https://wiki.warframe.com/w/Corrupted_Bombard)
    - [https://wiki.warframe.com/w/Arbitrations](https://wiki.warframe.com/w/Arbitrations)
    - [https://wiki.warframe.com/w/Vitus_Essence](https://wiki.warframe.com/w/Vitus_Essence)
    - [https://wiki.warframe.com/w/Stance_Forma](https://wiki.warframe.com/w/Stance_Forma)
    - [https://wiki.warframe.com/w/Umbra_Forma](https://wiki.warframe.com/w/Umbra_Forma)
    - [https://wiki.warframe.com/w/Nightwave/Nora%27s_Mix_Volume_7](https://wiki.warframe.com/w/Nightwave/Nora%27s_Mix_Volume_7)
    - [https://wiki.warframe.com/w/Pherliac_Pod](https://wiki.warframe.com/w/Pherliac_Pod)
    - [https://wiki.warframe.com/w/The_Jordas_Precept/Transcript](https://wiki.warframe.com/w/The_Jordas_Precept/Transcript)
    - [https://wiki.warframe.com/w/Relay_Strut_Component](https://wiki.warframe.com/w/Relay_Strut_Component)
    - [https://wiki.warframe.com/w/The_Pyrus_Project](https://wiki.warframe.com/w/The_Pyrus_Project)

### Fishing spear and Vasca Curative blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Restoratives/Consumable/SpearFishingSpearBlueprint`
  - `items:/Lotus/Types/Restoratives/Consumable/SpearFishingSpearBBlueprint`
  - `items:/Lotus/Types/Restoratives/Consumable/SpearFishingSpearCBlueprint`
  - `items:/Lotus/Types/Restoratives/Consumable/RobofishSpearBBlueprint`
  - `items:/Lotus/Types/Restoratives/Consumable/RobofishSpearCBlueprint`
  - `items:/Lotus/Types/Restoratives/Consumable/CatbrowVampireDisinfectBlueprint`
- Resolved sources:
  - Lanzo / Tulok / Peram Fishing Spear blueprints -> `data:vendor/cetus/hai-luk`
  - Shockprod / Stunna Fishing Spear blueprints -> `data:vendor/fortuna/business`
  - Vasca Curative Blueprint -> `data:vendor/cetus/teasonai`
- Research basis:
  - The imported `warframe-items` raw `All.json` entries for the five fishing spears explicitly repeat vendor acquisition in the blueprint component descriptions: Hai-Luk for Plains spears and The Business for Fortuna servofish spears.
  - The imported `warframe-items` raw `All.json` entry for `Vasca Curative` includes the update note telling players to visit Master Teasonai in Cetus for the remedy.
  - Evidence slices:
    - `external/warframe-items/raw/All.json` entries for `Lanzo Fishing Spear`, `Tulok Fishing Spear`, and `Peram Fishing Spear`
    - `external/warframe-items/raw/All.json` entries for `Shockprod Fishing Spear` and `Stunna Fishing Spear`
    - `external/warframe-items/raw/All.json` entry for `Vasca Curative`

### Landing craft main blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/Gyroscope/GyroscopeBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipBlueprint`
- Resolved source:
  - `data:market/credits`
- Research basis:
  - The WARFRAME Wiki pages for `Mantis`, `Scimitar`, `Xiphos`, and `Parallax` all explicitly state that the main landing craft blueprint can be purchased from the Market, while the component blueprints come from separate crate, assassin, or cache sources.
  - This pass intentionally resolves only the main blueprint records and leaves the component blueprint records unresolved until we model those container and enemy source families directly.
  - URLs:
    - [https://wiki.warframe.com/w/Mantis](https://wiki.warframe.com/w/Mantis)
    - [https://wiki.warframe.com/w/Scimitar](https://wiki.warframe.com/w/Scimitar)
    - [https://wiki.warframe.com/w/Xiphos](https://wiki.warframe.com/w/Xiphos)
    - [https://wiki.warframe.com/w/Parallax](https://wiki.warframe.com/w/Parallax)

### Landing craft component blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysStarChartBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysPowerCoreBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/Mantys/MantysExoskeletonBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyAvionicsBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyEnginesBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/BlueSky/BlueSkyFuselageBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipAvionicsBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipEnginesBlueprint`
  - `items:/Lotus/Types/Recipes/LandingCraftRecipes/ZarimanShip/ZarimanShipFuselageBlueprint`
- Resolved sources:
  - Mantis components -> rare Orokin / Grineer / Corpus storage containers
  - Scimitar components -> Zanuka Hunter, Stalker family, and Vem Tabook
  - Parallax components -> reinforced carrypods on the Zariman
- Research basis:
  - The WARFRAME Wiki `Mantis` page and the imported `warframe-items` raw `All.json` entry identify the exact storage-container families for each Mantis component blueprint.
  - The WARFRAME Wiki `Scimitar` page and the imported `warframe-items` raw `All.json` entry identify Zanuka Hunter, Stalker-family assassins, and Vem Tabook as the exact sources for the Scimitar component blueprints.
  - The WARFRAME Wiki `Parallax` page and the imported `warframe-items` raw `All.json` entry identify Reinforced Carrypods as the source for all three Parallax component blueprints.
  - This pass intentionally leaves the Xiphos component blueprints unresolved because they span a wide cache-node family and deserve a more explicit cache-source model instead of a hand-wavy coarse bucket.
  - URLs:
    - [https://wiki.warframe.com/w/Mantis](https://wiki.warframe.com/w/Mantis)
    - [https://wiki.warframe.com/w/Scimitar](https://wiki.warframe.com/w/Scimitar)
    - [https://wiki.warframe.com/w/Parallax](https://wiki.warframe.com/w/Parallax)

### Synthicator blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/SynthicatorRecipes/FlareBlueBlueprint`
  - `items:/Lotus/Types/Recipes/SynthicatorRecipes/FlareRedBlueprint`
- Resolved source:
  - `data:vendor/cetus/nakak`
- Research basis:
  - The WARFRAME Wiki `Fosfor` page lists both `Fosfor Blau` and `Fosfor Rahd` as sourced from Nakak, and the `Nakak` vendor page explicitly lists both reusable blueprints in her wares.
  - The in-repo raw item entries also confirm these are the reusable blueprint records for those two consumables.
  - URLs:
    - [https://wiki.warframe.com/w/Fosfor](https://wiki.warframe.com/w/Fosfor)
    - [https://wiki.warframe.com/w/Nakak](https://wiki.warframe.com/w/Nakak)

### Warframe skin / ephemera blueprints

- Catalog IDs:
  - `items:/Lotus/Types/Recipes/WarframeSkins/AvatarBatBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/AvatarBloodABlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/EmberImmortalBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/ExcaliburImmortalBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/FootstepsEidolonBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/FootstepsPetalsBlueprint`
  - `items:/Lotus/Types/Recipes/WarframeSkins/FrostImmortalBlueprint`
- Resolved sources:
  - Naberus Ephemera Blueprint -> `data:events/naberus`
  - Bleeding Body Ephemera Blueprint -> `data:vendor/arbitrations/galatea`
  - Seeding Step Ephemera Blueprint -> `data:vendor/arbitrations/galatea`
  - Eidolon Ephemera Blueprint -> `data:nightwave/rank-reward`
  - Ember / Excalibur / Frost Immortal Skin Blueprints -> `data:market/platinum`
- Research basis:
  - The `Naberus` page lists Naberus Ephemera in Daughter's Nights of Naberus offerings.
  - The `Vitus Essence` and `Arbitrations/Rewards` pages place Bleeding Body and Seeding Step under Arbitration honors / Arbitration rewards.
  - `Nightwave: Intermission I` lists Eidolon Ephemera as a rank reward.
  - `Immortal Skin Bundle` confirms the Immortal skins are Market cosmetics sold for Platinum.
  - URLs:
    - [https://wiki.warframe.com/w/Naberus](https://wiki.warframe.com/w/Naberus)
    - [https://wiki.warframe.com/w/Vitus_Essence](https://wiki.warframe.com/w/Vitus_Essence)
    - [https://wiki.warframe.com/w/Arbitrations/Rewards](https://wiki.warframe.com/w/Arbitrations/Rewards)
    - [https://wiki.warframe.com/w/Nightwave/Intermission_I](https://wiki.warframe.com/w/Nightwave/Intermission_I)
    - [https://wiki.warframe.com/w/Immortal_Skin_Bundle](https://wiki.warframe.com/w/Immortal_Skin_Bundle)
