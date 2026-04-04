export function getEntityImageUrl(entry: { wikiaThumbnail?: unknown; imageName?: unknown } | null | undefined): string | null {
    if (!entry || typeof entry !== "object") return null;

    if (typeof entry.wikiaThumbnail === "string" && entry.wikiaThumbnail.trim()) {
        return entry.wikiaThumbnail.trim();
    }

    if (typeof entry.imageName === "string" && entry.imageName.trim()) {
        return `https://cdn.warframestat.us/img/${entry.imageName.trim()}`;
    }

    return null;
}
