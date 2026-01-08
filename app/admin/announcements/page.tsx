"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Send, Radio, Users, Target } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ANNOUNCEMENT_TYPES = [
    { value: 'info', label: 'Info', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'warning', label: 'Warning', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'success', label: 'Success', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { value: 'urgent', label: 'Urgent', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const VISIBILITY_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'teams', label: 'Teams Only' },
    { value: 'judges', label: 'Judges Only' },
    { value: 'admins', label: 'Admins Only' },
];

const COMPETITIONS = [
    { id: 'all', title: 'Global (All Competitions)' },
    { id: '1', title: 'Junior Line Follower' },
    { id: '2', title: 'Junior All Terrain' },
    { id: '3', title: 'Line Follower' },
    { id: '4', title: 'All Terrain' },
    { id: '5', title: 'Fight (Battle Robots)' },
];

export default function AnnouncementsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        visibleTo: 'all',
        competitionId: 'all',
    });

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/judge');
            return;
        }
        setSession(currentSession);
        setLoading(false);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase.from('announcements').insert({
                title: formData.title,
                message: formData.message,
                type: formData.type,
                visible_to: formData.visibleTo,
                competition_id: formData.competitionId === 'all' ? null : parseInt(formData.competitionId),
            });

            if (error) throw error;

            setFormData({
                title: '',
                message: '',
                type: 'info',
                visibleTo: 'all',
                competitionId: 'all',
            });
        } catch (err) {
            console.error('Failed to publish announcement:', err);
            alert('Failed to publish announcement');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-role-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-6">
            <div className="container mx-auto max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-role-primary to-role-secondary flex items-center justify-center shadow-lg shadow-role-primary/20">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">
                                Announcements
                            </h1>
                            <p className="text-muted-foreground font-medium">Broadcast messages to the entire ecosystem</p>
                        </div>
                    </div>
                </motion.div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4 items-start backdrop-blur-sm"
                >
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                        <Radio size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wide text-blue-500 mb-1">Live Broadcast System</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Announcements are pushed in real-time to all connected users matching your visibility criteria.
                            Users will immediately see a notification banner at the top of their dashboard.
                        </p>
                    </div>
                </motion.div>

                {/* Create Announcement Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                            New Announcement
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Match Schedule Update"
                                        className="w-full px-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground/50 font-bold focus:outline-none focus:border-role-primary/50 focus:bg-muted/30 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ANNOUNCEMENT_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: type.value })}
                                                className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${formData.type === type.value
                                                    ? type.color + ' ring-1 ring-inset ring-current'
                                                    : 'bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                                        Visibility
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <select
                                            value={formData.visibleTo}
                                            onChange={(e) => setFormData({ ...formData, visibleTo: e.target.value })}
                                            className="w-full pl-11 pr-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground font-bold appearance-none focus:outline-none focus:border-role-primary/50 transition-all"
                                            required
                                        >
                                            {VISIBILITY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value} className="text-black">
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                                        Target Competition
                                    </label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <select
                                            value={formData.competitionId}
                                            onChange={(e) => setFormData({ ...formData, competitionId: e.target.value })}
                                            className="w-full pl-11 pr-5 py-3 bg-muted/20 border border-card-border rounded-xl text-foreground font-bold appearance-none focus:outline-none focus:border-role-primary/50 transition-all"
                                            required
                                        >
                                            {COMPETITIONS.map((comp) => (
                                                <option key={comp.id} value={comp.id} className="text-black">
                                                    {comp.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-2 block">
                                Message Body
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter your detailed announcement message here..."
                                rows={6}
                                className="w-full px-5 py-4 bg-muted/20 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:border-role-primary/50 focus:bg-muted/30 transition-all resize-none leading-relaxed"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-card-border/50">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-gradient-to-r from-role-primary to-role-secondary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-role-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm"
                            >
                                <Send size={18} />
                                {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
