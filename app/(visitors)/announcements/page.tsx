"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, Filter } from 'lucide-react';

// Mock data for announcements
const ANNOUNCEMENTS = [
    { title: 'Arena Change', message: 'The qualifiers for Junior Line Follower will now take place in Arena 2.', date: '2 hours ago', tag: 'Junior Line Follower' },
    { title: 'Check-in Reminder', message: 'All teams must check in by 09:00 AM tomorrow at the main desk.', date: '5 hours ago', tag: 'All' },
    { title: 'Lunch Break Schedule', message: 'Lunch will be served from 12:30 PM to 01:30 PM in the cafeteria.', date: '1 day ago', tag: 'All' },
    { title: 'Rule Clarification', message: 'Regarding the obstacle avoidance task: Robots must maintain a distance of at least 5cm.', date: '2 days ago', tag: 'All Terrain' },
    { title: 'Fight Bracket Update', message: 'The brackets for the Battle Robots competition have been updated.', date: '3 days ago', tag: 'Fight' },
];

const FILTERS = ['All', 'Junior Line Follower', 'Line Follower', 'Junior All Terrain', 'All Terrain', 'Fight'];

export default function AnnouncementsPage() {
    const [selectedFilter, setSelectedFilter] = useState('All');

    const filteredAnnouncements = ANNOUNCEMENTS.filter(ann => {
        if (selectedFilter === 'All') return true;
        if (ann.tag === 'All') return true; // Show 'All' tagged announcements everywhere
        return ann.tag === selectedFilter;
    });

    return (
        <div className="min-h-screen container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <div className="inline-flex items-center gap-3 mb-4 bg-accent/10 px-6 py-3 rounded-full border border-accent/20">
                    <Bell className="w-6 h-6 text-accent" />
                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent uppercase tracking-tight">
                        Broadcasts & Updates
                    </h1>
                </div>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Stay up to date with the latest news, schedule changes and notifications.
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
            >
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${selectedFilter === filter
                                ? 'bg-accent text-background shadow-md shadow-accent/20 scale-105'
                                : 'bg-card border border-card-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </motion.div>

            <motion.div
                layout
                className="max-w-3xl mx-auto space-y-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredAnnouncements.length > 0 ? (
                        filteredAnnouncements.map((ann, i) => (
                            <motion.div
                                key={`${ann.title}-${i}`}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="p-6 rounded-2xl bg-card border border-card-border shadow-md shadow-black/[0.02] relative overflow-hidden group hover:shadow-lg hover:shadow-accent/5 transition-all"
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${ann.tag === 'All' ? 'bg-accent' : 'bg-blue-500'}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">{ann.title}</h4>
                                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-card-border">
                                        {ann.date}
                                    </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed mb-4">{ann.message}</p>
                                <div className="flex items-center gap-2">
                                    <Tag size={12} className="text-accent/60" />
                                    <span className={`text-xs font-bold uppercase tracking-wider ${ann.tag === 'All' ? 'text-accent' : 'text-blue-500'}`}>
                                        {ann.tag}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-muted-foreground"
                        >
                            <p>No announcements found for this category.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
