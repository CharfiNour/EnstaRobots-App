"use client";

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Team } from '@/lib/teams';
import { LiveBadge } from '@/components/common/LiveBadge';
import { getCategoryMetadata } from '@/lib/constants';

interface TeamSidebarProps {
    teams: Team[];
    selectedTeamId: string | undefined;
    onSelect: (team: Team) => void;
    loading: boolean;
    category: string;
    liveTeamId?: string | null;
}

export function TeamSidebar({ teams, selectedTeamId, onSelect, loading, category, liveTeamId }: TeamSidebarProps) {
    const [mounted, setMounted] = useState(false);
    const metadata = getCategoryMetadata(category);

    useEffect(() => {
        setMounted(true);
    }, []);
    const colorMatch = metadata?.color?.match(/from-([\w-]+)/);
    const baseColor = colorMatch ? colorMatch[1] : 'accent';
    const themeColor = `text-${baseColor}`;
    const themeBorder = `border-${baseColor}`;

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-muted rounded-xl w-full" />
                ))}
            </div>
        );
    }

    const sortedTeams = [...teams].sort((a, b) => {
        if (a.id === liveTeamId) return -1;
        if (b.id === liveTeamId) return 1;
        return 0;
    });

    return (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 no-scrollbar">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2`}>
                    <Shield className={`w-3.5 h-3.5 ${themeColor}/60`} />
                    Deployment Roster
                </h3>
                <span className={`text-[10px] font-mono ${themeColor} bg-${baseColor}/10 px-2 py-0.5 rounded border border-${baseColor}/20`}>
                    {teams.length} ACTIVE UNITS
                </span>
            </div>

            {sortedTeams.map((team) => (
                <button
                    key={team.id}
                    onClick={() => onSelect(team)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-5 group relative overflow-hidden ${selectedTeamId === team.id
                        ? `bg-${baseColor}/5 ${themeBorder} shadow-[0_0_30px_rgba(var(--accent-rgb),0.05)]`
                        : `bg-white/60 border-card-border hover:${themeBorder}/20 hover:bg-white/80 shadow-sm`
                        }`}
                >
                    {mounted && liveTeamId === team.id && (
                        <div className="absolute top-2 right-2 z-10 scale-75 origin-top-right">
                            <LiveBadge />
                        </div>
                    )}

                    <div className="w-14 h-14 rounded-xl bg-white flex-shrink-0 overflow-hidden border border-card-border shadow-md group-hover:scale-105 transition-transform duration-500">
                        {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                <Shield size={24} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                        <div className={`font-black uppercase text-sm tracking-tight truncate transition-colors ${selectedTeamId === team.id ? themeColor : 'text-foreground group-hover:' + themeColor}`}>
                            {team.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
                            <span className={`${themeColor} truncate max-w-[120px]`}>{team.club}</span>
                            {team.university && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                    <span className="text-muted-foreground truncate">{team.university}</span>
                                </>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
