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
    nextPhaseLabel?: string | null;
    submitting?: boolean;
    scoringMode?: 'performance' | 'homologation';
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
    isPhaseComplete,
    nextPhaseLabel,
    submitting = false,
    scoringMode = 'performance'
}: HeaderActionsProps) {
    const getColorClasses = (comp: any) => {
        if (!comp) return { start: 'from-green-500 to-green-600', finish: 'border-green-500 text-green-600 bg-green-50', dot: 'bg-green-500' };

        const type = comp.type || comp.id;
        switch (type) {
            case 'junior_line_follower':
                return {
                    start: 'from-cyan-500 to-cyan-600',
                    finish: 'border-cyan-500 text-cyan-600 bg-cyan-50',
                    dot: 'bg-cyan-500'
                };
            case 'junior_all_terrain':
                return {
                    start: 'from-emerald-500 to-emerald-600',
                    finish: 'border-emerald-500 text-emerald-600 bg-emerald-50',
                    dot: 'bg-emerald-500'
                };
            case 'line_follower':
                return {
                    start: 'from-indigo-500 to-indigo-600',
                    finish: 'border-indigo-500 text-indigo-600 bg-indigo-50',
                    dot: 'bg-indigo-500'
                };
            case 'all_terrain':
                return {
                    start: 'from-orange-500 to-orange-600',
                    finish: 'border-orange-500 text-orange-600 bg-orange-50',
                    dot: 'bg-orange-500'
                };
            case 'fight':
                return {
                    start: 'from-rose-500 to-rose-600',
                    finish: 'border-rose-500 text-rose-600 bg-rose-50',
                    dot: 'bg-rose-500'
                };
            default:
                return {
                    start: 'from-green-500 to-green-600',
                    finish: 'border-green-500 text-green-600 bg-green-50',
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
                    disabled={submitting}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-xl border font-black uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:grayscale ${colors.finish}`}
                >
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                    <span>
                        Finish {scoringMode === 'homologation' ? 'Homologation' : (isLineFollower ? (teams[0]?.phase || 'Essay 1') : globalPhase)}
                    </span>
                </button>
            ) : (
                <button
                    onClick={handleStartMatch}
                    disabled={submitting}
                    className={`px-8 py-2.5 rounded-xl bg-gradient-to-r ${submitting ? 'from-muted to-muted text-muted-foreground cursor-not-allowed grayscale' : `${colors.start} text-white hover:shadow-xl hover:-translate-y-0.5`} font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
                >
                    {isPhaseComplete
                        ? (scoringMode === 'homologation'
                            ? 'Re-evaluate Robot'
                            : (nextPhaseLabel ? `Start ${nextPhaseLabel}` : 'Re-Start Match'))
                        : (scoringMode === 'homologation'
                            ? 'Start Homologation'
                            : `Start ${isLineFollower ? (teams[0]?.phase || 'Essay 1') : globalPhase}`)}
                </button>
            )}
        </div>
    );
}
