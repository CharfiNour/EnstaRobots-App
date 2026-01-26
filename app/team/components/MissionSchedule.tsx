"use client";

import { Calendar, Activity, Zap, Shield } from 'lucide-react';
// Unused import removed

interface MissionScheduleProps {
    isLive: boolean;
    currentTeam: any;
    nextTeam: any;
    currentPhase: string | null;
    myTeamId?: string;
    profileComplete?: boolean;
}

export default function MissionSchedule({ isLive, currentTeam, nextTeam, currentPhase, myTeamId, profileComplete = true }: MissionScheduleProps) {
    const isMyTurn = currentTeam?.id === myTeamId;
    const isNext = nextTeam?.id === myTeamId;

    return (
        <div className="p-8 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-96 h-96 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none transition-colors duration-1000 ${isLive ? 'bg-role-primary/20' : 'bg-muted/10'}`}></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isLive ? 'bg-role-primary shadow-lg shadow-role-primary/30 text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Mission Timeline</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                            {!profileComplete ? 'System Access Restricted' : (isLive ? (currentPhase?.replace(/_/g, ' ') || 'Live Operations') : 'Awaiting operational window')}
                        </p>
                    </div>
                </div>
                {isLive && profileComplete && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-role-primary/10 border border-role-primary/20 rounded-xl">
                        <div className="w-2 h-2 bg-role-primary rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-role-primary tracking-widest">Live Feed active</span>
                    </div>
                )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 ${!profileComplete ? 'blur-md pointer-events-none select-none opacity-40' : ''}`}>
                {/* Current Unit slot */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${isLive ? (isMyTurn ? 'bg-role-primary/10 border-role-primary/40 shadow-xl' : 'bg-muted/30 border-card-border') : 'bg-muted/10 border-card-border/50 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={14} className={isLive ? 'text-role-primary' : 'text-muted-foreground'} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Active</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Logo Slot */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl italic overflow-hidden relative border border-white/10 ${isLive ? 'bg-background text-foreground' : 'bg-card/50 text-muted-foreground'}`}>
                            {isLive && currentTeam?.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={currentTeam.logo} alt={currentTeam.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{currentTeam?.order || '--'}</span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className={`text-lg font-black uppercase italic truncate ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isLive ? (currentTeam?.robotName || currentTeam?.name || 'In Progress') : 'Standby'}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">
                                    {isLive ? (currentTeam?.club || 'Club Unknown') : 'Scanning...'}
                                </p>
                                {isLive && currentTeam?.university && (
                                    <>
                                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                            {currentTeam.university}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {isMyTurn && <div className="mt-4 py-2 bg-role-primary text-white text-center rounded-xl text-[10px] font-black uppercase tracking-widest">Your Mission is Live</div>}
                </div>

                {/* Next Unit slot */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${isLive ? (isNext ? 'bg-role-secondary/10 border-role-secondary/40' : 'bg-muted/30 border-card-border') : 'bg-muted/10 border-card-border/50 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={14} className={isLive ? 'text-role-secondary' : 'text-muted-foreground'} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Up Next</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Logo Slot */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl italic overflow-hidden relative border border-white/10 ${isLive ? 'bg-background text-foreground' : 'bg-card/50 text-muted-foreground'}`}>
                            {isLive && nextTeam?.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={nextTeam.logo} alt={nextTeam.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{nextTeam?.order || '--'}</span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className={`text-lg font-black uppercase italic truncate ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isLive ? (nextTeam?.robotName || nextTeam?.name || 'Awaiting') : 'Queued'}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">
                                    {isLive ? (nextTeam?.club || 'Club Unknown') : 'Timeline Locked'}
                                </p>
                                {isLive && nextTeam?.university && (
                                    <>
                                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                            {nextTeam.university}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {isNext && <div className="mt-4 py-2 bg-role-secondary text-white text-center rounded-xl text-[10px] font-black uppercase tracking-widest">Report to Arena Soon</div>}
                </div>
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

            {profileComplete && !isLive && (
                <div className="mt-8 p-4 bg-muted/20 border border-dashed border-card-border rounded-2xl text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        System signal low. Competition has not been initialized by HQ.
                    </p>
                </div>
            )}
        </div>
    );
}
