import { useRef, useState } from "react";
import { useTrackerStore } from "../store/store";

function downloadText(filename: string, text: string): void {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
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
    const fileRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Progress Pack (Export / Import)</div>
            <div className="text-sm text-slate-400 mt-1">
                This exports/imports your entire local progress. Current schema is v2 (includes prerequisites).
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    className="rounded-lg bg-slate-100 px-4 py-2 text-slate-900 font-semibold"
                    onClick={() => setText(exportProgressPackJson())}
                >
                    Export to Text
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const json = exportProgressPackJson();
                        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                        downloadText(`wf-progress-pack-v2-${stamp}.json`, json);
                    }}
                >
                    Download JSON
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const res = importProgressPackJson(text);
                        if (!res.ok) {
                            alert(res.error ?? "Import failed.");
                        } else {
                            alert("Import OK.");
                        }
                    }}
                >
                    Import from Text
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => fileRef.current?.click()}
                >
                    Import from File
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => setText("")}
                >
                    Clear
                </button>

                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                            return;
                        }
                        const raw = await file.text();
                        const res = importProgressPackJson(raw);
                        if (!res.ok) {
                            alert(res.error ?? "Import failed.");
                        } else {
                            alert("Import OK.");
                        }
                        e.target.value = "";
                    }}
                />
            </div>

            <textarea
                className="mt-3 w-full min-h-[220px] rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Export will appear here. Paste a v2 Progress Pack JSON here to import."
            />
        </div>
    );
}

