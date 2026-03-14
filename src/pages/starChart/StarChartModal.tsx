// StarChartModal — full-screen overlay modal wrapper for the star chart.
// Extracted from StarChart.tsx as part of Phase 5 file decomposition.

import React, { useEffect } from "react";

function StarChartModalStyles() {
    return (
        <style>{`
.wf-star-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;

    padding:
        max(8px, env(safe-area-inset-top))
        max(8px, env(safe-area-inset-right))
        max(8px, env(safe-area-inset-bottom))
        max(8px, env(safe-area-inset-left));
}

.wf-star-modal {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(30, 41, 59, 0.8);
    background: rgba(2, 6, 23, 0.92);
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.55);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.wf-star-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(30, 41, 59, 0.8);
}

.wf-star-modal-title {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.wf-star-modal-title .t1 {
    font-size: 14px;
    font-weight: 700;
    color: rgba(226, 232, 240, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wf-star-modal-title .t2 {
    font-size: 12px;
    color: rgba(148, 163, 184, 1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wf-star-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.wf-star-modal-body {
    flex: 1;
    overflow: hidden;
    padding: 0;
}
        `}</style>
    );
}

function StarChartModal(props: { isOpen: boolean; title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
    const { isOpen, title, subtitle, onClose, children } = props;

    useEffect(() => {
        if (!isOpen) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="wf-star-overlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
            <div className="wf-star-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="wf-star-modal-header">
                    <div className="wf-star-modal-title">
                        <div className="t1">{title}</div>
                        <div className="t2">{subtitle}</div>
                    </div>

                    <div className="wf-star-modal-actions">
                        <button
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="wf-star-modal-body">{children}</div>
            </div>
        </div>
    );
}
export { StarChartModalStyles, StarChartModal };
