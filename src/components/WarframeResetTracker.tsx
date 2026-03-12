// ===== FILE: src/components/WarframeResetTracker.tsx =====
//
// Self-contained reset tracker. Persists via localStorage key "wfpt:resetChecklist".
// No store changes required — reads completedPrereqs + syndicates read-only.
//
// Features:
//  - Relay faction standing tasks filter to only pledged faction(s).
//  - "Conclave" tab is its own bucket with an internal daily (16:00 UTC) /
//    weekly (Fri 00:00 UTC) split — Conclave runs on a separate cadence.
//  - "Customize" panel lets users permanently hide tasks they don't care about.
//  - If every eligible task in a bucket is hidden, the timer card is suppressed.
//  - Baro Ki'Teer reference row is live-computed (anchor 2026-03-20T00:00Z, bi-weekly, 48h window).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTrackerStore } from "../store/store";
import { PR } from "../domain/ids/prereqIds";
import { SY } from "../domain/ids/syndicateIds";
import type { SyndicateState } from "../domain/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

// "conclave" replaces "weekly_friday" — it has an internal daily+weekly split.
type Bucket   = "primary_daily" | "secondary_daily" | "weekly_monday" | "conclave";
type TimeMode = "utc" | "local";

interface RCState {
    timeMode: TimeMode;
    primaryDailyResetKey:           string;
    completedPrimaryDailyTaskIds:   string[];
    secondaryDailyResetKey:         string;
    completedSecondaryDailyTaskIds: string[];
    weeklyMondayResetKey:           string;
    completedWeeklyMondayTaskIds:   string[];
    // Conclave has two internal windows — keyed separately so each auto-clears correctly
    conclaveWeeklyResetKey:         string;
    completedConclaveWeeklyTaskIds: string[];
    conclaveDailyResetKey:          string;
    completedConclaveDailyTaskIds:  string[];
    hiddenTaskIds:                  string[];
    netracellRuns:                  number;    // 0–5, clears with weekly monday reset
}

// ConclaveSubBucket drives the internal split inside the Conclave tab panel
type ConclaveSubBucket = "conclave_daily" | "conclave_weekly";

