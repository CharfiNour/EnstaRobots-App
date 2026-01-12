import "./theme.css";
import Header from "./components/Header";

export default function JuryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="jury-theme min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
