"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    timestamp: Date;
}

export default function NotificationBanner() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const session = getSession();
        if (!session) return;

        const role = session.role;

        // Subscribe to announcements
        const announcementsChannel = supabase
            .channel('announcements')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'announcements',
                    filter: `visible_to=in.(all,${role}s)`,
                },
                (payload) => {
                    const announcement = payload.new;
                    const notification: Notification = {
                        id: announcement.id,
                        title: announcement.title,
                        message: announcement.message,
                        type: announcement.type,
                        timestamp: new Date(announcement.created_at),
                    };
                    setNotifications((prev) => [notification, ...prev]);
                }
            )
            .subscribe();

        // Subscribe to match status changes for this team
        const matchesChannel = supabase
            .channel('matches')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `team1_id=eq.${session.teamId},team2_id=eq.${session.teamId}`,
                },
                (payload) => {
                    const match = payload.new;
                    if (match.status === 'live') {
                        const notification: Notification = {
                            id: `match-${match.id}`,
                            title: 'Match Starting!',
                            message: `Your match in ${match.round} is starting now. Please proceed to ${match.arena}.`,
                            type: 'urgent',
                            timestamp: new Date(),
                        };
                        setNotifications((prev) => [notification, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            announcementsChannel.unsubscribe();
            matchesChannel.unsubscribe();
        };
    }, []);

    const visibleNotifications = notifications.filter((n) => !dismissed.has(n.id));

    const handleDismiss = (id: string) => {
        setDismissed((prev) => new Set(prev).add(id));
    };

    return (
        <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2">
            <AnimatePresence>
                {visibleNotifications.map((notification) => (
                    <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onDismiss={() => handleDismiss(notification.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function NotificationCard({
    notification,
    onDismiss,
}: {
    notification: Notification;
    onDismiss: () => void;
}) {
    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            case 'urgent':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getColors = () => {
        switch (notification.type) {
            case 'success':
                return 'from-green-500/20 to-[var(--color-card)] border-green-500/50 text-green-400';
            case 'warning':
                return 'from-yellow-500/20 to-[var(--color-card)] border-yellow-500/50 text-yellow-400';
            case 'urgent':
                return 'from-red-500/20 to-[var(--color-card)] border-red-500/50 text-red-400';
            default:
                return 'from-blue-500/20 to-[var(--color-card)] border-blue-500/50 text-blue-400';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`p-4 rounded-xl border backdrop-blur-lg bg-gradient-to-br ${getColors()} shadow-md max-w-sm`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-300">{notification.message}</p>
                </div>
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
