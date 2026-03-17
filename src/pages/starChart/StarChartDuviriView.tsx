// StarChartDuviriView — Duviri Paradox experience panels.
// Extracted from StarChart.tsx as part of Phase 5 file decomposition.

import { useState } from "react";
import { useTrackerStore } from "../../store/store";
import { EMPTY_NODE_COMPLETED } from "./starChartMapData";
import { IntrinsicsPanel } from "./StarChartProximaView";

// ─────────────────────────────────────────────────────────────────────────────
// Duviri — four archway experience panels
// ─────────────────────────────────────────────────────────────────────────────

const DUVIRI_EXPERIENCES = [
  {
    id: "duviri_isleweaver",
    nodeId: "node:duviri/isleweaver",
    label: "Isleweaver",
    description: (
      <>
        Explore the Undercroft with a randomly chosen Warframe.
        <br />
        <br />
        Challenge Neci Rusalka in the spiral:
        <br />
        "The Triumph of Dust."
      </>
    ),
    color: {
      base: "#9b4dca",
      border: "rgba(180,100,255,0.45)",
      glow: "rgba(130,50,200,0.35)",
      text: "#d8b4fe",
    },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path
          d="M12 3L4 9v6l8 6 8-6V9L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 3v18M4 9l8 6 8-6"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      </svg>
    ),
  },
  {
    id: "duviri_circuit",
    nodeId: "node:duviri/circuit",
    label: "The Circuit",
    description: (
      <>
        Complete the weekly Circuit for Warframes and Incarnon Genesis adapters.
        <br />
        <br />
        Warframe only. Battle through an endless chain of missions.
      </>
    ),
    color: {
      base: "#e6a817",
      border: "rgba(230,168,23,0.45)",
      glow: "rgba(200,140,20,0.35)",
      text: "#fde68a",
    },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <polygon
          points="12,2 15.5,9 23,10 17.5,15.5 19,23 12,19.5 5,23 6.5,15.5 1,10 8.5,9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "duviri_experience",
    nodeId: "node:duviri/experience",
    label: "The Duviri Experience",
    description: (
      <>
        The main story arc — explore the Spiral and complete Decrees.
        <br />
        <br />
        Duviri as it was intended to be played.
        <br />
        Story and side objectives together.
      </>
    ),
    color: {
      base: "#64748b",
      border: "rgba(148,163,184,0.40)",
      glow: "rgba(100,130,170,0.30)",
      text: "#cbd5e1",
    },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 3C12 3 7 8 7 12s5 9 5 9"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <path
          d="M12 3C12 3 17 8 17 12s-5 9-5 9"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <path
          d="M3 12h18"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      </svg>
    ),
  },
  {
    id: "duviri_lone_story",
    nodeId: "node:duviri/lone_story",
    label: "The Lone Story",
    description: (
      <>
        A journey through the Spiral.
        <br />
        <br />
        Just the Spiral's story. Duviri devoid of all side objectives.
      </>
    ),
    color: {
      base: "#0ea5e9",
      border: "rgba(56,189,248,0.40)",
      glow: "rgba(14,165,233,0.30)",
      text: "#7dd3fc",
    },
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path
          d="M12 22s-8-6-8-12a8 8 0 1 1 16 0c0 6-8 12-8 12z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

function DuviriArchway({
  exp,
  isCompleted,
  onToggle,
}: {
  exp: (typeof DUVIRI_EXPERIENCES)[0];
  isCompleted: boolean;
  onToggle: () => void;
}) {
  // The archway shape: a rectangular panel with a rounded arch top, matching the in-game aesthetic
  const { color } = exp;

  return (
    <button
      onClick={onToggle}
      className="group relative flex flex-col items-center text-center transition-all duration-200 focus:outline-none"
      style={{ width: "100%" }}
    >
      {/* Archway frame — no overflow:hidden so description text is never clipped */}
      <div
        className="relative w-full transition-all duration-200 group-hover:scale-[1.02]"
        style={{
          borderRadius: "50% 50% 6px 6px / 32px 32px 6px 6px",
          border: `1px solid ${isCompleted ? "rgba(52,211,153,0.6)" : color.border}`,
          background: isCompleted
            ? "linear-gradient(180deg, rgba(6,20,14,0.95) 0%, rgba(4,30,20,0.92) 100%)"
            : `linear-gradient(180deg, rgba(8,12,28,0.96) 0%, rgba(5,8,20,0.92) 100%)`,
          boxShadow: isCompleted
            ? `0 0 28px rgba(52,211,153,0.20), inset 0 0 40px rgba(52,211,153,0.06)`
            : `0 0 28px ${color.glow}, inset 0 0 40px ${color.glow}`,
          paddingTop: "48px",
          paddingBottom: "24px",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
      >
        {/* Inner arch glow line at the top */}
        <div
          className="absolute inset-x-4 top-0 h-px"
          style={{
            background: isCompleted
              ? "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)"
              : `linear-gradient(90deg, transparent, ${color.border}, transparent)`,
            borderRadius: "50%",
            top: "6px",
          }}
        />

        {/* Icon area */}
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{
            width: "56px",
            height: "56px",
            background: isCompleted
              ? "rgba(6,40,24,0.80)"
              : "rgba(10,14,34,0.80)",
            border: `1px solid ${isCompleted ? "rgba(52,211,153,0.40)" : color.border}`,
            color: isCompleted ? "#34d399" : color.text,
          }}
        >
          {exp.icon}
        </div>

        {/* Label */}
        <div
          className="text-sm font-bold uppercase tracking-widest mb-2 leading-tight"
          style={{ color: isCompleted ? "#34d399" : color.text }}
        >
          {exp.label}
        </div>

        {/* Description */}
        <div className="text-[11px] leading-relaxed text-slate-400 px-1">
          {exp.description}
        </div>

        {/* Completion badge */}
        {isCompleted && (
          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Complete
          </div>
        )}

        {/* Corner decorations */}
        <div
          className="absolute bottom-2 left-2 w-4 h-4 opacity-30"
          style={{
            borderLeft: `1px solid ${color.text}`,
            borderBottom: `1px solid ${color.text}`,
          }}
        />
        <div
          className="absolute bottom-2 right-2 w-4 h-4 opacity-30"
          style={{
            borderRight: `1px solid ${color.text}`,
            borderBottom: `1px solid ${color.text}`,
          }}
        />
      </div>

      {/* Label below arch */}
      <div
        className="mt-2 text-[11px] font-medium uppercase tracking-widest"
        style={{ color: isCompleted ? "#6ee7b7" : "rgba(148,163,184,0.7)" }}
      >
        {isCompleted ? "✓ Done" : "Click to mark"}
      </div>
    </button>
  );
}

function StarChartDuviriView({ onBack }: { onBack: () => void }) {
  const setNodeCompleted = useTrackerStore((s) => s.setNodeCompleted);
  const nodeCompletedMap = useTrackerStore(
    (s) => s.state.missions?.nodeCompleted ?? EMPTY_NODE_COMPLETED,
  );
  const [showIntrinsics, setShowIntrinsics] = useState(false);

  const completedCount = DUVIRI_EXPERIENCES.filter(
    (e) => nodeCompletedMap[e.nodeId],
  ).length;

  return (
    <div className="flex h-[72vh] min-h-[560px] flex-col">
      {showIntrinsics && (
        <IntrinsicsPanel
          mode="duviri"
          onClose={() => setShowIntrinsics(false)}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <button
          className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          onClick={onBack}
        >
          ← Back to Star Chart
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100">
            Duviri Paradox
          </div>
          <div className="text-xs text-slate-500">
            {completedCount}/{DUVIRI_EXPERIENCES.length} experiences complete ·
            Click a panel to mark as done
          </div>
        </div>
        <button
          className="rounded-lg border border-purple-700/60 bg-purple-950/30 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-950/50 transition-colors"
          onClick={() => setShowIntrinsics(true)}
        >
          Duviri Intrinsics
        </button>
      </div>

      {/* Archway panels — dark atmospheric background */}
      <div
        className="flex-1 overflow-auto"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(40,30,80,0.40) 0%, rgba(2,6,23,0) 70%), rgb(2,6,23)",
        }}
      >
        {/* Sorrow Spiral header — references current Spiral emotion shown in-game */}
        <div className="flex flex-col items-center pt-6 pb-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-600 mb-1">
            The Spiral
          </div>
          <div className="text-lg font-semibold text-slate-300 tracking-wide">
            Duviri
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Choose your path through the Undercroft
          </div>
        </div>

        {/* Four archway panels — 1 col on very small phones, 2 on sm+, 4 on lg+ */}
        <div className="grid grid-cols-1 gap-4 px-4 pb-6 pt-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {DUVIRI_EXPERIENCES.map((exp) => (
            <DuviriArchway
              key={exp.id}
              exp={exp}
              isCompleted={Boolean(nodeCompletedMap[exp.nodeId])}
              onToggle={() =>
                setNodeCompleted(exp.nodeId, !nodeCompletedMap[exp.nodeId])
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
export { StarChartDuviriView };