type TaskDef = {
    id: string;
    label: string;
    bucket: Bucket;
    /** For conclave tasks only — which internal sub-bucket they belong to */
    conclaveSub?: ConclaveSubBucket;
    description: string;
    isFactionStanding?: boolean;
    factionSyndicateId?: string;
    prereqIds?: string[];
    isVisible?: (ctx: { completedPrereqs: Record<string, boolean>; syndicates: SyndicateState[] }) => boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = "wfpt:resetChecklist";

import type { SyndicateId } from "../domain/ids/syndicateIds";

const RELAY_FACTION_IDS = new Set<SyndicateId>([
    SY.STEEL_MERIDIAN, SY.ARBITERS_OF_HEXIS, SY.CEPHALON_SUDA,
    SY.THE_PERRIN_SEQUENCE, SY.RED_VEIL, SY.NEW_LOKA,
]);

// Window lengths for urgency colouring on the timer card.
// For "conclave" we use the shorter daily window so the card colour is driven
// by whichever deadline is most imminent.
const WINDOW_MS: Record<Bucket, number> = {
    primary_daily:   86_400_000,
    secondary_daily: 86_400_000,
    weekly_monday:   604_800_000,
    conclave:        86_400_000,   // driven by the daily sub-reset
};

const BUCKET_LABEL: Record<Bucket, string> = {
    primary_daily:   "Primary Daily",
    secondary_daily: "Secondary Daily",
    weekly_monday:   "Weekly Reset",
    conclave:        "Conclave",
};

const BUCKET_SUB: Record<Bucket, string> = {
    primary_daily:   "00:00 UTC",
    secondary_daily: "16:00 UTC",
    weekly_monday:   "Mon 00:00 UTC",
    conclave:        "Daily 16:00 · Weekly Fri",
};

const BUCKET_ORDER: Bucket[] = [
    "primary_daily", "secondary_daily", "weekly_monday", "conclave",
];

// For non-conclave buckets only — conclave uses two separate key pairs below.
const COMPLETED_KEY: Partial<Record<Bucket, keyof RCState>> = {
    primary_daily:   "completedPrimaryDailyTaskIds",
    secondary_daily: "completedSecondaryDailyTaskIds",
    weekly_monday:   "completedWeeklyMondayTaskIds",
};

const RESET_KEY: Partial<Record<Bucket, keyof RCState>> = {
    primary_daily:   "primaryDailyResetKey",
    secondary_daily: "secondaryDailyResetKey",
    weekly_monday:   "weeklyMondayResetKey",
};

// Baro anchor — 2026-03-20T00:00:00Z, every 14 days, available 48 h
const BARO_ANCHOR_MS  = Date.UTC(2026, 2, 20, 0, 0, 0); // month is 0-indexed
const BARO_PERIOD_MS  = 14 * 86_400_000;
const BARO_WINDOW_MS  = 2  * 86_400_000;

// ─── Task definitions ──────────────────────────────────────────────────────────

const ALL_TASKS: TaskDef[] = [
    // ── Primary Daily — 00:00 UTC ──────────────────────────────────────────────
    { id: "daily_tribute",              label: "Daily Tribute",            bucket: "primary_daily",   description: "Claim the daily login reward." },
    { id: "daily_trade_limit",          label: "Daily Trade Limit",        bucket: "primary_daily",   description: "Use remaining trades before midnight UTC." },
    { id: "daily_gift_limit",           label: "Daily Gift Limit",         bucket: "primary_daily",   description: "Use remaining daily gifts." },
    { id: "focus_daily_cap",            label: "Focus Daily Cap",          bucket: "primary_daily",   description: "Spend today's Focus cap.", prereqIds: [PR.SECOND_DREAM] },

    // Relay faction standing — filtered to pledged faction(s) automatically
    { id: "standing_steel_meridian",    label: "Steel Meridian",           bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.STEEL_MERIDIAN },
    { id: "standing_arbiters",          label: "Arbiters of Hexis",        bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.ARBITERS_OF_HEXIS },
    { id: "standing_suda",              label: "Cephalon Suda",            bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.CEPHALON_SUDA },
    { id: "standing_perrin",            label: "Perrin Sequence",          bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.THE_PERRIN_SEQUENCE },
    { id: "standing_red_veil",          label: "Red Veil",                 bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.RED_VEIL },
    { id: "standing_new_loka",          label: "New Loka",                 bucket: "primary_daily",   description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.NEW_LOKA },

    // Open-world standing
    { id: "standing_ostron",            label: "Ostrons",                  bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_CETUS] },
    { id: "standing_the_quills",        label: "The Quills",               bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_CETUS] },
    { id: "standing_solaris",           label: "Solaris United",           bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA] },
    { id: "standing_vox_solaris",       label: "Vox Solaris",              bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA, PR.SECOND_DREAM] },
    { id: "standing_ventkids",          label: "Ventkids",                 bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA] },
    { id: "standing_entrati",           label: "Entrati",                  bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_NECRALISK] },
    { id: "standing_cavia",             label: "Cavia",                    bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_SANCTUM] },
    { id: "standing_necraloid",         label: "Necraloid",                bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_NECRALISK] },
    { id: "standing_the_holdfasts",     label: "The Holdfasts",            bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_ZARIMAN] },
    { id: "standing_the_hex",           label: "The Hex",                  bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_HOLLVANIA] },
    { id: "standing_cephalon_simaris",  label: "Cephalon Simaris",         bucket: "primary_daily",   description: "Use today's standing cap.", prereqIds: [PR.HUB_RELAY, PR.NEW_STRANGE] },

    { id: "steel_path_incursions",      label: "Steel Path Incursions",    bucket: "primary_daily",   description: "Finish the day's Steel Path Incursions." },
    { id: "nightwave_daily",            label: "Nightwave Daily Acts",     bucket: "primary_daily",   description: "Complete today's Nightwave daily acts." },
    { id: "argon_decay",                label: "Argon Crystal Check",      bucket: "primary_daily",   description: "Spend Argon before daily decay if needed." },
    { id: "circuit_stage_bonus",        label: "Circuit Stage Bonus",      bucket: "primary_daily",   description: "Use today's Circuit stage bonus.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "acrithis_daily",             label: "Acrithis Daily",           bucket: "primary_daily",   description: "Check current daily Duviri shop offerings.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "kim_daily",                  label: "KIM Daily Conversations",  bucket: "primary_daily",   description: "Check new daily KIM messages from Hex members and Roundtable contacts.", prereqIds: [PR.THE_HEX] },

    // ── Secondary Daily — 16:00 UTC ────────────────────────────────────────────
    { id: "sortie_set",                 label: "Sortie Mission Set",       bucket: "secondary_daily", description: "Complete today's Sortie before missions rotate." },
    { id: "syndicate_missions",         label: "Syndicate Daily Missions", bucket: "secondary_daily", description: "Finish the current Syndicate mission set." },

    // ── Weekly — Monday 00:00 UTC ──────────────────────────────────────────────
    { id: "archon_hunt",                label: "Archon Hunt",              bucket: "weekly_monday",   description: "Complete this week's Archon Hunt.", prereqIds: [PR.NEW_WAR] },
    { id: "netracells",                 label: "Netracells (5 runs)",      bucket: "weekly_monday",   description: "Use this week's Netracell reward runs. Shares the 5-run Search Pulse pool with Deep Archimedea and Temporal Archimedea.", prereqIds: [PR.WHISPERS_WALL] },
    {
        id: "deep_archimedea",          label: "Deep Archimedea",          bucket: "weekly_monday",   description: "Complete this week's Deep Archimedea.",
        prereqIds: [PR.WHISPERS_WALL],
        isVisible: ({ completedPrereqs, syndicates }) => {
            if (!completedPrereqs[PR.WHISPERS_WALL]) return false;
            return (syndicates.find((s) => s.id === SY.CAVIA)?.rank ?? 0) >= 5;
        },
    },
    { id: "circuit_reward_track",       label: "Circuit Reward Track",     bucket: "weekly_monday",   description: "Push weekly Circuit reward track.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "circuit_incarnon",           label: "Circuit Incarnon Genesis", bucket: "weekly_monday",   description: "Use current weekly Incarnon rotation.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "nightwave_weekly",           label: "Nightwave Weekly Acts",    bucket: "weekly_monday",   description: "Complete this week's Nightwave weekly acts." },
    { id: "nightwave_elite",            label: "Nightwave Elite Weekly",   bucket: "weekly_monday",   description: "Complete this week's Nightwave elite acts." },
    { id: "helminth_invigoration",      label: "Helminth Invigoration",    bucket: "weekly_monday",   description: "Use the current weekly Helminth Invigoration.", prereqIds: [PR.SEGMENT_HELMINTH_INVIGORATION] },
    { id: "steel_path_honors",          label: "Steel Path Honors",        bucket: "weekly_monday",   description: "Check or buy this week's Steel Path Honors." },
    { id: "palladino_weekly",           label: "Palladino — Iron Wake",    bucket: "weekly_monday",   description: "Check this week's Palladino offerings." },
    { id: "yonta_weekly",               label: "Yonta — Weekly Kuva",      bucket: "weekly_monday",   description: "Claim Yonta's weekly Kuva purchase.", prereqIds: [PR.HUB_ZARIMAN] },
    { id: "bird3_weekly",               label: "Bird-3 — Archon Shard",    bucket: "weekly_monday",   description: "Check Bird-3's weekly shard purchase.", prereqIds: [PR.HUB_SANCTUM] },
    { id: "acrithis_weekly",            label: "Acrithis Weekly Shop",     bucket: "weekly_monday",   description: "Review the weekly Acrithis inventory.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "break_narmer",               label: "Break Narmer (Kahl)",      bucket: "weekly_monday",   description: "Complete the weekly Kahl mission.", prereqIds: [PR.VEILBREAKER] },
    { id: "maroo",                      label: "Maroo — Ayatan Hunt",      bucket: "weekly_monday",   description: "Run the weekly Ayatan Treasure Hunt." },
    { id: "help_clem",                  label: "Help Clem",                bucket: "weekly_monday",   description: "Run the weekly Help Clem mission." },
    { id: "the_descendia_normal",       label: "The Descendia (Normal)",   bucket: "weekly_monday",   description: "Complete this week's Normal Descendia run. Separate reward table from Steel Path.", prereqIds: [PR.THE_OLD_PEACE] },
    { id: "the_descendia_sp",           label: "The Descendia (Steel Path)",bucket: "weekly_monday",   description: "Complete this week's Steel Path Descendia run. Separate reward table from Normal.", prereqIds: [PR.THE_OLD_PEACE] },
    { id: "kaya_weekly",               label: "Kaya — Weekly Arcane",     bucket: "weekly_monday",   description: "Check Kaya's weekly Arcane Enhancement offering.", prereqIds: [PR.THE_HEX] },
    {
        id: "temporal_archimedea",      label: "Temporal Archimedea",      bucket: "weekly_monday",   description: "Complete this week's Temporal Archimedea. Uses the shared 5-run Search Pulse pool with Netracells and Deep Archimedea.",
        prereqIds: [PR.THE_HEX],
        isVisible: ({ completedPrereqs, syndicates }) => {
            if (!completedPrereqs[PR.THE_HEX]) return false;
            return (syndicates.find((s) => s.id === SY.THE_HEX)?.rank ?? 0) >= 5;
        },
    },
    { id: "calendar_1999",              label: "1999 Calendar Season",     bucket: "weekly_monday",   description: "Check weekly calendar To Do tasks, prize selection, and Hex Override choices.", prereqIds: [PR.THE_HEX] },

    // ── Conclave — Daily 16:00 UTC ─────────────────────────────────────────────
    { id: "conclave_daily_standing",    label: "Conclave Standing",        bucket: "conclave",        conclaveSub: "conclave_daily",   description: "Use today's Conclave standing cap.", prereqIds: [PR.HUB_RELAY] },
    { id: "conclave_daily_challenges",  label: "Conclave Daily Challenges",bucket: "conclave",        conclaveSub: "conclave_daily",   description: "Complete today's Conclave daily challenges.", prereqIds: [PR.HUB_RELAY] },

    // ── Conclave — Weekly Friday 00:00 UTC ────────────────────────────────────
    { id: "conclave_weekly_challenges", label: "Conclave Weekly Challenges", bucket: "conclave",      conclaveSub: "conclave_weekly",  description: "Finish this week's Conclave weekly challenges.", prereqIds: [PR.HUB_RELAY] },
];

