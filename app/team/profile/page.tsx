"use client";

import { useEffect, useState, useMemo } from 'react';
import { getSession } from '@/lib/auth';
import { Team, Competition, generateClubSlots } from '@/lib/teams';
import { fetchTeamsFromSupabase, upsertTeamToSupabase, deleteTeamFromSupabase } from '@/lib/supabaseData';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, UserCircle, Shield, Plus, Check, X, Settings, CheckCircle, Lock } from 'lucide-react';
import TeamProfileView from '../components/TeamProfileView';
import { updateClubLogoInSupabase } from '@/lib/supabaseData';

export default function TeamProfilePage() {
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddSlots, setShowAddSlots] = useState(false);
    const [newTeamCount, setNewTeamCount] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
    const [profilesLocked, setProfilesLocked] = useState(false);

    const router = useRouter();

    const refreshData = async () => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/jury'); // Redirect to login if not team
            return;
        }
        setSession(currentSession);

        const { fetchCompetitionsFromSupabase } = await import('@/lib/supabaseData');
        const [fetchedTeams, fetchedComps] = await Promise.all([
            fetchTeamsFromSupabase('full', true), // Force refresh
            fetchCompetitionsFromSupabase()
        ]);

        setAllTeams(fetchedTeams);
        setCompetitions(fetchedComps);

        // Check if profiles are locked
        const isLocked = fetchedComps.some((c: any) => c.profiles_locked);
        setProfilesLocked(isLocked);
        setLoading(false);
    };

    const clubName = useMemo(() => {
        return session?.clubName || allTeams.find(t => t.id === session?.teamId)?.club || 'UNIT CLUSTER';
    }, [allTeams, session]);

    const clubTeams = useMemo(() => {
        return allTeams.filter(t => t.club === clubName);
    }, [allTeams, clubName]);

    const selectedTeam = useMemo(() =>
        allTeams.find(t => String(t.id) === String(selectedTeamId)),
        [allTeams, selectedTeamId]);

    useEffect(() => {
        refreshData().then(() => {
            // Auto-select after first load
            const currentSession = getSession();
            if (currentSession) {
                const clubName = currentSession.clubName;
                if (clubName) {
                    const myClubTeams = allTeams.filter(t => t.club === clubName);
                    if (myClubTeams.length > 0 && !selectedTeamId) {
                        setSelectedTeamId(myClubTeams[0].id);
                    }
                }
            }
        });
    }, [router]);

    // Initial select fix
    useEffect(() => {
        if (!selectedTeamId && clubTeams.length > 0) {
            setSelectedTeamId(clubTeams[0].id);
        }
    }, [clubTeams, selectedTeamId]);

    const getCompetitionName = (compId?: string) => {
        if (!compId) return 'NOT ASSIGNED';
        const comp = competitions.find((c: Competition) => c.id === compId);
        return comp?.name || compId.replace(/_/g, ' ');
    };

    const handleAddSlots = async () => {
        if (!clubName || newTeamCount < 1 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newTeams = generateClubSlots(clubName, newTeamCount);
            await Promise.all(newTeams.map(t => upsertTeamToSupabase(t)));

            // Refresh and cleanup
            await refreshData();
            setShowAddSlots(false);
            setNewTeamCount(1);
        } catch (err) {
            alert("Failed to add team slots. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) return;

        try {
            await deleteTeamFromSupabase(teamId);
            await refreshData();

            // If deleted team was selected, clear selection
            if (selectedTeamId === teamId) {
                setSelectedTeamId(clubTeams[0]?.id || null);
            }
        } catch (err) {
            alert("Failed to delete team slot. Please try again.");
        }
    };

    const handleSaveAllChanges = async () => {
        setIsSubmitting(true);
        try {
            const teamsToSave = clubTeams.filter(t => dirtyIds.has(t.id));
            if (teamsToSave.length === 0) {
                setIsEditing(false);
                return;
            }

            // If logo changed for any team, update for whole club
            const logoChangedTeam = teamsToSave.find(t => !!t.logo);
            if (logoChangedTeam) {
                await updateClubLogoInSupabase(clubName, logoChangedTeam.logo);
            }

            await Promise.all(teamsToSave.map(t => upsertTeamToSupabase(t)));

            setDirtyIds(new Set());
            setIsEditing(false);
            await refreshData();
        } catch (err) {
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                    {/* Sidebar: Club Teams List */}
                    <div className="w-full lg:w-80 flex flex-col gap-6 animate-in slide-in-from-left duration-500">
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

                                        {/* Club Badge */}
                                        <div className="p-4 bg-role-primary/5 border border-role-primary/20 rounded-xl mb-4 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Shield size={40} />
                                            </div>
                                            <p className="text-[10px] font-black text-role-primary uppercase tracking-widest mb-1">Official Club</p>
                                            <p className="text-sm font-black text-foreground uppercase italic truncate pr-8">{clubName}</p>
                                        </div>

                                        {/* Add Team Slots Container (Replaces Search) */}
                                        <div className="space-y-3">
                                            {!showAddSlots ? (
                                                <button
                                                    onClick={() => setShowAddSlots(true)}
                                                    className="w-full py-2.5 bg-muted/30 hover:bg-muted/50 border border-card-border border-dashed rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:text-foreground"
                                                >
                                                    <Plus size={14} />
                                                    Add Team Slots
                                                </button>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-3 bg-card border border-card-border rounded-xl shadow-xl space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase">Number of slots</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setNewTeamCount(Math.max(1, newTeamCount - 1))}
                                                                className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs"
                                                            >-</button>
                                                            <span className="text-xs font-black w-4 text-center">{newTeamCount}</span>
                                                            <button
                                                                onClick={() => setNewTeamCount(Math.min(10, newTeamCount + 1))}
                                                                className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            disabled={isSubmitting}
                                                            onClick={handleAddSlots}
                                                            className="flex-1 py-2 bg-role-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isSubmitting ? '...' : <><Check size={14} /> Confirm</>}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowAddSlots(false)}
                                                            className="px-3 py-2 bg-muted text-muted-foreground rounded-lg"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team Roster List */}
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Active Units ({clubTeams.length})</span>
                                        </div>
                                        {clubTeams.map((team, idx) => (
                                            <div
                                                key={team.id}
                                                className={`w-full p-3 rounded-xl transition-all border group flex items-center justify-between ${selectedTeamId === team.id
                                                    ? 'bg-role-primary/10 border-role-primary/30 shadow-sm'
                                                    : 'bg-card border-card-border hover:bg-muted/50'}`}
                                            >
                                                <button
                                                    onClick={() => setSelectedTeamId(team.id)}
                                                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border transition-colors ${selectedTeamId === team.id ? 'bg-role-primary text-white border-role-primary' : 'bg-muted text-muted-foreground border-card-border'}`}>
                                                        {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-lg" /> : (idx + 1)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`font-black text-[11px] truncate uppercase ${selectedTeamId === team.id ? 'text-role-primary' : 'text-foreground'}`}>{team.robotName || team.name}</div>
                                                        <div className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate tracking-tight">{getCompetitionName(team.competition)}</div>
                                                    </div>
                                                    <ChevronRight size={12} className={`transition-transform duration-300 ${selectedTeamId === team.id ? 'translate-x-1 text-role-primary' : 'opacity-20 group-hover:opacity-100'}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTeam(team.id, team.robotName || team.name);
                                                    }}
                                                    className="ml-2 p-1.5 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Team Slot"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {!loading && (
                            <div className="p-5 bg-gradient-to-br from-role-primary/10 to-transparent border border-role-primary/20 rounded-2xl">
                                <p className="text-[10px] font-black text-role-primary uppercase tracking-widest mb-2 font-mono">// CLUB COMMAND</p>
                                <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase italic">You are in Club Administration mode. You can manage all units registered under your tactical cluster.</p>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Profile View */}
                    <div className="flex-1 bg-card/40 backdrop-blur-xl border border-card-border rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                        {/* Header Action Button */}
                        <div className="absolute top-10 right-10 z-20">
                            {profilesLocked ? (
                                <div className="flex items-center gap-3 px-6 py-3 bg-muted/40 border border-card-border rounded-2xl text-muted-foreground">
                                    <Lock size={14} className="opacity-50" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Profiles Locked</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (isEditing) handleSaveAllChanges();
                                        else setIsEditing(true);
                                    }}
                                    disabled={isSubmitting}
                                    className={`min-h-[44px] flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 ${isEditing
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20'
                                        : 'bg-gradient-to-r from-role-primary to-role-secondary text-white shadow-role-primary/20'}`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        isEditing ? <CheckCircle size={14} /> : <Settings size={14} />
                                    )}
                                    {isEditing ? 'Save All Changes' : 'Edit Specs'}
                                </button>
                            )}
                        </div>

                        {/* Background subtle glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-role-primary/5 rounded-full blur-[100px] pointer-events-none" />

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
                                isEditing={isEditing}
                                onUpdate={(updated) => {
                                    const newTeams = allTeams.map(t => t.id === updated.id ? updated : t);
                                    setAllTeams(newTeams);
                                    if (isEditing) {
                                        setDirtyIds(prev => new Set(prev).add(updated.id));
                                    }
                                }}
                                isAdmin={true}
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
