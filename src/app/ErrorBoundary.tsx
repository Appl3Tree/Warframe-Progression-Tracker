// ===== FILE: src/app/ErrorBoundary.tsx =====
import { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    /** Page name shown in the error UI. */
    page?: string;
}

interface State {
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    override componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleReset = () => this.setState({ error: null });

    override render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
                <div className="text-5xl">⚠️</div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-1">
                        Something went wrong{this.props.page ? ` on ${this.props.page}` : ""}.
                    </h2>
                    <p className="text-slate-400 text-sm">
                        An unexpected error occurred. Your saved data is safe.
                    </p>
                </div>
                <details className="w-full max-w-xl text-left">
                    <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
                        Error details
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-red-400 overflow-auto whitespace-pre-wrap break-all">
                        {error.message}
                        {error.stack ? `\n\n${error.stack}` : ""}
                    </pre>
                </details>
                <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm rounded"
                >
                    Try again
                </button>
            </div>
        );
    }
}
