"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { Team } from '@/lib/teams';
import { supabase } from '@/lib/supabase';

interface DrawSystemProps {
    competitionId: string;
    phase: string;
    eligibleTeams: Team[];
    onDrawComplete: () => void;
    matchSize: number;
}

interface ScorePayload {
    team_id: string;
    competition_id: string;
    phase: string;
    match_id: string;
    status: string;
    total_points: number;
    is_sent_to_team: boolean;
    created_at: string;
}

export default function DrawSystem({
    competitionId,
    phase,
    eligibleTeams,
    onDrawComplete,
    matchSize
}: DrawSystemProps) {
    const [drawing, setDrawing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [complete, setComplete] = useState(false);

    const startDraw = async () => {
        if (eligibleTeams.length === 0) return;
        setDrawing(true);
        setCountdown(3);
    };

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            performDraw();
        }
    }, [countdown]);

    const performDraw = async () => {
        setCountdown(null);
        const payloads: ScorePayload[] = [];

        try {
            // Intelligent Matching: Avoid same club
            // 1. Group by club
            const clubMap: Record<string, Team[]> = {};
            eligibleTeams.forEach(t => {
                // If no club, treat as a unique club to maximize separation
                const c = t.club && typeof t.club === 'string' && t.club.trim() !== '' ? t.club : `unique-${t.id}`;
                if (!clubMap[c]) clubMap[c] = [];
                clubMap[c].push(t);
            });

            // 2. Shuffle each club's teams
            Object.values(clubMap).forEach(teams => {
                teams.sort(() => Math.random() - 0.5);
            });

            // 3. Interleave to separate club members
            const interleaved: Team[] = [];
            const clubNames = Object.keys(clubMap).sort(() => Math.random() - 0.5);
            let maxCount = Math.max(...Object.values(clubMap).map(ts => ts.length));

            for (let i = 0; i < maxCount; i++) {
                clubNames.forEach(c => {
                    if (clubMap[c][i]) interleaved.push(clubMap[c][i]);
                });
            }

            // 4. Create Match Payloads
            const matchCount = Math.ceil(interleaved.length / matchSize);

            for (let i = 0; i < matchCount; i++) {
                const matchId = `match-${Date.now()}-${i}`;
                const matchTeams = interleaved.slice(i * matchSize, (i + 1) * matchSize);

                matchTeams.forEach(team => {
                    payloads.push({
                        team_id: team.id,
                        competition_id: competitionId,
                        phase: phase,
                        match_id: matchId,
                        status: 'pending',
                        total_points: 0,
                        is_sent_to_team: false,
                        created_at: new Date().toISOString()
                    });
                });
            }

            // 5. Push to Supabase
            const { error } = await supabase.from('scores').insert(payloads as any);
            if (error) throw error;

            setComplete(true);
            setTimeout(() => {
                onDrawComplete();
            }, 1800);

        } catch (err: any) {
            console.error("--- DRAW SYSTEM FATAL ERROR ---");
            console.error("Payload count:", payloads.length);
            console.error("Error Object:", err);
            console.error("Message:", err?.message || "Unknown error");
            console.error("Details:", err?.details || "No details");
            setDrawing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AnimatePresence mode="wait">
                {!drawing && !complete ? (
                    <motion.div
                        key="start"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
                            <Target size={120} className="text-accent mx-auto relative z-10 animate-pulse" />
                        </div>

                        <div>
                            <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tight mb-2">
                                Tournament Draw System
                            </h2>
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm opacity-60">
                                {phase} • {eligibleTeams.length} Qualified Units Detected
                            </p>
                        </div>

                        {eligibleTeams.length < 2 ? (
                            <div className="flex items-center gap-3 px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 font-bold max-w-md mx-auto">
                                <ShieldAlert size={20} />
                                <span>Insufficient teams to generate a draw ({eligibleTeams.length}/2)</span>
                            </div>
                        ) : (
                            <button
                                onClick={startDraw}
                                className="group relative px-12 py-5 bg-accent text-slate-950 font-black uppercase italic tracking-widest text-xl rounded-full overflow-hidden shadow-[0_20px_50px_rgba(var(--color-accent-rgb),0.3)] hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="relative z-10">Generate Phase Draw</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                        )}
                    </motion.div>
                ) : countdown !== null ? (
                    <motion.div
                        key="countdown"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-accent/40 blur-[120px] rounded-full" />
                        <motion.span
                            key={countdown}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[12rem] font-black italic text-accent drop-shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.5)] leading-none"
                        >
                            {countdown === 0 ? 'GO' : countdown}
                        </motion.span>
                    </motion.div>
                ) : drawing && !complete ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <Loader2 size={80} className="text-accent animate-spin mx-auto" />
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-wider italic">
                            Analyzing Club Ties & Deploying Groups...
                        </h3>
                    </motion.div>
                ) : (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="relative">
                            <Sparkles size={100} className="text-green-500 mx-auto" strokeWidth={3} />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-2"
                            >
                                <CheckCircle size={40} />
                            </motion.div>
                        </div>

                        <div>
                            <h2 className="text-5xl font-black text-green-500 uppercase italic tracking-tighter mb-2">
                                The Matches Are Set
                            </h2>
                            <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">
                                All units have been assigned to tactical group cards
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
