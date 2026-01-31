"use client";

import { motion, AnimatePresence } from 'framer-motion';
import {
    MatchesHeader,
    RobotModelView,
    RulesDriveLink,
    ScheduleCard
} from './components';
import { RestrictionScreen, IncompleteRegistryView } from '../components';
import { useMatchesPage } from './hooks/useMatchesPage';
import { useProfileStatus } from '../hooks/useProfileStatus';

export default function TeamMatchesPage() {
    const { profileComplete, loading: statusLoading } = useProfileStatus();
    const {
        clubTeams,
        availableCompetitions,
        selectedCompId,
        setSelectedCompId,
        compState,
        loading,
        selectedComp,
        isCompetitionLive
    } = useMatchesPage();

    if (statusLoading) return null;

    if (!profileComplete) {
        return (
            <div className="min-h-screen py-10 px-6 container mx-auto max-w-7xl">
                <IncompleteRegistryView />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-6">
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-[60vh] flex items-center justify-center"
                    >
                        <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="container mx-auto max-w-7xl w-full"
                    >
                        <div className="w-full space-y-10">
                            <MatchesHeader
                                competitionName={selectedComp?.name || "Select Competition"}
                                teamName={clubTeams[0]?.club || 'Club Dashboard'}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
                                {/* Left Side: Robot & PDFs */}
                                <div className="lg:col-span-8 space-y-7">
                                    <RobotModelView
                                        imageUrl={
                                            (selectedComp?.type || selectedCompId) === 'all_terrain'
                                                ? '/maquette-all-terrain.png'
                                                : (selectedComp?.type || selectedCompId) === 'junior_all_terrain'
                                                    ? '/maquette-all-terrain-junior.png'
                                                    : (selectedComp?.name?.toLowerCase().includes('junior') || (selectedComp?.type || selectedCompId)?.toLowerCase().includes('junior'))
                                                        ? '/maquette-junior.jpg'
                                                        : '/suiveur.jpg'
                                        }
                                        competitionName={selectedComp?.name || "Select Competition"}
                                        maquetteUrl={
                                            (selectedComp?.type || selectedCompId) === 'all_terrain'
                                                ? '/maquette-all-terrain.png'
                                                : (selectedComp?.type || selectedCompId) === 'junior_all_terrain'
                                                    ? '/maquette-all-terrain-junior.png'
                                                    : (selectedComp?.name?.toLowerCase().includes('junior') || (selectedComp?.type || selectedCompId)?.toLowerCase().includes('junior'))
                                                        ? '/maquette-junior.jpg'
                                                        : undefined
                                        }
                                    />

                                    {/* Rules & Documentation Links */}
                                    <div className="space-y-4">
                                        {(selectedComp?.type || selectedCompId) === 'all_terrain' || (selectedComp?.type || selectedCompId) === 'junior_all_terrain' ? (
                                            <RulesDriveLink
                                                title="All Terrain Rulebook"
                                                subtitle="GDrive • CDC & Technical Specs"
                                                driveUrl={
                                                    (selectedComp?.type || selectedCompId) === 'junior_all_terrain'
                                                        ? "https://drive.google.com/drive/folders/1lMq411aTLxZ7BJIF_ErMK5ygCmbCenVb"
                                                        : "https://drive.google.com/drive/folders/15KO68D6kaZCwDp2e1ywioh1kjMtxPGPq"
                                                }
                                            />
                                        ) : (
                                            <RulesDriveLink
                                                title={(selectedComp?.name?.toLowerCase().includes('junior') || (selectedComp?.type || selectedCompId)?.toLowerCase().includes('junior')) ? "Junior Line Follower Rules" : "Line Follower Rules"}
                                                subtitle="GDrive • CDC & Dimensions"
                                                driveUrl={
                                                    (selectedComp?.name?.toLowerCase().includes('junior') || (selectedComp?.type || selectedCompId)?.toLowerCase().includes('junior'))
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
                                        availableCompetitions={availableCompetitions}
                                        selectedCompId={selectedCompId}
                                        onCompChange={setSelectedCompId}
                                        clubTeams={clubTeams}
                                        isLive={isCompetitionLive}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
