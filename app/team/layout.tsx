import "./theme.css";
import Header from "./components/Header";

export default function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="team-theme min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
