// ===== FILE: src/components/ExportImport.tsx =====
import { useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../store/store";
import {
    isConfigured,
    isConnected,
    connect,
    disconnect,
    saveToGoogleDrive,
    restoreFromGoogleDrive,
    getLastSyncTime,
} from "../lib/googleDrive";

function downloadText(filename: string, text: string, mimeType = "application/json;charset=utf-8"): void {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return "just now";
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m} minute${m === 1 ? "" : "s"} ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h} hour${h === 1 ? "" : "s"} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? "" : "s"} ago`;
}

// ── Google Drive section ──────────────────────────────────────────────────────

function GoogleDriveSection({ exportJson }: { exportJson: () => string }) {
    const importProgressPackJson = useTrackerStore((s) => s.importProgressPackJson);

    const configured = isConfigured();
    const [connected, setConnected]   = useState(isConnected);
    const [driveStatus, setDriveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [busy, setBusy]             = useState(false);
    const [lastSync, setLastSync]     = useState<string | null>(getLastSyncTime);

    // Refresh connected state whenever the section mounts or window regains focus
    useEffect(() => {
        const onFocus = () => setConnected(isConnected());
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    async function handleConnect() {
        setBusy(true);
        setDriveStatus(null);
        try {
            await connect();
            setConnected(true);
            setDriveStatus({ msg: "Connected to Google Drive.", ok: true });
        } catch (e: any) {
            setDriveStatus({ msg: e.message ?? "Connection failed.", ok: false });
        } finally {
            setBusy(false);
        }
    }

    async function handleSave() {
        setBusy(true);
        setDriveStatus(null);
        try {
            const json = exportJson();
            const result = await saveToGoogleDrive(json);
            setLastSync(result.modifiedTime);
            setDriveStatus({ msg: "Saved to Google Drive.", ok: true });
        } catch (e: any) {
            setDriveStatus({ msg: e.message ?? "Save failed.", ok: false });
        } finally {
            setBusy(false);
        }
    }

    async function handleRestore() {
        if (!confirm("Restore from Google Drive?\n\nThis will overwrite your current local progress. Continue?")) return;
        setBusy(true);
        setDriveStatus(null);
        try {
            const json = await restoreFromGoogleDrive();
            const res  = importProgressPackJson(json);
            setDriveStatus({
                msg: res.ok ? "Progress restored from Google Drive." : (res.error ?? "Restore failed."),
                ok: res.ok,
            });
        } catch (e: any) {
            setDriveStatus({ msg: e.message ?? "Restore failed.", ok: false });
        } finally {
            setBusy(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm("Disconnect from Google Drive?\n\nThis only removes the connection in this browser. Your backup file in Drive is not deleted.")) return;
        await disconnect();
        setConnected(false);
        setLastSync(null);
        setDriveStatus(null);
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    {/* Google Drive color icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a15.92 15.92 0 0 0 2.1 8z" fill="#0066da"/>
                        <path d="M43.65 25L29.9 1.2A15.35 15.35 0 0 0 26.6 4.5L3.1 45.5A15.8 15.8 0 0 0 1 53h27.55z" fill="#00ac47"/>
                        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25A15.8 15.8 0 0 0 88.3 50H60.7L73.55 76.8z" fill="#ea4335"/>
                        <path d="M43.65 25L57.4 1.2C56.05.45 54.5 0 52.85 0H34.45c-1.65 0-3.2.45-4.55 1.2z" fill="#00832d"/>
                        <path d="M60.7 53H27.55L13.8 76.8c1.35.75 2.9 1.2 4.55 1.2h50.6c1.65 0 3.2-.45 4.55-1.2z" fill="#2684fc"/>
                        <path d="M73.4 26.5l-23.5-40.65A15.35 15.35 0 0 0 46.55 25H88.3a15.8 15.8 0 0 0-2.1-7.5L73.4 26.5z" fill="#ffba00"/>
                    </svg>
                    <div className="text-lg font-semibold">Google Drive Backup</div>
                    {connected && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-700/50 px-2 py-0.5 text-xs text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                            Connected
                        </span>
                    )}
                </div>

                {/* Plain-language explanation */}
                <div className="mt-2 rounded-xl border border-slate-700/60 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-400 space-y-1.5">
                    <p>
                        <span className="text-slate-200 font-medium">What this does: </span>
                        Your progress is normally stored only in <span className="text-slate-300">this browser</span>.
                        If you clear your browser data, it's gone. Google Drive Backup saves a copy of your progress
                        to a file in <span className="text-slate-300">your own Google Drive</span> so you can
                        restore it anytime — or pick it up on another device.
                    </p>
                    <p>
                        <span className="text-slate-200 font-medium">Privacy: </span>
                        The app only gets permission to access the single file it creates
                        (<span className="font-mono text-slate-300 text-xs">wf-tracker-progress.json</span>).
                        It cannot read, modify, or see anything else in your Drive.
                    </p>
                    <p className="text-xs text-slate-500">
                        Saves are <span className="text-slate-400">manual</span> — your Drive file only updates when you click
                        "Save to Drive". Nothing is sent automatically.
                    </p>
                </div>
            </div>

            {/* Not configured — show setup instructions */}
            {!configured && (
                <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-3 text-sm text-amber-300 space-y-2">
                    <div className="font-semibold text-amber-200">Setup required</div>
                    <p className="text-amber-400/90">
                        To enable Google Drive, a <code className="font-mono text-xs bg-amber-950/40 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> must
                        be set in the app's environment. See <code className="font-mono text-xs bg-amber-950/40 px-1 rounded">.env.example</code> in
                        the repository for step-by-step instructions.
                    </p>
                </div>
            )}

            {/* Configured — show connect/action buttons */}
            {configured && (
                <div className="space-y-3">
                    {!connected ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-700/60 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-950/50 transition-colors disabled:opacity-50"
                                onClick={handleConnect}
                                disabled={busy}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                                {busy ? "Connecting…" : "Connect Google Drive"}
                            </button>
                            <span className="text-xs text-slate-500">
                                A Google sign-in window will open.
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-950/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-950/40 transition-colors disabled:opacity-50"
                                    onClick={handleSave}
                                    disabled={busy}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                                    {busy ? "Saving…" : "Save to Drive"}
                                </button>
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/30 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-50"
                                    onClick={handleRestore}
                                    disabled={busy}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 16 12 12 16 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                                    {busy ? "Restoring…" : "Restore from Drive"}
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                {lastSync && (
                                    <span>
                                        Last saved: <span className="text-slate-400">{formatRelativeTime(lastSync)}</span>
                                        <span className="text-slate-600 ml-1">({new Date(lastSync).toLocaleString()})</span>
                                    </span>
                                )}
                                <button
                                    className="text-slate-600 hover:text-rose-400 transition-colors"
                                    onClick={handleDisconnect}
                                    disabled={busy}
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Status message */}
            {driveStatus && (
                <p className={["text-sm font-medium", driveStatus.ok ? "text-emerald-400" : "text-rose-400"].join(" ")}>
                    {driveStatus.ok ? "✓" : "✗"} {driveStatus.msg}
                </p>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExportImport() {
    const exportProgressPackJson = useTrackerStore((s) => s.exportProgressPackJson);
    const importProgressPackJson = useTrackerStore((s) => s.importProgressPackJson);

    const [text, setText] = useState("");
    const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);

    function handleImportText() {
        if (!text.trim()) { setStatus({ msg: "Nothing to import — paste your progress pack first.", ok: false }); return; }
        const res = importProgressPackJson(text);
        setStatus({ msg: res.ok ? "Import successful." : (res.error ?? "Import failed."), ok: res.ok });
    }

    function handleImportFile(raw: string) {
        const res = importProgressPackJson(raw);
        setStatus({ msg: res.ok ? "Import successful." : (res.error ?? "Import failed."), ok: res.ok });
    }

    return (
        <div className="space-y-4">
            {/* Progress Pack */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Progress Pack</div>
                <div className="text-sm text-slate-400 mt-1">
                    Export your entire local progress to JSON so you can back it up or move it to another device.
                    Import a previously exported pack to restore your progress.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        className="rounded-lg bg-slate-100 px-4 py-2 text-slate-900 text-sm font-semibold hover:bg-white transition-colors"
                        onClick={() => {
                            const json = exportProgressPackJson();
                            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                            downloadText(`wf-progress-pack-${stamp}.json`, json);
                        }}
                    >
                        Download Backup
                    </button>
                    <button
                        className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 text-sm hover:bg-slate-900 transition-colors"
                        onClick={() => setText(exportProgressPackJson())}
                    >
                        Copy to Text Area
                    </button>
                    <button
                        className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 text-sm hover:bg-slate-900 transition-colors"
                        onClick={() => fileRef.current?.click()}
                    >
                        Restore from File
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleImportFile(await file.text());
                            e.target.value = "";
                        }}
                    />
                </div>

                <textarea
                    className="mt-4 w-full min-h-[180px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 font-mono text-xs resize-y focus:outline-none focus:border-slate-500"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste a Progress Pack here to restore, or use 'Copy to Text Area' to export…"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                        className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 text-sm hover:bg-slate-900 transition-colors"
                        onClick={handleImportText}
                    >
                        Restore from Text
                    </button>
                    {text && (
                        <button
                            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-400 text-sm hover:bg-slate-900 transition-colors"
                            onClick={() => { setText(""); setStatus(null); }}
                        >
                            Clear
                        </button>
                    )}
                    {status && (
                        <span className={["text-sm font-medium", status.ok ? "text-green-400" : "text-rose-400"].join(" ")}>
                            {status.ok ? "✓" : "✗"} {status.msg}
                        </span>
                    )}
                </div>
            </div>

            {/* Google Drive */}
            <GoogleDriveSection exportJson={exportProgressPackJson} />

            {/* Help */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 text-base">How to back up & restore</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                    <li>Click <span className="text-slate-200 font-medium">Download Backup</span> to save a JSON file to your computer.</li>
                    <li>To restore on this device or another, click <span className="text-slate-200 font-medium">Restore from File</span> and select the JSON file.</li>
                    <li>Alternatively, use <span className="text-slate-200 font-medium">Copy to Text Area</span> to get the JSON, paste it elsewhere, then use <span className="text-slate-200 font-medium">Restore from Text</span> to import it back.</li>
                    <li>For seamless cross-device sync, connect <span className="text-slate-200 font-medium">Google Drive Backup</span> above and click <span className="text-slate-200 font-medium">Save to Drive</span> after sessions you want to preserve.</li>
                </ol>
                <p className="text-xs text-slate-500 pt-1">
                    Your progress is stored in your browser's local storage. Clearing browser data will erase it — keep a backup file or use Google Drive Backup.
                </p>
            </div>
        </div>
    );
}
