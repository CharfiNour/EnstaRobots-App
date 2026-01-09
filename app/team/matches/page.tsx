"use client";

import { motion } from 'framer-motion';
import {
    MatchesHeader,
    RobotModelView,
    PdfViewer,
    ScheduleCard
} from './components';
import { useMatchesPage } from './hooks/useMatchesPage';

export default function TeamMatchesPage() {
    const { teamData, compState, currentTeam, nextTeam, nextPhase, loading } = useMatchesPage();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-6">
            <div className="container mx-auto max-w-7xl">
                <MatchesHeader
                    competitionName={teamData?.competition?.replace(/_/g, ' ') || 'Competition'}
                    teamName={teamData?.name || 'My Unit'}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Robot & PDFs */}
                    <div className="lg:col-span-8 space-y-8">
                        <RobotModelView
                            imageUrl="/suiveur.jpg"
                            competitionName={teamData?.competition?.replace(/_/g, ' ') || "TRACK SCHEMATIC"}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <PdfViewer
                                title="Competition Rules (CDC)"
                                pdfUrl="/cdc-suiveur.pdf"
                            />
                            <PdfViewer
                                title="Scoring Criteria (Cotations)"
                                pdfUrl="/cotations-suiveur.pdf"
                            />
                        </div>
                    </div>

                    {/* Right Side: Schedule & Status */}
                    <div className="lg:col-span-4">
                        <ScheduleCard
                            startTime="14:30 SA"
                            isLive={compState?.isLive || false}
                            currentPhase={compState?.currentPhase || null}
                            teamOrder={teamData?.order || 1}
                            teamName={teamData?.name || 'Unit'}
                            myTeamId={teamData?.id}
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
