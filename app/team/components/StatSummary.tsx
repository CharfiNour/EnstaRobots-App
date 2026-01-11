"use client";

import { Trophy, Timer, Zap } from 'lucide-react';

interface StatSummaryProps {
    teamOrder: number;
    isLive: boolean;
    isMyTurn: boolean;
    isNext: boolean;
    profileComplete: boolean;
}

export default function StatSummary({ teamOrder, isLive, isMyTurn, isNext, profileComplete }: StatSummaryProps) {
    const stats = [
        {
            label: "Unit Order",
            value: `#${teamOrder || '--'}`,
            sub: "Deployment Seq",
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            label: "Mission Status",
            value: isMyTurn ? "ACTIVE" : (isNext ? "NEXT" : (isLive ? "QUEUED" : "STANDBY")),
            sub: isLive ? "Live Sync" : "Waiting for HQ",
            icon: Timer,
            color: isMyTurn ? "text-role-primary" : "text-blue-500",
            bg: isMyTurn ? "bg-role-primary/10" : "bg-blue-500/10"
        },
        {
            label: "Registry Sync",
            value: profileComplete ? "100%" : "40%",
            sub: profileComplete ? "Verified" : "Action Req",
            icon: Zap,
            color: profileComplete ? "text-emerald-500" : "text-rose-500",
            bg: profileComplete ? "bg-emerald-500/10" : "bg-rose-500/10"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-5 flex items-center gap-5 shadow-sm">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-foreground tracking-tighter italic whitespace-nowrap">{stat.value}</span>
                            <span className={`text-[10px] font-bold ${stat.color}`}>{stat.sub}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
