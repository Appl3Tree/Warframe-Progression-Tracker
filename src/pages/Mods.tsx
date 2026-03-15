// src/pages/Mods.tsx
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import MODS_RAW from "../data/mods.json";
import RIVENS_RAW from "../data/rivens.json";
import MOD_LOCATIONS_RAW from "../../external/warframe-drop-data/raw/modLocations.json";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModUpgrade {
    UpgradeType?: string;
    Value?: number;
    DisplayAsPercent?: number;
    OperationType?: string;
    LocTag?: string;
}

interface ModData {
    ArtifactPolarity?: string;
    BaseDrain?: string;
    FusionLimit?: string;
    FusionLimitRange?: [number, number];
    ItemCompatibility?: string;
    Upgrades?: ModUpgrade[];
    Rarity?: string;
}

interface ModEntry {
    path: string;
    name: string;
    categories?: string[];
    data?: ModData;
    parents?: string[];
}

type ModSection = "mods" | "arcanes";

type ModCategory =
    | "warframe" | "aura" | "augment"
    | "primary" | "secondary" | "melee"
    | "exilus" | "vehicles" | "archgun" | "archmelee"
    | "robotic" | "beast" | "railjack"
    | "antique" | "parazon" | "tome" | "rivens";

type ArcaneCategory =
    | "warframe" | "operator" | "amps"
    | "tektolyst" | "primary" | "secondary"
    | "melee" | "kitguns" | "zaws";

type Polarity =
    | "madurai" | "vazarin" | "naramon"
    | "zenurik" | "umbra" | "any";

type AntiqueSchool =
    | "all" | "madurai" | "naramon" | "zenurik" | "vazarin" | "unairu";

type ParazonFilter = "all" | "requiem" | "antivirus";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOD_CATEGORIES: { key: ModCategory; label: string }[] = [
    { key: "warframe",  label: "Warframe"   },
    { key: "aura",      label: "Aura"       },
    { key: "augment",   label: "Augment"    },
    { key: "primary",   label: "Primary"    },
    { key: "secondary", label: "Secondary"  },
    { key: "melee",     label: "Melee"      },
    { key: "exilus",    label: "Exilus"     },
    { key: "vehicles",  label: "Vehicles"   },
    { key: "archgun",   label: "Archgun"    },
    { key: "archmelee", label: "Archmelee"  },
    { key: "robotic",   label: "Robotic"    },
    { key: "beast",     label: "Beast"      },
    { key: "railjack",  label: "Railjack"   },
    { key: "antique",   label: "Antique"    },
    { key: "rivens",    label: "Rivens"     },
    { key: "parazon",   label: "Parazon"    },
    { key: "tome",      label: "Tome"       },
];

const ARCANE_CATEGORIES: { key: ArcaneCategory; label: string }[] = [
    { key: "warframe",  label: "Warframe"            },
    { key: "operator",  label: "Operator"            },
    { key: "amps",      label: "Amps"                },
    { key: "tektolyst", label: "Tektolyst Artifacts" },
    { key: "primary",   label: "Primary"             },
    { key: "secondary", label: "Secondary"           },
    { key: "melee",     label: "Melee"               },
    { key: "kitguns",   label: "Kitguns"             },
    { key: "zaws",      label: "Zaws"                },
];

const POLARITIES: { key: Polarity; label: string; ap: string }[] = [
    { key: "madurai",  label: "Madurai",  ap: "AP_ATTACK"  },
    { key: "vazarin",  label: "Vazarin",  ap: "AP_DEFENSE" },
    { key: "naramon",  label: "Naramon",  ap: "AP_TACTIC"  },
    { key: "zenurik",  label: "Zenurik",  ap: "AP_POWER"   },
    { key: "umbra",    label: "Umbra",    ap: "AP_UMBRA"   },
    { key: "any",      label: "Any",      ap: "AP_ANY"     },
];

