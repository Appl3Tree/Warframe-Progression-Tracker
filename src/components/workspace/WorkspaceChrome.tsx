import type { ReactNode } from "react";

function joinClasses(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export function WorkspacePanel(props: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={joinClasses(
                "rounded-[24px] border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-1)] shadow-[var(--wf-shadow-panel)]",
                props.className
            )}
        >
            {props.children}
        </section>
    );
}

export function WorkspaceStat(props: {
    label: string;
    value: string | number;
    hint?: string;
    className?: string;
}) {
    return (
        <div
            className={joinClasses(
                "rounded-2xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-4 py-3",
                props.className
            )}
        >
            <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--wf-text-dim)]">{props.label}</div>
            <div className="mt-1 font-mono text-lg text-[color:var(--wf-text-strong)]">{props.value}</div>
            {props.hint ? <div className="mt-1 text-xs text-[color:var(--wf-text-muted)]">{props.hint}</div> : null}
        </div>
    );
}

export function WorkspaceAction(props: {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
    title?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type={props.type ?? "button"}
            onClick={props.onClick}
            title={props.title}
            disabled={props.disabled}
            className={joinClasses(
                "rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--wf-text)] transition-colors hover:bg-[color:var(--wf-surface-strong)]",
                props.disabled ? "cursor-not-allowed opacity-40" : null,
                props.className
            )}
        >
            {props.children}
        </button>
    );
}

export function WorkspaceHero(props: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
    stats?: ReactNode;
    className?: string;
}) {
    return (
        <WorkspacePanel className={joinClasses("px-5 py-4", props.className)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--wf-accent-primary)]">
                        {props.eyebrow}
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold text-[color:var(--wf-text-strong)]">{props.title}</h1>
                    <p className="mt-1 text-sm text-[color:var(--wf-text-muted)]">{props.description}</p>
                </div>
                {props.actions ? <div className="flex flex-wrap items-center gap-2">{props.actions}</div> : null}
            </div>

            {props.stats ? <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{props.stats}</div> : null}
        </WorkspacePanel>
    );
}

export function WorkspaceSection(props: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <WorkspacePanel className={joinClasses("p-4", props.className)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-lg font-semibold text-[color:var(--wf-text-strong)]">{props.title}</div>
                    {props.subtitle ? <div className="mt-1 text-sm text-[color:var(--wf-text-muted)]">{props.subtitle}</div> : null}
                </div>
                {props.actions ? <div className="flex items-center gap-2">{props.actions}</div> : null}
            </div>
            <div className="mt-4">{props.children}</div>
        </WorkspacePanel>
    );
}

export function WorkspacePillButton(props: {
    label: string;
    active: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={props.onClick}
            className={joinClasses(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                props.active
                    ? "border-slate-100 bg-slate-100 text-slate-900"
                    : "border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-soft)] text-[color:var(--wf-text)] hover:bg-[color:var(--wf-surface-strong)]",
                props.className
            )}
        >
            {props.label}
        </button>
    );
}

export function WorkspaceSegmented(props: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={joinClasses(
                "flex w-fit gap-1 rounded-xl border border-[color:var(--wf-border-subtle)] bg-[color:var(--wf-surface-1)] p-1 shadow-[var(--wf-shadow-panel)]",
                props.className
            )}
        >
            {props.children}
        </div>
    );
}

export function WorkspaceSegmentedButton(props: {
    children: ReactNode;
    active: boolean;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <button
            onClick={props.onClick}
            disabled={props.disabled}
            title={props.title}
            className={joinClasses(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                props.active
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200",
                props.disabled ? "cursor-not-allowed opacity-40" : null,
                props.className
            )}
        >
            {props.children}
        </button>
    );
}

export function WorkspaceFilterBar(props: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={joinClasses("flex flex-wrap items-center justify-between gap-3", props.className)}>
            {props.children}
        </div>
    );
}

export function WorkspaceFilterGroup(props: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={joinClasses("flex flex-wrap items-center gap-2", props.className)}>
            {props.children}
        </div>
    );
}
