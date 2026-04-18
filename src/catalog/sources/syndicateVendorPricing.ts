import syndicatesJson from "../../../external/warframe-drop-data/raw/syndicates.json";

function normalize(value: string): string {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function itemNameVariants(name: string | string[]): string[] {
    const variants = new Set<string>();
    const add = (value: string) => {
        const normalized = normalize(value);
        if (normalized) variants.add(normalized);
    };

    const inputs = Array.isArray(name) ? name : [name];
    for (const input of inputs) {
        const base = String(input ?? "").trim();
        if (!base) continue;
        add(base);
        add(base.replace(/\s+blueprint$/i, ""));
        add(base.replace(/\s+\([^)]*\)$/g, ""));
        add(base.replace(/\s+\([^)]*\)$/g, "").replace(/\s+blueprint$/i, ""));
    }

    return [...variants];
}

type SyndicateVendorEntry = {
    item: string;
    place: string;
    standing: number;
};

type VendorOfferMatch = {
    vendorName: string;
    place: string;
    standing: number;
    rankName: string | null;
    rankNumber: number | null;
};

function normalizeRankLabel(value: string): string {
    return normalize(String(value ?? "").replace(/^rank\s*\d+\s*[:\-\u00a0 ]\s*/i, ""));
}

const SYNDICATE_RANK_ORDER = (() => {
    const out = new Map<string, number>();
    const root = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (!root || typeof root !== "object") return out;

    for (const [vendorName, entries] of Object.entries(root as Record<string, unknown>)) {
        if (!Array.isArray(entries)) continue;
        const seen = new Set<string>();
        let nextRank = 1;
        for (const row of entries as SyndicateVendorEntry[]) {
            const place = String(row.place ?? "").trim();
            if (!place.includes(",")) continue;
            const rankName = place.split(",").map((part) => part.trim()).filter(Boolean).at(-1);
            const normalizedRank = normalizeRankLabel(rankName ?? "");
            if (!normalizedRank || seen.has(normalizedRank)) continue;
            seen.add(normalizedRank);
            out.set(`${normalize(vendorName)}|${normalizedRank}`, nextRank);
            nextRank += 1;
        }
    }

    return out;
})();

const SYNDICATE_VENDOR_PRICE_BY_ITEM_AND_PLACE = (() => {
    const out = new Map<string, number>();
    const root = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (!root || typeof root !== "object") return out;

    for (const entries of Object.values(root as Record<string, unknown>)) {
        if (!Array.isArray(entries)) continue;
        for (const row of entries as SyndicateVendorEntry[]) {
            const item = normalize(row.item);
            const place = normalize(row.place);
            const standing = Number(row.standing ?? 0);
            if (!item || !place || !Number.isFinite(standing) || standing <= 0) continue;
            out.set(`${item}|${place}`, standing);
        }
    }

    return out;
})();

const SYNDICATE_VENDOR_OFFERS_BY_ITEM = (() => {
    const out = new Map<string, VendorOfferMatch[]>();
    const root = (syndicatesJson as any)?.syndicates ?? (syndicatesJson as any);
    if (!root || typeof root !== "object") return out;

    for (const [vendorName, entries] of Object.entries(root as Record<string, unknown>)) {
        if (!Array.isArray(entries)) continue;
        for (const row of entries as SyndicateVendorEntry[]) {
            const item = normalize(row.item);
            const place = String(row.place ?? "").trim();
            const standing = Number(row.standing ?? 0);
            if (!item || !place || !Number.isFinite(standing) || standing < 0) continue;

            const rankName = place.includes(",")
                ? place.split(",").map((part) => part.trim()).filter(Boolean).at(-1) ?? null
                : null;
            const rawRankNumber = rankName
                ? (SYNDICATE_RANK_ORDER.get(`${normalize(vendorName)}|${normalizeRankLabel(rankName)}`) ?? null)
                : null;
            const rankNumber = rawRankNumber != null && rawRankNumber <= 6 ? rawRankNumber : null;
            const normalizedRankName = rankNumber != null ? rankName : null;

            const match: VendorOfferMatch = {
                vendorName,
                place,
                standing,
                rankName: normalizedRankName,
                rankNumber,
            };

            const existing = out.get(item) ?? [];
            existing.push(match);
            out.set(item, existing);
        }
    }

    return out;
})();

export function parseSyndicateVendorPlace(label: string): string | null {
    const match = String(label ?? "").match(/Syndicate Vendor:\s*[^()]+\(([^)]+)\)/i);
    if (!match) return null;
    const place = match[1]?.trim();
    return place ? place : null;
}

export function parseSyndicateVendorLabel(label: string): {
    vendorName: string;
    place: string | null;
    rankName: string | null;
    rankNumber: number | null;
} | null {
    const raw = String(label ?? "").trim();
    const explicit = raw.match(/^Syndicate Vendor:\s*([^()]+?)\s*\(([^)]+)\)\s*$/i);
    if (explicit) {
        const vendorName = explicit[1].trim();
        const place = explicit[2].trim();
        const rankName = place.includes(",") ? place.split(",").map((part) => part.trim()).filter(Boolean).at(-1) ?? null : null;
        const rankNumber = rankName ? (SYNDICATE_RANK_ORDER.get(`${normalize(vendorName)}|${normalizeRankLabel(rankName)}`) ?? null) : null;
        return { vendorName, place, rankName, rankNumber };
    }

    const simple = raw.match(/^Syndicate Vendor:\s*(.+?)\s*$/i);
    if (!simple) return null;
    return {
        vendorName: simple[1].trim(),
        place: null,
        rankName: null,
        rankNumber: null,
    };
}

export function getSyndicateVendorPrice(itemName: string | string[], label: string): number | null {
    const place = parseSyndicateVendorPlace(label);
    if (!place) return null;

    const normalizedPlace = normalize(place);
    for (const variant of itemNameVariants(itemName)) {
        const standing = SYNDICATE_VENDOR_PRICE_BY_ITEM_AND_PLACE.get(`${variant}|${normalizedPlace}`);
        if (standing != null) return standing;
    }

    return null;
}

export function getSyndicateVendorOffer(itemName: string | string[], vendorName?: string | null): VendorOfferMatch | null {
    const normalizedVendor = normalize(vendorName ?? "");

    for (const variant of itemNameVariants(itemName)) {
        const offers = SYNDICATE_VENDOR_OFFERS_BY_ITEM.get(variant) ?? [];
        if (offers.length === 0) continue;

        const exactVendorMatch =
            normalizedVendor.length > 0
                ? offers.find((offer) => normalize(offer.vendorName) === normalizedVendor)
                : null;

        if (exactVendorMatch) return exactVendorMatch;
        if (!normalizedVendor && offers[0]) return offers[0];
    }

    return null;
}
