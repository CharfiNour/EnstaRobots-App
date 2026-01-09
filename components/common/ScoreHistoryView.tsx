"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck, ChevronRight, History, Shield, Activity, Search, Target, Trophy
} from 'lucide-react';
import { getOfflineScores } from '@/lib/offlineScores';
import { getTeams } from '@/lib/teams';
import ScoreCard from '@/components/judge/ScoreCard';

const COMPETITION_CATEGORIES = [
    { id: 'all', name: 'All Categories' },
    { id: 'junior_line_follower', name: 'Junior Line Follower' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain' },
    { id: 'line_follower', name: 'Line Follower' },
    { id: 'all_terrain', name: 'All Terrain' },
    { id: 'fight', name: 'Fight' },
];

interface ScoreHistoryViewProps {
    isSentToTeamOnly?: boolean;
    isAdmin?: boolean;
}

export default function ScoreHistoryView({ isSentToTeamOnly = false, isAdmin = false }: ScoreHistoryViewProps) {
    const [loading, setLoading] = useState(true);
    const [groupedScores, setGroupedScores] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [activePhase, setActivePhase] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompetition, setSelectedCompetition] = useState('all');

    const loadScores = (forceSelectId?: string) => {
        let offlineScores = getOfflineScores();
        if (isSentToTeamOnly) {
            offlineScores = offlineScores.filter(s => s.isSentToTeam);
        }

        const allTeams = getTeams();

        const groups: Record<string, any> = {};
        offlineScores.forEach(score => {
            const key = score.teamId + '-' + score.competitionType;
            if (!groups[key]) {
                const team = allTeams.find(t => t.id === score.teamId || t.name === score.teamId);
                groups[key] = {
                    teamId: score.teamId,
                    team,
                    competitionType: score.competitionType || team?.competition,
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

        if (forceSelectId) {
            const forced = sortedGroups.find(g => g.teamId === forceSelectId);
            if (forced) {
                setSelectedGroup(forced);
                setActivePhase(forced.submissions[0].phase);
            }
        } else if (sortedGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(sortedGroups[0]);
            setActivePhase(sortedGroups[0].submissions[0].phase);
        } else if (selectedGroup) {
            const updatedGroup = sortedGroups.find(g => g.teamId === selectedGroup.teamId && g.competitionType === selectedGroup.competitionType);
            if (updatedGroup) {
                setSelectedGroup(updatedGroup);
                if (!updatedGroup.submissions.find((s: any) => s.phase === activePhase)) {
                    setActivePhase(updatedGroup.submissions[0].phase);
                }
            } else {
                setSelectedGroup(sortedGroups[0] || null);
                setActivePhase(sortedGroups[0]?.submissions[0].phase || '');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadScores();
    }, []);

    const filteredGroups = useMemo(() => {
        return groupedScores.filter(g => {
            const matchesComp = selectedCompetition === 'all' || g.competitionType === selectedCompetition;
            const matchesSearch = g.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.competitionType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.team?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesComp && matchesSearch;
        });
    }, [groupedScores, searchQuery, selectedCompetition]);

    // Synchronize selection when competition changes
    useEffect(() => {
        if (filteredGroups.length > 0) {
            const stillExists = filteredGroups.some(g => g.teamId === selectedGroup?.teamId && g.competitionType === selectedGroup?.competitionType);
            if (!stillExists) {
                setSelectedGroup(filteredGroups[0]);
                setActivePhase(filteredGroups[0].submissions[0].phase);
            }
        } else {
            setSelectedGroup(null);
            setActivePhase('');
        }
    }, [selectedCompetition]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentScore = selectedGroup?.submissions.find((s: any) => s.phase === activePhase) || selectedGroup?.submissions[0];

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar: Tactical Log List */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-6">
                    {/* Competition Selector */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                            <Target size={12} className="text-role-primary" />
                            Deployment Category
                        </h2>
                        <div className="relative group/select">
                            <select
                                value={selectedCompetition}
                                onChange={(e) => setSelectedCompetition(e.target.value)}
                                className="w-full bg-muted/50 border border-card-border pl-4 pr-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider outline-none focus:ring-1 focus:ring-role-primary/30 appearance-none cursor-pointer transition-all"
                            >
                                {COMPETITION_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover/select:text-role-primary transition-colors">
                                <ChevronRight size={14} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* Search and Teams List */}
                    <div>
                        <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                            <Shield size={12} className="text-role-primary" />
                            Active Units
                        </h2>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                            <input
                                type="text"
                                placeholder="SEARCH UNITS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-card-border rounded-xl text-[10px] font-black outline-none focus:ring-1 focus:ring-role-primary/30 transition-all placeholder:opacity-30"
                            />
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredGroups.length === 0 ? (
                                <div className="py-10 text-center opacity-40">
                                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase">No Units Found</p>
                                </div>
                            ) : (
                                filteredGroups.map((group) => {
                                    const latest = group.submissions.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
                                    const isSelected = selectedGroup?.teamId === group.teamId && selectedGroup?.competitionType === group.competitionType;

                                    return (
                                        <button
                                            key={`${group.teamId}-${group.competitionType}`}
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setActivePhase(group.submissions[0].phase);
                                            }}
                                            className={`w-full p-4 rounded-xl text-left transition-all border group relative overflow-hidden ${isSelected
                                                ? 'bg-role-primary/10 border-role-primary/30 shadow-sm'
                                                : 'bg-card border-card-border hover:bg-muted/50'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 relative z-10">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border transition-colors ${isSelected ? 'bg-role-primary text-white border-role-primary shadow-lg shadow-role-primary/20' : 'bg-muted text-muted-foreground border-card-border'}`}>
                                                    {group.team?.logo ? (
                                                        <img src={group.team.logo} className="w-full h-full object-cover rounded-lg" alt="" />
                                                    ) : (
                                                        group.teamId.slice(-2).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`font-black text-[12px] truncate uppercase ${isSelected ? 'text-role-primary' : 'text-foreground'}`}>
                                                        {group.team?.name || group.teamId}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest truncate">
                                                            {group.team?.club || 'Club Unknown'}
                                                        </div>
                                                        <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                                        <div className="text-[7px] font-bold text-muted-foreground uppercase opacity-40 truncate">
                                                            {group.team?.university || 'University Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-role-primary" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-role-primary/10 to-transparent border border-role-primary/20 rounded-2xl">
                    <p className="text-[10px] font-black text-role-primary uppercase tracking-widest mb-2 font-mono">// ARCHIVE STATUS</p>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase italic tracking-tight">Viewing verified telemetry from official terminal submissions. All records are final.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative min-h-[600px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {selectedGroup && currentScore ? (
                        <motion.div
                            key={`${selectedGroup.teamId}-${selectedGroup.competitionType}-${activePhase}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            <ScoreCard
                                group={selectedGroup}
                                activePhase={activePhase}
                                onPhaseChange={setActivePhase}
                                isAdmin={isAdmin}
                                onDelete={() => loadScores()}
                            />
                        </motion.div>
                    ) : (
                        <div className="text-center opacity-30 space-y-4">
                            <Target size={48} className="mx-auto text-muted-foreground" />
                            <div>
                                <p className="font-black uppercase tracking-widest text-sm mb-1 italic">Unit Selection Required</p>
                                <p className="text-[10px] font-bold uppercase tracking-tight max-w-[240px] mx-auto">Select a tactical performance entry from the registry to view detailed specifications.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