const ANTIQUE_SCHOOLS: { key: AntiqueSchool; label: string; ap: string }[] = [
    { key: "all",     label: "All",     ap: ""          },
    { key: "madurai", label: "Madurai", ap: "AP_ATTACK" },
    { key: "naramon", label: "Naramon", ap: "AP_TACTIC" },
    { key: "zenurik", label: "Zenurik", ap: "AP_POWER"  },
    { key: "vazarin", label: "Vazarin", ap: "AP_DEFENSE"},
    { key: "unairu",  label: "Unairu",  ap: "AP_WARD"   },
];

const UPGRADE_TYPE_LABELS: Record<string, string> = {
    WEAPON_DAMAGE_AMOUNT:            "Damage",
    WEAPON_FIRE_RATE:                "Fire Rate",
    WEAPON_RELOAD_SPEED:             "Reload Speed",
    WEAPON_AMMO_EFFICIENCY:          "Ammo Efficiency",
    WEAPON_AMMO_MAX:                 "Ammo Max",
    WEAPON_MULTISHOT:                "Multishot",
    WEAPON_RANGE:                    "Range",
    WEAPON_PUNCH_THROUGH:            "Punch Through",
    WEAPON_ZOOM:                     "Zoom",
    WEAPON_CRITICAL_CHANCE:          "Critical Chance",
    WEAPON_CRITICAL_DAMAGE:          "Critical Damage",
    WEAPON_STATUS_CHANCE:            "Status Chance",
    WEAPON_STATUS_DURATION:          "Status Duration",
    WEAPON_RECOIL:                   "Recoil",
    WEAPON_SPREAD:                   "Accuracy",
    WEAPON_DAMAGE_TYPE_FIRE:         "Heat Damage",
    WEAPON_DAMAGE_TYPE_COLD:         "Cold Damage",
    WEAPON_DAMAGE_TYPE_ELECTRIC:     "Electric Damage",
    WEAPON_DAMAGE_TYPE_TOXIN:        "Toxin Damage",
    WEAPON_DAMAGE_TYPE_BLAST:        "Blast Damage",
    WEAPON_DAMAGE_TYPE_CORROSIVE:    "Corrosive Damage",
    WEAPON_DAMAGE_TYPE_VIRAL:        "Viral Damage",
    WEAPON_DAMAGE_TYPE_RADIATION:    "Radiation Damage",
    WEAPON_DAMAGE_TYPE_MAGNETIC:     "Magnetic Damage",
    WEAPON_DAMAGE_TYPE_GAS:          "Gas Damage",
    WEAPON_AMMO_CONSUME_RATE:        "Ammo Consumption",
    AVATAR_ABILITY_STRENGTH:         "Ability Strength",
    AVATAR_ABILITY_DURATION:         "Ability Duration",
    AVATAR_ABILITY_RANGE:            "Ability Range",
    AVATAR_ABILITY_EFFICIENCY:       "Ability Efficiency",
    AVATAR_MAX_SHIELDS:              "Shield Capacity",
    AVATAR_MAX_HEALTH:               "Health",
    AVATAR_MAX_POWER:                "Energy Max",
    AVATAR_POWER_REGEN:              "Energy Regen",
    AVATAR_ARMOR:                    "Armor",
    AVATAR_SPRINT_BOOST:             "Sprint Speed",
    AVATAR_ABILITY_AUGMENT:          "Ability Augment",
    MELEE_ATTACK_SPEED:              "Attack Speed",
    MELEE_CRITICAL_CHANCE:           "Critical Chance",
    MELEE_CRITICAL_DAMAGE:           "Critical Damage",
    MELEE_STATUS_CHANCE:             "Status Chance",
    MELEE_RANGE:                     "Melee Range",
    MELEE_CHANNELING_EFFICIENCY:     "Channeling Efficiency",
};

