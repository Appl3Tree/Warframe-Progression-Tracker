// ===== FILE: src/components/ExportImport.tsx =====
import { useRef, useState } from "react";
import { useTrackerStore } from "../store/store";

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

            {/* Help */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 text-base">How to back up & restore</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                    <li>Click <span className="text-slate-200 font-medium">Download Backup</span> to save a JSON file to your computer.</li>
                    <li>To restore on this device or another, click <span className="text-slate-200 font-medium">Restore from File</span> and select the JSON file.</li>
                    <li>Alternatively, use <span className="text-slate-200 font-medium">Copy to Text Area</span> to get the JSON, paste it elsewhere (e.g. a note), then use <span className="text-slate-200 font-medium">Restore from Text</span> to import it back.</li>
                </ol>
                <p className="text-xs text-slate-500 pt-1">
                    Your progress is stored in your browser's local storage. Clearing browser data will erase it — keep a backup file.
                </p>
            </div>
        </div>
    );
}
