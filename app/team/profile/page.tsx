"use client";

import { useEffect, useState, useMemo } from 'react';
import { getSession } from '@/lib/auth';
import { Team, Competition } from '@/lib/teams';
import { fetchTeamsFromSupabase } from '@/lib/supabaseData';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, UserCircle, Shield, Search } from 'lucide-react';
import TeamProfileView from '../components/TeamProfileView';

export default function TeamProfilePage() {
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const router = useRouter();

    const refreshData = async () => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
        const [fetchedTeams, fetchedComps] = await Promise.all([
            fetchTeamsFromSupabase(),
            fetchCompetitionsFromSupabase()
        ]);

        setAllTeams(fetchedTeams);
        setCompetitions(fetchedComps);

        if (!selectedTeamId) {
            setSelectedTeamId(String(currentSession.teamId));
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [router]);

    const getCompetitionName = (compId?: string) => {
        if (!compId) return 'NOT ASSIGNED';
        const comp = competitions.find((c: Competition) => c.id === compId);
        return comp?.name || compId.replace(/_/g, ' ');
    };

    const myTeam = useMemo(() =>
        allTeams.find(t => String(t.id) === String(session?.teamId)),
        [allTeams, session]);

    const clubTeams = useMemo(() => {
        if (!myTeam) return [];
        return allTeams.filter(t => t.club === myTeam.club &&
            (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.robotName?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [allTeams, myTeam, searchQuery]);

    const selectedTeam = useMemo(() =>
        allTeams.find(t => String(t.id) === String(selectedTeamId)),
        [allTeams, selectedTeamId]);

    return (
        <div className="min-h-screen bg-transparent">
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                    {/* Sidebar: Club Teams List */}
                    <div className="w-full lg:w-80 flex flex-col gap-6">
                        <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-5">
                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-20 bg-muted rounded-xl w-full" />
                                    <div className="h-10 bg-muted rounded-xl w-full" />
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-12 bg-muted rounded-xl w-full" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                                            <Shield size={12} className="text-role-primary" />
                                            Club Unit Roster
                                        </h2>
                                        <div className="p-4 bg-role-primary/5 border border-role-primary/20 rounded-xl mb-4">
                                            <p className="text-[10px] font-black text-role-primary uppercase tracking-widest mb-1">Official Club</p>
                                            <p className="text-sm font-black text-foreground uppercase italic">{myTeam?.club || 'UNIT CLUSTER'}</p>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                                            <input
                                                type="text"
                                                placeholder="SEARCH UNITS..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-card-border rounded-xl text-[10px] font-black outline-none focus:ring-1 focus:ring-role-primary/30 transition-all placeholder:opacity-30"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {clubTeams.map(team => (
                                            <button
                                                key={team.id}
                                                onClick={() => setSelectedTeamId(team.id)}
                                                className={`w-full p-3 rounded-xl text-left transition-all border group flex items-center justify-between ${selectedTeamId === team.id
                                                    ? 'bg-role-primary/10 border-role-primary/30 shadow-sm'
                                                    : 'bg-card border-card-border hover:bg-muted/50'}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border transition-colors ${selectedTeamId === team.id ? 'bg-role-primary text-white border-role-primary' : 'bg-muted text-muted-foreground border-card-border'}`}>
                                                        {team.id.slice(-2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`font-black text-[11px] truncate uppercase ${selectedTeamId === team.id ? 'text-role-primary' : 'text-foreground'}`}>{team.robotName || team.name}</div>
                                                        <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate tracking-tight">{getCompetitionName(team.competition)}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={12} className={`transition-transform duration-300 ${selectedTeamId === team.id ? 'translate-x-1 text-role-primary' : 'opacity-20 group-hover:opacity-100'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {!loading && (
                            <div className="p-5 bg-gradient-to-br from-role-primary/10 to-transparent border border-role-primary/20 rounded-2xl">
                                <p className="text-[10px] font-black text-role-primary uppercase tracking-widest mb-2 font-mono">// SECURITY ACCESS</p>
                                <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase italic">You are viewing verified units within your club network. Editing permissions are synchronized with role authority.</p>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Profile View */}
                    <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative">
                        {loading ? (
                            <div className="space-y-8 animate-pulse">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-muted rounded-[2rem]" />
                                    <div className="space-y-4 flex-1">
                                        <div className="h-8 bg-muted rounded-xl w-1/2" />
                                        <div className="h-4 bg-muted rounded-xl w-1/4" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="h-64 bg-muted rounded-[2rem]" />
                                    <div className="h-64 bg-muted rounded-[2rem]" />
                                </div>
                            </div>
                        ) : selectedTeam ? (
                            <TeamProfileView
                                team={selectedTeam}
                                onUpdate={(updated) => {
                                    const newTeams = allTeams.map(t => t.id === updated.id ? updated : t);
                                    setAllTeams(newTeams);
                                }}
                                isAdmin={String(selectedTeam.id) === String(session?.teamId)} // Only own team can edit
                            />
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                                <UserCircle size={48} className="text-muted-foreground" />
                                <div>
                                    <p className="font-black uppercase tracking-widest text-sm mb-1 italic">Unit Selection Required</p>
                                    <p className="text-[10px] font-bold uppercase tracking-tight max-w-[200px]">Choose a tactical unit from the club roster to view specifications.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
