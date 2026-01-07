import "./theme.css";
import Header from "./components/Header";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-theme min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
