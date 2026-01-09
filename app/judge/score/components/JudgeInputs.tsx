"use client";

import { User } from 'lucide-react';

interface JudgeInputsProps {
    judge1: string;
    setJudge1: (v: string) => void;
    judge2: string;
    setJudge2: (v: string) => void;
}

export default function JudgeInputs({ judge1, setJudge1, judge2, setJudge2 }: JudgeInputsProps) {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
                    <User size={12} className="text-accent" />
                    Judge 1 Full Name
                </label>
                <input
                    type="text"
                    value={judge1}
                    onChange={(e) => setJudge1(e.target.value)}
                    placeholder="Enter judge name"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                    required
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
                    <User size={12} className="text-accent" />
                    Judge 2 Full Name
                </label>
                <input
                    type="text"
                    value={judge2}
                    onChange={(e) => setJudge2(e.target.value)}
                    placeholder="Enter judge name"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                    required
                />
            </div>
        </div>
    );
}
