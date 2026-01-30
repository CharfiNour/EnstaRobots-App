"use client";

import { User } from 'lucide-react';

interface JuryInputsProps {
    jury1: string;
    setJury1: (v: string) => void;
    jury2: string;
    setJury2: (v: string) => void;
    jury3: string;
    setJury3: (v: string) => void;
    availableJuries?: string[];
    role?: string;
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
    <div className="space-y-1.5 flex flex-col">
        <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest pl-1 min-h-[32px] leading-tight">
            <User size={12} className="text-accent shrink-0" />
            <span>{label}</span>
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

export default function JuryInputs({ jury1, setJury1, jury2, setJury2, jury3, setJury3, availableJuries, role }: JuryInputsProps) {
    return (
        <div className="grid md:grid-cols-3 gap-4">
            <InputField
                label="Jury 1 (Main Official)"
                value={jury1}
                setValue={setJury1}
                availableJuries={availableJuries}
            />
            <InputField
                label="Jury 2 (Secondary Official)"
                value={jury2}
                setValue={setJury2}
                availableJuries={availableJuries}
            />
            <InputField
                label="Jury 3 (Secondary Official)"
                value={jury3}
                setValue={setJury3}
                availableJuries={availableJuries}
            />
        </div>
    );
}
