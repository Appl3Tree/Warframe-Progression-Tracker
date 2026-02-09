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
            const rank = m[1];
            return {
                canonicalSourceId: `data:syndicate/quills/${rank}`,
                canonicalLabel: `The Quills: ${titleCaseWords(rank)}`,
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
