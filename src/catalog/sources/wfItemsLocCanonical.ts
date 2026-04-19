// src/catalog/sources/wfItemsLocCanonical.ts

export type CanonicalWfItemsLoc = {
    canonicalSourceId: string;
    canonicalLabel: string;
    legacySourceId: string;
};

/**
 * Tokenization aligned with SourceId expectations:
 * - lowercase
 * - strip punctuation
 * - collapse whitespace
 * - hyphenate
 *
 * Keep this stable; it becomes part of IDs.
 */
export function wfItemsToToken(s: string): string {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+/g, "-");
}

function titleCaseWords(s: string): string {
    return s
        .split(/[\s-]+/g)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

/**
 * canonicalizeWfItemsLocation
 * Converts WFItems "location" strings into a canonical SourceId family where possible.
 *
 * Always returns:
 * - legacySourceId: data:wfitems:loc:<token> (for backward compatibility)
 * - canonicalSourceId: preferred SourceId (may equal legacy if no rule matches)
 */
export function canonicalizeWfItemsLocation(location: string): CanonicalWfItemsLoc {
    const raw = String(location ?? "").trim();
    const token = wfItemsToToken(raw);
    const legacySourceId = `data:wfitems:loc:${token}`;

    if (!token) {
        return {
            canonicalSourceId: "data:unknown",
            canonicalLabel: "WFItems Location: (Unknown)",
            legacySourceId: "data:unknown"
        };
    }

    // ----------------------------
    // Duviri: Murmur Invasion rewards
    // ----------------------------
    {
        const m = token.match(/^duviri-murmur-invasion-rewards-(steel-path-)?rotation-([abc])$/);
        if (m) {
            const isSteelPath = Boolean(m[1]);
            const rot = m[2].toUpperCase();

            return {
                canonicalSourceId: isSteelPath
                    ? `data:duviri/murmur-invasion/rewards/steel-path/rotation-${m[2]}`
                    : `data:duviri/murmur-invasion/rewards/rotation-${m[2]}`,
                canonicalLabel: isSteelPath
                    ? `Duviri: Murmur Invasion rewards (Steel Path, Rotation ${rot})`
                    : `Duviri: Murmur Invasion rewards (Rotation ${rot})`,
                legacySourceId
            };
        }
    }

    // ----------------------------
    // WFItems junk: "requiem-undefined-relic"
    // Expand it to a real, stable relic bucket so nothing ever emits the undefined id.
    // NOTE: If you do not have a bucket source in your catalog, do NOT do this here.
    // In that case, fix it in the acquisition builder by expanding to I–IV instead.
    // ----------------------------
    if (token === "requiem-undefined-relic") {
        return {
            canonicalSourceId: "data:relic/requiem",
            canonicalLabel: "Relic: Requiem (Any)",
            legacySourceId
        };
    }

    // ----------------------------
    // Relics:
    // - lith/meso/neo/axi-<code>-relic      => data:relic/<era>/<code>
    // - vanguard-<code>-relic               => data:relic/vanguard/<code>
    // - requiem-(i|ii|iii|iv)-relic         => data:relic/requiem/<roman>
    //
    // NOTE: Handle requiem-undefined-relic explicitly (see above) so it never survives as a sourceId.
    // ----------------------------
    {
        const m = token.match(/^(lith|meso|neo|axi|vanguard)-([a-z0-9]+)-relic$/);
        if (m) {
            const era = m[1];
            const code = m[2];

            // Guard: WFItems sometimes gives junk like "requiem-undefined-relic" (handled below)
            return {
                canonicalSourceId: `data:relic/${era}/${code}`,
                canonicalLabel: `Relic: ${era.toUpperCase()} ${code.toUpperCase()}`,
                legacySourceId
            };
        }
    }

    {
        const m = token.match(/^requiem-(i|ii|iii|iv)-relic$/);
        if (m) {
            const code = m[1];
            return {
                canonicalSourceId: `data:relic/requiem/${code}`,
                canonicalLabel: `Relic: Requiem ${code.toUpperCase()}`,
                legacySourceId
            };
        }
    }

    // ----------------------------
    // Conclave ranks: conclave-typhoon => data:conclave/<rank>
    // (You already have data:conclave as a coarse bucket; this gives you stable sub-ids.)
    // ----------------------------
    {
        const m = token.match(/^conclave-([a-z0-9-]+)$/);
        if (m) {
            const rank = m[1];
            return {
                canonicalSourceId: `data:conclave/${rank}`,
                canonicalLabel: `Conclave: ${titleCaseWords(rank)}`,
                legacySourceId
            };
        }
    }

    // ----------------------------
    // Syndicates where WFItems bakes in "the-" or "steel-" etc.
    // Keep the surface area small and deterministic: map only obvious vendor-ladder shapes.
    // Examples in your snapshot:
    // - steel-meridian-general
    // - the-perrin-sequence-executive
    // - the-holdfasts-cavalero-guardian
    // - the-quills-architect
    // ----------------------------
    {
        // arbiters-of-hexis-<rank>
        const m = token.match(/^arbiters-of-hexis-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/syndicate/arbiters-of-hexis",
                canonicalLabel: "Syndicate Vendor: Arbiters of Hexis",
                legacySourceId
            };
        }
    }
    {
        // cephalon-suda-<rank>
        const m = token.match(/^cephalon-suda-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/syndicate/cephalon-suda",
                canonicalLabel: "Syndicate Vendor: Cephalon Suda",
                legacySourceId
            };
        }
    }
    {
        // new-loka-<rank>
        const m = token.match(/^new-loka-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/syndicate/new-loka",
                canonicalLabel: "Syndicate Vendor: New Loka",
                legacySourceId
            };
        }
    }
    {
        // red-veil-<rank>
        const m = token.match(/^red-veil-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/syndicate/red-veil",
                canonicalLabel: "Syndicate Vendor: Red Veil",
                legacySourceId
            };
        }
    }
    {
        // steel-meridian-<rank>
        const m = token.match(/^steel-meridian-([a-z0-9-]+)$/);
        if (m) {
            const rank = m[1];
            return {
                canonicalSourceId: `data:syndicate/steel-meridian/${rank}`,
                canonicalLabel: `Steel Meridian: ${titleCaseWords(rank)}`,
                legacySourceId
            };
        }
    }
    {
        // the-perrin-sequence-<rank>
        const m = token.match(/^the-perrin-sequence-([a-z0-9-]+)$/);
        if (m) {
            const rank = m[1];
            return {
                canonicalSourceId: `data:syndicate/perrin-sequence/${rank}`,
                canonicalLabel: `The Perrin Sequence: ${titleCaseWords(rank)}`,
                legacySourceId
            };
        }
    }
    {
        // the-holdfasts-<vendor>-<rank>
        const m = token.match(/^the-holdfasts-([a-z0-9-]+)-([a-z0-9-]+)$/);
        if (m) {
            const vendor = m[1];
            const rank = m[2];
            if (vendor === "hombask") {
                return {
                    canonicalSourceId: "data:vendor/zariman/holdfasts",
                    canonicalLabel: "Buy from the Holdfasts (Zariman)",
                    legacySourceId
                };
            }
            if (vendor === "cavalero") {
                return {
                    canonicalSourceId: "data:vendor/zariman/cavalero",
                    canonicalLabel: "Buy from Cavalero (Zariman)",
                    legacySourceId
                };
            }
            if (vendor === "yonta") {
                return {
                    canonicalSourceId: "data:vendor/zariman/yonta",
                    canonicalLabel: "Buy from Archimedean Yonta (Zariman)",
                    legacySourceId
                };
            }
            return {
                canonicalSourceId: `data:syndicate/holdfasts/${vendor}/${rank}`,
                canonicalLabel: `The Holdfasts (${titleCaseWords(vendor)}): ${titleCaseWords(rank)}`,
                legacySourceId
            };
        }
    }
    {
        // the-quills-<rank>
        const m = token.match(/^the-quills-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/quills",
                canonicalLabel: "Buy from The Quills (Cetus)",
                legacySourceId
            };
        }
    }

    // ----------------------------
    // Curated vendor families from WFItems vendor labels.
    // Collapse rank-specific vendor strings onto the curated vendor source ids
    // that the rest of the app understands for availability gating.
    // ----------------------------
    {
        const m = token.match(/^ostron-hok-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/hok",
                canonicalLabel: "Buy from Hok (Cetus)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^ostron-fisher-hai-luk-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/hai-luk",
                canonicalLabel: "Buy from Hai-Luk (Cetus)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^ostron-old-man-suumbaat-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/suumbaat",
                canonicalLabel: "Buy from Old Man Suumbaat (Cetus)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^ostron-master-teasonai-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/teasonai",
                canonicalLabel: "Buy from Master Teasonai (Cetus)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^ostron-nakak-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/cetus/nakak",
                canonicalLabel: "Buy from Nakak (Cetus)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^solaris-united-legs-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/fortuna/legs",
                canonicalLabel: "Buy from Legs (Fortuna)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^solaris-united-the-business-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/fortuna/business",
                canonicalLabel: "Buy from The Business (Fortuna)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^solaris-united-rude-zuud-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/fortuna/rude-zuud",
                canonicalLabel: "Buy from Rude Zuud (Fortuna)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^solaris-united-smokefinger-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/fortuna/smokefinger",
                canonicalLabel: "Buy from Smokefinger (Fortuna)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^ventkids-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/fortuna/ventkids",
                canonicalLabel: "Buy from Ventkids (Fortuna)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^entrati-daughter-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/deimos/daughter",
                canonicalLabel: "Buy from Daughter (Deimos)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^entrati-grandmother$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/deimos/entrati",
                canonicalLabel: "Buy from the Entrati Family (Deimos)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^entrati-son-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/deimos/son",
                canonicalLabel: "Buy from Son (Deimos)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^entrati-father-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/deimos/father",
                canonicalLabel: "Buy from Father (Deimos)",
                legacySourceId
            };
        }
    }
    {
        const m = token.match(/^kahls-garrison-chipper-([a-z0-9-]+)$/);
        if (m) {
            return {
                canonicalSourceId: "data:vendor/kahl-garrison/chipper",
                canonicalLabel: "Buy from Chipper (Kahl's Garrison)",
                legacySourceId
            };
        }
    }

    // ----------------------------
    // Common enemies/boss-ish buckets seen in your snapshot.
    // Keep it conservative: enemy/<token> for these known patterns.
    // ----------------------------
    {
        const m = token.match(/^(shadow-stalker|protector-stalker|exploiter-orb|the-sergeant)$/);
        if (m) {
            const enemy = m[1];
            return {
                canonicalSourceId: `data:enemy/${enemy}`,
                canonicalLabel: `Enemy: ${titleCaseWords(enemy)}`,
                legacySourceId
            };
        }
    }
    {
        // thumpers (tusk-thumper[-bull|-doma], narmer-thumper[-bull|-doma])
        const m = token.match(/^((tusk|narmer)-thumper(?:-(?:bull|doma))?)$/);
        if (m) {
            const enemy = m[1];
            return {
                canonicalSourceId: `data:enemy/${enemy}`,
                canonicalLabel: `Enemy: ${titleCaseWords(enemy)}`,
                legacySourceId
            };
        }
    }

    // ----------------------------
    // Duviri endless tiers: duviriendless-tier-6-normal => data:duviri/endless/tier-6/normal
    // ----------------------------
    {
        const m = token.match(/^duviriendless-tier-([0-9]+)-(normal|hard)$/);
        if (m) {
            const tier = m[1];
            const mode = m[2];
            return {
                canonicalSourceId: `data:duviri/endless/tier-${tier}/${mode}`,
                canonicalLabel: `Duviri Endless: Tier ${tier} (${mode === "hard" ? "Hard" : "Normal"})`,
                legacySourceId
            };
        }
    }

    // Fallback: keep it as legacy “wfitems loc”.
    return {
        canonicalSourceId: legacySourceId,
        canonicalLabel: `WFItems Location: ${raw}`,
        legacySourceId
    };
}
