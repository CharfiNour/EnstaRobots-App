"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, MapPin, Users, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

// Local imports
import { getAdminCompetitions } from '../../admin/competitions/services/competitionService';
import { getCompetitionState } from '@/lib/competitionState';
import { getTeams, Team } from '@/lib/teams';
import { CompetitionListItem } from '../../admin/competitions/types';
import { PHASES_LINE_FOLLOWER, PHASES_DEFAULT } from '@/app/judge/score/services/scoreConstants';

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
    const [compState, setCompState] = useState(getCompetitionState());
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleStateUpdate = () => {
            const state = getCompetitionState();
            setCompState(state);

            // Sync competitions list as well
            setCompetitions(getAdminCompetitions());

            if (state.isLive && state.activeTeamId) {
                const teams = getTeams();
                const team = teams.find(t => t.id === state.activeTeamId);
                setActiveTeam(team || null);
            } else {
                setActiveTeam(null);
            }
        };

        handleStateUpdate();

        // Listen for internal events (same tab)
        window.addEventListener('competition-state-updated', handleStateUpdate);
        window.addEventListener('competitions-updated', handleStateUpdate);

        // Listen for storage events (different tabs)
        window.addEventListener('storage', (e) => {
            if (
                e.key === 'enstarobots_competition_state_v1' ||
                e.key === 'enstarobots_teams_v1' ||
                e.key === 'enstarobots_competitions_v1'
            ) {
                handleStateUpdate();
            }
        });

        // Periodic check as a fallback
        const interval = setInterval(handleStateUpdate, 2000);

        return () => {
            window.removeEventListener('competition-state-updated', handleStateUpdate);
            window.removeEventListener('competitions-updated', handleStateUpdate);
            window.removeEventListener('storage', handleStateUpdate);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header (Console Style) */}
                <div className="mb-12">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                        <LayoutDashboard className="w-8 h-8 text-accent" />
                        Tournament Events
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2">
                        Real-time arena feed and competition schedules
                    </p>
                </div>

                {/* Competition Cards */}
                <div className="space-y-6">
                    {competitions.map((comp: CompetitionListItem, index: number) => {
                        // Live logic
                        const isActuallyLive = compState.isLive && compState.activeCompetitionId === comp.category;

                        const getLivePhaseLabel = () => {
                            if (!compState.currentPhase) return comp.status;
                            const allPhases = [...PHASES_LINE_FOLLOWER, ...PHASES_DEFAULT];
                            const match = allPhases.find(p => p.value === compState.currentPhase);
                            if (match) return match.label;
                            return compState.currentPhase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        };

                        const displayPhase = isActuallyLive ? getLivePhaseLabel() : comp.status;

                        return (
                            <Link href={`/competitions/${comp.id}`} key={comp.id} className="block group">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.01 }}
                                    className={`p-6 md:p-8 rounded-[2rem] border backdrop-blur-sm transition-all bg-gradient-to-br ${comp.color} ${comp.borderColor} shadow-xl relative overflow-hidden`}
                                >
                                    {/* Header */}
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                                                    {comp.title}
                                                </h2>

                                                {mounted && isActuallyLive && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                                        </span>
                                                        <span className="text-red-400 font-semibold text-[10px] uppercase tracking-wider">Live</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed font-medium opacity-60 max-w-2xl">
                                                {comp.description}
                                            </p>
                                        </div>

                                        <div className="shrink-0">
                                            <div className="px-6 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                                                <span className="font-black text-foreground uppercase text-[11px] tracking-[0.1em] relative z-10">
                                                    {mounted ? displayPhase : comp.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        <StatItem icon={Users} label="Teams" value={comp.totalTeams.toString()} />
                                        <StatItem icon={Trophy} label="Matches" value={comp.totalMatches.toString()} />
                                        <StatItem icon={MapPin} label="Arena" value={comp.arena} />
                                        <StatItem icon={Calendar} label="Schedule" value={comp.schedule} />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-card-border/50">
            <Icon className="w-5 h-5 text-accent/60" />
            <div className="min-w-0 flex-1">
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{label}</div>
                <div className="font-bold text-foreground truncate text-sm">{value}</div>
            </div>
        </div>
    );
}
