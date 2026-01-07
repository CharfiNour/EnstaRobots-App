"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, LogOut, Calendar, ClipboardCheck, Bell, User } from "lucide-react";
import { logout, getSession } from "@/lib/auth";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [teamName, setTeamName] = useState<string>("");

    useEffect(() => {
        const session = getSession();
        if (session && session.teamName) {
            setTeamName(session.teamName);
        }
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === '/team' && pathname === '/team') return true;
        if (path !== '/team' && pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        logout();
        router.push("/auth/team");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-role-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/team" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-role-muted group-hover:bg-role-primary/20 transition-colors">
                        <Trophy className="w-6 h-6 text-role-primary" />
                    </div>
                    <span className="font-bold text-lg hidden md:block group-hover:text-role-primary transition-colors">
                        Team Portal
                    </span>
                    {teamName && <span className="text-xs px-2 py-0.5 rounded-full bg-role-muted text-role-primary hidden lg:inline-block">{teamName}</span>}
                </Link>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-1 md:gap-2">
                        <Link href="/team">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/team')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    <span className="hidden sm:block">Dashboard</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/team/matches">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/team/matches')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="hidden sm:block">Matches</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/team/announcements">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/team/announcements')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    <span className="hidden sm:block">Announcements</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/team/score-card">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/team/score-card')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4" />
                                    <span className="hidden sm:block">Scores</span>
                                </span>
                            </div>
                        </Link>

                        <Link href="/team/profile">
                            <div className={`px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-all ${isActive('/team/profile')
                                ? 'bg-role-muted text-role-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}>
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:block">Profile</span>
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
