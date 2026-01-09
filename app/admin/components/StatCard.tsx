"use client";

import { motion } from 'framer-motion';
import { StatCardProps } from '../types';

export default function StatCard({
    icon: Icon,
    label,
    value,
    color,
    delay,
    highlight,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={`p-4 rounded-xl border backdrop-blur-sm ${highlight
                ? 'bg-gradient-to-br from-red-500/20 to-[var(--color-card)] border-red-500/50'
                : 'bg-[var(--color-card)] border-[var(--color-card-border)]'
                }`}
        >
            <Icon className={`w-6 h-6 mb-2 ${color}`} />
            <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}
