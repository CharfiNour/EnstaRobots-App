"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, ChevronLeft,
    ChevronRight, MapPin, Shield,
    Building2, Crown, Cpu, Image as ImageIcon,
    Target, Zap, Globe, Activity
} from 'lucide-react';
import { getTeams, Team, saveTeams } from '@/lib/teams';
import { getCompetitionState, CompetitionState, INITIAL_STATE } from '@/lib/competitionState';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';
import { COMPETITION_CATEGORIES, LEGACY_ID_MAP, UUID_MAP } from '@/lib/constants';

function canonicalizeCompId(id: string | any | undefined, dbComps: any[] = []): string {
    if (!id) return '';
    const norm = String(id).toLowerCase().trim();

    /**
     * HELPER: Robustly resolve any competition identifier to a canonical slug
     */
    // 0. Pre-emptive check: Known Slugs
    const knownSlugs = ['junior_line_follower', 'junior_all_terrain', 'line_follower', 'all_terrain', 'fight'];
    if (knownSlugs.includes(norm)) return norm;

    // 1. UUID Map (Production Database IDs)
    if (UUID_MAP[norm]) return UUID_MAP[norm];

    // 2. Check Database records if available
    const db = (dbComps || []).find(c =>
        (c.id && String(c.id).toLowerCase() === norm) ||
        (c.type && String(c.type).toLowerCase() === norm)
    );
    if (db?.type) return db.type;

    // 3. Check local categories (Slugs)
    const local = COMPETITION_CATEGORIES.find(c =>
        (c.id && String(c.id).toLowerCase() === norm) ||
        (c.type && String(c.type).toLowerCase() === norm)
    );
    if (local) return local.type;

    // 4. LEGACY Map fallback
    for (const [slug, legacyId] of Object.entries(LEGACY_ID_MAP)) {
        if (String(legacyId).toLowerCase() === norm || String(slug).toLowerCase() === norm) return slug.toLowerCase();
    }

    return norm.toLowerCase();
}

// Mock data for the demonstration
const COMPETITIONS: Record<string, any> = {
    'junior_line_follower': { title: 'Junior Line Follower', color: 'text-cyan-400', banner: 'bg-cyan-500/10' },
    'junior_all_terrain': { title: 'Junior All Terrain', color: 'text-emerald-400', banner: 'bg-emerald-500/10' },
    'line_follower': { title: 'Line Follower', color: 'text-indigo-400', banner: 'bg-indigo-500/10' },
    'all_terrain': { title: 'All Terrain', color: 'text-orange-400', banner: 'bg-orange-500/10' },
    'fight': { title: 'Fight Sector', color: 'text-rose-400', banner: 'bg-red-500/10' },
    // Backwards compatibility for numeric IDs
    '1': { title: 'Junior Line Follower', color: 'text-cyan-400', banner: 'bg-cyan-500/10' },
    '2': { title: 'Junior All Terrain', color: 'text-emerald-400', banner: 'bg-emerald-500/10' },
    '3': { title: 'Line Follower', color: 'text-indigo-400', banner: 'bg-indigo-500/10' },
    '4': { title: 'All Terrain', color: 'text-orange-400', banner: 'bg-orange-500/10' },
    '5': { title: 'Fight Sector', color: 'text-rose-400', banner: 'bg-red-500/10' },
};