const TIMED_REF = [
    { id: "tenet",   label: "Tenet Weapon Bonus",  detail: "Rotates every 4 days at 00:00 UTC." },
    { id: "bounty",  label: "Bounty Rotation",     detail: "Every 2h 30m — Cetus, Fortuna, Cambion, Zariman, Sanctum." },
    { id: "plains",  label: "Plains of Eidolon",   detail: "150-min cycle: ~100m day, ~50m night." },
    { id: "vallis",  label: "Orb Vallis",          detail: "26m 40s warm / 20m cold." },
    { id: "cambion", label: "Cambion Drift",       detail: "150-min Fass/Vome cycle." },
];
const MONTHLY_REF = [{ id: "prime", label: "Prime Resurgence", detail: "Approximate monthly rotation ~18:00 UTC. Reference only." }];
const EVENT_REF = [
    { id: "world",    label: "World Events",   detail: "Ghoul Purge, Thermia, Razorback, Fomorian, Plague Star." },
    { id: "seasonal", label: "Seasonal Events",detail: "Star Days, Dog Days, Naberus, Lunar New Year, Christmas." },
];

// ─── Time helpers ───────────────────────────────────────────────────────────────

function utcKey(d: Date) { return d.toISOString().slice(0, 10); }

// Key for conclave daily — date string for the 16:00 UTC window currently active
function conclaveDailyKey(now: Date): string {
    const threshold = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16));
    if (now >= threshold) return utcKey(threshold);
    const prev = new Date(threshold); prev.setUTCDate(prev.getUTCDate() - 1);
    return utcKey(prev);
}

// Key for conclave weekly — most recent Friday 00:00 UTC
function conclaveWeeklyKey(now: Date): string {
    const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    base.setUTCDate(base.getUTCDate() - (base.getUTCDay() + 2) % 7);
    return utcKey(base);
}

function getCurrentKeys(now: Date): Record<Exclude<Bucket, "conclave">, string> & { conclave_daily: string; conclave_weekly: string } {
    const st = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16));
    const mb = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    mb.setUTCDate(mb.getUTCDate() - (mb.getUTCDay() + 6) % 7);
    const secKey = now >= st ? utcKey(st) : (() => { const p = new Date(st); p.setUTCDate(p.getUTCDate() - 1); return utcKey(p); })();
    return {
        primary_daily:   utcKey(now),
        secondary_daily: secKey,
        weekly_monday:   utcKey(mb),
        conclave_daily:  conclaveDailyKey(now),
        conclave_weekly: conclaveWeeklyKey(now),
    };
}

// Next reset times for all sub-windows
function getNextResets(now: Date): Record<Bucket, Date> & { conclave_daily: Date; conclave_weekly: Date } {
    const st = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16));
    const nm = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    nm.setUTCDate(nm.getUTCDate() - (nm.getUTCDay() + 6) % 7 + 7);
    const nf = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    nf.setUTCDate(nf.getUTCDate() - (nf.getUTCDay() + 2) % 7 + 7);

    const nextConcDaily = now < st ? st : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 16));

    return {
        primary_daily:   new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)),
        secondary_daily: now < st ? st : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 16)),
        weekly_monday:   nm,
        // The "conclave" card shows countdown to the nearest of its two sub-resets
        conclave:        nextConcDaily,
        conclave_daily:  nextConcDaily,
        conclave_weekly: nf,
    };
}

