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
//  - Baro Ki'Teer reference row is live-computed (anchor 2026-03-20T13:00Z, bi-weekly, 48h window).
//  - Temporal Archimedea and Netracells now share logic:
//      * Marking Temporal Archimedea complete adds 2 Netracell/Search Pulse runs.
//      * If 4+ Netracell runs are already spent, Temporal Archimedea is auto-crossed out
//        because 2 surges are required to run it from the shared pool.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTrackerStore } from "../store/store";
import { PR } from "../domain/ids/prereqIds";
import { SY } from "../domain/ids/syndicateIds";
import type { SyndicateState } from "../domain/types";
import { fetchWorldState, getCachedWorldState, type WorldStateData } from "../lib/worldStateCache";

// ─── Types ─────────────────────────────────────────────────────────────────────

// "conclave" replaces "weekly_friday" — it has an internal daily+weekly split.
type Bucket = "primary_daily" | "secondary_daily" | "weekly_monday" | "conclave";
type TimeMode = "utc" | "local";

interface RCState {
    timeMode: TimeMode;
    primaryDailyResetKey: string;
    completedPrimaryDailyTaskIds: string[];
    secondaryDailyResetKey: string;
    completedSecondaryDailyTaskIds: string[];
    weeklyMondayResetKey: string;
    completedWeeklyMondayTaskIds: string[];
    // Conclave has two internal windows — keyed separately so each auto-clears correctly
    conclaveWeeklyResetKey: string;
    completedConclaveWeeklyTaskIds: string[];
    conclaveDailyResetKey: string;
    completedConclaveDailyTaskIds: string[];
    hiddenTaskIds: string[];
    netracellRuns: number;    // 0–5, clears with weekly monday reset
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

type TaskRenderState = "pending" | "completed" | "auto_blocked";

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = "wfpt:resetChecklist";

import type { SyndicateId } from "../domain/ids/syndicateIds";

const RELAY_FACTION_IDS = new Set<SyndicateId>([
    SY.STEEL_MERIDIAN, SY.ARBITERS_OF_HEXIS, SY.CEPHALON_SUDA,
    SY.THE_PERRIN_SEQUENCE, SY.RED_VEIL, SY.NEW_LOKA,
]);

const NETRACELLS_TASK_ID = "netracells";
const TEMPORAL_ARCHIMEDEA_TASK_ID = "temporal_archimedea";

// Window lengths for urgency colouring on the timer card.
// For "conclave" we use the shorter daily window so the card colour is driven
// by whichever deadline is most imminent.
const WINDOW_MS: Record<Bucket, number> = {
    primary_daily: 86_400_000,
    secondary_daily: 86_400_000,
    weekly_monday: 604_800_000,
    conclave: 86_400_000,
};

const BUCKET_LABEL: Record<Bucket, string> = {
    primary_daily: "Primary Daily",
    secondary_daily: "Secondary Daily",
    weekly_monday: "Weekly Reset",
    conclave: "Conclave",
};

function getBucketSub(mode: TimeMode): Record<Bucket, string> {
    return {
        primary_daily: fmtFixedUTC(0, 0, mode),
        secondary_daily: fmtFixedUTC(16, 0, mode),
        weekly_monday: `Mon ${fmtFixedUTC(0, 0, mode)}`,
        conclave: `Daily ${fmtFixedUTC(16, 0, mode)} · Weekly Fri`,
    };
}

const BUCKET_ORDER: Bucket[] = [
    "primary_daily", "secondary_daily", "weekly_monday", "conclave",
];

// For non-conclave buckets only — conclave uses two separate key pairs below.
const COMPLETED_KEY: Partial<Record<Bucket, keyof RCState>> = {
    primary_daily: "completedPrimaryDailyTaskIds",
    secondary_daily: "completedSecondaryDailyTaskIds",
    weekly_monday: "completedWeeklyMondayTaskIds",
};

const RESET_KEY: Partial<Record<Bucket, keyof RCState>> = {
    primary_daily: "primaryDailyResetKey",
    secondary_daily: "secondaryDailyResetKey",
    weekly_monday: "weeklyMondayResetKey",
};

// Baro anchor — 2026-03-20T13:00:00Z, every 14 days, available 48 h
const BARO_ANCHOR_MS = Date.UTC(2026, 2, 20, 13, 0, 0); // month is 0-indexed
const BARO_PERIOD_MS = 14 * 86_400_000;
const BARO_WINDOW_MS = 2 * 86_400_000;

// ─── Task definitions ──────────────────────────────────────────────────────────

const ALL_TASKS: TaskDef[] = [
    // ── Primary Daily — 00:00 UTC ──────────────────────────────────────────────
    { id: "daily_tribute", label: "Daily Tribute", bucket: "primary_daily", description: "Claim the daily login reward." },
    { id: "daily_trade_limit", label: "Daily Trade Limit", bucket: "primary_daily", description: "Use remaining trades before midnight UTC." },
    { id: "daily_gift_limit", label: "Daily Gift Limit", bucket: "primary_daily", description: "Use remaining daily gifts." },
    { id: "focus_daily_cap", label: "Focus Daily Cap", bucket: "primary_daily", description: "Spend today's Focus cap.", prereqIds: [PR.SECOND_DREAM] },

    // Relay faction standing — filtered to pledged faction(s) automatically
    { id: "standing_steel_meridian", label: "Steel Meridian", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.STEEL_MERIDIAN },
    { id: "standing_arbiters", label: "Arbiters of Hexis", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.ARBITERS_OF_HEXIS },
    { id: "standing_suda", label: "Cephalon Suda", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.CEPHALON_SUDA },
    { id: "standing_perrin", label: "Perrin Sequence", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.THE_PERRIN_SEQUENCE },
    { id: "standing_red_veil", label: "Red Veil", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.RED_VEIL },
    { id: "standing_new_loka", label: "New Loka", bucket: "primary_daily", description: "Use today's standing cap.", isFactionStanding: true, factionSyndicateId: SY.NEW_LOKA },

    // Open-world standing
    { id: "standing_ostron", label: "Ostrons", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_CETUS] },
    { id: "standing_the_quills", label: "The Quills", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_CETUS] },
    { id: "standing_solaris", label: "Solaris United", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA] },
    { id: "standing_vox_solaris", label: "Vox Solaris", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA, PR.SECOND_DREAM] },
    { id: "standing_ventkids", label: "Ventkids", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_FORTUNA] },
    { id: "standing_entrati", label: "Entrati", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_NECRALISK] },
    { id: "standing_cavia", label: "Cavia", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_SANCTUM] },
    { id: "standing_necraloid", label: "Necraloid", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_NECRALISK] },
    { id: "standing_the_holdfasts", label: "The Holdfasts", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_ZARIMAN] },
    { id: "standing_the_hex", label: "The Hex", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_HOLLVANIA] },
    { id: "standing_cephalon_simaris", label: "Cephalon Simaris", bucket: "primary_daily", description: "Use today's standing cap.", prereqIds: [PR.HUB_RELAY, PR.NEW_STRANGE] },

    { id: "steel_path_incursions", label: "Steel Path Incursions", bucket: "primary_daily", description: "Finish the day's Steel Path Incursions." },
    { id: "nightwave_daily", label: "Nightwave Daily Acts", bucket: "primary_daily", description: "Complete today's Nightwave daily acts." },
    { id: "argon_decay", label: "Argon Crystal Check", bucket: "primary_daily", description: "Spend Argon before daily decay if needed." },
    { id: "circuit_stage_bonus", label: "Circuit Stage Bonus", bucket: "primary_daily", description: "Use today's Circuit stage bonus.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "acrithis_daily", label: "Acrithis Daily", bucket: "primary_daily", description: "Check current daily Duviri shop offerings.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "kim_daily", label: "KIM Daily Conversations", bucket: "primary_daily", description: "Check new daily KIM messages from Hex members and Roundtable contacts.", prereqIds: [PR.THE_HEX] },

    // ── Secondary Daily — 16:00 UTC ────────────────────────────────────────────
    { id: "sortie_set", label: "Sortie Mission Set", bucket: "secondary_daily", description: "Complete today's Sortie before missions rotate." },
    { id: "syndicate_missions", label: "Syndicate Daily Missions", bucket: "secondary_daily", description: "Finish the current Syndicate mission set." },

    // ── Weekly — Monday 00:00 UTC ──────────────────────────────────────────────
    { id: "archon_hunt", label: "Archon Hunt", bucket: "weekly_monday", description: "Complete this week's Archon Hunt.", prereqIds: [PR.NEW_WAR] },
    { id: NETRACELLS_TASK_ID, label: "Netracells (5 runs)", bucket: "weekly_monday", description: "Use this week's Netracell reward runs. Shares the 5-run Search Pulse pool with Deep Archimedea and Temporal Archimedea.", prereqIds: [PR.WHISPERS_WALL] },
    {
        id: "deep_archimedea",
        label: "Deep Archimedea",
        bucket: "weekly_monday",
        description: "Complete this week's Deep Archimedea.",
        prereqIds: [PR.WHISPERS_WALL],
        isVisible: ({ completedPrereqs, syndicates }) => {
            if (!completedPrereqs[PR.WHISPERS_WALL]) return false;
            return (syndicates.find((s) => s.id === SY.CAVIA)?.rank ?? 0) >= 5;
        },
    },
    { id: "circuit_reward_track", label: "Circuit Reward Track", bucket: "weekly_monday", description: "Push weekly Circuit reward track.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "circuit_incarnon", label: "Circuit Incarnon Genesis", bucket: "weekly_monday", description: "Use current weekly Incarnon rotation.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "nightwave_weekly", label: "Nightwave Weekly Acts", bucket: "weekly_monday", description: "Complete this week's Nightwave weekly acts." },
    { id: "nightwave_elite", label: "Nightwave Elite Weekly", bucket: "weekly_monday", description: "Complete this week's Nightwave elite acts." },
    { id: "helminth_invigoration", label: "Helminth Invigoration", bucket: "weekly_monday", description: "Use the current weekly Helminth Invigoration.", prereqIds: [PR.SEGMENT_HELMINTH_INVIGORATION] },
    { id: "steel_path_honors", label: "Steel Path Honors", bucket: "weekly_monday", description: "Check or buy this week's Steel Path Honors." },
    { id: "palladino_weekly", label: "Palladino — Iron Wake", bucket: "weekly_monday", description: "Check this week's Palladino offerings." },
    { id: "yonta_weekly", label: "Yonta — Weekly Kuva", bucket: "weekly_monday", description: "Claim Yonta's weekly Kuva purchase.", prereqIds: [PR.HUB_ZARIMAN] },
    {
        id: "bird3_weekly",
        label: "Bird-3 — Archon Shard",
        bucket: "weekly_monday",
        description: "Check Bird-3's weekly shard purchase. Requires Cavia rank 5 (Family).",
        prereqIds: [PR.HUB_SANCTUM],
        isVisible: ({ completedPrereqs, syndicates }) => {
            if (!completedPrereqs[PR.HUB_SANCTUM]) return false;
            return (syndicates.find((s) => s.id === SY.CAVIA)?.rank ?? 0) >= 5;
        },
    },
    { id: "acrithis_weekly", label: "Acrithis Weekly Shop", bucket: "weekly_monday", description: "Review the weekly Acrithis inventory.", prereqIds: [PR.DUVIRI_PARADOX] },
    { id: "break_narmer", label: "Break Narmer (Kahl)", bucket: "weekly_monday", description: "Complete the weekly Kahl mission.", prereqIds: [PR.VEILBREAKER] },
    { id: "maroo", label: "Maroo — Ayatan Hunt", bucket: "weekly_monday", description: "Run the weekly Ayatan Treasure Hunt." },
    { id: "help_clem", label: "Help Clem", bucket: "weekly_monday", description: "Run the weekly Help Clem mission." },
    { id: "the_descendia_normal", label: "The Descendia (Normal)", bucket: "weekly_monday", description: "Complete this week's Normal Descendia run. Separate reward table from Steel Path.", prereqIds: [PR.THE_OLD_PEACE] },
    { id: "the_descendia_sp", label: "The Descendia (Steel Path)", bucket: "weekly_monday", description: "Complete this week's Steel Path Descendia run. Separate reward table from Normal.", prereqIds: [PR.THE_OLD_PEACE] },
    { id: "kaya_weekly", label: "Kaya — Weekly Arcane", bucket: "weekly_monday", description: "Check Kaya's weekly Arcane Enhancement offering.", prereqIds: [PR.THE_HEX] },
    {
        id: TEMPORAL_ARCHIMEDEA_TASK_ID,
        label: "Temporal Archimedea",
        bucket: "weekly_monday",
        description: "Complete this week's Temporal Archimedea. Uses the shared 5-run Search Pulse pool with Netracells and Deep Archimedea.",
        prereqIds: [PR.THE_HEX],
        isVisible: ({ completedPrereqs, syndicates }) => {
            if (!completedPrereqs[PR.THE_HEX]) return false;
            return (syndicates.find((s) => s.id === SY.THE_HEX)?.rank ?? 0) >= 5;
        },
    },
    { id: "calendar_1999", label: "1999 Calendar Season", bucket: "weekly_monday", description: "Check weekly calendar To Do tasks, prize selection, and Hex Override choices.", prereqIds: [PR.THE_HEX] },

    // ── Conclave — Daily 16:00 UTC ─────────────────────────────────────────────
    { id: "conclave_daily_standing", label: "Conclave Standing", bucket: "conclave", conclaveSub: "conclave_daily", description: "Use today's Conclave standing cap.", prereqIds: [PR.HUB_RELAY] },
    { id: "conclave_daily_challenges", label: "Conclave Daily Challenges", bucket: "conclave", conclaveSub: "conclave_daily", description: "Complete today's Conclave daily challenges.", prereqIds: [PR.HUB_RELAY] },

    // ── Conclave — Weekly Friday 00:00 UTC ────────────────────────────────────
    { id: "conclave_weekly_challenges", label: "Conclave Weekly Challenges", bucket: "conclave", conclaveSub: "conclave_weekly", description: "Finish this week's Conclave weekly challenges.", prereqIds: [PR.HUB_RELAY] },
];


