"use client";

import { Calendar, Activity, Shield, Hash, Target } from 'lucide-react';

interface MissionScheduleProps {
    hasLiveTeam: boolean;
    activeTeam?: any; // The club team currently in/queued for a live comp
    currentTurn?: number | null;
    myTurn?: number;
    phase?: string | null;
    competitionName?: string;
    profileComplete?: boolean;
}

export default function MissionSchedule({
    hasLiveTeam,
    activeTeam,
    currentTurn,
    myTurn,
    phase,
    competitionName,
    profileComplete = true
}: MissionScheduleProps) {

    return (
        <div className="p-8 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-96 h-96 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${hasLiveTeam ? 'bg-role-primary/20' : 'bg-muted/10'}`}></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${hasLiveTeam ? 'bg-role-primary shadow-lg shadow-role-primary/30 text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Live Competitions</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                            {!profileComplete ? 'System Access Restricted' : (hasLiveTeam ? (phase?.replace(/_/g, ' ') || 'Live Operations') : 'Awaiting operational window')}
                        </p>
                    </div>
                </div>
                {hasLiveTeam && profileComplete && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-role-primary/10 border border-role-primary/20 rounded-xl">
                        <div className="w-2 h-2 bg-role-primary rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-role-primary tracking-widest">Active Theatre</span>
                    </div>
                )}
            </div>

            <div className={`space-y-6 relative z-10 ${!profileComplete ? 'blur-md pointer-events-none select-none opacity-40' : ''}`}>
                {hasLiveTeam ? (
                    <div className="p-6 rounded-3xl border border-role-primary/20 bg-role-primary/5 space-y-6 transition-all duration-500">
                        {/* Summary Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-role-primary" />
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{competitionName}</h3>
                            </div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground bg-card px-3 py-1 rounded-lg border border-card-border">
                                {activeTeam?.robotName || activeTeam?.name}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Current Turn */}
                            <div className="p-6 bg-card/60 rounded-2xl border border-card-border shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity size={14} className="text-role-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Turn</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <Hash size={24} className="text-role-primary/40" />
                                    <span className="text-5xl font-black text-foreground tracking-tighter italic">
                                        {currentTurn || '--'}
                                    </span>
                                </div>
                            </div>

                            {/* My Turn */}
                            <div className="p-6 bg-card/60 rounded-2xl border border-role-primary/30 shadow-sm relative overflow-hidden group/turn">
                                <div className="absolute inset-0 bg-role-primary/[0.02] group-hover/turn:bg-role-primary/[0.05] transition-colors" />
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield size={14} className="text-role-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-role-primary">Team Turn</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <Hash size={24} className="text-role-primary/40" />
                                        <span className="text-5xl font-black text-foreground tracking-tighter italic">
                                            {myTurn || '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {currentTurn === myTurn && (
                            <div className="py-2.5 bg-role-primary text-white text-center rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-role-primary/20 animate-pulse">
                                PROCEED TO ARENA • YOUR MISSION IS LIVE
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-10 text-center bg-muted/5 border border-dashed border-card-border rounded-3xl opacity-40">
                        <Activity size={40} className="mx-auto mb-4 text-muted-foreground" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Queuing operational data...</p>
                    </div>
                )}
            </div>

            {!profileComplete && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-card/20 group-hover:bg-card/30 transition-colors">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
                            <Shield size={24} />
                        </div>
                        <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Security Lock Active</h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                            Awaiting unit verification. Complete registry to unlock operational timeline.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
