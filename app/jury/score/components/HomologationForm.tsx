"use client";

import { motion } from 'framer-motion';
import { Info, Settings, Zap, Cpu, Shield, Gamepad2, FileText } from 'lucide-react';

interface HomologationFormProps {
    competitionType: string;
    homologationScores: Record<string, number>;
    setHomologationScores: (v: Record<string, number>) => void;
    remarks: string;
    setRemarks: (v: string) => void;
}

export default function HomologationForm({
    competitionType,
    homologationScores,
    setHomologationScores,
    remarks,
    setRemarks
}: HomologationFormProps) {
    const handleScoreChange = (field: string, value: string) => {
        const val = parseInt(value) || 0;
        setHomologationScores({
            ...homologationScores,
            [field]: val
        });
    };

    const fields = [
        { id: 'conception_mecanique', label: 'Mechanical Design', icon: <Settings size={16} />, max: 10 },
        { id: 'conception_electrique', label: 'Electrical Design', icon: <Zap size={16} />, max: 10 },
        { id: 'carte_puissance', label: 'Power Board', icon: <Cpu size={16} />, max: 10 },
        { id: 'carte_commande', label: 'Control Board', icon: <Cpu size={16} />, max: 10 },
    ];
    const totalScore = Object.values(homologationScores).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                    <FileText size={18} className="text-accent" />
                    Homologation Score
                </h3>
                <div className="px-3 py-1 bg-accent/20 rounded-lg border border-accent/30">
                    <span className="text-xs font-black text-accent uppercase">
                        Total {totalScore} / 40
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-70">
                                {field.icon}
                                {field.label}
                            </label>
                            <span className="text-[10px] font-bold text-muted-foreground opacity-40">Max {field.max}</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max={field.max}
                                value={homologationScores[field.id] || ''}
                                onChange={(e) => handleScoreChange(field.id, e.target.value)}
                                className="w-full px-4 py-3 bg-muted/20 border border-card-border rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-accent/50 transition-all text-foreground"
                                placeholder="0"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 opacity-70">Remarks</label>
                <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/20 border border-card-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/50 transition-all text-foreground resize-none"
                    placeholder="Enter technical remarks..."
                />
            </div>
        </div>
    );
}
