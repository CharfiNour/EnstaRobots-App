"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, Bell, ClipboardCheck, AlertCircle, ArrowRight, Activity, Terminal, Shield, Users, MapPin } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getTeams } from '@/lib/teams';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COMPETITION_CONFIG: Record<string, { name: string, color: string }> = {
    junior_line_follower: { name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    junior_all_terrain: { name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    line_follower: { name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    all_terrain: { name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    fight: { name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

export default function TeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [teamData, setTeamData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const teams = getTeams();
        const team = teams.find(t => t.id === currentSession.teamId);

        if (team) {
            setTeamData(team);
            setProfileComplete(!team.isPlaceholder);
        }

        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <Shield className="w-10 h-10 text-role-primary" />
                            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                                Team Console
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 pl-1">
                            <div className="flex items-center gap-2 px-3 py-1 bg-role-primary/10 rounded-lg border border-role-primary/20">
                                <Activity size={14} className="text-role-primary" />
                                <span className="text-[10px] font-black uppercase text-foreground">{teamData?.robotName || teamData?.name || 'My Unit'}</span>
                            </div>
                            {teamData?.competition && (
                                <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${COMPETITION_CONFIG[teamData.competition]?.color || 'bg-role-primary/10 text-role-primary border-role-primary/20'}`}>
                                    {COMPETITION_CONFIG[teamData.competition]?.name || teamData.competition.replace(/_/g, ' ')}
                                </div>
                            )}
                            <div className="px-3 py-1 bg-muted/50 rounded-lg border border-card-border text-[10px] font-black text-muted-foreground uppercase">
                                {teamData?.club || 'Standalone'}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card/40 backdrop-blur-xl border border-card-border p-2 pr-8 rounded-[2rem] shadow-xl flex items-center gap-6"
                    >
                        <div className="p-5 bg-muted/50 rounded-2xl font-mono text-2xl font-black text-role-primary tracking-tighter">
                            {session?.teamCode}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50 mb-1">Access Token</p>
                            <p className="text-sm font-bold text-foreground">Active Node</p>
                        </div>
                    </motion.div>
                </div>

                {/* Tactical Alert Banner */}
                {!profileComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 group p-6 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
                        <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                            <div className="w-16 h-16 rounded-[1.2rem] bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-foreground uppercase tracking-tight mb-1">Registry Incomplete</h3>
                                <p className="text-muted-foreground text-sm font-medium">Your node visual data and roster are missing. Complete the registry to sync with global rankings.</p>
                            </div>
                        </div>
                        <Link
                            href="/team/profile"
                            className="px-10 py-4 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 hover:scale-105 transition-all shrink-0 flex items-center gap-3 relative z-10"
                        >
                            Complete Registry
                            <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Mission Schedule</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Next operational timeline</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    {
                                        id: '1',
                                        round: 'Qualifiers - Round 1',
                                        arena: 'Arena 1',
                                        opponent: 'SpeedRacers',
                                        status: 'upcoming',
                                        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                                        competition: 'Line Follower',
                                    },
                                    {
                                        id: '2',
                                        round: 'Qualifiers - Round 2',
                                        arena: 'Arena 2',
                                        opponent: 'QuickBots',
                                        status: 'upcoming',
                                        scheduledTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
                                        competition: 'Line Follower',
                                    }
                                ].map((match, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/30 border border-card-border/50 rounded-2xl hover:border-cyan-500/30 transition-all">
                                        <div className="flex items-center gap-3 min-w-[160px]">
                                            <div className="text-center px-3 py-1.5 bg-background rounded-lg border border-card-border/50">
                                                <span className="block text-lg font-black text-foreground">
                                                    {new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 text-cyan-500 mb-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Upcoming</span>
                                                </div>
                                                <p className="text-xs font-bold text-foreground">{match.competition}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-6 bg-background/50 p-3 rounded-xl border border-card-border/30">
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">You</p>
                                                <p className="text-sm font-bold text-role-primary heading-font">{teamData?.robotName || 'Your Node'}</p>
                                            </div>
                                            <div className="px-2 py-0.5 bg-muted rounded text-[9px] font-black text-muted-foreground">VS</div>
                                            <div className="text-left">
                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Opponent</p>
                                                <p className="text-sm font-bold text-foreground heading-font">{match.opponent}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MapPin size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{match.arena}</span>
                                            </div>
                                            <div className="px-3 py-1.5 bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-cyan-500/20">
                                                Prepare
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6 relative overflow-hidden">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-role-primary/10 text-role-primary flex items-center justify-center shrink-0">
                                        <Shield size={16} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight mb-0.5">Pre-Mission Prep</p>
                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Ensure all hardware nodes are calibrated.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight mb-0.5">Timeline Compliance</p>
                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Report to launch sector 15m early.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Status */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-role-primary/20 to-role-secondary/10 backdrop-blur-xl border border-role-primary/20 rounded-[2rem] p-6 flex flex-col justify-between h-auto">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-role-primary animate-ping"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-role-primary">Live Operations</span>
                                </div>
                                <h4 className="text-base font-black text-foreground uppercase tracking-tight mb-1">Systems Status</h4>
                                <p className="text-[10px] text-muted-foreground font-medium mb-6">All competition clusters are currently reporting normal telemetry.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "65%" }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        className="h-full bg-role-primary shadow-[0_0_10px_rgba(var(--color-role-primary-rgb),0.5)]"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Global Sync</span>
                                    <span className="text-role-primary">65% Optimized</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-4">Directives</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight">Unit Integrity</p>
                                        <p className="text-[10px] text-muted-foreground">Active credentials required.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <Trophy size={16} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-[10px] tracking-tight">Victory Protocol</p>
                                        <p className="text-[10px] text-muted-foreground">Outperform expectations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