function fmtMs(ms: number): string {
    const t = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function fmtAbs(date: Date, mode: TimeMode): string {
    if (mode === "utc") {
        const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        const t  = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
        return `${wd} ${t} UTC`;
    }
    return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function urgTier(ms: number, bucket: Bucket): "safe" | "warn" | "crit" {
    const r = ms / WINDOW_MS[bucket];
    return r <= 0.10 ? "crit" : r <= 0.35 ? "warn" : "safe";
}

const URG_COUNTDOWN: Record<string, string> = { safe: "text-emerald-400", warn: "text-amber-400",        crit: "text-red-400" };
const URG_BAR:       Record<string, string> = { safe: "bg-emerald-500",   warn: "bg-amber-500",          crit: "bg-red-500" };
const URG_BORDER_L:  Record<string, string> = { safe: "border-l-emerald-600", warn: "border-l-amber-600",crit: "border-l-red-600" };
const URG_TITLE:     Record<string, string> = { safe: "text-emerald-400", warn: "text-amber-400",        crit: "text-red-400" };

// ─── Baro Ki'Teer live computation ─────────────────────────────────────────────

function getBaroStatus(now: Date): { present: boolean; label: string; detail: string; timeLeftMs: number; timeUntilMs: number } {
    const ms = now.getTime();
    const offset = ((ms - BARO_ANCHOR_MS) % BARO_PERIOD_MS + BARO_PERIOD_MS) % BARO_PERIOD_MS;
    const cycleStart    = ms - offset;
    const leaveMs       = cycleStart + BARO_WINDOW_MS;
    const nextArrivalMs = cycleStart + BARO_PERIOD_MS;

    if (ms < leaveMs) {
        const remaining = leaveMs - ms;
        return {
            present:     true,
            label:       "Baro Ki'Teer — HERE NOW",
            detail:      `Leaves in ${fmtMs(remaining)} · Every other Friday, 48 h window`,
            timeLeftMs:  remaining,
            timeUntilMs: 0,
        };
    }
    const until = nextArrivalMs - ms;
    return {
        present:     false,
        label:       "Baro Ki'Teer",
        detail:      `Arrives in ${fmtMs(until)} · Every other Friday at 00:00 UTC, 48 h window`,
        timeLeftMs:  0,
        timeUntilMs: until,
    };
}

// ─── LocalStorage ───────────────────────────────────────────────────────────────

function makeDefault(now: Date): RCState {
    const keys = getCurrentKeys(now);
    return {
        timeMode: "utc",
        primaryDailyResetKey:           keys.primary_daily,   completedPrimaryDailyTaskIds:   [],
        secondaryDailyResetKey:         keys.secondary_daily, completedSecondaryDailyTaskIds: [],
        weeklyMondayResetKey:           keys.weekly_monday,   completedWeeklyMondayTaskIds:   [],
        conclaveWeeklyResetKey:         keys.conclave_weekly, completedConclaveWeeklyTaskIds: [],
        conclaveDailyResetKey:          keys.conclave_daily,  completedConclaveDailyTaskIds:  [],
        hiddenTaskIds: [],
        netracellRuns: 0,
    };
}

function loadState(): RCState {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as RCState;
            if (!Array.isArray(parsed.hiddenTaskIds))               parsed.hiddenTaskIds = [];
            if (!Array.isArray(parsed.completedConclaveWeeklyTaskIds)) parsed.completedConclaveWeeklyTaskIds = [];
            if (!Array.isArray(parsed.completedConclaveDailyTaskIds))  parsed.completedConclaveDailyTaskIds  = [];
            if (!parsed.conclaveWeeklyResetKey) parsed.conclaveWeeklyResetKey = conclaveWeeklyKey(new Date());
            if (!parsed.conclaveDailyResetKey)  parsed.conclaveDailyResetKey  = conclaveDailyKey(new Date());
            if (typeof parsed.netracellRuns !== "number") parsed.netracellRuns = 0;
            return parsed;
        }
    } catch { /* */ }
    return makeDefault(new Date());
}

function saveState(s: RCState): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* */ }
}

function syncResets(s: RCState, now: Date): RCState {
    const keys = getCurrentKeys(now);
    let next = s;

    // Standard buckets — also clear netracellRuns when weekly monday resets
    (["primary_daily", "secondary_daily", "weekly_monday"] as const).forEach((b) => {
        const rk = RESET_KEY[b]!;
        const ck = COMPLETED_KEY[b]!;
        if (next[rk] !== keys[b]) {
            next = { ...next, [rk]: keys[b], [ck]: [] };
            if (b === "weekly_monday") next = { ...next, netracellRuns: 0 };
        }
    });

    // Conclave sub-windows
    if (next.conclaveDailyResetKey  !== keys.conclave_daily)  next = { ...next, conclaveDailyResetKey:  keys.conclave_daily,  completedConclaveDailyTaskIds:  [] };
    if (next.conclaveWeeklyResetKey !== keys.conclave_weekly) next = { ...next, conclaveWeeklyResetKey: keys.conclave_weekly, completedConclaveWeeklyTaskIds: [] };

    return next;
}

// ─── Visibility helpers ─────────────────────────────────────────────────────────

