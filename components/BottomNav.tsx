"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, PlayCircle, Trophy, BarChart2, Calendar, ClipboardCheck, History, Users } from 'lucide-react';
import clsx from 'clsx';
import { getUserRole } from '@/lib/auth';
import { navConfig, UserRole } from '@/lib/navConfig';

// Icon mapping
const iconMap: Record<string, any> = {
    Home,
    LayoutDashboard,
    PlayCircle,
    Trophy,
    BarChart2,
    Calendar,
    ClipboardCheck,
    History,
    Users,
};

export default function BottomNav() {
    const pathname = usePathname();
    const [role, setRole] = useState<UserRole>('visitor');

    useEffect(() => {
        setRole(getUserRole());
    }, []);

    const navItems = navConfig[role];

    return (
        <div className="fixed bottom-0 z-50 w-full border-t border-[var(--color-card-border)] bg-[var(--background)]/90 backdrop-blur-lg md:hidden pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = iconMap[item.icon];

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center p-2 w-full transition-colors",
                                isActive
                                    ? "text-[var(--color-accent)]"
                                    : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] uppercase tracking-wide mt-1 font-medium">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
