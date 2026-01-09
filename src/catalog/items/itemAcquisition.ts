// src/catalog/items/itemAcquisition.ts

import type { SourceId } from "../../domain/ids/sourceIds";
import { SRC } from "../../domain/ids/sourceIds";

export interface AcquisitionDef {
    sources: SourceId[];
}

/**
 * Transitional acquisition map keyed by *display name*.
 * Fail-closed: if not present, acquisition is unknown -> not accessible.
 */
export const ACQUISITION_BY_DISPLAY_NAME: Record<string, AcquisitionDef> = {
    "Mother Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Father Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Son Token": { sources: [SRC.VENDOR_ENTRATI] },
    "Daughter Token": { sources: [SRC.VENDOR_ENTRATI] },

    "Sly Vulpaphyla Tag": { sources: [SRC.HUB_NECRALISK] },
    "Vizier Predasite Tag": { sources: [SRC.HUB_NECRALISK] },

    "Orokin Orientation Matrix": { sources: [SRC.VENDOR_NECRALOID] },

    "Training Debt-Bond": { sources: [SRC.VENDOR_SOLARIS_UNITED] },
    "Vega Toroid": { sources: [SRC.HUB_FORTUNA] },
    "Calda Toroid": { sources: [SRC.HUB_FORTUNA] },
    "Sola Toroid": { sources: [SRC.HUB_FORTUNA] },

    "Voidplume Down": { sources: [SRC.VENDOR_HOLDFASTS] },
    "Entrati Obols": { sources: [SRC.VENDOR_CAVIA] },
    "Shrill Voca": { sources: [SRC.VENDOR_CAVIA] }
};

export function getAcquisitionByDisplayName(name: string): AcquisitionDef | null {
    const key = String(name ?? "").trim();
    if (!key) return null;
    return ACQUISITION_BY_DISPLAY_NAME[key] ?? null;
}

