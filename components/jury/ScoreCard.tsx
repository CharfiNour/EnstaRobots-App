"use client";

import { motion } from 'framer-motion';
import {
    Shield, Timer, Trophy, CheckCircle, Trash2, Edit2, X, Save, Users
} from 'lucide-react';
import { type OfflineScore } from '@/lib/offlineScores';
import { useState } from 'react';
import { deleteScoreFromSupabase, pushScoreToSupabase } from '@/lib/supabaseData';
import { getCategoryMetadata } from '@/lib/constants';

interface ScoreCardProps {
    group: {
        type: 'match' | 'single';
        teamId: string;
        team?: any;
        competitionType: string;
        submissions: OfflineScore[];
        latestTimestamp: number;
    };
    activePhase: string;
    onPhaseChange: (phase: string) => void;
    isAdmin?: boolean;
    onDelete?: () => void;
    matchParticipants?: { teamId: string; team?: any; submissions: OfflineScore[] }[];
    allCompetitions?: any[];
}

export default function ScoreCard({ group, activePhase, onPhaseChange, isAdmin, onDelete, matchParticipants, allCompetitions }: ScoreCardProps) {
    // Robust phase matching helper
    const matchesPhase = (phaseA: string | undefined, phaseB: string | undefined) => {
        const norm = (p: string | undefined) => (p || '').toLowerCase().trim().replace(/_/g, ' ').replace('qualifications', 'qual');
        return norm(phaseA) === norm(phaseB);
    };

    // Filter and sort submissions for the current phase (latest first)
    const phaseSubmissions = group.submissions
        .filter((s) => matchesPhase(s.phase, activePhase))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const currentScore = phaseSubmissions[0];

    const homologationScore = group.submissions.find((s) =>
        matchesPhase(s.phase, 'homologation') || matchesPhase(s.phase, 'technical homologation')
    );

    // Resolve competition metadata
    const compMetadata = allCompetitions?.find(c => c.id === group.competitionType || c.type === group.competitionType);
    const competitionName = compMetadata?.name || group.competitionType.replace(/_/g, ' ');
    const competitionType = (compMetadata?.type || group.competitionType || '').toLowerCase();

    // Get rich styling from constants
    const styleMeta = getCategoryMetadata(competitionType);

    // Determine the layout style:
    const isLineFollower = competitionType === 'line_follower' || competitionType === 'junior_line_follower' || competitionName.toLowerCase().includes('line follower');
    const isHomologation = (activePhase || '').toLowerCase() === 'homologation';

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<OfflineScore>>({});

    // If no score exists for this phase, we use a ghost score for layout, or just show team profile
    // Note: We don't return null anymore so the team profile remains visible
    const hasScore = !!currentScore;

    const handleStartEdit = () => {
        if (!currentScore) return;
        setEditData({ ...currentScore });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentScore) return;
        try {
            await pushScoreToSupabase(editData as any);
            setIsEditing(false);
            onDelete?.(); // Re-trigger load in parent
        } catch (err) {
            alert("Failed to save changes to cloud.");
        }
    };

    // Get other participants (exclude current team)
    const otherParticipants = matchParticipants?.filter(p => p.teamId !== group.teamId) || [];

    // Helper to get result badge for a participant
    const getResultBadge = (participant: { teamId: string; team?: any; submissions: OfflineScore[] }) => {
        const sub = participant.submissions.find(s => matchesPhase(s.phase, activePhase));
        if (!sub) return null;

        let st = (sub.status || '').toLowerCase();
        let isWinner = st === 'winner';
        let isEliminated = st === 'eliminated';
        let isDraw = st === 'draw';

        const isQualified = st === 'qualified';

        if (isWinner) {
            return { label: 'WINNER', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' };
        } else if (isQualified) {
            return { label: 'QUALIFIED', color: 'bg-blue-500/10 border-blue-500/30 text-blue-600' };
        } else if (isEliminated) {
            return { label: 'ELIMINATED', color: 'bg-red-500/10 border-red-500/30 text-red-600' };
        } else if (isDraw) {
            return { label: 'DRAW', color: 'bg-orange-500/10 border-orange-500/30 text-orange-600' };
        } else if (st === 'validated' || st === 'finished' || st === 'success') {
            return { label: 'DONE', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' };
        } else if (st === 'pending') {
            return { label: 'PENDING', color: 'bg-orange-500/5 border-orange-500/20 text-orange-500/80' };
        }

        return null;
    };

    return (
        <motion.div
            key={`${group.teamId}-${group.competitionType}-${activePhase}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full max-w-[480px] mx-auto"
        >

            {/* Main Record Card */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-[0_20px_40px_-8px_rgba(0,0,0,0.15)] relative h-[540px] flex flex-col">
                {/* Brand Header */}
                <div className={`bg-gradient-to-br ${styleMeta?.color || 'from-accent/5 to-card'} p-2.5 md:p-3 border-b ${styleMeta?.borderColor || 'border-card-border'} flex justify-between items-center`}>
                    <div>
                        <div className={`flex items-center gap-2 mb-1 ${styleMeta?.badgeColor ? styleMeta.badgeColor.split(' ').find((c: string) => c.startsWith('text-')) : 'text-accent'}`}>
                            <Shield size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Record</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase italic leading-none flex items-center gap-1">
                            {competitionName}
                            {isHomologation && (
                                <span className="text-[10px] not-italic px-2 py-0.5 rounded-full bg-role-primary/10 border border-role-primary/30 text-role-primary tracking-widest font-black uppercase">Registry</span>
                            )}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Admin Delete Action */}
                        {isAdmin && hasScore && (
                            <>
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleSave}
                                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors border border-green-500/20"
                                            title="Save Changes"
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-card-border"
                                            title="Cancel Edit"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleStartEdit}
                                            className="p-2 text-role-primary hover:bg-role-primary/10 rounded-lg transition-colors border border-role-primary/20"
                                            title="Edit Record"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (currentScore && confirm('Are you sure you want to delete this phase/score record?')) {
                                                    try {
                                                        // 1. Delete from Supabase first
                                                        await deleteScoreFromSupabase(currentScore.id);
                                                        // 2. Offline buffer is no longer used, so nothing to clear there.
                                                        // 3. Notify parent to refresh
                                                        onDelete?.();
                                                    } catch (err) {
                                                        alert("Failed to delete record from database.");
                                                    }
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                                            title="Delete Phase"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-4 flex-1 flex flex-col min-h-0">
                    {/* Team Profile Card */}
                    <div className="relative bg-gradient-to-br from-accent/5 via-muted/30 to-muted/10 rounded-xl border border-card-border overflow-hidden">
                        <div className="p-3 flex items-center gap-4">
                            {/* Team Logo */}
                            <div className="w-14 h-14 rounded-lg bg-card border-2 border-accent/30 shadow-lg overflow-hidden flex-shrink-0">
                                {group.team?.logo ? (
                                    <img src={group.team.logo} alt="Team Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <img
                                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${group.teamId}`}
                                        alt="Team Logo"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Team Info */}
                            <div className="flex-1 min-w-0 pr-16">
                                <div className="text-lg font-black text-foreground uppercase mb-1 leading-tight truncate">
                                    {group.team?.name || group.teamId}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                                        <span className="font-bold">{group.team?.club || 'Robotics Club'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                                        <span className="font-bold opacity-75">{group.team?.university || 'Official Entry'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Result Badge for selected team (Absolute) */}
                            {hasScore && (
                                (() => {
                                    const st = (currentScore.status || '').toLowerCase();
                                    let isWinner = st === 'winner';
                                    let isEliminated = st === 'eliminated';
                                    let isDraw = st === 'draw';
                                    let isFinalized = ['validated', 'finished', 'winner', 'qualified', 'eliminated', 'draw', 'success'].includes(st);

                                    // Calculate if generic logic REMOVED to respect explicit status submission


                                    const isQualified = st === 'qualified';
                                    const label = isHomologation ? `${currentScore.totalPoints} PTS` :
                                        isWinner ? 'WINNER' :
                                            isQualified ? 'QUALIFIED' :
                                                isEliminated ? 'ELIMINATED' :
                                                    isDraw ? 'DRAW' : (isFinalized ? 'DONE' : 'PENDING');

                                    if (!label) return null;

                                    return (
                                        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm border ${isWinner ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' :
                                            isEliminated ? 'bg-red-500/10 border-red-500/30 text-red-600' :
                                                isQualified ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                                                    isDraw ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' :
                                                        isFinalized ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                                                            'bg-orange-500/5 border-orange-500/20 text-orange-500/80 shadow-none'
                                            }`}>
                                            {isWinner && '🏆 '}
                                            {label}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>


                    {/* Performance Breakdown / Match Participants */}
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-card-border" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                                {isHomologation ? 'Technical Analysis' : isLineFollower ? 'Performance Breakdown' : 'Match Opponents'}
                            </span>
                            <div className="h-px flex-1 bg-card-border" />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">

                            {isHomologation ? (
                                <div className="grid gap-3">
                                    {hasScore ? (
                                        <div className="space-y-2">

                                            {/* Itemized Technical Breakdown */}
                                            <div className="grid gap-2">
                                                {Object.entries(currentScore.detailedScores || {}).map(([id, pts]) => {
                                                    const label = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                    const max = 10;

                                                    return (
                                                        <div key={id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-card-border/50 group hover:bg-muted/30 transition-all">
                                                            <div className="text-[10px] font-black uppercase tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">{label}</div>
                                                            <div className="text-sm font-black italic text-accent flex items-baseline gap-1">
                                                                {pts}
                                                                <span className="text-[8px] not-italic opacity-30 text-muted-foreground uppercase">/ {max}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Total Summary for Homologation (Moved to bottom) */}
                                            <div className="flex items-center justify-between p-3 bg-role-primary/5 rounded-xl border border-role-primary/20 mt-2 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-role-primary/20 rounded-lg text-role-primary">
                                                        <Shield size={16} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-wide text-role-primary">Homologation Score</span>
                                                </div>
                                                <span className="text-xl font-black italic text-foreground tracking-tighter">
                                                    {currentScore.totalPoints} <span className="text-xs not-italic opacity-40 uppercase">/ 40 PTS</span>
                                                </span>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-card-border">
                                            <div className="w-12 h-12 rounded-full bg-card border border-card-border flex items-center justify-center mb-3 text-muted-foreground/30">
                                                <Shield size={24} />
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Technical Registry Pending</div>
                                            <div className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">Waiting for tactical entry in the registry sector.</div>
                                        </div>
                                    )}
                                </div>
                            ) : isLineFollower ? (
                                <div className="grid gap-3">
                                    {hasScore ? (
                                        (!isEditing && currentScore.status === 'pending') ? (
                                            <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-card-border">
                                                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3 text-accent animate-pulse">
                                                    <Timer size={24} />
                                                </div>
                                                <div className="text-xs font-black uppercase tracking-widest text-accent">Ready for Run</div>
                                                <div className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">Waiting for official start signal.</div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Lap Time Box */}
                                                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-card-border shadow-inner">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                                            <Timer size={16} />
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-wide text-foreground">Official Lap Time</span>
                                                    </div>
                                                    {isEditing ? (
                                                        <div className="flex gap-1 items-center">
                                                            <input
                                                                type="number"
                                                                value={editData.timeMs || 0}
                                                                onChange={(e) => setEditData({ ...editData, timeMs: parseInt(e.target.value) })}
                                                                className="w-24 bg-card border border-card-border p-1 rounded font-mono text-sm text-right"
                                                            />
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">ms</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xl font-mono text-foreground font-black tracking-tight">
                                                            {(() => {
                                                                const ms = currentScore.timeMs || 0;
                                                                const min = Math.floor(ms / 60000);
                                                                const sec = Math.floor((ms % 60000) / 1000);
                                                                const mls = ms % 1000;
                                                                return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${mls.toString().padStart(3, '0')}`;
                                                            })()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Road Completion Box */}
                                                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-card-border">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${currentScore.completedRoad ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            <Shield size={16} />
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-wide text-foreground">Road Completion</span>
                                                    </div>
                                                    {isEditing ? (
                                                        <button
                                                            onClick={() => setEditData({ ...editData, completedRoad: !editData.completedRoad })}
                                                            className={`text-xs font-black px-3 py-1 rounded-lg border transition-all ${editData.completedRoad ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                                                        >
                                                            {editData.completedRoad ? 'SUCCESS' : 'FAILED'}
                                                        </button>
                                                    ) : (
                                                        <span className={`text-sm font-black uppercase tracking-[0.1em] ${currentScore.completedRoad ? 'text-green-500' : 'text-red-500'}`}>
                                                            {currentScore.completedRoad ? 'SUCCESS' : 'FAILED'}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Total Summary for LF */}
                                                <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/20 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-accent/20 rounded-lg text-accent">
                                                            <Trophy size={16} />
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-wide text-accent">total score</span>
                                                    </div>
                                                    <span className="text-xl font-black italic text-foreground tracking-tighter">
                                                        {currentScore.totalPoints} <span className="text-xs not-italic opacity-40 uppercase">/ 215 PTS</span>
                                                    </span>
                                                </div>

                                                {/* Itemized Segments Breakdown */}
                                                {currentScore.detailedScores && Object.keys(currentScore.detailedScores).length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 mt-2 mb-3">
                                                            <div className="h-px flex-1 bg-card-border" />
                                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">Tactical Analysis</span>
                                                            <div className="h-px flex-1 bg-card-border" />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            {(() => {
                                                                const { LINE_FOLLOWER_SECTIONS_STANDARD, LINE_FOLLOWER_SECTIONS_JUNIOR } = require('@/lib/constants');
                                                                const sections = competitionType === 'junior_line_follower' ? LINE_FOLLOWER_SECTIONS_JUNIOR : LINE_FOLLOWER_SECTIONS_STANDARD;

                                                                const segmentCards = Object.entries(currentScore.detailedScores || {}).map(([id, pts]) => {
                                                                    const section = sections.find((s: any) => s.id === id);
                                                                    if (!section) return null;

                                                                    return (
                                                                        <div key={id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-card-border/50">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-lg bg-card border border-card-border overflow-hidden">
                                                                                    <img src={section.image} alt="" className="w-full h-full object-cover opacity-80" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-[10px] font-black uppercase tracking-tight text-foreground">{section.label}</div>
                                                                                    <div className="text-[8px] font-bold uppercase text-muted-foreground opacity-60">Max {section.maxPoints} Pts</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-sm font-black italic text-accent">
                                                                                {pts} <span className="text-[8px] not-italic opacity-40">PTS</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });

                                                                return (
                                                                    <>
                                                                        {segmentCards}

                                                                        {/* Homologation Slot inside the list - Always show for Line Follower */}
                                                                        {!isHomologation && isLineFollower && (
                                                                            <div className="flex items-center justify-between p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200/40 shadow-sm mt-1">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-10 h-10 rounded-xl bg-orange-100/80 flex items-center justify-center text-orange-600">
                                                                                        <Shield size={18} fill="currentColor" fillOpacity={0.1} />
                                                                                    </div>
                                                                                    <div className="text-[12px] font-black uppercase tracking-[0.15em] text-orange-600">
                                                                                        Homologation Score
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-baseline gap-1 mr-1">
                                                                                    <span className="text-2xl font-black italic text-slate-800 tracking-tighter">
                                                                                        {homologationScore?.totalPoints || 0}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-bold uppercase opacity-40 text-slate-800">
                                                                                        / 40 PTS
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </>)
                                    ) : (
                                        /* Empty State for Line Follower */
                                        <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-card-border">
                                            <div className="w-12 h-12 rounded-full bg-card border border-card-border flex items-center justify-center mb-3 text-muted-foreground/30">
                                                <Timer size={24} />
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Performance Record Required</div>
                                            <div className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">Waiting for synchronization to tactical registry.</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Non-Line Follower: Show other match participants
                                <div className="grid gap-3 content-start">
                                    {!hasScore ? (
                                        /* Empty State for Matches */
                                        <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-card-border">
                                            <div className="w-12 h-12 rounded-full bg-card border border-card-border flex items-center justify-center mb-3 text-muted-foreground/30">
                                                <Users size={24} />
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Match Pending</div>
                                            <div className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">The session data for this match hasn't been synchronized yet.</div>
                                        </div>
                                    ) : otherParticipants.length > 0 ? (
                                        otherParticipants.map((participant) => {
                                            const badge = getResultBadge(participant);
                                            return (
                                                <div
                                                    key={participant.teamId}
                                                    className="relative bg-muted/10 rounded-xl border border-card-border overflow-hidden"
                                                >
                                                    <div className="p-2 flex items-center gap-3">
                                                        {/* Team Logo */}
                                                        <div className="w-8 h-8 rounded-lg bg-card border border-card-border shadow overflow-hidden flex-shrink-0">
                                                            {participant.team?.logo ? (
                                                                <img src={participant.team.logo} alt="Team Logo" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img
                                                                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${participant.teamId}`}
                                                                    alt="Team Logo"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Team Info */}
                                                        <div className="flex-1 min-w-0 pr-16">
                                                            <div className="text-sm font-black text-foreground uppercase truncate">
                                                                {participant.team?.name || participant.teamId}
                                                            </div>
                                                            <div className="text-[11px] font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-1.5">
                                                                <span className="text-accent/80 whitespace-nowrap">{participant.team?.club || 'Robotics Club'}</span>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                                                                <span className="truncate">{participant.team?.university || 'Engineering University'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Badge */}
                                                        {badge && (
                                                            <div className={`absolute right-4 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider border ${badge.color}`}>
                                                                {badge.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        /* Solitary Entry (e.g. Test Run) */
                                        <div className="h-full flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-card-border">
                                            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Solo Performance</div>
                                            <div className="text-[10px] text-muted-foreground/60 mt-1">No opponents found for this session.</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tactical Analysis Section for Match-based */}
                        {!isHomologation && !isLineFollower && (
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-card-border" />
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em]">Tactical Analysis</span>
                                    <div className="h-px flex-1 bg-card-border" />
                                </div>

                                {homologationScore ? (
                                    <div className="p-2 bg-role-primary/5 rounded-xl border border-role-primary/20 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-role-primary/20 rounded-lg text-role-primary">
                                                    <Shield size={14} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-role-primary leading-tight">Homologation</span>
                                            </div>
                                            <span className="text-lg font-black italic text-foreground tracking-tighter flex items-baseline gap-1">
                                                {homologationScore.totalPoints} <span className="text-[9px] not-italic uppercase opacity-60">/ 40 PTS</span>
                                            </span>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="p-2 bg-orange-500/5 rounded-xl border border-orange-500/10 shadow-sm flex items-center justify-center gap-2">
                                        <Shield size={12} className="text-orange-500/60" />
                                        <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Technical Registration Missing</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Verified Results bottom bar - Only show if DONE or officially cleared */}
                {hasScore && currentScore && (
                    (currentScore.status && currentScore.status !== 'pending') ||
                    isHomologation ||
                    isLineFollower ||
                    (homologationScore) || // If they are homologated, they are an official verified participant
                    (!currentScore.status) // Default to verified if no status is present (legacy/LF)
                ) && (
                        <div className="bg-green-500/10 p-3 border-t border-green-500/20 flex items-center justify-center gap-2.5">
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.35em]">Verified Official Result</span>
                        </div>
                    )}
            </div>
        </motion.div>
    );
}
