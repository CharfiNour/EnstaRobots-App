"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Local imports
import { InfoBox, AnnouncementForm } from './components';
import { publishAnnouncement } from './services/announcementService';
import { AnnouncementFormData } from './types';

export default function AnnouncementsPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState<AnnouncementFormData>({
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
            await publishAnnouncement(formData);

            setFormData({
                title: '',
                message: '',
                type: 'info',
                visibleTo: 'all',
                competitionId: 'all',
            });
            alert('Announcement published successfully');
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

                <InfoBox />

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

                    <AnnouncementForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                    />
                </motion.div>
            </div>
        </div>
    );
}
