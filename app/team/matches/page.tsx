"use client";

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import {
    MatchesHeader,
    RobotModelView,
    RulesDriveLink,
    ScheduleCard
} from './components';
import { RegistryAlert, RestrictionScreen } from '../components';
import { useMatchesPage } from './hooks/useMatchesPage';
import { PHASES_LINE_FOLLOWER, PHASES_DEFAULT } from '@/app/jury/score/services/scoreConstants';
import { getCompetitionName } from '@/lib/constants';
import { Competition } from '@/lib/teams';

export default function TeamMatchesPage() {
    const { teamData, compState, currentTeam, nextTeam, nextPhase, loading, currentPhase, isLive, competitions } = useMatchesPage();

    // Event Day Restriction
    if (!compState?.eventDayStarted) {
        return <RestrictionScreen />;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Access Restricted for Incomplete Profiles
    if (teamData?.isPlaceholder) {
        return (
            <div className="min-h-screen py-12 px-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-amber-500/20">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Shield className="w-12 h-12 text-amber-500" />
                        </motion.div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight mb-3">Tactical Intel Locked</h1>
                        <p className="text-muted-foreground font-medium">Your unit remains unverified. Complete the registry to gain access to tactical maps, competition rules, and technical specifications.</p>
                    </div>
                    <RegistryAlert />
                </div>
            </div>
        );
    }



    // Get the actual competition category by looking up the UUID in the competitions array
    const foundCompetition = competitions.find((c: Competition) => c.id === teamData?.competition);
    const competitionCategory = foundCompetition?.type || teamData?.competition;

    // Determine if this is an All Terrain competition
    const isAllTerrain = competitionCategory === 'all_terrain' || competitionCategory === 'junior_all_terrain';
    const isJunior = competitionCategory?.toLowerCase().includes('junior');

    return (
        <div className="min-h-screen py-10 px-6">
            <div className="container mx-auto max-w-7xl">
                <MatchesHeader
                    competitionName={getCompetitionName(teamData?.competition, competitions)}
                    teamName={teamData?.name || 'My Unit'}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Robot & PDFs */}
                    <div className="lg:col-span-8 space-y-7">
                        <RobotModelView
                            imageUrl={
                                competitionCategory === 'all_terrain'
                                    ? '/maquette-all-terrain.png'
                                    : competitionCategory === 'junior_all_terrain'
                                        ? '/maquette-all-terrain-junior.png'
                                        : isJunior
                                            ? '/maquette-junior.jpg'
                                            : '/suiveur.jpg'
                            }
                            competitionName={getCompetitionName(teamData?.competition, competitions)}
                            maquetteUrl={
                                competitionCategory === 'all_terrain'
                                    ? '/maquette-all-terrain.png'
                                    : competitionCategory === 'junior_all_terrain'
                                        ? '/maquette-all-terrain-junior.png'
                                        : isJunior
                                            ? '/maquette-junior.jpg'
                                            : undefined
                            }
                        />

                        {/* Rules & Documentation Links */}
                        <div className="space-y-4">
                            {(competitionCategory === 'all_terrain' || competitionCategory === 'junior_all_terrain') ? (
                                <RulesDriveLink
                                    title="All Terrain Rulebook"
                                    subtitle="GDrive • CDC & Technical Specs"
                                    driveUrl={
                                        competitionCategory === 'junior_all_terrain'
                                            ? "https://drive.google.com/drive/folders/1lMq411aTLxZ7BJIF_ErMK5ygCmbCenVb"
                                            : "https://drive.google.com/drive/folders/15KO68D6kaZCwDp2e1ywioh1kjMtxPGPq"
                                    }
                                />
                            ) : (
                                <RulesDriveLink
                                    title={isJunior ? "Junior Line Follower Rules" : "Line Follower Rules"}
                                    subtitle="GDrive • CDC & Dimensions"
                                    driveUrl={
                                        isJunior
                                            ? "https://drive.google.com/drive/folders/1buS6wBt85HhBNgbnICoIHoXcRBhu6Jwk"
                                            : "https://drive.google.com/drive/folders/1yl9sEc_g3QfWf3xIFD2FQFs7tu2elRjr"
                                    }
                                />
                            )}
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
                            teamOrder={teamData?.order}
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
