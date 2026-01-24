"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Calendar, MapPin, Users,
    Edit3, Trash2, Check, X, Play,
    Save, Layout, Shield
} from 'lucide-react';
import { CompetitionListItem } from '../types';
import { getCompetitionState, updateCompetitionState } from '@/lib/competitionState';

import { PHASES } from '../services/competitionService';

import { CATEGORY_PHASES } from '@/lib/constants';
import { getTeams, Team } from '@/lib/teams';

interface CompetitionCardProps {
    comp: CompetitionListItem;
    index: number;
    onUpdate?: (comp: CompetitionListItem) => void;
}

export default function CompetitionCard({ comp, index, onUpdate }: CompetitionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedComp, setEditedComp] = useState<CompetitionListItem>(comp);
    const [compState, setCompState] = useState(getCompetitionState());
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleStateUpdate = () => {
            const state = getCompetitionState();
            setCompState(state);

            const session = state.liveSessions?.[comp.category];

            if (session) {
                const teams = getTeams();
                const team = teams.find(t => t.id === session.teamId);
                setActiveTeam(team || null);
            } else {
                setActiveTeam(null);
            }
        };

        handleStateUpdate();

        // Listen for internal events (same tab)
        window.addEventListener('competition-state-updated', handleStateUpdate);
        window.addEventListener('competitions-updated', handleStateUpdate);

        // Listen for storage events (different tabs)
        window.addEventListener('storage', (e) => {
            if (
                e.key === 'enstarobots_competition_state_v1' ||
                e.key === 'enstarobots_teams_v1' ||
                e.key === 'enstarobots_competitions_v1'
            ) {
                handleStateUpdate();
            }
        });

        return () => {
            window.removeEventListener('competition-state-updated', handleStateUpdate);
            window.removeEventListener('competitions-updated', handleStateUpdate);
            window.removeEventListener('storage', handleStateUpdate);
        };
    }, [comp.category]);

    // Check if THIS specific competition is the one currently live using the session map
    const isActuallyLive = !!compState.liveSessions?.[comp.category];

    // Synchronize phase with jury's phase if live
    const getLivePhaseLabel = () => {
        const session = compState.liveSessions?.[comp.category];
        if (!session?.phase) return editedComp.status;

        const allPhases = [...(CATEGORY_PHASES.line || []), ...(CATEGORY_PHASES.standard || []), ...(CATEGORY_PHASES.fight || [])];
        const match = allPhases.find(p => p === session.phase);
        if (match) return match;
        // Fallback for custom/legacy phases
        return session.phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const displayPhase = isActuallyLive ? getLivePhaseLabel() : editedComp.status;

    // Determine phase options
    const currentPhases = comp.category.includes('line') ? PHASES.line : PHASES.standard;

    const handleSave = () => {
        if (onUpdate) onUpdate(editedComp);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedComp(comp);
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 md:p-8 rounded-xl border backdrop-blur-sm transition-all bg-gradient-to-br ${comp.color} ${comp.borderColor} shadow-md relative group`}
        >
            {/* Admin Toolbar (Matching Visitor Cards) */}
            <div className="absolute top-6 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2.5 bg-white text-slate-900 rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                        <Edit3 size={16} />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleSave}
                            className="p-2.5 bg-accent text-slate-900 rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                            <Save size={16} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-2.5 bg-rose-500 text-white rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                            <X size={16} />
                        </button>
                    </>
                )}
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedComp.title}
                                onChange={(e) => setEditedComp({ ...editedComp, title: e.target.value })}
                                className="text-2xl md:text-3xl font-bold bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-accent w-full max-w-md shadow-inner"
                            />
                        ) : (
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-accent transition-colors">
                                {comp.title}
                            </h2>
                        )}

                        {mounted && isActuallyLive && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                                <span className="text-red-400 font-semibold text-[10px] uppercase tracking-wider">Live</span>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <textarea
                            value={editedComp.description}
                            onChange={(e) => setEditedComp({ ...editedComp, description: e.target.value })}
                            className="text-muted-foreground leading-relaxed bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full outline-none focus:border-accent min-h-[80px] text-sm"
                        />
                    ) : (
                        <p className="text-muted-foreground leading-relaxed font-medium opacity-60 max-w-2xl">{comp.description}</p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="px-6 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                        <span className="font-black text-foreground uppercase text-[11px] tracking-[0.1em] relative z-10">
                            {isEditing ? (
                                <select
                                    value={editedComp.status}
                                    onChange={(e) => setEditedComp({ ...editedComp, status: e.target.value })}
                                    className="bg-transparent border-none outline-none text-foreground font-bold w-32 cursor-pointer appearance-none text-center"
                                >
                                    {currentPhases.map(phase => (
                                        <option key={phase} value={phase} className="bg-slate-900 text-white">
                                            {phase}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                mounted ? displayPhase : editedComp.status
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <EditableStatItem
                    icon={Users}
                    label="Teams"
                    value={editedComp.totalTeams.toString()}
                    isEditing={isEditing}
                    onChange={(val) => setEditedComp({ ...editedComp, totalTeams: parseInt(val) || 0 })}
                />
                <EditableStatItem
                    icon={Trophy}
                    label="Matches"
                    value={editedComp.totalMatches.toString()}
                    isEditing={isEditing}
                    onChange={(val) => setEditedComp({ ...editedComp, totalMatches: parseInt(val) || 0 })}
                />
                <EditableStatItem
                    icon={MapPin}
                    label="Arena"
                    value={editedComp.arena}
                    isEditing={isEditing}
                    onChange={(val) => setEditedComp({ ...editedComp, arena: val })}
                />
                <EditableStatItem
                    icon={Calendar}
                    label="Schedule"
                    value={editedComp.schedule}
                    isEditing={isEditing}
                    onChange={(val) => setEditedComp({ ...editedComp, schedule: val })}
                />
            </div>
        </motion.div>
    );
}

interface EditableStatItemProps {
    icon: any;
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (val: string) => void;
}

function EditableStatItem({ icon: Icon, label, value, isEditing, onChange }: EditableStatItemProps) {
    return (
        <div className={`flex items-center gap-3 p-3 bg-muted/40 rounded-lg border transition-all ${isEditing ? 'border-accent shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.1)]' : 'border-card-border/50'}`}>
            <Icon className={`w-5 h-5 ${isEditing ? 'text-accent' : 'text-accent/60'}`} />
            <div className="min-w-0 flex-1">
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{label}</div>
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="font-bold text-foreground bg-transparent border-none outline-none w-full text-sm"
                        autoFocus
                    />
                ) : (
                    <div className="font-bold text-foreground truncate text-sm">{value}</div>
                )}
            </div>
        </div>
    );
}
