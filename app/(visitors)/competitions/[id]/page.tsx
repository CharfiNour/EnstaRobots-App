"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';
import { canonicalizeCompId, getCategoryMetadata } from '@/lib/constants';
import { useCompetitionDetail } from './hooks/useCompetitionDetail';
import { CompetitionHeader } from './components/CompetitionHeader';
import { fetchSingleTeamFromSupabase } from '@/lib/supabaseData';
import { TeamSidebar } from './components/TeamSidebar';
import { TeamDetail } from './components/TeamDetail';
import { Team } from '@/lib/teams';

export default function CompetitionDetailPage() {
    const params = useParams();
    const compId = params.id as string;
    const { teams, competitions, compState, loading } = useCompetitionDetail(compId);

    const resolvedCategory = canonicalizeCompId(compId, competitions);
    const metadata = getCategoryMetadata(resolvedCategory);

    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [fullTeamDetails, setFullTeamDetails] = useState<Record<string, Team>>({});
    const [activeTab, setActiveTab] = useState('teams');
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    // Initial selection
    useEffect(() => {
        if (teams.length > 0 && !selectedTeam) {
            setSelectedTeam(teams[0]);
        }
    }, [teams, selectedTeam]);

    // Lazy load full details for selected team
    useEffect(() => {
        if (selectedTeam && !fullTeamDetails[selectedTeam.id]) {
            // Check if it's already "full" enough (has members or photo)
            const isFull = (selectedTeam.members && selectedTeam.members.length > 0) || !!selectedTeam.photo;

            if (!isFull) {
                fetchSingleTeamFromSupabase(selectedTeam.id).then(full => {
                    if (full) {
                        setFullTeamDetails(prev => ({ ...prev, [full.id]: full }));
                    }
                });
            }
        }
    }, [selectedTeam, fullTeamDetails]);

    // Combined data for detail view
    const effectiveSelectedTeam = selectedTeam ? (fullTeamDetails[selectedTeam.id] || selectedTeam) : null;

    // Live session auto-selection
    const liveSession = compState.liveSessions[resolvedCategory];
    const isActuallyLive = !!liveSession;

    const handleLiveFocus = () => {
        const liveTeam = teams.find(t => t.id === liveSession?.teamId);
        if (liveTeam) {
            setSelectedTeam(liveTeam);
            setShowMobileDetail(true);
            setActiveTab('teams');
        }
    };

    const dbComp = competitions.find(c => c.type === resolvedCategory || c.id === compId);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <CompetitionHeader
                title={dbComp?.name || metadata?.name || 'Competition Intel'}
                category={resolvedCategory}
                arena={dbComp?.arena || 'Main Arena'}
                isActuallyLive={isActuallyLive}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLiveClick={handleLiveFocus}
            />

            <div className="container mx-auto px-4 py-8 flex-1 max-w-7xl">
                {activeTab === 'teams' ? (
                    <div className="grid lg:grid-cols-[350px_1fr] gap-12">
                        {/* Sidebar */}
                        <div className={`${showMobileDetail ? 'hidden' : 'block'} lg:block`}>
                            <TeamSidebar
                                teams={teams}
                                selectedTeamId={selectedTeam?.id}
                                onSelect={(t) => {
                                    setSelectedTeam(t);
                                    setShowMobileDetail(true);
                                }}
                                loading={loading}
                                category={resolvedCategory}
                                liveTeamId={liveSession?.teamId}
                            />
                        </div>

                        {/* Detail View */}
                        <div className={`${showMobileDetail ? 'flex' : 'hidden lg:flex'} justify-center items-start lg:sticky lg:top-8`}>
                            <TeamDetail
                                team={effectiveSelectedTeam}
                                currentCategory={resolvedCategory}
                                isActuallyLive={isActuallyLive && liveSession?.teamId === selectedTeam?.id}
                                liveScore={liveSession?.scoreSummary}
                                onBack={() => setShowMobileDetail(false)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ScoreHistoryView
                            lockedCompetitionId={resolvedCategory}
                            showFilter={true}
                            isSentToTeamOnly={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
