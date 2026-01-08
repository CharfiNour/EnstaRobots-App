"use client";

import { motion } from 'framer-motion';
import {
    Shield, Timer, Trophy, CheckCircle
} from 'lucide-react';
import { OfflineScore } from '@/lib/offlineScores';

interface ScoreCardProps {
    group: {
        teamId: string;
        competitionType: string;
        submissions: OfflineScore[];
        latestTimestamp: number;
    };
    activePhase: string;
    onPhaseChange: (phase: string) => void;
}

export default function ScoreCard({ group, activePhase, onPhaseChange }: ScoreCardProps) {
    const currentScore = group.submissions.find((s) => s.phase === activePhase) || group.submissions[0];
    const isLineFollower = currentScore?.competitionType === 'line_follower' || currentScore?.competitionType === 'all_terrain';

    if (!currentScore) return null;

    return (
        <motion.div
            key={`${group.teamId}-${group.competitionType}-${activePhase}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="max-w-lg mx-auto"
        >

            {/* Main Record Card */}
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-[0_20px_40px_-8px_rgba(0,0,0,0.15)] relative">
                {/* Brand Header */}
                <div className="bg-accent/5 p-4 md:p-5 border-b border-card-border flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-accent mb-1">
                            <Shield size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Record</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase italic leading-none">
                            {(currentScore.competitionType || '').replace(/_/g, ' ')}
                        </h2>
                    </div>

                    {/* Phase Switcher Integrated */}
                    {group.submissions.length > 1 && (
                        <div className="flex gap-1 bg-muted p-1 rounded-xl border border-card-border/50">
                            {group.submissions.map((sub: any) => (
                                <button
                                    key={sub.id}
                                    onClick={() => onPhaseChange(sub.phase)}
                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activePhase === sub.phase
                                        ? 'bg-accent text-slate-900 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                >
                                    {(sub.phase || '').replace('qualifications', 'Qual').replace('final', 'Final').replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-5 space-y-4">
                    {/* Team Profile Card */}
                    <div className="relative bg-gradient-to-br from-accent/5 via-muted/30 to-muted/10 rounded-xl border border-card-border overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                            {/* Team Logo */}
                            <div className="w-16 h-16 rounded-lg bg-card border-2 border-accent/30 shadow-lg overflow-hidden flex-shrink-0">
                                <img
                                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${currentScore.teamId}`}
                                    alt="Team Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Team Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xl font-black text-foreground uppercase mb-1.5 leading-tight">
                                    {currentScore.teamId}
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                                        <span className="font-semibold">Robotics Club</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <div className="w-1 h-1 rounded-full bg-accent"></div>
                                        <span className="font-semibold">Engineering University</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Match Phase Box */}
                    <div className="p-3 bg-muted/30 rounded-xl border border-card-border">
                        <div className="text-[9px] font-black text-muted-foreground uppercase opacity-60 mb-1 tracking-widest">Match Phase</div>
                        <div className="text-lg font-black text-accent uppercase">{(currentScore.phase || '').replace(/_/g, ' ')}</div>
                    </div>

                    {/* Performance Breakdown */}
                    <div className="space-y-3">
                        {/* Replace "Data" with "Breakdown" line */}
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-card-border" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">Performance Breakdown</span>
                            <div className="h-px flex-1 bg-card-border" />
                        </div>

                        {isLineFollower ? (
                            <div className="grid gap-3">
                                {/* Lap Time Box */}
                                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-card-border shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                            <Timer size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wide text-foreground">Official Lap Time</span>
                                    </div>
                                    <span className="text-xl font-mono text-foreground font-black tracking-tight">
                                        {(() => {
                                            const ms = currentScore.timeMs || 0;
                                            const min = Math.floor(ms / 60000);
                                            const sec = Math.floor((ms % 60000) / 1000);
                                            const mls = ms % 1000;
                                            return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${mls.toString().padStart(3, '0')}`;
                                        })()}
                                    </span>
                                </div>

                                {/* Road Completion Box (from team card style) */}
                                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-card-border">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${currentScore.completedRoad ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <Shield size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wide text-foreground">Road Completion</span>
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-[0.1em] ${currentScore.completedRoad ? 'text-green-500' : 'text-red-500'}`}>
                                        {currentScore.completedRoad ? 'SUCCESS' : 'FAILED'}
                                    </span>
                                </div>

                                {/* Bonus Points for LF */}
                                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-card-border">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                            <Trophy size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wide text-foreground">Homologation Points</span>
                                    </div>
                                    <span className="text-lg font-black text-foreground">{currentScore.bonusPoints || 0} PTS</span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center p-4 bg-muted/10 rounded-xl border border-card-border">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase mb-1.5 leading-none">KOs</span>
                                    <span className="text-2xl font-black text-foreground">{currentScore.knockouts || 0}</span>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-muted/11 rounded-xl border border-card-border">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase mb-1.5 leading-none">Judges</span>
                                    <span className="text-2xl font-black text-foreground">{currentScore.judgePoints || 0}</span>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-muted/10 rounded-xl border border-card-border">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase mb-1.5 leading-none">Damage</span>
                                    <span className="text-2xl font-black text-foreground">{currentScore.damageScore || 0}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status & Outcome info (Only for non-LF) */}
                    {!isLineFollower && currentScore.status && (
                        <div className={`text-center py-3 px-5 rounded-xl text-xs font-black uppercase tracking-[0.2em] border shadow-sm ${currentScore.status === 'winner' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400' :
                            currentScore.status === 'qualified' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' :
                                'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            }`}>
                            MATCH OUTCOME: {currentScore.status}
                        </div>
                    )}

                </div>

                {/* Verified Results bottom bar (from team card style) */}
                <div className="bg-green-500/10 p-4 border-t border-green-500/20 flex items-center justify-center gap-2.5">
                    <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.35em]">Verified Official Result</span>
                </div>
            </div>

            {/* Additional Metadata for Judges only */}
            {!isLineFollower && (
                <div className="mt-6 flex items-center justify-between px-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    <div>Submission Timestamp: {new Date(currentScore.timestamp).toLocaleString()}</div>
                    <div>Match ID: {currentScore.matchId.slice(-10)}</div>
                </div>
            )}
        </motion.div>
    );
}
