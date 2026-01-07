"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, LogOut, Camera, Plus, Trash2, Crown, CheckCircle, AlertCircle, ClipboardCheck } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { updateTeam, getTeams } from '@/lib/teams';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const COMPETITION_CONFIG: Record<string, { name: string, color: string }> = {
    junior_line_follower: { name: 'Junior Line Follower', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    junior_all_terrain: { name: 'Junior All Terrain', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    line_follower: { name: 'Line Follower', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    all_terrain: { name: 'All Terrain', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    fight: { name: 'Fight', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

export default function TeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        robotName: '',
        club: '',
        university: '',
        competition: '',
        logo: '',
        teamPhoto: '',
        members: [{ name: '', role: 'Member', isLeader: false }]
    });

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'team') {
            router.push('/auth/team');
            return;
        }
        setSession(currentSession);

        // Check global teams list for profile completeness
        const teams = getTeams();
        const team = teams.find(t => t.id === currentSession.teamId);

        if (team) {
            setFormData(prev => ({
                ...prev,
                robotName: team.robotName || team.name || '',
                club: team.club || '',
                university: team.university || '',
                competition: team.competition || '',
                members: team.members.length > 0
                    ? team.members.map(m => ({ ...m, isLeader: !!m.isLeader }))
                    : prev.members
            }));
            setProfileComplete(!team.isPlaceholder);
        }

        setLoading(false);
    }, [router]);

    const addMember = () => {
        setFormData({
            ...formData,
            members: [...formData.members, { name: '', role: 'Member', isLeader: false }]
        });
    };

    const removeMember = (index: number) => {
        const newMembers = formData.members.filter((_, i) => i !== index);
        setFormData({ ...formData, members: newMembers });
    };

    const updateMember = (index: number, field: string, value: any) => {
        const newMembers = formData.members.map((m, i) => {
            if (i === index) {
                if (field === 'isLeader' && value === true) {
                    // Only one leader allowed
                    return { ...m, [field]: value };
                }
                return { ...m, [field]: value };
            }
            if (field === 'isLeader' && value === true) {
                return { ...m, isLeader: false };
            }
            return m;
        });
        setFormData({ ...formData, members: newMembers });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Update global teams list
            updateTeam(session.teamId, {
                robotName: formData.robotName,
                club: formData.club,
                university: formData.university,
                competition: formData.competition,
                members: formData.members,
                name: formData.robotName || `Team ${session.teamId}`, // Use robot name as main name
                isPlaceholder: false
            });

            localStorage.setItem(`profile_complete_${session.teamId}`, 'true');
            setProfileComplete(true);
            setShowForm(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Content */}
                {/* Team Identity Header */}
                {profileComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-black text-foreground tracking-tight">
                                    {formData.robotName}
                                </h1>
                                {formData.competition && (
                                    <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${COMPETITION_CONFIG[formData.competition]?.color || 'bg-role-primary/10 text-role-primary border-role-primary/20'}`}>
                                        {COMPETITION_CONFIG[formData.competition]?.name || formData.competition.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>
                            <p className="text-lg text-muted-foreground font-medium">
                                {formData.club} • {formData.university}
                            </p>
                        </div>
                        <div className="bg-card border border-card-border p-3 px-6 rounded-2xl shadow-sm">
                            <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-1">Team Access Code</label>
                            <div className="font-mono text-xl text-role-primary font-black">
                                {session?.teamCode}
                            </div>
                        </div>
                    </motion.div>
                )}

                {!profileComplete && (
                    <div className="p-4 bg-card border border-card-border rounded-lg shadow-md shadow-black/[0.02] mb-8">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <User size={16} />
                            Team Code
                        </div>
                        <div className="font-mono text-xl text-role-primary font-bold">
                            {session?.teamCode}
                        </div>
                    </div>
                )}

                {/* Profile Status Alert */}
                {!profileComplete && !showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Incomplete Profile</h3>
                                <p className="text-sm text-muted-foreground">Your team info is not yet visible on the public competition page.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-2 bg-yellow-500 text-slate-900 font-bold rounded-lg hover:bg-yellow-400 transition-all shrink-0"
                        >
                            Complete Now
                        </button>
                    </motion.div>
                )}

                {/* Profile Setup Form */}
                {showForm ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-xl mb-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Camera className="text-role-primary" />
                                Build Your Team Profile
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2 italic">Robot Identity</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.robotName}
                                    onChange={(e) => setFormData({ ...formData, robotName: e.target.value })}
                                    placeholder="Enter your Robot's Name (e.g. Atlas-X1)"
                                    className="w-full px-4 py-4 bg-muted/50 border border-card-border rounded-xl text-xl font-black text-foreground focus:ring-2 focus:ring-role-primary outline-none transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Club Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.club}
                                        onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                                        placeholder="e.g., Robotics Ensta Club"
                                        className="w-full px-4 py-3 bg-muted/50 border border-card-border rounded-lg text-foreground focus:ring-2 focus:ring-role-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">University / School</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.university}
                                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                        placeholder="e.g., ENSTA Engineering School"
                                        className="w-full px-4 py-3 bg-muted/50 border border-card-border rounded-lg text-foreground focus:ring-2 focus:ring-role-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Competition Category</label>
                                    <select
                                        required
                                        value={formData.competition}
                                        onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                                        className="w-full px-4 py-3 bg-muted/50 border border-card-border rounded-lg text-foreground focus:ring-2 focus:ring-role-primary outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select your competition</option>
                                        <option value="junior_line_follower">Junior Line Follower</option>
                                        <option value="junior_all_terrain">Junior All Terrain</option>
                                        <option value="line_follower">Line Follower</option>
                                        <option value="all_terrain">All Terrain</option>
                                        <option value="fight">Fight</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-4">Team Members</label>
                                <div className="space-y-3">
                                    {formData.members.map((member, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-xl border border-card-border group">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Member Name"
                                                value={member.name}
                                                onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                className="flex-1 px-3 py-2 bg-card border border-card-border rounded-lg text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Role (e.g., Engineer)"
                                                value={member.role}
                                                onChange={(e) => updateMember(index, 'role', e.target.value)}
                                                className="md:w-40 px-3 py-2 bg-card border border-card-border rounded-lg text-sm"
                                            />
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateMember(index, 'isLeader', !member.isLeader)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${member.isLeader
                                                        ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                        : 'bg-card text-muted-foreground border border-card-border hover:border-yellow-500/30'
                                                        }`}
                                                >
                                                    <Crown size={14} />
                                                    {member.isLeader ? 'Leader' : 'Set Leader'}
                                                </button>
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMember(index)}
                                                        className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addMember}
                                        className="w-full py-3 border-2 border-dashed border-card-border rounded-xl text-muted-foreground hover:text-role-primary hover:border-role-primary/50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                                    >
                                        <Plus size={18} />
                                        Add Member
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-role-primary text-white font-bold rounded-xl shadow-lg shadow-role-primary/20 hover:shadow-role-primary/40 transition-all"
                            >
                                Save Profile & Go Public
                            </button>
                        </form>
                    </motion.div>
                ) : null}

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-4 mb-8"
                >
                    <Link href="/team/matches">
                        <div className="p-6 bg-gradient-to-br from-role-primary/10 to-card border border-role-primary/20 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-md shadow-black/[0.02]">
                            <Calendar className="w-8 h-8 text-role-primary mb-3" />
                            <h3 className="text-xl font-bold text-foreground mb-1">My Matches</h3>
                            <p className="text-muted-foreground text-sm">View schedule and results</p>
                        </div>
                    </Link>

                    <Link href="/team/score-card">
                        <div className="p-6 bg-gradient-to-br from-accent/10 to-card border border-accent/20 rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-md shadow-black/[0.02]">
                            <ClipboardCheck className="w-8 h-8 text-accent mb-3" />
                            <h3 className="text-xl font-bold text-foreground mb-1">Score History</h3>
                            <p className="text-muted-foreground text-sm">View official results and performance</p>
                        </div>
                    </Link>
                </motion.div>

                {/* Info Card / Success */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-muted border border-card-border rounded-xl shadow-md shadow-black/[0.02]"
                >
                    {profileComplete ? (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 flex-shrink-0">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">Profile is Active</h3>
                                <p className="text-sm text-muted-foreground mb-4">Your team profile is now visible to all visitors in the competition center.</p>
                                <button onClick={() => setShowForm(true)} className="text-sm font-bold text-role-primary hover:underline">
                                    Edit Profile Info
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-foreground mb-3">Welcome to EnstaRobots World Cup! 🏆</h3>
                            <ul className="space-y-2 text-muted-foreground text-sm">
                                <li>• Check your upcoming matches in the Matches tab</li>
                                <li>• Arrive 15 minutes before your scheduled match time</li>
                                <li>• Make sure your robot is ready and tested</li>
                                <li>• Good luck and have fun!</li>
                            </ul>
                        </>
                    )}
                </motion.div>
            </div>
        </div >
    );
}
