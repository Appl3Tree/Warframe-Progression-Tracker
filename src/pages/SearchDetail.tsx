import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { WorkspaceAction, WorkspaceHero, WorkspaceSection, WorkspaceStat } from "../components/workspace/WorkspaceChrome";
import { getAcquisitionByCatalogId } from "../catalog/items/itemAcquisition";
import { resolveItemRequirementGraph, type ItemRequirementEdge } from "../catalog/items/itemRequirements";
import { SOURCE_INDEX } from "../catalog/sources/sourceCatalog";
import { FULL_CATALOG } from "../domain/catalog/loadFullCatalog";
import { useTrackerStore } from "../store/store";
import {
    buildSearchDetailHash,
    getCatalogIdForPath,
    getSearchDetailRefForCatalogId,
    getSearchEntity,
    getSearchEntityData,
    getSearchEntityImageUrl,
    getSearchEntityWikiUrl,
    type SearchDetailRef,
    type SearchEntityRecord,
} from "../domain/search/globalSearch";

type DropEntry = {
    chance: number;
    location: string;
    rarity?: string;
    type?: string;
};

type DetailMetaStat = {
    label: string;
    value: string;
};

type CraftingNode = {
    catalogId: string;
    name: string;
    count: number;
    owned: number;
    children: CraftingNode[];
};

type StepperControlProps = {
    label: string;
    value: string | number;
    onDecrease: () => void;
    onIncrease: () => void;
    decreaseDisabled?: boolean;
    increaseDisabled?: boolean;
    hint?: string;
};

const EMPTY_MOD_RANKS: Record<string, number> = {};
const EMPTY_ARCANE_RANKS: Record<string, Record<string, number>> = {};
const EMPTY_MASTERY: Record<string, boolean> = {};
const _statusImgs = import.meta.glob<string>("../assets/statuses/*.png", {
    eager: true,
    import: "default",
});
const STATUS_IMG: Record<string, string> = {};
for (const [path, url] of Object.entries(_statusImgs)) {
    const name = path.split("/").pop()!.replace(".png", "").toLowerCase();
    STATUS_IMG[name] = url;
}
const DT_TO_IMG: Record<string, string> = {
    dt_corrosive_color: "essentialcorrosiveglyph",
    dt_corrosive: "essentialcorrosiveglyph",
    dt_electricity_color: "electricmodbundleicon",
    dt_electricity: "electricmodbundleicon",
    dt_explosion_color: "essentialblastglyph",
    dt_explosion: "essentialblastglyph",
    dt_fire_color: "heatmodbundleicon",
    dt_fire: "heatmodbundleicon",
    dt_freeze_color: "coldmodbundleicon",
    dt_freeze: "coldmodbundleicon",
    dt_gas_color: "essentialgasglyph",
    dt_gas: "essentialgasglyph",
    dt_impact_color: "essentialimpactglyph",
    dt_magnetic_color: "essentialmagneticglyph",
    dt_magnetic: "essentialmagneticglyph",
    dt_poison_color: "toxinmodbundleicon",
    dt_poison: "toxinmodbundleicon",
    dt_puncture_color: "essentialpunctureglyph",
    dt_radiant_color: "essentialradiationglyph",
    dt_radiation_color: "essentialradiationglyph",
    dt_radiation: "essentialradiationglyph",
    dt_sentient_color: "essentialtauglyph",
    dt_sentient: "essentialtauglyph",
    dt_slash_color: "essentialslashglyph",
    dt_slash: "essentialslashglyph",
    dt_viral_color: "essentialviralglyph",
    dt_viral: "essentialviralglyph",
};