function getMonthlyRef(mode: TimeMode) {
    return [{ id: "prime", label: "Prime Resurgence", detail: `Approximate monthly rotation ~${fmtFixedUTC(18, 0, mode)}. Reference only.` }];
}

const EVENT_REF = [
    { id: "world", label: "World Events", detail: "Ghoul Purge, Thermia, Razorback, Fomorian, Plague Star." },
    { id: "seasonal", label: "Seasonal Events", detail: "Star Days, Dog Days, Naberus, Lunar New Year, Christmas." },
];

// ─── Time helpers ───────────────────────────────────────────────────────────────

function utcKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

// Key for conclave daily — date string for the 16:00 UTC window currently active
function conclaveDailyKey(now: Date): string {
    const threshold = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16));
    if (now >= threshold) return utcKey(threshold);
    const prev = new Date(threshold);
    prev.setUTCDate(prev.getUTCDate() - 1);
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
    const secKey = now >= st ? utcKey(st) : (() => {
        const p = new Date(st);
        p.setUTCDate(p.getUTCDate() - 1);
        return utcKey(p);
    })();

    return {
        primary_daily: utcKey(now),
        secondary_daily: secKey,
        weekly_monday: utcKey(mb),
        conclave_daily: conclaveDailyKey(now),
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
        primary_daily: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)),
        secondary_daily: now < st ? st : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 16)),
        weekly_monday: nm,
        conclave: nextConcDaily,
        conclave_daily: nextConcDaily,
        conclave_weekly: nf,
    };
}

