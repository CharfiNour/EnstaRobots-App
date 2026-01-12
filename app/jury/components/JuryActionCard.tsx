"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JuryActionCardProps } from '../types';

export default function JuryActionCard({
    href,
    icon: Icon,
    title,
    description,
    isPrimary = false,
}: JuryActionCardProps) {
    return (
        <Link href={href} className="group">
            <div className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer h-full relative overflow-hidden ${isPrimary
                ? 'bg-role-primary/10 border-role-primary/30 shadow-xl shadow-role-primary/10'
                : 'bg-card/40 backdrop-blur-xl border-card-border hover:border-role-primary/30'
                }`}>

                {isPrimary && (
                    <div className="absolute top-0 right-0 w-48 h-48 bg-role-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-role-primary/20 transition-colors duration-700"></div>
                )}

                <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 ${isPrimary
                        ? 'bg-role-primary text-white shadow-lg shadow-role-primary/40 group-hover:scale-110'
                        : 'bg-muted text-muted-foreground group-hover:bg-role-primary/10 group-hover:text-role-primary'
                        }`}>
                        <Icon size={24} />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight">{title}</h3>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-500 group-hover:translate-x-1 ${isPrimary ? 'text-role-primary' : 'text-muted-foreground opacity-50'}`} />
                    </div>

                    <p className="text-muted-foreground font-medium text-xs leading-relaxed max-w-[220px] opacity-80">{description}</p>

                    {isPrimary && (
                        <div className="mt-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-role-primary animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-role-primary tracking-widest">Active Ops</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
