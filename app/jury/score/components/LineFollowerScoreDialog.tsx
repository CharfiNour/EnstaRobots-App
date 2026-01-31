"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { LINE_FOLLOWER_SECTIONS_STANDARD, LINE_FOLLOWER_SECTIONS_JUNIOR, JUNIOR_ALL_TERRAIN_SECTIONS } from '@/lib/constants';

interface LineFollowerScoreDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentScores: Record<string, number>;
    onSave: (scores: Record<string, number>) => void;
    competitionType: string;
}

export default function LineFollowerScoreDialog({
    isOpen,
    onClose,
    currentScores,
    onSave,
    competitionType
}: LineFollowerScoreDialogProps) {
    const isJunior = competitionType === 'junior_line_follower' || (typeof competitionType === 'string' && competitionType.toLowerCase().includes('junior'));
    const isJuniorAT = competitionType === 'junior_all_terrain';
    const SECTIONS = isJuniorAT ? JUNIOR_ALL_TERRAIN_SECTIONS : (isJunior ? LINE_FOLLOWER_SECTIONS_JUNIOR : LINE_FOLLOWER_SECTIONS_STANDARD);

    const [scores, setScores] = useState<Record<string, number>>(currentScores);

    const handleScoreChange = (id: string, value: string, max: number) => {
        const val = parseInt(value) || 0;
        // For accumulative sections, we bypass the max check or implement it differently
        // But this handler is mainly for the text input which these sections don't use (they use options)
        if (val >= 0 && val <= max) {
            setScores(prev => ({ ...prev, [id]: val }));
        }
    };

    // Helper to check if a section should be accumulative (Counters instead of Radio)
    const isAccumulative = (id: string) => isJuniorAT && (id === 'object' || id === 'player');

    // Helper to get the DISPLAY value for an option (e.g. 20 for 2 clicks of 10)
    // We store positive and negative components separately to avoid crosstalk
    const getAccumulatedValue = (sectionId: string, optValue: number) => {
        if (optValue > 0) {
            return scores[`${sectionId}_pos`] || 0;
        } else {
            return scores[`${sectionId}_neg`] || 0;
        }
    };

    const updateAccumulativeScore = (sectionId: string, optValue: number, increment: boolean) => {
        setScores(prev => {
            // Determine storage key based on sign of the option
            const key = optValue > 0 ? `${sectionId}_pos` : `${sectionId}_neg`;
            const current = prev[key] || 0;

            // Calculate new value
            // If increment is true (Up Arrow), we ADD the option value (e.g. +10 or + -10)
            // If increment is false (Down Arrow), we SUBTRACT the option value
            const delta = increment ? optValue : -optValue;
            let newScore = current + delta;

            // Optional: Clamp to 0 or max logic if needed, but "score can vary" implies freedom.
            // We should at least prevent negative magnitude for the specific counters?
            // e.g. generally counters start at 0.
            // If optValue is 10 (Positive Counter): 0 -> 10 -> 20. Minimum 0.
            // If optValue is -10 (Negative Counter): 0 -> -10 -> -20. Maximum 0?

            if (optValue > 0 && newScore < 0) newScore = 0;
            if (optValue < 0 && newScore > 0) newScore = 0;

            // Also clear the legacy combined key if it exists to ensure total assumes precedence
            const { [sectionId]: _, ...rest } = prev;
            return { ...rest, [key]: newScore };
        });
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const handleSave = () => {
        onSave(scores);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-card border border-card-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-accent/10 to-transparent p-6 border-b border-card-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-accent/20 rounded-xl text-accent">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight italic">Detailed Evaluation</h2>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                        {isJuniorAT ? 'Junior All Terrain' : (isJunior ? 'Junior LF' : 'Standard')} Performance Analysis
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted/50 rounded-full transition-colors text-muted-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4 px-4 pb-2 border-b border-card-border">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Section Unit</span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Points Registry</span>
                                </div>
                                {SECTIONS.map((section: any) => (
                                    <div key={section.id} className="flex flex-col p-4 rounded-2xl bg-muted/20 border border-card-border hover:bg-muted/30 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                                {/* Section Image */}
                                                <div className="w-16 h-12 rounded-lg bg-white/50 border border-card-border overflow-hidden flex items-center justify-center p-1 shrink-0">
                                                    {section.image && (
                                                        <img
                                                            src={section.image}
                                                            alt={section.label}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{section.label}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-tighter">
                                                        {section.hint || `Max: ${section.maxPoints} PTS`}
                                                    </span>
                                                </div>
                                            </div>

                                            {!section.options && (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        value={scores[section.id] ?? ''}
                                                        onChange={(e) => handleScoreChange(section.id, e.target.value, section.maxPoints)}
                                                        placeholder="0"
                                                        className="w-20 px-3 py-2 bg-background border border-card-border rounded-xl text-center text-sm font-black text-accent focus:ring-2 focus:ring-accent outline-none shadow-sm transition-all group-hover:border-accent/30"
                                                    />
                                                    <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">/ {section.maxPoints}</span>
                                                </div>
                                            )}
                                        </div>

                                        {section.options && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {isAccumulative(section.id) ? (
                                                    // Accumulative Controls (Junior AT specialized)
                                                    <div className="w-full grid grid-cols-2 gap-3">
                                                        {section.options.map((opt: number) => {
                                                            // We can't perfectly reconstruct counts from a single sum if mixed,
                                                            // so we just show the button that adds/subtracts this amount.
                                                            // Inspired by "add arrow in each number".
                                                            return (
                                                                <div key={opt} className="flex items-center justify-between p-2 rounded-xl bg-background border border-card-border">
                                                                    <div className="text-[10px] font-black uppercase text-muted-foreground mr-2">
                                                                        {opt > 0 ? `+${opt}` : opt} PTS
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateAccumulativeScore(section.id, opt, false)}
                                                                            className="w-8 h-8 rounded-lg bg-muted/20 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all"
                                                                        >
                                                                            <ChevronDown size={14} />
                                                                        </button>
                                                                        <div className="w-8 text-center font-black text-sm">
                                                                            {/* Display the value directly (e.g. 10, 20, 30...) */}
                                                                            {getAccumulatedValue(section.id, opt)}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateAccumulativeScore(section.id, opt, true)}
                                                                            className="w-8 h-8 rounded-lg bg-muted/20 hover:bg-green-500/10 hover:text-green-500 border border-transparent hover:border-green-500/20 flex items-center justify-center transition-all"
                                                                        >
                                                                            <ChevronUp size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    // Standard Radio Options
                                                    <>
                                                        {section.options.map((opt: number) => {
                                                            const isSelected = scores[section.id] === opt;
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() => setScores(prev => ({ ...prev, [section.id]: isSelected ? 0 : opt }))}
                                                                    className={`flex-1 py-3 px-2 rounded-xl border text-[10px] font-black transition-all ${isSelected
                                                                        ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[0.98]'
                                                                        : 'bg-background border-card-border text-foreground hover:border-accent/50 hover:bg-accent/5'
                                                                        }`}
                                                                >
                                                                    {opt} PTS
                                                                </button>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-muted/10 border-t border-card-border flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">Calculated Result</span>
                                <span className="text-2xl font-black text-foreground italic">{totalScore} <span className="text-xs not-italic opacity-40">PTS</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-8 py-3 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] shadow-xl shadow-accent/20 transition-all flex items-center gap-2 group"
                            >
                                <CheckCircle size={18} className="group-active:scale-95 transition-transform" />
                                Validate Entry
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