function fmtMs(ms: number): string {
    const t = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(t / 86400);
    const h = Math.floor((t % 86400) / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

const TZ_KEY = "wft_timezone_v1";
function getDisplayTimezone(): string {
    return localStorage.getItem(TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function fmtAbs(date: Date, mode: TimeMode): string {
    if (mode === "utc") {
        const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        const t = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
        return `${wd} ${t} UTC`;
    }
    const tz = getDisplayTimezone();
    const wd = date.toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
    const t = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
    return `${wd} ${t}`;
}

/** Format a fixed UTC hour:minute as either "HH:MM UTC" or its equivalent in the user's timezone */
function fmtFixedUTC(utcHour: number, utcMinute: number, mode: TimeMode): string {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, utcMinute));
    if (mode === "utc") {
        const hh = String(utcHour).padStart(2, "0");
        const mm = String(utcMinute).padStart(2, "0");
        return `${hh}:${mm} UTC`;
    }
    const tz = getDisplayTimezone();
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
}

function urgTier(ms: number, bucket: Bucket): "safe" | "warn" | "crit" {
    const r = ms / WINDOW_MS[bucket];
    return r <= 0.10 ? "crit" : r <= 0.35 ? "warn" : "safe";
}

const URG_COUNTDOWN: Record<string, string> = { safe: "text-emerald-400", warn: "text-amber-400", crit: "text-red-400" };
const URG_BAR: Record<string, string> = { safe: "bg-emerald-500", warn: "bg-amber-500", crit: "bg-red-500" };
const URG_BORDER_L: Record<string, string> = { safe: "border-l-emerald-600", warn: "border-l-amber-600", crit: "border-l-red-600" };
const URG_TITLE: Record<string, string> = { safe: "text-emerald-400", warn: "text-amber-400", crit: "text-red-400" };

// ─── Shared weekly Search Pulse helpers ────────────────────────────────────────

function isTemporalArchimedeaAutoBlocked(netracellRuns: number, completedIds: string[]): boolean {
    return netracellRuns >= 4 && !completedIds.includes(TEMPORAL_ARCHIMEDEA_TASK_ID);
}

function getTaskRenderState(task: TaskDef, completedIds: string[], netracellRuns: number): TaskRenderState {
    if (task.id === NETRACELLS_TASK_ID) {
        return netracellRuns >= 5 ? "completed" : "pending";
    }

    if (task.id === TEMPORAL_ARCHIMEDEA_TASK_ID) {
        if (completedIds.includes(TEMPORAL_ARCHIMEDEA_TASK_ID)) return "completed";
        if (isTemporalArchimedeaAutoBlocked(netracellRuns, completedIds)) return "auto_blocked";
        return "pending";
    }

    return completedIds.includes(task.id) ? "completed" : "pending";
}

function getTaskDescription(task: TaskDef, completedIds: string[], netracellRuns: number): string {
    if (task.id === NETRACELLS_TASK_ID) {
        if (completedIds.includes(TEMPORAL_ARCHIMEDEA_TASK_ID)) {
            return "Use this week's Netracell reward runs. Temporal Archimedea already consumed 2 Search Pulses from the shared 5-run pool with Netracells and Deep Archimedea.";
        }
        return "Use this week's Netracell reward runs. Shares the 5-run Search Pulse pool with Deep Archimedea and Temporal Archimedea.";
    }

    if (task.id === TEMPORAL_ARCHIMEDEA_TASK_ID) {
        if (completedIds.includes(TEMPORAL_ARCHIMEDEA_TASK_ID)) {
            return "Completed. This consumed 2 Search Pulses from the shared 5-run pool with Netracells and Deep Archimedea.";
        }
        if (isTemporalArchimedeaAutoBlocked(netracellRuns, completedIds)) {
            return "Crossed out because 4 or more of the 5 shared Search Pulses are already spent on Netracells. Temporal Archimedea needs 2 remaining surges from that pool, so it can no longer be completed this week.";
        }
        return "Complete this week's Temporal Archimedea. Marking this complete consumes 2 Search Pulses from the shared 5-run pool with Netracells and Deep Archimedea.";
    }

    return task.description;
}

function getCompletedTaskCount(tasks: TaskDef[], completedIds: string[], netracellRuns: number): number {
    return tasks.filter((task) => getTaskRenderState(task, completedIds, netracellRuns) !== "pending").length;
}

// ─── Baro Ki'Teer live computation ─────────────────────────────────────────────

function getBaroStatus(now: Date, mode: TimeMode = "utc"): { present: boolean; label: string; detail: string; timeLeftMs: number; timeUntilMs: number } {
    const ms = now.getTime();
    const offset = ((ms - BARO_ANCHOR_MS) % BARO_PERIOD_MS + BARO_PERIOD_MS) % BARO_PERIOD_MS;
    const cycleStart = ms - offset;
    const leaveMs = cycleStart + BARO_WINDOW_MS;
    const nextArrivalMs = cycleStart + BARO_PERIOD_MS;
    const baroTime = fmtFixedUTC(13, 0, mode);

    if (ms < leaveMs) {
        const remaining = leaveMs - ms;
        return {
            present: true,
            label: "Baro Ki'Teer — HERE NOW",
            detail: `Leaves in ${fmtMs(remaining)} · Every other Friday, 48 h window`,
            timeLeftMs: remaining,
            timeUntilMs: 0,
        };
    }

    const until = nextArrivalMs - ms;
    return {
        present: false,
        label: "Baro Ki'Teer",
        detail: `Arrives in ${fmtMs(until)} · Every other Friday at ${baroTime}, 48 h window`,
        timeLeftMs: 0,
        timeUntilMs: until,
    };
}

// ─── LocalStorage ───────────────────────────────────────────────────────────────

function makeDefault(now: Date): RCState {
    const keys = getCurrentKeys(now);
    return {
        timeMode: "utc",
        primaryDailyResetKey: keys.primary_daily,
        completedPrimaryDailyTaskIds: [],
        secondaryDailyResetKey: keys.secondary_daily,
        completedSecondaryDailyTaskIds: [],
        weeklyMondayResetKey: keys.weekly_monday,
        completedWeeklyMondayTaskIds: [],
        conclaveWeeklyResetKey: keys.conclave_weekly,
        completedConclaveWeeklyTaskIds: [],
        conclaveDailyResetKey: keys.conclave_daily,
        completedConclaveDailyTaskIds: [],
        hiddenTaskIds: [],
        netracellRuns: 0,
    };
}

function loadState(): RCState {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as RCState;
            if (!Array.isArray(parsed.hiddenTaskIds)) parsed.hiddenTaskIds = [];
            if (!Array.isArray(parsed.completedConclaveWeeklyTaskIds)) parsed.completedConclaveWeeklyTaskIds = [];
            if (!Array.isArray(parsed.completedConclaveDailyTaskIds)) parsed.completedConclaveDailyTaskIds = [];
            if (!parsed.conclaveWeeklyResetKey) parsed.conclaveWeeklyResetKey = conclaveWeeklyKey(new Date());
            if (!parsed.conclaveDailyResetKey) parsed.conclaveDailyResetKey = conclaveDailyKey(new Date());
            if (typeof parsed.netracellRuns !== "number") parsed.netracellRuns = 0;
            return parsed;
        }
    } catch {
        // ignore malformed local state
    }
    return makeDefault(new Date());
}

