import "./theme.css";
import Header from "./components/Header";

export default function TeamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="team-theme min-h-screen flex flex-col relative overflow-x-hidden bg-background">
            {/* Ambient Background Accents */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-role-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-role-accent/5 blur-[100px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <Header />
            <main className="flex-1 relative z-10">
                {children}
            </main>
        </div>
    );
}
