import SyndicatesGrid from "../components/SyndicatesGrid";

export default function Syndicates() {
    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-lg font-semibold">Syndicates</div>
                <div className="text-sm text-slate-400 mt-1">
                    Full syndicate ladders, Patch 41 overlays, and prerequisites land in Phase E.
                </div>
            </div>

            <SyndicatesGrid />
        </div>
    );
}

