"use client";

import { motion } from 'framer-motion';
import {
    MatchesHeader,
    RobotModelView,
    PdfViewer,
    ScheduleCard
} from '../../team/matches/components';
import { useAdminMatches } from './hooks/useAdminMatches';
import { Radio } from 'lucide-react';

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
        <div className="min-h-screen bg-background text-foreground py-10 md:py-16">
            <div className="container mx-auto px-6 max-w-6xl">
                {/* Unified Header */}
                <div className="flex flex-col gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 italic uppercase text-foreground">
                            <Radio className="w-8 h-8 text-accent animate-pulse" />
                            Live Ops Console
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-60 mt-2 italic">
                            Real-time tournament orchestration and match monitoring authority
                        </p>
                    </div>
                </div>

                {/* Main Content View */}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
