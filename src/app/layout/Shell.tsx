import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Shell(props: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-6">
                <Topbar />
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                    <Sidebar />
                    <main className="min-w-0">{props.children}</main>
                </div>
            </div>
        </div>
    );
}

