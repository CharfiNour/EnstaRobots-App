"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, Calendar, ChevronLeft,
    ChevronRight, MapPin, ExternalLink, Shield,
    User, School, Building2, Crown
} from 'lucide-react';
import { getTeams, Team, TeamMember } from '@/lib/teams';
import { getCompetitionState, CompetitionState } from '@/lib/competitionState';

// Mock data for the demonstration
const COMPETITIONS = {
    '1': { title: 'Junior Line Follower', color: 'text-blue-400', banner: 'bg-blue-500/10' },
    '2': { title: 'Junior All Terrain', color: 'text-green-400', banner: 'bg-green-500/10' },
    '3': { title: 'Line Follower', color: 'text-purple-400', banner: 'bg-purple-500/10' },
    '4': { title: 'All Terrain', color: 'text-orange-400', banner: 'bg-orange-500/10' },
    '5': { title: 'Fight (Battle Robots)', color: 'text-red-400', banner: 'bg-red-500/10' },
};

const MATCHES = [
    {
        phase: 'Phase 1: Qualifiers', matches: [
            { id: 1, teamA: 'RoboKnights', teamB: 'CyberDragons', scoreA: 25, scoreB: 20, status: 'Completed' },
            { id: 2, teamA: 'Steel Panthers', teamB: 'Alpha Bots', scoreA: null, scoreB: null, status: 'Upcoming' },
        ]
    },
];

export default function CompetitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('teams');

    // Data State
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [compState, setCompState] = useState<CompetitionState>({ activeTeamId: null, isLive: false, currentPhase: null, startTime: null });

    useEffect(() => {
        // Load teams
        const loadedTeams = getTeams();
        setTeams(loadedTeams);
        if (loadedTeams.length > 0) {
            setSelectedTeam(loadedTeams[0]);
        }

        // Load and Listen for Competition State
        setCompState(getCompetitionState());

        const handleStateUpdate = () => {
            setCompState(getCompetitionState());
        };

        window.addEventListener('competition-state-updated', handleStateUpdate);
        window.addEventListener('storage', handleStateUpdate); // Cross-tab support

        return () => {
            window.removeEventListener('competition-state-updated', handleStateUpdate);
            window.removeEventListener('storage', handleStateUpdate);
        };
    }, []);

    const compId = params.id as string;
    const competition = COMPETITIONS[compId as keyof typeof COMPETITIONS] || { title: 'Competition Details', color: 'text-accent', banner: 'bg-accent/5' };

    return (
        <div className="min-h-screen">
            {/* Minimal Header */}
            <div className="container mx-auto px-4 pt-8 pb-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <Trophy className={`w-10 h-10 md:w-12 md:h-12 ${competition.color} mt-1`} />
                            {compState.isLive && (
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
                                {compState.isLive && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20 animate-pulse">
                                        LIVE NOW
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

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
                <AnimatePresence mode="wait">
                    {activeTab === 'teams' && (
                        <motion.div
                            key="teams"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid lg:grid-cols-[350px_1fr] gap-8"
                        >
                            {/* Team List Sidebar */}
                            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 no-scrollbar">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" />
                                    <span className="text-accent">{teams.length}</span> Registered Teams
                                </h3>
                                {teams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeam(team)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group relative ${selectedTeam?.id === team.id
                                            ? 'bg-accent/10 border-accent shadow-md shadow-accent/5'
                                            : 'bg-card border-card-border hover:border-accent/30'
                                            }`}
                                    >
                                        {/* RED DOT INDICATOR */}
                                        {compState.isLive && compState.activeTeamId === team.id && (
                                            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)] z-10" />
                                        )}

                                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-card-border group-hover:scale-110 transition-transform">
                                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-foreground truncate">{team.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{team.university}</div>
                                        </div>
                                        {selectedTeam?.id === team.id && (
                                            <ChevronRight size={18} className="text-accent" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Team Detail Pane */}
                            <div className="space-y-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedTeam?.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-xl shadow-black/[0.02]"
                                    >
                                        {/* Profile Header Card */}
                                        <div className="relative h-48 md:h-64 bg-muted">
                                            <img src={selectedTeam?.photo} alt="Team" className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-6 left-6 flex items-end gap-6 text-white w-full pr-12">
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card p-2 border-4 border-accent shadow-2xl overflow-hidden">
                                                    <img src={selectedTeam?.logo} alt="Logo" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 mb-2">
                                                    <h2 className="text-3xl md:text-5xl font-bold mb-2">{selectedTeam?.name}</h2>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm md:text-base opacity-90">
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 size={16} className="text-accent" />
                                                            {selectedTeam?.club}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <School size={16} className="text-accent" />
                                                            {selectedTeam?.university}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile Content */}
                                        <div className="p-8">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Users className="w-5 h-5 text-accent" />
                                                Team Members
                                            </h3>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {selectedTeam?.members.map((member, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-muted/50 border border-card-border flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                                                <User size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground">{member.name}</div>
                                                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                                            </div>
                                                        </div>
                                                        {member.role === 'Leader' && (
                                                            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                                <Crown size={12} />
                                                                Leader
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}



                    {activeTab === 'matches' && (
                        <motion.div
                            key="matches"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {MATCHES.map((group, groupIdx) => (
                                <div key={groupIdx}>
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-card-border pb-4">
                                        <Calendar className="w-6 h-6 text-accent" />
                                        {group.phase}
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.matches.map((match) => (
                                            <div key={match.id} className="p-6 rounded-2xl bg-card border border-card-border shadow-md shadow-black/[0.02]">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${match.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'
                                                        }`}>
                                                        {match.status}
                                                    </span>
                                                    <ExternalLink size={14} className="text-muted-foreground hover:text-accent cursor-pointer" />
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-center flex-1">
                                                        <div className="w-12 h-12 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center font-bold text-xs">A</div>
                                                        <div className="font-bold text-sm truncate">{match.teamA}</div>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-2xl font-black text-foreground">
                                                            {match.scoreA !== null ? `${match.scoreA} : ${match.scoreB}` : 'VS'}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Score</div>
                                                    </div>

                                                    <div className="text-center flex-1">
                                                        <div className="w-12 h-12 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center font-bold text-xs">B</div>
                                                        <div className="font-bold text-sm truncate">{match.teamB}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
