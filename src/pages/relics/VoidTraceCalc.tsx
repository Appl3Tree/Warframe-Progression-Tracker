import { useState } from "react";
import { WorkspacePanel, WorkspaceSegmented, WorkspaceSegmentedButton } from "../../components/workspace/WorkspaceChrome";

const REFINEMENT_COSTS = [
    { label: "Intact", traces: 0, dropRates: { Rare: 2, Uncommon: 11, Common: 25.33 } },
    { label: "Exceptional", traces: 25, dropRates: { Rare: 4, Uncommon: 13, Common: 23.33 } },
    { label: "Flawless", traces: 50, dropRates: { Rare: 6, Uncommon: 17, Common: 20 } },
    { label: "Radiant", traces: 100, dropRates: { Rare: 10, Uncommon: 20, Common: 16.67 } },
] as const;

export default function VoidTraceCalc() {
    const [traces, setTraces] = useState(0);
    const [target, setTarget] = useState<"Exceptional" | "Flawless" | "Radiant">("Radiant");
    const [runs, setRuns] = useState(10);

    const targetLevel = REFINEMENT_COSTS.find((r) => r.label === target) ?? REFINEMENT_COSTS[0];
    const cost = targetLevel.traces;
    const canRefine = cost > 0 ? Math.floor(traces / cost) : Infinity;

    return (
        <div className="space-y-4">
            <WorkspacePanel className="p-4">
                <div className="mb-1 text-lg font-semibold">Void Trace Budget</div>
                <p className="mb-4 text-sm text-slate-400">
                    Refining relics improves drop rates. Each refinement consumes void traces. See how many refinements you can afford.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Void traces you have</label>
                        <input
                            type="number"
                            min={0}
                            max={3300}
                            value={traces}
                            onChange={(e) => setTraces(Math.max(0, Math.min(3300, parseInt(e.target.value) || 0)))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                        />
                        <div className="mt-1 text-[10px] text-slate-600">Max capacity: 3,300 traces</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Target refinement</label>
                        <WorkspaceSegmented className="w-full gap-1.5 border-slate-700 bg-slate-900/40 shadow-none">
                            {(["Exceptional", "Flawless", "Radiant"] as const).map((lvl) => (
                                <WorkspaceSegmentedButton
                                    key={lvl}
                                    onClick={() => setTarget(lvl)}
                                    active={target === lvl}
                                    className="flex-1 rounded-lg border border-slate-700 px-2 py-2 text-xs"
                                >
                                    {lvl}
                                </WorkspaceSegmentedButton>
                            ))}
                        </WorkspaceSegmented>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                    <div className="text-sm text-slate-300">
                        With <span className="font-semibold text-slate-100">{traces.toLocaleString()} traces</span> you can
                        refine to <span className="font-semibold text-slate-100">{target}</span>
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                        {cost === 0 ? "∞" : canRefine.toLocaleString()}
                        <span className="ml-2 text-sm font-normal text-slate-400">times</span>
                    </div>
                    {cost > 0 && (
                        <div className="mt-1 text-xs text-slate-500">
                            {cost} traces per refinement
                            {canRefine > 0 && ` · ${(canRefine * cost).toLocaleString()} traces used · ${(traces - canRefine * cost).toLocaleString()} remaining`}
                        </div>
                    )}
                </div>
            </WorkspacePanel>

            <WorkspacePanel className="p-4">
                <div className="mb-1 text-lg font-semibold">Drop Rate Comparison</div>
                <p className="mb-4 text-sm text-slate-400">
                    How refinement improves your odds. Each relic has 3 common, 2 uncommon, and 1 rare slot.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                                <th className="pb-2 pr-4 text-left">Refinement</th>
                                <th className="pb-2 pr-4 text-right">Cost</th>
                                <th className="pb-2 pr-4 text-right text-amber-400">Rare</th>
                                <th className="pb-2 pr-4 text-right text-slate-300">Uncommon</th>
                                <th className="pb-2 text-right">Common</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {REFINEMENT_COSTS.map((lvl) => (
                                <tr key={lvl.label} className={lvl.label === target ? "bg-slate-800/40 transition-colors" : "transition-colors"}>
                                    <td className="py-2 pr-4 font-medium text-slate-200">
                                        {lvl.label}
                                        {lvl.label === target && <span className="ml-2 text-[10px] text-slate-500">← selected</span>}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono text-slate-400">
                                        {lvl.traces === 0 ? "free" : `${lvl.traces} traces`}
                                    </td>
                                    <td className="py-2 pr-4 text-right font-mono font-semibold text-amber-400">{lvl.dropRates.Rare}%</td>
                                    <td className="py-2 pr-4 text-right font-mono text-slate-300">{lvl.dropRates.Uncommon}%</td>
                                    <td className="py-2 text-right font-mono text-slate-400">{lvl.dropRates.Common}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="mt-3 text-[11px] text-slate-600">
                    Percentages are per-slot. Each slot is rolled independently. With 4 players each picking a reward, the effective rare chance per run is roughly 4× the per-slot rate when running Radiant relics cooperatively.
                </p>
            </WorkspacePanel>

            <WorkspacePanel className="p-4">
                <div className="mb-1 text-lg font-semibold">Runs → Traces Earned</div>
                <p className="mb-4 text-sm text-slate-400">
                    Estimate how many traces you'll earn from cracking relics. Opening a relic rewards traces based on how rare your chosen reward was.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">Planned runs</label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={runs}
                            onChange={(e) => setRuns(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                        />
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
                        <div className="text-xs text-slate-400">Estimated traces earned</div>
                        <div className="mt-0.5 text-xl font-bold">{(runs * 6).toLocaleString()}</div>
                        <div className="mt-1 text-[10px] text-slate-500">~6 traces/run average (varies by rarity picked)</div>
                    </div>
                </div>
            </WorkspacePanel>
        </div>
    );
}
