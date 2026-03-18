// ===== FILE: src/app/layout/Topbar.tsx =====
//
// Slim top bar: shows MR · name · platform icon · expand chevron.
// Clicking the profile area drops down the full edit panel (replaces old always-visible card).
// The bar itself is always exactly h-12 (48px). The dropdown is absolutely positioned.

import { useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../../store/store";

type PlatformKey = "pc" | "ps" | "xb" | "swi" | "mob";

type PlatformOption = {
    key: PlatformKey;
    label: string;
    baseUrl: string;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
    { key: "pc",  label: "PC",          baseUrl: "https://content.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "ps",  label: "PlayStation", baseUrl: "https://content-ps4.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "xb",  label: "Xbox",        baseUrl: "https://content-xb1.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "swi", label: "Switch",      baseUrl: "https://content-swi.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
    { key: "mob", label: "Mobile",      baseUrl: "https://content-mob.warframe.com/dynamic/getProfileViewingData.php?playerId=" },
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
    return "pc";
}

function platformLabel(key: PlatformKey): "PC" | "PlayStation" | "Xbox" | "Switch" | "Mobile" {
    const label = PLATFORM_OPTIONS.find((p) => p.key === key)?.label ?? "PC";
    if (label === "PlayStation") return "PlayStation";
    if (label === "Xbox") return "Xbox";
    if (label === "Switch") return "Switch";
    if (label === "Mobile") return "Mobile";
    return "PC";
}

function buildProfileUrl(accountId: string, platform: PlatformKey): string {
    const base = PLATFORM_OPTIONS.find((p) => p.key === platform)?.baseUrl ?? PLATFORM_OPTIONS[0].baseUrl;
    return `${base}${encodeURIComponent(accountId)}`;
}

function PlatformIcon(props: { platform: PlatformKey; className?: string }) {
    const cls = props.className ?? "h-4 w-4";
    const common = { className: cls, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };

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

// ── Inline-editable stat cell ────────────────────────────────────────────────

type ActiveField = "mr" | "credits" | "platinum" | "accountId" | null;

function InlineStat({
    label,
    display,
    draft,
    isEditing,
    onActivate,
    onChange,
    onCommit,
    onCancel,
    inputType = "number",
    placeholder,
}: {
    label: string;
    display: string;
    draft: string;
    isEditing: boolean;
    onActivate: () => void;
    onChange: (v: string) => void;
    onCommit: () => void;
    onCancel: () => void;
    inputType?: "number" | "text";
    placeholder?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    return (
        <div
            className={[
                "rounded-lg border px-2 py-2 transition-colors group",
                isEditing
                    ? "border-slate-500 bg-slate-900"
                    : "border-slate-800 bg-slate-950/50 cursor-text hover:border-slate-600 hover:bg-slate-900/50",
            ].join(" ")}
            onClick={() => { if (!isEditing) onActivate(); }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{label}</span>
                {!isEditing && (
                    <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        ✎
                    </span>
                )}
            </div>
            {isEditing ? (
                <input
                    ref={inputRef}
                    type={inputType}
                    min={inputType === "number" ? 0 : undefined}
                    className="mt-0.5 w-full bg-transparent font-mono text-sm text-slate-100 focus:outline-none"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter")  { e.preventDefault(); onCommit(); }
                        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
                    }}
                    onBlur={onCommit}
                />
            ) : (
                <div className="mt-0.5 font-mono text-sm text-slate-100 truncate" title={display}>
                    {display}
                </div>
            )}
        </div>
    );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

export default function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
    const masteryRank   = useTrackerStore((s) => s.state.player.masteryRank);
    const displayName   = useTrackerStore((s) => s.state.player.displayName);
    const clanName      = useTrackerStore((s) => s.state.player.clanName);
    const accountId     = useTrackerStore((s) => s.state.player.accountId ?? "");
    const platformRaw   = useTrackerStore((s) => s.state.player.platform);
    const platform      = normalizePlatformKey(platformRaw);
    const credits       = useTrackerStore((s) => s.state.inventory.credits);
    const platinum      = useTrackerStore((s) => s.state.inventory.platinum);

    const setMasteryRank               = useTrackerStore((s) => s.setMasteryRank);
    const setCredits                   = useTrackerStore((s) => s.setCredits);
    const setPlatinum                  = useTrackerStore((s) => s.setPlatinum);
    const setAccountId                 = useTrackerStore((s) => s.setAccountId);
    const setPlatform                  = useTrackerStore((s) => s.setPlatform);
    const importProfileViewingDataJson = useTrackerStore((s) => s.importProfileViewingDataJson);

    const [open,         setOpen]         = useState(false);
    const [activeField,  setActiveField]  = useState<ActiveField>(null);
    const [mrDraft,      setMrDraft]      = useState("");
    const [creditsDraft, setCreditsDraft] = useState("");
    const [platDraft,    setPlatDraft]    = useState("");
    const [accountDraft, setAccountDraft] = useState("");
    const [profileStatus, setProfileStatus] = useState("");
    const [platformOpen,  setPlatformOpen]  = useState(false);
    const [showPastePanel, setShowPastePanel] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [lastImportedAt, setLastImportedAt] = useState<string | null>(
        () => localStorage.getItem("wft_last_profile_import") ?? null
    );

    const fileRef         = useRef<HTMLInputElement | null>(null);
    const panelRef        = useRef<HTMLDivElement | null>(null);
    const platformDropRef = useRef<HTMLDivElement | null>(null);

    // Close panel on outside click; commit any in-progress edit first
    useEffect(() => {
        if (!open) return;
        function onMouseDown(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                // Don't discard — just close; the field's onBlur will have already committed
                setOpen(false);
                setActiveField(null);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [open]);

    // Close platform dropdown on outside click
    useEffect(() => {
        if (!platformOpen) return;
        function onMouseDown(e: MouseEvent) {
            if (platformDropRef.current && !platformDropRef.current.contains(e.target as Node)) {
                setPlatformOpen(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [platformOpen]);

    // ── Per-field activate / commit / cancel ──

    function activate(field: ActiveField) {
        switch (field) {
            case "mr":        setMrDraft(masteryRank === null ? "" : String(masteryRank)); break;
            case "credits":   setCreditsDraft(String(credits ?? 0)); break;
            case "platinum":  setPlatDraft(String(platinum ?? 0)); break;
            case "accountId": setAccountDraft(String(accountId ?? "")); break;
        }
        setActiveField(field);
    }

    function commit(field: ActiveField) {
        if (activeField !== field) return; // stale blur, ignore
        switch (field) {
            case "mr":        setMasteryRank(mrDraft.trim() === "" ? null : clampInt(mrDraft, 0)); break;
            case "credits":   setCredits(clampInt(creditsDraft, 0)); break;
            case "platinum":  setPlatinum(clampInt(platDraft, 0)); break;
            case "accountId": setAccountId(accountDraft.trim()); break;
        }
        setActiveField(null);
    }

    function cancel() { setActiveField(null); }

    function openProfileLink() {
        const id = String(accountId ?? "").trim();
        if (!id) { setProfileStatus("Set Account ID first."); return; }
        window.open(buildProfileUrl(id, platform), "_blank", "noopener,noreferrer");
        setProfileStatus("Opened profile link. Copy the page content and paste it below, or save it and use Import File.");
        setShowPastePanel(true);
    }

    function handleImportResult(res: { ok: boolean; error?: string }) {
        if (!res.ok) {
            setProfileStatus(res.error ?? "Import failed.");
        } else {
            const ts = new Date().toLocaleString();
            localStorage.setItem("wft_last_profile_import", ts);
            setLastImportedAt(ts);
            setProfileStatus(`Profile imported at ${ts}`);
            setShowPastePanel(false);
            setPasteText("");
        }
    }

    function choosePlatform(next: PlatformKey) {
        setPlatformOpen(false);
        setPlatform(platformLabel(next));
        setProfileStatus("");
    }

    return (
        <div className="relative z-50" ref={panelRef}>

            {/* ── Slim bar ── */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">

                <div className="flex items-center gap-2">
                    {/* Hamburger — mobile only */}
                    <button
                        onClick={onMenuToggle}
                        className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        aria-label="Open navigation"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <svg className="h-5 w-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" />
                        <path d="M12 8v8M8.5 10l3.5 2 3.5-2" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-100 tracking-wide hidden sm:inline">Warframe Tracker</span>
                </div>

                {/* Profile pill */}
                <button
                    onClick={() => { setOpen((v) => !v); if (open) setActiveField(null); }}
                    className={[
                        "flex items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-colors",
                        open
                            ? "border-slate-600 bg-slate-800 text-slate-100"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900",
                    ].join(" ")}
                >
                    <PlatformIcon platform={platform} className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-mono">
                        MR <span className="text-slate-100 font-semibold">{masteryRank ?? "—"}</span>
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs font-mono">
                        <span className="text-yellow-400">₢</span>{" "}
                        <span className="text-slate-200">{Number(credits ?? 0).toLocaleString()}</span>
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs font-mono">
                        <span className="text-cyan-400">◈</span>{" "}
                        <span className="text-slate-200">{Number(platinum ?? 0).toLocaleString()}</span>
                    </span>
                    {displayName && (
                        <>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-300 max-w-[120px] truncate">{displayName}</span>
                        </>
                    )}
                    <svg
                        className={["h-3.5 w-3.5 text-slate-500 transition-transform", open ? "rotate-180" : ""].join(" ")}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>

            {/* ── Dropdown panel ── */}
            {open && (
                <div className="absolute right-4 top-full mt-1 w-[480px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60">

                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <span className="text-sm font-semibold text-slate-200">Profile</span>
                        <span className="text-[11px] text-slate-500">Click any value to edit</span>
                    </div>

                    <div className="px-4 py-3 space-y-2">

                        {/* MR / Credits / Platinum */}
                        <div className="grid grid-cols-3 gap-2">
                            <InlineStat
                                label="MR"
                                display={formatInt(masteryRank)}
                                draft={mrDraft}
                                isEditing={activeField === "mr"}
                                onActivate={() => activate("mr")}
                                onChange={setMrDraft}
                                onCommit={() => commit("mr")}
                                onCancel={cancel}
                            />
                            <InlineStat
                                label="Credits"
                                display={Number(credits ?? 0).toLocaleString()}
                                draft={creditsDraft}
                                isEditing={activeField === "credits"}
                                onActivate={() => activate("credits")}
                                onChange={setCreditsDraft}
                                onCommit={() => commit("credits")}
                                onCancel={cancel}
                            />
                            <InlineStat
                                label="Platinum"
                                display={Number(platinum ?? 0).toLocaleString()}
                                draft={platDraft}
                                isEditing={activeField === "platinum"}
                                onActivate={() => activate("platinum")}
                                onChange={setPlatDraft}
                                onCommit={() => commit("platinum")}
                                onCancel={cancel}
                            />
                        </div>

                        {/* Name (read-only) / Account ID */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
                                <div className="text-[11px] text-slate-400">Name</div>
                                <div className="mt-0.5 font-mono text-sm text-slate-100">{displayName || "—"}</div>
                                {clanName && (
                                    <div className="mt-1 text-[11px] text-slate-400 truncate" title={clanName}>
                                        <span className="text-slate-500">Clan: </span>{clanName}
                                    </div>
                                )}
                            </div>
                            <InlineStat
                                label="Account ID"
                                display={accountId || "—"}
                                draft={accountDraft}
                                isEditing={activeField === "accountId"}
                                onActivate={() => activate("accountId")}
                                onChange={setAccountDraft}
                                onCommit={() => commit("accountId")}
                                onCancel={cancel}
                                inputType="text"
                                placeholder="e.g., 51c925bd1a4d80502e000046"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900 disabled:opacity-50"
                                onClick={openProfileLink}
                                disabled={!String(accountId ?? "").trim()}
                                title={!String(accountId ?? "").trim() ? "Set Account ID first" : "Open profile in new tab"}
                            >
                                Open Profile Link
                            </button>

                            <button
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                                onClick={() => setShowPastePanel(v => !v)}
                            >
                                {showPastePanel ? "Hide Paste" : "Paste JSON"}
                            </button>

                            <button
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
                                onClick={() => fileRef.current?.click()}
                            >
                                Import File
                            </button>

                            {/* Platform selector */}
                            <div className="relative" ref={platformDropRef}>
                                <button
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-900"
                                    onClick={() => setPlatformOpen((v) => !v)}
                                    title={`Platform: ${platformLabel(platform)}`}
                                >
                                    <PlatformIcon platform={platform} className="h-4 w-4" />
                                </button>

                                {platformOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 shadow-lg z-50">
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
                                                            : "text-slate-200 hover:bg-slate-900",
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
                                    handleImportResult(importProfileViewingDataJson(raw));
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        {/* Paste JSON panel */}
                        {showPastePanel && (
                            <div className="mt-2 space-y-2">
                                <div className="text-[11px] text-slate-400">
                                    Paste the full JSON content from the profile page below:
                                </div>
                                <textarea
                                    className="w-full h-28 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 font-mono text-[11px] resize-none focus:outline-none focus:border-slate-500 placeholder:text-slate-600"
                                    value={pasteText}
                                    onChange={e => setPasteText(e.target.value)}
                                    placeholder='Paste profile JSON here (starts with {"Results":[...]})'
                                />
                                <div className="flex gap-2">
                                    <button
                                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-900 font-semibold hover:bg-white disabled:opacity-50"
                                        disabled={!pasteText.trim()}
                                        onClick={() => handleImportResult(importProfileViewingDataJson(pasteText))}
                                    >
                                        Import Pasted JSON
                                    </button>
                                    <button
                                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900"
                                        onClick={() => { setPasteText(""); setShowPastePanel(false); }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status + last imported */}
                        <div className="space-y-0.5 pt-1">
                            {profileStatus && (
                                <div className="text-xs text-slate-300">{profileStatus}</div>
                            )}
                            {lastImportedAt && !profileStatus && (
                                <div className="text-[11px] text-slate-500">
                                    Last imported: <span className="text-slate-400">{lastImportedAt}</span>
                                </div>
                            )}
                        </div>

                        {/* How to find Account ID */}
                        <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5 space-y-2 mt-1">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                How to find your Account ID
                            </div>
                            <div className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                                <div>
                                    <span className="text-slate-300 font-medium">PC: </span>
                                    Open{" "}
                                    <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">
                                        %localappdata%\Warframe\EE.log
                                    </code>{" "}
                                    and search for <span className="font-mono text-slate-300">"Logged in"</span> — your account ID will be in the parentheses next to it.
                                </div>
                                <div>
                                    <span className="text-slate-300 font-medium">Console (PS / Xbox / Switch): </span>
                                    No confirmed self-serve method is currently known following update 38.0.8. Check the{" "}
                                    <span className="text-slate-300">Warframe Wiki or official forums</span> for any newly documented approach.
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-600 pt-0.5">
                                As of update 38.0.8, account IDs can no longer be looked up by username. Account ID + Platform are stored locally only.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
