"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, Bell, ClipboardCheck, AlertCircle, ArrowRight, Activity, Terminal, Shield, Users } from 'lucide-react';
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
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-role-primary/10 rounded-2xl">
                                <Activity className="text-role-primary w-8 h-8" />
                            </div>
                            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
                                {teamData?.robotName || teamData?.name || 'My Team'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 pl-1">
                            {teamData?.competition && (
                                <div className={`px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${COMPETITION_CONFIG[teamData.competition]?.color || 'bg-role-primary/10 text-role-primary border-role-primary/20'}`}>
                                    {COMPETITION_CONFIG[teamData.competition]?.name || teamData.competition.replace(/_/g, ' ')}
                                </div>
                            )}
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full opacity-30"></div>
                            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                {teamData?.club || 'Standalone Node'}
                            </p>
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
                        className="mb-12 group p-8 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
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

                {/* Operations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        {
                            href: "/team/announcements",
                            icon: Bell,
                            title: "Broadcasts",
                            desc: "Global mission updates",
                            color: "text-role-primary",
                            bg: "bg-role-primary/10"
                        },
                        {
                            href: "/team/matches",
                            icon: Calendar,
                            title: "Schedule",
                            desc: "Next mission timeline",
                            color: "text-cyan-500",
                            bg: "bg-cyan-500/10"
                        },
                        {
                            href: "/team/score-card",
                            icon: ClipboardCheck,
                            title: "Telemetry",
                            desc: "Performance analytics",
                            color: "text-emerald-500",
                            bg: "bg-emerald-500/10"
                        },
                        {
                            href: "/team/profile",
                            icon: Terminal,
                            title: "Config",
                            desc: "Registry & Hardware",
                            color: "text-purple-500",
                            bg: "bg-purple-500/10"
                        }
                    ].map((item, idx) => (
                        <Link key={idx} href={item.href} className="group">
                            <div className="h-full p-8 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] hover:border-role-primary/30 transition-all shadow-lg hover:shadow-2xl hover:shadow-role-primary/5 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-50">{item.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Secondary Console Data */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-[1fr_400px] gap-8"
                >
                    <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[3rem] p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Trophy size={120} />
                        </div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-8">Base Directives</h3>
                        <div className="grid sm:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-role-primary/10 text-role-primary flex items-center justify-center shrink-0">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-xs tracking-tight mb-1">Pre-Mission Prep</p>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Ensure all hardware nodes are calibrated and power cells are at full capacity.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-xs tracking-tight mb-1">Timeline Compliance</p>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Report to the launch sector 15 minutes before scheduled trial start.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-xs tracking-tight mb-1">Unit Integrity</p>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">All crew members must hold active credentials during the operation.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-foreground uppercase text-xs tracking-tight mb-1">Victory Protocol</p>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Good luck, Commander. May your hardware outperform all expectations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-role-primary/20 to-role-secondary/10 backdrop-blur-xl border border-role-primary/20 rounded-[3rem] p-10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-role-primary animate-ping"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-role-primary">Live Operations</span>
                            </div>
                            <h4 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">Systems Status</h4>
                            <p className="text-xs text-muted-foreground font-medium mb-8">All competition clusters are currently reporting normal telemetry.</p>
                        </div>
                        <div className="space-y-4">
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
                </motion.div>
            </div>
        </div>
    );
}
