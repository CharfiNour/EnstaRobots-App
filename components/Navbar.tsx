"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { getUserRole, logout } from '@/lib/auth';
import { desktopNavConfig, UserRole } from '@/lib/navConfig';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [role, setRole] = useState<UserRole>('visitor');

    const pathname = usePathname();

    useEffect(() => {
        setRole(getUserRole());
    }, [pathname]);

    const navItems = desktopNavConfig[role];
    const isAuthenticated = role !== 'visitor';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--color-navbar-border)] bg-[var(--color-navbar)] backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-secondary)] bg-clip-text text-transparent">
                        EnstaRobots
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium hover:text-[var(--color-brand-accent)] transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}

                    <ThemeToggle />

                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    )}

                    {!isAuthenticated && (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/auth/judge"
                                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mr-2"
                            >
                                Judge Login
                            </Link>
                            <Link
                                href="/auth/team"
                                className="px-4 py-2 bg-accent text-background rounded-lg font-bold text-sm hover:opacity-90 shadow-md shadow-accent/20 transition-all"
                            >
                                Team Access
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile Icons */}
                <div className="md:hidden flex items-center gap-4">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <button
                            onClick={logout}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    ) : (
                        <Link
                            href="/auth/team"
                            className="px-3 py-1.5 bg-accent text-background rounded-lg font-bold text-xs shadow-sm shadow-accent/20"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

