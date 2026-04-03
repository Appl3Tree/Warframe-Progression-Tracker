import type { ReactNode } from "react";

import { WorkspaceSegmented, WorkspaceSegmentedButton } from "../workspace/WorkspaceChrome";

function joinClasses(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const COLLECTION_LEDGER_SHELL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(8,14,28,0.96),rgba(3,7,18,0.92))] shadow-[0_24px_80px_rgba(2,6,23,0.32)]";

export function CollectionUtilityBand({
  primary,
  secondary,
  columnsClassName = "xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.85fr)]",
}: {
  primary: ReactNode;
  secondary: ReactNode;
  columnsClassName?: string;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-950/35 px-4 py-2.5">
      <div className={["grid gap-3 xl:items-start", columnsClassName].join(" ")}>
        {primary}
        {secondary}
      </div>
    </div>
  );
}

export function CollectionUtilityPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "min-w-0 rounded-[1.4rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(10,18,34,0.88),rgba(3,7,18,0.9))] px-5 py-3",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CollectionResultsBand({
  title = "Table Filters",
  actions,
}: {
  title?: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 py-2">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function CollectionModeBand({
  children,
  className = "",
  segmentedClassName = "",
}: {
  children: ReactNode;
  className?: string;
  segmentedClassName?: string;
}) {
  return (
    <div className={joinClasses("overflow-x-auto border-b border-slate-800 bg-transparent px-3 py-1.5", className)}>
      <WorkspaceSegmented
        className={joinClasses("w-max min-w-full flex-nowrap rounded-none border-0 bg-transparent p-0 shadow-none", segmentedClassName)}
      >
        {children}
      </WorkspaceSegmented>
    </div>
  );
}

export function CollectionModeButton({
  children,
  active,
  onClick,
  className = "",
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <WorkspaceSegmentedButton active={active} onClick={onClick} className={joinClasses("px-3 py-2 text-sm", className)}>
      {children}
    </WorkspaceSegmentedButton>
  );
}

export function CollectionRefineBand({
  title,
  children,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="border-b border-slate-800 bg-slate-950/35 px-4 py-2">
      <div className={joinClasses("grid gap-3", className)}>
        {title ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function CollectionRefineGroup({
  label,
  action,
  children,
}: {
  label: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{label}</span>
        {action ? (
          <span className="text-xs font-normal normal-case tracking-normal text-slate-500">{action}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function CollectionChipRail({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex h-10 w-max min-w-full items-center gap-2 pr-2">{children}</div>
    </div>
  );
}