function saveState(s: RCState): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    } catch {
        // ignore storage write errors
    }
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
    if (next.conclaveDailyResetKey !== keys.conclave_daily) next = { ...next, conclaveDailyResetKey: keys.conclave_daily, completedConclaveDailyTaskIds: [] };
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
function NetracellCounter({
    runs,
    onChange,
    description,
}: {
    runs: number;
    onChange: (n: number) => void;
    description: string;
}) {
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
            <div
                className={[
                    "flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center",
                    done ? "border-emerald-800 bg-emerald-950/30" : "border-slate-600 bg-slate-900",
                ].join(" ")}
            >
                {done && <CheckIcon />}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium leading-tight ${done ? "text-emerald-500" : "text-slate-200"}`}>
                    Netracells
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                    {Array.from({ length: 5 }, (_, i) => {
                        const filled = i < runs;
                        return (
                            <button
                                key={i}
                                title={`${i + 1} / 5`}
                                onClick={(e) => {
                                    e.stopPropagation();
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

// ─── World State inline hints ───────────────────────────────────────────────────

const FACTION_COLOR: Record<string, string> = {
    Grineer: "text-red-400", Corpus: "text-blue-400",
    Infested: "text-green-400", Infestation: "text-green-400",
    Corrupted: "text-violet-400", Orokin: "text-violet-400",
};

function WsChip({ children, color = "text-slate-400", bg = "bg-slate-800/60", border = "border-slate-700/50" }: {
    children: React.ReactNode; color?: string; bg?: string; border?: string;
}) {
    return (
        <span className={`inline-block rounded-full border px-1.5 py-px text-[9px] font-medium leading-tight ${color} ${bg} ${border}`}>
            {children}
        </span>
    );
}

// ─── Calendar helpers + modal ────────────────────────────────────────────────────

const CAL_EVENT_META: Record<string, { dot: string; label: string; textColor: string }> = {
    "To Do":      { dot: "bg-sky-400",    label: "To Do",      textColor: "text-sky-300"    },
    "Big Prize!": { dot: "bg-amber-400",  label: "Big Prize!", textColor: "text-amber-300"  },
    "Override":   { dot: "bg-violet-400", label: "Override",   textColor: "text-violet-300" },
};

type CalEntry = { dayIndex: number; date: Date; events: Record<string, string | undefined> };
type MonthGroup = { key: string; label: string; startDow: number; daysInMonth: number; entries: Map<number, CalEntry> };

function parseCalDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function groupCalendarByMonth(days: NonNullable<WorldStateData["calendar"]>["days"]): MonthGroup[] {
    const groups = new Map<string, MonthGroup>();
    days.forEach((day, idx) => {
        const d = parseCalDate(day.date);
        if (!d) return;
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        if (!groups.has(key)) {
            const firstOfMonth = new Date(Date.UTC(year, month, 1));
            const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
            const label = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
            groups.set(key, { key, label, startDow: firstOfMonth.getUTCDay(), daysInMonth, entries: new Map() });
        }
        groups.get(key)!.entries.set(d.getUTCDate(), { dayIndex: idx, date: d, events: day.events });
    });
    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function TrackerCalendarModal({ calendar, onClose }: {
    calendar: NonNullable<WorldStateData["calendar"]>;
    onClose: () => void;
}) {
    const [selectedEntry, setSelectedEntry] = useState<CalEntry | null>(null);
    const months = useMemo(() => groupCalendarByMonth(calendar.days ?? []), [calendar.days]);
    const todayDayIndex = calendar.currentDay !== undefined ? Number(calendar.currentDay) : -1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative z-10 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
                    <div>
                        <div className="text-base font-semibold text-slate-100">1999 Calendar Season</div>
                        <div className="text-xs text-slate-500 mt-0.5">Weekly challenges, prizes, and Hex Override choices</div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 px-5 py-2.5 border-b border-slate-800/50 bg-slate-950/80">
                    {Object.entries(CAL_EVENT_META).map(([key, meta]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                            <span className={`text-[11px] ${meta.textColor}`}>{meta.label}</span>
                        </div>
                    ))}
                    <span className="ml-auto text-[11px] text-slate-600">Click a day for details</span>
                </div>

                {/* Month grids */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {months.map((month) => (
                        <div key={month.key}>
                            <div className="text-sm font-semibold text-slate-300 mb-3">{month.label}</div>
                            <div className="grid grid-cols-7 mb-1">
                                {DOW_LABELS.map((l) => (
                                    <div key={l} className="text-center text-[10px] text-slate-600 font-medium py-1">{l}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                                {Array.from({ length: month.startDow }, (_, i) => (
                                    <div key={`blank-${i}`} />
                                ))}
                                {Array.from({ length: month.daysInMonth }, (_, i) => {
                                    const dayNum = i + 1;
                                    const entry = month.entries.get(dayNum);
                                    const isToday = entry?.dayIndex === todayDayIndex;
                                    const isSelected = selectedEntry != null && selectedEntry.dayIndex === entry?.dayIndex;
                                    const eventKeys = entry ? Object.entries(entry.events).filter(([, v]) => v).map(([k]) => k) : [];
                                    return (
                                        <button
                                            key={dayNum}
                                            onClick={() => entry && setSelectedEntry(isSelected ? null : entry)}
                                            disabled={!entry}
                                            className={[
                                                "relative flex flex-col items-center rounded-lg py-1 px-0.5 min-h-[40px] transition-colors",
                                                entry ? "hover:bg-slate-800 cursor-pointer" : "cursor-default",
                                                isToday ? "ring-1 ring-blue-500/60 bg-slate-800/70" : "",
                                                isSelected ? "bg-slate-700 ring-1 ring-slate-500" : "",
                                            ].join(" ")}
                                        >
                                            <span className={`text-[11px] font-medium ${isToday ? "text-blue-300" : entry ? "text-slate-300" : "text-slate-700"}`}>
                                                {dayNum}
                                            </span>
                                            {eventKeys.length > 0 && (
                                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                                    {eventKeys.map((k) => (
                                                        <div key={k} className={`w-1.5 h-1.5 rounded-full ${CAL_EVENT_META[k]?.dot ?? "bg-slate-500"}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected day detail */}
                {selectedEntry && (
                    <div className="border-t border-slate-800 px-5 py-4 bg-slate-900/40">
                        <div className="text-xs font-medium text-slate-400 mb-3">
                            {selectedEntry.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        </div>
                        <div className="space-y-2">
                            {Object.entries(selectedEntry.events).filter(([, v]) => v).map(([type, value]) => {
                                const meta = CAL_EVENT_META[type];
                                return (
                                    <div key={type} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {meta && <div className={`w-2 h-2 rounded-full ${meta.dot}`} />}
                                            <div className={`text-xs font-semibold ${meta?.textColor ?? "text-slate-400"}`}>{type}</div>
                                        </div>
                                        <div className="text-sm text-slate-200 leading-snug">{value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CalendarHint({ calendar }: { calendar: NonNullable<WorldStateData["calendar"]> }) {
    const [open, setOpen] = useState(false);
    const todayIdx = calendar.currentDay !== undefined ? Number(calendar.currentDay) : -1;
    const today = todayIdx >= 0 && todayIdx < calendar.days.length ? calendar.days[todayIdx] : null;
    const todayEventKeys = today ? Object.entries(today.events).filter(([, v]) => v).map(([k]) => k) : [];

    return (
        <>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {todayEventKeys.length > 0 ? (
                    todayEventKeys.map((k) => {
                        const meta = CAL_EVENT_META[k];
                        return meta ? (
                            <div key={k} className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                <span className={`text-[9px] ${meta.textColor}`}>{meta.label}</span>
                            </div>
                        ) : null;
                    })
                ) : (
                    <span className="text-[9px] text-slate-600">No events today</span>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                    className="ml-auto flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded px-1.5 py-0.5 transition-colors"
                >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    View calendar
                </button>
            </div>
            {open && <TrackerCalendarModal calendar={calendar} onClose={() => setOpen(false)} />}
        </>
    );
}

type HintMaps = { inline: Record<string, React.ReactNode>; expandable: Record<string, React.ReactNode> };

/** Build per-task world state hint maps from live data.
 *  `inline`     — always visible (e.g. calendar button)
 *  `expandable` — revealed by chevron (missions, acts, choices, etc.)
 */
function buildWorldStateHints(data: WorldStateData | null): HintMaps {
    if (!data) return { inline: {}, expandable: {} };
    const inline: Record<string, React.ReactNode> = {};
    const expandable: Record<string, React.ReactNode> = {};
    const hints = expandable; // all non-calendar hints go into expandable

    // ── Sortie ──────────────────────────────────────────────────────────────────
    if (data.sortie && !data.sortie.expired) {
        const s = data.sortie;
        hints["sortie_set"] = (
            <div className="mt-1.5 space-y-1">
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className={FACTION_COLOR[s.faction] ?? "text-slate-400"}>{s.faction}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{s.boss}</span>
                    {s.rewardPool && <WsChip color="text-amber-300" bg="bg-amber-950/30" border="border-amber-700/40">{s.rewardPool}</WsChip>}
                </div>
                {s.variants.map((v, i) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-medium text-slate-300">{v.missionType}</span>
                            {v.modifier && <WsChip color="text-orange-300" bg="bg-orange-950/20" border="border-orange-700/40">{v.modifier}</WsChip>}
                        </div>
                        <div className="text-[9px] text-slate-500">{v.node}</div>
                        {v.modifierDescription && (
                            <div className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{v.modifierDescription}</div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // ── Archon Hunt ─────────────────────────────────────────────────────────────
    if (data.archonHunt?.active) {
        const ah = data.archonHunt;
        hints["archon_hunt"] = (
            <div className="mt-1.5 space-y-1">
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className={FACTION_COLOR[ah.faction] ?? "text-slate-400"}>{ah.faction}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{ah.boss}</span>
                </div>
                {ah.missions.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1">
                        <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>
                        <span className="text-[10px] font-medium text-slate-300">{m.type}</span>
                        <span className="text-[9px] text-slate-500 truncate">{m.node}</span>
                    </div>
                ))}
            </div>
        );
    }

    // ── Nightwave acts ───────────────────────────────────────────────────────────
    if (data.nightwave) {
        const nw = data.nightwave;
        const daily  = nw.activeChallenges.filter((a) => a.isDaily);
        const weekly = nw.activeChallenges.filter((a) => !a.isDaily && !a.isElite);
        const elite  = nw.activeChallenges.filter((a) => a.isElite);

        const renderActs = (acts: typeof daily) => acts.length === 0 ? null : (
            <div className="mt-1.5 space-y-1">
                {acts.map((act) => (
                    <div key={act.id} className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-slate-300 leading-tight">{act.title}</span>
                            <span className="shrink-0 text-[9px] font-bold text-blue-300">{act.reputation.toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{act.desc}</div>
                    </div>
                ))}
            </div>
        );

        if (daily.length > 0)  hints["nightwave_daily"]  = renderActs(daily);
        if (weekly.length > 0) hints["nightwave_weekly"] = renderActs(weekly);
        if (elite.length > 0)  hints["nightwave_elite"]  = renderActs(elite);
    }

    // ── Circuit choices ──────────────────────────────────────────────────────────
    if (data.duviriCycle?.choices?.length) {
        const normalGroup = data.duviriCycle.choices.find((g) => g.category === "normal" || g.categoryKey?.includes("NORMAL"));
        const hardGroup   = data.duviriCycle.choices.find((g) => g.category === "hard"   || g.categoryKey?.includes("HARD"));

        if (normalGroup) {
            hints["circuit_reward_track"] = (
                <div className="mt-1.5">
                    <div className="text-[9px] text-slate-500 mb-1">This week's Warframe picks</div>
                    <div className="flex flex-wrap gap-1">
                        {normalGroup.choices.map((name, i) => (
                            <WsChip key={i} color="text-blue-300" bg="bg-blue-950/30" border="border-blue-700/40">{name}</WsChip>
                        ))}
                    </div>
                </div>
            );
        }
        if (hardGroup) {
            hints["circuit_incarnon"] = (
                <div className="mt-1.5">
                    <div className="text-[9px] text-slate-500 mb-1">This week's Incarnon picks (Steel Path)</div>
                    <div className="flex flex-wrap gap-1">
                        {hardGroup.choices.map((name, i) => (
                            <WsChip key={i} color="text-red-300" bg="bg-red-950/20" border="border-red-700/40">{name}</WsChip>
                        ))}
                    </div>
                </div>
            );
        }
    }

    // ── Archimedeas (deep + temporal) ────────────────────────────────────────────
    for (const arch of (data.archimedeas ?? [])) {
        if (arch.expired || arch.variants.length === 0) continue;

        const isHex = arch.tag?.includes("H") || arch.tag?.includes("HEX");
        const taskId = isHex ? "deep_archimedea" : "temporal_archimedea";

        const allMods = [...(arch.personalModifiers ?? []), ...(arch.deviations ?? []), ...(arch.risks ?? [])];

        hints[taskId] = (
            <div className="mt-1.5 space-y-1">
                {arch.variants.map((v, i) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1">
                        <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-medium text-slate-300">{v.type}</span>
                            {v.modifier && <WsChip color="text-orange-300" bg="bg-orange-950/20" border="border-orange-700/40">{v.modifier}</WsChip>}
                        </div>
                        <div className="text-[9px] text-slate-500">{v.node}</div>
                    </div>
                ))}
                {allMods.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                        {allMods.map((m, i) => (
                            <WsChip key={i} color="text-cyan-300" bg="bg-cyan-950/20" border="border-cyan-700/40">{m.tag}</WsChip>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── 1999 Calendar — inline CalendarHint with modal ──────────────────────────
    if (data.calendar?.days?.length) {
        inline["calendar_1999"] = <CalendarHint calendar={data.calendar} />;
    }

    // ── Steel Path Honor ─────────────────────────────────────────────────────────
    if (data.steelPath?.currentReward) {
        const sp = data.steelPath.currentReward;
        hints["steel_path_honors"] = (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-300 font-medium">{sp.name}</span>
                <WsChip color="text-slate-400">{sp.cost} Steel Essence</WsChip>
            </div>
        );
    }

    // ── Simaris target ───────────────────────────────────────────────────────────
    if (data.simaris?.target) {
        hints["standing_cephalon_simaris"] = (
            <div className="mt-1 text-[10px] text-slate-400">
                Synthesis target: <span className="text-slate-200 font-medium">{data.simaris.target}</span>
                {data.simaris.isTargetActive && <span className="ml-1 text-green-400">(active)</span>}
            </div>
        );
    }

    return { inline, expandable };
}

// Chevron icon used by expand/collapse buttons
function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Renders a flat list of tasks for a single sub-section
function TaskList({
    tasks,
    completedIds,
    onToggle,
    netracellRuns,
    onNetracellChange,
    inlineHints,
    expandableHints,
}: {
    tasks: TaskDef[];
    completedIds: string[];
    onToggle: (id: string) => void;
    netracellRuns?: number;
    onNetracellChange?: (n: number) => void;
    inlineHints?: Record<string, React.ReactNode>;
    expandableHints?: Record<string, React.ReactNode>;
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const runs = netracellRuns ?? 0;

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const pending = tasks.filter((t) => getTaskRenderState(t, completedIds, runs) === "pending");
    const completed = tasks.filter((t) => getTaskRenderState(t, completedIds, runs) !== "pending");

    if (tasks.length === 0) {
        return (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No tasks unlocked for this window
            </div>
        );
    }

    const renderTaskBody = (
        t: TaskDef,
        description: string,
        labelClass: string,
        checkboxNode: React.ReactNode,
        outerClass: string,
        onClickToggle?: () => void,
    ) => {
        const hasExpandable = !!expandableHints?.[t.id];
        const isExpanded = expandedIds.has(t.id);
        const hasInline = !!inlineHints?.[t.id];

        return (
            <div key={t.id} className={`rounded-xl border transition-colors w-full overflow-hidden ${outerClass}`}>
                <div className="flex items-start">
                    {onClickToggle ? (
                        <button
                            className="flex items-start gap-2.5 flex-1 min-w-0 px-3 py-2.5 text-left"
                            onClick={onClickToggle}
                        >
                            {checkboxNode}
                            <div className="min-w-0 flex-1">
                                <div className={`text-sm font-medium leading-tight ${labelClass}`}>{t.label}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</div>
                            </div>
                        </button>
                    ) : (
                        <div className="flex items-start gap-2.5 flex-1 min-w-0 px-3 py-2.5">
                            {checkboxNode}
                            <div className="min-w-0 flex-1">
                                <div className={`text-sm font-medium leading-tight ${labelClass}`}>{t.label}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</div>
                            </div>
                        </div>
                    )}
                    {hasExpandable && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(t.id); }}
                            className="flex-shrink-0 px-2 py-3 text-slate-600 hover:text-slate-400 transition-colors self-start"
                            title={isExpanded ? "Hide details" : "Show details"}
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>
                {hasInline && (
                    <div className="px-3 pb-2.5">
                        {inlineHints![t.id]}
                    </div>
                )}
                {hasExpandable && isExpanded && (
                    <div className="px-3 pb-2.5 pt-1.5 border-t border-slate-800/60">
                        {expandableHints![t.id]}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {pending.map((t) => {
                const description = getTaskDescription(t, completedIds, runs);

                if (t.id === NETRACELLS_TASK_ID && netracellRuns !== undefined && onNetracellChange) {
                    return (
                        <NetracellCounter
                            key={t.id}
                            runs={netracellRuns}
                            onChange={onNetracellChange}
                            description={description}
                        />
                    );
                }

                return renderTaskBody(
                    t,
                    description,
                    "text-slate-200",
                    <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-slate-600 bg-slate-900" />,
                    "border-transparent hover:border-slate-700 hover:bg-slate-900/50",
                    () => onToggle(t.id),
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
                const state = getTaskRenderState(t, completedIds, runs);
                const description = getTaskDescription(t, completedIds, runs);

                if (t.id === NETRACELLS_TASK_ID && netracellRuns !== undefined && onNetracellChange) {
                    return (
                        <NetracellCounter
                            key={t.id}
                            runs={netracellRuns}
                            onChange={onNetracellChange}
                            description={description}
                        />
                    );
                }

                if (state === "auto_blocked") {
                    return renderTaskBody(
                        t,
                        description,
                        "text-amber-300 line-through",
                        <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-amber-800/50 bg-amber-950/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
                            </svg>
                        </div>,
                        "border-amber-900/30 bg-amber-950/10 opacity-80",
                        undefined, // no toggle
                    );
                }

                return renderTaskBody(
                    t,
                    description,
                    "text-emerald-500",
                    <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-emerald-800 bg-emerald-950/30 flex items-center justify-center">
                        <CheckIcon />
                    </div>,
                    "border-emerald-900/30 bg-emerald-950/10 opacity-70 hover:opacity-100",
                    () => onToggle(t.id),
                );
            })}
        </div>
    );
}

// Standard single-bucket task panel (primary, secondary, weekly)
function TaskPanel({
    bucket,
    tasks,
    completedIds,
    tier,
    onToggle,
    onClear,
    timeMode,
    netracellRuns,
    onNetracellChange,
    inlineHints,
    expandableHints,
}: {
    bucket: Bucket;
    tasks: TaskDef[];
    completedIds: string[];
    tier: string;
    onToggle: (id: string) => void;
    onClear: () => void;
    timeMode: TimeMode;
    netracellRuns?: number;
    onNetracellChange?: (n: number) => void;
    inlineHints?: Record<string, React.ReactNode>;
    expandableHints?: Record<string, React.ReactNode>;
}) {
    const runs = netracellRuns ?? 0;
    const done = getCompletedTaskCount(tasks, completedIds, runs);
    const allDone = tasks.length > 0 && done === tasks.length;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${URG_TITLE[tier]}`}>
                        {BUCKET_LABEL[bucket]}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{getBucketSub(timeMode)[bucket]}</div>
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
                    <TaskList
                        tasks={tasks}
                        completedIds={completedIds}
                        onToggle={onToggle}
                        netracellRuns={netracellRuns}
                        onNetracellChange={onNetracellChange}
                        inlineHints={inlineHints}
                        expandableHints={expandableHints}
                    />
                </div>
            )}
        </div>
    );
}

// Conclave panel — renders two internal sections: Daily and Weekly
function ConclavePanel({
    dailyTasks,
    weeklyTasks,
    completedDailyIds,
    completedWeeklyIds,
    tier,
    nextDailyReset,
    nextWeeklyReset,
    timeMode,
    onToggleDaily,
    onToggleWeekly,
    onClearDaily,
    onClearWeekly,
    inlineHints,
    expandableHints,
}: {
    dailyTasks: TaskDef[];
    weeklyTasks: TaskDef[];
    completedDailyIds: string[];
    completedWeeklyIds: string[];
    tier: string;
    nextDailyReset: Date;
    nextWeeklyReset: Date;
    timeMode: TimeMode;
    onToggleDaily: (id: string) => void;
    onToggleWeekly: (id: string) => void;
    onClearDaily: () => void;
    onClearWeekly: () => void;
    inlineHints?: Record<string, React.ReactNode>;
    expandableHints?: Record<string, React.ReactNode>;
}) {
    const dailyDone = getCompletedTaskCount(dailyTasks, completedDailyIds, 0);
    const weeklyDone = getCompletedTaskCount(weeklyTasks, completedWeeklyIds, 0);
    const totalDone = dailyDone + weeklyDone;
    const totalTasks = dailyTasks.length + weeklyTasks.length;
    const allDone = totalTasks > 0 && totalDone === totalTasks;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
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
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <TaskList tasks={dailyTasks} completedIds={completedDailyIds} onToggle={onToggleDaily} inlineHints={inlineHints} expandableHints={expandableHints} />
                </div>

                <div className="h-px bg-slate-800" />

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
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <TaskList tasks={weeklyTasks} completedIds={completedWeeklyIds} onToggle={onToggleWeekly} inlineHints={inlineHints} expandableHints={expandableHints} />
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
    timeMode,
    onToggle,
    onShowAll,
    onHideAll,
}: {
    eligibleTasks: TaskDef[];
    hiddenTaskIds: string[];
    timeMode: TimeMode;
    onToggle: (id: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
}) {
    const hiddenCount = eligibleTasks.filter((t) => hiddenTaskIds.includes(t.id)).length;
    const visibleCount = eligibleTasks.filter((t) => !hiddenTaskIds.includes(t.id)).length;

    type Group = { key: string; label: string; sub?: string; tasks: TaskDef[] };
    const bucketSub = getBucketSub(timeMode);
    const groups: Group[] = [
        { key: "primary_daily", label: BUCKET_LABEL.primary_daily, sub: bucketSub.primary_daily, tasks: eligibleTasks.filter((t) => t.bucket === "primary_daily") },
        { key: "secondary_daily", label: BUCKET_LABEL.secondary_daily, sub: bucketSub.secondary_daily, tasks: eligibleTasks.filter((t) => t.bucket === "secondary_daily") },
        { key: "weekly_monday", label: BUCKET_LABEL.weekly_monday, sub: bucketSub.weekly_monday, tasks: eligibleTasks.filter((t) => t.bucket === "weekly_monday") },
        { key: "conclave", label: "Conclave", sub: `Daily ${fmtFixedUTC(17, 0, timeMode)} · Weekly Fri`, tasks: eligibleTasks.filter((t) => t.bucket === "conclave") },
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
                                    <div
                                        className={[
                                            "flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors",
                                            hidden ? "border-slate-700 bg-slate-900" : "border-slate-400 bg-slate-600",
                                        ].join(" ")}
                                    >
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
    const syndicates = useTrackerStore((s) => s.state.syndicates) ?? [];

    const [rc, setRc] = useState<RCState>(() => loadState());
    const [now, setNow] = useState(() => new Date());
    const [showHelp, setHelp] = useState(false);
    const [showCustomize, setCustomize] = useState(false);
    const [selected, setSel] = useState<Bucket>("primary_daily");
    const [wsData, setWsData] = useState<WorldStateData | null>(() => getCachedWorldState());

    // Fetch world state once on mount (uses shared cache — no double-fetch with WorldState page)
    useEffect(() => {
        fetchWorldState().then(setWsData).catch(() => {});
    }, []);

    useEffect(() => {
        saveState(rc);
    }, [rc]);

    const lastResetKeysRef = useRef("");
    useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNow(n);
            setRc((p) => syncResets(p, n));

            // Re-fetch world state whenever a primary daily, secondary daily, or weekly reset boundary is crossed
            const keys = getCurrentKeys(n);
            const keysStr = `${keys.primary_daily}|${keys.secondary_daily}|${keys.weekly_monday}`;
            if (lastResetKeysRef.current && lastResetKeysRef.current !== keysStr) {
                fetchWorldState(true).then(setWsData).catch(() => {});
            }
            lastResetKeysRef.current = keysStr;
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const nextResets = useMemo(() => getNextResets(now), [now]);
    const baro = useMemo(() => getBaroStatus(now, rc.timeMode), [now, rc.timeMode]);
    const { inline: wsInlineHints, expandable: wsExpandableHints } = useMemo(() => buildWorldStateHints(wsData), [wsData]);

    const completedIds = useMemo((): Record<Exclude<Bucket, "conclave">, string[]> & { conclave_daily: string[]; conclave_weekly: string[] } => {
        const keys = getCurrentKeys(now);
        const get = (rk: keyof RCState, ck: keyof RCState, key: string) => rc[rk] === key ? (rc[ck] as string[]) : [];
        return {
            primary_daily: get("primaryDailyResetKey", "completedPrimaryDailyTaskIds", keys.primary_daily),
            secondary_daily: get("secondaryDailyResetKey", "completedSecondaryDailyTaskIds", keys.secondary_daily),
            weekly_monday: get("weeklyMondayResetKey", "completedWeeklyMondayTaskIds", keys.weekly_monday),
            conclave_daily: get("conclaveDailyResetKey", "completedConclaveDailyTaskIds", keys.conclave_daily),
            conclave_weekly: get("conclaveWeeklyResetKey", "completedConclaveWeeklyTaskIds", keys.conclave_weekly),
        };
    }, [rc, now]);

    const eligibleTasks = useMemo(
        () => getEligibleTasks(completedPrereqs, syndicates),
        [completedPrereqs, syndicates]
    );

    const visibleTasks = useMemo(
        () => eligibleTasks.filter((t) => !rc.hiddenTaskIds.includes(t.id)),
        [eligibleTasks, rc.hiddenTaskIds]
    );

    const anyPledged = useMemo(
        () => syndicates.some((s) => s.pledged && RELAY_FACTION_IDS.has(s.id as SyndicateId)),
        [syndicates]
    );

    const byBucket = useCallback((b: Exclude<Bucket, "conclave">) => visibleTasks.filter((t) => t.bucket === b), [visibleTasks]);
    const conclaveDaily = useMemo(() => visibleTasks.filter((t) => t.bucket === "conclave" && t.conclaveSub === "conclave_daily"), [visibleTasks]);
    const conclaveWeekly = useMemo(() => visibleTasks.filter((t) => t.bucket === "conclave" && t.conclaveSub === "conclave_weekly"), [visibleTasks]);

    const msFor = useCallback((b: Bucket): number => {
        if (b === "conclave") {
            const dms = Math.max(0, nextResets.conclave_daily.getTime() - now.getTime());
            const wms = Math.max(0, nextResets.conclave_weekly.getTime() - now.getTime());
            return Math.min(dms, wms);
        }
        return Math.max(0, nextResets[b].getTime() - now.getTime());
    }, [nextResets, now]);

    const tierFor = useCallback((b: Bucket) => urgTier(msFor(b), b), [msFor]);

    const conclaveTotalTasks = conclaveDaily.length + conclaveWeekly.length;
    const conclaveTotalDone = getCompletedTaskCount(conclaveDaily, completedIds.conclave_daily, 0)
        + getCompletedTaskCount(conclaveWeekly, completedIds.conclave_weekly, 0);

    const eligibleByBucket = useMemo(() => ({
        primary_daily: eligibleTasks.filter((t) => t.bucket === "primary_daily"),
        secondary_daily: eligibleTasks.filter((t) => t.bucket === "secondary_daily"),
        weekly_monday: eligibleTasks.filter((t) => t.bucket === "weekly_monday"),
        conclave: eligibleTasks.filter((t) => t.bucket === "conclave"),
    }), [eligibleTasks]);

    const isBucketFullyHidden = useCallback((b: Bucket): boolean => {
        const eligible = eligibleByBucket[b];
        if (eligible.length === 0) return false;
        return eligible.every((t) => rc.hiddenTaskIds.includes(t.id));
    }, [eligibleByBucket, rc.hiddenTaskIds]);

    const visibleBuckets = useMemo(
        () => BUCKET_ORDER.filter((b) => !isBucketFullyHidden(b)),
        [isBucketFullyHidden]
    );

    useEffect(() => {
        if (!visibleBuckets.includes(selected)) {
            setSel(visibleBuckets[0] ?? "primary_daily");
        }
    }, [visibleBuckets, selected]);

    const toggleStandard = useCallback((id: string, ck: keyof RCState) => {
        setRc((prev) => {
            const list = [...(prev[ck] as string[])];
            const idx = list.indexOf(id);
            if (idx >= 0) list.splice(idx, 1);
            else list.push(id);
            return { ...prev, [ck]: list };
        });
    }, []);

    const toggle = useCallback((id: string, bucket: Bucket) => {
        if (bucket === "primary_daily") {
            toggleStandard(id, "completedPrimaryDailyTaskIds");
            return;
        }

        if (bucket === "secondary_daily") {
            toggleStandard(id, "completedSecondaryDailyTaskIds");
            return;
        }

        if (bucket === "weekly_monday") {
            if (id === TEMPORAL_ARCHIMEDEA_TASK_ID) {
                setRc((prev) => {
                    const alreadyCompleted = prev.completedWeeklyMondayTaskIds.includes(TEMPORAL_ARCHIMEDEA_TASK_ID);
                    const autoBlocked = isTemporalArchimedeaAutoBlocked(prev.netracellRuns, prev.completedWeeklyMondayTaskIds);

                    if (autoBlocked) return prev;

                    if (alreadyCompleted) {
                        return {
                            ...prev,
                            completedWeeklyMondayTaskIds: prev.completedWeeklyMondayTaskIds.filter((taskId) => taskId !== TEMPORAL_ARCHIMEDEA_TASK_ID),
                            netracellRuns: Math.max(0, prev.netracellRuns - 2),
                        };
                    }

                    return {
                        ...prev,
                        completedWeeklyMondayTaskIds: [...prev.completedWeeklyMondayTaskIds, TEMPORAL_ARCHIMEDEA_TASK_ID],
                        netracellRuns: Math.min(5, prev.netracellRuns + 2),
                    };
                });
                return;
            }

            toggleStandard(id, "completedWeeklyMondayTaskIds");
        }
    }, [toggleStandard]);

    const clearBucket = useCallback((ck: keyof RCState) => setRc((p) => ({ ...p, [ck]: [] })), []);
    const clearWeeklyMonday = useCallback(() => {
        setRc((p) => ({
            ...p,
            completedWeeklyMondayTaskIds: [],
            netracellRuns: 0,
        }));
    }, []);

    const setMode = useCallback((m: TimeMode) => setRc((p) => ({ ...p, timeMode: m })), []);
    const toggleHidden = useCallback((id: string) => {
        setRc((prev) => {
            const list = [...prev.hiddenTaskIds];
            const idx = list.indexOf(id);
            if (idx >= 0) list.splice(idx, 1);
            else list.push(id);
            return { ...prev, hiddenTaskIds: list };
        });
    }, []);
    const showAll = useCallback(() => setRc((p) => ({ ...p, hiddenTaskIds: [] })), []);
    const hideAll = useCallback(() => setRc((p) => ({ ...p, hiddenTaskIds: eligibleTasks.map((t) => t.id) })), [eligibleTasks]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-4">
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
                        onClick={() => {
                            setCustomize((v) => !v);
                            setHelp(false);
                        }}
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
                        onClick={() => {
                            setHelp((v) => !v);
                            setCustomize(false);
                        }}
                    >
                        ?
                    </button>
                    <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                        <button className={`px-3 py-1.5 font-medium transition-colors ${rc.timeMode === "utc" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`} onClick={() => setMode("utc")}>UTC</button>
                        <button className={`px-3 py-1.5 font-medium transition-colors ${rc.timeMode === "local" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`} onClick={() => setMode("local")}>Local</button>
                    </div>
                </div>
            </div>

            {baro.present && (
                <div className="rounded-xl border border-amber-600/60 bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
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

            {!anyPledged && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-2.5 text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Tip:</span>{" "}
                    All 6 relay faction standing tasks are shown because no pledge is set.
                    Mark your pledged faction(s) on the <span className="text-slate-300">Syndicates</span> page to show only those here.
                </div>
            )}

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

            {showCustomize && (
                <CustomizePanel
                    eligibleTasks={eligibleTasks}
                    hiddenTaskIds={rc.hiddenTaskIds}
                    timeMode={rc.timeMode}
                    onToggle={toggleHidden}
                    onShowAll={showAll}
                    onHideAll={hideAll}
                />
            )}

            <div className={`grid gap-3 ${visibleBuckets.length === 4 ? "grid-cols-2 lg:grid-cols-4" : visibleBuckets.length === 3 ? "grid-cols-2 lg:grid-cols-3" : visibleBuckets.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {visibleBuckets.map((b) => {
                    const isConclave = b === "conclave";
                    const bucketTasks = isConclave ? [] : byBucket(b as Exclude<Bucket, "conclave">);
                    const tasks = isConclave ? conclaveTotalTasks : bucketTasks.length;
                    const done = isConclave
                        ? conclaveTotalDone
                        : getCompletedTaskCount(bucketTasks, completedIds[b as Exclude<Bucket, "conclave">] as string[], rc.netracellRuns);
                    const pct = tasks > 0 ? Math.round((done / tasks) * 100) : 0;
                    const ms = msFor(b);
                    const tier = tierFor(b);
                    const allDone = tasks > 0 && done === tasks;

                    const pendingTasks = isConclave
                        ? [
                            ...conclaveDaily.filter((t) => getTaskRenderState(t, completedIds.conclave_daily, 0) === "pending"),
                            ...conclaveWeekly.filter((t) => getTaskRenderState(t, completedIds.conclave_weekly, 0) === "pending"),
                        ]
                        : bucketTasks.filter((t) => getTaskRenderState(t, completedIds[b as Exclude<Bucket, "conclave">] as string[], rc.netracellRuns) === "pending");

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
                            {allDone ? (
                                <div className="text-[10px] text-emerald-600 mt-1.5 leading-tight">All done</div>
                            ) : pendingTasks.length > 0 && (
                                <div className="text-[10px] text-slate-600 mt-1.5 leading-tight truncate">
                                    {pendingTasks.slice(0, 2).map((t) => t.label).join(" · ")}
                                    {pendingTasks.length > 2 && <span> +{pendingTasks.length - 2}</span>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

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
                    inlineHints={wsInlineHints}
                    expandableHints={wsExpandableHints}
                />
            ) : (
                <TaskPanel
                    bucket={selected}
                    tasks={byBucket(selected as Exclude<Bucket, "conclave">)}
                    completedIds={completedIds[selected as Exclude<Bucket, "conclave">] as string[]}
                    tier={tierFor(selected)}
                    onToggle={(id) => toggle(id, selected)}
                    onClear={() => selected === "weekly_monday" ? clearWeeklyMonday() : clearBucket(COMPLETED_KEY[selected as Exclude<Bucket, "conclave">]!)}
                    timeMode={rc.timeMode}
                    netracellRuns={rc.netracellRuns}
                    onNetracellChange={(n) => setRc((p) => ({ ...p, netracellRuns: n }))}
                    inlineHints={wsInlineHints}
                    expandableHints={wsExpandableHints}
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RefSection
                    title="Bi-Weekly"
                    rows={[{ id: "baro", label: baro.label, detail: baro.detail, highlight: baro.present }]}
                />
                <RefSection title="Monthly Reference" rows={getMonthlyRef(rc.timeMode)} />
                <RefSection title="Event-Driven" rows={EVENT_REF} />
            </div>
        </div>
    );
}