function titleCase(value: string): string {
    return value
        .split(/[\s/_-]+/g)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function compactLabel(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

function formatNumber(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "—";
    return value.toLocaleString();
}

function formatBool(value: boolean | null | undefined): string {
    if (value == null) return "—";
    return value ? "Yes" : "No";
}

function formatDate(value: unknown): string {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : "—";
}

function formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
}

function formatPolarity(value: unknown): string {
    return typeof value === "string" && value.trim() ? titleCase(value) : "—";
}

function cleanCatalogSubtitle(value: string): string {
    return compactLabel(value.replace(/\s*·\s*/g, " · "));
}

function splitCatalogSubtitle(value: string): string[] {
    return cleanCatalogSubtitle(value)
        .split("·")
        .map((part) => compactLabel(part))
        .filter(Boolean);
}

function buildSupportingDescription(entitySubtitle: string, description: unknown): string {
    if (typeof description === "string" && description.trim()) return description.trim();
    const parts = splitCatalogSubtitle(entitySubtitle);
    return parts.length > 0 ? parts.join(" · ") : "Catalog entry";
}

function renderCodexText(text: string): ReactNode {
    const cleaned = text
        .replace(/\\n/g, "\n")
        .replace(/<LINE_SEPARATOR>/g, " · ")
        .replace(/<LOWER_IS_BETTER>/g, "")
        .replace(/<[A-Z_]+_SECONDARY_COLOR>/g, "")
        .replace(/<\/[A-Z_]+_SECONDARY_COLOR>/g, "")
        .replace(/<(?!DT_)[A-Z_\/]+>/g, "");

    const parts = cleaned.split(/(<DT_[A-Z_]+>|\|[A-Z_0-9]+\||\n)/);
    if (parts.length === 1) return cleaned;

    const nodes: ReactNode[] = [];
    for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        if (!part) continue;
        if (part === "\n") {
            nodes.push(<br key={i} />);
            continue;
        }
        if (part.startsWith("<DT_") && part.endsWith(">")) {
            const key = part.slice(1, -1).toLowerCase();
            const imgName = DT_TO_IMG[key];
            const imgUrl = imgName ? STATUS_IMG[imgName] : null;
            const alt = key.replace("dt_", "").replace(/_color$/, "").replace(/_/g, " ");
            if (imgUrl) {
                nodes.push(
                    <img
                        key={i}
                        src={imgUrl}
                        alt={alt}
                        title={titleCase(alt)}
                        className="mx-0.5 inline h-4 w-4 rounded-sm object-contain align-[-0.15em]"
                    />,
                );
                continue;
            }
            nodes.push(titleCase(alt));
            continue;
        }
        if (part.startsWith("|") && part.endsWith("|")) {
            continue;
        }
        nodes.push(part);
    }

    return <>{nodes}</>;
}

function cleanSourceLabel(label: string): string {
    return compactLabel(
        label
            .replace(/^WFItems Location:\s*/i, "")
            .replace(/^Mission Reward:\s*/i, "")
            .replace(/\s+\(([^)]+)\)\s*$/i, " ($1)"),
    );
}

function getSourceGroup(label: string): string {
    const normalized = label.toLowerCase();
    if (normalized.includes("rotation")) return "Drop Rotation";
    if (normalized.includes("sanctuary") || normalized.includes("conclave") || normalized.includes("sortie")) return "Activity";
    if (normalized.includes("market")) return "Market";
    if (normalized.includes("vendor") || normalized.includes("syndicate")) return "Vendor";
    if (normalized.includes("relic")) return "Relic";
    return "Source";
}

function asDrops(value: unknown): DropEntry[] {
    if (!Array.isArray(value)) return [];
    const parsed = value
        .map((entry): DropEntry | null => {
            if (!entry || typeof entry !== "object") return null;
            const item = entry as Record<string, unknown>;
            const location = typeof item.location === "string" ? item.location.trim() : "";
            const chance = typeof item.chance === "number" ? item.chance : Number(item.chance);
            if (!location || !Number.isFinite(chance)) return null;
            return {
                location,
                chance,
                rarity: typeof item.rarity === "string" ? item.rarity : undefined,
                type: typeof item.type === "string" ? item.type : undefined,
            };
        })
        .filter((entry): entry is DropEntry => entry !== null);

    return parsed.sort((a, b) => b.chance - a.chance).slice(0, 12);
}

function statLinesFor(entry: SearchEntityRecord | null): string[] {
    if (!entry || !Array.isArray(entry.levelStats) || entry.levelStats.length === 0) return [];
    const lastRank = entry.levelStats[entry.levelStats.length - 1];
    if (!lastRank || typeof lastRank !== "object") return [];
    const stats = (lastRank as { stats?: unknown }).stats;
    if (!Array.isArray(stats)) return [];
    return stats.filter((line): line is string => typeof line === "string" && line.trim().length > 0).slice(0, 10);
}

