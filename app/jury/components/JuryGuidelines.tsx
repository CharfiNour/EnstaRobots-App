"use client";

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { JuryDashboardData } from '../types';

interface JuryGuidelinesProps {
    guidelines: JuryDashboardData['guidelines'];
}

export default function JuryGuidelines({ guidelines }: JuryGuidelinesProps) {
    return (
        <div className="bg-card/40 backdrop-blur-xl border border-card-border rounded-[2rem] p-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-role-primary/10 text-role-primary flex items-center justify-center">
                    <BookOpen size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight italic">Protocol Directives</h3>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Standard Operating Procedures</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                {guidelines.map((guideline, index) => (
                    <div key={index} className="flex gap-2 group">
                        <span className="text-role-primary font-black text-[10px] group-hover:translate-x-0.5 transition-transform duration-300 mt-0.5">›</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed font-medium">{guideline}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
