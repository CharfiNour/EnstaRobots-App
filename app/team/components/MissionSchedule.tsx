"use client";

import { Calendar, MapPin } from 'lucide-react';
import { TeamDashboardMatch } from '../types';

interface MissionScheduleProps {
    matches: TeamDashboardMatch[];
    robotName?: string;
}

export default function MissionSchedule({ matches, robotName }: MissionScheduleProps) {
    return (
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
                {matches.map((match, idx) => (
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
                                <p className="text-sm font-bold text-role-primary heading-font">{robotName || 'Your Node'}</p>
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
    );
}
