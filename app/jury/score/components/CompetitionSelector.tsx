"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown } from 'lucide-react';
import { COMPETITION_CATEGORIES } from '@/lib/constants';
import { getCompetitionState } from '@/lib/competitionState';
import { useEffect, useState } from 'react';

interface CompetitionSelectorProps {
    competition: any;
    setCompetition: (comp: any) => void;
    showCompList: boolean;
    setShowCompList: (show: boolean) => void;
    locked?: boolean;
}

export default function CompetitionSelector({
    competition,
    setCompetition,
    showCompList,
    setShowCompList,
    locked
}: CompetitionSelectorProps) {
    const [liveSessions, setLiveSessions] = useState<Record<string, any>>({});

    useEffect(() => {
        const sync = () => {
            const state = getCompetitionState();
            setLiveSessions(state.liveSessions || {});
        };
        sync();
        window.addEventListener('competition-state-updated', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('competition-state-updated', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const currentId = competition.id || competition.value;

    return (
        <div className="mb-6 relative">
            <button
                onClick={() => !locked && setShowCompList(!showCompList)}
                disabled={locked}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${locked ? 'cursor-default opacity-90' : 'hover:shadow-xl'
                    } bg-gradient-to-br ${competition.color || 'from-background to-muted'} ${competition.borderColor || 'border-border'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${competition.badgeColor || 'bg-muted text-muted-foreground'}`}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-black text-foreground">{competition.name || competition.label}</span>
                </div>
                {!locked && <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showCompList ? 'rotate-180' : ''}`} />}
            </button>

            <AnimatePresence>
                {showCompList && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        {COMPETITION_CATEGORIES.map((comp) => (
                            <button
                                key={comp.id}
                                onClick={() => {
                                    setCompetition(comp);
                                    setShowCompList(false);
                                }}
                                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${currentId === comp.id ? 'bg-muted/50 font-bold' : ''}`}
                            >
                                <div className={`w-3 h-3 rounded-full ${(() => {
                                    const type = comp.type || comp.id;
                                    switch (type) {
                                        case 'junior_line_follower': return 'bg-cyan-500';
                                        case 'junior_all_terrain': return 'bg-emerald-500';
                                        case 'line_follower': return 'bg-indigo-500';
                                        case 'all_terrain': return 'bg-orange-500';
                                        case 'fight': return 'bg-rose-500';
                                        default: return 'bg-green-500';
                                    }
                                })()}`} />
                                <span className={`text-sm font-bold text-foreground flex-1`}>{comp.name}</span>
                                {liveSessions[comp.id] && (
                                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">LIVE</span>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