function buildOverviewStats(args: {
    kind: SearchDetailRef["kind"];
    entitySubtitle: string;
    entry: SearchEntityRecord;
}): DetailMetaStat[] {
    const subtitleParts = splitCatalogSubtitle(args.entitySubtitle);
    const category = subtitleParts[0] ?? "Item";
    const specialization = subtitleParts.slice(1).join(" · ");
    const rarity = typeof args.entry.rarity === "string" && args.entry.rarity.trim() ? titleCase(args.entry.rarity) : "—";
    const compatibility = typeof args.entry.compatName === "string" && args.entry.compatName.trim() ? compactLabel(args.entry.compatName) : "—";
    const modSet = typeof args.entry.modSet === "string" && args.entry.modSet.trim() ? compactLabel(args.entry.modSet) : "—";
    const ducats = typeof args.entry.ducats === "number" ? formatNumber(args.entry.ducats) : "—";

    return [
        { label: "Category", value: category },
        ...(specialization ? [{ label: "Profile", value: specialization }] : []),
        ...(args.kind !== "item" && compatibility !== "—" ? [{ label: "Compatibility", value: compatibility }] : []),
        ...(rarity !== "—" ? [{ label: "Rarity", value: rarity }] : []),
        { label: "Release", value: formatDate(args.entry.releaseDate) },
        { label: "Tradable", value: formatBool(typeof args.entry.tradable === "boolean" ? args.entry.tradable : null) },
        { label: "Mastery Req", value: formatNumber(typeof args.entry.masteryReq === "number" ? args.entry.masteryReq : null) },
        { label: "Polarity", value: formatPolarity(args.entry.polarity) },
        { label: "Market Cost", value: formatNumber(typeof args.entry.marketCost === "number" ? args.entry.marketCost : null) },
        ...(ducats !== "—" ? [{ label: "Ducats", value: ducats }] : []),
        ...(modSet !== "—" ? [{ label: "Set", value: modSet }] : []),
    ].filter((item) => item.value !== "—" || item.label === "Tradable");
}

function isExplicitBlueprintItem(catalogId: string, name: string): boolean {
    const cidStr = String(catalogId).toLowerCase();
    const nm = String(name ?? "").toLowerCase();
    return nm.endsWith(" blueprint") || cidStr.endsWith("blueprint");
}

function isDirectMarketPurchasableOutput(catalogId: string): boolean {
    const rec = FULL_CATALOG.recordsById[catalogId as keyof typeof FULL_CATALOG.recordsById];
    const raw: any = rec?.raw as any;
    const data = raw?.rawLotus?.data ?? raw?.data ?? null;
    if (!data || typeof data !== "object") return false;

    const regularPrice = Number((data as any).RegularPrice ?? 0);
    const premiumPrice = Number((data as any).PremiumPrice ?? 0);
    return (Number.isFinite(regularPrice) && regularPrice > 0) || (Number.isFinite(premiumPrice) && premiumPrice > 0);
}

function getDirectRequirementsForCraftingTree(catalogId: string): ItemRequirementEdge[] {
    const rec = FULL_CATALOG.recordsById[catalogId as keyof typeof FULL_CATALOG.recordsById];
    const name = rec?.displayName ?? String(catalogId);
    const resolution = resolveItemRequirementGraph(catalogId as never);

    if (!isExplicitBlueprintItem(catalogId, name)) {
        const blueprintEdge = resolution.edges.find((edge) =>
            edge.provenance === "wfcd-output-blueprint" || edge.provenance === "derived-output-blueprint",
        );
        if (isDirectMarketPurchasableOutput(catalogId) && !blueprintEdge) return [];
        if (blueprintEdge) return [blueprintEdge];
    }

    return Array.isArray(resolution.edges) ? resolution.edges : [];
}

function getDisplayName(catalogId: string): string {
    return FULL_CATALOG.recordsById[catalogId as keyof typeof FULL_CATALOG.recordsById]?.displayName ?? catalogId;
}

