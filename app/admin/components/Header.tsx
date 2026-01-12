"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Users, Trophy, Bell, Calendar, History, Key } from "lucide-react";
import { logout } from "@/lib/auth";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        logout();
        router.push("/auth/jury"); // Or admin login if separate
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-role-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-role-muted group-hover:bg-role-primary/20 transition-colors">
                        <LayoutDashboard className="w-6 h-6 text-role-primary" />
                    </div>
                    <span className="font-bold text-lg hidden md:block group-hover:text-role-primary transition-colors">
                        Admin Portal
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-1 md:gap-2">
                        <Link href="/admin">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span className="hidden sm:block">Dashboard</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/admin/competitions">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin/competitions')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    <span className="hidden sm:block">Competitions</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/admin/matches">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin/matches')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    <span className="hidden sm:block">Codes</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/admin/scores">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin/scores')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    <span className="hidden sm:block">Scores</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/admin/teams">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin/teams')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span className="hidden sm:block">Teams</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/admin/announcements">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/admin/announcements')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    <span className="hidden sm:block">Announcements</span>
                                </span>
                            </div>
                        </Link>
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
