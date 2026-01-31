"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, Trophy, Building2, LayoutGrid, X, ChevronRight } from 'lucide-react';
import { TeamDetail } from '../competitions/[id]/components/TeamDetail';
import { fetchTeamsFromSupabase, fetchCompetitionsFromSupabase, fetchSingleTeamFromSupabase, fetchLiveSessionsFromSupabase } from '@/lib/supabaseData';
import { getCompetitionState, updateCompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import RestrictionScreen from '@/components/common/RestrictionScreen';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { dataCache, cacheKeys } from '@/lib/dataCache';
import { Team } from '@/lib/teams';
import { getCategoryMetadata } from '@/lib/constants';

// --- Components ---

const TeamCard = React.memo(({ team, onClick, competitionName, isLive }: { team: Team, onClick: () => void, competitionName: string, isLive: boolean }) => {
    const metadata = useMemo(() => getCategoryMetadata(team.competition || ''), [team.competition]);
    const baseColor = useMemo(() => {
        const match = metadata?.color?.match(/from-([\w-]+)/);
        return match ? match[1] : 'accent';
    }, [metadata]);

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="group relative cursor-pointer bg-white/70 backdrop-blur-xl border border-card-border rounded-3xl p-5 transition-all hover:shadow-2xl hover:shadow-black/[0.05] overflow-hidden"
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${baseColor}/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${baseColor}/10 transition-colors`} />

            <div className="flex items-center gap-5 relative z-10">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-white border border-card-border p-1.5 shadow-sm shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                    {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                            <Users size={24} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground truncate group-hover:text-accent transition-colors">
                            {team.robotName || team.name}
                        </h3>
                        {isLive && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                            <Building2 size={12} className="opacity-50" />
                            {team.club || 'Independent'}
                        </span>
                        <div className="h-3 w-[1px] bg-card-border hidden sm:block" />
                        <span className={`text-[10px] font-black uppercase tracking-widest text-${baseColor} flex items-center gap-1.5`}>
                            <Trophy size={12} className="opacity-50" />
                            {competitionName}
                        </span>
                    </div>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 group-hover:duration-300">
                    <ChevronRight size={20} className="text-muted-foreground" />
                </div>
            </div>
        </motion.div>
    );
});
TeamCard.displayName = 'TeamCard';

// --- Main Page ---

export default function TeamsPage() {
    // 1. Initial Data & State
    const initialTeams = useMemo(() => dataCache.get<Team[]>(cacheKeys.teams('minimal')) || [], []);
    const initialComps = useMemo(() => dataCache.get<any[]>(cacheKeys.competitions('minimal')) || [], []);

    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [competitions, setCompetitions] = useState<any[]>(initialComps);
    const [compState, setCompState] = useState(getCompetitionState());
    const [eventDayStarted, setEventDayStarted] = useState(getCompetitionState().eventDayStarted);
    const [loading, setLoading] = useState(initialTeams.length === 0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Detailed team selection
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [fullTeamDetails, setFullTeamDetails] = useState<Record<string, Team>>({});
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // 2. Fetching Logic (SWR Pattern)
    const loadData = useCallback(async (force = false) => {
        const [dbTeams, dbComps, eventStatus] = await Promise.all([
            fetchTeamsFromSupabase('minimal', force),
            fetchCompetitionsFromSupabase('minimal', force),
            syncEventDayStatusFromSupabase()
        ]);

        setTeams(dbTeams);
        setCompetitions(dbComps);
        setEventDayStarted(eventStatus);
        setLoading(false);

        // Fetch live sessions in background
        const sessions = await fetchLiveSessionsFromSupabase();
        if (sessions) {
            updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
        }
        setCompState(getCompetitionState());
    }, []);

    useEffect(() => {
        loadData(false); // Cache first
        loadData(true);  // Refresh in background

        const handleUpdate = () => {
            const state = getCompetitionState();
            setCompState(state);
            setEventDayStarted(state.eventDayStarted);
        };
        window.addEventListener('competition-state-updated', handleUpdate);
        return () => window.removeEventListener('competition-state-updated', handleUpdate);
    }, [loadData]);

    // 3. Realtime Updates
    const handleLiveUpdate = useCallback(async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        if (sessions) {
            updateCompetitionState({ liveSessions: sessions }, { syncRemote: false, suppressEvent: true });
        }
        setCompState(getCompetitionState());
    }, []);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedLiveHandler = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(handleLiveUpdate, 2000);
    }, [handleLiveUpdate]);

    useSupabaseRealtime('live_sessions', debouncedLiveHandler);

    // 4. Filtering Logic
    const filteredTeams = useMemo(() => {
        return teams.filter(t => {
            const matchesSearch = searchQuery === '' ||
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.robotName && t.robotName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                t.club.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || t.competition === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [teams, searchQuery, selectedCategory]);

    const compMap = useMemo(() => {
        const map: Record<string, string> = {};
        competitions.forEach(c => map[c.id] = c.name);
        return map;
    }, [competitions]);

    // 5. Deep Detail Fetching
    const handleTeamClick = useCallback(async (team: Team) => {
        setSelectedTeam(team);
        if (!fullTeamDetails[team.id]) {
            setIsDetailLoading(true);
            const full = await fetchSingleTeamFromSupabase(team.id);
            if (full) {
                setFullTeamDetails(prev => ({ ...prev, [full.id]: full }));
            }
            setIsDetailLoading(false);
        }
    }, [fullTeamDetails]);

    const effectiveSelectedTeam = selectedTeam ? (fullTeamDetails[selectedTeam.id] || selectedTeam) : null;

    if (!eventDayStarted) {
        return <RestrictionScreen />;
    }

    if (loading && teams.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin grayscale opacity-30"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-slate-50/50">
            {/* Header Area */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-card-border sticky top-0 z-30">
                <div className="container mx-auto px-4 max-w-6xl py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-foreground">
                                <LayoutGrid className="text-accent w-8 h-8" />
                                Unit Database
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 mt-1">
                                Complete Registry • Field Operations
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH UNITS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-6 py-3 bg-white border border-card-border rounded-2xl w-full sm:w-64 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold text-xs uppercase tracking-widest placeholder:opacity-50"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative group">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="pl-11 pr-10 py-3 bg-white border border-card-border rounded-2xl w-full focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-bold text-xs uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="all">ALL SECTORS</option>
                                    {competitions.map(c => (
                                        <option key={c.id} value={c.id}>{c.name?.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl py-12">
                {filteredTeams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {filteredTeams.map((team) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                onClick={() => handleTeamClick(team)}
                                competitionName={compMap[team.competition || ''] || 'Unknown'}
                                isLive={Object.values(compState.liveSessions).some(s => s.teamId === team.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white/40 border border-dashed border-card-border rounded-[3rem]">
                        <Users size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                        <h3 className="font-black uppercase italic text-xl text-muted-foreground/40">No units found in this sector</h3>
                    </div>
                )}
            </div>

            {/* --- Detail Drawer Overlay --- */}
            <AnimatePresence>
                {selectedTeam && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTeam(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <button
                                onClick={() => setSelectedTeam(null)}
                                className="absolute top-4 right-4 z-[110] p-3 bg-white/80 backdrop-blur-md rounded-full text-foreground hover:bg-white transition-all border border-card-border shadow-xl hover:rotate-90"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex justify-center">
                                <TeamDetail
                                    team={effectiveSelectedTeam}
                                    currentCategory={selectedTeam.competition || ''}
                                    isActuallyLive={Object.values(compState.liveSessions).some(s => s.teamId === selectedTeam.id)}
                                // Live score logic would be slightly more complex here to map session, but TeamDetail works without it
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
