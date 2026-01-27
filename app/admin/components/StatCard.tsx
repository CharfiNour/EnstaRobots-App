"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { StatCardProps } from '../types';
import { Pencil, Check } from 'lucide-react';

export default function StatCard({
    icon: Icon,
    label,
    value,
    color,
    delay,
    highlight,
    onChange,
}: StatCardProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={`p-4 rounded-xl border backdrop-blur-sm relative group ${highlight
                ? 'bg-gradient-to-br from-red-500/20 to-[var(--color-card)] border-red-500/50'
                : 'bg-[var(--color-card)] border-[var(--color-card-border)]'
                }`}
        >
            <div className="flex justify-between items-start">
                <Icon className={`w-6 h-6 mb-2 ${color}`} />
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white text-black rounded-lg shadow-lg hover:scale-105 active:scale-95"
                >
                    {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                </button>
            </div>

            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="w-full bg-black/10 border border-white/10 rounded px-2 py-1 text-xl font-bold text-foreground mb-1 focus:outline-none focus:border-accent"
                    autoFocus
                />
            ) : (
                <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            )}
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}