function labelForUpgradeType(type: string | undefined): string {
    if (!type) return "Effect";
    return UPGRADE_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeMaxRank(qa: string | undefined): number {
    switch (qa) {
        case "QA_NONE":      return 0;
        case "QA_LOW":       return 3;
        case "QA_MEDIUM":    return 5;
        case "QA_HIGH":      return 5;
        case "QA_VERY_HIGH": return 10;
        default:             return 5;
    }
}

function decodeBaseDrain(qa: string | undefined): number {
    switch (qa) {
        case "QA_NONE":      return 0;
        case "QA_LOW":       return 2;
        case "QA_MEDIUM":    return 4;
        case "QA_HIGH":      return 6;
        case "QA_VERY_HIGH": return 10;
        default:             return 4;
    }
}

function formatValue(v: number, displayAsPercent: number | undefined, roundTo?: number): string {
    if (displayAsPercent) {
        const pct = Math.round(v * 100 * 10) / 10;
        return (v >= 0 ? "+" : "") + pct + "%";
    }
    if (roundTo && roundTo > 0) {
        const rounded = Math.round(v / roundTo) * roundTo;
        return (v >= 0 ? "+" : "") + String(Math.round(rounded * 100) / 100);
    }
    return (v >= 0 ? "+" : "") + String(Math.round(v * 100) / 100);
}

function polarityLabel(ap: string | undefined): string {
    const p = POLARITIES.find(x => x.ap === ap);
    if (p) return p.label;
    if (ap === "AP_WARD")    return "Aura";
    if (ap === "AP_PRECEPT") return "Precept";
    return ap ? ap.replace("AP_", "") : "—";
}

function rarityColor(rarity: string | undefined): string {
    switch (rarity) {
        case "COMMON":    return "text-slate-400";
        case "UNCOMMON":  return "text-amber-400";
        case "RARE":      return "text-orange-400";
        case "LEGENDARY": return "text-cyan-300";
        default:          return "text-slate-400";
    }
}

function normalize(s: string): string {
    return s.toLowerCase();
}

// ─── Classification ────────────────────────────────────────────────────────────

function classifyModCategory(entry: ModEntry): ModCategory | null {
    const path   = entry.path ?? "";
    const compat = entry.data?.ItemCompatibility ?? "";
    const polarity = entry.data?.ArtifactPolarity ?? "";

    // Tome (Grimoire invocation mods)
    if (compat.includes("Grimoire") || path.includes("Invocation")) return "tome";

    // Parazon
    if (compat.includes("TnHackingDevice") || compat.includes("HackingDevice")) return "parazon";

    // Antique
    if (compat.includes("Antique") || (entry.parents ?? []).some(p => p.includes("Antique"))) return "antique";

    // Aura
    if (polarity === "AP_WARD") return "aura";

    // Augment — specific warframe-suit compat (not generic PlayerPowerSuit)
    if (
        (compat.includes("/Lotus/Powersuits/") && !compat.includes("PlayerPowerSuit") && !compat.includes("OperatorSuit")) ||
        (compat.includes("ExaltedSword") || compat.includes("ExaltedBow") || compat.includes("DoomSword") || compat.includes("StormBlade") ||
         compat.includes("GaruGaruda") || compat.includes("GaraShank") || compat.includes("KhoraWhip") || compat.includes("ExaltedBook") ||
         compat.includes("MonkeyKingStaff") || compat.includes("PacifistFist") || compat.includes("NinjaStorm") ||
         compat.includes("BerserkerMelee") || compat.includes("AtlasPunch"))
    ) return "augment";

    // Archgun
    if (compat.includes("ArchGun")) return "archgun";

    // Archmelee
    if (compat.includes("ArchMeleeWeapon") || compat.includes("ArchMelee")) return "archmelee";

    // Vehicles (Necramech, Hoverboard/Yareli, Archwing suit)
    if (compat.includes("BaseMechSuit") || compat.includes("HoverboardSuit") || compat.includes("FlightJetPack")) return "vehicles";

    // Robotic companions (Sentinel, MOA, Zanuka)
    if (
        compat.includes("SentinelPowerSuit") || compat.includes("SentinelPower") ||
        compat.includes("ZanukaPet") || compat.includes("MoaPet") || compat.includes("RoboticPet")
    ) return "robotic";

    // Beast companions (Kavat, Kubrow, Predasite, Vulpaphyla)
    if (
        compat.includes("CatbrowPet") || compat.includes("BeastPet") ||
        compat.includes("KubrowPet") || (compat.includes("PetPowerSuit") && !compat.includes("Robotic"))
    ) return "beast";

    // Melee
    if (compat.includes("PlayerMeleeWeapon") || compat.includes("LotusGlaiveWeapon")) return "melee";

    // Secondary
    if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo")) return "secondary";

    // Primary (rifle, shotgun, bow, longgun, bullet weapon)
    if (
        compat.includes("LotusRifle") || compat.includes("LotusAssaultRifle") ||
        compat.includes("LotusSniperRifle") || compat.includes("LotusShotgun") ||
        compat.includes("LotusBow") || compat.includes("LotusLongGun") ||
        compat.includes("LotusBulletWeapon")
    ) return "primary";

    // Exilus — mods with "Exilus" in path
    if (path.toLowerCase().includes("exilus")) return "exilus";

    // Warframe (generic)
    if (compat.includes("PlayerPowerSuit") || compat === "") return "warframe";

    return "warframe"; // fallback
}

function classifyArcaneCategory(entry: ModEntry): ArcaneCategory | null {
    const compat = entry.data?.ItemCompatibility ?? "";

    if (compat.includes("PlayerPowerSuit"))     return "warframe";
    if (compat.includes("OperatorSuit"))        return "operator";
    if (compat.includes("OperatorAmplifier") || compat.includes("OperatorAmpWeapon")) return "amps";
    if (compat.includes("LotusAntiqueWeapon") || compat.includes("Antiques/Lotus"))   return "tektolyst";
    if (compat.includes("LotusModularWeapon") || compat.includes("Ostron/Melee"))     return "zaws";
    // Kitguns (modular pistol — LotusBulletWeapon)
    if (compat.includes("LotusBulletWeapon"))   return "kitguns";
    // Primary arcanes
    if (compat.includes("LotusLongGun") || compat.includes("LotusShotgun") || compat.includes("LotusLongBow") || compat.includes("LotusBow")) return "primary";
    // Secondary arcanes
    if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo")) return "secondary";
    // Melee arcanes
    if (compat.includes("PlayerMeleeWeapon"))   return "melee";

    return null;
}

// ─── Data Preparation ─────────────────────────────────────────────────────────

// Build mod-location lookup by name (lowercase)
type EnemyDrop = { enemyName: string; rarity: string; chance: number; enemyModDropChance: number };
type ModLocationEntry = { modName: string; enemies: EnemyDrop[] };

const modLocationLookup = new Map<string, EnemyDrop[]>();
const rawLocations = (MOD_LOCATIONS_RAW as any).modLocations as ModLocationEntry[] | undefined;
if (Array.isArray(rawLocations)) {
    for (const entry of rawLocations) {
        if (entry.modName && Array.isArray(entry.enemies)) {
            modLocationLookup.set(normalize(entry.modName), entry.enemies);
        }
    }
}

// Parse mods.json
const ALL_ENTRIES: ModEntry[] = Object.entries(MODS_RAW as Record<string, any>)
    .map(([path, val]) => ({ path, ...val } as ModEntry))
    .filter(e => e.name && typeof e.name === "string");

// Mods (category "mod"), excluding OperatorSuit ones (those are arcanes)
const MOD_ENTRIES: ModEntry[] = ALL_ENTRIES.filter(e =>
    e.categories?.[0] === "mod" &&
    e.data?.ItemCompatibility !== "/Lotus/Powersuits/Operator/OperatorSuit"
);

// Arcanes: category "arcane" + category "mod" with OperatorSuit compat (Magus series)
const ARCANE_ENTRIES: ModEntry[] = ALL_ENTRIES.filter(e =>
    e.categories?.[0] === "arcane" ||
    (e.categories?.[0] === "mod" && e.data?.ItemCompatibility === "/Lotus/Powersuits/Operator/OperatorSuit")
);

// Rivens from rivens.json
const RIVEN_ENTRIES: ModEntry[] = Object.entries(RIVENS_RAW as Record<string, any>)
    .map(([path, val]) => ({ path, ...val } as ModEntry))
    .filter(e => e.name);

// Arcane total needed per rank: triangular numbers
const ARCANE_TOTAL_PER_RANK: Record<number, number> = { 0: 1, 1: 3, 2: 6, 3: 10, 4: 15, 5: 21 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
                active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-800"
            ].join(" ")}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

function SubPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "px-2.5 py-1 rounded-md text-xs border transition-colors whitespace-nowrap",
                active
                    ? "bg-slate-700 text-slate-100 border-slate-500"
                    : "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
            ].join(" ")}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

// ─── Mod Detail Panel ─────────────────────────────────────────────────────────

function ModDetail({ entry, isRiven = false }: { entry: ModEntry; isRiven?: boolean }) {
    const data = entry.data;
    const maxRank = isRiven
        ? (data?.FusionLimitRange?.[1] ?? 8)
        : decodeMaxRank(data?.FusionLimit);
    const baseDrain = decodeBaseDrain(data?.BaseDrain);
    const upgrades = data?.Upgrades ?? [];
    const polarity = data?.ArtifactPolarity;
    const rarity = data?.Rarity ?? "COMMON";
    const drops = modLocationLookup.get(normalize(entry.name)) ?? [];

    return (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base font-semibold text-slate-100">{entry.name}</span>
                <span className={["text-xs font-medium", rarityColor(rarity)].join(" ")}>{rarity}</span>
                {polarity && (
                    <span className="text-xs rounded-full px-2 py-0.5 border border-slate-600 bg-slate-800 text-slate-300">
                        {polarityLabel(polarity)}
                    </span>
                )}
                {maxRank > 0 && (
                    <span className="text-xs text-slate-400">Max Rank: {maxRank}</span>
                )}
            </div>

            {/* Slot cost per rank */}
            {baseDrain > 0 && maxRank > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Slot Cost per Rank <span className="text-slate-500 font-normal">(approximate)</span></div>
                    <div className="flex flex-wrap gap-1">
                        {Array.from({ length: maxRank + 1 }, (_, r) => (
                            <div key={r} className="text-center">
                                <div className="text-xs text-slate-500 mb-0.5">R{r}</div>
                                <div className="w-8 text-center rounded bg-slate-800 border border-slate-700 py-1 text-xs text-slate-200 font-mono">
                                    {baseDrain + r}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            {upgrades.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Effects</div>
                    <div className="space-y-2">
                        {upgrades.slice(0, 4).map((u, i) => {
                            if (!u.UpgradeType || u.Value === undefined) return null;
                            const label = labelForUpgradeType(u.UpgradeType);
                            const perRank = u.Value;
                            const maxVal = perRank * (maxRank > 0 ? (maxRank + 1) : 1);
                            return (
                                <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs text-slate-300">{label}</span>
                                        <span className="text-xs font-mono text-slate-200">
                                            {formatValue(perRank, u.DisplayAsPercent)} / rank
                                            &nbsp;→&nbsp;
                                            <span className="text-cyan-300">
                                                {formatValue(maxVal, u.DisplayAsPercent)} at R{maxRank}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Drop locations */}
            {drops.length > 0 ? (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Drop Locations ({drops.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {drops.map((d, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs rounded px-2 py-1 bg-slate-800/40 border border-slate-800">
                                <span className="text-slate-300 truncate flex-1">{d.enemyName}</span>
                                <span className={["shrink-0", rarityColor(d.rarity)].join(" ")}>{d.rarity}</span>
                                <span className="shrink-0 text-slate-400 font-mono">{(d.chance).toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-slate-500">No enemy drop data available for this mod.</div>
            )}
        </div>
    );
}

// ─── Arcane Detail Panel ──────────────────────────────────────────────────────

function ArcaneDetail({ entry }: { entry: ModEntry }) {
    const data = entry.data;
    const maxRank = decodeMaxRank(data?.FusionLimit);
    const upgrades = (data?.Upgrades ?? []).concat((data as any)?.ExtraUpgrades ?? []);
    const drops = modLocationLookup.get(normalize(entry.name)) ?? [];

    return (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base font-semibold text-slate-100">{entry.name}</span>
                <span className="text-xs text-slate-400">Max Rank: {maxRank}</span>
            </div>

            {/* Rank requirements */}
            <div>
                <div className="text-xs text-slate-400 font-medium mb-2">Copies Required to Rank</div>
                <div className="flex flex-wrap gap-1">
                    {Array.from({ length: maxRank + 1 }, (_, r) => {
                        const total = ARCANE_TOTAL_PER_RANK[r] ?? ((r + 1) * (r + 2) / 2);
                        return (
                            <div key={r} className="text-center">
                                <div className="text-xs text-slate-500 mb-0.5">R{r}</div>
                                <div className="w-8 text-center rounded bg-slate-800 border border-slate-700 py-1 text-xs text-slate-200 font-mono">
                                    {total}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            {upgrades.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Effects</div>
                    <div className="space-y-2">
                        {upgrades.slice(0, 4).map((u: any, i: number) => {
                            const type = u.UpgradeType;
                            const val = u.Value;
                            if (!type || val === undefined) return null;
                            const label = labelForUpgradeType(type);
                            const maxVal = val * (maxRank > 0 ? (maxRank + 1) : 1);
                            return (
                                <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs text-slate-300">{label}</span>
                                        <span className="text-xs font-mono text-slate-200">
                                            {formatValue(val, u.DisplayAsPercent)} / rank
                                            &nbsp;→&nbsp;
                                            <span className="text-cyan-300">
                                                {formatValue(maxVal, u.DisplayAsPercent)} at R{maxRank}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Drop locations */}
            {drops.length > 0 ? (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Drop Locations ({drops.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {drops.map((d, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs rounded px-2 py-1 bg-slate-800/40 border border-slate-800">
                                <span className="text-slate-300 truncate flex-1">{d.enemyName}</span>
                                <span className={["shrink-0", rarityColor(d.rarity)].join(" ")}>{d.rarity}</span>
                                <span className="shrink-0 text-slate-400 font-mono">{(d.chance).toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-slate-500">No enemy drop data available for this arcane.</div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Mods() {
    const [section, setSection] = useState<ModSection>("mods");

    // Mods state
    const [modCategory, setModCategory] = useState<ModCategory>("warframe");
    const [modPolarity, setModPolarity] = useState<Polarity | null>(null);
    const [antiqueSchool, setAntiqueSchool] = useState<AntiqueSchool>("all");
    const [parazonFilter, setParazonFilter] = useState<ParazonFilter>("all");
    const [modSearch, setModSearch] = useState("");
    const [selectedMod, setSelectedMod] = useState<ModEntry | null>(null);

    // Arcanes state
    const [arcaneCategory, setArcaneCategory] = useState<ArcaneCategory>("warframe");
    const [arcaneSearch, setArcaneSearch] = useState("");
    const [selectedArcane, setSelectedArcane] = useState<ModEntry | null>(null);

    // ── Mods list ──────────────────────────────────────────────────────────────

    const filteredMods = useMemo<ModEntry[]>(() => {
        const q = normalize(modSearch.trim());

        // Rivens are from a separate source
        if (modCategory === "rivens") {
            return RIVEN_ENTRIES.filter(e => !q || normalize(e.name).includes(q));
        }

        let list = MOD_ENTRIES.filter(e => {
            const cat = classifyModCategory(e);
            return cat === modCategory;
        });

        // Polarity sub-filter
        if (modPolarity !== null) {
            const ap = POLARITIES.find(p => p.key === modPolarity)?.ap;
            if (ap) list = list.filter(e => e.data?.ArtifactPolarity === ap);
        }

        // Antique school sub-filter
        if (modCategory === "antique" && antiqueSchool !== "all") {
            const ap = ANTIQUE_SCHOOLS.find(s => s.key === antiqueSchool)?.ap;
            if (ap) list = list.filter(e => e.data?.ArtifactPolarity === ap);
        }

        // Parazon sub-filter
        if (modCategory === "parazon") {
            if (parazonFilter === "requiem") {
                list = list.filter(e => e.name.match(/Ris|Fass|Vome|Xata|Khra|Jahu|Netra|Lohk|Naeg|Mend|Vis|Netra|Kel|Xol/i) || e.path.includes("Requiem"));
            } else if (parazonFilter === "antivirus") {
                list = list.filter(e => e.name.includes("Antivirus") || e.path.includes("Antivirus"));
            }
        }

        if (q) list = list.filter(e => normalize(e.name).includes(q));

        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [modCategory, modPolarity, antiqueSchool, parazonFilter, modSearch]);

    // ── Arcanes list ───────────────────────────────────────────────────────────

    const filteredArcanes = useMemo<ModEntry[]>(() => {
        const q = normalize(arcaneSearch.trim());

        let list = ARCANE_ENTRIES.filter(e => {
            const cat = classifyArcaneCategory(e);
            return cat === arcaneCategory;
        });

        if (q) list = list.filter(e => normalize(e.name).includes(q));

        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [arcaneCategory, arcaneSearch]);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <Section title="Mods & Arcanes">
                <div className="text-sm text-slate-400 mb-4">
                    Browse mods and arcanes by category. Click any entry for details including slot costs, effects, and drop locations.
                </div>

                {/* Primary tabs */}
                <div className="flex items-center gap-4 border-b border-slate-800 mb-4">
                    {(["mods", "arcanes"] as const).map(s => (
                        <button
                            key={s}
                            className={[
                                "px-3 py-2 text-sm border-b-2 -mb-px",
                                section === s
                                    ? "border-slate-100 text-slate-100"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            ].join(" ")}
                            onClick={() => setSection(s)}
                        >
                            {s === "mods" ? "Mods" : "Arcanes"}
                        </button>
                    ))}
                </div>

                {/* ── MODS ── */}
                {section === "mods" && (
                    <div>
                        {/* Category pills */}
                        <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-2">Category</div>
                            <div className="flex flex-wrap gap-2">
                                {MOD_CATEGORIES.map(c => (
                                    <CategoryPill
                                        key={c.key}
                                        label={c.label}
                                        active={modCategory === c.key}
                                        onClick={() => {
                                            setModCategory(c.key);
                                            setModPolarity(null);
                                            setAntiqueSchool("all");
                                            setParazonFilter("all");
                                            setSelectedMod(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Polarity sub-filter (most categories) */}
                        {modCategory !== "rivens" && modCategory !== "antique" && modCategory !== "parazon" && (
                            <div className="mb-3">
                                <div className="text-xs text-slate-500 mb-2">Polarity</div>
                                <div className="flex flex-wrap gap-1.5">
                                    <SubPill
                                        label="All polarities"
                                        active={modPolarity === null}
                                        onClick={() => setModPolarity(null)}
                                    />
                                    {POLARITIES.map(p => (
                                        <SubPill
                                            key={p.key}
                                            label={p.label}
                                            active={modPolarity === p.key}
                                            onClick={() => setModPolarity(modPolarity === p.key ? null : p.key)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Antique school sub-filter */}
                        {modCategory === "antique" && (
                            <div className="mb-3">
                                <div className="text-xs text-slate-500 mb-2">School</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {ANTIQUE_SCHOOLS.map(s => (
                                        <SubPill
                                            key={s.key}
                                            label={s.label}
                                            active={antiqueSchool === s.key}
                                            onClick={() => setAntiqueSchool(s.key)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Parazon sub-filter */}
                        {modCategory === "parazon" && (
                            <div className="mb-3">
                                <div className="text-xs text-slate-500 mb-2">Type</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(["all", "requiem", "antivirus"] as const).map(f => (
                                        <SubPill
                                            key={f}
                                            label={f === "all" ? "All" : f === "requiem" ? "Requiem" : "Antivirus"}
                                            active={parazonFilter === f}
                                            onClick={() => setParazonFilter(f)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search */}
                        <div className="mb-3">
                            <input
                                className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                                value={modSearch}
                                onChange={e => setModSearch(e.target.value)}
                                placeholder={`Search ${modCategory} mods...`}
                            />
                        </div>

                        {/* Mod list */}
                        <div className="text-xs text-slate-500 mb-2">{filteredMods.length} mods</div>
                        <div className="max-h-[55vh] overflow-y-auto space-y-0.5">
                            {filteredMods.length === 0 && (
                                <div className="text-sm text-slate-400 py-4">No mods found for this category.</div>
                            )}
                            {filteredMods.map(e => {
                                const isSelected = selectedMod?.path === e.path;
                                const polarity = e.data?.ArtifactPolarity;
                                const rarity = e.data?.Rarity ?? "";
                                return (
                                    <div key={e.path}>
                                        <button
                                            className={[
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                                                isSelected
                                                    ? "bg-slate-800 border-slate-600 text-slate-100"
                                                    : "bg-slate-900/30 border-slate-800/60 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                                            ].join(" ")}
                                            onClick={() => setSelectedMod(isSelected ? null : e)}
                                        >
                                            <span className="flex-1 font-medium truncate">{e.name}</span>
                                            {polarity && (
                                                <span className="shrink-0 text-xs text-slate-500">{polarityLabel(polarity)}</span>
                                            )}
                                            {rarity && (
                                                <span className={["shrink-0 text-xs", rarityColor(rarity)].join(" ")}>{rarity}</span>
                                            )}
                                        </button>
                                        {isSelected && (
                                            <ModDetail entry={e} isRiven={modCategory === "rivens"} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── ARCANES ── */}
                {section === "arcanes" && (
                    <div>
                        {/* Category pills */}
                        <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-2">Category</div>
                            <div className="flex flex-wrap gap-2">
                                {ARCANE_CATEGORIES.map(c => (
                                    <CategoryPill
                                        key={c.key}
                                        label={c.label}
                                        active={arcaneCategory === c.key}
                                        onClick={() => {
                                            setArcaneCategory(c.key);
                                            setSelectedArcane(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mb-3">
                            <input
                                className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm"
                                value={arcaneSearch}
                                onChange={e => setArcaneSearch(e.target.value)}
                                placeholder={`Search ${arcaneCategory} arcanes...`}
                            />
                        </div>

                        {/* Arcane list */}
                        <div className="text-xs text-slate-500 mb-2">{filteredArcanes.length} arcanes</div>

                        {/* Rank guide */}
                        <div className="mb-4 rounded-lg bg-slate-900/50 border border-slate-800 px-3 py-2">
                            <div className="text-xs text-slate-400 font-medium mb-1">Copies needed to reach rank:</div>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                {Object.entries(ARCANE_TOTAL_PER_RANK).map(([r, n]) => (
                                    <span key={r}><span className="text-slate-200">R{r}</span>: {n} {n === 1 ? "copy" : "copies"}</span>
                                ))}
                            </div>
                        </div>

                        <div className="max-h-[55vh] overflow-y-auto space-y-0.5">
                            {filteredArcanes.length === 0 && (
                                <div className="text-sm text-slate-400 py-4">No arcanes found for this category.</div>
                            )}
                            {filteredArcanes.map(e => {
                                const isSelected = selectedArcane?.path === e.path;
                                return (
                                    <div key={e.path}>
                                        <button
                                            className={[
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                                                isSelected
                                                    ? "bg-slate-800 border-slate-600 text-slate-100"
                                                    : "bg-slate-900/30 border-slate-800/60 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                                            ].join(" ")}
                                            onClick={() => setSelectedArcane(isSelected ? null : e)}
                                        >
                                            <span className="flex-1 font-medium truncate">{e.name}</span>
                                        </button>
                                        {isSelected && (
                                            <ArcaneDetail entry={e} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
}
