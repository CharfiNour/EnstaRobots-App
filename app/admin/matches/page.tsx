"use client";

import { motion } from 'framer-motion';
import {
    MatchesHeader,
    RobotModelView,
    PdfViewer,
    ScheduleCard
} from '../../team/matches/components';
import { useAdminMatches } from './hooks/useAdminMatches';
import { LayoutDashboard, Radio, ChevronRight, Settings } from 'lucide-react';

export default function AdminMatchesPage() {
    const {
        teams,
        selectedTeam,
        selectedTeamId,
        setSelectedTeamId,
        compState,
        currentTeam,
        nextTeam,
        nextPhase,
        loading,
        toggleLive
    } = useAdminMatches();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex">
                {/* Admin Sidebar Navigation */}
                <div className="w-80 h-screen sticky top-0 bg-card border-r border-card-border p-6 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 rounded-xl bg-role-primary flex items-center justify-center shadow-lg shadow-role-primary/30">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-foreground">C-Link Admin</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-2">Global Operations</p>
                            <button
                                onClick={toggleLive}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${compState?.isLive ? 'bg-role-primary border-role-primary shadow-lg shadow-role-primary/20' : 'bg-muted/50 border-card-border hover:bg-muted'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Radio className={`w-5 h-5 ${compState?.isLive ? 'animate-pulse text-white' : 'text-muted-foreground'}`} />
                                    <span className={`font-black uppercase text-xs tracking-widest ${compState?.isLive ? 'text-white' : 'text-foreground'}`}>{compState?.isLive ? 'Live Active' : 'Go Live'}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${compState?.isLive ? 'bg-white' : 'bg-muted-foreground/20'}`} />
                            </button>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 px-2">Competition Roster</p>
                            <div className="space-y-2">
                                {teams.map((team, idx) => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeamId(team.id)}
                                        className={`w-full p-3 px-4 rounded-xl border transition-all flex items-center justify-between group ${selectedTeam?.id === team.id ? 'bg-role-primary/10 border-role-primary/30' : 'bg-transparent border-transparent hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black text-role-primary shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-tight truncate ${selectedTeam?.id === team.id ? 'text-role-primary' : 'text-foreground'}`}>{team.name}</span>
                                        </div>
                                        <ChevronRight size={14} className={`transition-transform ${selectedTeam?.id === team.id ? 'translate-x-0 opacity-100 text-role-primary' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-40 text-muted-foreground'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Control View */}
                <div className="flex-1 p-10 px-12">
                    <div className="container mx-auto">
                        <MatchesHeader
                            competitionName={selectedTeam?.competition?.replace(/_/g, ' ') || 'Competition'}
                            teamName={selectedTeam?.name || 'Monitoring...'}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            {/* Left Side: Robot & PDFs */}
                            <div className="xl:col-span-8 space-y-10">
                                <RobotModelView
                                    imageUrl="/suiveur.jpg"
                                    competitionName={selectedTeam?.competition?.replace(/_/g, ' ') || "TRACK SCHEMATIC"}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <PdfViewer
                                        title="CDC Specification"
                                        pdfUrl="/cdc-suiveur.pdf"
                                    />
                                    <PdfViewer
                                        title="Cotations Logic"
                                        pdfUrl="/cotations-suiveur.pdf"
                                    />
                                </div>
                            </div>

                            {/* Right Side: Schedule & Admin HUD */}
                            <div className="xl:col-span-4 space-y-8">
                                <ScheduleCard
                                    startTime="14:30 SA"
                                    isLive={compState?.isLive || false}
                                    currentPhase={compState?.currentPhase || null}
                                    teamOrder={selectedTeamId ? teams.findIndex(t => t.id === selectedTeamId) + 1 : 1}
                                    teamName={selectedTeam?.name || 'Unit'}
                                    currentTeam={currentTeam}
                                    nextTeam={nextTeam}
                                    nextPhase={nextPhase}
                                />

                                <div className="p-8 bg-card border border-card-border rounded-[2.5rem] shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Settings className="w-5 h-5 text-role-primary" />
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Global Overrides</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <button className="w-full py-3 bg-muted border border-card-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 transition-all opacity-50 cursor-not-allowed text-foreground">Reset Competition State</button>
                                        <button className="w-full py-3 bg-muted border border-card-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 transition-all opacity-50 cursor-not-allowed text-foreground">Force Refresh All Terminals</button>
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
