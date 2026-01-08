"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Check, X, Trash2, ChevronDown
} from 'lucide-react';
import { Team, addClubSlots, deleteTeam, deleteClub } from '@/lib/teams';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

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

    const handleConfirmSlots = () => {
        if (newTeamCount < 1) return;

        const exists = teams.some(t => t.club.toLowerCase() === newClubName.trim().toLowerCase());
        if (exists) {
            setErrorMessage('This club already exists.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const newTeams = addClubSlots(newClubName.trim(), newTeamCount);
        setTeams(newTeams);
        setNewClubName('');
        setShowSlotsInput(false);
        setNewTeamCount(1);
    };

    const handleAddSlotToClub = (clubName: string) => {
        const newTeams = addClubSlots(clubName, 1);
        setTeams(newTeams);
    };

    const handleDeleteTeam = (id: string) => {
        if (confirm('Are you sure you want to remove this slot?')) {
            const updated = deleteTeam(id);
            setTeams(updated);
        }
    };

    const handleDeleteClub = (clubName: string) => {
        if (confirm(`Are you sure you want to delete the whole club "${clubName}"?`)) {
            const updated = deleteClub(clubName);
            setTeams(updated);
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
                            className="w-full pl-4 pr-10 py-2.5 bg-muted/50 border border-card-border rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer text-foreground"
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
                        <div className="absolute top-6 right-6 z-20">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 items-end bg-card p-2 border border-card-border rounded-2xl shadow-xl"
                            >
                                <div>
                                    <input
                                        type="text"
                                        value={newClubName}
                                        onChange={(e) => setNewClubName(e.target.value)}
                                        placeholder="CLUB NAME"
                                        className="px-4 py-2 bg-muted/50 border border-card-border rounded-xl text-xs font-bold outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        value={newTeamCount}
                                        onChange={(e) => setNewTeamCount(parseInt(e.target.value))}
                                        className="w-16 px-4 py-2 bg-muted/50 border border-card-border rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleConfirmSlots} className="p-2 bg-accent text-white rounded-lg"><Check size={16} /></button>
                                    <button onClick={() => setShowSlotsInput(false)} className="p-2 bg-muted rounded-lg"><X size={16} /></button>
                                </div>
                                {errorMessage && <div className="absolute top-full right-0 text-[10px] text-red-500 font-bold mt-2">{errorMessage}</div>}
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(groupedTeams)
                    .filter(([club]) => selectedClub === 'all' || club === selectedClub)
                    .map(([club, clubTeams]) => (
                        <div key={club} className="space-y-4">
                            <div className="flex items-center gap-3 py-2">
                                <h3 className="font-bold text-lg tracking-tight uppercase italic">{club}</h3>
                                <div className="h-px bg-card-border flex-1" />
                                <button onClick={() => handleAddSlotToClub(club)} className="text-[10px] font-bold uppercase text-accent bg-accent/10 px-3.5 py-2 rounded-lg hover:bg-accent/20 transition-all flex items-center gap-1.5">Add Slot</button>
                                <button onClick={() => handleDeleteClub(club)} className="text-[10px] font-bold uppercase text-red-500 bg-red-500/10 px-3.5 py-2 rounded-lg hover:bg-red-500/20 flex items-center justify-center"><Trash2 size={14} /></button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {clubTeams.map((team, idx) => {
                                    const compConfig = COMPETITION_CATEGORIES.find(c => c.id === team.competition);
                                    return (
                                        <div key={team.id} className="bg-card border border-card-border p-4 rounded-xl flex items-center justify-between group shadow-sm hover:border-accent/40 transition-all hover:bg-muted/30">
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-muted border border-card-border flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 overflow-hidden">
                                                    {team.logo ? (
                                                        <img src={team.logo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <div className="font-bold text-sm truncate text-foreground">
                                                            {team.robotName || 'Waiting for Profile...'}
                                                        </div>
                                                        {compConfig && (
                                                            <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${compConfig.color}`}>
                                                                {compConfig.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                                        <span className="truncate uppercase tracking-wide text-foreground/80">{team.club}</span>
                                                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                                        <span className="truncate opacity-70">{team.university || 'No University Assigned'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <div className="bg-muted px-4 py-2 rounded-lg font-mono font-bold text-sm text-foreground border border-card-border shadow-inner tracking-wider">
                                                    {team.code}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    className="p-2 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Remove Team Node"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
