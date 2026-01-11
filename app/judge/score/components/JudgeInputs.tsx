"use client";

import { User } from 'lucide-react';

interface JudgeInputsProps {
    judge1: string;
    setJudge1: (v: string) => void;
    judge2: string;
    setJudge2: (v: string) => void;
    availableJudges?: string[];
}

export default function JudgeInputs({ judge1, setJudge1, judge2, setJudge2, availableJudges }: JudgeInputsProps) {
    const InputField = ({ label, value, setValue }: { label: string, value: string, setValue: (v: string) => void }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
                <User size={12} className="text-accent" />
                {label}
            </label>
            {availableJudges && availableJudges.length > 0 ? (
                <div className="relative">
                    <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium appearance-none cursor-pointer hover:bg-muted/50 transition-colors"
                        required
                    >
                        <option value="" disabled>Select Official Judge</option>
                        {availableJudges.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter judge name"
                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                    required
                />
            )}
        </div>
    );

    return (
        <div className="grid md:grid-cols-2 gap-4">
            <InputField label="Judge 1 Full Name" value={judge1} setValue={setJudge1} />
            <InputField label="Judge 2 Full Name" value={judge2} setValue={setJudge2} />
        </div>
    );
}
