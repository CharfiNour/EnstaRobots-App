"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, ChevronLeft,
    ChevronRight, MapPin, Shield,
    Building2, Crown, Cpu
} from 'lucide-react';
import { getTeams, Team, saveTeams } from '@/lib/teams';
import { getCompetitionState, CompetitionState, INITIAL_STATE } from '@/lib/competitionState';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { fetchLiveSessionsFromSupabase, fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { updateCompetitionState } from '@/lib/competitionState';

// Mock data for the demonstration
const COMPETITIONS = {
    '1': { title: 'Junior Line Follower', color: 'text-blue-400', banner: 'bg-blue-500/10' },
    '2': { title: 'Junior All Terrain', color: 'text-green-400', banner: 'bg-green-500/10' },
    '3': { title: 'Line Follower', color: 'text-purple-400', banner: 'bg-purple-500/10' },
    '4': { title: 'All Terrain', color: 'text-orange-400', banner: 'bg-orange-500/10' },
    '5': { title: 'Fight', color: 'text-red-400', banner: 'bg-red-500/10' },
};

export default function CompetitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('teams');
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [compState, setCompState] = useState<CompetitionState>(INITIAL_STATE);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const compId = params.id as string;
    const CATEGORY_MAP: Record<string, string> = {
        '1': 'junior_line_follower',
        '2': 'junior_all_terrain',
        '3': 'line_follower',
        '4': 'all_terrain',
        '5': 'fight'
    };
    const currentCategory = CATEGORY_MAP[compId];

    useEffect(() => {
        setMounted(true);

        const loadContent = async () => {
            setLoading(true);

            const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');

            // Parallel Fetching
            const [remoteTeams, sessions, remoteComps] = await Promise.all([
                fetchTeamsFromSupabase(),
                fetchLiveSessionsFromSupabase(),
                fetchCompetitionsFromSupabase()
            ]);

            setCompetitions(remoteComps);

            // Process Teams
            let allTeams = getTeams(); // Fallback to local
            if (remoteTeams && remoteTeams.length > 0) {
                allTeams = remoteTeams;
                saveTeams(allTeams); // Cache for next time
            }

            const filteredTeams = allTeams.filter(t => {
                if (!t.competition) return false;
                const comp = remoteComps.find((c: any) => c.id === t.competition);
                const category = comp ? comp.type : t.competition;
                return category === currentCategory;
            });
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
            const filteredTeams = remoteTeams.filter(t => {
                if (!t.competition) return false;
                const comp = remoteComps.find((c: any) => c.id === t.competition);
                const category = comp ? comp.type : t.competition;
                return category === currentCategory;
            });
            setTeams(filteredTeams);
        };

        window.addEventListener('competition-state-updated', handleStateUpdate);
        window.addEventListener('storage', handleStateUpdate);

        return () => {
            window.removeEventListener('competition-state-updated', handleStateUpdate);
            window.removeEventListener('storage', handleStateUpdate);
        };
    }, [compId, currentCategory]);

    const handleRealtimeUpdate = async () => {
        const sessions = await fetchLiveSessionsFromSupabase();
        updateCompetitionState({ liveSessions: sessions });
    };

    useSupabaseRealtime('live_sessions', handleRealtimeUpdate);

    const competition = COMPETITIONS[compId as keyof typeof COMPETITIONS] || { title: 'Competition Details', color: 'text-accent', banner: 'bg-accent/5' };
    const isActuallyLive = !!compState.liveSessions[currentCategory];

    return (
        <div className="min-h-screen">
            {/* Minimal Header */}
            <div className="container mx-auto px-4 pt-8 pb-4">
                <div className="mb-6">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <Trophy className={`w-10 h-10 md:w-12 md:h-12 ${competition.color} mt-1`} />
                            {mounted && isActuallyLive && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-1">
                                {competition.title}
                            </h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <MapPin size={14} className="text-accent" />
                                <span>Main Science Arena</span>
                                {mounted && isActuallyLive && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20 animate-pulse">
                                        LIVE NOW
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-card-border">
                    {['teams', 'matches'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold whitespace-nowrap transition-all uppercase text-xs tracking-widest border-b-2 ${activeTab === tab
                                ? 'border-accent text-accent'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-4">
                {activeTab === 'teams' && (
                    <div className="grid lg:grid-cols-[350px_1fr] gap-8">
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
                            ) : teams.map((team) => (
                                <button
                                    key={team.id}
                                    onClick={() => {
                                        setSelectedTeam(team);
                                        setShowMobileDetail(true);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group relative ${selectedTeam?.id === team.id
                                        ? 'bg-accent/10 border-accent shadow-md shadow-accent/5'
                                        : 'bg-card border-card-border hover:border-accent/30'
                                        }`}
                                >
                                    {mounted && compState.liveSessions[currentCategory]?.teamId === team.id && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)] z-10" />
                                    )}

                                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-card-border group-hover:scale-110 transition-transform">
                                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-foreground truncate uppercase text-sm tracking-tight">{team.name}</div>
                                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 font-bold uppercase opacity-70">
                                            <span className="text-accent">{team.club}</span>
                                            {team.university && (
                                                <>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                                                    <span className="truncate">{team.university}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-muted-foreground/30" />
                                </button>
                            ))}
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
                                        className="w-full max-w-md bg-card border border-card-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20"
                                    >
                                        {/* Mobile Back Button */}
                                        <div className="lg:hidden p-4 pb-0">
                                            <button
                                                onClick={() => setShowMobileDetail(false)}
                                                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                                Back to Team List
                                            </button>
                                        </div>

                                        {/* ID Card Top Section */}
                                        <div className="relative p-6 pt-8 lg:pt-12 pb-8 bg-gradient-to-br from-accent/20 via-card to-card border-b border-card-border overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                                            <div className="relative flex flex-col items-center text-center">
                                                <div className="relative group mb-6">
                                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-card border-4 border-accent shadow-xl overflow-hidden transform group-hover:rotate-3 transition-transform relative">
                                                        {selectedTeam?.photo ? (
                                                            <img src={selectedTeam.photo} alt="Robot" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 opacity-40">
                                                                <Cpu size={40} className="text-muted-foreground mb-2" />
                                                                <span className="text-[10px] font-black uppercase">No Image</span>
                                                            </div>
                                                        )}

                                                        {selectedTeam?.logo && (
                                                            <div className="absolute bottom-2 right-2 w-8 h-8 bg-card rounded-lg border border-accent/30 p-1 shadow-md">
                                                                <img src={selectedTeam.logo} alt="Club" className="w-full h-full object-contain" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {mounted && compState.liveSessions[currentCategory]?.teamId === selectedTeam?.id && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-card animate-pulse shadow-lg" />
                                                    )}
                                                </div>

                                                <h2 className="text-3xl font-black text-foreground tracking-tighter mb-1 uppercase">
                                                    {selectedTeam?.robotName || selectedTeam?.name}
                                                </h2>

                                                <div className="px-3 py-1 bg-accent/10 rounded-full text-[10px] font-black text-accent uppercase tracking-[0.2em] border border-accent/20 mb-3">
                                                    {selectedTeam?.club || 'Independent Unit'}
                                                </div>

                                                <p className="font-bold text-muted-foreground text-sm flex items-center justify-center gap-2">
                                                    <Building2 size={14} className="opacity-50" />
                                                    {selectedTeam?.university}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Unit Crew List */}
                                        <div className="p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Unit Personnel</h3>
                                                <div className="h-px bg-card-border grow mx-4 opacity-50"></div>
                                                <Users size={14} className="text-accent opacity-50" />
                                            </div>

                                            <div className="space-y-3">
                                                {selectedTeam?.members.map((member, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-card-border/50 group hover:border-accent/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.role === 'Leader' || member.isLeader ? 'bg-yellow-500 text-slate-900' : 'bg-card border border-card-border text-muted-foreground'}`}>
                                                                {member.role === 'Leader' || member.isLeader ? <Crown size={14} /> : member.name.charAt(0)}
                                                            </div>
                                                            <div className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">{member.name}</div>
                                                        </div>
                                                        {(member.role === 'Leader' || member.isLeader) && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 bg-yellow-500 px-2 py-0.5 rounded-full border border-yellow-600 shadow-sm animate-pulse">
                                                                Leader
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'matches' && (
                    <ScoreHistoryView
                        initialCompetition={
                            compId === '1' ? 'junior_line_follower' :
                                compId === '2' ? 'junior_all_terrain' :
                                    compId === '3' ? 'line_follower' :
                                        compId === '4' ? 'all_terrain' :
                                            compId === '5' ? 'fight' : 'all'
                        }
                        showFilter={false}
                    />
                )}
            </div>
        </div >
    );
}
