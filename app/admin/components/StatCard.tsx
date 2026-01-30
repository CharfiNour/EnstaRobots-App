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
            <div className="flex justify-between items-start mb-2">
                <Icon className={`w-6 h-6 ${color}`} />
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="md:opacity-0 md:group-hover:opacity-100 transition-all p-1.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg border border-white/10 shadow-lg hover:rotate-12"
                >
                    {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                </button>
            </div>

            <div className="min-h-[48px] flex flex-col justify-end">

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
            </div>
        </motion.div>
    );
}
