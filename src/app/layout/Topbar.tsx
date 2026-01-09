// src/app/layout/Topbar.tsx
import { useMemo, useRef, useState } from "react";
import { useTrackerStore } from "../../store/store";

type PlatformKey = "pc" | "ps" | "xb" | "swi" | "mob";

type PlatformOption = {
    key: PlatformKey;
    label: string;
    // NOTE: Use HTTPS here because you'll open in a new tab; the browser can handle redirects.
    baseUrl: string;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
    { key: "pc", label: "PC", baseUrl: "https://content.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "ps", label: "PlayStation", baseUrl: "https://content-ps4.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "xb", label: "Xbox", baseUrl: "https://content-xb1.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "swi", label: "Switch", baseUrl: "https://content-swi.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "mob", label: "Mobile", baseUrl: "https://content-mob.warframe.com/dynamic/getProfileViewingData.php?playerId=" }
];

function clampInt(value: unknown, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
}

function formatInt(n: number | null): string {
    if (n === null) return "—";
    return Number(n).toLocaleString();
}

function normalizePlatformKey(raw: unknown): PlatformKey {
    const s = String(raw ?? "").trim().toLowerCase();
    if (s === "pc") return "pc";
    if (s === "ps" || s === "playstation" || s === "ps4" || s === "ps5") return "ps";
    if (s === "xb" || s === "xbox" || s === "xb1" || s === "xbsx") return "xb";
    if (s === "swi" || s === "switch") return "swi";
    if (s === "mob" || s === "mobile") return "mob";
    // Default to PC to match your app’s baseline.
    return "pc";
}

function platformLabel(key: PlatformKey): string {
    return PLATFORM_OPTIONS.find((p) => p.key === key)?.label ?? "PC";
}

function buildProfileUrl(accountId: string, platform: PlatformKey): string {
    const base = PLATFORM_OPTIONS.find((p) => p.key === platform)?.baseUrl ?? PLATFORM_OPTIONS[0].baseUrl;
    return `${base}${encodeURIComponent(accountId)}`;
}

/**
 * Simple inline SVG icon set (no external deps).
 * These are intentionally “generic platform-ish” glyphs.
 */
function PlatformIcon(props: { platform: PlatformKey; className?: string }) {
    const cls = props.className ?? "h-4 w-4";
    const common = {
        className: cls,
        viewBox: "0 0 24 24",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    };

    switch (props.platform) {
        case "pc":
            return (
                <svg {...common}>
                    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-11A2.5 2.5 0 0 1 4 13.5v-7Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case "ps":
            return (
                <svg {...common}>
                    <path d="M7 17.5c0-3.5 0-8 5-8s5 4.5 5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M9 8.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M12 6v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M9 18h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
        case "xb":
            return (
                <svg {...common}>
                    <path d="M7.2 7.2c1.4-1.3 2.9-2.2 4.8-2.2s3.4.9 4.8 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M6 9.5c2.2 1.2 4 3.4 6 6 2-2.6 3.8-4.8 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            );
        case "swi":
            return (
                <svg {...common}>
                    <path d="M7 5h3.5a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 10.5 19H7A2 2 0 0 1 5 17V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M13.5 5H17a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3.5A1.5 1.5 0 0 1 12 17.5v-11A1.5 1.5 0 0 1 13.5 5Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 9h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M16 15h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
            );
        case "mob":
            return (
                <svg {...common}>
                    <path d="M9 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M11 17h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            );
    }
}

export default function Topbar() {
    const masteryRank = useTrackerStore((s) => s.state.player.masteryRank);
    const displayName = useTrackerStore((s) => s.state.player.displayName);
    const accountId = useTrackerStore((s) => s.state.player.accountId ?? "");

    // Platform is stored in state; this assumes you’ve expanded it beyond "PC" already.
    const platformRaw = useTrackerStore((s) => (s.state.player as any).platform);
    const platform = normalizePlatformKey(platformRaw);

    const credits = useTrackerStore((s) => s.state.inventory.credits);
    const platinum = useTrackerStore((s) => s.state.inventory.platinum);

    const setMasteryRank = useTrackerStore((s) => s.setMasteryRank);
    const setCredits = useTrackerStore((s) => s.setCredits);
    const setPlatinum = useTrackerStore((s) => s.setPlatinum);

    const setAccountId = useTrackerStore((s) => s.setAccountId);

    // Store platform via a generic setter if you have one; if not, we patch via setState in store later.
    const setPlatform = useTrackerStore((s) => (s as any).setPlatform) as ((p: string) => void) | undefined;

    const importProfileViewingDataJson = useTrackerStore((s) => s.importProfileViewingDataJson);

    const [editing, setEditing] = useState(false);

    const [mrDraft, setMrDraft] = useState<string>(masteryRank === null ? "" : String(masteryRank));
    const [creditsDraft, setCreditsDraft] = useState<string>(String(credits ?? 0));
    const [platDraft, setPlatDraft] = useState<string>(String(platinum ?? 0));
    const [accountDraft, setAccountDraft] = useState<string>(String(accountId ?? ""));

    const [profileStatus, setProfileStatus] = useState<string>("");

    const fileRef = useRef<HTMLInputElement | null>(null);

    // Dropdown state for platform icon button
    const [platformOpen, setPlatformOpen] = useState(false);

    // Keep drafts in sync when not editing (e.g., after import/reset).
    useMemo(() => {
        if (!editing) {
            setMrDraft(masteryRank === null ? "" : String(masteryRank));
            setCreditsDraft(String(credits ?? 0));
            setPlatDraft(String(platinum ?? 0));
            setAccountDraft(String(accountId ?? ""));
        }
        return null;
    }, [editing, masteryRank, credits, platinum, accountId]);

    function save() {
        if (mrDraft.trim() === "") {
            setMasteryRank(null);
        } else {
            setMasteryRank(clampInt(mrDraft, 0));
        }
        setCredits(clampInt(creditsDraft, 0));
        setPlatinum(clampInt(platDraft, 0));

        setAccountId(accountDraft.trim());

        setEditing(false);
    }

    function cancel() {
        setMrDraft(masteryRank === null ? "" : String(masteryRank));
        setCreditsDraft(String(credits ?? 0));
        setPlatDraft(String(platinum ?? 0));
        setAccountDraft(String(accountId ?? ""));
        setEditing(false);
    }

    function openProfileLink() {
        const id = String(accountId ?? "").trim();
        if (!id) {
            setProfileStatus("Set Account ID first.");
            return;
        }
        const url = buildProfileUrl(id, platform);
        window.open(url, "_blank", "noopener,noreferrer");
        setProfileStatus("Opened profile link. Save the response (often .htm), then import it.");
    }

    function choosePlatform(next: PlatformKey) {
        setPlatformOpen(false);

        // Prefer a real store setter if you have it; otherwise no-op (you can add setPlatform to store).
        if (setPlatform) {
            setPlatform(platformLabel(next));
        } else {
            // If you do not have setPlatform yet, this at least communicates what needs adding.
            setProfileStatus("Missing store action: add setPlatform(platform) to persist this selection.");
        }
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
                <div className="min-w-0 flex-1">
                    <div className="text-xl font-bold">Warframe Roadmap Tracker</div>
                    <div className="text-sm text-slate-400">
                        Local-only tracker with progress packs. Default state assumes nothing is complete.
                    </div>
                </div>

                {/* Constrain width so it doesn't stretch across the whole section */}
                <div className="w-full md:w-[460px] lg:w-[520px] max-w-full shrink-0 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-300">Profile</div>

                        {!editing ? (
                            <button
                                className="flex items-center gap-2 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                onClick={() => setEditing(true)}
                                title="Edit profile values"
                            >
                                <span className="text-sm leading-none">✎</span>
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900"
                                    onClick={cancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rounded-lg border border-slate-100 bg-slate-100 px-2 py-1 text-xs text-slate-900 hover:bg-white"
                                    onClick={save}
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    {!editing ? (
                        <>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                    <div className="text-[11px] text-slate-400">MR</div>
                                    <div className="font-mono text-slate-100">{formatInt(masteryRank)}</div>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                    <div className="text-[11px] text-slate-400">Credits</div>
                                    <div className="font-mono text-slate-100">{Number(credits ?? 0).toLocaleString()}</div>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                    <div className="text-[11px] text-slate-400">Platinum</div>
                                    <div className="font-mono text-slate-100">{Number(platinum ?? 0).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                    <div className="text-[11px] text-slate-400">Name</div>
                                    <div className="font-mono text-slate-100">{displayName || "—"}</div>
                                </div>

                                <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-2">
                                    <div className="text-[11px] text-slate-400">Account ID</div>
                                    <div className="font-mono text-slate-100 truncate" title={accountId || ""}>
                                        {accountId || "—"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                                    onClick={openProfileLink}
                                    disabled={!String(accountId ?? "").trim()}
                                    title={!String(accountId ?? "").trim() ? "Set Account ID first" : "Open in a new tab"}
                                >
                                    Open Profile Link
                                </button>

                                <button
                                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                                    onClick={() => fileRef.current?.click()}
                                    title="Import a saved profile file (.json or .htm)"
                                >
                                    Import JSON/HTML
                                </button>

                                {/* Platform icon dropdown */}
                                <div className="relative">
                                    <button
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-900"
                                        onClick={() => setPlatformOpen((v) => !v)}
                                        title={`Platform: ${platformLabel(platform)} (click to change)`}
                                    >
                                        <PlatformIcon platform={platform} className="h-4 w-4" />
                                    </button>

                                    {platformOpen && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 shadow-lg">
                                            <div className="px-3 py-2 text-[11px] text-slate-400 border-b border-slate-800">
                                                Select Platform
                                            </div>
                                            <div className="p-1">
                                                {PLATFORM_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        className={[
                                                            "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                                                            opt.key === platform
                                                                ? "bg-slate-100 text-slate-900"
                                                                : "text-slate-200 hover:bg-slate-900"
                                                        ].join(" ")}
                                                        onClick={() => choosePlatform(opt.key)}
                                                    >
                                                        <PlatformIcon platform={opt.key} className="h-4 w-4" />
                                                        <span>{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="application/json,.json,text/html,.htm,.html"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const raw = await file.text();
                                        const res = importProfileViewingDataJson(raw);
                                        if (!res.ok) {
                                            setProfileStatus(res.error ?? "Import failed.");
                                        } else {
                                            setProfileStatus("Profile imported.");
                                        }

                                        e.target.value = "";
                                    }}
                                />

                                {profileStatus && <div className="text-xs text-slate-300">{profileStatus}</div>}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] text-slate-400">MR</span>
                                    <input
                                        className="h-9 w-20 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                        type="number"
                                        min={0}
                                        value={mrDraft}
                                        onChange={(e) => setMrDraft(e.target.value)}
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] text-slate-400">Credits</span>
                                    <input
                                        className="h-9 w-32 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                        type="number"
                                        min={0}
                                        value={creditsDraft}
                                        onChange={(e) => setCreditsDraft(e.target.value)}
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] text-slate-400">Platinum</span>
                                    <input
                                        className="h-9 w-28 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100"
                                        type="number"
                                        min={0}
                                        value={platDraft}
                                        onChange={(e) => setPlatDraft(e.target.value)}
                                    />
                                </label>
                            </div>

                            <div className="mt-2">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[11px] text-slate-400">Account ID</span>
                                    <input
                                        className="h-9 w-full rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm text-slate-100 font-mono"
                                        value={accountDraft}
                                        onChange={(e) => setAccountDraft(e.target.value)}
                                        placeholder="e.g., 51c925bd1a4d80502e000046"
                                    />
                                </label>
                            </div>
                        </>
                    )}

                    <div className="mt-2 text-[11px] text-slate-500">
                        Account ID + Platform are stored locally. Use “Open Profile Link”, save the response (browser may
                        save as .htm), then import it to update Name, MR, clan, syndicates, mastery XP, missions, and
                        inventory mapping.
                    </div>
                </div>
            </div>
        </div>
    );
}

