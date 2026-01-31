"use client";

import {
    RegistryAlert,
    MissionSchedule,
    DashboardHeader,
    RecentAnnouncements,
    StatSummary,
    IncompleteRegistryView
} from './components';
import { useTeamDashboard } from './hooks/useTeamDashboard';

export default function TeamDashboard() {
    const {
        session,
        loading,
        profileComplete,
        teamData,
        hasLiveTeam,
        activeTeam,
        currentTurn,
        myTurn,
        phase,
        competitionName,
        compState
    } = useTeamDashboard();

    if (loading) {
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
                    teamOrder={myTurn ?? null}
                    isLive={hasLiveTeam}
                    isMyTurn={currentTurn === myTurn}
                    isNext={!!(currentTurn && myTurn && currentTurn === myTurn - 1)}
                    profileComplete={profileComplete}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main: Schedule & Matches */}
                    <div className="lg:col-span-8 space-y-8">
                        <MissionSchedule
                            hasLiveTeam={hasLiveTeam}
                            activeTeam={activeTeam}
                            currentTurn={currentTurn}
                            myTurn={myTurn}
                            phase={phase}
                            competitionName={competitionName}
                            profileComplete={profileComplete}
                        />
                    </div>

                    {/* Sidebar: Useful Tools & News */}
                    <div className="lg:col-span-4 space-y-8">
                        <RecentAnnouncements
                            profileComplete={profileComplete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
