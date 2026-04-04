function compactWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function titleCaseToken(value: string): string {
    return value
        .split(/[\s_-]+/g)
        .filter(Boolean)
        .map((word) => {
            const lower = word.toLowerCase();
            if (lower === "sp") return "SP";
            if (/^[abc]$/.test(lower)) return lower.toUpperCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
}

function humanizeSegment(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const rotationMatch = trimmed.match(/^rotation([a-z])$/i);
    if (rotationMatch) return `Rotation ${rotationMatch[1].toUpperCase()}`;

    return titleCaseToken(trimmed);
}

const LEADING_TECHNICAL_SEGMENTS = new Set([
    "data",
    "src",
    "id",
    "drop",
    "node",
    "mr",
    "missionreward",
    "wfitems",
    "loc",
]);

const OPTIONAL_CATEGORY_SEGMENTS = new Set([
    "vendor",
    "activity",
    "openworld",
    "system",
    "resource",
    "enemy",
    "enemydrop",
    "resourcebyavatar",
    "additionalitembyavatar",
    "key",
    "transient",
]);

export function formatTechnicalId(value: string): string {
    const raw = compactWhitespace(String(value ?? ""));
    if (!raw) return "";

    const segments = raw
        .replace(/^lotus:/i, "")
        .split(/[:/]+/g)
        .map((segment) => segment.trim())
        .filter(Boolean);

    while (segments.length > 0 && LEADING_TECHNICAL_SEGMENTS.has(segments[0].toLowerCase())) {
        segments.shift();
    }

    if (segments.length > 1 && OPTIONAL_CATEGORY_SEGMENTS.has(segments[0].toLowerCase())) {
        segments.shift();
    }

    const cleaned = segments.map(humanizeSegment).filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(" - ") : raw;
}

export function formatSourceDisplayLabel(value: string): string {
    const raw = compactWhitespace(String(value ?? ""));
    if (!raw) return "";

    const strippedLabel = compactWhitespace(
        raw
            .replace(/^WFItems Location:\s*/i, "")
            .replace(/^Mission Reward:\s*/i, "")
            .replace(/^Node:\s*/i, "")
            .replace(/^Legacy:\s*/i, "")
            .replace(/\s*\/\s*/g, " - "),
    );

    if (/^(?:data|src|node|id):/i.test(strippedLabel) || /^lotus:/i.test(strippedLabel)) {
        return formatTechnicalId(strippedLabel);
    }

    return strippedLabel;
}
