"use client";

import { useState, useEffect } from 'react';
import { History, Activity } from 'lucide-react';
import ScoreHistoryView from '@/components/common/ScoreHistoryView';
import { getCompetitionState, syncEventDayStatusFromSupabase } from '@/lib/competitionState';
import RestrictionScreen from '@/components/common/RestrictionScreen';

export default function VisitorScorePage() {
    const [eventDayStarted, setEventDayStarted] = useState(getCompetitionState().eventDayStarted);

    useEffect(() => {
        const handleSync = () => {
            setEventDayStarted(getCompetitionState().eventDayStarted);
        };
        syncEventDayStatusFromSupabase().then(handleSync);
        window.addEventListener('competition-state-updated', handleSync);
        return () => window.removeEventListener('competition-state-updated', handleSync);
    }, []);

    if (!eventDayStarted) {
        return <RestrictionScreen />;
    }

    return (
        <div className="min-h-screen relative bg-transparent">
            {/* Background Decorative Element */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-role-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-role-secondary/10 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl relative z-10">
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-2xl shadow-role-primary/40 ring-1 ring-white/20">
                            <History className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none mb-2">
                                Official Scores
                            </h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <Activity size={14} className="text-role-primary" />
                                Verified Tournament Telemetry
                            </p>
                        </div>
                    </div>
                </div>

                <ScoreHistoryView isSentToTeamOnly={true} />
            </div>
        </div>
    );
}
