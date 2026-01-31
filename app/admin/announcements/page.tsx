"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Local imports
import { InfoBox, AnnouncementForm } from './components';
import { publishAnnouncement, fetchRealCompetitions, getAnnouncements, deleteAnnouncement, ANNOUNCEMENT_TYPES } from './services/announcementService';
import { AnnouncementFormData } from './types';
import { Trash2, Clock, Tag, User } from 'lucide-react';

export default function AnnouncementsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState<AnnouncementFormData>({
        title: '',
        message: '',
        type: 'info',
        visibleTo: 'all',
        competitionId: 'all',
    });

    const refreshAnnouncements = async () => {
        try {
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
        }
    };

    useEffect(() => {
        const currentSession = getSession();
        if (!currentSession || currentSession.role !== 'admin') {
            router.push('/auth/judge');
            return;
        }

        const init = async () => {
            const [comps, anns] = await Promise.all([
                fetchRealCompetitions(),
                getAnnouncements()
            ]);
            setCompetitions(comps);
            setAnnouncements(anns);
            setLoading(false);
        };

        init();
        setSession(currentSession);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await publishAnnouncement(formData);

            setFormData({
                title: '',
                message: '',
                type: 'info',
                visibleTo: 'all',
                competitionId: competitions.length > 0 ? competitions[0].id : 'all',
            });
            await refreshAnnouncements();
            alert('Announcement published successfully');
        } catch (err) {
            console.error('Failed to publish announcement:', err);
            alert(`Failed to publish announcement: ${(err as any)?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await deleteAnnouncement(id);
            await refreshAnnouncements();
        } catch (err) {
            alert('Failed to delete announcement');
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
        <div className="min-h-screen py-10 px-6 pb-20">
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
                            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">
                                Announcements
                            </h1>
                            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">Broadcast Hub Alpha</p>
                        </div>
                    </div>
                </motion.div>

                <InfoBox />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card/40 backdrop-blur-xl border border-card-border rounded-3xl p-8 shadow-2xl mb-12"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-widest flex items-center gap-3 italic">
                            <div className="w-1.5 h-6 bg-role-primary rounded-full"></div>
                            New Announcement
                        </h2>
                    </div>

                    <AnnouncementForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        competitions={competitions}
                    />
                </motion.div>

                {/* Submitted Announcements List */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] px-4">Active Broadcasts Archive</h3>

                    <div className="space-y-4">
                        {announcements.map((ann) => {
                            const config = ANNOUNCEMENT_TYPES.find(t => t.value === ann.type) || ANNOUNCEMENT_TYPES[0];
                            const compName = competitions.find(c => c.id === ann.competition_id)?.title || 'Global';

                            return (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card/30 backdrop-blur-sm border border-card-border rounded-2xl p-5 flex items-center justify-between group hover:border-role-primary/30 transition-all shadow-sm"
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl ${config.color.split(' ')[0]} border ${config.color.split(' ')[2]} flex items-center justify-center shrink-0`}>
                                            <Bell size={18} className={config.color.split(' ')[1]} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-black text-sm uppercase italic tracking-tight truncate">{ann.title}</h4>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${config.color.split(' ')[1]} ${config.color.split(' ')[2]}`}>
                                                    {config.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-muted-foreground/40 font-bold text-[9px] uppercase tracking-widest">
                                                    <Clock size={10} />
                                                    {new Date(ann.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground/40 font-bold text-[9px] uppercase tracking-widest">
                                                    <Tag size={10} />
                                                    {compName}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground/40 font-bold text-[9px] uppercase tracking-widest">
                                                    <User size={10} />
                                                    {ann.visible_to || 'All'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(ann.id)}
                                        className="ml-4 p-3 bg-rose-500/5 text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/10"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            );
                        })}

                        {announcements.length === 0 && (
                            <div className="py-12 border border-dashed border-card-border rounded-3xl text-center opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Broadcast Archive Empty</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
