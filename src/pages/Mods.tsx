// src/pages/Mods.tsx
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import MODS_RAW from "../data/mods.json";
import RIVENS_RAW from "../data/rivens.json";
import MODDESC_RAW from "../data/moddescriptions.json";
import ALL_RAW from "../data/All.json";
import MOD_LOCATIONS_RAW from "../../external/warframe-drop-data/raw/modLocations.json";

// Build a lookup from All.json keyed by uniqueName — gives us levelStats, isExilus, rarity, fusionLimit
interface AllModEntry {
    uniqueName: string;
    name: string;
    category?: string;
    compatName?: string;
    type?: string;
    rarity?: string;
    baseDrain?: number;
    fusionLimit?: number;
    isExilus?: boolean;
    isAugment?: boolean;
    levelStats?: { stats: string[] }[];
}
const ALL_MODS_BY_PATH: Record<string, AllModEntry> = {};
for (const item of ALL_RAW as AllModEntry[]) {
    if (item.uniqueName && item.category === "Mods") {
        // Prefer entries with levelStats when there are duplicates
        const existing = ALL_MODS_BY_PATH[item.uniqueName];
        if (!existing || (item.levelStats && !existing.levelStats)) {
            ALL_MODS_BY_PATH[item.uniqueName] = item as AllModEntry;
        }
    }
}

const MODDESC: Record<string, { LocTag?: string; Ranks?: Record<string, string>[] }> =
    MODDESC_RAW as Record<string, { LocTag?: string; Ranks?: Record<string, string>[] }>;



// ─── Types ────────────────────────────────────────────────────────────────────

interface LocKeyWordScript {
    [key: string]: number[] | string | unknown;
}

