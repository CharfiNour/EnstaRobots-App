"use client";

import { Shield, ChevronDown, Info } from 'lucide-react';
import { Team } from '@/lib/teams';
import { TeamScoreEntry } from '../types';

interface TeamSelectSectionProps {
    isLineFollower: boolean;
    teams: TeamScoreEntry[];
    handleTeamChange: (index: number, field: string, value: string) => void;
    competitionTeams: Team[];
    globalPhase: string;
    setGlobalPhase: (v: string) => void;
    numberOfTeams: number;
    setNumberOfTeams: (v: number) => void;
    isPhaseSubmitted: (teamId: string, phase: string) => boolean;
    PHASES_LINE_FOLLOWER: { value: string; label: string }[];
    PHASES_DEFAULT: { value: string; label: string }[];
    STATUS_OPTIONS: { value: string; label: string; color: string }[];
}

export default function TeamSelectSection({
    isLineFollower,
    teams,
    handleTeamChange,
    competitionTeams,
    globalPhase,
    setGlobalPhase,
    numberOfTeams,
    setNumberOfTeams,
    isPhaseSubmitted,
    PHASES_LINE_FOLLOWER,
    PHASES_DEFAULT,
    STATUS_OPTIONS
}: TeamSelectSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                    <Shield size={18} className="text-accent" />
                    Teams & Competition Phases
                </h2>
                {!isLineFollower && (
                    <div className="flex gap-2">
                        <div className="flex items-center bg-muted/50 border border-card-border rounded-lg px-2 py-1 gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Phase</span>
                            <select
                                value={globalPhase}
                                onChange={(e) => setGlobalPhase(e.target.value)}
                                className="bg-transparent text-xs font-black text-accent outline-none cursor-pointer"
                            >
                                {PHASES_DEFAULT.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center bg-muted/50 border border-card-border rounded-lg px-2 py-1 gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Count</span>
                            <select
                                value={numberOfTeams}
                                onChange={(e) => setNumberOfTeams(parseInt(e.target.value))}
                                className="bg-transparent text-xs font-black text-foreground outline-none cursor-pointer"
                            >
                                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Teams</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-3">
                {teams.map((team, index) => {
                    const phaseToCheck = isLineFollower ? team.phase : globalPhase;
                    const hasSubmitted = isPhaseSubmitted(team.id, phaseToCheck!);

                    return (
                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 rounded-xl bg-muted/20 border border-card-border group transition-all hover:bg-muted/40 shadow-sm">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 block tracking-wider">
                                    {isLineFollower ? 'Robot Name' : `Team ${index + 1} Robot`}
                                </label>
                                <div className="relative">
                                    <select
                                        value={team.id}
                                        onChange={(e) => handleTeamChange(index, 'id', e.target.value)}
                                        className={`w-full px-3 py-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-bold text-foreground appearance-none cursor-pointer ${hasSubmitted ? 'border-red-500 dark:border-red-400' : 'border-card-border'}`}
                                        required
                                    >
                                        <option value="">Select Robot...</option>
                                        {competitionTeams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                {hasSubmitted && (
                                    <div className="text-[9px] font-bold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                                        <Info size={8} /> Already submitted for {phaseToCheck?.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>
                            <div className="md:w-48 px-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 block tracking-wider">
                                    {isLineFollower ? 'Attempt Phase' : 'Match Outcome'}
                                </label>
                                {isLineFollower ? (
                                    <select
                                        value={team.phase}
                                        onChange={(e) => handleTeamChange(index, 'phase', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-black text-accent cursor-pointer"
                                    >
                                        {PHASES_LINE_FOLLOWER.map(p => {
                                            const isSubmitted = isPhaseSubmitted(team.id, p.value);
                                            return (
                                                <option
                                                    key={p.value}
                                                    value={p.value}
                                                    disabled={isSubmitted}
                                                >
                                                    {p.label}{isSubmitted ? ' (Submitted)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <select
                                        value={team.status}
                                        onChange={(e) => handleTeamChange(index, 'status', e.target.value)}
                                        className={`w-full px-3 py-2.5 bg-background border border-card-border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm font-black uppercase cursor-pointer ${STATUS_OPTIONS.find(o => o.value === team.status)?.color
                                            }`}
                                    >
                                        {STATUS_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value} className={o.color}>{o.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
