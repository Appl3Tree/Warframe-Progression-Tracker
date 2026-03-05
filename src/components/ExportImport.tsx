import { useRef, useState } from "react";
import { useTrackerStore } from "../store/store";
import { buildProgressionPlan } from "../domain/logic/plannerEngine";
import { buildPrereqIndex } from "../domain/logic/prereqEngine";
import { PREREQ_REGISTRY } from "../catalog/prereqs/prereqRegistry";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import type { UserStateV2 } from "../domain/models/userState";

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

function buildMarkdownPlan(state: UserStateV2): string {
    const prereqIndex = buildPrereqIndex(PREREQ_REGISTRY);
    const completedMap = state.prereqs?.completed ?? {};
    const plan = buildProgressionPlan(completedMap);
    const inventory = state.inventory;
    const goals = Array.isArray(state.goals) ? state.goals : [];
    const player = state.player;

    const lines: string[] = [];
    const now = new Date().toLocaleString();

    lines.push("# Warframe Progression Plan");
    lines.push("");
    lines.push(`**Generated:** ${now}`);

    if (player?.displayName) {
        lines.push(`**Player:** ${player.displayName} (MR ${player.masteryRank ?? "?"})`);
    }
    lines.push("");

    // Active Goals
    const activeGoals = goals.filter((g: any) => g.isActive && g.type === "item");
    if (activeGoals.length > 0) {
        lines.push("## Active Goals");
        lines.push("");
        for (const g of activeGoals) {
            const rec = FULL_CATALOG.recordsById[g.catalogId as any];
            const name = rec?.displayName ?? g.catalogId;
            const have = Math.max(0, Math.floor(Number(inventory?.counts?.[g.catalogId] ?? 0)));
            const remaining = Math.max(0, (g.qty ?? 1) - have);
            const status = remaining === 0 ? " ✓" : ` (${have}/${g.qty})`;
            lines.push(`- ${name}${status}`);
            if (g.note) lines.push(`  > ${g.note}`);
        }
        lines.push("");
    }

    // Next Steps
    const steps = plan.steps ?? [];
    if (steps.length > 0) {
        lines.push("## Recommended Next Steps");
        lines.push("");
        for (const step of steps) {
            const completed = completedMap[step.prereqId] === true;
            const prefix = completed ? "- [x]" : "- [ ]";
            lines.push(`${prefix} **${step.title}**`);
            if (step.description) lines.push(`  *${step.description}*`);
            if (step.missingPrereqs?.length > 0) {
                lines.push(`  Missing prerequisites:`);
                for (const m of step.missingPrereqs) {
                    const label = prereqIndex[m as any]?.label ?? m;
                    lines.push(`  - ${label}`);
                }
            }
        }
        lines.push("");
    }

    // Completed Prerequisites
    const completedIds = Object.keys(completedMap).filter((k) => completedMap[k] === true);
    if (completedIds.length > 0) {
        lines.push("## Completed Prerequisites");
        lines.push("");
        for (const id of completedIds) {
            const label = prereqIndex[id as any]?.label ?? id;
            lines.push(`- [x] ${label}`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

function buildChecklistPlan(state: UserStateV2): string {
    const prereqIndex = buildPrereqIndex(PREREQ_REGISTRY);
    const completedMap = state.prereqs?.completed ?? {};
    const plan = buildProgressionPlan(completedMap);
    const inventory = state.inventory;
    const goals = Array.isArray(state.goals) ? state.goals : [];

    const lines: string[] = [];
    const now = new Date().toLocaleString();

    lines.push(`# Warframe Checklist — ${now}`);
    lines.push("");

    // Goals checklist
    const activeGoals = goals.filter((g: any) => g.isActive && g.type === "item");
    if (activeGoals.length > 0) {
        lines.push("## Item Goals");
        lines.push("");
        for (const g of activeGoals) {
            const rec = FULL_CATALOG.recordsById[g.catalogId as any];
            const name = rec?.displayName ?? g.catalogId;
            const have = Math.max(0, Math.floor(Number(inventory?.counts?.[g.catalogId] ?? 0)));
            const remaining = Math.max(0, (g.qty ?? 1) - have);
            const done = remaining === 0;
            lines.push(`- [${done ? "x" : " "}] ${name} (${have} / ${g.qty})`);
        }
        lines.push("");
    }

    // Prerequisites checklist
    const steps = plan.steps ?? [];
    if (steps.length > 0) {
        lines.push("## Next Steps");
        lines.push("");
        for (const step of steps) {
            const completed = completedMap[step.prereqId] === true;
            lines.push(`- [${completed ? "x" : " "}] ${step.title}`);
            if (step.description) lines.push(`  ${step.description}`);
        }
        lines.push("");
    }

    // All prerequisites
    const allPrereqs = PREREQ_REGISTRY;
    if (allPrereqs.length > 0) {
        lines.push("## All Prerequisites");
        lines.push("");
        for (const p of allPrereqs) {
            const done = completedMap[p.id] === true;
            lines.push(`- [${done ? "x" : " "}] ${p.label}`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

export default function ExportImport() {
    const exportProgressPackJson = useTrackerStore((s) => s.exportProgressPackJson);
    const importProgressPackJson = useTrackerStore((s) => s.importProgressPackJson);
    const state = useTrackerStore((s) => s.state);

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
                    Download File
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
                placeholder="Export will appear here. Paste a v2 Progress Pack text here to import."
            />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-lg font-semibold">Plan Export</div>
            <div className="text-sm text-slate-400 mt-1">
                Export your progression plan and goals as human-readable markdown or a checklist.
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const md = buildMarkdownPlan(state);
                        setText(md);
                    }}
                >
                    Preview Markdown Plan
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const md = buildMarkdownPlan(state);
                        const stamp = new Date().toISOString().slice(0, 10);
                        downloadText(`wf-plan-${stamp}.md`, md, "text/markdown;charset=utf-8");
                    }}
                >
                    Download Markdown (.md)
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const cl = buildChecklistPlan(state);
                        setText(cl);
                    }}
                >
                    Preview Checklist
                </button>

                <button
                    className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-900"
                    onClick={() => {
                        const cl = buildChecklistPlan(state);
                        const stamp = new Date().toISOString().slice(0, 10);
                        downloadText(`wf-checklist-${stamp}.md`, cl, "text/markdown;charset=utf-8");
                    }}
                >
                    Download Checklist (.md)
                </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
                Previewed text appears in the "Export will appear here" textarea above.
            </div>
        </div>
    );
}

