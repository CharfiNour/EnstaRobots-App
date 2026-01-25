"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Check, X, Trash2, ChevronDown, Shield
} from 'lucide-react';
import { Team, generateClubSlots } from '@/lib/teams';
import { upsertTeamToSupabase, deleteTeamFromSupabase, fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { supabase } from '@/lib/supabase';

interface TeamsCodesTabProps {
    teams: Team[];
    setTeams: (teams: Team[]) => void;
}

export default function TeamsCodesTab({ teams, setTeams }: TeamsCodesTabProps) {
    const [selectedClub, setSelectedClub] = useState('all');
    const [newClubName, setNewClubName] = useState('');
    const [showSlotsInput, setShowSlotsInput] = useState(false);
    const [newTeamCount, setNewTeamCount] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);

    // Fetch competitions from database
    useEffect(() => {
        const fetchCompetitions = async () => {
            const { data } = await supabase
                .from('competitions')
                .select('id, name, type')
                .order('name');

            if (data) {
                // Map to the format the UI expects
                const mapped = data.map((c: any) => ({
                    id: c.id, // UUID
                    name: c.name,
                    type: c.type,
                    color: getCompetitionColor(c.name)
                }));
                setCompetitions(mapped);
            }
        };
        fetchCompetitions();
    }, []);

    // Helper to assign colors based on competition name
    const getCompetitionColor = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('junior') && lower.includes('line')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (lower.includes('junior') && lower.includes('terrain')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
        if (lower.includes('line')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (lower.includes('terrain')) return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        if (lower.includes('fight')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    const refreshTeams = async () => {
        const updated = await fetchTeamsFromSupabase();
        setTeams(updated);
    };

    const handleConfirmSlots = async () => {
        if (newTeamCount < 1) return;
        if (isSubmitting) return;

        const exists = teams.some(t => t.club.toLowerCase() === newClubName.trim().toLowerCase());
        if (exists) {
            setErrorMessage('This club already exists.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setIsSubmitting(true);
        try {
            const newTeams = generateClubSlots(newClubName.trim(), newTeamCount);

            // Save all new teams to Supabase
            await Promise.all(newTeams.map(t => upsertTeamToSupabase(t)));

            await refreshTeams();
            setNewClubName('');
            setShowSlotsInput(false);
            setNewTeamCount(1);
        } catch (error: any) {
            alert('Failed to create club: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddSlotToClub = async (clubName: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const newTeams = generateClubSlots(clubName, 1);

            // Save to Supabase
            await Promise.all(newTeams.map(t => upsertTeamToSupabase(t)));

            await refreshTeams();
        } catch (error: any) {
            alert('Failed to add slot: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (confirm('Are you sure you want to remove this slot?')) {
            await deleteTeamFromSupabase(id);
            await refreshTeams();
        }
    };

    const handleDeleteClub = async (clubName: string) => {
        if (confirm(`Are you sure you want to delete the whole club "${clubName}"?`)) {
            const clubTeams = teams.filter(t => t.club === clubName);
            await Promise.all(clubTeams.map(t => deleteTeamFromSupabase(t.id)));
            await refreshTeams();
        }
    };

    const groupedTeams = teams.reduce((acc, team) => {
        const club = team.club || 'Individual / Unassigned';
        if (!acc[club]) acc[club] = [];
        acc[club].push(team);
        return acc;
    }, {} as Record<string, Team[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-card-border pb-6 gap-4">
                <h2 className="text-xl font-bold italic shrink-0">REGISTRATION CODES</h2>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    {/* Club Selector */}
                    <div className="relative min-w-[200px] max-w-[300px]">
                        <select
                            value={selectedClub}
                            onChange={(e) => setSelectedClub(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-muted/50 border border-card-border rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer text-foreground/80"
                        >
                            <option value="all">All Clubs</option>
                            {Object.keys(groupedTeams).sort().map(club => (
                                <option key={club} value={club}>{club}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>

                    {!showSlotsInput ? (
                        <button
                            onClick={() => setShowSlotsInput(true)}
                            className="flex items-center justify-center w-10 h-10 bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg transition-all active:scale-95"
                            title="Add New Club"
                        >
                            <Plus size={20} />
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-2 items-center bg-card p-1.5 border border-card-border rounded-xl shadow-xl"
                        >
                            <input
                                type="text"
                                value={newClubName}
                                onChange={(e) => setNewClubName(e.target.value)}
                                placeholder="CLUB NAME"
                                className="w-32 px-3 py-2 bg-muted/50 border border-card-border rounded-lg text-xs font-bold outline-none placeholder:opacity-50"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmSlots()}
                            />
                            <div className="flex items-center gap-1 bg-muted/50 border border-card-border rounded-lg px-2">
                                <span className="text-[10px] font-black opacity-30">QTY:</span>
                                <input
                                    type="number"
                                    value={newTeamCount}
                                    onChange={(e) => setNewTeamCount(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="50"
                                    className="w-10 py-2 bg-transparent text-xs font-bold outline-none text-center"
                                />
                            </div>
                            <div className="flex gap-1 ml-1">
                                <button
                                    onClick={handleConfirmSlots}
                                    disabled={isSubmitting || !newClubName.trim()}
                                    className="p-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => setShowSlotsInput(false)}
                                    className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            {errorMessage && (
                                <div className="absolute top-full right-0 text-[9px] text-red-500 font-black mt-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 whitespace-nowrap">
                                    {errorMessage}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {Object.entries(groupedTeams)
                    .filter(([club]) => selectedClub === 'all' || club === selectedClub)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([club, clubTeams]) => (
                        <div key={club} className="space-y-5">
                            <div className="flex items-center gap-4 py-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-2 rounded-xl">
                                <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                                    <Shield size={18} className="text-accent" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-lg tracking-tight uppercase italic text-foreground/90 leading-none">{club}</h3>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-40 mt-1.5">{clubTeams.length} Active Nodes</span>
                                </div>
                                <div className="h-px bg-card-border flex-1 ml-2 opacity-30" />
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleAddSlotToClub(club)} className="text-[10px] font-bold uppercase text-accent/80 bg-accent/5 px-4 py-2 rounded-xl border border-accent/10 hover:bg-accent/10 transition-all flex items-center gap-2">
                                        <Plus size={14} />
                                        Add Team
                                    </button>
                                    <button onClick={() => handleDeleteClub(club)} className="p-2 text-red-500/80 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {clubTeams.map((team, idx) => {
                                    const compConfig = competitions.find((c: any) => c.id === team.competition || c.type === team.competition);
                                    return (
                                        <motion.div
                                            key={team.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-card/40 backdrop-blur-md border border-card-border p-4 rounded-2xl flex items-center justify-between group shadow-sm hover:border-accent/40 transition-all hover:bg-muted/40"
                                        >
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-muted border border-card-border flex items-center justify-center font-black text-xs text-muted-foreground shrink-0 overflow-hidden shadow-inner">
                                                    {team.logo ? (
                                                        <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="opacity-40">{idx + 1}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <div className="font-bold text-sm truncate text-foreground/90 tracking-tight uppercase">
                                                            {team.robotName || 'Awaiting Profile...'}
                                                        </div>
                                                        {compConfig ? (
                                                            <div className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-lg border ${compConfig.color}`}>
                                                                {compConfig.name}
                                                            </div>
                                                        ) : (
                                                            <div className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-lg border bg-muted/50 text-muted-foreground border-card-border">
                                                                Unassigned
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-2 flex-wrap uppercase italic tracking-wider">
                                                        <span className="truncate">{team.club}</span>
                                                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                                        <span className="truncate">{team.university || 'No Sector Assigned'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 ml-4">
                                                <div className="bg-muted px-4 py-2 rounded-xl font-mono font-bold text-sm text-foreground/60 border border-card-border shadow-inner tracking-[0.2em]">
                                                    {team.code}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    className="p-2 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                                    title="Remove Team Node"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
