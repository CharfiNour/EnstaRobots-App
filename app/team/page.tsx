"use client";

import { Calendar, Shield } from 'lucide-react';
import {
    RegistryAlert,
    MissionSchedule,
    SystemsStatus,
    DashboardHeader,
    DirectivesList
} from './components';
import { useTeamDashboard } from './hooks/useTeamDashboard';

export default function TeamDashboard() {
    const { session, loading, profileComplete, teamData, data } = useTeamDashboard();

    if (loading || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6">
            <div className="container mx-auto px-4 max-w-6xl">
                <DashboardHeader teamData={teamData} session={session} />

                {!profileComplete && <RegistryAlert />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <MissionSchedule matches={data.matches} robotName={teamData?.robotName} />

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

                    <div className="space-y-6">
                        <SystemsStatus
                            syncPercentage={data.systemStatus.syncPercentage}
                            statusText={data.systemStatus.statusText}
                        />

                        <DirectivesList directives={data.directives} />
                    </div>
                </div>
            </div>
        </div>
    );
}
