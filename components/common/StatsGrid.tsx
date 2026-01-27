"use client";

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatItemProps {
    icon: LucideIcon;
    label: string;
    value: string;
}

export function StatItem({ icon: Icon, label, value }: StatItemProps) {
    return (
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-card-border/50">
            <Icon className="w-5 h-5 text-accent/60" />
            <div className="min-w-0 flex-1">
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{label}</div>
                <div className="font-bold text-foreground truncate text-sm">{value}</div>
            </div>
        </div>
    );
}

interface StatsGridProps {
    stats: StatItemProps[];
    className?: string;
}

export function StatsGrid({ stats, className = "" }: StatsGridProps) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {stats.map((stat, idx) => (
                <StatItem key={idx} {...stat} />
            ))}
        </div>
    );
}
