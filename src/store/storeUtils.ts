// Pure date and ID utilities for the tracker store — no external deps.

export function nowIso(): string {
    return new Date().toISOString();
}

export function uid(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function utcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function getCurrentPrimaryDailyResetKey(now: Date): string {
    return utcDateKey(now);
}

export function getCurrentSecondaryDailyResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 0, 0, 0));
    if (now.getTime() >= start.getTime()) {
        return utcDateKey(start);
    }

    start.setUTCDate(start.getUTCDate() - 1);
    return utcDateKey(start);
}

export function getCurrentWeeklyMondayResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = start.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    start.setUTCDate(start.getUTCDate() - diffToMonday);
    return utcDateKey(start);
}

export function getCurrentWeeklyFridayResetKey(now: Date): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = start.getUTCDay();
    const diffToFriday = (day + 2) % 7;
    start.setUTCDate(start.getUTCDate() - diffToFriday);
    return utcDateKey(start);
}

export function normalizeStringArray(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];

    const out: string[] = [];
    const seen = new Set<string>();

    for (const v of raw) {
        const s = String(v ?? "").trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }

    return out;
}
