"use client";

import { Calendar, Activity, Zap } from 'lucide-react';
import { TeamDashboardMatch } from '../types';

interface MissionScheduleProps {
    isLive: boolean;
    currentTeam: any;
    nextTeam: any;
    currentPhase: string | null;
    myTeamId?: string;
}

export default function MissionSchedule({ isLive, currentTeam, nextTeam, currentPhase, myTeamId }: MissionScheduleProps) {
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
                            {isLive ? (currentPhase?.replace(/_/g, ' ') || 'Live Operations') : 'Awaiting operational window'}
                        </p>
                    </div>
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-role-primary/10 border border-role-primary/20 rounded-xl">
                        <div className="w-2 h-2 bg-role-primary rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-role-primary tracking-widest">Live Feed active</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* Current Unit slot */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${isLive ? (isMyTurn ? 'bg-role-primary/10 border-role-primary/40 shadow-xl' : 'bg-muted/30 border-card-border') : 'bg-muted/10 border-card-border/50 opacity-50'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={14} className={isLive ? 'text-role-primary' : 'text-muted-foreground'} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Active</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic ${isLive ? 'bg-background text-foreground' : 'bg-card/50 text-muted-foreground'}`}>
                            {currentTeam?.order || '--'}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-lg font-black uppercase italic truncate ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isLive ? (currentTeam?.robotName || currentTeam?.name || 'In Progress') : 'Standby'}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                {isLive ? (currentTeam?.club || 'Arena Node') : 'Scanning for signal...'}
                            </p>
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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic ${isLive ? 'bg-background text-foreground' : 'bg-card/50 text-muted-foreground'}`}>
                            {nextTeam?.order || '--'}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-lg font-black uppercase italic truncate ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isLive ? (nextTeam?.robotName || nextTeam?.name || 'Awaiting') : 'Queued'}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                {isLive ? (nextTeam?.club || 'Standby Node') : 'Timeline locked'}
                            </p>
                        </div>
                    </div>
                    {isNext && <div className="mt-4 py-2 bg-role-secondary text-white text-center rounded-xl text-[10px] font-black uppercase tracking-widest">Report to Arena Soon</div>}
                </div>
            </div>

            {!isLive && (
                <div className="mt-8 p-4 bg-muted/20 border border-dashed border-card-border rounded-2xl text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        System signal low. Competition has not been initialized by HQ.
                    </p>
                </div>
            )}
        </div>
    );
}
