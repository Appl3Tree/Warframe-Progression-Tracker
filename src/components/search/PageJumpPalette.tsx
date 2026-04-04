import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_ROUTES, WORK_MODE_META, type NavRoute } from "../../app/routes";

function CompassIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="m14.8 9.2-1.9 5.6-5.7 1.9 1.9-5.6 5.7-1.9Z" />
        </svg>
    );
}

function scorePage(route: NavRoute, query: string, activePage: string): number {
    const normalized = query.trim().toLowerCase();
    const haystack = [
        route.label,
        route.shortLabel ?? "",
        route.desc,
        WORK_MODE_META[route.mode].label,
    ].join(" ").toLowerCase();

    let score = route.key === activePage ? 18 : 0;
    if (!normalized) {
        score += route.key === activePage ? 100 : 0;
        return score;
    }
    if (route.label.toLowerCase() === normalized) score += 140;
    else if (route.label.toLowerCase().startsWith(normalized)) score += 100;
    else if ((route.shortLabel ?? "").toLowerCase().startsWith(normalized)) score += 80;
    else if (haystack.includes(normalized)) score += 46;
    else score = -1;
    return score;
}

export default function PageJumpPalette(props: {
    activePage: string;
    onSelectPage: (route: NavRoute) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const results = useMemo(() => {
        return NAV_ROUTES
            .map((route) => ({ route, score: scorePage(route, query, props.activePage) }))
            .filter((entry) => entry.score >= 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.route.label.localeCompare(b.route.label);
            })
            .slice(0, query.trim() ? 8 : 6)
            .map((entry) => entry.route);
    }, [props.activePage, query]);

    const selectedRoute = results[highlightedIndex] ?? results[0] ?? null;
    const activeRoute = NAV_ROUTES.find((route) => route.key === props.activePage) ?? NAV_ROUTES[0];

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

            if (!isTypingTarget && event.key === "/") {
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

    useEffect(() => {
        setQuery("");
        setOpen(false);
    }, [props.activePage]);

    function choose(route: NavRoute) {
        props.onSelectPage(route);
        setQuery("");
        setOpen(false);
    }

    return (
        <div className="relative shrink-0" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    setOpen((value) => !value);
                    requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="flex h-10 items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/75 px-3 text-sm text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-900"
                title="Jump to a page"
            >
                <CompassIcon className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline">Pages</span>
                <span className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    /
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-40 mt-2 w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-[24px] border border-slate-700/80 bg-[linear-gradient(180deg,rgba(2,6,23,0.99),rgba(15,23,42,0.99))] shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <div className="border-b border-slate-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Page Jump
                    </div>
                    <div className="border-b border-slate-800 px-3 py-2">
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            placeholder={`Current: ${activeRoute.label}`}
                            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    setHighlightedIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
                                } else if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    setHighlightedIndex((current) => Math.max(current - 1, 0));
                                } else if (event.key === "Enter" && selectedRoute) {
                                    event.preventDefault();
                                    choose(selectedRoute);
                                } else if (event.key === "Escape") {
                                    setOpen(false);
                                }
                            }}
                        />
                    </div>
                    <div className="max-h-[360px] overflow-y-auto p-2">
                        {results.map((route, index) => {
                            const mode = WORK_MODE_META[route.mode];
                            const isActive = route.key === props.activePage;
                            const isHighlighted = index === highlightedIndex;

                            return (
                                <button
                                    key={route.key}
                                    type="button"
                                    className={[
                                        "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                                        isHighlighted ? "bg-slate-800 text-slate-50" : "text-slate-200 hover:bg-slate-900",
                                    ].join(" ")}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => choose(route)}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">{route.label}</span>
                                        <span className="mt-1 block truncate text-xs text-slate-500">{route.desc}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                            {mode.label}
                                        </span>
                                        {isActive ? (
                                            <span className="mt-1 inline-flex rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                                                Current
                                            </span>
                                        ) : null}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
