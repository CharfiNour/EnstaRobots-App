import { motion } from 'framer-motion';
import { Info, Timer, Trophy, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import LineFollowerScoreDialog from './LineFollowerScoreDialog';

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
    juryPoints: string;
    setJuryPoints: (v: string) => void;
    damageScore: string;
    setDamageScore: (v: string) => void;
    competitionType: string;
    detailedScores: Record<string, number>;
    setDetailedScores: (v: Record<string, number>) => void;
}

export default function PerformanceDataForm({
    isLineFollower,
    timeMinutes, setTimeMinutes,
    timeSeconds, setTimeSeconds,
    timeMillis, setTimeMillis,
    completedRoad, setCompletedRoad,
    homologationPoints, setHomologationPoints,
    competitionType,
    detailedScores,
    setDetailedScores
}: PerformanceDataFormProps) {
    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const showPerformanceForm = isLineFollower;

    const handleSaveDetailedScores = (scores: Record<string, number>) => {
        setDetailedScores(scores);
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        setHomologationPoints(total.toString());
    };

    return (
        <div>
            {showPerformanceForm && (
                <>
                    <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-tight">
                        <Info size={18} className="text-accent" />
                        Performance Data
                    </h3>

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

                            <div className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => setIsScoreOpen(true)}
                                    className="w-full flex items-center justify-between p-4 bg-muted/20 border border-card-border rounded-xl shadow-sm group hover:bg-accent/10 hover:border-accent/30 transition-all font-black"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
                                            <Trophy size={16} />
                                        </div>
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground group-hover:text-accent">
                                            Score
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black italic text-foreground">
                                            {homologationPoints || '0'} <span className="text-[10px] not-italic opacity-40 uppercase">Pts</span>
                                        </span>
                                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <LineFollowerScoreDialog
                            isOpen={isScoreOpen}
                            onClose={() => setIsScoreOpen(false)}
                            currentScores={detailedScores}
                            onSave={handleSaveDetailedScores}
                            competitionType={competitionType}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
