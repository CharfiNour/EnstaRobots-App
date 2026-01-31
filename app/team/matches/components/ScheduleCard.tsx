"use client";

import { motion } from 'framer-motion';
import { Calendar, Clock, Hash, Users, Zap, ChevronDown, Target, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Competition } from '@/lib/teams';
import CustomSelector from '@/components/common/CustomSelector';

interface ClubTeamWithTurn {
    id: string;
    name: string;
    robotName?: string;
    logo?: string;
    club: string;
    university?: string;
    myTurn: number;
    currentTurn: number | null;
    isLive: boolean;
    currentPhase?: string | null;
}

interface ScheduleCardProps {
    availableCompetitions: Competition[];
    selectedCompId: string | null;
    onCompChange: (id: string) => void;
    clubTeams: ClubTeamWithTurn[];
    isLive: boolean; // General live status for selected comp
}

export default function ScheduleCard({
    availableCompetitions,
    selectedCompId,
    onCompChange,
    clubTeams,
    isLive
}: ScheduleCardProps) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setPulse(p => !p), 800);
        return () => clearInterval(interval);
    }, []);

    const selectedComp = availableCompetitions.find(c => c.id === selectedCompId || c.type === selectedCompId);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-6"
        >
            {/* Competition Selector (Replaces System Status) */}
            <div className={`p-5 rounded-[2rem] border transition-all duration-500 bg-card/40 border-card-border shadow-2xl relative z-30`}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-role-primary/10 text-role-primary shadow-sm border border-role-primary/20`}>
                            <Target size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Directive</p>
                            <h4 className="text-xs font-black text-foreground uppercase italic leading-tight">Operational Theatre</h4>
                        </div>
                    </div>

                    <div className="relative group">
                        <CustomSelector
                            variant="block"
                            fullWidth
                            options={availableCompetitions.map(comp => ({
                                value: comp.id,
                                label: comp.name?.toUpperCase() || ''
                            }))}
                            value={selectedCompId}
                            onChange={onCompChange}
                        />
                    </div>
                </div>
            </div>

            {/* Club Units Turn List (Replaces Temporal Coordinates) */}
            <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Clock size={120} className="rotate-12" />
                </div>

                <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-role-primary" />
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Temporal Coordinates</h3>
                        </div>
                        {selectedComp?.current_phase && (
                            <span className="text-[10px] font-black uppercase text-role-primary tracking-widest bg-role-primary/10 px-3 py-1 rounded-full border border-role-primary/20">
                                {selectedComp.current_phase.replace('_', ' ')}
                            </span>
                        )}
                    </div>

                    <div className="h-px bg-card-border" />

                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                        {clubTeams.length > 0 ? (
                            clubTeams.map(team => (
                                <div
                                    key={team.id}
                                    className={`p-4 rounded-2xl border transition-all duration-300 ${team.isLive ? 'bg-role-primary/10 border-role-primary/40 shadow-lg' : 'bg-muted/10 border-card-border hover:bg-muted/20'}`}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-background border border-card-border flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    {team.logo ? (
                                                        <img src={team.logo} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users size={16} className="text-muted-foreground/40" />
                                                    )}
                                                    {team.isLive && (
                                                        <div className="absolute inset-0 bg-role-primary/20 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className={`text-xs font-black uppercase italic truncate ${team.isLive ? 'text-role-primary' : 'text-foreground'}`}>
                                                        {team.robotName || team.name}
                                                    </h5>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Unit #{team.myTurn}</p>
                                                </div>
                                            </div>
                                            {team.isLive && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-background/40 rounded-xl p-3 border border-card-border">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Current Turn</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <Hash size={12} className="text-role-primary opacity-50" />
                                                    <span className="text-xl font-black text-foreground tracking-tighter italic">{team.currentTurn || '--'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-background/40 rounded-xl p-3 border border-role-primary/10">
                                                <p className="text-[8px] font-black text-role-primary uppercase tracking-widest mb-1.5">My Turn</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <Hash size={12} className="text-role-primary opacity-50" />
                                                    <span className="text-xl font-black text-foreground tracking-tighter italic">{team.myTurn || '--'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center opacity-20">
                                <Activity size={40} className="mx-auto mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Tactical Data Assigned</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
