"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, Bell, Calendar, ChevronLeft,
    ChevronRight, MapPin, ExternalLink, Shield,
    User, School, Building2, Crown
} from 'lucide-react';
import Link from 'next/link';

// Mock data for the demonstration
const COMPETITIONS = {
    '1': { title: 'Junior Line Follower', color: 'text-blue-400', banner: 'bg-blue-500/10' },
    '2': { title: 'Junior All Terrain', color: 'text-green-400', banner: 'bg-green-500/10' },
    '3': { title: 'Line Follower', color: 'text-purple-400', banner: 'bg-purple-500/10' },
    '4': { title: 'All Terrain', color: 'text-orange-400', banner: 'bg-orange-500/10' },
    '5': { title: 'Fight (Battle Robots)', color: 'text-red-400', banner: 'bg-red-500/10' },
};

const TEAMS = [
    {
        id: '1',
        name: 'RoboKnights',
        club: 'Robotics Club A',
        university: 'Science University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RoboKnights',
        photo: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'Alice Smith', role: 'Leader' },
            { name: 'Bob Johnson', role: 'Engineer' },
            { name: 'Charlie Brown', role: 'Programmer' },
        ]
    },
    {
        id: '2',
        name: 'CyberDragons',
        club: 'Tech Hub',
        university: 'Institute of Technology',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CyberDragons',
        photo: 'https://images.unsplash.com/photo-1581092120527-df75275e7443?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'David Wilson', role: 'Leader' },
            { name: 'Eva Green', role: 'Designer' },
        ]
    },
    {
        id: '3',
        name: 'Steel Panthers',
        club: 'Future Makers',
        university: 'Global University',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SteelPanthers',
        photo: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=800',
        members: [
            { name: 'Frank Castle', role: 'Leader' },
            { name: 'Grace Hopper', role: 'Strategist' },
        ]
    }
];

const ANNOUNCEMENTS = [
    { title: 'Arena Change', message: 'The qualifiers will now take place in Arena 2.', date: '2 hours ago', tag: 'Junior Line Follower' },
    { title: 'Check-in Reminder', message: 'All teams must check in by 09:00 AM tomorrow.', date: '5 hours ago', tag: 'All' },
];

const MATCHES = [
    {
        phase: 'Phase 1: Qualifiers', matches: [
            { id: 1, teamA: 'RoboKnights', teamB: 'CyberDragons', scoreA: 25, scoreB: 20, status: 'Completed' },
            { id: 2, teamA: 'Steel Panthers', teamB: 'Alpha Bots', scoreA: null, scoreB: null, status: 'Upcoming' },
        ]
    },
];

export default function CompetitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('teams');
    const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);

    const compId = params.id as string;
    const competition = COMPETITIONS[compId as keyof typeof COMPETITIONS] || { title: 'Competition Details', color: 'text-accent', banner: 'bg-accent/5' };

    return (
        <div className="min-h-screen">
            {/* Header / Shortened Banner */}
            <div className={`relative ${competition.banner} border-b border-card-border py-4 md:py-6 overflow-hidden mb-0`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="container mx-auto px-4 relative">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className={`w-10 h-10 md:w-12 md:h-12 ${competition.color}`} />
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                {competition.title}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-lg">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-accent" />
                                <span>Main Science Arena</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-accent" />
                                <span>{TEAMS.length} Teams Registered</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Tabs - Pill Style (Matches Rankings) */}
                    <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                        {['teams', 'announcements', 'matches'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all uppercase text-sm ${activeTab === tab
                                    ? 'bg-accent text-background shadow-md shadow-accent/25'
                                    : 'bg-muted text-muted-foreground hover:bg-card-foreground/10'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'teams' && (
                        <motion.div
                            key="teams"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid lg:grid-cols-[350px_1fr] gap-8"
                        >
                            {/* Team List Sidebar */}
                            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 no-scrollbar">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" />
                                    Registered Teams
                                </h3>
                                {TEAMS.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeam(team)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${selectedTeam?.id === team.id
                                            ? 'bg-accent/10 border-accent shadow-md shadow-accent/5'
                                            : 'bg-card border-card-border hover:border-accent/30'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-card-border group-hover:scale-110 transition-transform">
                                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-foreground truncate">{team.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{team.university}</div>
                                        </div>
                                        {selectedTeam?.id === team.id && (
                                            <ChevronRight size={18} className="text-accent" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Team Detail Pane */}
                            <div className="space-y-6">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedTeam?.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-xl shadow-black/[0.02]"
                                    >
                                        {/* Profile Header Card */}
                                        <div className="relative h-48 md:h-64 bg-muted">
                                            <img src={selectedTeam?.photo} alt="Team" className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                            <div className="absolute bottom-6 left-6 flex items-end gap-6 text-white w-full pr-12">
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card p-2 border-4 border-accent shadow-2xl overflow-hidden">
                                                    <img src={selectedTeam?.logo} alt="Logo" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 mb-2">
                                                    <h2 className="text-3xl md:text-5xl font-bold mb-2">{selectedTeam?.name}</h2>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm md:text-base opacity-90">
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 size={16} className="text-accent" />
                                                            {selectedTeam?.club}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <School size={16} className="text-accent" />
                                                            {selectedTeam?.university}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile Content */}
                                        <div className="p-8">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Users className="w-5 h-5 text-accent" />
                                                Team Members
                                            </h3>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {selectedTeam?.members.map((member, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-muted/50 border border-card-border flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                                                <User size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground">{member.name}</div>
                                                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                                            </div>
                                                        </div>
                                                        {member.role === 'Leader' && (
                                                            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                                <Crown size={12} />
                                                                Leader
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'announcements' && (
                        <motion.div
                            key="announcements"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl mx-auto space-y-6"
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-card-border pb-4">
                                <Bell className="w-6 h-6 text-accent" />
                                Competition Broadcasts
                            </h3>
                            {ANNOUNCEMENTS.map((ann, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-card border border-card-border shadow-md shadow-black/[0.02] relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${ann.tag === 'All' ? 'bg-accent' : 'bg-role-primary'}`}></div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">{ann.title}</h4>
                                        <span className="text-xs text-muted-foreground">{ann.date}</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed mb-4">{ann.message}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ann.tag === 'All' ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                            {ann.tag}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'matches' && (
                        <motion.div
                            key="matches"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {MATCHES.map((group, groupIdx) => (
                                <div key={groupIdx}>
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-card-border pb-4">
                                        <Calendar className="w-6 h-6 text-accent" />
                                        {group.phase}
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {group.matches.map((match) => (
                                            <div key={match.id} className="p-6 rounded-2xl bg-card border border-card-border shadow-md shadow-black/[0.02]">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${match.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-accent/10 text-accent'
                                                        }`}>
                                                        {match.status}
                                                    </span>
                                                    <ExternalLink size={14} className="text-muted-foreground hover:text-accent cursor-pointer" />
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-center flex-1">
                                                        <div className="w-12 h-12 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center font-bold text-xs">A</div>
                                                        <div className="font-bold text-sm truncate">{match.teamA}</div>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-2xl font-black text-foreground">
                                                            {match.scoreA !== null ? `${match.scoreA} : ${match.scoreB}` : 'VS'}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Score</div>
                                                    </div>

                                                    <div className="text-center flex-1">
                                                        <div className="w-12 h-12 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center font-bold text-xs">B</div>
                                                        <div className="font-bold text-sm truncate">{match.teamB}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
