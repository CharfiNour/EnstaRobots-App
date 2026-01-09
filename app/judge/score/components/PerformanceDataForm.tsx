"use client";

import { motion } from 'framer-motion';
import { Info, Timer } from 'lucide-react';

interface PerformanceDataFormProps {
    isLineFollower: boolean;
    timeMinutes: string;
    setTimeMinutes: (v: string) => void;
    timeSeconds: string;
    setTimeSeconds: (v: string) => void;
    timeMillis: string;
    setTimeMillis: (v: string) => void;
    completedRoad: boolean;
    setCompletedRoad: (v: boolean) => void;
    homologationPoints: string;
    setHomologationPoints: (v: string) => void;
    knockouts: string;
    setKnockouts: (v: string) => void;
    judgePoints: string;
    setJudgePoints: (v: string) => void;
    damageScore: string;
    setDamageScore: (v: string) => void;
}

export default function PerformanceDataForm({
    isLineFollower,
    timeMinutes, setTimeMinutes,
    timeSeconds, setTimeSeconds,
    timeMillis, setTimeMillis,
    completedRoad, setCompletedRoad,
    homologationPoints, setHomologationPoints,
    knockouts, setKnockouts,
    judgePoints, setJudgePoints,
    damageScore, setDamageScore
}: PerformanceDataFormProps) {
    return (
        <div>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-tight">
                <Info size={18} className="text-accent" />
                Performance Data
            </h3>

            {isLineFollower ? (
                <div className="space-y-4">
                    {/* Time Input */}
                    <div className="bg-muted/30 p-6 rounded-2xl border border-card-border shadow-inner">
                        <label className="block text-[10px] font-black text-muted-foreground uppercase mb-4 text-center tracking-[0.25em] opacity-60">
                            Recorded Duration
                        </label>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center gap-1.5">
                                <input
                                    type="number"
                                    value={timeMinutes}
                                    onChange={e => setTimeMinutes(e.target.value)}
                                    placeholder="00"
                                    className="w-20 px-2 py-5 text-center text-3xl font-mono bg-background border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Min</span>
                            </div>
                            <span className="text-3xl font-black text-muted-foreground opacity-30 mt-[-20px]">:</span>
                            <div className="flex flex-col items-center gap-1.5">
                                <input
                                    type="number"
                                    value={timeSeconds}
                                    onChange={e => setTimeSeconds(e.target.value)}
                                    placeholder="00"
                                    className="w-20 px-2 py-5 text-center text-3xl font-mono bg-background border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Sec</span>
                            </div>
                            <span className="text-3xl font-black text-muted-foreground opacity-30 mt-[-20px]">:</span>
                            <div className="flex flex-col items-center gap-1.5">
                                <input
                                    type="number"
                                    value={timeMillis}
                                    onChange={e => setTimeMillis(e.target.value)}
                                    placeholder="000"
                                    className="w-20 px-2 py-4 text-center text-2xl font-mono bg-background border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-foreground shadow-sm"
                                />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 border border-card-border rounded-xl shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${completedRoad ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                    <Timer size={16} />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-wider ${completedRoad ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                    Road Complete
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompletedRoad(!completedRoad)}
                                className={`w-10 h-6 rounded-full relative transition-colors shadow-inner ${completedRoad ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <motion.div
                                    animate={{ x: completedRoad ? 20 : 3 }}
                                    className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md"
                                />
                            </button>
                        </div>

                        <div className="relative p-4 bg-muted/20 border border-card-border rounded-xl shadow-sm">
                            <input
                                type="number"
                                value={homologationPoints}
                                onChange={(e) => setHomologationPoints(e.target.value)}
                                placeholder="Homologation"
                                className="w-full bg-transparent focus:outline-none font-black text-base text-foreground"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase opacity-40">
                                PTS
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Knockouts</label>
                        <input
                            type="number"
                            value={knockouts}
                            onChange={(e) => setKnockouts(e.target.value)}
                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Judges</label>
                        <input
                            type="number"
                            value={judgePoints}
                            onChange={(e) => setJudgePoints(e.target.value)}
                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-mono">Damage</label>
                        <input
                            type="number"
                            value={damageScore}
                            onChange={(e) => setDamageScore(e.target.value)}
                            className="w-full px-4 py-4 bg-muted/20 border border-card-border rounded-2xl text-2xl font-black outline-none text-center text-foreground shadow-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
