"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    onSave,
}: StatCardProps) {
    const [isEditing, setIsEditing] = useState(false);

    const handleToggle = () => {
        if (isEditing) {
            // Stopping editing = Save
            onSave?.(value);
        }
        setIsEditing(!isEditing);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            layout
            className={`p-4 rounded-xl border backdrop-blur-sm relative group transition-all duration-300 ${highlight
                ? 'bg-gradient-to-br from-red-500/20 to-card border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                : 'bg-card border-card-border shadow-sm'
                } ${isEditing ? 'ring-2 ring-primary/50 border-primary/50' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <Icon className={`w-6 h-6 ${color}`} />
                <button
                    onClick={handleToggle}
                    className={`transition-all p-1.5 rounded-lg border shadow-lg hover:rotate-12 ${isEditing
                            ? 'bg-emerald-500 text-white border-emerald-400 scale-110'
                            : 'md:opacity-0 md:group-hover:opacity-100 bg-white/10 hover:bg-white text-white hover:text-black border-white/10'
                        }`}
                >
                    {isEditing ? <Check size={16} strokeWidth={3} /> : <Pencil size={16} />}
                </button>
            </div>

            <div className="min-h-[48px] flex flex-col justify-end">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.input
                            key="editing"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            type="text"
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleToggle();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-2xl font-black text-foreground mb-1 focus:outline-none focus:border-primary/50"
                            autoFocus
                        />
                    ) : (
                        <motion.div
                            key="display"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-2xl font-black text-foreground mb-1 tracking-tight italic"
                        >
                            {value}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{label}</div>
            </div>
        </motion.div>
    );
}
