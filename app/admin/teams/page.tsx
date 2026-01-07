"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, Reorder } from 'framer-motion';
// Actually framer-motion has Reorder components built-in! I can use those for a nice drag/drop effect if desired, 
// or stick to simple buttons if I am unsure about versions. Let's try simple buttons first to be safe.
import { ArrowUp, ArrowDown, Save, Shield, GripVertical, Key, ListOrdered, ExternalLink } from 'lucide-react';
import { getTeams, reorderTeams, Team, saveTeams } from '@/lib/teams';
import { getSession } from '@/lib/auth';

const COMPETITION_CATEGORIES = [
    { id: 'all', name: 'All Teams' },
    { id: 'junior_line_follower', name: 'Junior Line Follower' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain' },
    { id: 'line_follower', name: 'Line Follower' },
    { id: 'all_terrain', name: 'All Terrain' },
    { id: 'fight', name: 'Fight' },
];

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'codes' | 'order'>('codes');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            // router.push('/auth/judge');
        }
        setIsAdmin(true);
        setTeams(getTeams());
    }, []);

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

    const updateTeamCode = (id: string, newCode: string) => {
        const updatedTeams = teams.map(t => t.id === id ? { ...t, code: newCode } : t);
        setTeams(updatedTeams);
        saveTeams(updatedTeams);
    };

    const filteredTeams = selectedCategory === 'all'
        ? teams
        : teams.filter(t => t.competition === selectedCategory);

    return (
        <div className="min-h-screen container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Shield className="w-8 h-8 text-accent" />
                        Team Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your teams' login credentials and display order.
                    </p>
                </div>
            </div>

            {/* Tabs / Chips */}
            <div className="flex gap-2 mb-8 p-1 bg-muted w-fit rounded-xl">
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
                    onClick={() => setActiveTab('order')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'order'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <ListOrdered size={16} />
                    Teams Order
                </button>
            </div>

            {activeTab === 'order' && (
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {COMPETITION_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id
                                    ? 'bg-accent text-background border-transparent'
                                    : 'bg-card border border-card-border text-muted-foreground hover:border-accent/40'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="max-w-4xl space-y-3">
                {activeTab === 'order' ? (
                    // Teams Order View
                    filteredTeams.map((team, index) => (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-card border border-card-border p-4 rounded-xl flex items-center gap-4 shadow-sm"
                        >
                            <div className="bg-muted p-2 rounded text-muted-foreground">
                                <span className="font-mono text-xs font-bold w-6 block text-center">{index + 1}</span>
                            </div>

                            <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0">
                                <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1">
                                <div className="font-bold text-foreground">{team.name}</div>
                                <div className="text-xs text-muted-foreground">{team.university}</div>
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
                    // Teams Codes View
                    teams.map((team) => (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-card-border p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0">
                                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground">{team.name}</div>
                                    <div className="text-xs text-muted-foreground">{team.university}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground pl-1">Login Code</label>
                                    <div className="flex items-center gap-2 min-w-[200px]">
                                        <Key size={14} className="text-accent" />
                                        <input
                                            type="text"
                                            value={team.code || ''}
                                            onChange={(e) => updateTeamCode(team.id, e.target.value)}
                                            placeholder="Enter Team Code"
                                            className="bg-muted/50 border border-card-border px-3 py-1.5 rounded text-sm font-mono text-foreground focus:ring-1 focus:ring-accent outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
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
