"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { getUserRole, logout } from '@/lib/auth';
import { desktopNavConfig, UserRole } from '@/lib/navConfig';

export default function Navbar() {
    const [role, setRole] = useState<UserRole>('visitor');

    useEffect(() => {
        setRole(getUserRole());
    }, []);

    const navItems = desktopNavConfig[role];
    const isAuthenticated = role !== 'visitor';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[var(--color-card-border)] bg-[var(--background)]/80 backdrop-blur-md">
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
                        <Link
                            href="/auth/team"
                            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-all"
                        >
                            Team Login
                        </Link>
                    )}
                </nav>

                {/* Mobile Auth Button */}
                <div className="md:hidden">
                    {!isAuthenticated && (
                        <Link
                            href="/auth/team"
                            className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--background)] rounded-lg font-semibold text-xs"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
