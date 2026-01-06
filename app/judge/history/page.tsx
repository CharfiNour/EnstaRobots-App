"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, CheckCircle, Clock, Trophy, Send,
    ChevronRight, Shield, Timer, Info, User, Loader2
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getOfflineScores } from '@/lib/offlineScores';
import ScoreCard from '@/components/judge/ScoreCard';

export default function JudgeHistoryPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'judge') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        loadScores();
    }, [router]);

    const loadScores = () => {
        const offlineScores = getOfflineScores();

        // Group by Team ID only (not by competition type)
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
    const isLineFollower = currentScore?.competitionType.includes('line_follower') || currentScore?.competitionType === 'homologation';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="flex h-screen overflow-hidden">
                {/* Left Sidebar: Team List */}
                <div className="w-full md:w-80 lg:w-96 border-r border-card-border bg-card flex flex-col">
                    <div className="p-6 border-b border-card-border">
                        <div className="flex items-center gap-3 mb-2">
                            <History className="w-6 h-6 text-accent" />
                            <h1 className="text-xl font-bold text-foreground">Score History</h1>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Grouped by Team</p>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {groupedScores.length === 0 ? (
                            <div className="p-12 text-center">
                                <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm">No scores submitted yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-card-border">
                                {groupedScores.map((group) => (
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
                                                        {group.submissions.map((s: any) => s.phase.replace('essay_', 'E').replace('qualifications', 'Quals').replace('quarter_final', 'QF').replace('semi_final', 'SF').replace('final', 'F')).join(' / ')}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${selectedGroup?.teamId === group.teamId ? 'translate-x-1 text-accent' : ''}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Card Preview */}
                <div className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-10 lg:p-16">
                    <AnimatePresence mode="wait">
                        {selectedGroup && currentScore ? (
                            <ScoreCard
                                group={selectedGroup}
                                activePhase={activePhase}
                                onPhaseChange={setActivePhase}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <History className="w-24 h-24 mb-6 text-muted-foreground" />
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">Select a record to view</h3>
                                <p className="text-sm font-bold mt-2">History of all official submissions</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
