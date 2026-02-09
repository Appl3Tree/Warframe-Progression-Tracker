// ===== FILE: src/catalog/items/manualAcquisitionByCatalogId.ts =====
// src/catalog/items/manualAcquisitionByCatalogId.ts

// Manual overrides live here intentionally.
// Policy: if a catalogId has a manual mapping, it MUST be included.
export const MANUAL_ACQUISITION_BY_CATALOG_ID: Record<string, string[]> = {
    // ----------------------------
    // Unobtainable / account-locked
    // ----------------------------
    "items:/Lotus/Powersuits/Excalibur/ExcaliburPrime": ["data:unobtainable/founders"],

    // ----------------------------
    // Daily Tribute (login milestone rewards)
    // ----------------------------
    "items:/Lotus/Weapons/Tenno/Pistols/SundialGun/SundialPistol": ["data:system/daily-tribute"], // Azima
    "items:/Lotus/Weapons/Tenno/Melee/SunDialAxe/SundialAxeWeapon": ["data:system/daily-tribute"], // Zenistar
    "items:/Lotus/Weapons/Tenno/LongGuns/LoginPrimary/SundialRifle": ["data:system/daily-tribute"], // Zenith
    "items:/Lotus/Weapons/Tenno/Melee/SwordsAndBoards/SundialSwordBoard/SundialBoardSword": ["data:system/daily-tribute"], // Sigma & Octantis

    // ----------------------------
    // Clan research (Tenno Lab) and Dojo replication
    // ----------------------------
    "items:/Lotus/Powersuits/VOLTFemale/VOLTFemale": ["data:clan/tenno-lab"], // Volt
    "items:/Lotus/Types/Recipes/WarframeRecipes/VOLTHelmetComponent": ["data:clan/tenno-lab"], // Volt Neuroptics
    "items:/Lotus/Types/Recipes/WarframeRecipes/VOLTChassisComponent": ["data:clan/tenno-lab"], // Volt Chassis
    "items:/Lotus/Types/Recipes/WarframeRecipes/VOLTSystemsComponent": ["data:clan/tenno-lab"], // Volt Systems

    "items:/Lotus/Powersuits/Banshee/Banshee": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/BansheeChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/BansheeHelmetComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/BansheeSystemsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/Tengu/Tengu": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TenguChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TenguHelmetComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TenguSystemsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/MonkeyKing/MonkeyKing": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/WukongChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/WukongHelmetComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/WukongSystemsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/Nezha/Nezha": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/NezhaChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/NezhaHelmetComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/NezhaSystemsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/Archwing/StealthJetPack/StealthJetPack": ["data:clan/tenno-lab"], // Itzal
    "items:/Lotus/Types/Recipes/ArchwingRecipes/StealthArchwing/StealthArchwingChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/StealthArchwing/StealthArchwingSystemsComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/StealthArchwing/StealthArchwingWingsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/Archwing/DemolitionJetPack/DemolitionJetPack": ["data:clan/tenno-lab"], // Elytron
    "items:/Lotus/Types/Recipes/ArchwingRecipes/DemolitionArchwing/DemolitionArchwingChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/DemolitionArchwing/DemolitionArchwingSystemsComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/DemolitionArchwing/DemolitionArchwingWingsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Powersuits/Archwing/SupportJetPack/SupportJetPack": ["data:clan/tenno-lab"], // Amesha
    "items:/Lotus/Types/Recipes/ArchwingRecipes/SupportArchwing/SupportArchwingChassisComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/SupportArchwing/SupportArchwingSystemsComponent": ["data:clan/tenno-lab"],
    "items:/Lotus/Types/Recipes/ArchwingRecipes/SupportArchwing/SupportArchwingWingsComponent": ["data:clan/tenno-lab"],

    "items:/Lotus/Weapons/Tenno/Archwing/Primary/ArchwingHeavyPistols/ArchHeavyPistols": ["data:clan/tenno-lab"], // Dual Decurion
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchHeavyPistolsBarrel": ["data:clan/tenno-lab"], // Decurion Barrel
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchHeavyPistolsReceiver": ["data:clan/tenno-lab"], // Decurion Receiver
    "items:/Lotus/Weapons/Tenno/Archwing/Primary/RocketArtillery/ArchRocketCrossbow": ["data:clan/tenno-lab"], // Fluctus
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchRocketCrossbowBarrel": ["data:clan/tenno-lab"], // Fluctus Barrel
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchRocketCrossbowStock": ["data:clan/tenno-lab"], // Fluctus Limbs (yes, Stock id; displayName “Limbs”)
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/ArchRocketCrossbowReceiver": ["data:clan/tenno-lab"],

    "items:/Lotus/Weapons/ClanTech/Chemical/FlameThrowerWraith": ["data:crafting"], // Ignis Wraith (crafted)
    "items:/Lotus/Weapons/ClanTech/Chemical/FlamethrowerWraithBlueprint": ["data:dojo/chem-lab"], // Ignis Wraith Blueprint (replicate)
    "items:/Lotus/Types/Recipes/Weapons/InfBeamPistolBlueprint": ["data:dojo/bio-lab"], // Catabolyst Blueprint

    // Dorrclave component blueprints come from Clan Dojo research (Dagath's Hollow)
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnDagathBladeWhipBlade": ["data:dojo/dagaths-hollow"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnDagathBladeWhipHilt": ["data:dojo/dagaths-hollow"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnDagathBladeWhipString": ["data:dojo/dagaths-hollow"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnDagathBladeWhipHook": ["data:dojo/dagaths-hollow"],

    // ============================
    // QUEST-LOCKED BLUEPRINTS
    // ============================
    "items:/Lotus/Types/Recipes/WarframeRecipes/ExcaliburUmbraBlueprint": ["data:quest/the-sacrifice"],
    "items:/Lotus/Types/Recipes/Weapons/BallasSwordBlueprint": ["data:quest/chimera-prologue"],
    "items:/Lotus/Types/Recipes/EidolonRecipes/SentientCoreConversionABlueprint": ["data:vendor/cetus/quills", "data:eidolon/hunts"],
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerBlueprint": ["data:quest/octavias-anthem"],
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartA": ["data:quest/octavias-anthem"],
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartB": ["data:quest/octavias-anthem"],
    "items:/Lotus/Types/Keys/BardQuest/BardQuestSequencerPartC": ["data:quest/octavias-anthem"],
    "items:/Lotus/Weapons/Tenno/Grimoire/TnDoppelgangerGrimoire": ["data:quest/whispers-in-the-walls"],
    "items:/Lotus/Types/Recipes/Weapons/TnModQuestRifleWeaponBlueprint": ["data:quest/the-teacher"], // Thornbak Blueprint

    // ----------------------------
    // Orb Vallis: Resources / Fortuna bounties / Heists
    // ----------------------------
    "items:/Lotus/Types/Gameplay/Venus/Resources/VenusTreeItem": ["data:bounty/solaris-united"], // Tepa Nodule
    "items:/Lotus/Types/Gameplay/Venus/Resources/ArachnoidCamperItem": ["data:heist/profit-taker"], // Crisma Toroid

    // ----------------------------
    // Market / Account / Starter / System-given
    // ----------------------------
    "items:/Lotus/Weapons/Tenno/Pistol/HeavyPistol": ["data:market/credits"], // Lex
    "items:/Lotus/Weapons/Tenno/Akimbo/AkimboPistol": ["data:market/credits"], // Aklato
    "items:/Lotus/Weapons/Tenno/Archwing/Primary/ThanoTechArchLongGun/ThanoTechLongGun": ["data:necramech/arquebex-archgun"], // Mausolon (coarse)
    "items:/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingBarrel": ["data:operator/amp-starter"], // Mote Prism
    "items:/Lotus/Types/Recipes/Weapons/CeramicDaggerBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/HeatDaggerBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/HeatSwordBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/JawBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/PangolinSwordBlueprint": ["data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/PlasmaSwordBlueprint": ["data:market/credits"],


    // ----------------------------
    // Conclave / PvP variants
    // ----------------------------
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipOne": ["data:conclave"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipTwo": ["data:conclave"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipThree": ["data:conclave"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipFour": ["data:conclave"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipFive": ["data:conclave"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/PvPVariantTipSix": ["data:conclave"],

    "items:/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips/PvPVariantInfestedTipOne": ["data:events/plague-star"],
    "items:/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips/PvPVariantInfestedTipTwo": ["data:events/plague-star"],

    // ----------------------------
    // Pets
    // ----------------------------
    "items:/Lotus/Powersuits/Khora/Kavat/KhoraPrimeKavatPowerSuit": ["data:warframe/khora-prime"], // Venari Prime
    "items:/Lotus/Types/Game/CatbrowPet/CheshireCatbrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",], // Smeeta Kavat
    "items:/Lotus/Types/Game/CatbrowPet/MirrorCatbrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",], // Adarza Kavat
    "items:/Lotus/Types/Game/KubrowPet/AdventurerKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Game/KubrowPet/FurtiveKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Game/KubrowPet/GuardKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Game/KubrowPet/HunterKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Game/KubrowPet/RetrieverKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Game/KubrowPet/ChargerKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],

    "items:/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],

    "items:/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],
    "items:/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit": ["data:activity/deimos/conservation", "data:vendor/deimos/son",],

    // ----------------------------
    // Moa companion weapons / parts (Fortuna)
    // ----------------------------
    "items:/Lotus/Types/Friendly/Pets/MoaPets/MoaPetComponents/HextraWeapon": ["data:pets/moa"], // Multron

    // ----------------------------
    // Sentinel weapons (general)
    // ----------------------------
    "items:/Lotus/Types/Sentinels/SentinelWeapons/Gremlin": ["data:market/credits"], // Artax
    "items:/Lotus/Types/Sentinels/SentinelWeapons/LaserRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeLaserRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/BurstLaserPistol": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeBurstLaserPistol": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrismaBurstLaserPistol": ["data:baro/void-trader"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentGlaiveWeapon": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/DeconstructorPrime/PrimeHeliosGlaiveWeapon": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/DethMachineRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeDethMachineRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentShotgun": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/PrimeSentShotgun": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentinelFreezeRayRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentinelFreezeRayPrimeRifle": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelWeapons/SentElecRailgun": ["data:market/credits"],
    "items:/Lotus/Types/Sentinels/SentinelPowersuits/PrismaShadePowerSuit": ["data:baro/void-trader"],

    // ----------------------------
    // Baro Ki’Teer / Void Trader
    // ----------------------------
    "items:/Lotus/Weapons/Corpus/Bow/Longbow/PrismaLenz/PrismaLenzWeapon": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Corpus/LongGuns/CorpusUMP/PrismaCorpusUMP": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Corpus/Melee/CrpTonfa/CrpPrismaTonfa": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Corpus/Melee/KickAndPunch/PrismaObex": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Corpus/Pistols/CrpHandRL/PrismaAngstrum": ["data:baro/void-trader"],

    "items:/Lotus/Weapons/Grineer/LongGuns/GrineerLeverActionRifle/PrismaGrinlokWeapon": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Grineer/LongGuns/VoidTraderGorgon/VTGorgon": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/PrismaDualCleavers": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/PrismaMachete": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Grineer/Pistols/GrineerBulbousSMG/Prisma/PrismaTwinGremlinsWeapon": ["data:baro/void-trader"],

    "items:/Lotus/Weapons/Tenno/Archwing/Melee/VoidTraderArchsword/VTArchSwordWeapon": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Tenno/Archwing/Primary/ArchwingHeavyPistols/Prisma/PrismaArchHeavyPistols": ["data:baro/void-trader"],

    "items:/Lotus/Weapons/VoidTrader/PrismaGrakata": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/VoidTrader/PrismaSkana": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/VoidTrader/VTDetron": ["data:baro/void-trader"],
    "items:/Lotus/Weapons/Tenno/Melee/Warfan/TnMoonWarfan/MoonWarfanWeapon": ["data:baro/void-trader"],

    // ----------------------------
    // Variants / Starter series
    // ----------------------------
    "items:/Lotus/Weapons/Grineer/LongGuns/GrineerSniperRifle/VulkarWraith": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Melee/GrineerMachetteAndCleaver/WraithMacheteWeapon": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Melee/GrnBoomerang/HalikarWraithWeapon": ["data:variants/wraith"],
    "items:/Lotus/Weapons/Grineer/Pistols/WraithSingleViper/WraithSingleViper": ["data:variants/wraith"],

    "items:/Lotus/Weapons/Corpus/LongGuns/CrpBFG/Vandal/VandalCrpBFG": ["data:variants/vandal"],
    "items:/Lotus/Weapons/Corpus/LongGuns/CrpFreezeRay/Vandal/CrpFreezeRayVandalRifle": ["data:variants/vandal"],
    "items:/Lotus/Weapons/Corpus/LongGuns/CrpShockRifle/QuantaVandal": ["data:variants/vandal"],
    "items:/Lotus/Weapons/Corpus/LongGuns/Machinegun/SupraVandal": ["data:variants/vandal"],
    "items:/Lotus/Weapons/ClanTech/Energy/VandalElectroProd": ["data:variants/vandal"],

    "items:/Lotus/Weapons/Grineer/LongGuns/GrnOrokinRifle/GrnOrokinRifleWeapon": ["data:variants/prime"],
    "items:/Lotus/Weapons/Tenno/Pistol/LatoPrime": ["data:variants/prime"],
    "items:/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime": ["data:variants/prime"],

    "items:/Lotus/Weapons/MK1Series/MK1Bo": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Furax": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Furis": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Kunai": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Paris": ["data:market/credits"],
    "items:/Lotus/Weapons/MK1Series/MK1Strun": ["data:market/credits"],
    "items:/Lotus/Weapons/Tenno/Rifle/StartingRifle": ["data:market/credits"],

    // ----------------------------
    // Invasions (weapon blueprints/parts; weapons are crafted)
    // ----------------------------
    // Wiki indicates these are obtained via invasion reward tables as BLUEPRINT + COMPONENTS, then crafted.
    // So: finished weapon -> data:crafting; bp/parts -> data:invasion/rewards.
    "items:/Lotus/Weapons/Grineer/LongGuns/GrineerM16Homage/KarakWraith": ["data:crafting"],
    "items:/Lotus/Types/Recipes/Weapons/KarakWraithBlueprint": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/KarakWraithBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/KarakWraithReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/KarakWraithStock": ["data:invasion/rewards"],

    "items:/Lotus/Weapons/Tenno/LongGuns/WraithLatron/WraithLatron": ["data:crafting"],
    "items:/Lotus/Types/Recipes/Weapons/LatronWraithBlueprint": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LatronWraithBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LatronWraithReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LatronWraithStock": ["data:invasion/rewards"],

    "items:/Lotus/Weapons/Tenno/Shotgun/ShotgunVandal": ["data:crafting"], // Strun Wraith (weapon path in your list)
    "items:/Lotus/Types/Recipes/Weapons/StrunWraithBlueprint": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/StrunWraithBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/StrunWraithReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/StrunWraithStock": ["data:invasion/rewards"],

    // Leaving Twin Vipers Wraith as-is (not revalidated in the current web pass).
    "items:/Lotus/Weapons/Grineer/Pistols/WraithTwinVipers/WraithTwinVipers": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/TwinVipersWraithBlueprint": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TwinVipersWraithBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TwinVipersWraithReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TwinVipersWraithLink": ["data:invasion/rewards"],

    "items:/Lotus/Weapons/Tenno/Rifle/VandalSniperRifle": ["data:crafting"], // Snipetron Vandal
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronVandalBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronVandalReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/SnipetronVandalStock": ["data:invasion/rewards"],

    "items:/Lotus/Types/Recipes/Weapons/DeraVandalBlueprint": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalBarrel": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalReceiver": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/DeraVandalStock": ["data:invasion/rewards"],

    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/GrineerCombatKnifeBlade": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/GrineerCombatKnifeHilt": ["data:invasion/rewards"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/GrineerCombatKnifeHeatsink": ["data:invasion/rewards"],

    // ----------------------------
    // Nightwave
    // ----------------------------
    "items:/Lotus/Powersuits/Trapper/Trapper": ["data:nightwave/cred-offerings"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TrapperChassisComponent": ["data:nightwave/cred-offerings"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TrapperHelmetComponent": ["data:nightwave/cred-offerings"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/TrapperSystemsComponent": ["data:nightwave/cred-offerings"],
    "items:/Lotus/Types/Recipes/DarkSwordBlueprint": ["data:nightwave/cred-offerings"], // Dark Sword Blueprint
    "items:/Lotus/Types/Recipes/Weapons/DarkDaggerBlueprint": ["data:nightwave/cred-offerings","data:market/credits"],
    "items:/Lotus/Types/Recipes/Weapons/GlaiveBlueprint": ["data:nightwave/cred-offerings","data:market/credits"],


    // ----------------------------
    // Duviri / Circuit / Abyss / Arbitration (coarse)
    // ----------------------------
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriMaceShieldBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriTwoHandedKatanaBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriPolearmBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriAsymmetricalLongBowPlayerWeaponBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriHammerBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DuviriDualSwordsBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/DaxDuviriKatanaBlueprint": ["data:duviri/experience", "data:duviri/circuit"],
    "items:/Lotus/Types/Recipes/Weapons/PaxDuviricusShotgunBlueprint": ["data:duviri/experience", "data:duviri/circuit"],

    "items:/Lotus/Powersuits/PaxDuviricus/PaxDuviricus": ["data:duviri/kullervo"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/PaxDuviricusChassisComponent": ["data:duviri/kullervo"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/PaxDuviricusHelmetComponent": ["data:duviri/kullervo"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/PaxDuviricusSystemsComponent": ["data:duviri/kullervo"],

    "items:/Lotus/Powersuits/Dagath/Dagath": ["data:abyssal-zone/dagath"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/DagathChassisComponent": ["data:abyssal-zone/dagath"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/DagathHelmetComponent": ["data:abyssal-zone/dagath"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/DagathSystemsComponent": ["data:abyssal-zone/dagath"],

    "items:/Lotus/Powersuits/Devourer/Devourer": ["data:arbitrations/grendel"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/GrendelChassisComponent": ["data:arbitrations/grendel"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/GrendelHelmetComponent": ["data:arbitrations/grendel"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/GrendelSystemsComponent": ["data:arbitrations/grendel"],

    "items:/Lotus/Powersuits/Yareli/Yareli": ["data:quest/the-waverider"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/YareliChassisComponent": ["data:quest/the-waverider"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/YareliHelmetComponent": ["data:quest/the-waverider"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/YareliSystemsComponent": ["data:quest/the-waverider"],

    "items:/Lotus/Powersuits/DemonFrame/DemonFrame": ["data:quest/the-old-peace","data:activity/the-descendia"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/UrielChassisComponent": ["data:activity/the-descendia"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/UrielHelmetComponent": ["data:activity/the-descendia"],
    "items:/Lotus/Types/Recipes/WarframeRecipes/UrielSystemsComponent": ["data:activity/the-descendia"],

    // ----------------------------
    // 1999 Mushrooms / Journal items (Souterrains + vendor)
    // ----------------------------
    "items:/Lotus/Types/Items/MushroomJournal/CorrosiveMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],
    "items:/Lotus/Types/Items/MushroomJournal/MagneticMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],
    "items:/Lotus/Types/Items/MushroomJournal/RadiationMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],
    "items:/Lotus/Types/Items/MushroomJournal/GasMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],
    "items:/Lotus/Types/Items/MushroomJournal/BlastMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],
    "items:/Lotus/Types/Items/MushroomJournal/ViralMushroomJournalItem": ["data:activity/souterrains/bounties", "data:vendor/bonne-nuit"],

    // ----------------------------
    // Infested “Coda” weapons (Infested Lich system)
    // ----------------------------
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/1999InfShotgun/1999InfShotgunWeapon": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaHema": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSporothrix": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/LongGuns/CodaSynapse": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaCaustacyst/CodaCaustacyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaHirudo": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaMire": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/CodaPathocyst/CodaPathocyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Melee/InfestedHammer/InfLichHammerWeapon": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/1999InfSporePistol/1999InfSporePistolWeapon": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaCatabolyst": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaPox": ["data:lich/infested-coda"],
    "items:/Lotus/Weapons/Infested/InfestedLich/Pistols/CodaTysis": ["data:lich/infested-coda"],

    // ----------------------------
    // Remaining unknown-acquisition (coarse buckets)
    // ----------------------------
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponPS": ["data:enemy/zanuka-hunter"],
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIP": ["data:enemy/zanuka-hunter"],
    "items:/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetMeleeWeaponIS": ["data:enemy/zanuka-hunter"],

    "items:/Lotus/Weapons/Grineer/Melee/GunBlade/GrnGunBlade/GrnGunblade": ["data:varo/void-trader"],
    "items:/Lotus/Powersuits/Khora/Kavat/KhoraKavatPowerSuit": ["data:warframe/khora"],

    "items:/Lotus/Types/Items/MiscItems/GrnFlameSpearPart": ["data:enemy-item/prosecutors"],
    "items:/Lotus/Types/Items/MiscItems/SentientFragmentLootItem": ["data:node/murex/20-sentients"],

    // ----------------------------
    // Deepmines (Fortuna Airlock) + Nightcap vendor
    // ----------------------------
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunBarrelBlueprint": [
        "data:activity/deepmines/bounties",
        "data:vendor/fortuna/nightcap"
    ],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunReceiverBlueprint": [
        "data:activity/deepmines/bounties",
        "data:vendor/fortuna/nightcap"
    ],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/NokkoArchGunStockBlueprint": [
        "data:activity/deepmines/bounties",
        "data:vendor/fortuna/nightcap"
    ],
    "items:/Lotus/Types/Items/MushroomJournal/PlainMushroomJournalItem": ["data:deepmines/gathering"],

    // ----------------------------
    // The Old Peace / The Descendia: Vinquibus
    // ----------------------------
    "items:/Lotus/Weapons/Tenno/Bayonet/TnBayonetRifleBlueprint": [
        "data:vendor/roathe/la-cathedrale",
        "data:activity/the-descendia/maphica",
        "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c",
        "data:quest/the-old-peace"
    ],

    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusBarrelBlueprint": [
        "data:vendor/roathe/la-cathedrale",
        "data:activity/the-descendia/maphica",
        "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c",
        "data:quest/the-old-peace"
    ],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusBladeBlueprint": [
        "data:vendor/roathe/la-cathedrale",
        "data:activity/the-descendia/maphica",
        "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c",
        "data:quest/the-old-peace"
    ],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusReceiverBlueprint": [
        "data:vendor/roathe/la-cathedrale",
        "data:activity/the-descendia/maphica",
        "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c",
        "data:quest/the-old-peace"
    ],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/VinquibusStockBlueprint": [
        "data:vendor/roathe/la-cathedrale",
        "data:activity/the-descendia/maphica",
        "data:activity/the-descendia/oblivion-on-infernium-21/rotation-c",
        "data:quest/the-old-peace"
    ],

    "items:/Lotus/Weapons/Tenno/Pistol/BurstPistol": ["data:market/credits"], // Sicarus
    "items:/Lotus/Weapons/Tenno/Shotgun/Shotgun": ["data:market/credits"], // Strun

    // ============================
    // VENDOR / SYSTEM BLUEPRINTS
    // ============================
    "items:/Lotus/Types/Recipes/Weapons/CrpChargeGunBlueprint": ["data:vendor/fortuna/vox-solaris"],

    // Kompressa component blueprints are purchased from Ventkids (Fortuna)
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnYareliPistolBarrel": ["data:vendor/fortuna/ventkids"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/TnYareliPistolReceiver": ["data:vendor/fortuna/ventkids"],
    "items:/Lotus/Types/Recipes/DeimosRecipes/Mechs/NecromechBlueprint": ["data:vendor/deimos/necraloid"],

    // Purgator 1 component blueprints are purchased from The Hex
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LasrianNoxPlayerWeaponBarrel": ["data:vendor/hollvania/the-hex"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LasrianNoxPlayerWeaponReceiver": ["data:vendor/hollvania/the-hex"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/LasrianNoxPlayerWeaponStock": ["data:vendor/hollvania/the-hex"],


    // ===========================
    // Extras / Manual Additions
    // ===========================
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/InfTransformClawsWeaponBlade": ["data:vendor/deimos/father"],
    "items:/Lotus/Types/Recipes/Weapons/WeaponParts/InfTransformClawsWeaponBladeBlueprint": ["data:vendor/deimos/father"],
};
