"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Shield, Key, ListOrdered, Users, ChevronDown, UserCircle, Search, ChevronRight } from 'lucide-react';
import { getTeams, Team, saveTeams, addClubSlots } from '@/lib/teams';
import { getSession } from '@/lib/auth';
import TeamProfileView from '@/app/team/components/TeamProfileView';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTab, setActiveTab] = useState<'codes' | 'order' | 'profiles'>('codes');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [newClubName, setNewClubName] = useState('');
    const [showSlotsInput, setShowSlotsInput] = useState(false);
    const [newTeamCount, setNewTeamCount] = useState(1);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const session = getSession();
        if (!session || session.role !== 'admin') {
            // Uncomment to enforce admin
            // router.push('/auth/login');
        }
        const currentTeams = getTeams();
        setTeams(currentTeams);

        if (activeTab === 'order' && selectedCategory === 'all') {
            setSelectedCategory(COMPETITION_CATEGORIES[0].id);
        }
    }, [selectedCategory, activeTab]);

    const handleConfirmSlots = () => {
        if (newTeamCount < 1) return;
        const newTeams = addClubSlots(newClubName, newTeamCount);
        setTeams(newTeams);
        setNewClubName('');
        setShowSlotsInput(false);
        setNewTeamCount(1);
    };

    const filteredTeams = selectedCategory === 'all'
        ? teams
        : teams.filter(t => t.competition === selectedCategory);

    const profilesFilteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.robotName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedTeams = filteredTeams.reduce((acc, team) => {
        const club = team.club || 'Individual / Unassigned';
        if (!acc[club]) acc[club] = [];
        acc[club].push(team);
        return acc;
    }, {} as Record<string, Team[]>);

    const moveTeamAcrossFiltered = (filteredIndex: number, direction: 'up' | 'down') => {
        const currentFiltered = selectedCategory === 'all'
            ? teams
            : teams.filter(t => t.competition === selectedCategory);

        if (direction === 'up' && filteredIndex > 0) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex - 1];
            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);
            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        } else if (direction === 'down' && filteredIndex < currentFiltered.length - 1) {
            const teamToMove = currentFiltered[filteredIndex];
            const targetTeam = currentFiltered[filteredIndex + 1];
            const newTeams = [...teams];
            const originIdx = newTeams.findIndex(t => t.id === teamToMove.id);
            const targetIdx = newTeams.findIndex(t => t.id === targetTeam.id);
            const [moved] = newTeams.splice(originIdx, 1);
            newTeams.splice(targetIdx, 0, moved);
            setTeams(newTeams);
            saveTeams(newTeams);
        }
    };

    const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;

    return (
        <div className="min-h-screen bg-background">
            <div className={`container mx-auto px-4 py-8 ${activeTab === 'profiles' ? 'max-w-7xl' : 'max-w-5xl'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-accent" />
                            Team Management
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your teams' login credentials, order, and full technical specifications.
                        </p>
                    </div>
                </div>

                {/* Top Bar: Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-muted w-fit rounded-xl mb-8">
                    {[
                        { id: 'codes', label: 'Teams Codes', icon: Key },
                        { id: 'order', label: 'Teams Order', icon: ListOrdered },
                        { id: 'profiles', label: 'Profiles', icon: UserCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                if (tab.id === 'order' && selectedCategory === 'all') {
                                    setSelectedCategory(COMPETITION_CATEGORIES[0].id);
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab !== 'profiles' ? (
                    <>
                        {/* Competition Selector */}
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

                        <div className="space-y-3">
                            {activeTab === 'order' ? (
                                filteredTeams.map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`bg-card border p-4 rounded-xl flex items-center gap-4 shadow-sm ${team.isPlaceholder ? 'border-dashed border-card-border/60 opacity-60' : 'border-card-border'}`}
                                    >
                                        <div className="bg-muted p-2 rounded text-muted-foreground font-mono text-xs font-bold w-10 text-center">
                                            #{index + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-muted border border-card-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {team.isPlaceholder ? (
                                                <div className="text-muted-foreground font-black text-[10px]">EMPTY</div>
                                            ) : (
                                                <img src={team.logo} alt={team.robotName} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-foreground truncate">{team.robotName || team.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{team.club} • {team.university}</div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moveTeamAcrossFiltered(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20"><ArrowUp size={16} /></button>
                                            <button onClick={() => moveTeamAcrossFiltered(index, 'down')} disabled={index === filteredTeams.length - 1} className="p-1.5 hover:bg-muted rounded text-foreground disabled:opacity-20"><ArrowDown size={16} /></button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                Object.entries(groupedTeams).map(([club, clubTeams]) => (
                                    <div key={club} className="space-y-4 pt-6 first:pt-0">
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className="text-accent" />
                                            <h2 className="font-extrabold text-xl tracking-tight text-foreground uppercase italic">{club}</h2>
                                            <div className="h-px bg-card-border flex-1" />
                                            <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-extrabold text-muted-foreground uppercase">{clubTeams.length} Slots</div>
                                        </div>
                                        {clubTeams.map((team, idx) => (
                                            <div key={team.id} className="bg-card border border-card-border p-4 rounded-xl flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-muted border border-card-border flex items-center justify-center font-bold text-muted-foreground text-xs uppercase">{team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : `#${idx + 1}`}</div>
                                                    <div>
                                                        <div className="font-bold text-lg">{team.robotName || 'Slot Available'}</div>
                                                        <div className="text-xs text-muted-foreground">{team.id} • {team.university}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/80 border border-card-border px-4 py-2 rounded-xl font-mono font-bold text-foreground">{team.code}</div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    /* Profile Tab: Sidebar Layout */
                    <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
                        {/* Sidebar: Teams List */}
                        <div className="w-full md:w-80 flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search teams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-card-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 max-h-[70vh] pr-2 custom-scrollbar">
                                {profilesFilteredTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeamId(team.id)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border group flex items-center justify-between ${selectedTeamId === team.id
                                            ? 'bg-accent/10 border-accent shadow-lg shadow-accent/5'
                                            : 'bg-card border-card-border hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-black text-xs shrink-0 border border-card-border">
                                                {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-lg" /> : team.id.slice(-2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`font-bold text-sm truncate ${selectedTeamId === team.id ? 'text-foreground' : 'text-muted-foreground'}`}>{team.robotName || team.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50 truncate">{team.club}</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className={`transition-transform duration-300 ${selectedTeamId === team.id ? 'translate-x-1 text-accent' : 'opacity-20 group-hover:opacity-100'}`} />
                                    </button>
                                ))}
                                {profilesFilteredTeams.length === 0 && (
                                    <div className="text-center py-10 opacity-40">
                                        <Users className="mx-auto mb-2" size={24} />
                                        <p className="text-xs font-black uppercase">No teams found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main View: Team Profile */}
                        <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-8 shadow-2xl overflow-y-auto">
                            {selectedTeam ? (
                                <TeamProfileView
                                    team={selectedTeam}
                                    onUpdate={(updated) => {
                                        const newTeams = teams.map(t => t.id === updated.id ? updated : t);
                                        setTeams(newTeams);
                                        saveTeams(newTeams);
                                    }}
                                    isAdmin={true}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                        <UserCircle size={40} />
                                    </div>
                                    <div className="max-w-xs">
                                        <p className="font-extrabold uppercase tracking-widest text-sm mb-1">No Selection</p>
                                        <p className="text-xs font-medium">Select a team from the list on the left to view and edit their full profile specs.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
