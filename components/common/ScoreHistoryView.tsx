"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, Tag, ChevronDown, Lock
} from 'lucide-react';
import { getOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/judge/ScoreCard';
import { getCompetitionState } from '@/lib/competitionState';

const COMPETITION_CATEGORIES = [
    { id: 'all', name: 'All Competitions' },
    { id: 'junior_line_follower', name: 'Junior Line Follower' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain' },
    { id: 'line_follower', name: 'Line Follower' },
    { id: 'all_terrain', name: 'All Terrain' },
    { id: 'fight', name: 'Fight' },
];

interface ScoreHistoryViewProps {
    initialCompetition?: string;
    showFilter?: boolean;
}

export default function ScoreHistoryView({ initialCompetition = 'all', showFilter = true }: ScoreHistoryViewProps) {
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const [selectedCompetition, setSelectedCompetition] = useState(initialCompetition);

    const loadScores = () => {
        const offlineScores = getOfflineScores();
        const allTeams = getTeams();
        const competitionState = getCompetitionState();
        const orderedComps = competitionState.orderedCompetitions || [];

        const groups: Record<string, any> = {};

        // 1. First, ensure all teams from "Ordered" competitions are present
        allTeams.forEach(team => {
            if (orderedComps.includes(team.competition || '')) {
                groups[team.id] = {
                    teamId: team.id,
                    teamName: team.name, // Robot Name
                    club: team.club || 'Independent',
                    university: team.university || '',
                    competitionType: team.competition,
                    submissions: [],
                    latestTimestamp: 0
                };
            }
        });

        // 2. Add/Populate teams that have actual scores
        offlineScores.forEach(score => {
            const key = score.teamId;
            const team = allTeams.find(t => t.id === score.teamId);

            if (!groups[key]) {
                groups[key] = {
                    teamId: score.teamId,
                    teamName: team?.name || `Team ${score.teamId}`,
                    club: team?.club || 'Independent',
                    university: team?.university || '',
                    competitionType: team?.competition || score.competitionType,
                    submissions: [],
                    latestTimestamp: 0
                };
            }
            groups[key].submissions.push(score);
            if (score.timestamp > groups[key].latestTimestamp) {
                groups[key].latestTimestamp = score.timestamp;
            }
        });

        // 3. Sort by the official admin reordering
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
            const indexA = allTeams.findIndex(t => t.id === a.teamId);
            const indexB = allTeams.findIndex(t => t.id === b.teamId);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return b.latestTimestamp - a.latestTimestamp;
        });

        setGroupedScores(sortedGroups);

        if (sortedGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(sortedGroups[0]);
            const firstSub = sortedGroups[0].submissions[0];
            setActivePhase(firstSub ? firstSub.phase : '');
        }
    };

    useEffect(() => {
        loadScores();
    }, []);

    const filteredGroups = groupedScores.filter(group =>
        selectedCompetition === 'all' || group.competitionType === selectedCompetition
    );

    const currentScore = selectedGroup?.submissions.find((s: any) => s.phase === activePhase) || selectedGroup?.submissions[0];

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Left Sidebar: Team List */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-[400px] flex flex-col shrink-0 sticky top-10 h-fit"
            >
                <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden max-h-[640px]">
                    <div className="p-6 border-b border-card-border/30 shrink-0">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-accent italic">Navigation</h3>
                        </div>

                        {/* Competition Selector */}
                        {showFilter && (
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent">
                                    <Tag size={14} />
                                </div>
                                <select
                                    value={selectedCompetition}
                                    onChange={(e) => setSelectedCompetition(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3.5 bg-muted/20 border border-card-border rounded-xl text-[9px] font-black tracking-widest focus:outline-none focus:border-accent/40 focus:bg-muted/40 transition-all appearance-none cursor-pointer"
                                >
                                    {COMPETITION_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id} className="bg-background text-foreground uppercase">
                                            {cat.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                <p className="text-[9px] font-black uppercase tracking-widest">No matching teams</p>
                            </div>
                        ) : (
                            filteredGroups.map((group) => (
                                <button
                                    key={`${group.teamId}-${group.competitionType}`}
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        setActivePhase(group.submissions[0]?.phase || '');
                                    }}
                                    className={`w-full p-4 rounded-3xl text-left border transition-all duration-300 group relative overflow-hidden ${selectedGroup?.teamId === group.teamId
                                        ? 'bg-accent/10 border-accent/40 shadow-xl'
                                        : 'bg-muted/5 border-transparent hover:bg-muted/10 hover:border-card-border/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all ${selectedGroup?.teamId === group.teamId
                                            ? 'bg-accent text-slate-900 shadow-lg'
                                            : 'bg-card border border-card-border text-foreground'
                                            }`}>
                                            {group.teamId.slice(-2).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${selectedGroup?.teamId === group.teamId ? 'text-accent' : 'text-muted-foreground'
                                                    }`}>
                                                    {(group.competitionType || '').replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[7px] font-black text-muted-foreground/50">
                                                    {group.submissions.length}×
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-sm truncate leading-tight group-hover:text-accent transition-colors">
                                                {group.teamName}
                                            </h3>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Right Panel: Score Card */}
            <div className="flex-1 flex flex-col pt-4">
                <AnimatePresence mode="wait">
                    {selectedGroup ? (
                        currentScore ? (
                            <motion.div
                                key={`${selectedGroup.teamId}-${activePhase}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full pb-12"
                            >
                                <div className="max-w-3xl mx-auto">
                                    <ScoreCard
                                        group={selectedGroup}
                                        activePhase={activePhase}
                                        onPhaseChange={setActivePhase}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="no-score"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="h-full flex flex-col items-center justify-center text-center p-12 bg-card/20 backdrop-blur-xl border border-card-border border-dashed rounded-[3rem] mx-4"
                            >
                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                                    <Lock className="w-10 h-10 text-muted-foreground animate-pulse" />
                                </div>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-foreground mb-4">Did not compete yet</h3>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-50">
                                        Telemetry Lock Active
                                    </p>
                                    <div className="h-1 w-12 bg-accent/20 rounded-full"></div>
                                </div>
                            </motion.div>
                        )
                    ) : (
                        <motion.div
                            key="standby"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-12"
                        >
                            <History size={64} className="text-muted-foreground/20 mb-6" />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/40 mb-4">Archive Standby</h3>
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em] max-w-xs">
                                Select a team to retrieve match records.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
