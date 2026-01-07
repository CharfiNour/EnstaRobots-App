"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Shield, ClipboardCheck, LogOut, ChevronRight, X } from 'lucide-react';
import { UserRole } from '@/lib/navConfig';
import { logout } from '@/lib/auth';

const SESSION_KEY = 'enstarobots_session';

export default function DevTools() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Only show in development if you prefer, but for now we show it for the user to test
    // if (process.env.NODE_ENV !== 'development') return null;

    const mockLogin = (role: UserRole, data: any) => {
        const session = {
            userId: 'mock-id-' + role,
            role: role,
            ...data,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        // Navigate to the role's base page to ensure the UI updates correctly
        const rolePaths: Record<UserRole, string> = {
            admin: '/admin',
            judge: '/judge',
            team: '/team',
            visitor: '/'
        };

        window.location.href = rolePaths[role] || '/';
    };

    const roles = [
        {
            role: 'visitor' as UserRole,
            label: 'Visitor',
            icon: User,
            color: 'text-gray-400',
            action: () => {
                logout();
            }
        },
        {
            role: 'team' as UserRole,
            label: 'Competitor (Team)',
            icon: Shield,
            color: 'text-blue-400',
            data: { teamName: 'DevTeam Alpha', teamCode: 'TEAM-DEV-01', teamId: '1' },
            action: (data: any) => mockLogin('team', data)
        },
        {
            role: 'judge' as UserRole,
            label: 'Judge',
            icon: ClipboardCheck,
            color: 'text-yellow-400',
            action: () => mockLogin('judge', {})
        },
        {
            role: 'admin' as UserRole,
            label: 'Administrator',
            icon: Settings,
            color: 'text-red-400',
            action: () => mockLogin('admin', {})
        }
    ];

    return (
        <div className="fixed bottom-24 right-4 z-[60] md:bottom-8">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 p-4 bg-card border border-card-border rounded-2xl shadow-2xl w-64 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-foreground">Role Simulator</h3>
                            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {roles.map((item) => (
                                <button
                                    key={item.role}
                                    onClick={() => item.action(item.data)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                        <span className="text-sm font-semibold">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-card-border">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-sm font-bold"
                            >
                                <LogOut size={18} />
                                Clear Session
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg flex items-center justify-center transition-all ${isOpen ? 'bg-accent text-background' : 'bg-card border border-card-border text-foreground hover:border-accent/50'
                    }`}
            >
                {isOpen ? <X size={24} /> : <Settings size={24} className={isOpen ? '' : 'animate-spin-slow'} />}
            </motion.button>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
