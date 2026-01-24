"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronRight, UserCircle, Lock, Unlock } from 'lucide-react';
import { Team, saveTeams } from '@/lib/teams';
import TeamProfileView from '@/app/team/components/TeamProfileView';
import { getCompetitionState, toggleProfilesLock } from '@/lib/competitionState';

const COMPETITION_CATEGORIES = [
    { id: 'junior_line_follower', name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'junior_all_terrain', name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { id: 'line_follower', name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'all_terrain', name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'fight', name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

interface TeamsProfilesTabProps {
    teams: Team[];
    setTeams: (teams: Team[]) => void;
}

export default function TeamsProfilesTab({ teams, setTeams }: TeamsProfilesTabProps) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [profilesLocked, setProfilesLocked] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);

    useEffect(() => {
        const checkStatus = () => {
            setProfilesLocked(getCompetitionState().profilesLocked);
        };
        checkStatus();
        window.addEventListener('competition-state-updated', checkStatus);

        const fetchComps = async () => {
            const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
            const data = await fetchCompetitionsFromSupabase();
            setCompetitions(data);
        };
        fetchComps();

        return () => window.removeEventListener('competition-state-updated', checkStatus);
    }, []);

    const sidebarTeams = teams.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.robotName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());

        // Resolution Logic: Match by UUID or slug
        let matchesCat = selectedCategory === 'all';
        if (!matchesCat) {
            const comp = competitions.find(c => c.id === t.competition || c.type === t.competition);
            const teamCategory = comp ? comp.type : t.competition;
            matchesCat = teamCategory === selectedCategory;
        }

        return matchesSearch && matchesCat;
    });

    const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Sidebar: Filters & Quick List */}
            <div className="w-full lg:w-80 flex flex-col gap-6 animate-in slide-in-from-left duration-500">
                {/* Global Filters Block */}
                <div className="bg-card border border-card-border rounded-2xl p-4 shadow-sm space-y-4">
                    {/* Master Lock Switch */}
                    <div className="pb-4 border-b border-card-border/30">
                        <button
                            onClick={toggleProfilesLock}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${profilesLocked
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {profilesLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {profilesLocked ? 'Profiles Locked' : 'Profiles Unlocked'}
                                </span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${profilesLocked ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                <motion.div
                                    animate={{ x: profilesLocked ? 18 : 2 }}
                                    className="w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm"
                                />
                            </div>
                        </button>
                        <p className="text-[9px] text-muted-foreground mt-2 px-2 font-bold opacity-60 uppercase italic">
                            {profilesLocked ? 'Teams cannot edit specs' : 'Teams have editing authority'}
                        </p>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-black text-muted-foreground/60 px-2 mb-1.5 block tracking-widest">Category</label>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-muted/50 border border-card-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                            >
                                <option value="all">ALL COMPETITIONS</option>
                                {COMPETITION_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                                ))}
                            </select>
                            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground/60 px-2 mb-1.5 block tracking-widest">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="FILTER BY NAME/ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-card-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:opacity-40"
                            />
                        </div>
                    </div>
                </div>

                {/* Team List Sidebar */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[440px] pr-2 custom-scrollbar">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/40 px-2 mb-2 block tracking-widest">Teams ({sidebarTeams.length})</label>
                    {sidebarTeams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => setSelectedTeamId(team.id)}
                            className={`w-full p-3.5 rounded-xl text-left transition-all border group flex items-center justify-between ${selectedTeamId === team.id
                                ? 'bg-accent/10 border-accent shadow-md'
                                : 'bg-card border-card-border hover:bg-muted/50'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center font-bold text-[10px] shrink-0 border border-card-border">
                                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-lg" /> : team.id.slice(-2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className={`font-bold text-xs truncate ${selectedTeamId === team.id ? 'text-foreground' : 'text-muted-foreground'}`}>{team.robotName || team.name}</div>
                                    <div className="text-[9px] font-bold truncate flex items-center gap-1.5">
                                        <span className="uppercase tracking-tighter text-foreground/90">{team.club}</span>
                                        <span className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></span>
                                        <span className="text-muted-foreground opacity-70">{team.university}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={12} className={`transition-transform duration-300 ${selectedTeamId === team.id ? 'translate-x-1 text-accent' : 'opacity-20 group-hover:opacity-100'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-6 lg:p-8 shadow-2xl overflow-y-auto min-h-[600px] relative">
                {selectedTeam ? (
                    <TeamProfileView
                        team={selectedTeam}
                        onUpdate={(updated) => {
                            const newTeams = teams.map(t => (t.id === updated.id || t.id === selectedTeam?.id) ? updated : t);
                            setTeams(newTeams);
                            saveTeams(newTeams);
                            if (selectedTeamId !== updated.id) {
                                setSelectedTeamId(updated.id);
                            }
                        }}
                        isAdmin={true}
                    />
                ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                        <UserCircle size={48} className="text-muted-foreground" />
                        <div>
                            <p className="font-bold uppercase tracking-widest text-sm mb-1">SELECT A TEAM</p>
                            <p className="text-xs font-medium max-w-[200px]">Unlock full profile specs by choosing a team from the sidebar.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
