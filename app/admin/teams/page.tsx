"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, Reorder } from 'framer-motion';
// Actually framer-motion has Reorder components built-in! I can use those for a nice drag/drop effect if desired, 
// or stick to simple buttons if I am unsure about versions. Let's try simple buttons first to be safe.
import { ArrowUp, ArrowDown, Save, Shield, GripVertical, Key, ListOrdered, ExternalLink, Plus, Users, ChevronDown } from 'lucide-react';
import { getTeams, reorderTeams, Team, saveTeams, generateEmptyTeams, addClubSlots } from '@/lib/teams';
import { getSession } from '@/lib/auth';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'codes' | 'order'>('codes');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [teamCount, setTeamCount] = useState(0);
    const [newClubName, setNewClubName] = useState('');
    const [showSlotsInput, setShowSlotsInput] = useState(false);
    const [newTeamCount, setNewTeamCount] = useState(1);
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            // router.push('/auth/judge');
        }
        setIsAdmin(true);
        const currentTeams = getTeams();
        setTeams(currentTeams);
        setTeamCount(currentTeams.length);

        // Snap to first category only if on 'order' tab and 'all' is selected
        if (activeTab === 'order' && selectedCategory === 'all') {
            setSelectedCategory(COMPETITION_CATEGORIES[0].id);
        }
    }, [selectedCategory, activeTab]);

    const handleAddClub = () => {
        if (!newClubName.trim()) return;
        setShowSlotsInput(true);
    };

    const handleConfirmSlots = () => {
        if (newTeamCount < 1) return;
        const newTeams = addClubSlots(newClubName, newTeamCount);
        setTeams(newTeams);
        setTeamCount(newTeams.length);
        setNewClubName('');
        setShowSlotsInput(false);
        setNewTeamCount(1);
    };

    const filteredTeams = selectedCategory === 'all'
        ? teams
        : teams.filter(t => t.competition === selectedCategory);

    const groupedTeams = filteredTeams.reduce((acc, team) => {
        const club = team.club || 'Individual / Unassigned';
        if (!acc[club]) acc[club] = [];
        acc[club].push(team);
        return acc;
    }, {} as Record<string, Team[]>);

    const moveTeamAcrossFiltered = (filteredIndex: number, direction: 'up' | 'down') => {
        const filteredTeams = selectedCategory === 'all'
            ? teams
            : teams.filter(t => t.competition === selectedCategory);

        if (direction === 'up' && filteredIndex > 0) {
            const teamToMove = filteredTeams[filteredIndex];
            const targetTeam = filteredTeams[filteredIndex - 1];

            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);

            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);

            setTeams(newTeams);
            saveTeams(newTeams);
        } else if (direction === 'down' && filteredIndex < filteredTeams.length - 1) {
            const teamToMove = filteredTeams[filteredIndex];
            const targetTeam = filteredTeams[filteredIndex + 1];

            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);

            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);

            setTeams(newTeams);
            saveTeams(newTeams);
        }
    };





    return (
        <div className="min-h-screen container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <Shield className="w-8 h-8 text-accent" />
                        Team Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your teams' login credentials and display order.
                    </p>
                </div>
            </div>

            {/* Top Bar: Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                <div className="flex gap-2 p-1 bg-muted w-fit rounded-xl">
                    <button
                        onClick={() => setActiveTab('codes')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'codes'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Key size={16} />
                        Teams Codes
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('order');
                            if (selectedCategory === 'all') {
                                setSelectedCategory(COMPETITION_CATEGORIES[0].id);
                            }
                        }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'order'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <ListOrdered size={16} />
                        Teams Order
                    </button>
                </div>
            </div>

            {/* Competition Selector - Moved under tabs */}
            <div className="mb-6">
                <div className="relative group w-fit min-w-[320px]">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 px-2 mb-1.5 block">
                        Competition Filter
                    </label>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-card/50 backdrop-blur-md border border-card-border pl-4 pr-12 py-3.5 rounded-2xl text-sm font-bold text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none appearance-none cursor-pointer transition-all hover:bg-card hover:shadow-lg hover:shadow-accent/5 w-full"
                        >
                            {activeTab === 'codes' && (
                                <option value="all">🏆 All Competitions</option>
                            )}
                            {COMPETITION_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-accent transition-colors" />
                    </div>
                </div>
            </div>



            <div className="max-w-4xl space-y-3">
                {activeTab === 'order' ? (
                    // Teams Order View
                    filteredTeams.map((team, index) => (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`bg-card border p-4 rounded-xl flex items-center gap-4 shadow-sm ${team.isPlaceholder ? 'border-dashed border-card-border/60 opacity-60' : 'border-card-border'}`}
                        >
                            <div className="bg-muted p-2 rounded text-muted-foreground">
                                <span className="font-mono text-xs font-bold w-6 block text-center">{index + 1}</span>
                            </div>

                            <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {team.isPlaceholder ? (
                                    <div className="text-muted-foreground font-black text-[10px]">EMPTY</div>
                                ) : (
                                    <img src={team.logo} alt={team.robotName || team.name} className="w-full h-full object-cover" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`font-bold truncate ${team.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                    {team.isPlaceholder ? 'Slot available' : (team.robotName || team.name)}
                                </div>
                                <div className="flex items-center gap-2 truncate">
                                    <div className="text-xs text-muted-foreground">
                                        {team.isPlaceholder ? (
                                            'No robot registered'
                                        ) : (
                                            `${team.club} • ${team.university}`
                                        )}
                                    </div>
                                    {team.competition && (
                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${COMPETITION_CATEGORIES.find(c => c.id === team.competition)?.color || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {COMPETITION_CATEGORIES.find(c => c.id === team.competition)?.name || team.competition}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveTeamAcrossFiltered(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20 transition-colors"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button
                                    onClick={() => moveTeamAcrossFiltered(index, 'down')}
                                    disabled={index === filteredTeams.length - 1}
                                    className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20 transition-colors"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    // Teams Codes View grouped by Club
                    Object.entries(groupedTeams).map(([club, clubTeams]) => (
                        <div key={club} className="space-y-4 pt-6 first:pt-0">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                    <Users size={16} />
                                </div>
                                <h2 className="font-extrabold text-xl tracking-tight text-foreground uppercase italic">{club}</h2>
                                <div className="h-[1px] bg-card-border flex-1" />
                                <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-extrabold text-muted-foreground uppercase opacity-60">
                                    {clubTeams.length} {clubTeams.length === 1 ? 'Slot' : 'Slots'}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {clubTeams.map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`bg-card border p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm ${team.isPlaceholder ? 'border-dashed border-card-border/60 opacity-60' : 'border-card-border'}`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {team.isPlaceholder ? (
                                                    <div className="text-muted-foreground font-black text-xs">#{index + 1}</div>
                                                ) : (
                                                    <img src={team.logo} alt={team.robotName || team.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-lg truncate ${team.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                                    {team.isPlaceholder ? 'Slot Available' : (team.robotName || team.name)}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                                                    {team.isPlaceholder ? (
                                                        'Awaiting team login and profile setup'
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold">{team.club}</span>
                                                            <span className="opacity-40">•</span>
                                                            <span>{team.university}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end gap-1">
                                                <label className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground px-1">Access Code</label>
                                                <div className="flex items-center gap-2 bg-muted/80 border border-card-border px-4 py-2 rounded-xl">
                                                    <Key size={14} className={team.isPlaceholder ? 'text-muted-foreground' : 'text-accent'} />
                                                    <span className="font-mono font-bold text-foreground tracking-wider select-all">
                                                        {team.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {filteredTeams.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-card-border rounded-xl text-muted-foreground">
                    No teams found for this category.
                </div>
            )}
        </div>
    );
}
