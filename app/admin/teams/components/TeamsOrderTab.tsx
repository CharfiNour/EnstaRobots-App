"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ChevronDown, Search, CheckCircle2 } from 'lucide-react';
import { Team, saveTeams } from '@/lib/teams';
import { getCompetitionState, toggleCompetitionOrdered } from '@/lib/competitionState';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

interface TeamsOrderTabProps {
    teams: Team[];
    setTeams: (teams: Team[]) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}

export default function TeamsOrderTab({ teams, setTeams, selectedCategory, setSelectedCategory }: TeamsOrderTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOrdered, setIsOrdered] = useState(false);

    useEffect(() => {
        const checkOrdered = () => {
            const state = getCompetitionState();
            setIsOrdered(state.orderedCompetitions.includes(selectedCategory));
        };
        checkOrdered();
        window.addEventListener('competition-state-updated', checkOrdered);
        return () => window.removeEventListener('competition-state-updated', checkOrdered);
    }, [selectedCategory]);

    const handleToggleOrder = () => {
        toggleCompetitionOrdered(selectedCategory);
    };

    const mainDisplayTeams = teams
        .filter(t => t.competition === selectedCategory)
        .filter(t => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                t.robotName?.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query) ||
                t.club.toLowerCase().includes(query) ||
                t.university?.toLowerCase().includes(query)
            );
        });

    const moveTeamAcrossFiltered = (filteredIndex: number, direction: 'up' | 'down') => {
        const currentFiltered = mainDisplayTeams;

        if (direction === 'up' && filteredIndex > 0) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex - 1];
            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);
            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        } else if (direction === 'down' && filteredIndex < currentFiltered.length - 1) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex + 1];
            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);
            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-card-border pb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-xl font-bold italic uppercase leading-none mb-1 text-foreground">
                                {COMPETITION_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Competition Order'}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">
                                Priority sequence protocol
                            </p>
                        </div>

                        <div className="h-10 w-px bg-card-border/30" />

                        <button
                            onClick={handleToggleOrder}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all active:scale-95 ${isOrdered
                                    ? 'bg-accent text-slate-900 border-accent shadow-lg shadow-accent/20'
                                    : 'bg-muted/30 text-muted-foreground border-card-border hover:border-accent/30 hover:text-foreground'
                                }`}
                        >
                            <CheckCircle2 size={16} className={isOrdered ? 'animate-pulse' : ''} />
                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                {isOrdered ? 'List is Ordered' : 'Set as Ordered'}
                            </span>
                        </button>
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-muted/50 border border-card-border pl-4 pr-10 py-2 rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                        >
                            {COMPETITION_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Search Field */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH TEAMS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-card-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:opacity-40"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {mainDisplayTeams.map((team, index) => (
                    <motion.div
                        key={team.id}
                        layout
                        className={`bg-card border p-3 rounded-2xl flex items-center gap-4 transition-all ${team.isPlaceholder ? 'border-dashed border-card-border/60 opacity-60' : 'border-card-border hover:border-accent/30'}`}
                    >
                        <div className="bg-muted px-3 py-1.5 rounded-lg text-muted-foreground font-mono text-sm font-bold w-12 text-center">
                            #{index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-muted border border-card-border overflow-hidden flex-shrink-0">
                            {team.logo && <img src={team.logo} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-base truncate italic">{team.robotName || team.name}</div>
                            <div className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                                <span className="uppercase tracking-wide opacity-70">{team.club}</span>
                                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                <span className="opacity-60">{team.university || 'No University'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => moveTeamAcrossFiltered(index, 'up')} disabled={index === 0} className="p-1.5 bg-muted hover:bg-accent hover:text-white rounded-lg text-foreground border border-card-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ArrowUp size={16} /></button>
                            <button onClick={() => moveTeamAcrossFiltered(index, 'down')} disabled={index === mainDisplayTeams.length - 1} className="p-1.5 bg-muted hover:bg-accent hover:text-white rounded-lg text-foreground border border-card-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ArrowDown size={16} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