function getEligibleTasks(
    completedPrereqs: Record<string, boolean>,
    syndicates: SyndicateState[],
): TaskDef[] {
    const pledgedIds = new Set(
        syndicates.filter((s) => s.pledged && RELAY_FACTION_IDS.has(s.id as SyndicateId)).map((s) => s.id)
    );
    const anyPledged = pledgedIds.size > 0;

    return ALL_TASKS.filter((t) => {
        if (t.isFactionStanding && t.factionSyndicateId) {
            if (anyPledged && !pledgedIds.has(t.factionSyndicateId)) return false;
        }
        if (!(t.prereqIds ?? []).every((id) => completedPrereqs[id] === true)) return false;
        if (t.isVisible) return t.isVisible({ completedPrereqs, syndicates });
        return true;
    });
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function CheckIcon() {
    return (
        <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Netracell run counter — 5 pip dots the player clicks to fill/unfill
function NetracellCounter({ runs, onChange }: { runs: number; onChange: (n: number) => void }) {
    const done = runs >= 5;
    return (
        <div
            className={[
                "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-colors w-full",
                done
                    ? "border-emerald-900/30 bg-emerald-950/10"
                    : "border-transparent hover:border-slate-700 hover:bg-slate-900/50",
            ].join(" ")}
        >
            {/* Checkbox-style indicator */}
            <div className={[
                "flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center",
                done ? "border-emerald-800 bg-emerald-950/30" : "border-slate-600 bg-slate-900",
            ].join(" ")}>
                {done && <CheckIcon />}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium leading-tight ${done ? "text-emerald-500" : "text-slate-200"}`}>
                    Netracells
                </div>
                {/* Pip row */}
                <div className="flex items-center gap-1.5 mt-1.5">
                    {Array.from({ length: 5 }, (_, i) => {
                        const filled = i < runs;
                        return (
                            <button
                                key={i}
                                title={`${i + 1} / 5`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Clicking the last filled pip clears it; clicking an unfilled one sets count
                                    onChange(filled && i === runs - 1 ? runs - 1 : i + 1);
                                }}
                                className={[
                                    "w-5 h-5 rounded-full border text-[10px] font-semibold transition-all flex items-center justify-center",
                                    filled
                                        ? "border-emerald-700 bg-emerald-800 text-emerald-200 hover:bg-emerald-700"
                                        : "border-slate-600 bg-slate-900 text-slate-600 hover:border-slate-400 hover:text-slate-400",
                                ].join(" ")}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                    <span className={`ml-1 text-xs tabular-nums ${done ? "text-emerald-400" : "text-slate-500"}`}>
                        {runs}/5
                    </span>
                </div>
            </div>
        </div>
    );
}

// Renders a flat list of tasks for a single sub-section
function TaskList({ tasks, completedIds, onToggle, netracellRuns, onNetracellChange }: {
    tasks: TaskDef[];
    completedIds: string[];
    onToggle: (id: string) => void;
    netracellRuns?: number;
    onNetracellChange?: (n: number) => void;
}) {
    const netracellDone = (netracellRuns ?? 0) >= 5;

    // Netracells is complete when runs === 5 — sort it into the completed section then.
    const pending   = tasks.filter((t) => t.id === "netracells" ? !netracellDone : !completedIds.includes(t.id));
    const completed = tasks.filter((t) => t.id === "netracells" ? netracellDone  :  completedIds.includes(t.id));

    if (tasks.length === 0) return (
        <div className="px-3 py-4 text-sm text-slate-500 text-center">
            No tasks unlocked for this window
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {pending.map((t) => {
                // Special card for netracells
                if (t.id === "netracells" && netracellRuns !== undefined && onNetracellChange) {
                    return (
                        <NetracellCounter
                            key={t.id}
                            runs={netracellRuns}
                            onChange={onNetracellChange}
                        />
                    );
                }
                return (
                    <button
                        key={t.id}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-700 hover:bg-slate-900/50 text-left transition-colors w-full"
                        onClick={() => onToggle(t.id)}
                    >
                        <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-slate-600 bg-slate-900" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-200 leading-tight">{t.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</div>
                        </div>
                    </button>
                );
            })}
            {completed.length > 0 && (
                <div className="col-span-full flex items-center gap-3 py-1 px-1">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[11px] text-slate-600">Completed · {completed.length}</span>
                    <div className="flex-1 h-px bg-slate-800" />
                </div>
            )}
            {completed.map((t) => {
                if (t.id === "netracells" && netracellRuns !== undefined && onNetracellChange) {
                    return (
                        <NetracellCounter
                            key={t.id}
                            runs={netracellRuns}
                            onChange={onNetracellChange}
                        />
                    );
                }
                return (
                    <button
                        key={t.id}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-emerald-900/30 bg-emerald-950/10 text-left transition-colors w-full opacity-70 hover:opacity-100"
                        onClick={() => onToggle(t.id)}
                    >
                        <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-emerald-800 bg-emerald-950/30 flex items-center justify-center">
                            <CheckIcon />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-emerald-500 leading-tight">{t.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// Standard single-bucket task panel (primary, secondary, weekly)
function TaskPanel({ bucket, tasks, completedIds, tier, onToggle, onClear, netracellRuns, onNetracellChange }: {
    bucket: Bucket; tasks: TaskDef[]; completedIds: string[];
    tier: string; onToggle: (id: string) => void; onClear: () => void;
    netracellRuns?: number; onNetracellChange?: (n: number) => void;
}) {
    const done    = tasks.filter((t) => completedIds.includes(t.id)).length
                  + (netracellRuns !== undefined && netracellRuns >= 5 && tasks.some((t) => t.id === "netracells") ? 1 : 0);
    const allDone = tasks.length > 0 && done === tasks.length;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${URG_TITLE[tier]}`}>
                        {BUCKET_LABEL[bucket]}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{BUCKET_SUB[bucket]}</div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${allDone ? "border-emerald-800 text-emerald-400" : "border-slate-700 text-slate-400"}`}>
                        {done}/{tasks.length}
                    </span>
                    <button
                        className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded px-2 py-0.5 transition-colors"
                        onClick={onClear}
                    >
                        Clear
                    </button>
                </div>
            </div>
            {tasks.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500 text-center">No tasks unlocked for this reset window</div>
            ) : (
                <div className="p-2">
                    <TaskList tasks={tasks} completedIds={completedIds} onToggle={onToggle} netracellRuns={netracellRuns} onNetracellChange={onNetracellChange} />
                </div>
            )}
        </div>
    );
}

// Conclave panel — renders two internal sections: Daily and Weekly
function ConclavePanel({
    dailyTasks, weeklyTasks,
    completedDailyIds, completedWeeklyIds,
    tier,
    nextDailyReset, nextWeeklyReset,
    timeMode,
    onToggleDaily, onToggleWeekly,
    onClearDaily,  onClearWeekly,
}: {
    dailyTasks: TaskDef[];  weeklyTasks: TaskDef[];
    completedDailyIds: string[]; completedWeeklyIds: string[];
    tier: string;
    nextDailyReset: Date; nextWeeklyReset: Date;
    timeMode: TimeMode;
    onToggleDaily: (id: string) => void; onToggleWeekly: (id: string) => void;
    onClearDaily: () => void; onClearWeekly: () => void;
}) {
    const dailyDone   = dailyTasks.filter((t)  => completedDailyIds.includes(t.id)).length;
    const weeklyDone  = weeklyTasks.filter((t) => completedWeeklyIds.includes(t.id)).length;
    const totalDone   = dailyDone + weeklyDone;
    const totalTasks  = dailyTasks.length + weeklyTasks.length;
    const allDone     = totalTasks > 0 && totalDone === totalTasks;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${URG_TITLE[tier]}`}>
                        Conclave
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Daily 16:00 UTC · Weekly Fri 00:00 UTC</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${allDone ? "border-emerald-800 text-emerald-400" : "border-slate-700 text-slate-400"}`}>
                    {totalDone}/{totalTasks}
                </span>
            </div>

            <div className="p-3 flex flex-col gap-4">
                {/* Daily sub-section */}
                <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                            <span className="text-xs font-semibold text-slate-300">Daily</span>
                            <span className="ml-2 text-xs text-slate-500">resets {fmtAbs(nextDailyReset, timeMode)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{dailyDone}/{dailyTasks.length}</span>
                            <button
                                className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded px-2 py-0.5 transition-colors"
                                onClick={onClearDaily}
                            >Clear</button>
                        </div>
                    </div>
                    <TaskList tasks={dailyTasks} completedIds={completedDailyIds} onToggle={onToggleDaily} />
                </div>

                <div className="h-px bg-slate-800" />

                {/* Weekly sub-section */}
                <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                            <span className="text-xs font-semibold text-slate-300">Weekly</span>
                            <span className="ml-2 text-xs text-slate-500">resets {fmtAbs(nextWeeklyReset, timeMode)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{weeklyDone}/{weeklyTasks.length}</span>
                            <button
                                className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded px-2 py-0.5 transition-colors"
                                onClick={onClearWeekly}
                            >Clear</button>
                        </div>
                    </div>
                    <TaskList tasks={weeklyTasks} completedIds={completedWeeklyIds} onToggle={onToggleWeekly} />
                </div>
            </div>
        </div>
    );
}

function RefSection({ title, rows }: { title: string; rows: { id: string; label: string; detail: string; highlight?: boolean }[] }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {title}
            </div>
            <div className="p-1.5 flex flex-col gap-1">
                {rows.map((r) => (
                    <div key={r.id} className={`px-2.5 py-2 rounded-lg border bg-slate-950/40 ${r.highlight ? "border-amber-700/50 bg-amber-950/20" : "border-slate-800"}`}>
                        <div className={`text-sm font-medium ${r.highlight ? "text-amber-300" : "text-slate-300"}`}>{r.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5 leading-snug">{r.detail}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Customize panel — grouped by bucket, with Conclave shown as its own group
function CustomizePanel({
    eligibleTasks,
    hiddenTaskIds,
    onToggle,
    onShowAll,
    onHideAll,
}: {
    eligibleTasks: TaskDef[];
    hiddenTaskIds: string[];
    onToggle: (id: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
}) {
    const hiddenCount  = eligibleTasks.filter((t) =>  hiddenTaskIds.includes(t.id)).length;
    const visibleCount = eligibleTasks.filter((t) => !hiddenTaskIds.includes(t.id)).length;

    // Build groups — Conclave renders as one group (daily + weekly together)
    type Group = { key: string; label: string; sub?: string; tasks: TaskDef[] };
    const groups: Group[] = [
        { key: "primary_daily",   label: BUCKET_LABEL.primary_daily,   sub: BUCKET_SUB.primary_daily,   tasks: eligibleTasks.filter((t) => t.bucket === "primary_daily") },
        { key: "secondary_daily", label: BUCKET_LABEL.secondary_daily, sub: BUCKET_SUB.secondary_daily, tasks: eligibleTasks.filter((t) => t.bucket === "secondary_daily") },
        { key: "weekly_monday",   label: BUCKET_LABEL.weekly_monday,   sub: BUCKET_SUB.weekly_monday,   tasks: eligibleTasks.filter((t) => t.bucket === "weekly_monday") },
        { key: "conclave",        label: "Conclave",                   sub: "Daily 16:00 · Weekly Fri", tasks: eligibleTasks.filter((t) => t.bucket === "conclave") },
    ].filter((g) => g.tasks.length > 0);

    return (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-100">Customize visible tasks</div>
                    <div className="text-xs text-slate-400 mt-1">Uncheck tasks you never want to see. Changes are saved automatically.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {hiddenCount > 0 && (
                        <button
                            className="text-xs border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded px-2.5 py-1 transition-colors"
                            onClick={onShowAll}
                        >
                            Show all ({hiddenCount} hidden)
                        </button>
                    )}
                    {visibleCount > 0 && (
                        <button
                            className="text-xs border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded px-2.5 py-1 transition-colors"
                            onClick={onHideAll}
                        >
                            Hide all
                        </button>
                    )}
                </div>
            </div>

            {groups.map(({ key, label, sub, tasks }) => (
                <div key={key}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        {label}
                        {sub && <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-600">{sub}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                        {tasks.map((t) => {
                            const hidden = hiddenTaskIds.includes(t.id);
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => onToggle(t.id)}
                                    className={[
                                        "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left w-full transition-all",
                                        hidden
                                            ? "border-slate-800 bg-slate-950/20 opacity-40 hover:opacity-70"
                                            : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50",
                                    ].join(" ")}
                                >
                                    <div className={[
                                        "flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors",
                                        hidden ? "border-slate-700 bg-slate-900" : "border-slate-400 bg-slate-600",
                                    ].join(" ")}>
                                        {!hidden && (
                                            <svg className="w-2.5 h-2.5 text-slate-100" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-sm font-medium leading-tight ${hidden ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                            {t.label}
                                            {t.conclaveSub && (
                                                <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                                                    {t.conclaveSub === "conclave_daily" ? "daily" : "weekly"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function WarframeResetTracker() {
    const completedPrereqs = useTrackerStore((s) => s.state.prereqs.completed) ?? {};
    const syndicates       = useTrackerStore((s) => s.state.syndicates) ?? [];

    const [rc,  setRc]          = useState<RCState>(() => loadState());
    const [now, setNow]         = useState(() => new Date());
    const [showHelp, setHelp]   = useState(false);
    const [showCustomize, setCustomize] = useState(false);
    const [selected, setSel]    = useState<Bucket>("primary_daily");

    useEffect(() => { saveState(rc); }, [rc]);

    useEffect(() => {
        const tick = () => { const n = new Date(); setNow(n); setRc((p) => syncResets(p, n)); };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const nextResets = useMemo(() => getNextResets(now), [now]);
    const baro       = useMemo(() => getBaroStatus(now), [now]);

    // Current completed IDs for standard buckets
    const completedIds = useMemo((): Record<Exclude<Bucket, "conclave">, string[]> & { conclave_daily: string[]; conclave_weekly: string[] } => {
        const keys = getCurrentKeys(now);
        const get = (rk: keyof RCState, ck: keyof RCState, key: string) =>
            rc[rk] === key ? (rc[ck] as string[]) : [];
        return {
            primary_daily:   get("primaryDailyResetKey",   "completedPrimaryDailyTaskIds",   keys.primary_daily),
            secondary_daily: get("secondaryDailyResetKey", "completedSecondaryDailyTaskIds", keys.secondary_daily),
            weekly_monday:   get("weeklyMondayResetKey",   "completedWeeklyMondayTaskIds",   keys.weekly_monday),
            conclave_daily:  get("conclaveDailyResetKey",  "completedConclaveDailyTaskIds",  keys.conclave_daily),
            conclave_weekly: get("conclaveWeeklyResetKey", "completedConclaveWeeklyTaskIds", keys.conclave_weekly),
        };
    }, [rc, now]);

    // All tasks passing prereq + pledge gates (no hidden filter — for Customize panel)
    const eligibleTasks = useMemo(
        () => getEligibleTasks(completedPrereqs, syndicates),
        [completedPrereqs, syndicates]
    );

    // Visible = eligible minus user-hidden
    const visibleTasks = useMemo(
        () => eligibleTasks.filter((t) => !rc.hiddenTaskIds.includes(t.id)),
        [eligibleTasks, rc.hiddenTaskIds]
    );

    // Pledge nudge
    const anyPledged = useMemo(
        () => syndicates.some((s) => s.pledged && RELAY_FACTION_IDS.has(s.id as SyndicateId)),
        [syndicates]
    );

    // Per-bucket visible task slices
    const byBucket = useCallback((b: Exclude<Bucket, "conclave">) => visibleTasks.filter((t) => t.bucket === b), [visibleTasks]);
    const conclaveDaily  = useMemo(() => visibleTasks.filter((t) => t.bucket === "conclave" && t.conclaveSub === "conclave_daily"),  [visibleTasks]);
    const conclaveWeekly = useMemo(() => visibleTasks.filter((t) => t.bucket === "conclave" && t.conclaveSub === "conclave_weekly"), [visibleTasks]);

    // Urgency — for conclave use the nearer of the two sub-resets
    const msFor = useCallback((b: Bucket): number => {
        if (b === "conclave") {
            const dms = Math.max(0, nextResets.conclave_daily.getTime()  - now.getTime());
            const wms = Math.max(0, nextResets.conclave_weekly.getTime() - now.getTime());
            return Math.min(dms, wms);
        }
        return Math.max(0, nextResets[b].getTime() - now.getTime());
    }, [nextResets, now]);

    const tierFor = useCallback((b: Bucket) => urgTier(msFor(b), b), [msFor]);

    // For the timer card progress bar on Conclave — combined completion
    const conclaveTotalTasks = conclaveDaily.length + conclaveWeekly.length;
    const conclaveTotalDone  = completedIds.conclave_daily.length + completedIds.conclave_weekly.length;

    // ── Auto-hide buckets where every eligible task is user-hidden ──────────────
    // A bucket is "fully hidden" if eligible tasks exist but all are in hiddenTaskIds.
    const eligibleByBucket = useMemo(() => ({
        primary_daily:   eligibleTasks.filter((t) => t.bucket === "primary_daily"),
        secondary_daily: eligibleTasks.filter((t) => t.bucket === "secondary_daily"),
        weekly_monday:   eligibleTasks.filter((t) => t.bucket === "weekly_monday"),
        conclave:        eligibleTasks.filter((t) => t.bucket === "conclave"),
    }), [eligibleTasks]);

    const isBucketFullyHidden = useCallback((b: Bucket): boolean => {
        const eligible = eligibleByBucket[b];
        if (eligible.length === 0) return false; // no tasks at all → still show (edge case)
        return eligible.every((t) => rc.hiddenTaskIds.includes(t.id));
    }, [eligibleByBucket, rc.hiddenTaskIds]);

    const visibleBuckets = useMemo(
        () => BUCKET_ORDER.filter((b) => !isBucketFullyHidden(b)),
        [isBucketFullyHidden]
    );

    // If selected bucket gets hidden, fall back to primary
    useEffect(() => {
        if (!visibleBuckets.includes(selected)) {
            setSel(visibleBuckets[0] ?? "primary_daily");
        }
    }, [visibleBuckets, selected]);

    // ── Mutations ──────────────────────────────────────────────────────────────

    const toggleStandard = useCallback((id: string, ck: keyof RCState) => {
        setRc((prev) => {
            const list = [...(prev[ck] as string[])];
            const idx  = list.indexOf(id);
            if (idx >= 0) list.splice(idx, 1); else list.push(id);
            return { ...prev, [ck]: list };
        });
    }, []);

    const toggle = useCallback((id: string, bucket: Bucket) => {
        if (bucket === "primary_daily")   return toggleStandard(id, "completedPrimaryDailyTaskIds");
        if (bucket === "secondary_daily") return toggleStandard(id, "completedSecondaryDailyTaskIds");
        if (bucket === "weekly_monday")   return toggleStandard(id, "completedWeeklyMondayTaskIds");
    }, [toggleStandard]);

    const clearBucket = useCallback((ck: keyof RCState) => setRc((p) => ({ ...p, [ck]: [] })), []);

    const setMode      = useCallback((m: TimeMode) => setRc((p) => ({ ...p, timeMode: m })), []);
    const toggleHidden = useCallback((id: string) => {
        setRc((prev) => {
            const list = [...prev.hiddenTaskIds];
            const idx  = list.indexOf(id);
            if (idx >= 0) list.splice(idx, 1); else list.push(id);
            return { ...prev, hiddenTaskIds: list };
        });
    }, []);
    const showAll = useCallback(() => setRc((p) => ({ ...p, hiddenTaskIds: [] })), []);
    const hideAll = useCallback(() => setRc((p) => ({ ...p, hiddenTaskIds: eligibleTasks.map((t) => t.id) })), [eligibleTasks]);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-4">

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold">Reset Tracker</div>
                    <div className="text-sm text-slate-400 mt-1">
                        Click a timer to view its tasks · completed tasks sink to bottom · auto-clears on rollover
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className={["text-xs font-medium border rounded px-3 py-1.5 transition-colors", showCustomize ? "bg-slate-700 border-slate-600 text-slate-100" : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"].join(" ")}
                        onClick={() => { setCustomize((v) => !v); setHelp(false); }}
                    >
                        Customize
                        {rc.hiddenTaskIds.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300">
                                {rc.hiddenTaskIds.length} hidden
                            </span>
                        )}
                    </button>
                    <button
                        className={["w-7 h-7 rounded-full border text-xs flex items-center justify-center transition-colors", showHelp ? "bg-slate-700 border-slate-600 text-slate-100" : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"].join(" ")}
                        onClick={() => { setHelp((v) => !v); setCustomize(false); }}
                    >?</button>
                    <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                        <button className={`px-3 py-1.5 font-medium transition-colors ${rc.timeMode === "utc"   ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`} onClick={() => setMode("utc")}>UTC</button>
                        <button className={`px-3 py-1.5 font-medium transition-colors ${rc.timeMode === "local" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`} onClick={() => setMode("local")}>Local</button>
                    </div>
                </div>
            </div>

            {/* Baro Ki'Teer presence banner */}
            {baro.present && (
                <div className="rounded-xl border border-amber-600/60 bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Pulsing dot */}
                        <span className="relative flex-shrink-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                        </span>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-amber-300">
                                Baro Ki'Teer is at the Relay
                            </div>
                            <div className="text-xs text-amber-500/80 mt-0.5">
                                Visit before he leaves — check the Void Trader at any Relay
                            </div>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Leaves in</div>
                        <div className="text-lg font-semibold tabular-nums text-amber-300 leading-tight">
                            {fmtMs(baro.timeLeftMs)}
                        </div>
                    </div>
                </div>
            )}

            {/* Pledge nudge */}
            {!anyPledged && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-2.5 text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Tip:</span>{" "}
                    All 6 relay faction standing tasks are shown because no pledge is set.
                    Mark your pledged faction(s) on the <span className="text-slate-300">Syndicates</span> page to show only those here.
                </div>
            )}

            {/* Help */}
            {showHelp && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400 leading-relaxed">
                    Each bucket auto-clears when its window rolls over. Countdown colors shift from{" "}
                    <span className="text-emerald-400 font-medium">green</span> →{" "}
                    <span className="text-amber-400 font-medium">amber</span> →{" "}
                    <span className="text-red-400 font-medium">red</span>{" "}
                    as the reset approaches (35% and 10% thresholds). Conclave runs its own daily reset at 16:00 UTC and
                    a weekly reset every Friday. Relay faction standing filters to your pledged faction(s).
                    Use <strong className="text-slate-300">Customize</strong> to permanently hide tasks — if you hide
                    every task in a bucket, that timer card is suppressed entirely.
                </div>
            )}

            {/* Customize panel */}
            {showCustomize && (
                <CustomizePanel
                    eligibleTasks={eligibleTasks}
                    hiddenTaskIds={rc.hiddenTaskIds}
                    onToggle={toggleHidden}
                    onShowAll={showAll}
                    onHideAll={hideAll}
                />
            )}

            {/* Timer strip — only visible buckets */}
            <div className={`grid gap-3 ${visibleBuckets.length === 4 ? "grid-cols-2 lg:grid-cols-4" : visibleBuckets.length === 3 ? "grid-cols-2 lg:grid-cols-3" : visibleBuckets.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {visibleBuckets.map((b) => {
                    const isConclave = b === "conclave";
                    const tasks      = isConclave ? conclaveTotalTasks : byBucket(b as Exclude<Bucket, "conclave">).length;
                    const rawDone    = isConclave
                        ? conclaveTotalDone
                        : (completedIds[b as Exclude<Bucket, "conclave">] as string[]).length;
                    // For weekly_monday, netracells counts as 1 completed task when all 5 runs are done,
                    // but the completedIds list doesn't include it — add 1 if runs === 5
                    const netracellBonus = (b === "weekly_monday" && rc.netracellRuns >= 5) ? 1 : 0;
                    const done    = rawDone + netracellBonus;
                    const pct     = tasks > 0 ? Math.round((done / tasks) * 100) : 0;
                    const ms      = msFor(b);
                    const tier    = tierFor(b);
                    const allDone = tasks > 0 && done === tasks;

                    return (
                        <button
                            key={b}
                            onClick={() => setSel(b)}
                            className={["rounded-xl border-l-[3px] p-3 text-left transition-all", URG_BORDER_L[tier], selected === b ? "border border-slate-600 bg-slate-900" : "border border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"].join(" ")}
                        >
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                {BUCKET_LABEL[b]}
                            </div>
                            <div className={`text-xl font-semibold mt-1.5 tabular-nums ${URG_COUNTDOWN[tier]}`}>
                                {fmtMs(ms)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                                {isConclave ? `Next daily ${fmtAbs(nextResets.conclave_daily, rc.timeMode)}` : fmtAbs(nextResets[b], rc.timeMode)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${URG_BAR[tier]}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`text-[11px] tabular-nums ${allDone ? "text-emerald-400" : "text-slate-500"}`}>
                                    {done}/{tasks}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Active task panel */}
            {selected === "conclave" ? (
                <ConclavePanel
                    dailyTasks={conclaveDaily}
                    weeklyTasks={conclaveWeekly}
                    completedDailyIds={completedIds.conclave_daily}
                    completedWeeklyIds={completedIds.conclave_weekly}
                    tier={tierFor("conclave")}
                    nextDailyReset={nextResets.conclave_daily}
                    nextWeeklyReset={nextResets.conclave_weekly}
                    timeMode={rc.timeMode}
                    onToggleDaily={(id) => toggleStandard(id, "completedConclaveDailyTaskIds")}
                    onToggleWeekly={(id) => toggleStandard(id, "completedConclaveWeeklyTaskIds")}
                    onClearDaily={() => clearBucket("completedConclaveDailyTaskIds")}
                    onClearWeekly={() => clearBucket("completedConclaveWeeklyTaskIds")}
                />
            ) : (
                <TaskPanel
                    bucket={selected}
                    tasks={byBucket(selected as Exclude<Bucket, "conclave">)}
                    completedIds={completedIds[selected as Exclude<Bucket, "conclave">] as string[]}
                    tier={tierFor(selected)}
                    onToggle={(id) => toggle(id, selected)}
                    onClear={() => clearBucket(COMPLETED_KEY[selected as Exclude<Bucket, "conclave">]!)}
                    netracellRuns={rc.netracellRuns}
                    onNetracellChange={(n) => setRc((p) => ({ ...p, netracellRuns: n }))}
                />
            )}

            {/* Reference grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <RefSection
                    title="Bi-Weekly"
                    rows={[{ id: "baro", label: baro.label, detail: baro.detail, highlight: baro.present }]}
                />
                <RefSection title="Timed Rotations"   rows={TIMED_REF} />
                <RefSection title="Monthly Reference"  rows={MONTHLY_REF} />
                <RefSection title="Event-Driven"       rows={EVENT_REF} />
            </div>
        </div>
    );
}
