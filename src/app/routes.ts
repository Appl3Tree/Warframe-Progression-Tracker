// ===== FILE: src/app/routes.ts =====
import type { PageKey } from "../domain/models/userState";

export type NavRoute = {
    key: PageKey;
    label: string;
    desc: string;
};

export const NAV_ROUTES: NavRoute[] = [
    { key: "dashboard", label: "Dashboard", desc: "Today’s checklist and quick status." },
    { key: "inventory", label: "Inventory", desc: "Full catalog by category with filters." },
    { key: "starchart", label: "Star Chart", desc: "Click planet → node to see rewards and item sources." },
    { key: "prereqs", label: "Prerequisites", desc: "Quest and system unlock tracking." },
    { key: "syndicates", label: "Syndicates", desc: "Syndicate standing and ranks." },
    { key: "goals", label: "Goals", desc: "Personal goal portfolio." },
    { key: "requirements", label: "Farming", desc: "Targeted vs Overlap across goals + syndicates." },
    { key: "handbook", label: "Tenno's Handbook", desc: "Quest order, game mechanics, and farming guides for new players." },
    { key: "imports", label: "Import / Export", desc: "Progress Pack tools." },
    { key: "settings", label: "Settings", desc: "App preferences." },
    { key: "diagnostics", label: "Diagnostics", desc: "Validation and debug output." }
];

