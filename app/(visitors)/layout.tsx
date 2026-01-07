import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="flex-1 pb-20 md:pb-0">
                {children}
            </main>
            <BottomNav />
        </>
    );
}
