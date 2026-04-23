import { FULL_CATALOG } from "../../domain/catalog/loadFullCatalog";

export type AcquisitionDef = {
    sources: string[];
};

const INCARNON_GENESIS_SOURCE = "data:duviri/circuit/steel-path";

export function deriveIncarnonGenesisAcquisitionByCatalogId(): Record<string, AcquisitionDef> {
    const out: Record<string, AcquisitionDef> = {};
    const recordsById: Record<string, any> = (FULL_CATALOG as any).recordsById ?? {};

    for (const [catalogId, rec] of Object.entries(recordsById)) {
        const path = String(rec?.path ?? "");
        const displayName = String(rec?.displayName ?? "");
        if (!path.startsWith("/Lotus/Types/Items/MiscItems/IncarnonAdapters/") && !/ Incarnon Genesis$/.test(displayName)) {
            continue;
        }
        out[catalogId] = { sources: [INCARNON_GENESIS_SOURCE] };
    }

    return out;
}
