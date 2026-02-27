// ===== FILE: src/pages/Syndicates.tsx =====
import SyndicatesGrid from "../components/SyndicatesGrid";

export default function Syndicates() {
    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Syndicates</div>
                <div className="text-sm text-slate-400 mt-1">
                    Enter values manually or import via the Profile panel in the header. Relay faction ranks support negatives
                    (down to -2).
                </div>
            </div>

            <SyndicatesGrid />
        </div>
    );
}
