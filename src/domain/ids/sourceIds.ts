// src/domain/ids/sourceIds.ts

export type SourceId = string;

export const SRC = {
    HUB_CETUS: "hub:cetus",
    HUB_FORTUNA: "hub:fortuna",
    HUB_NECRALISK: "hub:necralisk",
    HUB_ZARIMAN: "hub:zariman",
    HUB_SANCTUM: "hub:sanctum",

    VENDOR_QUILLS: "vendor:quills",
    VENDOR_SOLARIS_UNITED: "vendor:solaris_united",
    VENDOR_ENTRATI: "vendor:entrati",
    VENDOR_NECRALOID: "vendor:necraloid",
    VENDOR_HOLDFASTS: "vendor:holdfasts",
    VENDOR_CAVIA: "vendor:cavia"
} as const satisfies Record<string, SourceId>;