function buildCraftingTree(catalogId: string, counts: Record<string, number>, depth = 0, seen = new Set<string>()): CraftingNode[] {
    if (depth > 4 || seen.has(catalogId)) return [];

    const nextSeen = new Set(seen);
    nextSeen.add(catalogId);

    const edges = getDirectRequirementsForCraftingTree(catalogId);
    return edges.map((edge) => ({
        catalogId: edge.catalogId,
        name: getDisplayName(edge.catalogId),
        count: edge.count,
        owned: Number(counts[edge.catalogId] ?? 0),
        children: buildCraftingTree(edge.catalogId, counts, depth + 1, nextSeen),
    }));
}

function CraftingTreeNode(props: { node: CraftingNode; depth: number; onOpenDetail?: (catalogId: string) => void }) {
    const hasChildren = props.node.children.length > 0;
    const [expanded, setExpanded] = useState(props.depth < 1);
    const canOpenDetail = Boolean(getSearchDetailRefForCatalogId(props.node.catalogId as never));

    return (
        <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {canOpenDetail && props.onOpenDetail ? (
                            <button
                                type="button"
                                onClick={() => props.onOpenDetail?.(props.node.catalogId)}
                                className="text-left text-sm font-medium text-[color:var(--wf-accent-strong)] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
                            >
                                {props.node.name}
                            </button>
                        ) : (
                            <div className="text-sm font-medium text-[color:var(--wf-text-strong)]">{props.node.name}</div>
                        )}
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => setExpanded((value) => !value)}
                                className="inline-flex items-center rounded-full border border-[color:var(--wf-border-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--wf-text-dim)] transition hover:border-[color:var(--wf-border-strong)] hover:text-[color:var(--wf-text-strong)]"
                                aria-expanded={expanded}
                            >
                                {expanded ? "Hide components" : `Show components (${props.node.children.length})`}
                            </button>
                        ) : null}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--wf-text-dim)]">
                        Need {props.node.count} · Owned {props.node.owned}
                    </div>
                </div>
                <div
                    className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        props.node.owned >= props.node.count
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-amber-500/10 text-amber-200",
                    ].join(" ")}
                >
                    {props.node.owned >= props.node.count ? "Ready" : "Missing"}
                </div>
            </div>
            {hasChildren && expanded ? (
                <div className="mt-3 ml-4 space-y-3 border-l border-[color:var(--wf-border-subtle)] pl-4">
                    {props.node.children.map((child) => (
                        <CraftingTreeNode key={`${child.catalogId}-${props.depth + 1}`} node={child} depth={props.depth + 1} onOpenDetail={props.onOpenDetail} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function CraftingTreeList(props: { nodes: CraftingNode[]; depth?: number; onOpenDetail?: (catalogId: string) => void }) {
    const depth = props.depth ?? 0;
    if (props.nodes.length === 0) return null;

    return (
        <div className={depth === 0 ? "space-y-3" : "ml-4 space-y-3 border-l border-[color:var(--wf-border-subtle)] pl-4"}>
            {props.nodes.map((node) => (
                <CraftingTreeNode key={`${node.catalogId}-${depth}`} node={node} depth={depth} onOpenDetail={props.onOpenDetail} />
            ))}
        </div>
    );
}

function StepperControl(props: StepperControlProps) {
    return (
        <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--wf-text-dim)]">{props.label}</div>
                    {props.hint ? <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">{props.hint}</div> : null}
                </div>
                <div className="flex items-center overflow-hidden rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface)]">
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center text-lg text-[color:var(--wf-text-dim)] transition hover:bg-white/5 hover:text-[color:var(--wf-text-strong)] disabled:cursor-not-allowed disabled:opacity-35"
                        onClick={props.onDecrease}
                        disabled={props.decreaseDisabled}
                    >
                        −
                    </button>
                    <div className="flex min-w-[3.5rem] items-center justify-center border-x border-[color:var(--wf-border-subtle)] px-3 text-sm font-semibold text-[color:var(--wf-text-strong)]">
                        {props.value}
                    </div>
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center text-lg text-[color:var(--wf-text-dim)] transition hover:bg-white/5 hover:text-[color:var(--wf-text-strong)] disabled:cursor-not-allowed disabled:opacity-35"
                        onClick={props.onIncrease}
                        disabled={props.increaseDisabled}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SearchDetail(props: {
    detailRef: SearchDetailRef | null;
    onClose?: () => void;
    onNavigate?: (ref: SearchDetailRef) => void;
    canGoBack?: boolean;
    onBack?: () => void;
    mode?: "page" | "panel";
}) {
    const setActivePage = useTrackerStore((s) => s.setActivePage);
    const addGoalItem = useTrackerStore((s) => s.addGoalItem);
    const setCount = useTrackerStore((s) => s.setCount);
    const setModRank = useTrackerStore((s) => s.setModRank);
    const setArcaneRankCount = useTrackerStore((s) => s.setArcaneRankCount);
    const counts = useTrackerStore((s) => s.state.inventory.counts);
    const modRanks = useTrackerStore((s) => s.state.inventory.modRanks ?? EMPTY_MOD_RANKS);
    const arcaneRanks = useTrackerStore((s) => s.state.inventory.arcaneRanks ?? EMPTY_ARCANE_RANKS);
    const mastered = useTrackerStore((s) => s.state.mastery.mastered ?? EMPTY_MASTERY);
    const detailRef = props.detailRef;
    const mode = props.mode ?? "page";

    const entity = useMemo(() => (detailRef ? getSearchEntity(detailRef) : null), [detailRef]);
    const entry = useMemo(() => (detailRef ? getSearchEntityData(detailRef) : null), [detailRef]);
    const catalogId = useMemo(() => (detailRef ? getCatalogIdForPath(detailRef.id) : null), [detailRef]);
    const acquisition = useMemo(() => (catalogId ? getAcquisitionByCatalogId(catalogId) : null), [catalogId]);
    const acquisitionSources = useMemo(() => {
        if (!acquisition) return [];
        const seen = new Set<string>();
        return acquisition.sources
            .slice(0, 16)
            .map((sourceId) => cleanSourceLabel(SOURCE_INDEX[sourceId as keyof typeof SOURCE_INDEX]?.label ?? sourceId))
            .filter((label) => {
                if (!label || seen.has(label)) return false;
                seen.add(label);
                return true;
            })
            .slice(0, 8)
            .map((label) => ({
                label,
                group: getSourceGroup(label),
            }));
    }, [acquisition]);
    const drops = useMemo(() => asDrops(entry?.drops), [entry]);
    const stats = useMemo(() => statLinesFor(entry), [entry]);
    const overviewStats = useMemo(
        () => buildOverviewStats({ kind: detailRef?.kind ?? "item", entitySubtitle: entity?.subtitle ?? "", entry: entry ?? {} }),
        [detailRef?.kind, entity?.subtitle, entry],
    );
    const descriptionNode = useMemo(
        () => renderCodexText(buildSupportingDescription(entity?.subtitle ?? "", entry?.description)),
        [entity?.subtitle, entry?.description],
    );
    const craftingTree = useMemo(
        () => (detailRef?.kind === "item" && catalogId ? buildCraftingTree(catalogId, counts) : []),
        [catalogId, counts, detailRef?.kind],
    );

    const imageUrl = getSearchEntityImageUrl(entry);
    const wikiUrl = getSearchEntityWikiUrl(entry, entity?.name);
    const countKey = detailRef?.kind === "item" ? catalogId : detailRef?.kind === "mod" ? `mods:${detailRef.id}` : null;
    const maxRank = typeof entry?.fusionLimit === "number" ? entry.fusionLimit : 0;
    const ownedCount = countKey ? Number(counts[countKey] ?? 0) : 0;
    const ownedRank = detailRef?.kind === "mod" ? Number(modRanks[detailRef.id] ?? 0) : null;
    const ownedArcaneRanks = detailRef?.kind === "arcane" ? arcaneRanks[detailRef.id] ?? {} : {};
    const totalArcaneCopies = Object.values(ownedArcaneRanks).reduce((sum, value) => sum + Number(value ?? 0), 0);
    const isMastered = catalogId ? Boolean(mastered[catalogId]) : null;
    const isOwned = detailRef?.kind === "arcane" ? totalArcaneCopies > 0 : ownedCount > 0;
    const arcaneRankEntries = detailRef?.kind === "arcane" ? Array.from({ length: maxRank + 1 }, (_, rank) => ({
        rank,
        count: Number(ownedArcaneRanks[String(rank)] ?? 0),
    })) : [];

    function closePanel() {
        if (props.onClose) {
            props.onClose();
            return;
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    function clearDetailAndGo(page: "dashboard" | "inventory" | "mods" | "arcanes") {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setActivePage(page);
    }

    function openCatalogDetail(catalogId: string) {
        const nextRef = getSearchDetailRefForCatalogId(catalogId as never);
        if (!nextRef) return;

        if (props.onNavigate) {
            props.onNavigate(nextRef);
            return;
        }

        window.location.hash = buildSearchDetailHash(nextRef);
    }

    function toggleOwnedState() {
        if (!detailRef) return;
        if (detailRef.kind === "arcane") {
            const ranksToClear = Object.keys(ownedArcaneRanks);
            for (const rank of ranksToClear) {
                setArcaneRankCount(detailRef.id, Number(rank), 0);
            }
            if (!isOwned) {
                setArcaneRankCount(detailRef.id, 0, 1);
            }
            return;
        }

        if (!countKey) return;
        if (isOwned) {
            setCount(countKey, 0);
            if (detailRef.kind === "mod") setModRank(detailRef.id, 0);
            return;
        }

        setCount(countKey, 1);
        if (detailRef.kind === "mod") {
            setModRank(detailRef.id, maxRank > 0 ? maxRank : 0);
        }
    }

    if (!detailRef || !entity || !entry) {
        return (
            <div className="space-y-4">
                <WorkspaceHero
                    eyebrow="Search Detail"
                    title="Dossier not found"
                    description="This detail link is missing or no longer matches a catalog entry."
                    actions={<WorkspaceAction onClick={() => (mode === "panel" ? closePanel() : clearDetailAndGo("dashboard"))}>{mode === "panel" ? "Close Panel" : "Return to Dashboard"}</WorkspaceAction>}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <WorkspaceHero
                eyebrow={detailRef.kind === "item" ? "Item Dossier" : detailRef.kind === "mod" ? "Mod Dossier" : "Arcane Dossier"}
                title={entity.name}
                description=""
                actions={
                    <>
                        {catalogId && detailRef.kind === "item" ? (
                            <WorkspaceAction onClick={() => addGoalItem(catalogId, 1)}>Add Goal</WorkspaceAction>
                        ) : null}
                        {mode === "panel" && props.canGoBack ? (
                            <WorkspaceAction onClick={props.onBack}>Back</WorkspaceAction>
                        ) : null}
                        <WorkspaceAction onClick={toggleOwnedState}>
                            {isOwned ? "Mark Unowned" : "Mark Owned"}
                        </WorkspaceAction>
                        {wikiUrl ? (
                            <WorkspaceAction onClick={() => window.open(wikiUrl, "_blank", "noopener,noreferrer")}>Wiki</WorkspaceAction>
                        ) : null}
                        <WorkspaceAction onClick={() => (mode === "panel" ? closePanel() : clearDetailAndGo("dashboard"))}>
                            {mode === "panel" ? "Close Panel" : "Close View"}
                        </WorkspaceAction>
                    </>
                }
                stats={
                    <>
                        <WorkspaceStat label="Owned" value={detailRef.kind === "arcane" ? totalArcaneCopies : ownedCount} hint={cleanCatalogSubtitle(entity.subtitle)} />
                        <WorkspaceStat label="Mastered" value={formatBool(isMastered)} hint="Progress tracker" />
                        <WorkspaceStat label="Max Rank" value={formatNumber(typeof entry.fusionLimit === "number" ? entry.fusionLimit : null)} hint={detailRef.kind === "item" ? "Upgradeable entries only" : "Catalog max rank"} />
                        <WorkspaceStat
                            label={detailRef.kind === "arcane" ? "Tracked Ranks" : "Tracked Rank"}
                            value={detailRef.kind === "arcane" ? Object.keys(ownedArcaneRanks).length : formatNumber(ownedRank)}
                            hint={detailRef.kind === "arcane" ? "Unique owned arcane ranks" : "Highest owned rank"}
                        />
                    </>
                }
                className="overflow-hidden"
            />
            <div className="-mt-1 px-1 text-sm leading-7 text-[color:var(--wf-text-muted)]">
                {descriptionNode}
            </div>

            <WorkspaceSection
                title="Collection"
                subtitle={detailRef.kind === "arcane" ? "Track owned copies by arcane rank directly from the inspector." : "Update owned state and collection progress without leaving the panel."}
            >
                {detailRef.kind === "arcane" ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-4">
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--wf-text-dim)]">Ownership</div>
                                <div className="mt-2 text-lg font-medium text-[color:var(--wf-text-strong)]">{isOwned ? "Owned" : "Not owned"}</div>
                                <div className="mt-1 text-sm text-[color:var(--wf-text-muted)]">{totalArcaneCopies} total copies across {Object.keys(ownedArcaneRanks).length} tracked ranks</div>
                            </div>
                            <WorkspaceAction onClick={toggleOwnedState}>{isOwned ? "Clear Collection" : "Add 1 at Rank 0"}</WorkspaceAction>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {arcaneRankEntries.map((entryAtRank) => (
                                <StepperControl
                                    key={entryAtRank.rank}
                                    label={`Rank ${entryAtRank.rank}`}
                                    value={entryAtRank.count}
                                    hint="Owned copies"
                                    onDecrease={() => setArcaneRankCount(detailRef.id, entryAtRank.rank, Math.max(0, entryAtRank.count - 1))}
                                    onIncrease={() => setArcaneRankCount(detailRef.id, entryAtRank.rank, entryAtRank.count + 1)}
                                    decreaseDisabled={entryAtRank.count <= 0}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        <StepperControl
                            label="Owned Copies"
                            value={ownedCount}
                            hint={detailRef.kind === "mod" ? "Collection count for this mod" : "Collection count for this item"}
                            onDecrease={() => {
                                if (!countKey) return;
                                const nextCount = Math.max(0, ownedCount - 1);
                                setCount(countKey, nextCount);
                                if (detailRef.kind === "mod" && nextCount === 0) setModRank(detailRef.id, 0);
                            }}
                            onIncrease={() => {
                                if (!countKey) return;
                                const wasUnowned = ownedCount <= 0;
                                setCount(countKey, ownedCount + 1);
                                if (detailRef.kind === "mod" && wasUnowned && maxRank > 0) setModRank(detailRef.id, maxRank);
                            }}
                            decreaseDisabled={ownedCount <= 0}
                        />
                        {detailRef.kind === "mod" ? (
                            <StepperControl
                                label="Tracked Rank"
                                value={`R${ownedRank ?? 0}`}
                                hint={maxRank > 0 ? `Highest owned rank, up to R${maxRank}` : "Highest owned rank"}
                                onDecrease={() => setModRank(detailRef.id, Math.max(0, Number(ownedRank ?? 0) - 1))}
                                onIncrease={() => setModRank(detailRef.id, Math.min(maxRank, Number(ownedRank ?? 0) + 1))}
                                decreaseDisabled={ownedCount <= 0 || Number(ownedRank ?? 0) <= 0}
                                increaseDisabled={ownedCount <= 0 || Number(ownedRank ?? 0) >= maxRank}
                            />
                        ) : (
                            <div className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-4">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--wf-text-dim)]">Ownership</div>
                                <div className="mt-2 text-lg font-medium text-[color:var(--wf-text-strong)]">{isOwned ? "Owned" : "Not owned"}</div>
                                <div className="mt-1 text-sm leading-6 text-[color:var(--wf-text-muted)]">
                                    Use the counter to reflect how many copies you currently have in inventory.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </WorkspaceSection>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                <WorkspaceSection
                    title="Overview"
                    subtitle="Clean reference details, tuned for scanning instead of raw catalog debugging."
                >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                        <div className="overflow-hidden rounded-[28px] border border-[color:var(--wf-border-subtle)] bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_55%),linear-gradient(180deg,rgba(30,41,59,0.58),rgba(15,23,42,0.72))]">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={entity.name}
                                    className="h-full min-h-[280px] w-full object-contain p-6"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex min-h-[280px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] px-6 text-center text-sm text-[color:var(--wf-text-dim)]">
                                    No artwork available for this entry.
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {overviewStats.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--wf-text-dim)]">{item.label}</div>
                                    <div className="mt-2 text-lg font-medium leading-tight text-[color:var(--wf-text-strong)]">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </WorkspaceSection>

                <WorkspaceSection
                    title="Actions"
                    subtitle="Continue from the inspector without breaking your flow."
                >
                    <div className="grid gap-3">
                        <WorkspaceAction onClick={() => clearDetailAndGo("inventory")} className="justify-start">
                            Open Inventory Workspace
                        </WorkspaceAction>
                        <WorkspaceAction onClick={() => clearDetailAndGo(detailRef.kind === "arcane" ? "arcanes" : "mods")} className="justify-start">
                            {detailRef.kind === "arcane" ? "Open Arcanes Workspace" : "Open Mods Workspace"}
                        </WorkspaceAction>
                        <WorkspaceAction
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}${window.location.search}${buildSearchDetailHash(detailRef)}`).catch(() => undefined);
                            }}
                            className="justify-start"
                        >
                            Copy Deep Link
                        </WorkspaceAction>
                        <div className="rounded-2xl border border-dashed border-[color:var(--wf-border-subtle)] px-4 py-3 text-sm leading-relaxed text-[color:var(--wf-text-muted)]">
                            Keep the inspector open while browsing builds, drops, or mods in the background.
                        </div>
                    </div>
                </WorkspaceSection>
            </div>

            {stats.length > 0 ? (
                <WorkspaceSection title="Key Effects" subtitle="Highest-rank effect lines, cleaned up for fast scanning.">
                    <div className="grid gap-2 md:grid-cols-2">
                        {stats.map((line) => (
                            <div
                                key={line}
                                className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--wf-text)]"
                            >
                                {renderCodexText(line)}
                            </div>
                        ))}
                    </div>
                </WorkspaceSection>
            ) : null}

            {acquisitionSources.length > 0 ? (
                <WorkspaceSection title="Acquisition" subtitle="Best known ways to get this item, with internal IDs removed.">
                    <div className="grid gap-2 md:grid-cols-2">
                        {acquisitionSources.map((source) => (
                            <div
                                key={`${source.group}-${source.label}`}
                                className="rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3"
                            >
                                <div className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--wf-text-dim)]">{source.group}</div>
                                <div className="mt-2 text-sm leading-relaxed text-[color:var(--wf-text-strong)]">{source.label}</div>
                            </div>
                        ))}
                    </div>
                </WorkspaceSection>
            ) : null}

            {craftingTree.length > 0 ? (
                <WorkspaceSection title="Crafting Tree" subtitle="Build path and component requirements for this crafted item.">
                    <CraftingTreeList nodes={craftingTree} onOpenDetail={openCatalogDetail} />
                </WorkspaceSection>
            ) : null}

            {drops.length > 0 ? (
                <WorkspaceSection title="Drop Snapshot" subtitle="Most relevant drop entries, shown without raw source keys.">
                    <div className="overflow-hidden rounded-[24px] border border-[color:var(--wf-border-subtle)]">
                        <div className="grid grid-cols-[minmax(0,1fr)_110px_110px] bg-[color:var(--wf-surface-soft)] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">
                            <div>Location</div>
                            <div>Chance</div>
                            <div>Rarity</div>
                        </div>
                        {drops.map((drop) => (
                            <div
                                key={`${drop.location}-${drop.chance}`}
                                className="grid grid-cols-[minmax(0,1fr)_110px_110px] border-t border-[color:var(--wf-border-subtle)] px-4 py-3 text-sm"
                            >
                                <div className="min-w-0 text-[color:var(--wf-text-strong)]">{drop.location}</div>
                                <div className="text-[color:var(--wf-text)]">{formatPercent(drop.chance)}</div>
                                <div className="text-[color:var(--wf-text-dim)]">{drop.rarity ?? drop.type ?? "—"}</div>
                            </div>
                        ))}
                    </div>
                </WorkspaceSection>
            ) : null}
        </div>
    );
}