interface ModUpgrade {
    UpgradeType?: string;
    Value?: number;
    DisplayAsPercent?: number;
    OperationType?: string;
    LocTag?: string;
    LocKeyWordScript?: LocKeyWordScript;
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
    | "all"
    | "warframe" | "aura" | "augment"
    | "primary" | "secondary" | "melee"
    | "exilus" | "vehicles" | "archgun" | "archmelee"
    | "robotic" | "beast" | "railjack"
    | "antique" | "parazon" | "tome" | "rivens";

type ArcaneCategory =
    | "all"
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
    { key: "all",       label: "All"        },
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
    { key: "all",       label: "All"                 },
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

// Polarity SVG assets
const _polImgs = import.meta.glob<string>(
    "../../assets/polarity/*.svg",
    { eager: true, import: "default" }
);
const POL_IMG: Record<string, string> = {};
for (const [p, url] of Object.entries(_polImgs)) {
    const name = p.split("/").pop()!.replace(".svg", "").toLowerCase();
    POL_IMG[name] = url;
}
// Helper: get polarity image URL by AP_ key
function polImg(ap: string | undefined): string | null {
    if (!ap) return null;
    const key = ap.replace("AP_", "").toLowerCase();
    // Map AP names to file names
    const fileMap: Record<string, string> = {
        attack:  "madurai_pol",
        defense: "vazarin_pol",
        tactic:  "naramon_pol",
        power:   "zenurik_pol",
        umbra:   "umbra_pol",
        ward:    "unairu_pol",
        penjaga: "penjaga_pol",
        any:     "any_pol",
    };
    const fname = fileMap[key];
    if (!fname) return null;
    return POL_IMG[fname] ?? null;
}

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

// Endo + credit base costs (EBC/CrBC) by rarity — verified from Warframe wiki
// Endo:   Common=10, Uncommon/Peculiar=20, Rare/Amalgam/Riven=30, Legendary=40
// Credit: Common=483, Uncommon/Peculiar=966, Rare/Amalgam/Riven=1449, Legendary=1932
const ENDO_BASE: Record<string, number> = {
    COMMON: 10, UNCOMMON: 20, PECULIAR: 20, RARE: 30, AMALGAM: 30, LEGENDARY: 40
};
const CREDIT_BASE: Record<string, number> = {
    COMMON: 483, UNCOMMON: 966, PECULIAR: 966, RARE: 1449, AMALGAM: 1449, LEGENDARY: 1932
};

/** Calculate total endo cost from fromRank (exclusive) to toRank (inclusive).
 *  Formula: sum of EBC × 2^r for r from fromRank to toRank-1
 *  Which equals: EBC × 2^fromRank × (2^(toRank-fromRank) - 1)
 */
function calcEndoCost(rarity: string | undefined, fromRank: number, toRank: number): number {
    const ebc = ENDO_BASE[rarity?.toUpperCase() ?? "COMMON"] ?? 10;
    if (toRank <= fromRank) return 0;
    // Sum EBC × 2^r for r = fromRank..toRank-1
    let total = 0;
    for (let r = fromRank; r < toRank; r++) {
        total += ebc * Math.pow(2, r);
    }
    return total;
}

/** Calculate total credit cost from fromRank (exclusive) to toRank (inclusive).
 *  Same formula structure as endo but using CrBC.
 */
function calcCreditCost(rarity: string | undefined, fromRank: number, toRank: number): number {
    const crbc = CREDIT_BASE[rarity?.toUpperCase() ?? "COMMON"] ?? 483;
    if (toRank <= fromRank) return 0;
    let total = 0;
    for (let r = fromRank; r < toRank; r++) {
        total += crbc * Math.pow(2, r);
    }
    return total;
}

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

function formatValue(v: number, displayAsPercent: number | undefined): string {
    if (displayAsPercent) {
        const pct = Math.round(v * 100 * 10) / 10;
        return (v >= 0 ? "+" : "") + pct + "%";
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

function rarityBg(rarity: string | undefined): string {
    switch (rarity) {
        case "COMMON":    return "bg-slate-800/60 border-slate-700";
        case "UNCOMMON":  return "bg-amber-950/30 border-amber-800/50";
        case "RARE":      return "bg-orange-950/30 border-orange-800/50";
        case "LEGENDARY": return "bg-cyan-950/30 border-cyan-800/50";
        default:          return "bg-slate-800/60 border-slate-700";
    }
}

function normalize(s: string): string {
    return s.toLowerCase();
}

// ─── Classification ────────────────────────────────────────────────────────────

// Set of compatName values that indicate a specific warframe augment
// (frame name as compatName, e.g. "Volt", "Excalibur", "Khora")
const KNOWN_GENERIC_COMPAT = new Set([
    "WARFRAME","ANY","COMPANION","ROBOTIC","BEAST","AURA","PRIMARY","Melee","Pistol",
    "Shotgun","Rifle","Assault Rifle","Sniper","Bow","K-Drive","Archwing","Necramech",
    "Archgun","Archmelee","Moa","Hound","Kavat","Kubrow","Sentinel","Parazon",
    "Tome","Claws","Daggers","Dual Daggers","Thrown Melee","",
]);

/**
 * Returns all categories a mod belongs to.
 * PRIMARY CLASSIFIER: All.json `type` field — it's authoritative.
 * FALLBACK: mods.json ItemCompatibility for mods not in All.json.
 *
 * IMPORTANT: Do NOT use isAugment from All.json — it marks items that *accept* mods,
 * not mods that are augments. Use type/compatName instead.
 */
function classifyModCategories(entry: ModEntry): ModCategory[] {
    const path     = entry.path ?? "";
    const compat   = entry.data?.ItemCompatibility ?? "";
    const polarity = entry.data?.ArtifactPolarity ?? "";

    const allEntry    = ALL_MODS_BY_PATH[path];
    const modType     = allEntry?.type ?? "";
    const compatName  = allEntry?.compatName ?? "";

    // ── All.json type field (authoritative) ──────────────────────────────────
    switch (modType) {
        case "Warframe Mod":
            // Within warframe mods, check for sub-types:
            if (compatName === "AURA") return ["aura", "warframe"];
            if (allEntry?.isExilus) return ["exilus"];
            // Specific warframe name = augment
            if (compatName && !KNOWN_GENERIC_COMPAT.has(compatName)) return ["augment"];
            return ["warframe"];

        case "Primary Mod":
        case "Shotgun Mod":
            return ["primary"];

        case "Secondary Mod":
            return ["secondary"];

        case "Melee Mod":
            return ["melee"];

        case "Stance Mod":
            // Arch-melee stances
            if (compatName.toLowerCase().includes("arch")) return ["archmelee"];
            return ["melee"];

        case "Companion Mod": {
            const cn = compatName.toUpperCase();
            if (cn === "ROBOTIC" || cn === "SENTINEL") return ["robotic"];
            if (cn === "BEAST") return ["beast"];
            // MOA / Hound
            if (compatName === "Moa" || compatName === "Hound") return ["robotic"];
            if (compatName === "Kavat" || compatName === "Kubrow") return ["beast"];
            return ["robotic"]; // fallback companion
        }

        case "Plexus Mod":
        case "Railjack Mod":
            return ["railjack"];

        case "Arch-Gun Mod":
            return ["archgun"];

        case "Arch-Melee Mod":
            return ["archmelee"];

        case "Necramech Mod":
        case "K-Drive Mod":
        case "Archwing Mod":
            return ["vehicles"];

        case "Parazon Mod":
            return ["parazon"];

        case "Tektolyst Artifact Mod":
            return ["antique"];

        case "Tome Mod":
            return ["tome"];
    }

    // ── Fallback: mods.json ItemCompatibility (for mods missing from All.json) ──

    if (compat.includes("Grimoire") || path.includes("Invocation")) return ["tome"];
    if (compat.includes("TnHackingDevice") || compat.includes("HackingDevice")) return ["parazon"];
    if (compat.includes("Antique")) return ["antique"];
    if (path.includes("/Mods/Aura/") || polarity === "AP_WARD") return ["aura", "warframe"];
    if (path.includes("OrokinChallenge")) return ["exilus"];
    if (compat.includes("ArchGun")) return ["archgun"];
    if (compat.includes("ArchMeleeWeapon") || compat.includes("ArchMelee")) return ["archmelee"];
    if (compat.includes("BaseMechSuit") || compat.includes("HoverboardSuit") || compat.includes("FlightJetPack")) return ["vehicles"];
    if (compat.includes("SentinelPowerSuit") || compat.includes("ZanukaPet") || compat.includes("MoaPet")) return ["robotic"];
    if (compat.includes("CatbrowPet") || compat.includes("BeastPet") || compat.includes("KubrowPet")) return ["beast"];
    if (compat.includes("Railjack") || compat.includes("CrewShip")) return ["railjack"];
    if (compat.includes("PlayerMeleeWeapon")) return ["melee"];
    if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo")) return ["secondary"];
    if (compat.includes("LotusRifle") || compat.includes("LotusShotgun") || compat.includes("LotusBow") || compat.includes("LotusLongGun")) return ["primary"];
    if (compat.includes("/Lotus/Powersuits/") && !compat.includes("PlayerPowerSuit")) return ["augment"];

    return ["warframe"];
}

function classifyArcaneCategory(entry: ModEntry): ArcaneCategory | null {
    const compat = entry.data?.ItemCompatibility ?? "";

    if (compat.includes("PlayerPowerSuit"))     return "warframe";
    if (compat.includes("OperatorSuit"))        return "operator";
    if (compat.includes("OperatorAmplifier") || compat.includes("OperatorAmpWeapon")) return "amps";
    if (compat.includes("LotusAntiqueWeapon") || compat.includes("Antiques/Lotus"))   return "tektolyst";
    if (compat.includes("LotusModularWeapon") || compat.includes("Ostron/Melee"))     return "zaws";
    if (compat.includes("LotusBulletWeapon"))   return "kitguns";
    if (compat.includes("LotusLongGun") || compat.includes("LotusShotgun") || compat.includes("LotusLongBow") || compat.includes("LotusBow")) return "primary";
    if (compat.includes("LotusPistol") || compat.includes("LotusAkimbo")) return "secondary";
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
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-slate-100"
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

// ─── Rank Cost Calculator ─────────────────────────────────────────────────────

function RankCostCalculator({ maxRank, rarity }: { maxRank: number; rarity: string | undefined }) {
    const [fromRank, setFromRank] = useState(0);
    const [toRank, setToRank] = useState(maxRank);

    if (maxRank === 0) return null;

    const endoCost   = calcEndoCost(rarity, fromRank, toRank);
    const creditCost = calcCreditCost(rarity, fromRank, toRank);

    const rankOptions = Array.from({ length: maxRank + 1 }, (_, i) => i);

    return (
        <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-3 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Upgrade Cost Calculator</div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-400">
                    From rank
                    <select
                        value={fromRank}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setFromRank(v);
                            if (toRank <= v) setToRank(Math.min(v + 1, maxRank));
                        }}
                        className="rounded bg-slate-800 border border-slate-600 px-1.5 py-0.5 text-slate-100"
                    >
                        {rankOptions.slice(0, maxRank).map(r => (
                            <option key={r} value={r}>R{r}</option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-1.5 text-slate-400">
                    to rank
                    <select
                        value={toRank}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setToRank(v);
                            if (fromRank >= v) setFromRank(Math.max(0, v - 1));
                        }}
                        className="rounded bg-slate-800 border border-slate-600 px-1.5 py-0.5 text-slate-100"
                    >
                        {rankOptions.slice(1).map(r => (
                            <option key={r} value={r}>R{r}</option>
                        ))}
                    </select>
                </label>
            </div>
            {fromRank < toRank ? (
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">Endo</span>
                        <span className="font-mono font-semibold text-amber-300">{endoCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">Credits</span>
                        <span className="font-mono font-semibold text-yellow-400">{creditCost.toLocaleString()}</span>
                    </div>
                </div>
            ) : (
                <div className="text-xs text-slate-500">Select a target rank higher than starting rank.</div>
            )}
        </div>
    );
}

// ─── Drop Locations ───────────────────────────────────────────────────────────

function DropLocations({ drops }: { drops: EnemyDrop[] }) {
    if (drops.length === 0) {
        return <div className="text-xs text-slate-500">No drop location data available.</div>;
    }

    // Sort by chance descending
    const sorted = [...drops].sort((a, b) => b.chance - a.chance);

    return (
        <div>
            <div className="text-xs text-slate-400 font-medium mb-2">Drop Locations <span className="text-slate-500 font-normal">({drops.length} sources)</span></div>
            <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                {sorted.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 bg-slate-800/50 border border-slate-700/60">
                        <span className="text-slate-200 flex-1 min-w-0 truncate">{d.enemyName}</span>
                        <span className={["shrink-0 text-xs font-medium", rarityColor(d.rarity)].join(" ")}>{d.rarity}</span>
                        <span className="shrink-0 font-mono text-slate-400 text-[11px]">{d.chance.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Mod Detail Panel ─────────────────────────────────────────────────────────

function ModDetail({ entry, isRiven = false }: { entry: ModEntry; isRiven?: boolean }) {
    const data = entry.data;
    const allEntry = ALL_MODS_BY_PATH[entry.path];

    // Use All.json fusionLimit (integer) when available — it's accurate
    const maxRank = isRiven
        ? (data?.FusionLimitRange?.[1] ?? 8)
        : (allEntry?.fusionLimit ?? decodeMaxRank(data?.FusionLimit));

    const baseDrain = allEntry?.baseDrain ?? decodeBaseDrain(data?.BaseDrain);
    const upgrades = data?.Upgrades ?? [];
    const polarity = data?.ArtifactPolarity;
    // All.json rarity is "Common"/"Uncommon"/"Rare"/"Legendary"; mods.json uses "COMMON" etc.
    const rarityRaw = allEntry?.rarity ?? data?.Rarity ?? "COMMON";
    const rarity = rarityRaw.toUpperCase();
    const drops = modLocationLookup.get(normalize(entry.name)) ?? [];

    // levelStats from All.json gives per-rank human-readable descriptions
    const levelStats = allEntry?.levelStats ?? [];

    return (
        <div className={["mt-2 rounded-xl border p-4 space-y-4", rarityBg(rarity)].join(" ")}>
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base font-bold text-slate-100">{entry.name}</span>
                <span className={["text-xs font-semibold px-2 py-0.5 rounded-full border", rarityColor(rarity), rarityBg(rarity)].join(" ")}>
                    {rarityRaw.charAt(0).toUpperCase() + rarityRaw.slice(1).toLowerCase()}
                </span>
                {polarity && (() => {
                    const img = polImg(polarity);
                    return img ? (
                        <span className="rounded-full p-1 border border-slate-600 bg-slate-800 flex items-center justify-center w-6 h-6" title={polarityLabel(polarity)}>
                            <img src={img} alt={polarityLabel(polarity)} className="w-4 h-4 object-contain" />
                        </span>
                    ) : (
                        <span className="text-xs rounded-full px-2 py-0.5 border border-slate-600 bg-slate-800 text-slate-300">
                            {polarityLabel(polarity)}
                        </span>
                    );
                })()}
                {maxRank > 0 && (
                    <span className="text-xs text-slate-400 ml-auto">Max Rank {maxRank}</span>
                )}
            </div>

            {/* Per-rank descriptions from All.json levelStats */}
            {levelStats.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Effects per Rank</div>
                    <div className="space-y-1">
                        {levelStats.map((ls, r) => (
                            <div key={r} className={[
                                "flex items-start gap-2 rounded px-2 py-1.5 text-xs",
                                r === levelStats.length - 1 ? "bg-cyan-950/30 border border-cyan-800/40" : "bg-slate-800/50"
                            ].join(" ")}>
                                <span className="shrink-0 text-slate-500 font-mono w-5">R{r}</span>
                                <span className="text-slate-200">{ls.stats.join("  ·  ")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slot cost per rank */}
            {baseDrain > 0 && maxRank > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Mod Capacity Cost per Rank</div>
                    <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: maxRank + 1 }, (_, r) => (
                            <div key={r} className="text-center">
                                <div className="text-[10px] text-slate-500 mb-0.5">R{r}</div>
                                <div className="w-8 text-center rounded bg-slate-800 border border-slate-600 py-1 text-xs text-slate-200 font-mono">
                                    {baseDrain + r}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upgrade Cost Calculator */}
            {!isRiven && <RankCostCalculator maxRank={maxRank} rarity={rarity} />}

            {/* Raw upgrade effects (fallback when no levelStats) */}
            {levelStats.length === 0 && upgrades.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Effects</div>
                    <div className="space-y-1.5">
                        {upgrades.slice(0, 4).map((u, i) => {
                            if (!u.UpgradeType || u.Value === undefined) return null;
                            const label = labelForUpgradeType(u.UpgradeType);
                            const perRank = u.Value;
                            const maxVal = perRank * (maxRank > 0 ? (maxRank + 1) : 1);
                            return (
                                <div key={i} className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs text-slate-300">{label}</span>
                                        <span className="text-xs font-mono text-slate-200">
                                            {formatValue(perRank, u.DisplayAsPercent)}&nbsp;/&nbsp;rank
                                            &nbsp;→&nbsp;
                                            <span className="text-cyan-300 font-semibold">
                                                {formatValue(maxVal, u.DisplayAsPercent)}&nbsp;at&nbsp;R{maxRank}
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
            <DropLocations drops={drops} />
        </div>
    );
}

// ─── Arcane Detail Panel ──────────────────────────────────────────────────────

/** Humanize ALL_CAPS variable names from moddescriptions into readable labels.
 *  e.g. AMMO_EFFICIENCY → "Ammo Efficiency", CRIT_CHANCE → "Crit Chance" */
function humanizeVarName(key: string): string {
    return key
        .split("_")
        .map(w => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
}

/** Extract per-rank values for script-driven arcanes (UpgradeType === "NONE").
 *  Falls back to LocKeyWordScript level arrays. */
function extractScriptLevels(u: ModUpgrade): number[] | null {
    const script = u.LocKeyWordScript;
    if (!script) return null;
    for (const [k, v] of Object.entries(script)) {
        if (k.startsWith("_") && k.endsWith("Levels") && Array.isArray(v) && v.length > 0) {
            return v as number[];
        }
    }
    return null;
}

function ArcaneDetail({ entry }: { entry: ModEntry }) {
    const data = entry.data;
    const maxRank = decodeMaxRank(data?.FusionLimit);
    const upgrades = (data?.Upgrades ?? []).concat((data as any)?.ExtraUpgrades ?? []);
    const drops = modLocationLookup.get(normalize(entry.name)) ?? [];

    // Try moddescriptions.json first — it has clean per-rank values for most arcanes
    const modDesc = MODDESC[entry.path];
    const descRanks = modDesc?.Ranks;

    type EffectRow = { label: string; values: string[]; suffix?: string };
    const effectRows: EffectRow[] = [];

    if (descRanks && descRanks.length > 0) {
        // Group by variable name across ranks
        const varNames = Object.keys(descRanks[0]);
        for (const varName of varNames) {
            const vals = descRanks.map(r => r[varName] ?? "");
            if (vals.every(v => v === "")) continue;
            effectRows.push({
                label: humanizeVarName(varName),
                values: vals,
            });
        }
    } else {
        // Fall back to Upgrades array
        for (const u of upgrades.slice(0, 4)) {
            const type = u.UpgradeType;
            const isNoneType = !type || type === "NONE";

            if (isNoneType) {
                const levels = extractScriptLevels(u);
                if (levels && levels.length > 0) {
                    const isPercent = u.DisplayAsPercent;
                    const fmt = (v: number) => isPercent ? `${Math.round(v * 100 * 10) / 10}%` : String(Math.round(v * 100) / 100);
                    effectRows.push({ label: "Effect", values: levels.map(fmt) });
                }
            } else {
                const val = u.Value;
                if (val === undefined || val === null) continue;
                const label = labelForUpgradeType(type);
                const isPercent = u.DisplayAsPercent;
                const fmt = (v: number) => isPercent
                    ? `${v >= 0 ? "+" : ""}${Math.round(v * 100 * 10) / 10}%`
                    : `${v >= 0 ? "+" : ""}${Math.round(v * 100) / 100}`;
                effectRows.push({
                    label,
                    values: Array.from({ length: maxRank + 1 }, (_, r) => fmt(val * (r + 1))),
                });
            }
        }
    }

    return (
        <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base font-bold text-slate-100">{entry.name}</span>
                <span className="text-xs text-slate-400">Max Rank: {maxRank}</span>
            </div>

            {/* Effects with per-rank breakdown */}
            {effectRows.length > 0 ? (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">Effects</div>
                    <div className="space-y-2">
                        {effectRows.map((row, i) => (
                            <div key={i} className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2">
                                <div className="text-xs text-slate-300 font-medium mb-1.5">{row.label}</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {row.values.map((v, r) => (
                                        <div key={r} className="text-center">
                                            <div className="text-[9px] text-slate-600 mb-0.5">R{r}</div>
                                            <div className={[
                                                "rounded px-1.5 py-0.5 text-[11px] font-mono border",
                                                r === row.values.length - 1
                                                    ? "bg-cyan-950/40 border-cyan-800/60 text-cyan-300"
                                                    : "bg-slate-900 border-slate-700 text-slate-300"
                                            ].join(" ")}>
                                                {v}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-slate-500 italic">No effect data available.</div>
            )}

            {/* Drop locations */}
            <DropLocations drops={drops} />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Mods() {
    const [section, setSection] = useState<ModSection>("mods");

    // Mods state
    const [modCategory, setModCategory] = useState<ModCategory>("all");
    const [modPolarity, setModPolarity] = useState<Polarity | null>(null);
    const [antiqueSchool, setAntiqueSchool] = useState<AntiqueSchool>("all");
    const [parazonFilter, setParazonFilter] = useState<ParazonFilter>("all");
    const [modSearch, setModSearch] = useState("");
    const [selectedMod, setSelectedMod] = useState<ModEntry | null>(null);

    // Arcanes state
    const [arcaneCategory, setArcaneCategory] = useState<ArcaneCategory>("all");
    const [arcaneSearch, setArcaneSearch] = useState("");
    const [selectedArcane, setSelectedArcane] = useState<ModEntry | null>(null);

    // ── Mods list ──────────────────────────────────────────────────────────────

    const filteredMods = useMemo<ModEntry[]>(() => {
        const q = normalize(modSearch.trim());

        // Rivens are from a separate source
        if (modCategory === "rivens") {
            return RIVEN_ENTRIES.filter(e => !q || normalize(e.name).includes(q));
        }

        let list: ModEntry[];
        if (modCategory === "all") {
            list = [...MOD_ENTRIES, ...RIVEN_ENTRIES];
        } else {
            list = MOD_ENTRIES.filter(e => {
                const cats = classifyModCategories(e);
                return cats.includes(modCategory);
            });
        }

        // Polarity sub-filter (skip for "all", "antique", "parazon", "rivens")
        if (modPolarity !== null && modCategory !== "all" && modCategory !== "antique" && modCategory !== "parazon") {
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

        let list: ModEntry[];
        if (arcaneCategory === "all") {
            list = [...ARCANE_ENTRIES];
        } else {
            list = ARCANE_ENTRIES.filter(e => {
                const cat = classifyArcaneCategory(e);
                return cat === arcaneCategory;
            });
        }

        if (q) list = list.filter(e => normalize(e.name).includes(q));

        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [arcaneCategory, arcaneSearch]);

    // ── Render ─────────────────────────────────────────────────────────────────

    const showPolarityFilter = modCategory !== "all" && modCategory !== "rivens" && modCategory !== "antique" && modCategory !== "parazon";

    return (
        <div className="space-y-6">
            <Section title="Mods & Arcanes">
                <div className="text-sm text-slate-400 mb-4">
                    Browse mods and arcanes by category. Click any entry for details including upgrade costs, effects, and drop locations.
                </div>

                {/* Primary tabs */}
                <div className="flex items-center gap-1 border-b border-slate-800 mb-5">
                    {(["mods", "arcanes"] as const).map(s => (
                        <button
                            key={s}
                            className={[
                                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                                section === s
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
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
                        <div className="mb-4">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</div>
                            <div className="flex flex-wrap gap-1.5">
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

                        {/* Polarity sub-filter */}
                        {showPolarityFilter && (
                            <div className="mb-3">
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Polarity</div>
                                <div className="flex flex-wrap gap-1.5">
                                    <SubPill
                                        label="All"
                                        active={modPolarity === null}
                                        onClick={() => setModPolarity(null)}
                                    />
                                    {POLARITIES.map(p => {
                                        const img = polImg(p.ap);
                                        return (
                                            <button
                                                key={p.key}
                                                title={p.label}
                                                onClick={() => setModPolarity(modPolarity === p.key ? null : p.key)}
                                                className={[
                                                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-colors",
                                                    modPolarity === p.key
                                                        ? "bg-slate-700 text-slate-100 border-slate-500"
                                                        : "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                                                ].join(" ")}
                                            >
                                                {img
                                                    ? <img src={img} alt={p.label} className="w-4 h-4 object-contain" />
                                                    : <span>{p.label}</span>
                                                }
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Antique school sub-filter */}
                        {modCategory === "antique" && (
                            <div className="mb-3">
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">School</div>
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
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Type</div>
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
                                className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                                value={modSearch}
                                onChange={e => { setModSearch(e.target.value); setSelectedMod(null); }}
                                placeholder="Search mods…"
                            />
                        </div>

                        {/* Mod list */}
                        <div className="text-xs text-slate-500 mb-2">{filteredMods.length} mods</div>
                        <div className="max-h-[55vh] overflow-y-auto space-y-0.5 pr-1">
                            {filteredMods.length === 0 && (
                                <div className="text-sm text-slate-400 py-4">No mods found.</div>
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
                                                    ? "bg-slate-700 border-slate-500 text-slate-100"
                                                    : "bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700"
                                            ].join(" ")}
                                            onClick={() => setSelectedMod(isSelected ? null : e)}
                                        >
                                            <span className="flex-1 font-medium truncate">{e.name}</span>
                                            {polarity && (() => {
                                                const img = polImg(polarity);
                                                return img ? (
                                                    <img src={img} alt={polarityLabel(polarity)} title={polarityLabel(polarity)} className="shrink-0 w-4 h-4 object-contain opacity-60" />
                                                ) : (
                                                    <span className="shrink-0 text-[11px] text-slate-500">{polarityLabel(polarity)}</span>
                                                );
                                            })()}
                                            {rarity && (
                                                <span className={["shrink-0 text-[11px] font-medium", rarityColor(rarity)].join(" ")}>{rarity}</span>
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
                        <div className="mb-4">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</div>
                            <div className="flex flex-wrap gap-1.5">
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
                                className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                                value={arcaneSearch}
                                onChange={e => { setArcaneSearch(e.target.value); setSelectedArcane(null); }}
                                placeholder="Search arcanes…"
                            />
                        </div>

                        {/* Rank guide */}
                        <div className="mb-4 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-400 mb-2">Copies needed to reach rank:</div>
                            <div className="flex flex-wrap gap-4 text-xs">
                                {Object.entries(ARCANE_TOTAL_PER_RANK).map(([r, n]) => (
                                    <span key={r} className="text-slate-400">
                                        <span className="font-semibold text-slate-200">R{r}</span>: {n} {n === 1 ? "copy" : "copies"}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Arcane list */}
                        <div className="text-xs text-slate-500 mb-2">{filteredArcanes.length} arcanes</div>
                        <div className="max-h-[55vh] overflow-y-auto space-y-0.5 pr-1">
                            {filteredArcanes.length === 0 && (
                                <div className="text-sm text-slate-400 py-4">No arcanes found.</div>
                            )}
                            {filteredArcanes.map(e => {
                                const isSelected = selectedArcane?.path === e.path;
                                return (
                                    <div key={e.path}>
                                        <button
                                            className={[
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                                                isSelected
                                                    ? "bg-slate-700 border-slate-500 text-slate-100"
                                                    : "bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 hover:border-slate-700"
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