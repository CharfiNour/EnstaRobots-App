"use client";

import { ChevronRight } from 'lucide-react';
import { TeamScoreEntry } from '../../types';

interface HeaderActionsProps {
    isLive: boolean;
    handleNextCard: () => void;
    handleEndMatch: () => void;
    handleStartMatch: () => void;
    isLineFollower: boolean;
    teams: TeamScoreEntry[];
    globalPhase: string;
    competition: any;
    isPhaseComplete: boolean;
}

export default function HeaderActions({
    isLive,
    handleNextCard,
    handleEndMatch,
    handleStartMatch,
    isLineFollower,
    teams,
    globalPhase,
    competition,
    isPhaseComplete
}: HeaderActionsProps) {
    const getColorClasses = (comp: any) => {
        if (!comp) return { start: 'from-green-500 to-green-600', finish: 'border-green-500/20 text-green-500', dot: 'bg-green-500' };

        const type = comp.type || comp.id;
        switch (type) {
            case 'junior_line_follower':
                return {
                    start: 'from-cyan-500 to-cyan-600',
                    finish: 'border-cyan-500/20 text-cyan-500',
                    dot: 'bg-cyan-500'
                };
            case 'junior_all_terrain':
                return {
                    start: 'from-emerald-500 to-emerald-600',
                    finish: 'border-emerald-500/20 text-emerald-500',
                    dot: 'bg-emerald-500'
                };
            case 'line_follower':
                return {
                    start: 'from-indigo-500 to-indigo-600',
                    finish: 'border-indigo-500/20 text-indigo-500',
                    dot: 'bg-indigo-500'
                };
            case 'all_terrain':
                return {
                    start: 'from-orange-500 to-orange-600',
                    finish: 'border-orange-500/20 text-orange-500',
                    dot: 'bg-orange-500'
                };
            case 'fight':
                return {
                    start: 'from-rose-500 to-rose-600',
                    finish: 'border-rose-500/20 text-rose-500',
                    dot: 'bg-rose-500'
                };
            default:
                return {
                    start: 'from-green-500 to-green-600',
                    finish: 'border-green-500/20 text-green-500',
                    dot: 'bg-green-500'
                };
        }
    };

    const colors = getColorClasses(competition);

    return (
        <div className="flex justify-between items-center mb-6">
            <div></div>

            {isLive ? (
                <button
                    onClick={handleEndMatch}
                    className={`flex items-center gap-3 px-6 py-2 rounded-xl bg-card border font-black uppercase tracking-widest transition-all active:scale-95 ${colors.finish}`}
                >
                    <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                    <span>
                        Finish {isLineFollower ? (teams[0]?.phase || 'Essay 1') : globalPhase}
                    </span>
                </button>
            ) : (
                <button
                    onClick={handleStartMatch}
                    disabled={isPhaseComplete}
                    className={`px-6 py-2 rounded-xl bg-gradient-to-r ${isPhaseComplete ? 'from-muted to-muted text-muted-foreground cursor-not-allowed' : `${colors.start} text-white`} font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
                >
                    {isPhaseComplete ? 'Phase Completed' : `Start ${isLineFollower ? (teams[0]?.phase || 'Essay 1') : globalPhase}`}
                </button>
            )}
        </div>
    );
}
