// ===== FILE: src/app/routes.ts =====
import type { PageKey } from "../domain/models/userState";

export type WorkModeKey = "command" | "progression" | "collection" | "planning" | "system";

export type NavRoute = {
    key: PageKey;
    label: string;
    desc: string;
    mode: WorkModeKey;
    shortLabel?: string;
};

export const NAV_ROUTES: NavRoute[] = [
    { key: "dashboard", label: "Dashboard", shortLabel: "Dash", desc: "Today’s checklist and quick status.", mode: "command" },
    { key: "world_state", label: "World State", shortLabel: "World", desc: "Live cycles, missions, fissures, and events.", mode: "command" },

    { key: "goals", label: "Goals", desc: "Personal goal portfolio.", mode: "progression" },
    { key: "prereqs", label: "Prerequisites", shortLabel: "Prereqs", desc: "Quest and system unlock tracking.", mode: "progression" },
    { key: "syndicates", label: "Syndicates", shortLabel: "Syndis", desc: "Syndicate standing and ranks.", mode: "progression" },
    { key: "intrinsics", label: "Intrinsics", desc: "Railjack and Duviri intrinsic progression.", mode: "progression" },
    { key: "challenges", label: "Challenges", desc: "Track your achievement challenges and progress.", mode: "progression" },
    { key: "handbook", label: "Tenno's Handbook", shortLabel: "Handbook", desc: "Quest order, game mechanics, and farming guides for new players.", mode: "progression" },

    { key: "inventory", label: "Inventory", desc: "Full catalog by category with filters.", mode: "collection" },
    { key: "mods", label: "Mods", shortLabel: "Mods", desc: "Browse mods, rivens, and drop locations.", mode: "collection" },
    { key: "arcanes", label: "Arcanes", shortLabel: "Arcanes", desc: "Track arcane ownership, ranks, and acquisition.", mode: "collection" },
    { key: "starchart", label: "Star Chart", shortLabel: "Chart", desc: "Click planet → node to see rewards and item sources.", mode: "collection" },

    { key: "requirements", label: "Farming", desc: "Targeted vs Overlap across goals + syndicates.", mode: "planning" },
    { key: "relic_planner", label: "Relic Planner", shortLabel: "Relics", desc: "Find which relics contain your target items and plan fissure runs.", mode: "planning" },
    { key: "build_planner", label: "Build Planner", shortLabel: "Builds", desc: "Build and optimize weapon loadouts using the damage model.", mode: "planning" },

    { key: "imports", label: "Import / Export", shortLabel: "Import", desc: "Progress Pack tools.", mode: "system" },
    { key: "settings", label: "Settings", desc: "App preferences.", mode: "system" },
    { key: "diagnostics", label: "Diagnostics", shortLabel: "Diag", desc: "Validation and debug output.", mode: "system" },
];

export const SEARCH_DETAIL_ROUTE: NavRoute = {
    key: "search_detail",
    label: "Search Detail",
    shortLabel: "Detail",
    desc: "Focused dossier view for an item, mod, or arcane.",
    mode: "collection",
};

export const WORK_MODE_META: Record<WorkModeKey, { label: string; desc: string }> = {
    command: {
        label: "Command",
        desc: "Daily status, live intel, and what matters now.",
    },
    progression: {
        label: "Progression",
        desc: "Longer-term advancement, unlocks, and progression systems.",
    },
    collection: {
        label: "Collection",
        desc: "Inventory, mods, and source research across the catalog.",
    },
    planning: {
        label: "Planning",
        desc: "Farming routes, relics, and build analysis.",
    },
    system: {
        label: "System",
        desc: "Import tools, settings, and diagnostics.",
    },
};

export const WORK_MODE_ORDER: WorkModeKey[] = ["command", "progression", "collection", "planning", "system"];

export function getRouteByKey(key: PageKey): NavRoute {
    if (key === "search_detail") {
        return SEARCH_DETAIL_ROUTE;
    }
    if (key === "relics") {
        return NAV_ROUTES.find((route) => route.key === "relic_planner") ?? NAV_ROUTES[0];
    }
    return NAV_ROUTES.find((route) => route.key === key) ?? NAV_ROUTES[0];
}

