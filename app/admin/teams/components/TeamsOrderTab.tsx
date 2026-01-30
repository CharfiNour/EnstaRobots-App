"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shuffle, Loader2, Lock, AlertCircle, ChevronDown } from 'lucide-react';
import { Team, saveTeams } from '@/lib/teams';
import { supabase } from '@/lib/supabase';
import { toggleCompetitionOrdered } from '@/lib/competitionState';

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
    const [competitions, setCompetitions] = useState<any[]>([]);

    // Draw States
    const [drawing, setDrawing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        const fetchComps = async () => {
            const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
            const data = await fetchCompetitionsFromSupabase();
            setCompetitions(data);
        };
        fetchComps();
    }, []);

    // Filter by Category Only (Source for Draw)
    const categoryTeams = useMemo(() => {
        return teams.filter(t => {
            let matchesCat = selectedCategory === 'all';
            if (!matchesCat) {
                if (!t.competition) return false;
                const comp = competitions.find(c => c.id === t.competition || c.type === t.competition);
                const teamCategory = comp ? comp.type : t.competition;
                matchesCat = teamCategory === selectedCategory;
            }
            return matchesCat;
        });
    }, [teams, selectedCategory, competitions]);

    // Filter by Search & Sorted (Source for List Display)
    const displayTeams = useMemo(() => {
        return categoryTeams
            .filter(t => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                    t.robotName?.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query) ||
                    t.club.toLowerCase().includes(query) ||
                    t.university?.toLowerCase().includes(query)
                );
            })
            // Always sort by displayOrder if present (0s go to end)
            .sort((a, b) => {
                const orderA = a.displayOrder || 9999;
                const orderB = b.displayOrder || 9999;
                return orderA - orderB;
            });
    }, [categoryTeams, searchQuery]);

    // Check if order is already set for this category
    const isOrderSet = useMemo(() => {
        if (categoryTeams.length === 0) return false;
        // If ANY team has a real order (1+), we consider the category drawn
        return categoryTeams.some(t => t.displayOrder && t.displayOrder > 0);
    }, [categoryTeams]);

    // Perform the Random Draw
    const performDraw = async () => {
        if (categoryTeams.length < 2) return;

        setDrawing(true);
        setCountdown(3);

        // Animation Timer
        const countInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === 1) {
                    clearInterval(countInterval);
                    finalizeDraw();
                    return 0;
                }
                return (prev || 0) - 1;
            });
        }, 800);
    };

    const finalizeDraw = async () => {
        try {
            // 1. Shuffle
            const shuffled = [...categoryTeams];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // 2. Assign Orders
            const updates = shuffled.map((t, index) => ({
                ...t,
                displayOrder: index + 1
            }));

            // 3. Update Local State (Merging back into full teams list)
            const newAllTeams = teams.map(t => {
                const updated = updates.find(u => u.id === t.id);
                return updated || t;
            });

            setTeams(newAllTeams);
            saveTeams(newAllTeams);

            // 4. Persist to DB
            for (const team of updates) {
                await (supabase.from('teams') as any)
                    .update({ display_order: team.displayOrder })
                    .eq('id', team.id);
            }

            // Update Competition State Flag
            toggleCompetitionOrdered(selectedCategory);

            setDrawing(false);
            setCountdown(null);

        } catch (err) {
            console.error("Draw Failed:", err);
            setDrawing(false);
            setCountdown(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-card-border pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold italic uppercase leading-none mb-1 text-foreground flex items-center gap-2">
                            {COMPETITION_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Competition Order'}
                            {isOrderSet && <Lock size={16} className="text-accent/60" />}
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-50">
                            {isOrderSet ? 'Sequence Locked • Action Restricted' : 'Awaiting Sequence Generation'}
                        </p>
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

                {/* Search - Only show if list is visible */}
                {isOrderSet && (
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
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* CASE 1: DRAW INTERFACE */}
                    {!isOrderSet && !drawing && (
                        <motion.div
                            key="draw-ui"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                                <Shuffle size={48} className="text-accent" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black uppercase italic mb-2">Initialize Sequence</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                                    Generate a randomized, immutable starting order for {categoryTeams.length} qualified units.
                                </p>
                            </div>

                            {categoryTeams.length < 2 ? (
                                <div className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 rounded-lg text-sm font-bold">
                                    <AlertCircle size={16} />
                                    <span>Insufficient Units ({categoryTeams.length}/2)</span>
                                </div>
                            ) : (
                                <button
                                    onClick={performDraw}
                                    className="group relative px-10 py-4 bg-accent text-slate-950 font-black uppercase italic tracking-widest text-lg rounded-xl overflow-hidden shadow-lg hover:shadow-accent/25 hover:scale-105 transition-all"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        <Loader2 size={20} className="animate-spin hidden group-active:block" />
                                        Generate Order
                                    </span>
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* CASE 2: ANIMATION */}
                    {drawing && (
                        <motion.div
                            key="drawing-anim"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-accent/40 blur-[60px] rounded-full animate-pulse" />
                                <span className="relative z-10 text-8xl font-black italic text-foreground text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                                    {countdown === 0 ? 'LOCKED' : countdown}
                                </span>
                            </div>
                            <p className="mt-8 text-xs font-black uppercase tracking-[0.5em] text-accent animate-pulse">
                                Randomizing Sequence...
                            </p>
                        </motion.div>
                    )}

                    {/* CASE 3: LIST VIEW (LOCKED) */}
                    {isOrderSet && !drawing && (
                        <motion.div
                            key="list-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar space-y-3"
                        >
                            {displayTeams.map((team, index) => (
                                <motion.div
                                    key={team.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative bg-card/40 backdrop-blur-md border border-card-border p-3 rounded-2xl flex items-center gap-4 hover:bg-muted/30"
                                >
                                    {/* Locked Position */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-xl bg-muted/50 border border-card-border flex flex-col items-center justify-center font-black">
                                            <span className="text-[9px] text-muted-foreground/40 uppercase leading-none mb-1">POS</span>
                                            <span className="text-lg text-foreground/80 italic leading-none">{team.displayOrder}</span>
                                        </div>
                                    </div>

                                    {/* Team Identity */}
                                    <div className="w-12 h-12 rounded-xl bg-muted border border-card-border overflow-hidden flex-shrink-0">
                                        {team.logo ? (
                                            <img src={team.logo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
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
                                            <span className="text-accent/60 italic">{team.club}</span>
                                            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                            <span className="truncate">{team.university}</span>
                                        </div>
                                    </div>

                                    {/* Lock Icon */}
                                    <div className="pr-4 opacity-10">
                                        <Lock size={20} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
