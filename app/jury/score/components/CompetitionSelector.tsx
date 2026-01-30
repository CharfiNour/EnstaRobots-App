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
    scoringMode: 'performance' | 'homologation';
    setScoringMode: (mode: 'performance' | 'homologation') => void;
    sessionRole?: string;
}

export default function CompetitionSelector({
    competition,
    setCompetition,
    showCompList,
    setShowCompList,
    locked,
    scoringMode,
    setScoringMode,
    sessionRole
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

    const isRoleLocked = locked;

    return (
        <div className="mb-6 relative">
            <button
                onClick={() => !isRoleLocked && setShowCompList(!showCompList)}
                disabled={isRoleLocked}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${isRoleLocked ? 'cursor-default opacity-90' : 'hover:shadow-xl'
                    } bg-gradient-to-br ${competition.color || 'from-background to-muted'} ${competition.borderColor || 'border-border'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${scoringMode === 'homologation' ? 'bg-role-primary/20 text-role-primary' : (competition.badgeColor || 'bg-muted text-muted-foreground')}`}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-lg font-black text-foreground block leading-tight text-left">
                            {competition.name || competition.label}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest block text-left ${scoringMode === 'homologation' ? 'text-role-primary' : 'text-muted-foreground opacity-40'}`}>
                            {scoringMode === 'homologation' ? 'Technical Registry' : 'Combat Performance'}
                        </span>
                    </div>
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
                        {sessionRole !== 'homologation_jury' && (
                            <>
                                <div className="px-4 py-2 bg-muted/30 border-b border-card-border">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Live Performance</span>
                                </div>
                                {COMPETITION_CATEGORIES.map((comp) => (
                                    <button
                                        key={`perf-${comp.id}`}
                                        onClick={() => {
                                            setCompetition(comp);
                                            setScoringMode('performance');
                                            setShowCompList(false);
                                        }}
                                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${currentId === comp.id && scoringMode === 'performance' ? 'bg-muted/50 font-bold' : ''}`}
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
                            </>
                        )}

                        <div className="px-4 py-2 bg-role-primary/5 border-y border-card-border">
                            <span className="text-[10px] font-black text-role-primary uppercase tracking-widest">Technical Homologation</span>
                        </div>
                        {COMPETITION_CATEGORIES.map((comp) => (
                            <button
                                key={`homo-${comp.id}`}
                                onClick={() => {
                                    setCompetition(comp);
                                    setScoringMode('homologation');
                                    setShowCompList(false);
                                }}
                                className={`w-full p-4 text-left hover:bg-role-primary/5 transition-colors flex items-center gap-3 ${currentId === comp.id && scoringMode === 'homologation' ? 'bg-role-primary/10 font-bold' : ''}`}
                            >
                                <div className="w-3 h-3 rounded bg-role-primary opacity-60" />
                                <span className={`text-sm font-bold text-foreground flex-1`}>{comp.name}</span>
                                <span className="text-[9px] font-black text-role-primary opacity-40 uppercase tracking-tighter text-right">Evaluation</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
