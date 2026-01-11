"use client";

import { Shield } from 'lucide-react';
import {
    RegistryAlert,
    MissionSchedule,
    DashboardHeader,
    RecentAnnouncements,
    StatSummary
} from './components';
import { useTeamDashboard } from './hooks/useTeamDashboard';

export default function TeamDashboard() {
    const {
        session,
        loading,
        profileComplete,
        teamData,
        data,
        isLive,
        currentTeam,
        nextTeam,
        currentPhase
    } = useTeamDashboard();

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

                <StatSummary
                    teamOrder={teamData?.order}
                    isLive={isLive}
                    isMyTurn={currentTeam?.id === teamData?.id}
                    isNext={nextTeam?.id === teamData?.id}
                    profileComplete={profileComplete}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main: Schedule & Matches */}
                    <div className="lg:col-span-8 space-y-8">
                        <MissionSchedule
                            isLive={isLive}
                            currentTeam={currentTeam}
                            nextTeam={nextTeam}
                            currentPhase={currentPhase}
                            myTeamId={teamData?.id}
                        />
                    </div>

                    {/* Sidebar: Useful Tools & News */}
                    <div className="lg:col-span-4 space-y-8">
                        <RecentAnnouncements />
                    </div>
                </div>
            </div>
        </div>
    );
}
