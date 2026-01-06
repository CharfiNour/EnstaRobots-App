"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, LogOut, Camera, Plus, Trash2, Crown, CheckCircle, AlertCircle, ClipboardCheck } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TeamDashboard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileComplete, setProfileComplete] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        club: '',
        university: '',
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

        // Mock check for profile completeness
        // In reality, we would query the 'profiles' or 'teams' table for these fields
        const isComplete = localStorage.getItem(`profile_complete_${currentSession.teamId}`) === 'true';
        setProfileComplete(isComplete);

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
            // In a real app, update Supabase teams/profiles table
            // const { error } = await supabase.from('teams').update({ ... }).eq('id', session.teamId)

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
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-role-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                    {session?.teamName}
                                </h1>
                                <p className="text-muted-foreground">Team Dashboard</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>

                    <div className="p-4 bg-card border border-card-border rounded-lg shadow-md shadow-black/[0.02]">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <User size={16} />
                            Team Code
                        </div>
                        <div className="font-mono text-xl text-role-primary font-bold">
                            {session?.teamCode}
                        </div>
                    </div>
                </motion.div>

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
                            className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-all shrink-0"
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
        </div>
    );
}