export default function CompetitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('teams');
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [scores, setScores] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [compState, setCompState] = useState<CompetitionState>(INITIAL_STATE);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const compId = params.id as string;
    const currentCategory = compId || '';

    useEffect(() => {
        setMounted(true);

        const loadContent = async () => {
            setLoading(true);

            const { fetchCompetitionsFromSupabase, fetchScoresFromSupabase } = await import('@/lib/supabaseData');

            // Parallel Fetching
            const [remoteTeams, sessions, remoteComps, remoteScores] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase(),
                fetchScoresFromSupabase()
            ]);

            setCompetitions(remoteComps);
            setScores(remoteScores);

            // Process Teams
            let allTeams = getTeams(); // Fallback to local
            if (remoteTeams && remoteTeams.length > 0) {
                allTeams = remoteTeams;
                saveTeams(allTeams); // Cache for next time
            }

            const filteredTeams = allTeams.filter(t => {
                if (!t.competition) return false;
                const teamCategory = canonicalizeCompId(t.competition, remoteComps);
                const targetCategory = canonicalizeCompId(currentCategory, remoteComps);
                return teamCategory === targetCategory;
            });
            console.log(`Initial Load: Filtered ${filteredTeams.length} teams for ${currentCategory}`);
            setTeams(filteredTeams);

            // Initial selection if none
            if (filteredTeams.length > 0 && !selectedTeam) {
                setSelectedTeam(filteredTeams[0]);
            }

            // Process State
            if (Object.keys(sessions).length > 0) {
                updateCompetitionState({ liveSessions: sessions });
            }
            setCompState(getCompetitionState());

            setLoading(false);
        };

        loadContent();

        const handleStateUpdate = async () => {
            setCompState(getCompetitionState());
            const { fetchTeamsFromSupabase, fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
            const [remoteTeams, remoteComps] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchCompetitionsFromSupabase()
            ]);

            setCompetitions(remoteComps);
            const filteredTeams = remoteTeams.filter((t: any) => {
                if (!t.competition) return false;
                const teamCategory = canonicalizeCompId(t.competition, remoteComps);
                const targetCategory = canonicalizeCompId(currentCategory, remoteComps);

                // Extra fallback: check if t.competition matches currentCategory directly
                return teamCategory === targetCategory || String(t.competition).toLowerCase() === String(currentCategory).toLowerCase();
            });
            console.log(`State Update: Filtered ${filteredTeams.length} teams for ${currentCategory}`);
            setTeams(filteredTeams);
        };

        window.addEventListener('competition-state-updated', handleStateUpdate);
        window.addEventListener('teams-updated', handleStateUpdate);
        window.addEventListener('storage', handleStateUpdate);

        return () => {
            window.removeEventListener('competition-state-updated', handleStateUpdate);
            window.removeEventListener('teams-updated', handleStateUpdate);
            window.removeEventListener('storage', handleStateUpdate);
        };
    }, [compId, currentCategory]);

    const handleRealtimeUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        updateCompetitionState({ liveSessions: sessions });
    };

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);

    const competition = COMPETITIONS[currentCategory] || COMPETITIONS[compId] || { title: 'Competition Intel', color: 'text-accent', banner: 'bg-accent/5' };
    const isActuallyLive = !!compState.liveSessions[currentCategory];

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            {/* Minimal Header */}
            <div className="container mx-auto px-4 pt-6 md:pt-8 pb-4">
                <div className="mb-4 md:mb-8 relative">
                    {/* Background Glow */}
                    <div className={`absolute -top-10 -left-10 md:-top-20 md:-left-20 w-24 h-24 md:w-64 md:h-64 opacity-20 blur-3xl rounded-full ${competition.color.replace('text-', 'bg-')}`} />

                    <div className="flex items-center md:items-start gap-3 md:gap-5 relative z-10">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${competition.color.replace('text-', 'from-')} to-transparent opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500`} />
                            <Trophy className={`w-7 h-7 md:w-14 md:h-14 ${competition.color} drop-shadow-lg relative z-10`} />
                            {mounted && isActuallyLive && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] border-2 border-background z-20" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2 md:mb-2 tracking-tight uppercase italic leading-none truncate pr-4 leading-tight">
                                {competition.title}
                            </h1>
                            <div className="flex items-center gap-2 md:gap-3 text-muted-foreground text-[8px] md:text-sm font-medium">
                                <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-accent/5 border border-accent/10 backdrop-blur-sm shrink-0">
                                    <MapPin size={9} className="text-accent md:w-[14px] md:h-[14px]" />
                                    <span className="uppercase tracking-wide font-bold">Arena Sector</span>
                                </div>
                                {mounted && isActuallyLive && (
                                    <button
                                        onClick={() => {
                                            const liveTeamId = compState.liveSessions[currentCategory]?.teamId;
                                            if (liveTeamId) {
                                                const liveTeam = teams.find(t => t.id === liveTeamId);
                                                if (liveTeam) {
                                                    setSelectedTeam(liveTeam);
                                                    setShowMobileDetail(true);
                                                    setActiveTab('teams');
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 animate-pulse shadow-sm shadow-red-500/5 hover:bg-red-500/20 transition-all shrink-0"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <span className="font-black uppercase tracking-widest leading-none">LIVE NOW</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs - Light Glassmorphism Pills */}
                {/* Navigation Tabs - Light Glassmorphism Pills */}
                <div className="flex gap-1 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-card-border w-fit shadow-inner mt-10 md:mt-0">
                    {['teams', 'matches'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 md:px-8 md:py-3 rounded-xl font-black text-[8px] md:text-[11px] uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${activeTab === tab
                                ? 'bg-accent text-white shadow-lg shadow-accent/25 ring-1 ring-accent/50 scale-100'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/80 scale-95 opacity-70 hover:opacity-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className={`container mx-auto px-4 py-4 ${activeTab === 'matches' ? 'max-w-7xl' : ''}`}>
                {activeTab === 'teams' && (
                    <div className="grid lg:grid-cols-[350px_1fr] gap-8 mt-0">
                        {/* Team List Sidebar */}
                        <div className={`space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 no-scrollbar lg:block ${showMobileDetail ? 'hidden' : 'block'}`}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-accent" />
                                <span className="text-accent">{loading ? '...' : teams.length}</span> Registered Teams
                            </h3>

                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-20 bg-muted rounded-xl w-full" />
                                    ))}
                                </div>
                            ) : (() => {
                                const liveId = mounted ? compState.liveSessions[currentCategory]?.teamId : null;
                                const sortedTeams = [...teams].sort((a, b) => {
                                    if (a.id === liveId) return -1;
                                    if (b.id === liveId) return 1;
                                    return 0;
                                });

                                return sortedTeams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            setShowMobileDetail(true);
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-5 group relative overflow-hidden ${selectedTeam?.id === team.id
                                            ? 'bg-accent/5 border-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.05)]'
                                            : 'bg-white/60 border-card-border hover:border-accent/20 hover:bg-white/80 shadow-sm'
                                            }`}
                                    >
                                        {/* Active Live Indicator */}
                                        {mounted && compState.liveSessions[currentCategory]?.teamId === team.id && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20 backdrop-blur-md z-10">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live</span>
                                            </div>
                                        )}

                                        <div className="w-14 h-14 rounded-xl bg-white flex-shrink-0 overflow-hidden border border-card-border shadow-md group-hover:scale-105 transition-transform duration-500">
                                            {team.logo ? (
                                                <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                    <Shield size={24} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`font-black uppercase text-sm tracking-tight truncate transition-colors ${selectedTeam?.id === team.id ? 'text-accent' : 'text-foreground group-hover:text-accent'}`}>
                                                    {team.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
                                                <span className="text-accent truncate max-w-[120px]">{team.club}</span>
                                                {team.university && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                        <span className="text-muted-foreground truncate">{team.university}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded-full border transition-all ${selectedTeam?.id === team.id ? 'bg-accent text-white border-accent' : 'bg-transparent border-accent/20 text-muted-foreground group-hover:text-accent group-hover:border-accent/40'}`}>
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                ));
                            })()}
                        </div>

                        {/* Team Detail Pane */}
                        <div className={`justify-center ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
                            {loading ? (
                                <div className="w-full max-w-md h-[400px] bg-muted rounded-[2.5rem] animate-pulse" />
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedTeam?.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full max-w-sm bg-white/70 backdrop-blur-xl border border-card-border rounded-[2.5rem] overflow-hidden shadow-2xl group relative self-start"
                                    >
                                        {/* Mobile Back Button Overlay - Themed */}
                                        <div className="lg:hidden absolute top-4 left-4 z-20">
                                            <button
                                                onClick={() => setShowMobileDetail(false)}
                                                className="p-3 bg-white/60 backdrop-blur-xl rounded-full text-foreground hover:bg-white/90 transition-all border border-card-border hover:scale-110 shadow-xl"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                        </div>

                                        {/* Unified Tactical Hero - Compacted aspect to focus on hardware */}
                                        <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                                            {selectedTeam?.photo ? (
                                                <img
                                                    src={selectedTeam.photo}
                                                    alt="Robot"
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="text-center p-6 opacity-40">
                                                    <Cpu size={50} className="mx-auto mb-3 text-muted-foreground" />
                                                    <p className="font-black uppercase tracking-tighter text-[10px]">Unit Visual Required</p>
                                                </div>
                                            )}

                                            {/* Floating Sector Badge - Top Position */}
                                            <div className="absolute top-4 right-4 z-20">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg ${(() => {
                                                    if (currentCategory.includes('fight')) return 'bg-rose-500/30 border-rose-500/50 text-rose-300';
                                                    if (currentCategory.includes('junior_line')) return 'bg-emerald-500/30 border-emerald-500/30 text-emerald-300';
                                                    if (currentCategory.includes('junior_all')) return 'bg-cyan-500/30 border-cyan-500/50 text-cyan-300';
                                                    if (currentCategory.includes('line_follower')) return 'bg-blue-500/30 border-blue-500/50 text-blue-300';
                                                    if (currentCategory.includes('all_terrain')) return 'bg-indigo-500/30 border-indigo-500/30 text-indigo-300';
                                                    return 'bg-accent/30 border-accent/50 text-accent';
                                                })()}`}>
                                                    {(() => {
                                                        if (currentCategory.includes('fight')) return <Target size={12} />;
                                                        if (currentCategory.includes('line')) return <Zap size={12} />;
                                                        if (currentCategory.includes('terrain')) return <Globe size={12} />;
                                                        return <Activity size={12} />;
                                                    })()}
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                        {(() => {
                                                            if (currentCategory === 'junior_line_follower') return 'Junior Line';
                                                            if (currentCategory === 'junior_all_terrain') return 'Junior Terrain';
                                                            if (currentCategory === 'line_follower') return 'Line Follower';
                                                            if (currentCategory === 'all_terrain') return 'All Terrain';
                                                            if (currentCategory === 'fight') return 'Fight Sector';
                                                            return currentCategory;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Tactical Gradient Shroud */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>

                                            {/* Integrated Intel Overlay */}
                                            <div className="absolute bottom-6 left-6 right-6 space-y-4">
                                                {/* Core Identity */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 shrink-0 overflow-hidden shadow-2xl">
                                                        {selectedTeam?.logo ? (
                                                            <img src={selectedTeam.logo} alt="Club" className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/40">
                                                                <ImageIcon size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h2 className="text-[22px] font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-lg truncate mb-1.5">
                                                            {selectedTeam?.robotName || selectedTeam?.name || 'Unnamed Unit'}
                                                        </h2>

                                                        {/* Classification & Deployment - Optimized Badges */}
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <div className="px-3 py-1 bg-accent/20 border border-accent/30 backdrop-blur-md rounded-full flex items-center">
                                                                <span className="text-accent font-black text-[9px] uppercase tracking-widest leading-none">
                                                                    {selectedTeam?.club || 'Independent'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-full">
                                                                <Building2 size={10} className="text-white/60" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none truncate max-w-[120px]">
                                                                    {selectedTeam?.university || 'Generic Univ'}
                                                                </span>
                                                            </div>

                                                            {mounted && compState.liveSessions[currentCategory]?.teamId === selectedTeam?.id && (
                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full backdrop-blur-md">
                                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                                    <span className="text-[9px] font-black text-red-500 uppercase leading-none">Live</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unit Personnel Section - Compact Light Tactical Glass */}
                                        <div className="p-4 md:p-5 bg-gradient-to-b from-transparent to-accent/5">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.25em] flex items-center gap-2.5">
                                                    <Users size={12} className="text-accent/60" />
                                                    Unit Personnel
                                                </h3>
                                                <div className="h-px bg-card-border grow mx-4"></div>
                                            </div>

                                            <div className="space-y-2">
                                                {selectedTeam?.members.map((member, i) => {
                                                    const isLeader = member.isLeader || member.role === 'Leader';
                                                    return (
                                                        <div key={i} className="flex items-center justify-between p-2 bg-white/50 rounded-2xl border border-card-border group/member hover:bg-white/80 hover:border-accent/20 transition-all duration-300">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-md transition-all ${isLeader ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 border border-yellow-300 scale-110' : 'bg-white border border-card-border text-muted-foreground group-hover/member:border-accent/40'}`}>
                                                                    {isLeader ? <Crown size={14} /> : (member.name.charAt(0) || '?')}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="font-black text-[11px] text-foreground/90 group-hover/member:text-accent transition-colors tracking-tight uppercase">{member.name}</div>
                                                                    <div className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">{isLeader ? 'Lead Operator' : 'Unit Member'}</div>
                                                                </div>
                                                            </div>
                                                            {isLeader && (
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-900 bg-yellow-400 px-2.5 py-1 rounded-full border border-yellow-200 shadow-sm">
                                                                    Leader
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <div className="py-4 md:py-8">
                        <ScoreHistoryView
                            lockedCompetitionId={currentCategory}
                            showFilter={true}
                            isSentToTeamOnly={false}
                        />
                    </div>
                )}
            </div>
        </div >
    );
}
