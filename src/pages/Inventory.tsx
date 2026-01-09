// src/pages/Inventory.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FULL_CATALOG, type CatalogId } from "../domain/catalog/loadFullCatalog";
import { useTrackerStore } from "../store/store";

type PrimaryTab =
    | "all"
    | "warframesVehicles"
    | "companions"
    | "components"
    | "resources"
    | "weapons";

type WarframesVehiclesTab = "all" | "warframes" | "archwings" | "necramechs";
type CompanionsTab = "all" | "hound" | "kavat" | "kubrow" | "moa" | "sentinel";
type WeaponClassTab = "primary" | "secondary" | "melee";

function normalize(s: string): string {
    return s.trim().toLowerCase();
}

function titleCase(s: string): string {
    if (!s) return s;
    return s
        .split(/[\s_-]+/g)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function safeInt(v: unknown, fallback = 0): number {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">{props.title}</div>
            <div className="mt-3">{props.children}</div>
        </div>
    );
}

function TabButton(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "px-3 py-2 text-sm border-b-2",
                props.active
                    ? "border-slate-100 text-slate-100"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

function SubTabButton(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "rounded-lg px-3 py-1.5 text-sm border",
                props.active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

function PillButton(props: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            className={[
                "rounded-full px-3 py-1 text-sm border",
                props.active
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-900"
            ].join(" ")}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

type CategoryMeta = {
    main: string;
    sub: string | null;
};

function splitCategory(raw: string): CategoryMeta {
    const norm = normalize(raw ?? "");
    if (!norm) {
        return { main: "", sub: null };
    }

    const parts = norm.split("-");
    const main = parts[0] ?? "";
    const sub = parts.length > 1 ? parts.slice(1).join("-") : null;
    return { main, sub };
}

type Classification = {
    groups: Set<PrimaryTab>;

    warframesVehiclesSub: Set<Exclude<WarframesVehiclesTab, "all">>;
    companionsSub: Set<Exclude<CompanionsTab, "all">>;

    weaponClasses: Set<WeaponClassTab>;
    weaponTypesByClass: Record<WeaponClassTab, Set<string>>;

    isResource: boolean;
    isComponent: boolean;
};

function emptyClassification(): Classification {
    return {
        groups: new Set<PrimaryTab>(),
        warframesVehiclesSub: new Set(),
        companionsSub: new Set(),
        weaponClasses: new Set(),
        weaponTypesByClass: {
            primary: new Set(),
            secondary: new Set(),
            melee: new Set()
        },
        isResource: false,
        isComponent: false
    };
}

const WEAPON_TYPE_BLOCKLIST = new Set<string>([
    "weapon",
    "weapons",
    "gun",
    "guns",
    "melee",
    "primary",
    "secondary",
    "archgun",
    "archguns",
    "tome",
    "tomes",
    "speargun",
    "spearguns",
    "kitgun",
    "kitguns"
]);

function classifyFromCategories(categories: string[]): Classification {
    const cls = emptyClassification();

    const metas = categories
        .map(splitCategory)
        .filter((m) => m.main.length > 0);

    const mains = new Set<string>(metas.map((m) => m.main));

    // Warframes & Vehicles
    for (const m of metas) {
        if (m.main === "warframe" || m.main === "warframes") {
            cls.groups.add("warframesVehicles");
            cls.warframesVehiclesSub.add("warframes");
        }
        if (m.main === "archwing" || m.main === "archwings") {
            cls.groups.add("warframesVehicles");
            cls.warframesVehiclesSub.add("archwings");
        }
        if (m.main === "necramech" || m.main === "necramechs" || m.main === "mech" || m.main === "mechs") {
            cls.groups.add("warframesVehicles");
            cls.warframesVehiclesSub.add("necramechs");
        }
    }

    // Companions
    for (const m of metas) {
        if (m.main === "pet" && m.sub) {
            const first = normalize(m.sub).split("-")[0];
            if (first === "kavat") {
                cls.groups.add("companions");
                cls.companionsSub.add("kavat");
            } else if (first === "kubrow") {
                cls.groups.add("companions");
                cls.companionsSub.add("kubrow");
            } else if (first === "moa") {
                cls.groups.add("companions");
                cls.companionsSub.add("moa");
            } else if (first === "hound") {
                cls.groups.add("companions");
                cls.companionsSub.add("hound");
            } else if (first === "sentinel") {
                cls.groups.add("companions");
                cls.companionsSub.add("sentinel");
            }
        }

        if (m.main === "sentinel" || m.main === "sentinels") {
            cls.groups.add("companions");
            cls.companionsSub.add("sentinel");
        }

        if (m.main === "kavat" || m.main === "kubrow" || m.main === "moa" || m.main === "hound") {
            cls.groups.add("companions");
            cls.companionsSub.add(m.main as Exclude<CompanionsTab, "all">);
        }
    }

    // Resources / Components (conservative)
    for (const m of metas) {
        const main = m.main;

        if (main === "resource" || main === "resources" || main === "material" || main === "materials") {
            cls.groups.add("resources");
            cls.isResource = true;
        }

        if (
            main === "component" ||
            main === "components" ||
            main === "part" ||
            main === "parts" ||
            main === "blueprint" ||
            main === "blueprints"
        ) {
            cls.groups.add("components");
            cls.isComponent = true;
        }
    }

    // Weapons: class from plain category presence
    if (mains.has("primary")) cls.weaponClasses.add("primary");
    if (mains.has("secondary")) cls.weaponClasses.add("secondary");
    if (mains.has("melee")) cls.weaponClasses.add("melee");

    if (cls.weaponClasses.size > 0) {
        cls.groups.add("weapons");
    }

    // Explicit structured weapon subtypes: `primary-*`, `secondary-*`, `melee-*`
    for (const m of metas) {
        if (m.main === "primary" || m.main === "secondary" || m.main === "melee") {
            const wc = m.main as WeaponClassTab;
            if (m.sub) {
                cls.weaponTypesByClass[wc].add(normalize(m.sub));
            }
        }
    }

    // Add "type-like" categories based on other categories
    const otherTypeCandidates = new Set<string>();

    for (const m of metas) {
        if (m.main === "primary" || m.main === "secondary" || m.main === "melee") continue;
        if (m.main === "pet") continue;

        const main = m.main;
        if (!main || WEAPON_TYPE_BLOCKLIST.has(main)) continue;

        if (
            main === "warframe" ||
            main === "warframes" ||
            main === "archwing" ||
            main === "archwings" ||
            main === "necramech" ||
            main === "necramechs" ||
            main === "mech" ||
            main === "mechs" ||
            main === "resource" ||
            main === "resources" ||
            main === "material" ||
            main === "materials" ||
            main === "component" ||
            main === "components" ||
            main === "part" ||
            main === "parts" ||
            main === "blueprint" ||
            main === "blueprints" ||
            main === "kavat" ||
            main === "kubrow" ||
            main === "moa" ||
            main === "hound" ||
            main === "sentinel" ||
            main === "sentinels"
        ) {
            continue;
        }

        otherTypeCandidates.add(main);
    }

    for (const wc of cls.weaponClasses) {
        for (const t of otherTypeCandidates) {
            cls.weaponTypesByClass[wc].add(t);
        }
    }

    // Explicit coercions
    if (mains.has("archgun") || mains.has("archguns")) {
        cls.groups.add("weapons");
        cls.weaponClasses.add("primary");
        cls.weaponTypesByClass.primary.add("archgun");
    }

    if (mains.has("speargun") || mains.has("spearguns")) {
        cls.groups.add("weapons");
        cls.weaponClasses.add("primary");
        cls.weaponTypesByClass.primary.add("speargun");
    }

    if (mains.has("tome") || mains.has("tomes")) {
        cls.groups.add("weapons");
        cls.weaponClasses.add("secondary");
        cls.weaponTypesByClass.secondary.add("tome");
    }

    if (mains.has("kitgun") || mains.has("kitguns")) {
        cls.groups.add("weapons");
        cls.weaponClasses.add("secondary");
        cls.weaponTypesByClass.secondary.add("kitgun");
    }

    return cls;
}

type Row = {
    id: CatalogId;
    label: string;
    value: number;
    categories: string[];
    cls: Classification;
};

type VirtualWindow = {
    start: number;
    end: number;
    viewportH: number;
    scrollTop: number;
};

export default function Inventory() {
    const counts = useTrackerStore((s) => s.state.inventory.counts) ?? {};
    const setCount = useTrackerStore((s) => s.setCount);

    const goals = useTrackerStore((s) => s.state.goals ?? []);
    const addGoalItem = useTrackerStore((s) => s.addGoalItem);
    const removeGoal = useTrackerStore((s) => s.removeGoal);
    const setGoalQty = useTrackerStore((s) => s.setGoalQty);

    const goalByCatalogId = useMemo(() => {
        const map = new Map<string, any>();
        for (const g of goals ?? []) {
            if (!g) continue;
            if (g.type !== "item") continue;
            if (g.isActive === false) continue;
            map.set(String(g.catalogId), g);
        }
        return map;
    }, [goals]);

    const [query, setQuery] = useState("");
    const [hideZero, setHideZero] = useState(false);

    const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("all");

    const [wfVehTab, setWfVehTab] = useState<WarframesVehiclesTab>("all");
    const [companionsTab, setCompanionsTab] = useState<CompanionsTab>("all");

    const [weaponClassTab, setWeaponClassTab] = useState<WeaponClassTab>("primary");
    const [weaponTypeFilters, setWeaponTypeFilters] = useState<string[]>([]);

    function selectPrimaryTab(next: PrimaryTab) {
        setPrimaryTab(next);

        setWfVehTab("all");
        setCompanionsTab("all");

        setWeaponTypeFilters([]);
    }

    function selectWeaponClass(next: WeaponClassTab) {
        setWeaponClassTab(next);
        setWeaponTypeFilters([]);
    }

    const rows = useMemo<Row[]>(() => {
        const q = normalize(query);

        const base: Row[] = (FULL_CATALOG.displayableItemIds as CatalogId[])
            .map((id) => {
                const rec = FULL_CATALOG.recordsById[id];
                if (!rec?.displayName) return null;

                const categories = rec.categories ?? [];
                const cls = classifyFromCategories(categories);

                return {
                    id,
                    label: rec.displayName,
                    value: safeInt(counts[String(id)] ?? 0, 0),
                    categories,
                    cls
                } as Row;
            })
            .filter((r): r is Row => !!r)
            .filter((r) => {
                if (!q) return true;
                return normalize(r.label).includes(q) || normalize(String(r.id)).includes(q);
            })
            .filter((r) => {
                if (!hideZero) return true;
                return r.value > 0;
            });

        base.sort((a, b) => a.label.localeCompare(b.label));
        return base;
    }, [counts, query, hideZero]);

    const weaponTypeOptions = useMemo(() => {
        const set = new Set<string>();
        for (const r of rows) {
            for (const t of r.cls.weaponTypesByClass[weaponClassTab] ?? []) {
                if (t && t.trim()) set.add(normalize(t));
            }
        }
        const out = Array.from(set);
        out.sort((a, b) => a.localeCompare(b));
        return out;
    }, [rows, weaponClassTab]);

    const filtered = useMemo(() => {
        if (primaryTab === "all") return rows;

        if (primaryTab === "warframesVehicles") {
            return rows.filter((r) => {
                if (!r.cls.groups.has("warframesVehicles")) return false;
                if (wfVehTab === "all") return true;
                return r.cls.warframesVehiclesSub.has(wfVehTab);
            });
        }

        if (primaryTab === "companions") {
            return rows.filter((r) => {
                if (!r.cls.groups.has("companions")) return false;
                if (companionsTab === "all") return true;
                return r.cls.companionsSub.has(companionsTab);
            });
        }

        if (primaryTab === "resources") {
            return rows.filter((r) => r.cls.groups.has("resources"));
        }

        if (primaryTab === "components") {
            return rows.filter((r) => r.cls.groups.has("components"));
        }

        // Weapons
        return rows.filter((r) => {
            if (!r.cls.groups.has("weapons")) return false;
            if (!r.cls.weaponClasses.has(weaponClassTab)) return false;

            if (weaponTypeFilters.length === 0) return true;

            const allowed = new Set(weaponTypeFilters.map(normalize));
            const types = r.cls.weaponTypesByClass[weaponClassTab];
            if (!types || types.size === 0) return false;

            return Array.from(types).some((t) => allowed.has(normalize(t)));
        });
    }, [rows, primaryTab, wfVehTab, companionsTab, weaponClassTab, weaponTypeFilters]);

    // -------- Virtualization (manual, no deps) --------
    const listRef = useRef<HTMLDivElement | null>(null);

    // Fixed row height; keep consistent with the row layout below.
    const ROW_H = 56;
    const OVERSCAN = 10;

    const [vw, setVw] = useState<VirtualWindow>({
        start: 0,
        end: 0,
        viewportH: 0,
        scrollTop: 0
    });

    function recomputeWindow() {
        const el = listRef.current;
        if (!el) return;

        const viewportH = el.clientHeight;
        const scrollTop = el.scrollTop;

        const total = filtered.length;

        const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
        const visibleCount = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2;
        const end = Math.min(total, start + visibleCount);

        setVw({ start, end, viewportH, scrollTop });
    }

    useEffect(() => {
        // After filters change, reset scroll and recompute.
        const el = listRef.current;
        if (el) el.scrollTop = 0;
        // Next tick so layout is stable.
        requestAnimationFrame(() => recomputeWindow());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [primaryTab, wfVehTab, companionsTab, weaponClassTab, weaponTypeFilters, query, hideZero]);

    useEffect(() => {
        // Recompute on data length changes.
        requestAnimationFrame(() => recomputeWindow());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered.length]);

    useEffect(() => {
        const onResize = () => recomputeWindow();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // -----------------------------------------------

    const totalHeight = filtered.length * ROW_H;
    const slice = filtered.slice(vw.start, vw.end);
    const translateY = vw.start * ROW_H;

    return (
        <div className="space-y-6">
            <Section title="Inventory">
                <div className="text-sm text-slate-400">
                    Search and edit item counts here. Credits and Platinum are edited in the top-right Profile header.
                    Set Personal Goals by entering a Goal Target (0 disables).
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-slate-400">Search</span>
                            <input
                                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search items by name..."
                            />
                        </label>
                    </div>

                    <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={hideZero}
                                onChange={(e) => setHideZero(e.target.checked)}
                            />
                            Hide zero
                        </label>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-2">
                        <TabButton label="All" active={primaryTab === "all"} onClick={() => selectPrimaryTab("all")} />
                        <TabButton
                            label="Warframes & Vehicles"
                            active={primaryTab === "warframesVehicles"}
                            onClick={() => selectPrimaryTab("warframesVehicles")}
                        />
                        <TabButton
                            label="Companions"
                            active={primaryTab === "companions"}
                            onClick={() => selectPrimaryTab("companions")}
                        />
                        <TabButton
                            label="Components"
                            active={primaryTab === "components"}
                            onClick={() => selectPrimaryTab("components")}
                        />
                        <TabButton
                            label="Resources"
                            active={primaryTab === "resources"}
                            onClick={() => selectPrimaryTab("resources")}
                        />
                        <TabButton
                            label="Weapons"
                            active={primaryTab === "weapons"}
                            onClick={() => selectPrimaryTab("weapons")}
                        />
                    </div>

                    {primaryTab === "warframesVehicles" && (
                        <div className="px-3 py-3 border-b border-slate-800">
                            <div className="text-xs text-slate-400">Refine Warframes & Vehicles</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <SubTabButton label="All" active={wfVehTab === "all"} onClick={() => setWfVehTab("all")} />
                                <SubTabButton
                                    label="Warframes"
                                    active={wfVehTab === "warframes"}
                                    onClick={() => setWfVehTab("warframes")}
                                />
                                <SubTabButton
                                    label="Archwings"
                                    active={wfVehTab === "archwings"}
                                    onClick={() => setWfVehTab("archwings")}
                                />
                                <SubTabButton
                                    label="Necramechs"
                                    active={wfVehTab === "necramechs"}
                                    onClick={() => setWfVehTab("necramechs")}
                                />
                            </div>
                        </div>
                    )}

                    {primaryTab === "companions" && (
                        <div className="px-3 py-3 border-b border-slate-800">
                            <div className="text-xs text-slate-400">Refine Companions</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <SubTabButton
                                    label="All"
                                    active={companionsTab === "all"}
                                    onClick={() => setCompanionsTab("all")}
                                />
                                <SubTabButton
                                    label="Hound"
                                    active={companionsTab === "hound"}
                                    onClick={() => setCompanionsTab("hound")}
                                />
                                <SubTabButton
                                    label="Kavat"
                                    active={companionsTab === "kavat"}
                                    onClick={() => setCompanionsTab("kavat")}
                                />
                                <SubTabButton
                                    label="Kubrow"
                                    active={companionsTab === "kubrow"}
                                    onClick={() => setCompanionsTab("kubrow")}
                                />
                                <SubTabButton
                                    label="Moa"
                                    active={companionsTab === "moa"}
                                    onClick={() => setCompanionsTab("moa")}
                                />
                                <SubTabButton
                                    label="Sentinel"
                                    active={companionsTab === "sentinel"}
                                    onClick={() => setCompanionsTab("sentinel")}
                                />
                            </div>
                        </div>
                    )}

                    {primaryTab === "weapons" && (
                        <div className="px-3 py-3 border-b border-slate-800">
                            <div className="text-xs text-slate-400">Weapon Class</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <SubTabButton
                                    label="Primary"
                                    active={weaponClassTab === "primary"}
                                    onClick={() => selectWeaponClass("primary")}
                                />
                                <SubTabButton
                                    label="Secondary"
                                    active={weaponClassTab === "secondary"}
                                    onClick={() => selectWeaponClass("secondary")}
                                />
                                <SubTabButton
                                    label="Melee"
                                    active={weaponClassTab === "melee"}
                                    onClick={() => selectWeaponClass("melee")}
                                />
                            </div>

                            <div className="mt-3 text-xs text-slate-400">Type</div>
                            {weaponTypeOptions.length === 0 ? (
                                <div className="mt-2 text-sm text-slate-500">No weapon types found for this class.</div>
                            ) : (
                                <>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {weaponTypeOptions.map((t) => {
                                            const active = weaponTypeFilters.map(normalize).includes(t);
                                            return (
                                                <PillButton
                                                    key={t}
                                                    label={titleCase(t)}
                                                    active={active}
                                                    onClick={() => {
                                                        setWeaponTypeFilters((prev) => {
                                                            const normPrev = prev.map(normalize);
                                                            if (normPrev.includes(t)) {
                                                                return prev.filter((x) => normalize(x) !== t);
                                                            }
                                                            return [...prev, t];
                                                        });
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {weaponTypeFilters.length > 0 && (
                                        <div className="mt-2">
                                            <button
                                                className="text-xs text-slate-300 hover:text-slate-100 underline"
                                                onClick={() => setWeaponTypeFilters([])}
                                            >
                                                Clear type filters
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Virtualized list */}
                    <div
                        ref={listRef}
                        className="max-h-[65vh] overflow-auto"
                        onScroll={() => recomputeWindow()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-slate-950/90 border-b border-slate-800">
                            <div className="grid grid-cols-[1fr_140px_170px] gap-0 text-sm">
                                <div className="px-3 py-2 text-slate-300 font-semibold">Item</div>
                                <div className="px-3 py-2 text-slate-300 font-semibold">Count</div>
                                <div className="px-3 py-2 text-slate-300 font-semibold">Goal Target</div>
                            </div>
                        </div>

                        {/* Body spacer + window */}
                        <div className="relative" style={{ height: totalHeight }}>
                            <div
                                className="absolute left-0 right-0"
                                style={{ transform: `translateY(${translateY}px)` }}
                            >
                                {slice.map((r) => {
                                    const goal = goalByCatalogId.get(String(r.id));
                                    const goalTarget = goal ? safeInt(goal.qty ?? 1, 1) : 0;

                                    return (
                                        <div
                                            key={String(r.id)}
                                            className="grid grid-cols-[1fr_140px_170px] border-b border-slate-800/70 items-start"
                                            style={{ height: ROW_H }}
                                        >
                                            <div className="px-3 py-2 text-slate-100 flex items-center">
                                                {r.label}
                                            </div>

                                            <div className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                                                    type="number"
                                                    min={0}
                                                    value={r.value}
                                                    onChange={(e) => {
                                                        const n = Number(e.target.value);
                                                        setCount(String(r.id), Number.isFinite(n) ? n : 0);
                                                    }}
                                                />
                                            </div>

                                            <div className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        className={[
                                                            "w-full rounded-lg border px-3 py-2 text-slate-100",
                                                            goal
                                                                ? "bg-slate-900 border-slate-700"
                                                                : "bg-slate-950/40 border-slate-800 text-slate-300"
                                                        ].join(" ")}
                                                        type="number"
                                                        min={0}
                                                        value={goalTarget}
                                                        onChange={(e) => {
                                                            const next = safeInt(e.target.value, 0);

                                                            if (next <= 0) {
                                                                if (goal) {
                                                                    removeGoal(goal.id);
                                                                }
                                                                return;
                                                            }

                                                            if (!goal) {
                                                                addGoalItem(String(r.id), next);
                                                                return;
                                                            }

                                                            setGoalQty(goal.id, next);
                                                        }}
                                                    />

                                                    <div className="text-xs text-slate-500 whitespace-nowrap">
                                                        {goal ? "Active" : "Off"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {filtered.length === 0 && (
                            <div className="px-3 py-3 text-sm text-slate-400">No matches.</div>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    );
}

