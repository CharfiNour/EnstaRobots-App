"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, ChevronRight, History
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getOfflineScores } from '@/lib/offlineScores';
import ScoreCard from '@/components/judge/ScoreCard';

export default function TeamScoreHistoryPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);
        loadScores(currentSession.userId);
    }, [router]);

    const loadScores = (teamId: string) => {
        // Show all scores sent to teams (removed teamId filter for testing)
        const offlineScores = getOfflineScores().filter(s => s.isSentToTeam);

        // Group by Team ID only (same logic as judge history)
        const groups: Record<string, any> = {};
        offlineScores.forEach(score => {
            const key = score.teamId;
            if (!groups[key]) {
                groups[key] = {
                    teamId: score.teamId,
                    competitionType: score.competitionType,
                    submissions: [],
                    latestTimestamp: 0
                };
            }
            groups[key].submissions.push(score);
            if (score.timestamp > groups[key].latestTimestamp) {
                groups[key].latestTimestamp = score.timestamp;
            }
        });

        const sortedGroups = Object.values(groups).sort((a: any, b: any) => b.latestTimestamp - a.latestTimestamp);
        setGroupedScores(sortedGroups);

        if (sortedGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(sortedGroups[0]);
            setActivePhase(sortedGroups[0].submissions[0].phase);
        } else if (selectedGroup) {
            const updatedGroup = sortedGroups.find(g => g.teamId === selectedGroup.teamId);
            if (updatedGroup) {
                setSelectedGroup(updatedGroup);
                if (!updatedGroup.submissions.find((s: any) => s.phase === activePhase)) {
                    setActivePhase(updatedGroup.submissions[0].phase);
                }
            }
        }
        setLoading(false);
    };

    const currentScore = selectedGroup?.submissions.find((s: any) => s.phase === activePhase) || selectedGroup?.submissions[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your scores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Sidebar: Score List */}
            <div className="w-full md:w-80 bg-card border-r border-card-border overflow-y-auto">
                <div className="p-6 border-b border-card-border sticky top-0 bg-card z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-6 h-6 text-accent" />
                        <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Score History</h1>
                    </div>
                    <p className="text-xs text-muted-foreground">Your official competition results</p>
                </div>

                <div className="divide-y divide-card-border">
                    {groupedScores.length === 0 ? (
                        <div className="p-8 text-center">
                            <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No scores available yet</p>
                        </div>
                    ) : (
                        groupedScores.map((group) => (
                            <button
                                key={`${group.teamId}-${group.competitionType}`}
                                onClick={() => {
                                    setSelectedGroup(group);
                                    setActivePhase(group.submissions[0].phase);
                                }}
                                className={`w-full p-6 text-left transition-all hover:bg-muted/30 relative group ${selectedGroup?.teamId === group.teamId ? 'bg-accent/10 border-r-4 border-accent' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black uppercase text-accent tracking-widest">
                                        {group.competitionType.replace(/_/g, ' ')}
                                    </span>
                                    <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[8px] font-black text-muted-foreground">
                                        {group.submissions.length} {group.submissions.length > 1 ? 'RECORDS' : 'RECORD'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-black text-xl border border-card-border group-hover:scale-110 transition-transform text-foreground">
                                            {group.teamId.slice(-2).toUpperCase() || '??'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground leading-tight">Team {group.teamId}</div>
                                            <div className="text-xs text-muted-foreground font-medium">
                                                {group.submissions.map((s: any) => (s.phase || '').replace('essay_', 'E').replace('qualifications', 'Quals').replace('quarter_final', 'QF').replace('semi_final', 'SF').replace('final', 'F')).join(' / ')}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${selectedGroup?.teamId === group.teamId ? 'translate-x-1 text-accent' : ''}`} />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Card Preview (Using Reusable ScoreCard) */}
            <div className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-10 lg:p-16">
                <AnimatePresence mode="wait">
                    {selectedGroup && currentScore ? (
                        <ScoreCard
                            group={selectedGroup}
                            activePhase={activePhase}
                            onPhaseChange={setActivePhase}
                        />
                    ) : (
                        <div className="text-center py-20">
                            <ClipboardCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No score selected</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
