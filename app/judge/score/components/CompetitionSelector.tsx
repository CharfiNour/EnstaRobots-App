"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown } from 'lucide-react';
import { CompetitionOption } from '../types';
import { COMPETITIONS } from '../services/scoreConstants';
import { getCompetitionState } from '@/lib/competitionState';
import { useEffect, useState } from 'react';

interface CompetitionSelectorProps {
    competition: CompetitionOption;
    setCompetition: (comp: CompetitionOption) => void;
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

    return (
        <div className="mb-6 relative">
            <button
                onClick={() => !locked && setShowCompList(!showCompList)}
                disabled={locked}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${competition.bg} ${competition.border} group ${locked ? 'cursor-default opacity-90' : 'hover:shadow-xl'}`}
            >
                <div className="flex items-center gap-4">
                    <Shield className={`w-6 h-6 ${competition.color}`} />
                    <span className={`text-lg font-black ${competition.color}`}>{competition.label}</span>
                </div>
                {!locked && <ChevronDown className={`w-5 h-5 ${competition.color} transition-transform ${showCompList ? 'rotate-180' : ''}`} />}
            </button>

            <AnimatePresence>
                {showCompList && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-card-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        {COMPETITIONS.map((comp) => (
                            <button
                                key={comp.value}
                                onClick={() => {
                                    setCompetition(comp);
                                    setShowCompList(false);
                                }}
                                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 ${competition.value === comp.value ? 'bg-muted font-bold' : ''}`}
                            >
                                <div className={`w-3 h-3 rounded-full ${comp.bg} border-2 ${comp.border}`} />
                                <span className={`text-sm font-bold ${comp.color} flex-1`}>{comp.label}</span>
                                {liveSessions[comp.value] && (
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
