type ReleaseDateCapable = {
  uniqueName?: string;
  category?: string;
  type?: string;
  releaseDate?: string;
};

// Manual release-date fallback entries.
// These are only used when upstream data does not already provide a releaseDate.
// Keep this file limited to Warframes/Vehicles, Weapons, and Mods that are missing
// release dates in the generated upstream sources.
export const MANUAL_RELEASE_DATES_BY_UNIQUE_NAME: Record<string, string> = {
};

function isEligibleManualReleaseDateCategory(entry: ReleaseDateCapable): boolean {
  const category = String(entry.category ?? "").trim();
  if (!category) return false;

  return (
    category === "Warframes" ||
    category === "Primary" ||
    category === "Secondary" ||
    category === "Melee" ||
    category === "Arch-Gun" ||
    category === "Arch-Melee" ||
    category === "Sentinel Weapons" ||
    category === "Mods"
  );
}

export function getManualReleaseDateFallback(entry: ReleaseDateCapable | null | undefined): string | undefined {
  if (!entry) return undefined;
  if (typeof entry.releaseDate === "string" && entry.releaseDate.trim()) return entry.releaseDate;
  if (!isEligibleManualReleaseDateCategory(entry)) return undefined;

  const uniqueName = String(entry.uniqueName ?? "").trim();
  if (!uniqueName) return undefined;
  return MANUAL_RELEASE_DATES_BY_UNIQUE_NAME[uniqueName];
}

export function withManualReleaseDateFallback<T extends ReleaseDateCapable>(entry: T): T {
  const releaseDate = getManualReleaseDateFallback(entry);
  if (!releaseDate || releaseDate === entry.releaseDate) return entry;
  return {
    ...entry,
    releaseDate,
  };
}
