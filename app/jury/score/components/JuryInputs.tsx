"use client";

import { User } from 'lucide-react';

interface JuryInputsProps {
    jury1: string;
    setJury1: (v: string) => void;
    jury2: string;
    setJury2: (v: string) => void;
    availableJuries?: string[];
    role?: string;
    isGlobalClearance?: boolean;
}

const InputField = ({
    label,
    value,
    setValue,
    availableJuries
}: {
    label: string,
    value: string,
    setValue: (v: string) => void,
    availableJuries?: string[]
}) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1">
            <User size={12} className="text-accent" />
            {label}
        </label>
        {availableJuries && availableJuries.length > 0 ? (
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium appearance-none cursor-pointer hover:bg-muted/50 transition-colors"
                    required
                >
                    <option value="" disabled>Select Official Jury</option>
                    {availableJuries.map((name) => (
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
                placeholder="Enter jury name"
                className="w-full px-4 py-2.5 bg-muted/30 border border-card-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-medium"
                required
            />
        )}
    </div>
);

export default function JuryInputs({ jury1, setJury1, jury2, setJury2, availableJuries, role, isGlobalClearance }: JuryInputsProps) {
    const displayRole = (role || 'jury').replace(/_/g, ' ').toUpperCase();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row items-end gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-card-border shadow-sm">
                {/* Designation Node (Jury 1) */}
                <div className="flex-1 w-full space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-2 opacity-50">
                        Designation Node
                    </label>
                    <div className="relative group">
                        {availableJuries && availableJuries.length > 0 ? (
                            <select
                                value={jury1}
                                onChange={(e) => setJury1(e.target.value)}
                                className="w-full px-6 py-4 bg-muted/20 border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-black uppercase tracking-widest appearance-none cursor-pointer hover:bg-muted/30 transition-all"
                            >
                                <option value="" disabled>Enter Operator Name</option>
                                {availableJuries.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={jury1}
                                onChange={(e) => setJury1(e.target.value)}
                                placeholder="ENTER OPERATOR NAME"
                                className="w-full px-6 py-4 bg-muted/20 border border-card-border rounded-2xl focus:ring-2 focus:ring-accent outline-none text-sm text-foreground font-black uppercase tracking-widest placeholder:opacity-30"
                            />
                        )}
                    </div>
                </div>

                {/* Security Protocol & Sector */}
                <div className="w-full lg:w-auto space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-2 opacity-50">
                        Security Protocol & Sector
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="px-6 py-4 bg-white border border-card-border rounded-2xl shadow-sm flex items-center justify-center min-w-[180px]">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest whitespace-nowrap">
                                {displayRole}
                            </span>
                        </div>
                        <div className={`px-6 py-4 bg-transparent border-2 border-dashed border-card-border rounded-2xl flex items-center justify-center min-w-[180px] ${isGlobalClearance ? 'border-accent/40' : 'opacity-50'}`}>
                            <span className={`text-[10px] font-black italic uppercase tracking-widest whitespace-nowrap ${isGlobalClearance ? 'text-accent' : 'text-muted-foreground'}`}>
                                Clearance: {isGlobalClearance ? 'Global' : 'Sector'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* If it's a standard jury with 2 members, show the second input below or modify the layout */}
            {role === 'jury' && (
                <div className="flex flex-col lg:flex-row items-end gap-4 bg-white/20 backdrop-blur-sm p-4 rounded-[2rem] border border-card-border/50">
                    <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-2 opacity-40">
                            Secondary Operative
                        </label>
                        <input
                            type="text"
                            value={jury2}
                            onChange={(e) => setJury2(e.target.value)}
                            placeholder="OPERATOR 2 NAME (OPTIONAL)"
                            className="w-full px-5 py-3 bg-muted/10 border border-card-border/40 rounded-xl focus:ring-1 focus:ring-accent/50 outline-none text-[11px] text-foreground font-black uppercase tracking-widest placeholder:opacity-20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
