"use client";

import { motion } from 'framer-motion';
import { Layers, ClipboardCheck, Target } from 'lucide-react';

interface DrawPlan {
    total: number;
    sizes: number[];
    groups: number;
}

interface DrawInterfaceProps {
    drawState: 'idle' | 'counting' | 'success';
    countdown: number;
    drawTeamsCount: number;
    setDrawTeamsCount: (count: number) => void;
    handleAutoDraw: () => void;
    drawPlan: DrawPlan | null;
}

export default function DrawInterface({
    drawState,
    countdown,
    drawTeamsCount,
    setDrawTeamsCount,
    handleAutoDraw,
    drawPlan
}: DrawInterfaceProps) {
    if (drawState === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center space-y-8 w-full">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground">
                        Start the Draw
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                        Initialize Match Groupings
                    </p>
                </div>

                <div className="p-8 bg-card border border-card-border rounded-3xl shadow-xl w-full max-w-md space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-role-primary/10 blur-[50px] rounded-full pointer-events-none" />

                    <div className="space-y-4 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Teams per Card
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setDrawTeamsCount(Math.max(2, drawTeamsCount - 1))}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-card-border bg-muted/50 hover:bg-muted transition-colors text-xl font-bold"
                                >
                                    -
                                </button>
                                <div className="flex-1 h-12 flex items-center justify-center bg-muted/30 rounded-xl border border-card-border">
                                    <span className="text-xl font-black font-mono">{drawTeamsCount}</span>
                                </div>
                                <button
                                    onClick={() => setDrawTeamsCount(drawTeamsCount + 1)}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-card-border bg-muted/50 hover:bg-muted transition-colors text-xl font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleAutoDraw}
                            disabled={!drawPlan || drawPlan.total < 2}
                            className="w-full py-4 bg-role-primary hover:bg-role-primary/90 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-role-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                        >
                            <Layers size={18} />
                            Confirm Draw
                        </button>

                        {drawPlan && (
                            <div className="pt-2 px-1 text-center font-black uppercase">
                                <p className="text-[10px] text-role-primary tracking-widest animate-pulse">
                                    {drawPlan.total} Active Units Found
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-1">
                                    Distribution: {drawPlan.groups} groups of [{drawPlan.sizes.join(', ')}]
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase max-w-[200px] text-center leading-relaxed">
                        This action will generate match cards for all registered teams in this category.
                    </p>
                </div>
            </div>
        );
    }

    if (drawState === 'counting') {
        return (
            <motion.div
                key={`count-${countdown}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center justify-center"
            >
                <div className="text-[120px] font-black text-role-primary italic leading-none text-shadow-glow">
                    {countdown}
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs mt-4">
                    Generating Bracket
                </p>
            </motion.div>
        );
    }

    if (drawState === 'success') {
        return (
            <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-role-primary text-white flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(var(--role-primary),0.5)]">
                    <ClipboardCheck size={48} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground text-center">
                    The Matches Are Set
                </h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">
                    Good Luck To All Units
                </p>
            </div>
        );
    }

    return null;
}
