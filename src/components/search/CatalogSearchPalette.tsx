import { useEffect, useMemo, useRef, useState } from "react";
import {
    buildSearchDetailHash,
    searchCatalogEntities,
    type SearchEntityResult,
} from "../../domain/search/globalSearch";

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

export default function CatalogSearchPalette() {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const results = useMemo(() => searchCatalogEntities(query, 12), [query]);
    const selectedResult = results[highlightedIndex] ?? results[0] ?? null;

    useEffect(() => {
        setHighlightedIndex(0);
    }, [query, open]);

    useEffect(() => {
        if (!open) return;
        function onMouseDown(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [open]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target?.isContentEditable;

            if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
            }
            if (!isTypingTarget && event.key === "Escape") {
                setOpen(false);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    function choose(result: SearchEntityResult) {
        window.location.hash = buildSearchDetailHash({ kind: result.kind, id: result.id });
        setQuery("");
        setOpen(false);
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="group flex h-11 items-center gap-2 rounded-full border border-slate-700/70 bg-[linear-gradient(180deg,rgba(6,11,24,0.98),rgba(12,20,37,0.98))] px-3 shadow-[0_18px_50px_rgba(2,6,23,0.28)] transition-all focus-within:border-amber-400/35 focus-within:shadow-[0_22px_60px_rgba(245,158,11,0.08)]">
                <SearchIcon className="h-4 w-4 shrink-0 text-amber-200/65" />
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    placeholder="Search the codex: items, mods, arcanes…"
                    aria-label="Catalog search"
                    className="w-full bg-transparent text-sm text-[color:var(--wf-text)] placeholder:text-slate-500 focus:outline-none"
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setOpen(true);
                            setHighlightedIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
                        } else if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setHighlightedIndex((current) => Math.max(current - 1, 0));
                        } else if (event.key === "Enter" && selectedResult) {
                            event.preventDefault();
                            choose(selectedResult);
                        } else if (event.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                />
                <div className="hidden items-center gap-1 text-[11px] text-slate-500 lg:flex">
                    <span className="hidden xl:inline">Search</span>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 px-1.5 py-1 font-mono text-[10px] leading-none text-slate-300 transition-colors group-focus-within:border-amber-400/30 group-focus-within:text-amber-100">
                        ⌘
                    </span>
                    <span className="text-slate-600 xl:hidden">/</span>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 px-1.5 py-1 font-mono text-[10px] leading-none text-slate-300 transition-colors group-focus-within:border-amber-400/30 group-focus-within:text-amber-100">
                        K
                    </span>
                </div>
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[24px] border border-slate-700/80 bg-[linear-gradient(180deg,rgba(2,6,23,0.99),rgba(15,23,42,0.99))] shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        <span>Catalog Search</span>
                        <span className="hidden sm:inline">Opens in side panel</span>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto p-2">
                        {!query.trim() ? (
                            <div className="px-3 py-8 text-center text-sm text-slate-500">
                                Start typing to search the catalog without mixing in page navigation.
                            </div>
                        ) : results.length === 0 ? (
                            <div className="px-3 py-8 text-center text-sm text-slate-500">
                                No catalog results match that search.
                            </div>
                        ) : (
                            results.map((result, index) => {
                                const isHighlighted = index === highlightedIndex;
                                return (
                                    <button
                                        key={`${result.kind}:${result.id}`}
                                        type="button"
                                        className={[
                                            "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                                            isHighlighted
                                                ? "bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.08))] text-[color:var(--wf-text-strong)]"
                                                : "text-[color:var(--wf-text)] hover:bg-slate-900/80",
                                        ].join(" ")}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => choose(result)}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium">{result.name}</span>
                                            <span className="mt-1 block truncate text-xs text-slate-400">{result.summary}</span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                {result.kind}
                                            </span>
                                            <span className="mt-1 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                                                {result.subtitle || "Open dossier"}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
