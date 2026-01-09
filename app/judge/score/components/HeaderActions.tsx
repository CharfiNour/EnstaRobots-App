"use client";

import { ChevronRight } from 'lucide-react';
import { TeamScoreEntry } from '../types';

interface HeaderActionsProps {
    isLive: boolean;
    handleNextCard: () => void;
    handleEndMatch: () => void;
    handleStartMatch: () => void;
    isLineFollower: boolean;
    teams: TeamScoreEntry[];
    globalPhase: string;
}

export default function HeaderActions({
    isLive,
    handleNextCard,
    handleEndMatch,
    handleStartMatch,
    isLineFollower,
    teams,
    globalPhase
}: HeaderActionsProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <button
                onClick={handleNextCard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-black uppercase tracking-widest text-xs transition-all active:scale-95 border border-card-border"
            >
                <span>Next Card</span>
                <ChevronRight size={16} />
            </button>

            {isLive ? (
                <button
                    onClick={handleEndMatch}
                    className="flex items-center gap-3 px-6 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>
                        {isLineFollower
                            ? `Finish ${teams[0]?.phase === 'essay_1' ? 'Phase 1' : 'Phase 2'}`
                            : `Finish ${globalPhase === 'qualifications' ? 'Quals'
                                : globalPhase === 'quarter_final' ? 'Quarter F'
                                    : globalPhase === 'semi_final' ? 'Semi F'
                                        : globalPhase === 'final' ? 'Final' : 'Match'}`
                        }
                    </span>
                </button>
            ) : (
                <button
                    onClick={handleStartMatch}
                    className="px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all active:scale-95"
                >
                    {isLineFollower
                        ? `Start ${teams[0]?.phase === 'essay_1' ? 'Phase 1' : 'Phase 2'}`
                        : `Start ${globalPhase === 'qualifications' ? 'Quals'
                            : globalPhase === 'quarter_final' ? 'Quarter F'
                                : globalPhase === 'semi_final' ? 'Semi F'
                                    : globalPhase === 'final' ? 'Final' : 'Match'}`
                    }
                </button>
            )}
        </div>
    );
}
