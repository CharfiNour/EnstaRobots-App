"use client";

import { motion } from 'framer-motion';
import {
    MatchesHeader,
    RobotModelView,
    PdfViewer,
    ScheduleCard
} from './components';
import { useMatchesPage } from './hooks/useMatchesPage';
import { PHASES_LINE_FOLLOWER, PHASES_DEFAULT } from '@/app/jury/score/services/scoreConstants';
import { getCompetitionName } from '@/lib/constants';

export default function TeamMatchesPage() {
    const { teamData, compState, currentTeam, nextTeam, nextPhase, loading, currentPhase, isLive, competitions } = useMatchesPage();

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
                    competitionName={getCompetitionName(teamData?.competition, competitions)}
                    teamName={teamData?.name || 'My Unit'}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Robot & PDFs */}
                    <div className="lg:col-span-8 space-y-8">
                        <RobotModelView
                            imageUrl={teamData?.competition?.toLowerCase().includes('junior') ? '/maquette-junior.jpg' : '/suiveur.jpg'}
                            competitionName={getCompetitionName(teamData?.competition, competitions)}
                            maquetteUrl={teamData?.competition?.toLowerCase().includes('junior') ? '/maquette-junior.jpg' : undefined}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <PdfViewer
                                title="Competition Rules (CDC)"
                                pdfUrl={teamData?.competition?.toLowerCase().includes('junior') ? '/cdc-suiveur-junior.pdf' : '/cdc-suiveur.pdf'}
                            />
                            <PdfViewer
                                title="Scoring Criteria (Cotations)"
                                pdfUrl={teamData?.competition?.toLowerCase().includes('junior') ? '/cotations-junior.pdf' : '/cotations-suiveur.pdf'}
                            />
                        </div>
                    </div>

                    {/* Right Side: Schedule & Status */}
                    <div className="lg:col-span-4">
                        <ScheduleCard
                            startTime="14:30 SA"
                            isLive={isLive}
                            currentPhase={(() => {
                                if (!currentPhase) return null;
                                const allPhases = [...PHASES_LINE_FOLLOWER, ...PHASES_DEFAULT];
                                return allPhases.find(p => p.value === currentPhase)?.label || currentPhase;
                            })()}
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
