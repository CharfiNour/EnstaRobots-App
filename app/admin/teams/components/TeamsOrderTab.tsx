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
    const [competitions, setCompetitions] = useState<any[]>([]);

    useEffect(() => {
        const fetchComps = async () => {
            const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
            const data = await fetchCompetitionsFromSupabase();
            setCompetitions(data);
        };
        fetchComps();
    }, []);

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
        .filter(t => {
            // Resolution Logic: Match by UUID or slug
            let matchesCat = selectedCategory === 'all';
            if (!matchesCat) {
                if (!t.competition) return false; // Ensure competition exists for non-'all' categories
                const comp = competitions.find(c => c.id === t.competition || c.type === t.competition);
                const teamCategory = comp ? comp.type : t.competition;
                matchesCat = teamCategory === selectedCategory;
            }
            return matchesCat;
        })
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

    const syncPositionsToSupabase = async (updatedTeams: Team[]) => {
        try {
            const { supabase } = await import('@/lib/supabase');

            // Batch update all teams with their new positions
            for (let i = 0; i < updatedTeams.length; i++) {
                const team = updatedTeams[i];
                const { error } = await (supabase.from('teams') as any)
                    .update({ display_order: i })
                    .eq('id', team.id);

                if (error) {
                    // If the column doesn't exist, log a helpful message
                    if (error.message?.includes('display_order')) {
                        console.warn('⚠️ display_order column not found. Run: ALTER TABLE teams ADD COLUMN display_order INTEGER;');
                        return; // Stop trying after first error
                    }
                    throw error;
                }
            }

            console.log('✅ Team positions synced to Supabase');
        } catch (err: any) {
            console.warn('Position sync skipped:', err.message || err);
        }
    };

    const moveTeamAcrossFiltered = async (filteredIndex: number, direction: 'up' | 'down') => {
        const currentFiltered = mainDisplayTeams;
        console.log('🔄 Move triggered:', { filteredIndex, direction, totalTeams: teams.length, filteredCount: currentFiltered.length });

        if (direction === 'up' && filteredIndex > 0) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex - 1];
            console.log('Moving UP:', teamToMove.name, 'to position of', targetTeam.name);

            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);

            console.log('Indices:', { originIdx, targetIdx });

            // Remove the team from its current position
            const [moved] = newTeams.splice(originIdx, 1);

            // Insert it at the target position
            // If we're moving up, insert BEFORE the target (at targetIdx)
            newTeams.splice(targetIdx, 0, moved);

            console.log('✅ New teams order:', newTeams.map(t => t.name));

            // Invalidate cache before saving to prevent cache from overwriting
            const { dataCache } = await import('@/lib/dataCache');
            dataCache.invalidatePattern('teams');

            setTeams(newTeams);
            saveTeams(newTeams);
            // Fire and forget - don't block UI on database sync
            syncPositionsToSupabase(newTeams).catch(err =>
                console.warn('Background sync failed:', err)
            );
        } else if (direction === 'down' && filteredIndex < currentFiltered.length - 1) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex + 1];
            console.log('Moving DOWN:', teamToMove.name, 'to position of', targetTeam.name);

            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);

            console.log('Indices:', { originIdx, targetIdx });

            // Remove the team from its current position
            const [moved] = newTeams.splice(originIdx, 1);

            // Recalculate target index after removal (if we removed before target, index shifts)
            const finalTargetIdx = originIdx < targetIdx ? targetIdx : targetIdx + 1;

            console.log('Final target index:', finalTargetIdx);

            // Insert it AFTER the target
            newTeams.splice(finalTargetIdx, 0, moved);

            console.log('✅ New teams order:', newTeams.map(t => t.name));

            // Invalidate cache before saving to prevent cache from overwriting
            const { dataCache } = await import('@/lib/dataCache');
            dataCache.invalidatePattern('teams');

            setTeams(newTeams);
            saveTeams(newTeams);
            // Fire and forget - don't block UI on database sync
            syncPositionsToSupabase(newTeams).catch(err =>
                console.warn('Background sync failed:', err)
            );
        } else {
            console.warn('⚠️ Move blocked:', {
                reason: direction === 'up' ? 'Already at top' : 'Already at bottom',
                filteredIndex,
                maxIndex: currentFiltered.length - 1
            });
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
                                {isOrdered ? 'Order is confirmed' : 'Confirm Order'}
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

            <div className="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {mainDisplayTeams.map((team, index) => {
                    const compConfig = COMPETITION_CATEGORIES.find(c => c.id === team.competition);
                    return (
                        <motion.div
                            key={team.id}
                            layout
                            transition={{
                                layout: { type: "spring", stiffness: 600, damping: 35 },
                                opacity: { duration: 0.2 }
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group relative bg-card/40 backdrop-blur-md border border-card-border p-3 rounded-2xl flex items-center gap-4 transition-all hover:bg-muted/30 hover:shadow-2xl hover:shadow-accent/5 ${team.isPlaceholder ? 'border-dashed opacity-50' : 'hover:border-accent/40'}`}
                        >
                            {/* Rank Indicator */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-muted border border-card-border flex flex-col items-center justify-center font-black shadow-inner">
                                    <span className="text-[9px] text-muted-foreground/40 uppercase leading-none mb-1">POS</span>
                                    <span className="text-lg text-foreground italic leading-none">{index + 1}</span>
                                </div>
                            </div>

                            {/* Team Identity */}
                            <div className="w-12 h-12 rounded-xl bg-muted border border-card-border overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                {team.logo ? (
                                    <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-black text-lg italic uppercase">
                                        {team.id.slice(-2)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-base truncate italic uppercase text-foreground leading-none tracking-tight mb-1">
                                    {team.robotName || team.name}
                                </h3>
                                <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-wide opacity-70">
                                    <span className="text-accent/80 italic">{team.club}</span>
                                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                    <span className="truncate">{team.university || 'Sector Unassigned'}</span>
                                </div>
                            </div>

                            {/* Dynamic Actions */}
                            <div className={`flex flex-col gap-1 transition-all duration-300 ${isOrdered ? 'opacity-20 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}>
                                <button
                                    onClick={() => moveTeamAcrossFiltered(index, 'up')}
                                    disabled={index === 0 || isOrdered}
                                    className="p-1.5 bg-card hover:bg-accent hover:text-white rounded-lg text-muted-foreground border border-card-border disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    title={isOrdered ? "Order Locked" : "Prioritize Unit"}
                                >
                                    <ArrowUp size={14} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => moveTeamAcrossFiltered(index, 'down')}
                                    disabled={index === mainDisplayTeams.length - 1 || isOrdered}
                                    className="p-1.5 bg-card hover:bg-accent hover:text-white rounded-lg text-muted-foreground border border-card-border disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                    title={isOrdered ? "Order Locked" : "De-prioritize Unit"}
                                >
                                    <ArrowDown size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
